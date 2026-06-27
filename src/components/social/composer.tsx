'use client'

import { memo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ImagePlus, Loader2, Send, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import type { User } from '@/lib/social/types'

interface ComposerProps {
  currentUser: User
  onCreatePost: (user: User, content: string, image?: string) => void
}

const SAMPLE_IMAGES = [
  'https://picsum.photos/seed/post-a/800/600',
  'https://picsum.photos/seed/post-b/800/600',
  'https://picsum.photos/seed/post-c/800/600',
]

function ComposerImpl({ currentUser, onCreatePost }: ComposerProps) {
  const [content, setContent] = useState('')
  const [image, setImage] = useState<string | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)
  const [focused, setFocused] = useState(false)

  const handleSubmit = useCallback(() => {
    const trimmed = content.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    onCreatePost(currentUser, trimmed, image)
    setContent('')
    setImage(undefined)
    setTimeout(() => setSubmitting(false), 300)
  }, [content, submitting, onCreatePost, currentUser, image])

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Cmd/Ctrl + Enter to submit
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])

  const cycleImage = useCallback(() => {
    setImage((prev) => {
      if (!prev) return SAMPLE_IMAGES[0]
      const idx = SAMPLE_IMAGES.indexOf(prev)
      return SAMPLE_IMAGES[(idx + 1) % SAMPLE_IMAGES.length]
    })
  }, [])

  return (
    <Card className="p-4 border-neutral-200/80 dark:border-neutral-800 shadow-sm">
      <div className="flex gap-3">
        <Avatar className="size-10 shrink-0 ring-2 ring-neutral-100 dark:ring-neutral-800">
          <AvatarImage src={currentUser.avatar} alt={currentUser.displayName} />
          <AvatarFallback>{currentUser.displayName[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={onKeyDown}
            placeholder={`What's on your mind, ${currentUser.displayName.split(' ')[0]}?`}
            aria-label="Post content"
            className="min-h-[60px] resize-none border-0 bg-transparent px-0 focus-visible:ring-0 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
          />

          <AnimatePresence>
            {image && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, height: 0 }}
                animate={{ opacity: 1, scale: 1, height: 'auto' }}
                exit={{ opacity: 0, scale: 0.96, height: 0 }}
                className="relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800"
              >
                { }
                <img src={image} alt="" className="w-full max-h-72 object-cover" />
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-md"
                  onClick={() => setImage(undefined)}
                  aria-label="Remove image"
                >
                  <X className="size-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={cycleImage}
                className="gap-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-full"
                aria-label="Add image"
              >
                <ImagePlus className="size-4" />
                <span className="text-xs">Photo</span>
              </Button>
            </div>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!content.trim() || submitting}
              className="gap-2 rounded-full"
              size="sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Post
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

export const Composer = memo(ComposerImpl)

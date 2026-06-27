'use client'

import { memo, useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/lib/social/utils'
import type { Comment, User } from '@/lib/social/types'

interface CommentListProps {
  postId: string
  comments: Comment[]
  currentUser: User
  onAddComment: (postId: string, user: User, content: string) => void
  onToggleExpanded?: () => void
  expanded: boolean
}

function CommentListImpl({
  postId,
  comments,
  currentUser,
  onAddComment,
  expanded,
  onToggleExpanded,
}: CommentListProps) {
  const draftKey = `comment-draft:${postId}`

  // Lazy initial state — load any saved draft once on mount.
  const [draft, setDraft] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    try {
      return localStorage.getItem(`comment-draft:${postId}`) ?? ''
    } catch {
      return ''
    }
  })
  const [submitting, setSubmitting] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  const updateDraft = useCallback((value: string) => {
    setDraft(value)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem(draftKey, value) } catch { /* ignore */ }
    }, 400)
  }, [draftKey])

  const submit = useCallback(() => {
    const trimmed = draft.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    onAddComment(postId, currentUser, trimmed)
    setDraft('')
    try { localStorage.removeItem(draftKey) } catch { /* ignore */ }
    // brief delay so the spinner is visible (feels responsive)
    setTimeout(() => setSubmitting(false), 250)
  }, [draft, submitting, onAddComment, postId, currentUser, draftKey])

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }, [submit])

  const visibleComments = expanded ? comments : comments.slice(-2)

  return (
    <div className="space-y-3">
      {comments.length > 2 && (
        <button
          type="button"
          onClick={onToggleExpanded}
          className="text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
        >
          {expanded ? 'Show less' : `View ${comments.length - 2} earlier comments`}
        </button>
      )}

      <AnimatePresence initial={false}>
        {visibleComments.map((c) => (
          <motion.div
            key={c.id}
            layout
            initial={{ opacity: 0, y: 8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex gap-2.5"
          >
            <Avatar className="size-7">
              <AvatarImage src={c.author.avatar} alt={c.author.displayName} />
              <AvatarFallback>{c.author.displayName[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="rounded-2xl bg-neutral-100 dark:bg-neutral-800 px-3 py-2">
                <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  {c.author.displayName}
                </p>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 break-words">
                  {c.content}
                </p>
              </div>
              <p className="mt-1 ml-3 text-[11px] text-neutral-400">
                {timeAgo(c.createdAt)}
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Composer */}
      <div className="flex items-center gap-2 pt-1">
        <Avatar className="size-7">
          <AvatarImage src={currentUser.avatar} alt={currentUser.displayName} />
          <AvatarFallback>{currentUser.displayName[0]}</AvatarFallback>
        </Avatar>
        <Input
          value={draft}
          onChange={(e) => updateDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Write a comment..."
          aria-label="Add a comment"
          className="h-9 rounded-full bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700"
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={submit}
          disabled={!draft.trim() || submitting}
          aria-label="Send comment"
          className="h-9 w-9 shrink-0 rounded-full hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </div>
    </div>
  )
}

export const CommentList = memo(CommentListImpl)

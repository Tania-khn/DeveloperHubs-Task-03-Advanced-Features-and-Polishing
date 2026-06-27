'use client'

import { memo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Share2, MoreHorizontal } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LikeButton } from './like-button'
import { CommentList } from './comment-list'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/lib/social/utils'
import type { Post, User, Comment } from '@/lib/social/types'

interface PostCardProps {
  post: Post
  currentUser: User
  onToggleLike: (postId: string, user: User) => void
  onAddComment: (postId: string, user: User, content: string) => void
  onNewComment: (c: Comment) => void
}

function PostCardImpl({ post, currentUser, onToggleLike, onAddComment }: PostCardProps) {
  const [commentsExpanded, setCommentsExpanded] = useState(false)
  // Local state mirrors the post.likedBy so we can show optimistic UI without
  // waiting for the server round-trip. The server broadcast will reconcile.
  const [optimisticLiked, setOptimisticLiked] = useState(post.likedBy.includes(currentUser.id))

  // Sync with server updates — if the post changes (e.g. a bot liked it),
  // re-derive whether the current user liked it.
  const serverLiked = post.likedBy.includes(currentUser.id)
  const liked = optimisticLiked ?? serverLiked

  const handleToggleLike = useCallback(() => {
    const next = !liked
    setOptimisticLiked(next)
    onToggleLike(post.id, currentUser)
  }, [liked, onToggleLike, post.id, currentUser])

  const handleAddComment = useCallback((postId: string, user: User, content: string) => {
    onAddComment(postId, user, content)
  }, [onAddComment])

  return (
    <Card
      data-post-id={post.id}
      className={cn(
        'overflow-hidden border-neutral-200/80 dark:border-neutral-800',
        'shadow-sm hover:shadow-md transition-shadow duration-300',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-10 ring-2 ring-neutral-100 dark:ring-neutral-800">
            <AvatarImage src={post.author.avatar} alt={post.author.displayName} />
            <AvatarFallback>{post.author.displayName[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-tight">
              {post.author.displayName}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              @{post.author.username} · {timeAgo(post.createdAt)}
            </p>
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-full text-neutral-400 hover:text-neutral-600"
          aria-label="Post options"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </div>

      {/* Content */}
      {post.content && (
        <p className="px-4 pb-3 text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      )}

      {/* Image */}
      {post.image && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="relative aspect-[4/3] w-full bg-neutral-100 dark:bg-neutral-900"
        >
          { }
          <img
            src={post.image}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => {
              // Hide broken images gracefully
              ;(e.currentTarget.parentElement as HTMLElement).style.display = 'none'
            }}
          />
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between px-2 py-2 border-t border-neutral-100 dark:border-neutral-800/60">
        <LikeButton
          liked={liked}
          likeCount={post.likeCount}
          onToggle={handleToggleLike}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setCommentsExpanded((v) => !v)}
          className="gap-1.5 rounded-full px-2.5 py-1.5 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
          aria-label="Toggle comments"
          aria-expanded={commentsExpanded}
        >
          <MessageCircle className="size-5" />
          <span className="text-sm font-medium tabular-nums">{post.commentCount}</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 rounded-full px-2.5 py-1.5 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
          aria-label="Share post"
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: 'Check out this post', text: post.content }).catch(() => {})
            }
          }}
        >
          <Share2 className="size-5" />
        </Button>
      </div>

      {/* Comments */}
      {commentsExpanded && (
        <div className="px-4 pb-4 pt-1">
          <CommentList
            postId={post.id}
            comments={post.comments}
            currentUser={currentUser}
            onAddComment={handleAddComment}
            onToggleExpanded={() => setCommentsExpanded(true)}
            expanded={commentsExpanded}
          />
        </div>
      )}
    </Card>
  )
}

export const PostCard = memo(PostCardImpl)

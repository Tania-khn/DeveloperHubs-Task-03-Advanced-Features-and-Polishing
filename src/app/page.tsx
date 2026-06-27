'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Sparkles, Zap } from 'lucide-react'

import { FeedHeader } from '@/components/social/feed-header'
import { Composer } from '@/components/social/composer'
import { PostCard } from '@/components/social/post-card'
import { FeedSkeleton } from '@/components/social/feed-skeleton'
import { FeedErrorBoundary } from '@/components/social/feed-error-boundary'

import { useRealtimeFeed } from '@/hooks/social/use-realtime-feed'
import { useBrowserNotifications } from '@/hooks/social/use-browser-notifications'
import { getOrCreateCurrentUser } from '@/lib/social/types'
import type { Post, NotificationItem, Comment, User } from '@/lib/social/types'

// ============================================================
// Main feed page
// ============================================================
export default function HomePage() {
  // SSR-safe hydration: render the skeleton on both server and first client
  // render, then transition to the live app once mounted. This avoids
  // hydration mismatches caused by localStorage / window access.
  const [mounted, setMounted] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    // Mount-only effect: hydrate current user from localStorage.
    // This is the canonical "mounted flag" pattern for SSR-safe localStorage
    // access — the setState calls here are intentional and run exactly once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentUser(getOrCreateCurrentUser())
    setMounted(true)
  }, [])

  const hydrated = mounted && currentUser !== null

  const [posts, setPosts] = useState<Post[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loaded, setLoaded] = useState(false)

  // ---- Realtime callbacks (stable, memoized) ----
  const handleInitialState = useCallback((state: { posts: Post[]; notifications: NotificationItem[] }) => {
    setPosts(state.posts)
    setNotifications(state.notifications)
    setLoaded(true)
  }, [])

  const handlePostCreated = useCallback((post: Post) => {
    setPosts((prev) => [post, ...prev])
  }, [])

  const handlePostUpdated = useCallback((update: {
    id: string
    likeCount?: number
    commentCount?: number
    likedBy?: string[]
  }) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === update.id
          ? {
              ...p,
              likeCount: update.likeCount ?? p.likeCount,
              commentCount: update.commentCount ?? p.commentCount,
              likedBy: update.likedBy ?? p.likedBy,
            }
          : p,
      ),
    )
  }, [])

  const handleCommentAdded = useCallback((comment: Comment) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === comment.postId
          ? {
              ...p,
              comments: [...p.comments, comment],
              commentCount: p.commentCount + 1,
            }
          : p,
      ),
    )
  }, [])

  const handleNotification = useCallback((n: NotificationItem) => {
    setNotifications((prev) => [n, ...prev].slice(0, 50))
  }, [])

  const realtime = useRealtimeFeed({
    user: currentUser,
    onPostCreated: handlePostCreated,
    onPostUpdated: handlePostUpdated,
    onCommentAdded: handleCommentAdded,
    onNotification: handleNotification,
    onInitialState: handleInitialState,
  })

  // ---- Browser notifications (Web push equivalent of expo-notifications) ----
  const browserNotifs = useBrowserNotifications()

  // Show a toast + system notification whenever a new notification arrives
  const lastNotifIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (notifications.length === 0) return
    const latest = notifications[0]
    if (latest.id === lastNotifIdRef.current) return
    lastNotifIdRef.current = latest.id

    // Don't double-fire on initial state load — only fire for items newer
    // than 5 seconds ago.
    if (Date.now() - latest.createdAt < 5000 && hydrated) {
      toast(latest.text, {
        description: `${latest.fromUser.displayName} · just now`,
        duration: 4000,
      })
      browserNotifs.notify('Pulse', latest.text)
    }
  }, [notifications, hydrated, browserNotifs])

  // ---- Actions ----
  const handleToggleLike = useCallback((postId: string, user: User) => {
    realtime.toggleLike(postId, user)
    // Find the post to give feedback about WHOSE post the user liked.
    // (Notifications go to the post author, not the liker — this toast
    // confirms to the user that their action registered.)
    const post = posts.find((p) => p.id === postId)
    if (!post) return
    const isLiking = !post.likedBy.includes(user.id)
    if (post.author.id === user.id) {
      // Liking own post — no notification fires (correct behavior).
      toast(isLiking ? 'Liked your post' : 'Unliked your post', {
        description: isLiking ? 'No notification is sent for self-likes.' : undefined,
        duration: 2200,
      })
    } else if (isLiking) {
      toast.success(`Liked ${post.author.displayName}'s post`, {
        description: `They'll get a notification 🔔`,
        duration: 2200,
      })
    } else {
      toast(`Unliked ${post.author.displayName}'s post`, { duration: 1800 })
    }
  }, [realtime, posts])

  const handleAddComment = useCallback((postId: string, user: User, content: string) => {
    realtime.addComment(postId, user, content)
    const post = posts.find((p) => p.id === postId)
    if (!post) return
    if (post.author.id === user.id) {
      toast.success('Comment added', {
        description: 'Visible on your post now.',
        duration: 2000,
      })
    } else {
      toast.success(`Comment added on ${post.author.displayName}'s post`, {
        description: `They'll get a notification 🔔`,
        duration: 2200,
      })
    }
  }, [realtime, posts])

  const handleCreatePost = useCallback((user: User, content: string, image?: string) => {
    realtime.createPost(user, content, image)
    toast.success('Posted!', {
      description: 'Others will see this in their feed. You\'ll get a notification when someone likes or comments on it.',
      duration: 3500,
    })
  }, [realtime])

  const handleOpenNotifications = useCallback(() => {
    // Mark read after a small delay so the user can see the unread state briefly
    setTimeout(() => {
      if (!currentUser) return
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      realtime.markNotificationsRead(currentUser.id)
    }, 600)
  }, [currentUser, realtime])

  const handleMarkAllRead = useCallback(() => {
    if (!currentUser) return
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    realtime.markNotificationsRead(currentUser.id)
  }, [currentUser, realtime])

  const handleRequestPush = useCallback(async () => {
    const result = await browserNotifs.requestPermission()
    if (result === 'granted') {
      toast.success('Push notifications enabled', { duration: 2000 })
      browserNotifs.notify('Pulse', 'You will now be notified when someone likes or comments on your posts!')
    } else if (result === 'denied') {
      toast.error('Push notifications blocked', { duration: 3000 })
    }
  }, [browserNotifs])

  // ---- Memoized post list for performance ----
  // Stable references for each PostCard so memoization works.
  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => b.createdAt - a.createdAt)
  }, [posts])

  // ---- Loading guard ----
  if (!hydrated || !currentUser) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <FeedSkeleton count={3} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col">
      <FeedHeader
        currentUser={currentUser}
        isConnected={realtime.isConnected}
        connectionError={realtime.error}
        notifications={notifications}
        onOpenNotifications={handleOpenNotifications}
        onMarkAllRead={handleMarkAllRead}
        onRequestPushPermission={handleRequestPush}
        pushPermission={browserNotifs.permission}
      />

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 sm:px-6 py-6 space-y-5">
        {/* Realtime status banner (only shown when disconnected) */}
        <AnimatePresence>
          {realtime.error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 px-4 py-2.5 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2"
            >
              <Zap className="size-3.5 shrink-0" />
              Realtime connection lost — reconnecting. Some updates may be delayed.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Composer */}
        <Composer currentUser={currentUser} onCreatePost={handleCreatePost} />

        {/* Live activity hint */}
        <div className="flex items-center gap-2 px-1 text-xs text-neutral-400">
          <Sparkles className="size-3.5" />
          <span>Live feed — likes &amp; comments update in real-time across all viewers.</span>
        </div>

        {/* Feed */}
        <FeedErrorBoundary>
          {!loaded ? (
            <FeedSkeleton count={4} />
          ) : sortedPosts.length === 0 ? (
            <EmptyState />
          ) : (
            <motion.div
              className="space-y-5"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { transition: { staggerChildren: 0.05 } },
                visible: { transition: { staggerChildren: 0.05 } },
              }}
            >
              <AnimatePresence mode="popLayout">
                {sortedPosts.map((post) => (
                  <motion.div
                    key={post.id}
                    layout
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      visible: { opacity: 1, y: 0 },
                      exit: { opacity: 0, scale: 0.97 },
                    }}
                    transition={{ duration: 0.25 }}
                  >
                    <PostCard
                      post={post}
                      currentUser={currentUser}
                      onToggleLike={handleToggleLike}
                      onAddComment={handleAddComment}
                      onNewComment={handleCommentAdded}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </FeedErrorBoundary>
      </main>

      <Footer />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 p-12 text-center">
      <Sparkles className="size-10 mx-auto mb-3 text-neutral-300" />
      <h3 className="text-base font-semibold text-neutral-700 dark:text-neutral-300">No posts yet</h3>
      <p className="mt-1 text-sm text-neutral-500">Be the first to share something!</p>
    </div>
  )
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-neutral-200/60 dark:border-neutral-800/60 py-6 text-center text-xs text-neutral-400">
      <p>Pulse · A realtime social feed demo</p>
      <p className="mt-1">Built with Next.js · Socket.io · Framer Motion · shadcn/ui</p>
    </footer>
  )
}

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import type { Post, NotificationItem, Comment, User } from '@/lib/social/types'

interface ServerPostUpdate {
  id: string
  likeCount?: number
  commentCount?: number
  likedBy?: string[]
}

interface UseRealtimeFeedOptions {
  user: User | null
  onPostCreated: (post: Post) => void
  onPostUpdated: (update: ServerPostUpdate) => void
  onCommentAdded: (comment: Comment) => void
  onNotification: (n: NotificationItem) => void
  onInitialState: (state: { posts: Post[]; notifications: NotificationItem[] }) => void
}

/**
 * useRealtimeFeed
 *
 * Connects to the feed-service socket.io server and subscribes to events.
 * The hook is intentionally framework-agnostic — it does NOT hold the posts
 * in state. Callers pass callbacks so they can integrate updates into their
 * own state management (which lets us memoize components properly).
 */
export function useRealtimeFeed(opts: UseRealtimeFeedOptions) {
  const { user, onPostCreated, onPostUpdated, onCommentAdded, onNotification, onInitialState } = opts
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Keep latest callbacks without re-running the connection effect
  const cbRef = useRef({ onPostCreated, onPostUpdated, onCommentAdded, onNotification, onInitialState })
  useEffect(() => {
    cbRef.current = { onPostCreated, onPostUpdated, onCommentAdded, onNotification, onInitialState }
  })

  useEffect(() => {
    if (!user) return
    // For local development, connect directly to the Socket.io server on port 3003.
    // You can override this with NEXT_PUBLIC_SOCKET_URL in .env.local if needed
    // (e.g. when deploying to a remote server).
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3003'
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1000,
      timeout: 10000,
    })
    socketRef.current = socket

    const onConnect = () => {
      setIsConnected(true)
      setError(null)
      socket.emit('client:identify', user)
    }
    const onDisconnect = () => setIsConnected(false)
    const onConnectError = (err: Error) => {
      setError(err.message || 'Connection failed')
      setIsConnected(false)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onConnectError)
    socket.on('server:initial-state', (state: { posts: Post[]; notifications: NotificationItem[] }) => {
      cbRef.current.onInitialState(state)
    })
    socket.on('server:post-created', (post: Post) => cbRef.current.onPostCreated(post))
    socket.on('server:post-updated', (u: ServerPostUpdate) => cbRef.current.onPostUpdated(u))
    socket.on('server:comment-added', (c: Comment) => cbRef.current.onCommentAdded(c))
    socket.on('server:notification', (n: NotificationItem) => cbRef.current.onNotification(n))

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('connect_error', onConnectError)
      socket.disconnect()
      socketRef.current = null
    }
  }, [user])

  const toggleLike = useCallback((postId: string, u: User) => {
    socketRef.current?.emit('client:toggle-like', { postId, user: u })
  }, [])

  const addComment = useCallback((postId: string, u: User, content: string) => {
    socketRef.current?.emit('client:add-comment', { postId, user: u, content })
  }, [])

  const createPost = useCallback((u: User, content: string, image?: string) => {
    socketRef.current?.emit('client:create-post', { user: u, content, image })
  }, [])

  const markNotificationsRead = useCallback((userId: string) => {
    socketRef.current?.emit('client:mark-notifications-read', { userId })
  }, [])

  return { isConnected, error, toggleLike, addComment, createPost, markNotificationsRead }
}

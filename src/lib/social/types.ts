// Shared types matching the feed-service backend

export interface User {
  id: string
  username: string
  displayName: string
  avatar: string
}

export interface Comment {
  id: string
  postId: string
  author: User
  content: string
  createdAt: number
}

export interface Post {
  id: string
  author: User
  content: string
  image?: string
  createdAt: number
  likeCount: number
  commentCount: number
  likedBy: string[]
  comments: Comment[]
}

export interface NotificationItem {
  id: string
  type: 'like' | 'comment' | 'follow'
  toUserId: string
  fromUser: User
  postId?: string
  text: string
  createdAt: number
  read: boolean
}

export const CURRENT_USER_KEY = 'social_current_user'

const SEED_PROFILES: User[] = [
  { id: 'me-1', username: 'you', displayName: 'You', avatar: 'https://i.pravatar.cc/150?img=8' },
  { id: 'u1', username: 'alex', displayName: 'Alex Rivera', avatar: 'https://i.pravatar.cc/150?img=12' },
  { id: 'u2', username: 'maya', displayName: 'Maya Chen', avatar: 'https://i.pravatar.cc/150?img=47' },
]

export function getOrCreateCurrentUser(): User {
  if (typeof window === 'undefined') return SEED_PROFILES[0]
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  const u = SEED_PROFILES[Math.floor(Math.random() * SEED_PROFILES.length)]
  try {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(u))
  } catch { /* ignore */ }
  return u
}

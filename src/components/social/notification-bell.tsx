'use client'

import { memo, useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Heart, MessageCircle, UserPlus, Check, Info } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/lib/social/utils'
import type { NotificationItem } from '@/lib/social/types'

interface NotificationBellProps {
  notifications: NotificationItem[]
  onOpen: () => void
  onMarkAllRead: () => void
}

function NotificationBellImpl({ notifications, onOpen, onMarkAllRead }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const unread = notifications.filter((n) => !n.read).length

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const toggle = useCallback(() => {
    setOpen((v) => {
      const next = !v
      if (next) onOpen()
      return next
    })
  }, [onOpen])

  return (
    <div className="relative" ref={popoverRef}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={toggle}
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
        className="relative h-10 w-10 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        <Bell className="size-5 text-neutral-700 dark:text-neutral-300" />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key={unread}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-background"
            >
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-1rem)] rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl overflow-hidden z-50"
          >
            <div className="flex items-center justify-between p-3 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-sm font-semibold">Notifications</h3>
              {notifications.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onMarkAllRead}
                  className="h-7 px-2 text-xs gap-1"
                >
                  <Check className="size-3" />
                  Mark all read
                </Button>
              )}
            </div>
            <div className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800/40 border-b border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400 flex items-start gap-1.5">
              <Info className="size-3 shrink-0 mt-0.5" />
              <span>You'll see notifications here when <strong className="text-neutral-700 dark:text-neutral-300">others like or comment on YOUR posts</strong>. Your likes/comments notify the post author, not you.</span>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-neutral-500">
                  <Bell className="size-8 mx-auto mb-2 text-neutral-300" />
                  No notifications yet.
                  <br />
                  Create a post — when others interact with it, you'll see it here.
                </div>
              ) : (
                <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {notifications.map((n) => (
                    <NotificationRow key={n.id} notification={n} />
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const NotificationRow = memo(function NotificationRow({ notification: n }: { notification: NotificationItem }) {
  const Icon = n.type === 'like' ? Heart : n.type === 'comment' ? MessageCircle : UserPlus
  const iconColor =
    n.type === 'like' ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/30' :
    n.type === 'comment' ? 'text-sky-500 bg-sky-50 dark:bg-sky-950/30' :
    'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'

  return (
    <li className={cn('flex items-start gap-3 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors', !n.read && 'bg-rose-50/40 dark:bg-rose-950/10')}>
      <div className="relative">
        <Avatar className="size-9">
          <AvatarImage src={n.fromUser.avatar} alt={n.fromUser.displayName} />
          <AvatarFallback>{n.fromUser.displayName[0]}</AvatarFallback>
        </Avatar>
        <span className={cn('absolute -bottom-1 -right-1 size-5 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-neutral-900', iconColor)}>
          <Icon className="size-3" />
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-snug">
          {n.text}
        </p>
        <p className="text-xs text-neutral-400 mt-0.5">{timeAgo(n.createdAt)}</p>
      </div>
      {!n.read && <span className="mt-1.5 size-2 rounded-full bg-rose-500 shrink-0" aria-label="unread" />}
    </li>
  )
})

export const NotificationBell = memo(NotificationBellImpl)

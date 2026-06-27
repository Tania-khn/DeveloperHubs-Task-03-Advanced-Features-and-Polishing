'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Wifi, WifiOff, Bell, Sparkles } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { NotificationBell } from './notification-bell'
import type { User, NotificationItem } from '@/lib/social/types'

interface FeedHeaderProps {
  currentUser: User
  isConnected: boolean
  connectionError: string | null
  notifications: NotificationItem[]
  onOpenNotifications: () => void
  onMarkAllRead: () => void
  onRequestPushPermission: () => void
  pushPermission: string
}

function FeedHeaderImpl({
  currentUser,
  isConnected,
  connectionError,
  notifications,
  onOpenNotifications,
  onMarkAllRead,
  onRequestPushPermission,
  pushPermission,
}: FeedHeaderProps) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-neutral-950/80 border-b border-neutral-200/60 dark:border-neutral-800/60">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <motion.div
            initial={{ rotate: -10, scale: 0.9 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="size-8 rounded-lg bg-gradient-to-br from-rose-500 to-orange-400 flex items-center justify-center text-white shadow-sm"
          >
            <Sparkles className="size-4" />
          </motion.div>
          <span className="font-bold text-lg tracking-tight hidden sm:inline">Pulse</span>
        </div>

        {/* Right side: connection + notifications + avatar */}
        <div className="flex items-center gap-1.5">
          <ConnectionIndicator isConnected={isConnected} error={connectionError} />
          {pushPermission === 'default' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRequestPushPermission}
              className="hidden md:inline-flex h-9 gap-1.5 text-xs text-neutral-500 hover:text-neutral-700"
              aria-label="Enable push notifications"
            >
              <Bell className="size-4" />
              Enable push
            </Button>
          )}
          <NotificationBell
            notifications={notifications}
            onOpen={onOpenNotifications}
            onMarkAllRead={onMarkAllRead}
          />
          <Avatar className="size-9 ml-1 ring-2 ring-neutral-100 dark:ring-neutral-800">
            <AvatarImage src={currentUser.avatar} alt={currentUser.displayName} />
            <AvatarFallback>{currentUser.displayName[0]}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}

const ConnectionIndicator = memo(function ConnectionIndicator({
  isConnected,
  error,
}: {
  isConnected: boolean
  error: string | null
}) {
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
      title={error || (isConnected ? 'Realtime connected' : 'Disconnected')}
      aria-label={isConnected ? 'Realtime connected' : 'Realtime disconnected'}
    >
      <motion.span
        animate={{ scale: isConnected ? [1, 1.2, 1] : 1 }}
        transition={{ duration: 1.5, repeat: isConnected ? Infinity : 0 }}
        className={cn(
          'size-2 rounded-full',
          isConnected ? 'bg-emerald-500' : 'bg-neutral-400',
        )}
      />
      {isConnected ? (
        <Wifi className="size-3.5 text-emerald-500 hidden sm:block" />
      ) : (
        <WifiOff className="size-3.5 text-neutral-400 hidden sm:block" />
      )}
    </div>
  )
})

export const FeedHeader = memo(FeedHeaderImpl)

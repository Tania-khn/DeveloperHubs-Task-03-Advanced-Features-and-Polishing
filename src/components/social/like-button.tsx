'use client'

import { memo, useCallback, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCount } from '@/lib/social/utils'

interface LikeButtonProps {
  liked: boolean
  likeCount: number
  onToggle: () => void
  disabled?: boolean
}

/**
 * LikeButton — animated heart with floating particle burst on like.
 *
 * Uses framer-motion (the web equivalent of react-native-reanimated)
 * for the spring + AnimatePresence for the burst particles.
 * Respects prefers-reduced-motion for accessibility.
 */
function LikeButtonImpl({ liked, likeCount, onToggle, disabled }: LikeButtonProps) {
  const [burstId, setBurstId] = useState(0)
  const prefersReduced = useReducedMotion()
  const lastClickRef = useRef(0)

  const handleClick = useCallback(() => {
    if (disabled) return
    // Throttle: ignore double-clicks within 300ms to prevent spammy re-renders
    const now = Date.now()
    if (now - lastClickRef.current < 300) return
    lastClickRef.current = now

    if (!liked) setBurstId((n) => n + 1)
    onToggle()
  }, [disabled, liked, onToggle])

  const heartVariants = prefersReduced
    ? { initial: {}, animate: {}, tap: {} }
    : {
        initial: { scale: 1 },
        animate: {
          scale: liked ? [1, 1.35, 0.9, 1.1, 1] : 1,
          color: liked ? 'rgb(244 63 94)' : 'rgb(115 115 115)',
          transition: { duration: 0.45, times: [0, 0.3, 0.55, 0.8, 1] },
        },
      }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={liked}
      aria-label={liked ? 'Unlike post' : 'Like post'}
      className={cn(
        'group relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5',
        'transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/30',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <motion.span
        key={liked ? 'liked' : 'unliked'}
        variants={heartVariants}
        initial="initial"
        animate="animate"
        className="inline-flex"
      >
        <Heart
          className={cn(
            'h-5 w-5 transition-colors',
            liked ? 'fill-rose-500 text-rose-500' : 'fill-none text-neutral-500 group-hover:text-rose-500',
          )}
        />
      </motion.span>

      {/* Floating heart burst particles */}
      <AnimatePresence>
        {burstId > 0 && !prefersReduced && (
          <BurstParticles key={burstId} />
        )}
      </AnimatePresence>

      <motion.span
        key={likeCount + (liked ? '-l' : '-u')}
        initial={prefersReduced ? false : { y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25 }}
        className={cn(
          'text-sm font-medium tabular-nums',
          liked ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-600 dark:text-neutral-400',
        )}
      >
        {formatCount(likeCount)}
      </motion.span>
    </button>
  )
}

function BurstParticles() {
  const particles = Array.from({ length: 6 })
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}
    >
      {particles.map((_, i) => {
        const angle = (i / particles.length) * Math.PI * 2 - Math.PI / 2
        const distance = 28
        const x = Math.cos(angle) * distance
        const y = Math.sin(angle) * distance
        return (
          <motion.span
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full bg-rose-400"
            initial={{ x: 0, y: 0, scale: 0 }}
            animate={{ x, y, scale: [0, 1, 0.6], opacity: [1, 1, 0] }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        )
      })}
    </motion.div>
  )
}

export const LikeButton = memo(LikeButtonImpl)

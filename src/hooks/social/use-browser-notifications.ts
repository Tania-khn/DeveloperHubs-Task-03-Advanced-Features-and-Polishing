'use client'

import { useEffect, useState, useCallback } from 'react'

type Permission = 'default' | 'granted' | 'denied' | 'unsupported'

/**
 * useBrowserNotifications
 *
 * Web equivalent of `expo-notifications` — uses the browser's
 * `Notification` API to fire system-level notifications even when the
 * tab is in the background. Falls back gracefully if the user denies
 * permission or the browser doesn't support it.
 */
export function useBrowserNotifications() {
  // Lazy initial state — runs once on the client; on SSR 'window' is undefined
  // so we start with 'default' and let the mount effect reconcile.
  const [permission, setPermission] = useState<Permission>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
    return Notification.permission as Permission
  })

  useEffect(() => {
    // Listen for cross-tab permission changes (e.g. user revokes permission
    // in another tab while this one is open).
    if (typeof window === 'undefined' || !('Notification' in window)) return
    const onFocus = () => {
      const current = Notification.permission as Permission
      setPermission((prev) => (prev !== current ? current : prev))
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported' as Permission
    try {
      const result = await Notification.requestPermission()
      setPermission(result as Permission)
      return result as Permission
    } catch {
      return 'denied' as Permission
    }
  }, [])

  const notify = useCallback((title: string, body?: string) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    try {
      const n = new Notification(title, {
        body,
        icon: '/logo.svg',
        badge: '/logo.svg',
        tag: 'social-update',
      })
      // Auto-close after 5 seconds
      setTimeout(() => n.close(), 5000)
    } catch {
      // ignore — some browsers throw if the icon fails to load
    }
  }, [])

  return { permission, requestPermission, notify }
}

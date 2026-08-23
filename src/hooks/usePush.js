import { useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

// Web Push subscription management. Independent — only needs `user`.
export function usePush({ user }) {
  const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? ''

  const subscribePush = useCallback(async () => {
    if (!user?.id || !VAPID_PUBLIC) return false
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
    try {
      const reg = await navigator.serviceWorker.ready
      let sub   = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly:      true,
          applicationServerKey: VAPID_PUBLIC,
        })
      }
      const j = sub.toJSON()
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id:  user.id,
        endpoint: j.endpoint,
        p256dh:   j.keys.p256dh,
        auth_key: j.keys.auth,
      }, { onConflict: 'user_id,endpoint' })
      return !error
    } catch (e) { console.error('subscribePush:', e); return false }
  }, [user, VAPID_PUBLIC])

  const unsubscribePush = useCallback(async () => {
    if (!user?.id || !('serviceWorker' in navigator)) return
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
        await supabase.from('push_subscriptions').delete()
          .eq('user_id', user.id).eq('endpoint', sub.endpoint)
      }
    } catch (e) { console.error('unsubscribePush:', e) }
  }, [user])

  return { subscribePush, unsubscribePush }
}

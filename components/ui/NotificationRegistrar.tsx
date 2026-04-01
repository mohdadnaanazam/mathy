'use client'

/**
 * NotificationRegistrar
 *
 * Registers the service worker, requests notification permission,
 * and sends the push subscription to the backend so it can send
 * daily 8 PM IST notifications via web-push.
 *
 * Renders nothing — purely side-effect component.
 */

import { useEffect } from 'react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_URL_LOCAL ||
  'http://localhost:4000'
const STORAGE_KEY = 'mathy_push_subscribed'

/**
 * Convert a base64 VAPID key to a Uint8Array for the subscribe call.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function NotificationRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    if (!VAPID_PUBLIC_KEY) {
      console.warn('[NotificationRegistrar] VAPID public key not set.')
      return
    }

    async function setup() {
      // Register service worker
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      // Check if already subscribed
      const existing = await reg.pushManager.getSubscription()
      if (existing) {
        // Already subscribed — make sure backend knows
        if (!localStorage.getItem(STORAGE_KEY)) {
          await sendToBackend(existing)
        }
        return
      }

      // Request permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return

      // Subscribe to push
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      // Send subscription to backend
      await sendToBackend(subscription)
    }

    setup().catch((err) => {
      console.warn('[NotificationRegistrar] Setup failed:', err)
    })
  }, [])

  return null
}

async function sendToBackend(subscription: PushSubscription) {
  try {
    const res = await fetch(`${API_URL}/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    })
    if (res.ok) {
      localStorage.setItem(STORAGE_KEY, 'true')
    }
  } catch {
    // Non-critical — will retry on next visit
  }
}

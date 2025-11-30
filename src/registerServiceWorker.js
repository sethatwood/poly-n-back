/* eslint-disable no-console */

/**
 * Service Worker Registration
 *
 * Note: Vite doesn't automatically generate a service worker like Vue CLI did.
 * To enable PWA functionality with offline support, you'll need to:
 * 1. Install vite-plugin-pwa: npm install vite-plugin-pwa -D
 * 2. Configure it in vite.config.js
 *
 * For now, service worker registration is disabled to prevent 404 errors.
 * The app will still work, just without offline caching.
 */

import { register } from 'register-service-worker'

// Only register service worker if it exists
// This prevents 404 errors when no service worker is generated
if (import.meta.env.PROD) {
  // Check if service worker file exists before trying to register
  fetch('/service-worker.js', { method: 'HEAD' })
    .then(response => {
      if (response.ok) {
        register('/service-worker.js', {
          ready() {
            console.log(
              'App is being served from cache by a service worker.\n' +
              'For more details, visit https://goo.gl/AFskqB'
            )
          },
          registered() {
            console.log('Service worker has been registered.')
          },
          cached() {
            console.log('Content has been cached for offline use.')
          },
          updatefound() {
            console.log('New content is downloading.')
          },
          updated() {
            console.log('New content is available; please refresh.')
          },
          offline() {
            console.log('No internet connection found. App is running in offline mode.')
          },
          error(error) {
            console.error('Error during service worker registration:', error)
          }
        })
      }
    })
    .catch(() => {
      // Service worker file doesn't exist, skip registration silently
    })
}

/**
 * Service Worker Registration
 *
 * DISABLED: Vite doesn't automatically generate a service worker like Vue CLI did.
 *
 * To enable PWA functionality with offline support:
 * 1. Install vite-plugin-pwa: npm install vite-plugin-pwa -D
 * 2. Configure it in vite.config.js:
 *
 *    import { VitePWA } from 'vite-plugin-pwa'
 *
 *    export default defineConfig({
 *      plugins: [
 *        vue(),
 *        VitePWA({
 *          registerType: 'autoUpdate',
 *          manifest: false, // Use existing public/manifest.json
 *        })
 *      ]
 *    })
 *
 * 3. Uncomment the registration code below
 *
 * The app works fine without this - you just won't have offline caching.
 */

// Service worker registration disabled - no service worker is being generated
// Uncomment below when vite-plugin-pwa is configured

/*
import { register } from 'register-service-worker'

if (import.meta.env.PROD) {
  register('/sw.js', {
    ready() {
      console.log('App is being served from cache by a service worker.')
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
*/

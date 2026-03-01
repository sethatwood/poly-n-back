# External Integrations

**Analysis Date:** 2026-02-28

## APIs & External Services

**Third-party services:**
- None detected - Application is fully self-contained with no external API dependencies

**Web resources:**
- Wikipedia N-Back article linked in `src/IntroHead.vue` (informational reference only)
- Assets: All game assets (sounds, images) stored locally in `src/assets/`

## Data Storage

**Databases:**
- None - No backend database
- All data is ephemeral or stored locally

**Browser Storage:**
- localStorage (client-side only)
  - `tutorialCompleted` - Boolean flag for first-time tutorial
  - `isAudioEnabled` - Boolean flag for audio preferences
  - `highScoreData` - Object with `{ score, potentialCorrectAnswers, nBack }`
  - `achievements` - JSON array of unlocked achievement IDs
  - Implementation: `src/store/gameStore.js` and `src/*.vue` components

**File Storage:**
- Local assets only (no cloud storage integration)
- Static files served from `dist/` via GitHub Pages
- Sound files in `src/assets/`:
  - `stimulus.wav` - Stimulus presentation sound
  - `ting.mp3` - Correct answer sound
  - `whip.mp3` - Incorrect answer sound

**Caching:**
- Browser cache for static assets
- Service Worker: Disabled by default (see `src/registerServiceWorker.js`)
  - PWA plugin configured but not active
  - App works without offline support currently
  - Can be enabled by installing `vite-plugin-pwa`

## Authentication & Identity

**Auth Provider:**
- None - No authentication system
- App is completely public with no user accounts
- No login/signup functionality

## Monitoring & Observability

**Error Tracking:**
- Console logging only (basic error handling)
- No error tracking service (Sentry, Bugsnag, etc.)
- Sound loading errors logged to console in `src/store/gameStore.js` line 30

**Logs:**
- Development: Console output in browser DevTools
- Production: Browser console only (no centralized logging)

## CI/CD & Deployment

**Hosting:**
- GitHub Pages (static hosting)
- Primary domain: polynback.fun (DNS CNAME to GitHub Pages)
- Secondary: sethatwood.github.io subdomain

**CI Pipeline:**
- GitHub Actions (`.github/workflows/deploy.yml`)
- Trigger: Push to `main` branch (automatic deployment)
- Manual trigger available via Actions tab
- Node 18 environment
- Steps:
  1. Checkout code
  2. Setup Node.js with npm cache
  3. npm install
  4. npm run build (Vite)
  5. Upload dist/ as artifact
  6. Deploy to GitHub Pages

**Build Commands:**
```bash
npm run dev      # Development server with HMR
npm run build    # Production build to dist/
npm run preview  # Preview production build locally
```

**Mobile Deployment:**
- iOS: Built via `capacitor build ios` → Xcode project in `ios/App/`
- Android: Built via `capacitor build android` → Gradle project in `android/`
- No CI/CD configured for mobile builds (manual via Xcode/Android Studio)

## Environment Configuration

**Required env vars:**
- None - Application has no environment variables
- All configuration is hardcoded in source files

**Secrets location:**
- No secrets required
- google-services.json optional for Android push notifications (not currently used)

## Webhooks & Callbacks

**Incoming:**
- None - Application receives no webhooks

**Outgoing:**
- None - Application sends no webhooks or external notifications

## Web APIs Used

**Browser APIs:**
- Web Audio API (native browser)
  - Implemented in `src/store/gameStore.js` lines 6-63
  - Context: `AudioContext` / `webkitAudioContext` (iOS fallback)
  - Loads and plays game sound effects
  - Handles audio unlock on iOS (requires user gesture)

- localStorage API
  - Stores game state, preferences, achievements
  - Used throughout `src/store/gameStore.js` and components

- Fetch API
  - Loads audio files (WAV/MP3) in `src/store/gameStore.js` line 26

- Service Worker API
  - Disabled but available in `src/registerServiceWorker.js`
  - register-service-worker package handles registration

**PWA/Manifest:**
- Web App Manifest (`public/manifest.json`)
  - App name, icons, theme colors
  - Display mode: standalone (full-screen app-like experience)
  - Used by mobile browsers for home screen installation

## Capacitor Native Plugins

**Core Capacitor Features:**
- App lifecycle management (pause, resume, destroy events)
- Platform detection (iOS vs Android)
- Configuration in `capacitor.config.json`:
  - appId: `fun.polynback`
  - webDir: `dist/` (built web app directory)
  - Android/iOS theme color: `#0f1729` (dark blue)
  - iOS minimum: 13.0
  - Android minimum: API 22

**No additional Capacitor plugins in use:**
- No camera, geolocation, file storage plugins
- Pure web app with native wrapper

## Third-Party CDNs

**Google Fonts:**
- Share Tech Mono font referenced in `tailwind.config.js`
- Loaded via `<link>` tag in `index.html` (standard Google Fonts CDN)

**Social/Meta Tags:**
- OpenGraph tags for social sharing (`index.html`)
- Twitter card tags for Twitter sharing
- No external tracking or analytics scripts detected

---

*Integration audit: 2026-02-28*

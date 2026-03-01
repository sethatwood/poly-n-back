# Technology Stack

**Analysis Date:** 2026-02-28

## Languages

**Primary:**
- JavaScript (ES2020+) - All client-side code in `src/`
- Vue.js Single-File Components (.vue) - UI components
- CSS - Styling with Tailwind

**Secondary:**
- JSON - Configuration files
- Java - Android native code in `android/`
- Swift/Objective-C - iOS native code in `ios/`
- Gradle - Android build configuration

## Runtime

**Environment:**
- Node.js 18+ (specified in `.github/workflows/deploy.yml` line 36)
- Browser: Modern browsers with ES2020+ support
- Mobile: iOS 13.0+ and Android API 22+

**Package Manager:**
- npm (npm 8+ recommended based on package-lock.json v3)
- Lockfile: `package-lock.json` present (v3 format)

## Frameworks

**Core:**
- Vue 3 (^3.3.4) - Progressive JavaScript framework
  - Pinia (^2.1.7) - State management store for Vue
  - Location: `src/store/gameStore.js` contains game state

**Web/PWA:**
- Vite (^4.4.5) - Build tool and dev server
- Tailwind CSS (^3.3.5) - Utility-first CSS framework
- PostCSS (^8.4.31) - CSS transformation with Autoprefixer
- Autoprefixer (^10.4.16) - Vendor prefixing for CSS

**Mobile Framework:**
- Capacitor (^5.5.1) - Cross-platform native bridge
  - @capacitor/core - Core runtime
  - @capacitor/cli - Command-line tools
  - @capacitor/ios - iOS native integration
  - @capacitor/android - Android native integration
  - Config: `capacitor.config.json` specifies app ID `fun.polynback`

**PWA/Service Worker:**
- register-service-worker (^1.7.2) - Service worker registration
- @vue/cli-plugin-pwa (~5.0.0) - PWA support (legacy, currently disabled)
- Note: Service worker generation is disabled in current setup (`src/registerServiceWorker.js`)

**Dev Build Tools:**
- @vitejs/plugin-vue (^4.2.3) - Vue support in Vite

## Key Dependencies

**Critical:**
- Vue 3.3.4 - Core framework, handles UI rendering and reactivity
- Capacitor 5.5.1 - Enables iOS/Android native app distribution
- Pinia 2.1.7 - Required for state management across components

**Infrastructure:**
- Vite 4.4.5 - Fast build and dev server (HMR support)
- Tailwind CSS 3.3.5 - Utility CSS classes for responsive design
- PostCSS 8.4.31 - Processes Tailwind and auto-prefixes

## Configuration

**Environment:**
- No .env files detected (not environment-dependent)
- Configuration is hardcoded in `capacitor.config.json` and `vite.config.js`
- Game settings stored in browser localStorage (not server config)

**Build:**
- `vite.config.js` - Main Vite configuration with Vue plugin
- `capacitor.config.json` - Capacitor app configuration (app ID, web directory, native colors)
- `tailwind.config.js` - Tailwind theme customization (custom font: Share Tech Mono)
- `postcss.config.js` - PostCSS pipeline (Tailwind + Autoprefixer)
- `index.html` - Entry point with manifest.json reference
- `android/variables.gradle` - Android version configuration (minSdk: 22, targetSdk: 33)
- `ios/App/Podfile` - iOS CocoaPods dependencies

## Platform Requirements

**Development:**
- Node.js 18+
- npm 8+
- For iOS: Xcode with iOS 13.0+ SDK
- For Android: Android Studio with API 33 target SDK
- CocoaPods 1.6+ for iOS dependency management

**Production:**
- Web: Deployed to GitHub Pages (static hosting)
  - Build output: `dist/` directory
  - CI/CD: GitHub Actions workflow (`.github/workflows/deploy.yml`)
  - Deployed automatically on push to `main` branch
- Mobile: iOS App Store (app ID: fun.polynback) and Google Play Store
  - iOS requires Apple Developer account
  - Android requires Google Play Developer account
  - Built from this source: `capacitor build ios` / `capacitor build android`

**Build Output:**
- Web: Static HTML/CSS/JS in `dist/` directory
- iOS: Generated in `ios/App/` directory
- Android: Generated in `android/` directory with compiled APK/AAB

---

*Stack analysis: 2026-02-28*

# Technology Stack

**Analysis Date:** 2026-04-25

## Languages

**Primary:**
- TypeScript 5.9.3 - Application logic, component logic, stores, utilities
- Vue 3.5.29 - UI components and reactive rendering
- JavaScript - Vite configuration files

**Secondary:**
- Swift - iOS native bridge (Capacitor wrapper in `ios/App/App/`)
- Kotlin/Java - Android native bridge (Capacitor wrapper in `android/`)
- CSS - Styling (Tailwind CSS based in `src/style.css`)

## Runtime

**Environment:**
- Node.js 22.x (specified in `.nvmrc`)
- Capacitor 8.x for native iOS/Android runtime

**Package Manager:**
- npm 10.x
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Vue 3.5.29 - Progressive web framework for UI
- Vite 7.3.1 - Frontend build tool and dev server
- Tailwind CSS 4.2.1 - Utility-first CSS framework (via `@tailwindcss/vite`)
- Capacitor 8.1.0 - Native iOS/Android bridge

**Testing:**
- Vitest 4.0.18 - Unit test runner (config: `vitest.config.ts`)
- Playwright 1.58.2 - E2E testing (config: `playwright.config.ts`)
- @Vue/test-utils 2.4.6 - Vue component testing utilities

**Build/Dev:**
- @vitejs/plugin-vue 6.0.4 - Vue integration for Vite
- ESLint 10.0.2 - Code linting (config: `eslint.config.js`)
- Prettier 3.8.1 - Code formatting (config: `.prettierrc.json`)

## Key Dependencies

**Critical:**
- @capacitor/core 8.1.0 - Capacitor core library providing bridge to native code
- @capacitor/app 8.0.1 - Handles app lifecycle events (app pause/resume)
- @capacitor/preferences 8.0.1 - Native device storage (replaces browser localStorage)
- @capacitor/haptics 8.0.1 - Haptic feedback for correct/incorrect responses
- pinia 3.0.4 - State management (replacement for Vuex)
- happy-dom 20.7.0 - Lightweight DOM implementation for testing

**Infrastructure:**
- @capacitor/ios 8.1.0 - iOS-specific Capacitor runtime
- @capacitor/android 8.1.0 - Android-specific Capacitor runtime
- @capacitor/cli 8.1.0 - CLI for managing native code synchronization
- @sentry/capacitor 3.1.0 - Error tracking for native app
- @sentry/vue 10.40.0 - Error tracking for Vue app
- @vue/tsconfig 0.8.1 - TypeScript configuration preset for Vue
- @vue/eslint-config-typescript 14.7.0 - ESLint TypeScript integration
- eslint-plugin-vue 10.8.0 - Vue linting rules
- eslint-config-prettier 10.1.8 - Prettier integration for ESLint
- globals 17.4.0 - Global variable definitions
- vue-tsc 3.2.5 - TypeScript type checker for Vue components

**Testing Support:**
- @vitest/coverage-v8 4.0.18 - Code coverage reporting (v8 provider)
- @playwright/test 1.58.2 - Playwright test framework
- @pinia/testing 1.0.3 - Testing utilities for Pinia stores

## Configuration

**Environment:**
- Environment variables configured via `.env.production`
- Required env vars:
  - `VITE_SENTRY_DSN` - Sentry error tracking endpoint
  - `VITE_APP_VERSION` - Application version string
- Env types defined in `src/env.d.ts`

**Build:**
- Vite config: `vite.config.js`
- TypeScript config: `tsconfig.json` (extends `@vue/tsconfig/tsconfig.dom.json`)
- Path aliases: `@/*` maps to `./src/*`
- Tailwind CSS: Integrated via Vite plugin

**Development:**
- Prettier formatting on `src/**/*.{js,ts,vue,css,json}`
- ESLint rules in `eslint.config.js` (ignores `dist/`, `ios/`, `android/`, `node_modules/`)
- Vue-specific rules disabled: multi-word components, reserved component names, required prop defaults

## Platform Requirements

**Development:**
- Node.js 22.x
- npm 10.x
- For iOS: Xcode with iOS SDK
- For Android: Android Studio with Android SDK (API 24+)
- macOS recommended for native iOS development

**Production:**
- **iOS:** Deployment to Apple App Store via Xcode/Capacitor
- **Web:** Static hosting (SPA served from `/dist`)
- **Android:** Deployment to Google Play Store via Android Studio/Capacitor

---

*Stack analysis: 2026-04-25*

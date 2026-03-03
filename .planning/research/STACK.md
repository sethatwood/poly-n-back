# Technology Stack

**Project:** Poly N-Back — Milestone 2: Monetized Platform
**Researched:** 2026-03-02
**Confidence:** MEDIUM-HIGH (verified with official docs and multiple sources; plugin version pins are approximate — verify latest at implementation time)

> **Scope note:** This file documents ONLY the new additions for M2. The existing stack (Vue 3.5, Vite 7, Pinia 3, Tailwind 4, Capacitor 8, TypeScript strict, Vitest, Playwright) is validated and does not need revisiting.

---

## Existing Stack (DO NOT Re-research)

Already validated in v1.0:

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Vue 3.5, Pinia 3, Tailwind 4, TypeScript 5.9 | Shipped |
| Build | Vite 7, @vitejs/plugin-vue 6 | Shipped |
| Mobile | Capacitor 8, @capacitor/ios 8, @capacitor/android 8 | Shipped |
| Testing | Vitest 4, @vue/test-utils 2, Playwright | Shipped |
| Error monitoring | Sentry (infrastructure in place, DSN needs filling) | Shipped |

---

## New Stack: Backend (Laravel API)

### Core Backend

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Laravel | ^12.x | API framework | Dev's professional stack, hosts other production sites on Forge. Laravel 12 released Feb 2025, stable, bug fixes through Aug 2026, security fixes through Feb 2027. Requires PHP 8.2+. |
| PHP | ^8.3 | Runtime | PHP 8.3 is current stable on Forge. Laravel 12 supports 8.2+, but 8.3 gives named arguments, typed class constants, and better performance. |
| Laravel Sanctum | included with Laravel 12 | API token auth | For a Capacitor mobile app, use personal access tokens (not cookie-based sessions). Token approach is standard for all mobile clients. Sanctum ships with Laravel — zero extra packages. Tokens are Bearer tokens stored securely on-device. |
| Laravel Socialite | ^5.24 | OAuth provider abstraction | Standard Laravel package for OAuth. v5.24.2 is latest (Jan 2025). Use `->stateless()->userFromToken($token)` pattern for mobile — the app gets the token natively and hands it to the backend for verification. |
| socialiteproviders/apple | ^5.x | Apple Sign-In provider | Extends Socialite with Apple support. Maintained community package, compatible with Laravel 12. Handles JWT client_secret generation and Apple's JWK verification. |
| imdhemy/laravel-purchases | ^1.19 | IAP receipt validation | Validates StoreKit receipts (iOS) and Google Play purchase tokens (Android) server-side. Latest v1.19.0 (Dec 2025). Handles subscription lifecycle states. Required for secure purchase verification — never trust client-only IAP. |
| MySQL | 8.0+ | Primary database | Standard on Forge. Users, sessions, purchases, game stats, daily challenges. |

### Google ID Token Verification (Backend)

**Do NOT use Socialite's `userFromToken()` for Google on mobile.** It triggers a 401 from Google because Socialite sends the token as an access token, but the Capacitor Google plugin returns an **ID token** (JWT), not an access token.

Use the Google Auth Library for PHP instead:

| Package | Version | Purpose | Why |
|---------|---------|---------|-----|
| google/apiclient | ^2.x | Google ID token verification | Official Google PHP client. Use `$client->verifyIdToken($idToken)` to validate the JWT signature, `aud`, `exp`, and `iss` claims. This is Google's documented approach for server-side verification of mobile sign-in. |

Install: `composer require google/apiclient`

**Flow:**
1. App gets ID token from `@capgo/capacitor-social-login` (Google)
2. App sends ID token to `POST /api/auth/google`
3. Backend creates `new Google_Client(['client_id' => env('GOOGLE_CLIENT_ID')])` and calls `verifyIdToken($token)`
4. On success: find-or-create user, issue Sanctum token, return to app

### Apple ID Token Verification (Backend)

Socialite + `socialiteproviders/apple` handles this correctly for mobile token verification. Apple issues a JWT (identity token) — the provider verifies it against Apple's public JWK endpoint.

**Flow:**
1. App gets identity token from `@capgo/capacitor-social-login` (Apple)
2. App sends identity token to `POST /api/auth/apple`
3. Backend uses `Socialite::driver('apple')->stateless()->userFromToken($token)`
4. On success: find-or-create user, issue Sanctum token, return to app

**Important:** Apple client_secret is a JWT with a 6-month maximum lifetime. Must be regenerated every 6 months. Store as an env variable; set a calendar reminder.

---

## New Stack: Mobile Plugins (Capacitor)

### Social Login

| Plugin | Version | Purpose | Why |
|--------|---------|---------|-----|
| @capgo/capacitor-social-login | ^8.x | Google + Apple Sign-In | Single plugin for both providers. Actively maintained by Capgo. Versioning follows Capacitor major (v8 for Capacitor 8). Consolidates `@codetrix-studio/capacitor-google-auth` (archived) and `@capacitor-community/apple-sign-in` (migration path points here). Supports Web + iOS + Android. Uses new Google Credentials API (not deprecated GIDSignIn). |

Install:
```bash
npm install @capgo/capacitor-social-login
npx cap sync
```

**Note on `@codetrix-studio/capacitor-google-auth`:** Original is virtually archived. Maintainer unreachable. Do not use it. `@capgo/capacitor-social-login` is the recommended migration target.

### In-App Purchases

| Plugin | Version | Purpose | Why |
|--------|---------|---------|-----|
| @capgo/native-purchases | ^8.x | iOS StoreKit 2 + Android Google Play Billing | Native IAP implementation. Uses StoreKit 2 (iOS 15+) and Google Play Billing 7.x. Versioning follows Capacitor major. Same JavaScript API across platforms. Supports non-consumable products (one-time purchases). JWS receipt format for server-side validation with App Store Server API. |

Install:
```bash
npm install @capgo/native-purchases
npx cap sync
```

**IAP Flow:**
1. App calls `@capgo/native-purchases` to initiate purchase
2. Store handles payment UI natively
3. App sends receipt/JWS token to `POST /api/purchase/verify`
4. Backend uses `imdhemy/laravel-purchases` to verify with Apple App Store Server API or Google Play Developer API
5. Backend marks user as "premium" in database
6. App unlocks features based on backend confirmation

**Critical:** Never unlock premium features based on client-side confirmation alone. Server-side validation is mandatory. Apple's old `/verifyReceipt` endpoint is deprecated; StoreKit 2 JWS tokens are validated via the App Store Server API.

### Secure Token Storage

| Plugin | Version | Purpose | Why |
|--------|---------|---------|-----|
| @aparajita/capacitor-secure-storage | ^8.x | Store Sanctum bearer token securely | Uses iOS Keychain and Android Keystore. Capacitor 8+ compatible (v8.0.0 released Feb 2026). Do NOT store auth tokens in Capacitor Preferences (unencrypted). |

Install:
```bash
npm install @aparajita/capacitor-secure-storage
npx cap sync
```

**Alternative:** `capacitor-secure-storage-plugin` (martinkasa) — simpler API, latest v0.13.0 supports Capacitor 7, Capacitor 8 support unconfirmed at research time. Prefer `@aparajita/capacitor-secure-storage` for explicit Capacitor 8 support.

---

## New Stack: Frontend (App)

### HTTP Client

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| axios | ^1.13 | HTTP requests to Laravel API | v1.13.6 latest (Feb 2026). Ships TypeScript definitions. Handles Bearer token headers cleanly via interceptors. Familiar to Laravel ecosystem. Replaces raw `fetch()` for API calls. |

Install:
```bash
npm install axios
```

**CORS note for Capacitor:** Capacitor 8's built-in HTTP plugin patches `fetch()` and `XMLHttpRequest` to use native requests that bypass CORS restrictions. Axios uses `XMLHttpRequest` under the hood in WebView — it benefits from this patching automatically. Alternatively, use `@capacitor/http` for explicit native HTTP if CORS issues surface in development.

**Recommended Axios setup:**
```typescript
// src/api/client.ts
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { Accept: 'application/json' }
})

apiClient.interceptors.request.use(config => {
  const token = authStore.token // retrieved from secure storage at app start
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default apiClient
```

### Charts (Stats Dashboard)

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| vue-chartjs | ^5.3.3 | Charts for stats dashboard | Thin Vue 3 wrapper around Chart.js 4. Simple to use, no bloat, tree-shakeable. Sufficient for line charts (accuracy over time), bar charts (session history), and radar charts (per-attribute performance). |
| chart.js | ^4.5.1 | Charting engine (peer dep) | vue-chartjs requires Chart.js as a peer dependency. v4.5.1 is current stable. Install both explicitly. |

Install:
```bash
npm install vue-chartjs chart.js
```

**Why not echarts/vue-echarts:** ECharts is excellent for complex dashboards with thousands of data points. This stats dashboard is simple: a few line charts and a radar. vue-chartjs + Chart.js is ~60KB vs ECharts ~1MB. Bundle size matters for a mobile app with asset bundling.

**Why not unovis:** Unovis is excellent and lightweight but has fewer community resources. Chart.js has years of StackOverflow coverage and chart type examples. Better DX for a solo dev.

---

## New Stack: Marketing Site

The marketing site at polynback.com is a separate concern from the Capacitor app. Keep it simple.

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Laravel (same backend) | ^12.x | Serve marketing pages | Already running Laravel on Forge for the API. Use Blade templates or Inertia for a few marketing pages. No separate infrastructure needed. polynback.com/api/* routes to the API; polynback.com/* routes to marketing pages. |

**Do NOT add a separate static site generator (Nuxt, Astro, etc.)** for the marketing site. The site is a few pages: homepage, features, pricing, privacy policy. Blade templates are sufficient. Adding Nuxt/Astro adds deployment complexity with no benefit for a 3-5 page marketing site.

If the marketing site ever needs SEO-critical dynamism or a blog, revisit. For launch: Blade + Alpine.js (already available via CDN in Laravel's default install).

---

## New Stack: App Store Submission

No new npm packages needed. Uses existing native toolchain.

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| Xcode | 16+ | iOS build and submission | Required by Capacitor 8. Already installed (confirmed in PROJECT.md context). Use `cap build ios` or open `ios/App.xcworkspace` in Xcode. |
| Android Studio | Ladybug 2024.2.1+ | Android build | Already installed (PROJECT.md). `cap build android` or open `android/` in Android Studio. |
| App Store Connect | N/A | iOS submission | $99/yr Apple Developer already active. Submit via Xcode Organizer or Transporter. |
| Google Play Console | N/A | Android submission | $25 one-time fee already paid. AAB format required (not APK). |
| Fastlane | Optional | CI/CD for submissions | Solo dev, manual submission is viable for v1. Add Fastlane in M3 if submission cadence increases. |

**iOS requirements for submission:**
- Build with Xcode 16+ using iOS 18 SDK
- Privacy Nutrition Labels required (data types collected: name, email, user ID, usage data)
- Account deletion in-app required (Apple rule since 2022)
- Sign in with Apple required IF you offer any other social login option
- App must target iOS 15+ (Capacitor 8 minimum)

**Android requirements for submission:**
- Target API level 35 (Android 15) for new apps from Aug 2025
- AAB format (`.aab`) not APK
- Play Billing compliance declaration required if using IAP

---

## New Pinia Stores Required

| Store | Purpose | Notes |
|-------|---------|-------|
| `authStore` | Auth state, token management, user profile | Loads Sanctum token from secure storage on app init |
| `purchaseStore` | IAP state, premium status, restore purchases | Syncs with backend after each verification |
| `statsStore` | Session history, per-attribute accuracy, streaks | Fetches from API, caches locally for offline viewing |

Extend existing stores:
- `gameStore` — add daily challenge integration, game mode variants
- `persistenceStore` — add sync-on-restore logic (merge local + server state)

---

## New Environment Variables

Add to `.env` (local) and configure on Forge (production):

```bash
# App (frontend)
VITE_API_URL=https://polynback.com/api
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com

# Laravel backend (server-side only)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com  # For ID token verification
APPLE_CLIENT_ID=com.polynback                     # Bundle ID
APPLE_TEAM_ID=XXXXXXXXXX
APPLE_KEY_ID=XXXXXXXXXX
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# IAP (App Store Server API credentials)
APP_STORE_KEY_ID=XXXXXXXXXX
APP_STORE_ISSUER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
APP_STORE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# IAP (Google Play — service account JSON)
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=/path/to/service-account.json

# Standard Laravel
APP_KEY=base64:...
DB_DATABASE=polynback
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| @capgo/capacitor-social-login | @codetrix-studio/capacitor-google-auth | Never — archived, unmaintained |
| @capgo/capacitor-social-login | Firebase Auth | If also using Firestore, Firebase Analytics, or FCM push. Not worth adding Firebase SDK for auth alone. |
| @capgo/native-purchases | RevenueCat purchases-capacitor | If adding subscriptions in M3. RevenueCat's backend simplifies subscription lifecycle management dramatically. For M2's one-time purchase, direct StoreKit 2 is simpler and avoids the RevenueCat account/pricing. Re-evaluate when adding subscriptions. |
| imdhemy/laravel-purchases | aporat/store-receipt-validator | Either works for receipt validation. imdhemy has more active maintenance (v1.19.0 Dec 2025). |
| @aparajita/capacitor-secure-storage | capacitor-secure-storage-plugin (martinkasa) | If Capacitor 8 support is confirmed for martinkasa's package at implementation time — APIs are similar. |
| vue-chartjs + Chart.js | vue-echarts + ECharts | If stats dashboard grows to complex multi-series data with >1000 points, drill-downs, or custom chart types. |
| Blade templates | Nuxt/Astro for marketing site | If the marketing site needs a blog, complex SEO routing, or server-side rendering for dynamic content. For launch, Blade is sufficient. |
| Laravel Sanctum tokens | Laravel Passport | Passport is OAuth2 server — needed when issuing tokens to third-party apps. Sanctum is correct for first-party mobile + SPA. |
| google/apiclient | Socialite userFromToken() for Google | Never use Socialite's userFromToken() for Google mobile ID tokens — Google returns 401. google/apiclient is the documented approach. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| RevenueCat (M2) | Overkill and cost for a one-time purchase. RevenueCat's value is subscription lifecycle management and analytics. | @capgo/native-purchases + imdhemy/laravel-purchases |
| Firebase Auth | Adds Firebase SDK (~500KB) for auth alone. Laravel Sanctum + social plugins achieve the same with less bloat. | Laravel Sanctum + @capgo/capacitor-social-login |
| Capacitor Preferences for auth tokens | Unencrypted storage on device. Bearer tokens are sensitive credentials. | @aparajita/capacitor-secure-storage (Keychain/Keystore) |
| Apple's deprecated /verifyReceipt API | Deprecated. Not supported with StoreKit 2 JWS tokens. | App Store Server API via imdhemy/laravel-purchases |
| Subscription model (M2) | Out of scope. One-time IAP only for M2. | One-time non-consumable product via @capgo/native-purchases |
| Separate static site for marketing | Adds deployment complexity. polynback.com has 3-5 pages. | Laravel Blade templates on existing Forge server |
| Appflow / Capgo OTA updates | Not needed per PROJECT.md. Standard App Store updates sufficient. | Standard app store review process |
| @codetrix-studio/capacitor-google-auth | Archived, maintainer unreachable, no Capacitor 8 support | @capgo/capacitor-social-login |
| @capacitor-community/apple-sign-in | Migration guide points to @capgo/capacitor-social-login | @capgo/capacitor-social-login |

---

## Version Compatibility Matrix

| Capacitor Plugin | Capacitor Version | Notes |
|-----------------|-------------------|-------|
| @capgo/capacitor-social-login | 8.x (plugin matches Capacitor major) | Only latest major actively maintained |
| @capgo/native-purchases | 8.x (plugin matches Capacitor major) | StoreKit 2 requires iOS 15+; Cap 8 targets iOS 15+ |
| @aparajita/capacitor-secure-storage | 8.x (v8.0.0, Feb 2026) | Explicit Capacitor 8 support confirmed |
| chart.js | 4.5.1 | Peer dep for vue-chartjs 5.3.3 |
| vue-chartjs | ^5.3.3 | Requires Vue 3 and Chart.js 4 |
| axios | ^1.13 | No Capacitor/Vue version dependency |

---

## Installation Summary

### Backend (new Laravel project)

```bash
composer require laravel/sanctum
composer require laravel/socialite
composer require socialiteproviders/apple
composer require imdhemy/laravel-purchases
composer require google/apiclient
```

### Frontend (add to existing Vite/Vue project)

```bash
# Core HTTP
npm install axios

# Social login + IAP (Capacitor 8 plugins)
npm install @capgo/capacitor-social-login @capgo/native-purchases

# Secure token storage
npm install @aparajita/capacitor-secure-storage

# Stats charts
npm install vue-chartjs chart.js

# Sync native plugins
npx cap sync
```

---

## Sources

- [Laravel 12 Release Notes](https://laravel.com/docs/12.x/releases) — version, PHP requirements, support timeline (HIGH confidence)
- [Laravel Sanctum Docs (12.x)](https://laravel.com/docs/12.x/sanctum) — token vs session auth patterns (HIGH confidence)
- [Laravel Socialite Docs (12.x)](https://laravel.com/docs/12.x/socialite) — stateless token pattern (HIGH confidence)
- [Socialite Providers — Apple](https://socialiteproviders.com/Apple/) — Apple provider config (HIGH confidence)
- [Google: Verify ID Token on Server](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token) — google/apiclient approach (HIGH confidence)
- [Sign in with Apple REST API](https://developer.apple.com/documentation/signinwithapplerestapi) — JWT verification (HIGH confidence)
- [Cap-go/capacitor-social-login GitHub](https://github.com/Cap-go/capacitor-social-login) — Capacitor 8 versioning, providers (MEDIUM confidence — versioning by convention)
- [Cap-go/capacitor-native-purchases GitHub](https://github.com/Cap-go/capacitor-native-purchases) — StoreKit 2, Play Billing (MEDIUM confidence)
- [imdhemy/laravel-purchases GitHub](https://github.com/imdhemy/laravel-purchases) — v1.19.0, Dec 2025 (MEDIUM confidence)
- [@aparajita/capacitor-secure-storage npm](https://www.npmjs.com/package/@aparajita/capacitor-secure-storage) — Capacitor 8+ (MEDIUM confidence)
- [vue-chartjs npm](https://www.npmjs.com/package/vue-chartjs) — v5.3.3, Chart.js 4 peer dep (HIGH confidence)
- [chart.js npm](https://www.npmjs.com/package/chart.js) — v4.5.1 (HIGH confidence)
- [axios npm](https://www.npmjs.com/package/axios) — v1.13.6 (HIGH confidence)
- [Capacitor iOS App Store Deployment](https://capacitorjs.com/docs/ios/deploying-to-app-store) — submission checklist (HIGH confidence)
- [Apple Upcoming Requirements](https://developer.apple.com/news/upcoming-requirements/) — Xcode 16, iOS 18 SDK (HIGH confidence)
- [App Store Requirements 2026](https://natively.dev/articles/app-store-requirements) — Android API 35 requirement (MEDIUM confidence)
- [Socialite stateless Google 401 issue](https://github.com/laravel/socialite/issues/726) — confirmed google/apiclient alternative (HIGH confidence — GitHub issue with resolution)

---

*Stack research for: Poly N-Back M2 new features (backend, IAP, social login, stats, game modes, marketing site, app store)*
*Researched: 2026-03-02*

# Project Research Summary

**Project:** Poly N-Back — Milestone 2: Monetized Platform
**Domain:** Brain training mobile app — freemium monetization, backend API, social auth, IAP, cross-device sync, app store submission, marketing site
**Researched:** 2026-03-02
**Confidence:** MEDIUM-HIGH

## Executive Summary

Poly N-Back M2 is a well-scoped monetization layer on top of a proven v1.0 foundation. The core gameplay loop is complete and works; the M2 mandate is to surround it with infrastructure: a Laravel 12 backend, native IAP, social login, cross-device sync, and app store listings. This is not a new product build — it is a commercially hardened version of something that already runs. The recommended approach is to treat the Laravel backend as the single critical-path dependency and build everything else in dependency order from it: auth, then IAP, then game modes, then stats, then marketing site, then submission.

The competitive positioning is genuinely differentiated: a one-time $3.99 purchase with no subscription in a market where every major competitor (Lumosity, Peak, Elevate) requires ongoing subscriptions. The "no subscription, no ads, ever" angle is the strongest conversion driver and must be the center of all marketing copy. The per-attribute accuracy stats are a secondary differentiator — no competitor offers this because no competitor has four simultaneous game attributes. Both advantages cost nothing additional to build; they just need to be articulated clearly.

The dominant risk category is compliance: App Store review rules are unforgiving (Sign in with Apple is mandatory alongside Google, privacy manifests are required, guideline 4.2 scrutinizes Capacitor apps), FTC marketing rules are real (Lumosity's $2M fine is the model to avoid), and Google Play's 3-day acknowledgment auto-refund will silently claw back purchases if not handled. Security risks (client-side IAP trust, unencrypted token storage) are equally non-negotiable. All of these have clear prevention paths documented in research, but they must be designed in from the start, not bolted on before submission.

---

## Key Findings

### Recommended Stack

The existing stack (Vue 3.5, Pinia 3, Tailwind 4, Capacitor 8, TypeScript 5.9, Vite 7, Vitest) needs zero changes. M2 adds a Laravel 12 backend on the existing Forge server and five new Capacitor/frontend packages. The full install surface is remarkably small for what M2 delivers.

The one non-obvious stack decision is Google ID token verification: Socialite's `userFromToken()` returns 401 from Google when passed a mobile ID token (it expects an access token). The `google/apiclient` PHP package handles ID token JWT verification correctly and is the documented Google-recommended approach. Apple token verification via `socialiteproviders/apple` + Socialite works correctly using the same token-exchange pattern.

**Core new technologies:**
- **Laravel 12 + PHP 8.3:** API framework — developer's production stack on Forge, Laravel 12 stable with bug fixes through Aug 2026
- **Laravel Sanctum:** Mobile API token auth — personal access tokens (Bearer header pattern), correct for first-party mobile apps (not Passport, which is for third-party OAuth servers)
- **@capgo/capacitor-social-login v8.x:** Google + Apple Sign-In — single plugin for both providers, Capacitor 8 aligned, replaces the archived `@codetrix-studio/capacitor-google-auth`
- **@capgo/native-purchases v8.x:** iOS StoreKit 2 + Android Google Play Billing — JWS receipt format for server-side validation via App Store Server API
- **imdhemy/laravel-purchases v1.19:** Server-side IAP receipt validation — handles both Apple and Google, active maintenance (Dec 2025 release)
- **@aparajita/capacitor-secure-storage v8.x:** Keychain/Keystore token storage — Capacitor 8 support explicitly confirmed (Feb 2026 release)
- **google/apiclient ^2.x:** Google ID token verification — official PHP client, correct path for verifying mobile Google sign-ins (Socialite's `userFromToken()` does not work here)
- **axios ^1.13:** HTTP client — XHR-based so it benefits from Capacitor 8's native HTTP patching for CORS bypass; Axios interceptors handle Sanctum Bearer injection cleanly
- **vue-chartjs ^5.3.3 + chart.js ^4.5.1:** Stats charts — ~60KB vs ECharts ~1MB; sufficient for session trendlines and per-attribute radar charts

**What not to use:** RevenueCat (overkill and cost for a one-time purchase), Firebase Auth (500KB SDK for auth alone), Capacitor Preferences for auth tokens (unencrypted), Apple's deprecated `/verifyReceipt` API, Socialite's `userFromToken()` for Google mobile tokens, any separate static site generator for the marketing site (Blade templates on the existing Forge server are sufficient for 3-5 pages).

See `.planning/research/STACK.md` for full install commands, version compatibility matrix, and environment variable inventory.

### Expected Features

M2 features split cleanly into P1 (blocks launch) and P2 (meaningful additions that are not blocking). The dependency graph matters: IAP requires app store registration, user accounts gate sync and Daily Challenge enforcement, game modes are configuration layers on the existing game loop (low risk), and the marketing site requires store listings to link download badges.

**Must have — P1 (v2.0 launch):**
- One-time IAP ($3.99) with server-side receipt validation and restore purchases flow — monetization core; Apple requires restore button
- Freemium gate at 2-back cap — defines the value exchange; must feel genuinely enjoyable (not crippled) to convert
- Sign in with Apple + Google Sign-In — Apple mandates SIWA whenever any social login is offered (guideline 4.8)
- Guest/unauthenticated mode — forcing account before play kills conversion; game must work without an account
- Cross-device premium status sync — buying on iPhone must unlock on iPad; requires backend
- Session history storage (local + sync) — users expect to see their training record
- Streak tracking — strongest retention lever at lowest engineering cost
- Account deletion — required by Apple since 2022
- Privacy policy at polynback.com/privacy — required by both stores before submission
- Marketing landing page at polynback.com — the storefront; no website equals no credibility
- App Store (iOS) + Google Play (Android) listings — the app does not exist for users until it is in stores

**Should have — P2 (v2.x post-validation):**
- Per-attribute accuracy breakdown (bar chart or card grid) — translates poly n-back's 4-attribute USP into unique analytical value; underlying data is already captured in gameplay
- Accuracy trendline chart — primary evidence the app is working; drives retention
- Zen Mode, Time Attack Mode, Endless Mode — all reuse existing game loop, very low complexity
- Daily Challenge (server-issued seed, one-attempt enforcement) — daily return habit driver
- Brand refresh (app icon system, wordmark, color identity) — increases perceived value and App Store screenshot quality
- Personal best tracking — low cost, clear goal for competitive users

**Defer to v3+:** Leaderboards, subscription model, full analytics suite (Mixpanel/Firebase), new attribute sets, RevenueCat, OTA updates.

See `.planning/research/FEATURES.md` for full dependency graph, competitor matrix, and MVP definition.

### Architecture Approach

The architecture is a thin service-store pattern layered on top of the existing game logic. The key insight from ARCHITECTURE.md is that game modes do not require separate stores — they are a `gameMode` ref in the existing `gameStore` that modifies termination conditions only. Stimulus generation, n-back evaluation, and scoring are unchanged across all modes. This keeps complexity low and the existing test suite valid.

The freemium gate uses a single source of truth: `iapStore` computed properties (`canAccessGameModes`, `effectiveNBackMax`, `canAccessStats`). No component implements inline premium checks. All gating flows through `iapStore.showPaywall()`. This means changing the freemium model in the future touches exactly one file.

App startup is explicitly non-blocking: load from local cache, mount immediately, refresh from server async after mount. This keeps Capacitor's "instant feel" intact regardless of network conditions.

**Major components:**
1. **Laravel 12 API (polynback.com)** — Auth controller (social token exchange, Sanctum token issuance), IAP controller (receipt validation, premium flag), Sessions controller (batch sync), User controller (entitlement endpoint). Marketing site routes share the same Laravel app — one Forge deployment.
2. **authStore + socialLoginService** — Token lifecycle (load from SecureStorage on boot, inject via Axios interceptor, handle 401 gracefully). `socialLoginService` wraps the Capacitor plugin so stores remain testable.
3. **iapStore + iapService** — Single source of truth for premium entitlement. All gating flows through computed properties here. `iapService` wraps the Capacitor purchases plugin.
4. **statsStore** — Offline-first session recording (write local always, sync async if logged in). Queue of unsynced sessions with batch upload on reconnect. Last-write-wins by timestamp is sufficient for non-collaborative session data.
5. **New screens** — `AuthScreen.vue`, `StatsScreen.vue`, `PaywallModal.vue`, `GameModeSelector.vue` follow existing screen/modal patterns.

**Build order (strict dependencies):** Laravel API scaffolding → authStore + apiService + socialLoginService → AuthScreen → iapStore + iapService → PaywallModal → GameModeSelector + gameStore mode additions → statsStore → StatsScreen → App Store submission. Marketing site runs in parallel.

See `.planning/research/ARCHITECTURE.md` for data flow diagrams, full store state shapes, anti-pattern documentation, and scaling considerations.

### Critical Pitfalls

The research documents 10 pitfalls. The top 5 that will cause the most damage if missed:

1. **Client-side IAP trust** — Never set `isPremium = true` from the Capacitor plugin's JavaScript callback alone. Send receipt to Laravel, validate with Apple/Google server API, get backend confirmation, then grant entitlement. The entire paywall is bypassable otherwise on jailbroken devices. Prevention: `iapStore.purchase()` only calls backend verify endpoint before setting `isPremium`.

2. **Missing Sign In with Apple alongside Google** — App Store guideline 4.8 rejects apps that offer any third-party social login without also offering SIWA. The rule tightened in 2024 — it no longer requires you to be "exclusively" using third-party login. Build both providers in the same phase. SIWA must use `ASWebAuthenticationSession` (not WKWebView) and meet Apple's visual guidelines exactly. Test on physical device — SIWA does not work in Simulator.

3. **FTC marketing claim compliance** — The Lumosity $2M fine is the precedent. Claims like "scientifically proven to improve fluid intelligence" are FTC targets. Safe framing: "train the cognitive skills studied in n-back research" / "practice the task most associated with working memory improvement." The existing `ABOUT_POLY_NBACK.md` content must be audited before any of it appears in App Store metadata or on polynback.com.

4. **Google Play unacknowledged purchase auto-refund** — Android auto-refunds and revokes non-consumable purchases not acknowledged within 3 days. Unlike iOS, Play Billing requires explicit `acknowledgePurchase()`. Confirm the Capgo plugin handles this automatically; if not, implement explicitly. Also: never grant entitlement to PENDING purchases (carrier billing, deferred payments).

5. **iOS Privacy Manifest (`PrivacyInfo.xcprivacy`) missing or incomplete** — Required since May 2024. `@capacitor/preferences` accesses UserDefaults and requires `NSPrivacyAccessedAPICategoryUserDefaults` with reason code `CA92.1`. Missing or incomplete manifest equals rejection. Run Xcode's privacy report tool before first submission.

Additional pitfalls to plan around: Sanctum token storage must use Keychain/Keystore (not Capacitor Preferences, which is plaintext on Android), local-to-server data migration requires a first-login upload flow for existing users, IAP products take up to 24 hours to propagate in App Store Connect sandbox (use StoreKit Config Files for local testing), freemium gate backlash if 2-back feels crippled for returning users.

See `.planning/research/PITFALLS.md` for full prevention checklists, recovery costs, and a "Looks Done But Isn't" verification list.

---

## Implications for Roadmap

The dependency graph from research is definitive about build order. The Laravel backend is the critical path: auth, IAP, and sync all depend on it. Game modes are independent of the backend (they are gameplay-level configuration) but logically belong after the premium gate exists. App store submission gates on everything else being stable. The marketing site is genuinely independent and can run in parallel with backend work.

### Phase 1: Backend Foundation (Laravel API + Auth)

**Rationale:** Everything in M2 that is not a pure game mode depends on the backend. Auth gates sync, IAP, Daily Challenge, and stats. Starting here unblocks all subsequent phases. This is the highest-leverage phase — getting it right means subsequent phases have a solid foundation.
**Delivers:** Laravel 12 project on Forge, database schema (users, game_sessions, personal_access_tokens), social auth endpoints (`POST /api/auth/social` for Google + Apple), Sanctum token issuance, `authStore` + `apiService` + `socialLoginService` in the Capacitor app, `AuthScreen.vue`, secure token storage via `@aparajita/capacitor-secure-storage`.
**Features addressed:** Social login (Google + Apple), guest mode, account deletion, cross-device foundation.
**Pitfalls to avoid:** Sanctum token in Capacitor Preferences (use SecureStorage), SIWA missing alongside Google (build both together), token expiration strategy (30-90 day tokens for mobile), local data migration flow for existing users who already have play history.

### Phase 2: In-App Purchases + Freemium Gate

**Rationale:** Monetization is the M2 mission. With auth in place, the backend can tie IAP receipt validation to a user account. The freemium gate (`iapStore`) must exist before game modes can be gated.
**Delivers:** `iapStore` + `iapService`, `@capgo/native-purchases` integration, `imdhemy/laravel-purchases` backend receipt validation, `PaywallModal.vue`, freemium gate at 2-back (free) / all levels (premium), Restore Purchases flow, IAP products registered in App Store Connect and Google Play Console.
**Features addressed:** One-time IAP ($3.99), freemium tier, purchase restoration, cross-device premium sync.
**Pitfalls to avoid:** Client-side IAP trust (mandatory server validation before entitlement), Google Play acknowledgment within 3 days, PENDING purchase state handling, IAP "Product not found" during dev (create products in stores early, use StoreKit Config File for iOS local testing), freemium gate too restrictive (verify 2-back cap delivers genuine value to new users), hardcoded price in UI (use `product.displayPrice` from store).

### Phase 3: Game Modes

**Rationale:** Game modes reuse the existing game loop entirely — they are the lowest-risk feature set in M2. With the premium gate from Phase 2, modes can be gated correctly. Building modes after auth and IAP means the full product experience can be tested with premium unlocked.
**Delivers:** `GameMode` type in `game.ts`, `gameMode` ref added to `gameStore`, Zen Mode, Time Attack Mode, Endless Mode, Daily Challenge (server-issued seed endpoint on Laravel), `GameModeSelector.vue` with lock icons.
**Features addressed:** All four game modes, personal best tracking.
**Pitfalls to avoid:** Game modes as separate stores (they are conditional branches in the existing `gameStore`), inline premium checks in components (route through `iapStore.canAccessGameModes`), paywall appearing mid-session (show only at menu/game-over boundaries).

### Phase 4: Stats Dashboard

**Rationale:** Stats depend on session data being recorded and synced. The session schema and sync queue (`statsStore`) build on the auth and API infrastructure from Phase 1. Stats are a premium feature — the gate from Phase 2 must be in place. The visualization layer (vue-chartjs) is straightforward once data flows.
**Delivers:** `statsStore` with offline-first session recording, batch sync endpoint (`POST /api/sessions/batch`) on Laravel, `StatsScreen.vue`, session history list, accuracy trendline chart, per-attribute accuracy breakdown, streak tracking (current streak on home screen).
**Features addressed:** Session history, accuracy over time, per-attribute breakdown, streaks, personal bests.
**Pitfalls to avoid:** Syncing on every game round (batch async), fetching all stats on app launch (cache locally, update in background), sync failure shown as modal (surface silently, never block gameplay), missing `played_at` index on `game_sessions` table (add at table creation, not as an afterthought).

### Phase 5: Brand Refresh + Marketing Site

**Rationale:** Marketing work is independent of the backend — it can theoretically run in parallel with any phase. However, it benefits from the app being nearly feature-complete so screenshots capture the real product. The marketing site needs app store listings to link download badges, so it logically finalizes here.
**Delivers:** Visual identity (wordmark, primary color, icon system), brand applied to marketing landing page at polynback.com, privacy policy at polynback.com/privacy, polynback.fun → polynback.com 301 redirect, App Store + Google Play download badges, app screenshots with brand applied.
**Features addressed:** Marketing site, privacy policy, domain redirect, brand differentiation.
**Pitfalls to avoid:** FTC-violating marketing claims in any copy (App Store listing, polynback.com, in-app) — audit `ABOUT_POLY_NBACK.md` before use; avoid "scientifically proven," "clinically proven," "guaranteed," or any disease-treatment language.

### Phase 6: App Store Submission (iOS + Android)

**Rationale:** Submission requires all prior phases to be stable. This phase focuses on the submission-specific work: privacy manifests, metadata, App Review preparation, build pipeline. Treat this as its own phase — submission consistently surfaces issues that require iteration.
**Delivers:** iOS app live on App Store, Android app live on Google Play, `PrivacyInfo.xcprivacy` complete (all API categories declared including `NSPrivacyAccessedAPICategoryUserDefaults`), App Store Connect and Google Play Console metadata finalized, app review demo credentials prepared with premium pre-unlocked, Privacy Nutrition Labels filled.
**Features addressed:** iOS + Android app store listings, store presence.
**Pitfalls to avoid:** Privacy manifest missing or incomplete (run Xcode privacy report before submission), guideline 4.2 minimum functionality concern (native IAP, haptics, native social login, offline capability all support the case), App Store metadata containing unsubstantiated health claims (copy review required before submission).

### Phase Ordering Rationale

- Backend first because auth is a dependency of IAP receipt validation, session sync, Daily Challenge seed enforcement, and cross-device premium status — no subsequent phase is blocked by it once it is done.
- IAP second because the freemium gate (`iapStore`) must exist before game modes can be premium-gated. Also, IAP product IDs must be registered in stores early to allow for the 24-hour App Store Connect propagation buffer.
- Game modes third because they are low-risk (existing game loop reuse) and need the premium gate to be functional to test correctly.
- Stats fourth because they depend on session data architecture (schema, store, sync queue) that is best designed after auth and API patterns are established.
- Marketing fifth to capture the real product in screenshots and to finalize copy after features are known.
- Submission last because it requires everything else to be stable and adds its own iteration surface (review rejections, privacy manifest issues, metadata refinement).

### Research Flags

Phases that should use `/gsd:research-phase` during planning for deeper investigation:

- **Phase 1 (Backend + Auth):** The Google ID token verification path (`google/apiclient` vs Socialite) is documented, but Apple Sign-In's client_secret rotation (6-month JWT lifetime) and the exact `ASWebAuthenticationSession` behavior in the Capgo plugin warrant implementation research at plan creation time.
- **Phase 2 (IAP):** `@capgo/native-purchases` v8 and `imdhemy/laravel-purchases` v1.19 are MEDIUM confidence (community packages). Verify current API surface, any breaking changes, and Google Play acknowledgment handling behavior before writing the phase plan.
- **Phase 6 (App Store Submission):** App Store review requirements shift frequently. Re-verify latest Apple requirements (privacy manifest reason codes, Xcode version requirements, any new mandatory compliance items) immediately before the submission phase plan is written.

Phases with well-established patterns (can skip research-phase):

- **Phase 3 (Game Modes):** The `gameMode` ref pattern is fully designed in ARCHITECTURE.md. Game loop modifications are minimal and low-risk. No novel technology.
- **Phase 4 (Stats Dashboard):** vue-chartjs + Chart.js is high-confidence and well-documented. The offline-first session recording pattern is fully specified in ARCHITECTURE.md with code examples.
- **Phase 5 (Marketing Site):** Blade templates on the existing Laravel instance. No novel technology. FTC compliance guidelines are the primary concern and are fully documented in PITFALLS.md.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Core stack (Vue/Capacitor/Laravel) is HIGH confidence from official docs. Capgo plugins (@capgo/capacitor-social-login, @capgo/native-purchases) are MEDIUM — actively maintained community packages with Capacitor 8 versioning convention, but exact API surface needs verification at implementation time. |
| Features | MEDIUM-HIGH | Table stakes features are HIGH confidence (App Store guidelines verified, competitor analysis is solid). P2 features are pattern-validated but complexity estimates for Daily Challenge and Endless Mode are approximate. |
| Architecture | HIGH | Existing codebase is fully known. New component boundaries are well-specified and derived from official Laravel/Sanctum docs. Data flow patterns are established and match official documentation. |
| Pitfalls | HIGH | IAP compliance (Apple + Google docs, FTC enforcement history), App Store rejection rules, and security patterns are all from authoritative sources. Offline sync conflict resolution is MEDIUM confidence. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Capgo plugin API verification:** `@capgo/native-purchases` v8 and `@capgo/capacitor-social-login` v8 exact JavaScript API surface (method signatures, return shapes) should be verified against current GitHub README before each relevant phase plan is written. Version pinning strategy for Capgo plugins needs to be decided (lock to minor or patch?).
- **Apple client_secret rotation:** The Apple Sign-In `client_secret` is a JWT with a 6-month maximum lifetime. A calendar reminder and rotation procedure needs to be defined before launch — this is an operational gap that is easy to overlook.
- **StoreKit 2 JWS token format with imdhemy/laravel-purchases:** The research notes `imdhemy/laravel-purchases` supports App Store Server API v2 (JWS-based), but the exact configuration for the App Store API credentials (`APP_STORE_KEY_ID`, `APP_STORE_ISSUER_ID`, `APP_STORE_PRIVATE_KEY`) should be verified against the package's current documentation at implementation time.
- **Google Play service account setup:** The Google Play service account JSON path for `imdhemy/laravel-purchases` requires a Google Cloud Console service account with Play Developer API access. The provisioning steps should be planned before the IAP phase starts.
- **Freemium conversion rate threshold:** The 2-back cap is reasonable but untested with real users. Plan to evaluate whether the cap produces adequate conversion (industry average ~2.18% for freemium) and be prepared to adjust (e.g., allow 3-back in the free tier) based on post-launch data.

---

## Sources

### Primary (HIGH confidence)
- [Laravel 12 Official Docs](https://laravel.com/docs/12.x/) — Sanctum token auth, Socialite social login, release timeline
- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) — Guideline 4.8 (SIWA requirement), account deletion requirement, IAP rules
- [Apple App Store Server API v2](https://developer.apple.com/documentation/appstoreserverapi) — JWS-based receipt validation, StoreKit 2
- [Google: Verify Google ID Token on Server](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token) — google/apiclient approach for mobile ID tokens
- [Google Play Billing: One-Time Purchase Lifecycle](https://developer.android.com/google/play/billing/lifecycle/one-time) — acknowledgment requirement, PENDING state
- [FTC v. Lumos Labs (Lumosity) Final Order](https://www.ftc.gov/system/files/documents/cases/160105lumoslabsstip.pdf) — marketing claims enforcement precedent
- [Capacitor iOS Privacy Manifest Docs](https://capacitorjs.com/docs/v5/ios/privacy-manifest) — PrivacyInfo.xcprivacy requirements
- [vue-chartjs npm](https://www.npmjs.com/package/vue-chartjs) + [chart.js npm](https://www.npmjs.com/package/chart.js) — version compatibility

### Secondary (MEDIUM confidence)
- [Cap-go/capacitor-social-login GitHub](https://github.com/Cap-go/capacitor-social-login) — Capacitor 8 versioning, provider support
- [Cap-go/capacitor-native-purchases GitHub](https://github.com/Cap-go/capacitor-native-purchases) — StoreKit 2, Play Billing 7.x, JWS receipts
- [imdhemy/laravel-purchases GitHub](https://github.com/imdhemy/laravel-purchases) — v1.19.0 Dec 2025 release, validation API
- [@aparajita/capacitor-secure-storage npm](https://www.npmjs.com/package/@aparajita/capacitor-secure-storage) — Capacitor 8+ support confirmed
- [Brain Training Apps Market Report 2025-2033](https://www.snsinsider.com/reports/brain-training-apps-market-8665) — freemium market share, paid segment growth rate
- [Offline-First Sync Patterns](https://developersvoice.com/blog/mobile/offline-first-sync-patterns/) — local-first write, sync queue design
- [Capawesome: IAP setup tips for Capacitor](https://capawesome.io/blog/tips-for-setting-up-in-app-purchases-with-capacitor/) — product propagation delay, testing approach

### Tertiary (LOW-MEDIUM confidence)
- Forrester 2024 (via plotline.so) — Streak + milestone systems reduce 30-day churn 35% vs non-gamified
- [Freemium to Premium Conversion Techniques](https://adapty.io/blog/freemium-to-premium-conversion-techniques/) — industry average conversion rates (~2.18% freemium)
- [Paywall Bypass via Client-Side Trust (Medium, Feb 2026)](https://medium.com/@default_Ox/paywall-bypass-how-client-side-trust-led-to-a-free-premium-upgrade-f54e65699628) — attack vector illustration

---
*Research completed: 2026-03-02*
*Ready for roadmap: yes*

# Requirements: Poly N-Back — Milestone 2 (Monetized Platform)

**Defined:** 2026-04-25
**Core Value:** The n-back gameplay loop must feel incredible — responsive, satisfying, impossible to put down.

## v1 Requirements

Requirements for Milestone 2. Each maps to a roadmap phase.

### Hardening

Pre-store-submission reliability work targeting concrete bugs and gaps that interact with paid flows or App Review.

- [ ] **HARD-01**: AudioContext unlocks on any first user interaction (response button tap, audio toggle, tutorial dismiss, start), not only `startGame()` and tutorial completion. Pre-game button taps do not leave audio silent in subsequent gameplay on iOS.
- [ ] **HARD-02**: Persistence layer (`persistenceStore.loadPreference()`) validates loaded data against expected schema field-by-field (type guards on each property) and returns defaults on shape mismatch or corruption. Malformed stored data does not propagate downstream errors.
- [ ] **HARD-03**: E2E test suite covers a full game flow (start → respond to ≥5 stimuli → trigger game over → restart) and persistence across restart (high score and audio preference persist after reload). Runs in CI on every push.

### In-App Purchase & Freemium

One-time purchase model with client-side StoreKit 2 / Play Billing validation. Server-side validation deferred to M3.

- [ ] **IAP-01**: User can purchase a one-time premium unlock for $3.99 via App Store (iOS) or Google Play (Android) using native StoreKit 2 / Play Billing.
- [ ] **IAP-02**: Free tier caps n-back at level 2 (1-back, 2-back). Premium unlocks all levels (3-back and above).
- [ ] **IAP-03**: User can restore a previous purchase on a new device or after reinstall via a visible "Restore Purchases" button (Apple-required).
- [ ] **IAP-04**: Premium status persists locally across app restarts via Capacitor Preferences and is checked on app start without blocking app mount.
- [ ] **IAP-05**: When a free user attempts to access locked content (selecting n-back ≥ 3), a paywall modal appears with purchase and restore actions, dismissable back to free tier.

### Stats

Minimal local-only stats. No charts, no streaks, no sync — those are M3.

- [ ] **STAT-01**: Each completed game session is recorded locally with timestamp, n-back level, score, accuracy percentage, and duration in seconds.
- [ ] **STAT-02**: User can view a list of past sessions on a stats screen, sorted by recency, showing the recorded fields.
- [ ] **STAT-03**: Session history persists across app restarts via Capacitor Preferences.

### Brand

Visual identity refresh applied to in-app UI and store assets.

- [ ] **BRAND-01**: App has a refreshed visual identity (wordmark, primary brand color, app icon system, type treatment) defined as a brand spec document.
- [ ] **BRAND-02**: Refreshed identity is applied throughout in-app UI (header, splash/launch, primary CTAs) and reflected in app icons for iOS and Android targets.

### Marketing Site

Landing page and privacy policy at `polynback.com`. The `.fun` GitHub Pages deployment stays live (cutover deferred to M3).

- [ ] **MKT-01**: Landing page exists at `polynback.com` with hero, gameplay screenshots, app store badges (links populated post-submission), and FTC-compliant marketing copy.
- [ ] **MKT-02**: Privacy policy is published at `polynback.com/privacy` meeting App Store and Google Play requirements (data collected, retention policy, contact information, jurisdiction).
- [ ] **MKT-03**: All user-facing marketing and metadata copy (landing page, app store listing text, in-app text) is audited for FTC compliance — no "scientifically proven," "clinically proven," "guaranteed cognitive improvement," or unsubstantiated health claims. Safe framing is documented for future reuse.

### App Store Submission

iOS and Android store submission with all compliance artifacts.

- [ ] **STORE-01**: iOS app is submitted to App Store with `PrivacyInfo.xcprivacy` declaring all required API categories (including `NSPrivacyAccessedAPICategoryUserDefaults` reason `CA92.1` for Capacitor Preferences) and Privacy Nutrition Labels completed.
- [ ] **STORE-02**: Android app is submitted to Google Play with the Data Safety form completed and a privacy declaration covering local storage and IAP.

## v2 Requirements

Deferred to M3. Tracked but not in current roadmap.

### Backend & Sync

- **BACK-01**: Laravel API on Forge with Sanctum token auth
- **BACK-02**: Server-side IAP receipt validation (Apple App Store Server API + Google Play Developer API)
- **BACK-03**: Cross-device premium status sync
- **BACK-04**: Cross-device session history sync (offline-first with batch upload)

### Authentication

- **AUTH-01**: Sign in with Apple (required by App Store guideline 4.8 once any social login exists)
- **AUTH-02**: Google Sign-In via mobile ID token verification
- **AUTH-03**: Account deletion flow (Apple-required since 2022)
- **AUTH-04**: Guest/unauthenticated mode (full game playable without account)

### Game Modes

- **MODE-01**: Zen Mode (no strikes, no time pressure)
- **MODE-02**: Time Attack Mode (fixed duration, max score)
- **MODE-03**: Endless Mode (continues until player quits)
- **MODE-04**: Daily Challenge (server-issued seed, one attempt per day)

### Stats (Full)

- **STATFULL-01**: Accuracy trendline chart over time
- **STATFULL-02**: Per-attribute accuracy breakdown (color/emoji/position/shape)
- **STATFULL-03**: Streak tracking with current streak surfaced on home screen
- **STATFULL-04**: Personal best tracking per game mode

### Domain Cutover

- **DOM-01**: `polynback.fun` → `polynback.com` 301 redirect once `.com` is the canonical domain

## Out of Scope

Explicitly excluded for M2 (and most for the foreseeable future). Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| RevenueCat | Overkill for one-time IAP; revisit only if subscription is added in M3+ |
| Subscription model | One-time purchase first; subscription layer deferred indefinitely |
| Ads | Never — focus is sacred in cognitive training; ads contradict the product premise |
| Service worker / PWA | iOS WKWebView doesn't support service workers; Capacitor bundles assets natively |
| Dark mode toggle | App is already dark-themed; toggle adds complexity without value |
| i18n / localization | English-only for now; revisit when user base warrants it |
| OTA updates (Capgo / Appflow) | Standard app store updates sufficient for solo-dev cadence |
| Analytics (Mixpanel / Firebase) | Defer until real user base exists; not needed for M2 launch |
| New game attributes (sound, size, rotation, 2D grid) | Future product expansion; M2 focus is monetization not gameplay expansion |
| Social features (leaderboards, sharing) | Future product expansion; not needed for solo training UX |
| Charts / streaks / per-attribute stats in M2 | M2 ships minimal local stats only; charts deferred to M3 with backend |
| Account system in M2 | Backend-free M2 means no accounts; deferred to M3 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| HARD-01 | Phase 11 | Pending |
| HARD-02 | Phase 11 | Pending |
| HARD-03 | Phase 11 | Pending |
| IAP-01 | Phase 12 | Pending |
| IAP-02 | Phase 12 | Pending |
| IAP-03 | Phase 12 | Pending |
| IAP-04 | Phase 12 | Pending |
| IAP-05 | Phase 12 | Pending |
| STAT-01 | Phase 13 | Pending |
| STAT-02 | Phase 13 | Pending |
| STAT-03 | Phase 13 | Pending |
| BRAND-01 | Phase 14 | Pending |
| BRAND-02 | Phase 14 | Pending |
| MKT-01 | Phase 14 | Pending |
| MKT-02 | Phase 14 | Pending |
| MKT-03 | Phase 14 | Pending |
| STORE-01 | Phase 15 | Pending |
| STORE-02 | Phase 15 | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18 ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-25*
*Last updated: 2026-04-25 after roadmap creation (Phases 11-15 mapped)*

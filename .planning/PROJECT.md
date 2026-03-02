# Poly N-Back

## What This Is

A science-backed cognitive training app built on the n-back paradigm — the only task consistently shown to improve fluid intelligence. Players track multiple visual attributes (color, emoji, position, shape) simultaneously across rounds, creating a "poly" n-back experience that's more engaging and challenging than classic dual n-back. Live at polynback.fun since 2023, now a production-ready codebase targeting iOS and Android app store submission.

## Core Value

The n-back gameplay loop must feel incredible — responsive, satisfying, impossible to put down. "One more round" addiction meets "I'm actually getting smarter" science credibility.

## Requirements

### Validated

<!-- Shipped and confirmed valuable -->

- ✓ Quad n-back gameplay (color, emoji, position, shape) — existing
- ✓ Configurable n-back level (1+) — existing
- ✓ Configurable timer interval — existing
- ✓ Strike-based game over (3 strikes) — existing
- ✓ Real-time correct/incorrect feedback with button animations — existing
- ✓ Score tracking with accuracy calculation — existing
- ✓ Audio feedback (correct/incorrect/game over sounds) — existing
- ✓ Audio toggle (on/off) — existing
- ✓ Game pause/resume — existing
- ✓ Tutorial overlay for first-time players — existing
- ✓ Achievement system with toast notifications — existing
- ✓ Game hints system — existing
- ✓ Mobile-responsive design with safe area support — existing
- ✓ iOS audio context unlock on user gesture — existing
- ✓ GitHub Pages deployment (polynback.fun) — existing
- ✓ Modern toolchain (Node 22, Vue 3.5, Vite 7, Pinia 3, Capacitor 8, Tailwind 4) — v1.0
- ✓ All game logic bugs fixed (division-by-zero, debounce, bounds checks, history cap) — v1.0
- ✓ Persistent storage via Capacitor Preferences with schema validation — v1.0
- ✓ Audio graceful degradation (silent play on AudioContext failure) — v1.0
- ✓ Global error handling (app.config.errorHandler + window handlers) — v1.0
- ✓ Clean architecture (audioStore, persistenceStore, composables, focused components) — v1.0
- ✓ Full TypeScript strict mode with zero type errors — v1.0
- ✓ 58 automated tests (unit + integration + E2E) with CI pipeline — v1.0
- ✓ Auto-pause on app background — v1.0
- ✓ Haptic feedback (opt-in toggle) — v1.0
- ✓ Sentry crash reporting infrastructure — v1.0

### Active

<!-- Next milestone: TBD -->

(None yet — define with `/gsd:new-milestone`)

### Out of Scope

- Laravel API backend on Forge — M2 (auth via Sanctum, social logins Google/Apple, session sync, subscription webhooks)
- RevenueCat subscription integration — M2 ($4.99/mo or $29.99/yr, handles Apple StoreKit + Google Play Billing)
- User accounts and cross-device progress sync — M2
- Stats dashboard and progression system (session history, per-attribute accuracy, streaks) — M2
- Additional game modes (Zen, Time Attack, Endless, Daily Challenge) — M2
- New attributes (sound, size, rotation, 2D grid) — M2+
- App store packaging and submission (iOS + Android) — M2
- Marketing site at polynback.com + web teaser (limited free play, funnels to app stores) — M2
- polynback.fun → polynback.com cutover — M2 launch
- Fresh visual identity / brand refresh — M2
- Social features (leaderboards, sharing) — future
- Ads of any kind — never (focus is sacred in cognitive training)
- Service worker / PWA — iOS WKWebView doesn't support service workers; Capacitor bundles assets natively
- Dark mode toggle — app is already dark-themed; toggle adds complexity without value
- i18n / localization — English-only for now; revisit when user base warrants it
- OTA updates (Capgo/Appflow) — standard app store updates sufficient
- Analytics (Mixpanel/Firebase) — defer until real user base

## Context

**Product status:** v1.0 "Harden the Foundation" shipped 2026-03-02. The codebase has been transformed from a working-but-fragile state into a production-ready foundation: modern toolchain, full TypeScript strict mode, 58 automated tests with CI pipeline, clean architecture with separated stores and composables, and native platform features. Live at polynback.fun via GitHub Pages.

**Codebase:** 4,235 LOC TypeScript + Vue. Tech stack: Vue 3.5, Vite 7, Pinia 3, Tailwind 4, Capacitor 8, TypeScript strict mode. 103 commits across 10 phases, 24 plans in v1.0.

**What's next:** The foundation is solid. Next milestone should focus on whatever gets the app into users' hands — likely app store submission, monetization infrastructure, or new game features.

**Market context:** Brain training app market is $10B+ with 19% CAGR. Poly N-Back differentiates by being the only poly (4+ attribute) n-back training app, grounded in the actual science. Competitive landscape documented in `poly-n-back-analysis.md`.

**Reference docs:**
- `ABOUT_POLY_NBACK.md` — Marketing copy, app store descriptions, website copy, FAQs, press kit
- `GAME_DESIGN.md` — Attribute catalog, game mode catalog, compatibility matrix, monetization framework, design principles
- `poly-n-back-analysis.md` — Market analysis, competitive landscape, revenue projections, strategic recommendation

**Codebase analysis:** Architecture, concerns, conventions, integrations, stack, structure, and testing documented in `.planning/codebase/`.

**Hosting plan (M2):** polynback.com hosted on Laravel Forge (dev's existing production infrastructure). Serves Laravel API backend, marketing site, and web teaser. GitHub Pages at polynback.fun stays live until cutover.

**Branch strategy:** Development happened on `feat/gsd`. `main` stays untouched to preserve live GitHub Pages deployment at polynback.fun. Merge to `main` when ready to deploy.

**Known tech debt (4 items from v1.0):**
- GameState type exported but never consumed
- `(window as any).gameStore` dev-only debug binding
- `(window as any).webkitAudioContext` Safari compat
- `.env.production` empty `VITE_SENTRY_DSN` — fill before release

## Constraints

- **Developer capacity**: Solo developer, evenings and weekends on top of 50hr/week day job — quality over speed
- **Budget**: Bootstrapped. Apple Developer $99/yr, Google Play $25, RevenueCat free tier
- **Stack**: Vue 3 + Vite + Pinia + Tailwind + Capacitor (decided — no framework switches)
- **Deployment**: polynback.fun via GitHub Pages stays live; feat/gsd branch not yet merged to main
- **Charm preservation**: The game feels good to play. Changes must protect or enhance this, never regress it

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Stay with Vue 3 + Capacitor (not React Native/Expo) | Tried rebuild — lost the charm. Existing codebase works, dev has Laravel+Vue expertise | ✓ Good |
| Freemium + subscription, no ads | Focus is sacred in cognitive training. $4.99/mo or $29.99/yr via RevenueCat | — Pending (M2) |
| polynback.com as production domain | .fun stays as legacy, .com is the brand going forward | — Pending (M2) |
| Laravel backend for API | Dev's professional stack, hosts other production sites on Forge | — Pending (M2) |
| Dependency updates first in M1 | All subsequent work should build on current foundation, not stale deps | ✓ Good — clean foundation enabled fast execution |
| Address CONCERNS.md systematically | Every documented concern becomes amplified with paying users | ✓ Good — all concerns resolved in 10 phases |
| Direct Capacitor 5→8 jump | Skip intermediate versions, fresh native project regeneration | ✓ Good — cleaner than incremental migration |
| TypeScript after architecture extraction | Types are most valuable on stable API surfaces | ✓ Good — no rework needed |
| Tests after TypeScript | Test against final typed interfaces, not shifting shapes | ✓ Good — 58 tests, no false failures |
| SPM for iOS (not CocoaPods) | Capacitor 8 default for new projects, simpler dependency management | ✓ Good |
| App ID com.polynback | Aligns with future polynback.com domain | ✓ Good |

---
*Last updated: 2026-03-02 after v1.0 milestone*

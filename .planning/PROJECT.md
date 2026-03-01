# Poly N-Back

## What This Is

A science-backed cognitive training app built on the n-back paradigm — the only task consistently shown to improve fluid intelligence. Players track multiple visual attributes (color, emoji, position, shape) simultaneously across rounds, creating a "poly" n-back experience that's more engaging and challenging than classic dual n-back. Live at polynback.fun since 2023, now becoming a monetized product on iOS and Android app stores.

## Core Value

The n-back gameplay loop must feel incredible — responsive, satisfying, impossible to put down. "One more round" addiction meets "I'm actually getting smarter" science credibility.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. Inferred from existing codebase. -->

- ✓ Quad n-back gameplay (color, emoji, position, shape) — existing
- ✓ Configurable n-back level (1+) — existing
- ✓ Configurable timer interval — existing
- ✓ Strike-based game over (3 strikes) — existing
- ✓ Real-time correct/incorrect feedback with button animations — existing
- ✓ Score tracking with accuracy calculation — existing
- ✓ High score persistence (localStorage) — existing
- ✓ Audio feedback (correct/incorrect/game over sounds) — existing
- ✓ Audio toggle (on/off) — existing
- ✓ Game pause/resume — existing
- ✓ Tutorial overlay for first-time players — existing
- ✓ Achievement system with toast notifications — existing
- ✓ Game hints system — existing
- ✓ Mobile-responsive design with safe area support — existing
- ✓ iOS audio context unlock on user gesture — existing
- ✓ Capacitor iOS and Android shell — existing
- ✓ GitHub Pages deployment (polynback.fun) — existing

### Active

<!-- Milestone 1: Harden the Foundation -->

- [ ] Update all dependencies to latest stable (Capacitor 5→8, Vite 4→7, Tailwind 3→4, Pinia 2→3, Vue 3.3→3.5)
- [ ] Fix memory leaks (timer management, unbounded stimulus history)
- [ ] Fix error handling gaps (audio failures, localStorage quota, network errors)
- [ ] Fix type safety issues (implicit coercion, missing annotations)
- [ ] Fix edge cases (early game response validation, button race conditions, division by zero)
- [ ] Extract components from monolithic App.vue (488 lines → focused components)
- [ ] Migrate to TypeScript
- [ ] Establish unit test infrastructure and coverage for game logic
- [ ] Establish integration test coverage for game flows
- [ ] Polish gameplay feel (protect the charm, improve where possible)

### Out of Scope

<!-- Milestone 2+ territory — explicitly excluded from M1 -->

- Laravel API backend — M2 (accounts, sync, subscriptions)
- RevenueCat subscription integration — M2
- User accounts and authentication — M2
- Cross-device progress sync — M2
- Stats dashboard and progression system — M2
- Additional game modes (Zen, Time Attack, Endless, Daily Challenge) — M2
- New attributes (sound, size, rotation, 2D grid) — M2
- App store submission — M2
- Marketing site at polynback.com — M2
- Web teaser conversion funnel — M2
- Social features (leaderboards, sharing) — future
- Ads of any kind — never (focus is sacred in cognitive training)

## Context

**Product status:** Live at polynback.fun since 2023 via GitHub Pages auto-deploy from `main`. The game works and has charm — players enjoy it. But the codebase has accumulated technical debt: stale dependencies (2-3 years behind), no tests, no TypeScript, a monolithic 488-line App.vue, and documented concerns around memory leaks, error handling, and edge cases.

**Why M1 now:** Before building monetization infrastructure (accounts, sync, subscriptions, app store submission), the foundation must be solid. Every concern in `.planning/codebase/CONCERNS.md` becomes amplified when real users are paying. M1 makes the codebase clean enough to build on confidently and polished enough to submit to app stores.

**Market context:** Brain training app market is $10B+ with 19% CAGR. Poly N-Back differentiates by being the only poly (4+ attribute) n-back training app, grounded in the actual science. Competitive landscape documented in `poly-n-back-analysis.md`.

**Game design reference:** Full attribute catalog, game mode catalog, compatibility matrix, monetization framework, and design principles in `GAME_DESIGN.md`.

**Codebase analysis:** Architecture, concerns, conventions, integrations, stack, structure, and testing documented in `.planning/codebase/`.

**Branch strategy:** Development happens on `feat/gsd`. `main` stays untouched to preserve live GitHub Pages deployment at polynback.fun. Merge to `main` happens when M1 is complete.

## Constraints

- **Developer capacity**: Solo developer, evenings and weekends on top of 50hr/week day job — quality over speed
- **Budget**: Bootstrapped. Apple Developer $99/yr, Google Play $25, RevenueCat free tier
- **Stack**: Vue 3 + Vite + Pinia + Tailwind + Capacitor (decided — no framework switches)
- **Deployment**: polynback.fun via GitHub Pages stays live and untouched during M1 development
- **Breaking changes**: Capacitor 5→8 and Tailwind 3→4 are major version jumps with significant breaking changes — need careful, sequential migration
- **Charm preservation**: The game already feels good to play. Changes must protect or enhance this, never regress it

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Stay with Vue 3 + Capacitor (not React Native/Expo) | Tried rebuild — lost the charm. Existing codebase works, dev has Laravel+Vue expertise | ✓ Good |
| Freemium + subscription, no ads | Focus is sacred in cognitive training. $4.99/mo or $29.99/yr via RevenueCat | — Pending (M2) |
| polynback.com as production domain | .fun stays as legacy, .com is the brand going forward | — Pending (M2) |
| Laravel backend for API | Dev's professional stack, hosts other production sites on Forge | — Pending (M2) |
| Dependency updates first in M1 | All subsequent work should build on current foundation, not stale deps | — Pending |
| Address CONCERNS.md systematically | Every documented concern becomes amplified with paying users | — Pending |

---
*Last updated: 2026-03-01 after initialization*

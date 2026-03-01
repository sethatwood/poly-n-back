# GSD New Project Handoff

Copy everything below the line into a fresh `/clear` context in this repo.

---

I'm ready to kick off `/gsd:new-project` for Poly N-Back — a science-backed cognitive training app that's been live at polynback.fun since 2023 and now needs to become a monetized product deployed to iOS and Android app stores via Capacitor, with a Laravel backend for accounts, sync, and subscriptions.

## Context: What just happened

We spent a session exploring whether to rebuild from scratch with React Native/Expo or stay with the existing Vue 3 / Capacitor codebase. We tried the rebuild — it lost all the charm. **Decision: stay with the current stack, harden the foundation, then layer on monetization infrastructure.**

We also consolidated our planning docs. Here's what exists and where:

**Root-level reference docs (product/market/design — the "what" and "why"):**
- `ABOUT_POLY_NBACK.md` — Marketing copy, app store descriptions, website copy, FAQs, press kit
- `GAME_DESIGN.md` — Attribute catalog (current + future tiers), game mode catalog, compatibility matrix, monetization framework, design principles
- `poly-n-back-analysis.md` — Market analysis ($10B+ market, 19% CAGR), competitive landscape, revenue projections, strategic recommendation

**`.planning/codebase/` (engineering analysis — already mapped):**
- `ARCHITECTURE.md`, `CONCERNS.md`, `CONVENTIONS.md`, `INTEGRATIONS.md`, `STACK.md`, `STRUCTURE.md`, `TESTING.md`

The codebase concerns in `.planning/codebase/CONCERNS.md` are the immediate priority — these need to be addressed before building monetization features on top.

## The vision (already decided)

- **Stack**: Keep Vue 3 + Vite + Pinia + Tailwind + Capacitor. Add Laravel API backend for accounts/sync/subscriptions.
- **Monetization**: Freemium + subscription via RevenueCat (handles Apple StoreKit + Google Play Billing). $4.99/month or $29.99/year. No ads ever.
- **Web strategy**: polynback.com as marketing site + web teaser (limited free play in browser, funnels to app stores).
- **Brand**: Keep "Poly N-Back" name. Fresh visual identity. Domain: polynback.com (secured).
- **Hosting transition**: The app is currently live at polynback.fun via GitHub Pages (auto-deployed from `main` via `.github/workflows/deploy.yml`). That stays running untouched during development. The end state is polynback.com hosted on Laravel Forge (where the developer hosts other production sites), serving the Laravel backend API, marketing site, and web teaser. The .fun → .com cutover happens as part of Milestone 2 launch.
- **Target feel**: "One more round" (addictive loop) + "I'm actually getting smarter" (science credibility).
- **Core value**: The n-back gameplay loop must feel incredible — responsive, satisfying, impossible to put down.

## What the GSD roadmap should cover (two major milestones)

**Milestone 1: Harden the Foundation**
- Address concerns from `.planning/codebase/CONCERNS.md` systematically (memory leaks, error handling, type safety, edge cases, test coverage)
- Component extraction from monolithic App.vue (488 lines)
- TypeScript migration
- Unit and integration test infrastructure
- Polish what exists (the game already has charm — protect it)

**Milestone 2: Monetized Platform**
- Laravel API backend (auth via Sanctum, social logins, session sync, subscription webhooks)
- RevenueCat integration for cross-platform subscriptions
- User accounts and cross-device progress sync
- Stats dashboard and progression system (session history, per-attribute accuracy, streaks, achievements)
- Multiple game modes (Zen, Time Attack, Endless, Daily Challenge)
- App store packaging and submission (Capacitor iOS + Android)
- Marketing site at polynback.com
- Web teaser for conversion funnel

## Constraints

- Solo developer, evenings and weekends on top of a 50hr/week day job
- Bootstrapped (Apple Developer $99/yr, Google Play $25, RevenueCat free tier)
- Professional expertise in Laravel + Vue — this is the comfort zone
- Timeline: ASAP, but quality over speed

## How to proceed

Please start with `/gsd:new-project`. The codebase is already mapped (`.planning/codebase/` exists). The reference docs above should give you everything you need for PROJECT.md and REQUIREMENTS.md without extensive re-questioning — the decisions are made. Focus the roadmap on the two milestones described above.

Before you begin, please create and switch to a new git branch `feat/gsd-hardening` from the current `feat/gsd` branch, and commit the current doc changes (deleted POLYNBACK_IDEA.md and AUDIT_AND_ROADMAP.md, added GAME_DESIGN.md, updated ABOUT_POLY_NBACK.md) with a message like "docs: consolidate planning docs, extract game design reference".

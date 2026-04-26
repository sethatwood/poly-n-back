# Roadmap: Poly N-Back

## Milestones

- ✅ **v1.0 Harden the Foundation** — Phases 1-10 (shipped 2026-03-02)
- 🚧 **v2.0 Monetized Platform** — Phases 11-15 (active, started 2026-04-25)

## Phases

<details>
<summary>✅ v1.0 Harden the Foundation (Phases 1-10) — SHIPPED 2026-03-02</summary>

- [x] Phase 1: Core Toolchain Upgrade (2/2 plans) — completed 2026-03-01
- [x] Phase 2: Tailwind Migration (1/1 plan) — completed 2026-03-01
- [x] Phase 3: Capacitor Migration (1/1 plan) — completed 2026-03-01
- [x] Phase 4: Linting & Bug Fixes (3/3 plans) — completed 2026-03-01
- [x] Phase 5: Store Extraction (3/3 plans) — completed 2026-03-01
- [x] Phase 6: Component Extraction (2/2 plans) — completed 2026-03-02
- [x] Phase 7: TypeScript Migration (4/4 plans) — completed 2026-03-02
- [x] Phase 8: Testing & CI (4/4 plans) — completed 2026-03-02
- [x] Phase 9: Platform Polish (2/2 plans) — completed 2026-03-02
- [x] Phase 10: Tech Debt Cleanup (2/2 plans) — completed 2026-03-02

Full details: [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

</details>

### v2.0 Monetized Platform — Active

**Phase Numbering:**
- Integer phases (11, 12, 13, 14, 15): Planned milestone work, continuing the count from v1.0
- Decimal phases (e.g., 12.1): Reserved for urgent insertions if discovered during execution

- [ ] **Phase 11: M2 Hardening** — Pre-store-submission reliability work targeting concrete bugs and gaps that interact with paid flows or App Review
- [ ] **Phase 12: In-App Purchase + Freemium Gate** — One-time $3.99 purchase with client-side StoreKit 2 / Play Billing, paywall at 2-back
- [ ] **Phase 13: Minimal Stats** — Local-only session history (timestamp, level, score, accuracy, duration), no charts or sync
- [ ] **Phase 14: Brand Refresh + Marketing Site** — Visual identity refresh, polynback.com landing page, privacy policy, FTC compliance audit
- [ ] **Phase 15: App Store Submission** — iOS + Android submission with privacy manifests, Privacy Nutrition Labels, Data Safety form

## Phase Details

### Phase 11: M2 Hardening
**Goal**: The app is reliable enough that paid flows and App Review will not surface obvious defects in audio, persistence, or end-to-end gameplay
**Depends on**: v1.0 complete (Phase 10 shipped)
**Requirements**: HARD-01, HARD-02, HARD-03
**Success Criteria** (what must be TRUE):
  1. After a fresh app launch, tapping any pre-game UI element (response button, audio toggle, tutorial dismiss, start button) unlocks AudioContext such that subsequent gameplay audio plays on iOS without silence
  2. Stored preferences with corrupted, missing, or wrong-typed fields fall back to defaults at load time without throwing or producing downstream NaN/undefined errors
  3. CI runs an E2E test on every push that drives a full game flow (start → respond to ≥5 stimuli → trigger game over → restart) and verifies high score and audio preference persist across a simulated app reload
**Plans**: TBD
**UI hint**: yes

### Phase 12: In-App Purchase + Freemium Gate
**Goal**: A user can buy the $3.99 premium unlock through the native store, free users hit a paywall when reaching for 3-back+, and a previous purchase can be restored on a fresh install
**Depends on**: Phase 11
**Requirements**: IAP-01, IAP-02, IAP-03, IAP-04, IAP-05
**Success Criteria** (what must be TRUE):
  1. A user can complete a $3.99 one-time purchase via the native StoreKit 2 (iOS) or Play Billing (Android) sheet from the paywall and immediately access n-back levels 3 and above
  2. Selecting n-back level 3 or higher as a free user opens a paywall modal with visible "Buy" and "Restore Purchases" actions, and the modal can be dismissed back to the free 1-back/2-back tier
  3. After a fresh install or device switch, tapping "Restore Purchases" with the original Apple ID / Google account re-grants premium without a second charge
  4. Premium status loaded from local Capacitor Preferences is honored on the next app launch without blocking the app from mounting (no network call required)
  5. On Android, a non-consumable purchase is acknowledged within Google Play's 3-day window so that valid purchases are not auto-refunded by the store
**Plans**: TBD
**UI hint**: yes

### Phase 13: Minimal Stats
**Goal**: A user can review their past gameplay sessions on a stats screen with the exact fields a returning player needs to see progress, stored locally and surviving app restarts
**Depends on**: Phase 12 (premium status exists; for M2 stats are free, so this is a sequencing dependency rather than a gate)
**Requirements**: STAT-01, STAT-02, STAT-03
**Success Criteria** (what must be TRUE):
  1. Completing any game session writes a record locally containing timestamp, n-back level, score, accuracy percentage, and duration in seconds
  2. The stats screen displays past sessions sorted by recency (most recent first), each row showing the five recorded fields in human-readable form
  3. Recorded sessions persist across app cold starts and device restarts via Capacitor Preferences and are still present on the stats screen after relaunch
**Plans**: TBD
**UI hint**: yes

### Phase 14: Brand Refresh + Marketing Site
**Goal**: The app and its public-facing surfaces (in-app UI, app icon, polynback.com landing page, privacy policy) all share one refreshed visual identity, and every piece of copy is FTC-compliant before any of it reaches an App Store reviewer
**Depends on**: Phase 13 (real product features exist for screenshots and feature copy)
**Requirements**: BRAND-01, BRAND-02, MKT-01, MKT-02, MKT-03
**Success Criteria** (what must be TRUE):
  1. A brand spec document defines the wordmark, primary brand color, app icon system, and type treatment, and the same identity appears in the in-app header, splash/launch screen, primary CTAs, and the iOS + Android app icons
  2. polynback.com serves a landing page with hero, gameplay screenshots, app store badge slots (placeholders until Phase 15 returns store URLs), and marketing copy
  3. polynback.com/privacy serves a privacy policy that names the data collected (local game state, IAP receipt), retention behavior, contact information, and governing jurisdiction sufficient for both App Store and Google Play submission
  4. Every user-facing string (landing page, in-app text, app store metadata draft) has been audited against the FTC Lumosity precedent: no "scientifically proven," "clinically proven," "guaranteed," or disease/treatment claims, with safe-framing patterns documented for future reuse
**Plans**: TBD
**UI hint**: yes

### Phase 15: App Store Submission
**Goal**: The app is live (or accepted for review) on both iOS App Store and Google Play with every required compliance artifact filed correctly the first time, including the specific privacy manifest entries Capacitor Preferences mandates
**Depends on**: Phase 14 (brand applied to store assets, FTC-audited copy available for store metadata)
**Requirements**: STORE-01, STORE-02
**Success Criteria** (what must be TRUE):
  1. iOS submission to App Store Connect includes a `PrivacyInfo.xcprivacy` declaring `NSPrivacyAccessedAPICategoryUserDefaults` with reason code `CA92.1` (required by Capacitor Preferences) plus all other API categories used by bundled plugins, and Privacy Nutrition Labels are filled in App Store Connect
  2. Android submission to Google Play Console has the Data Safety form completed describing local storage and IAP, and the privacy declaration matches the policy published at polynback.com/privacy
  3. App Review demo credentials (or a freely accessible free-tier walkthrough) are prepared so the reviewer can experience both the free experience and the premium upgrade flow without escalation
**Plans**: TBD

## Phase Dependency Rationale (v2.0)

- **Phase 11 first** because IAP, stats, and submission all depend on a non-flaky base: HARD-02 (persistence schema validation) directly de-risks IAP-04 (premium status persisted via Capacitor Preferences); HARD-01 (broader AudioContext unlock) prevents an embarrassing class of "audio dies after I tap a button" bug reports from paying users; HARD-03 (E2E in CI) gives a regression net for everything that follows.
- **Phase 12 before Phase 13** because the freemium gate (`iapStore`) is the single source of truth for premium entitlement. Even though M2 ships stats as a free feature, the gate must exist before any future premium-only treatment can be added cleanly. Also, IAP product IDs need to be registered in App Store Connect and Google Play Console early to absorb the up-to-24-hour propagation delay before testing.
- **Phase 13 before Phase 14** so that the marketing site's screenshots and "what's in the app" copy can capture the real, brand-applied stats screen rather than a placeholder.
- **Phase 14 before Phase 15** because store assets (icons, screenshots, listing text) must be brand-final and FTC-audited before submission. Re-uploading screenshots or revising metadata copy mid-review delays approval.
- **Phase 15 last** because submission consistently surfaces issues (privacy manifest gaps, metadata rejections, guideline 4.2 questions for Capacitor apps) that require iteration. Treating it as its own phase reserves explicit room for that loop instead of letting it bleed into other work.

## Progress

**Execution Order:**

Phases execute in numeric order: 11 → 12 → 13 → 14 → 15

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Core Toolchain Upgrade | v1.0 | 2/2 | Complete | 2026-03-01 |
| 2. Tailwind Migration | v1.0 | 1/1 | Complete | 2026-03-01 |
| 3. Capacitor Migration | v1.0 | 1/1 | Complete | 2026-03-01 |
| 4. Linting & Bug Fixes | v1.0 | 3/3 | Complete | 2026-03-01 |
| 5. Store Extraction | v1.0 | 3/3 | Complete | 2026-03-01 |
| 6. Component Extraction | v1.0 | 2/2 | Complete | 2026-03-02 |
| 7. TypeScript Migration | v1.0 | 4/4 | Complete | 2026-03-02 |
| 8. Testing & CI | v1.0 | 4/4 | Complete | 2026-03-02 |
| 9. Platform Polish | v1.0 | 2/2 | Complete | 2026-03-02 |
| 10. Tech Debt Cleanup | v1.0 | 2/2 | Complete | 2026-03-02 |
| 11. M2 Hardening | v2.0 | 0/TBD | Not started | — |
| 12. In-App Purchase + Freemium Gate | v2.0 | 0/TBD | Not started | — |
| 13. Minimal Stats | v2.0 | 0/TBD | Not started | — |
| 14. Brand Refresh + Marketing Site | v2.0 | 0/TBD | Not started | — |
| 15. App Store Submission | v2.0 | 0/TBD | Not started | — |

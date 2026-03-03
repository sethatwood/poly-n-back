# Feature Research: v2.0 Monetized Platform

**Domain:** Brain training / cognitive training mobile app — freemium monetization, stats, game modes, social auth, cross-device sync, marketing site
**Researched:** 2026-03-02
**Confidence:** MEDIUM-HIGH (verified against competitor analysis, App Store requirements, and industry patterns)

## Context

This is the M2 research document. The v1.0 foundation is complete: a polished, tested, TypeScript Capacitor app with quad n-back gameplay. M2 adds monetization, accounts, progression, new modes, and a marketing presence. The existing gameplay loop is already strong — M2 must extend it without breaking it.

**Framing:** This isn't a new product. It's a monetized version of something that already works. Every feature judgment is filtered through: does this add to the "one more round" experience, or does it introduce friction that kills it?

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist in a paid brain training app. Missing these = product feels incomplete or untrustworthy.

#### Monetization & Purchase

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Freemium tier with clear free value | Users evaluate before paying. A completely locked app gets uninstalled immediately. Free tier must deliver genuine cognitive training value, not a taste-tease. | LOW | Free = quad n-back capped at 2-back, no stats history, no game modes beyond core. Clear but not punitive. |
| Transparent paywall gate | Users must understand exactly what they're buying before they pay. Surprise paywalls after investment = rage reviews. | LOW | Show locked indicators on mode/level selectors with clear "Unlock all levels & modes — $3.99" messaging. Not a popup wall — an inline signal. |
| One-time purchase (not subscription) | Cognitive training users are highly resistant to subscriptions for "practice tools." Competitors like Lumosity switched to subscription and lost goodwill. One-time purchase signals fairness and respects users. | MEDIUM | Implemented via native StoreKit 2 (iOS) and Google Play Billing 7.x (Android). Needs server-side receipt validation via the Laravel backend. |
| Purchase restoration | Apple requires "Restore Purchases" button. Users upgrading devices expect their purchase to follow them. Failing here = 1-star review explosion. | LOW | Call `restorePurchases()` on the IAP plugin. Surface as a button in settings/paywall screen. |
| Paywall accessible from settings | Users who upgrade devices need to find the restore/purchase path without starting a new game. | LOW | Settings screen with "Upgrade" section always visible to non-premium users. |

#### User Accounts & Sync

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Social login (Google + Apple) | Password entry on mobile is a conversion killer. Users expect "Continue with Google" or "Sign in with Apple" — not email + password form. | MEDIUM | Apple Sign-In is required by App Store guidelines if any social login is offered. Google covers Android-first users. Both via Laravel Socialite on backend. |
| Sign In with Apple (mandatory) | Apple App Store Review Guideline 4.8: apps offering third-party social login must also offer Sign in with Apple. Violation = rejection. | MEDIUM | Privacy-first (email relay, no tracking). Laravel Socialite has Apple driver. |
| Cross-device progress sync | Users with iPhone + iPad, or who upgrade phones, expect their levels and history to persist. "I lost my data" is a common 1-star trigger. | HIGH | Session history, premium status, personal bests synced via Laravel API. Offline-first: local writes with periodic background sync. Conflict resolution: last-write-wins is sufficient for non-collaborative data. |
| Account deletion | Apple App Store requires account deletion capability (since 2022). Failure to implement = rejection. | LOW | "Delete account" flow in settings. Laravel: soft-delete user, queue data deletion. |
| Guest / play-without-account option | Forcing account creation before letting users play kills conversion. Users need to experience the game before committing. | LOW | App starts unauthenticated. Account prompt appears at paywall or after first session. Never before. |

#### Stats & Progression

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Session history list | Users want to see their training record. A blank stats page after 10 sessions = app feels broken. | MEDIUM | Store session metadata: date, duration, n-back level, mode, overall accuracy. Display as reverse-chronological list. |
| Overall accuracy over time (chart) | The primary cognitive training value prop is improvement. Without a visible trendline, users have no evidence it's working and churn. | MEDIUM | Simple line chart showing accuracy percentage per session. Use a lightweight chart library (Chart.js or uPlot). No fancy AI needed — just a trendline. |
| Current streak (days trained) | Streak systems reduce 30-day churn by ~35% (Forrester 2024 data). Every brain training competitor has this. Missing it = users feel no pull to return daily. | LOW | Track last-trained date in persistenceStore. Show "🔥 5-day streak" on home screen. Break on missed day, not missed session. |
| Personal best tracking | Users want to know their record n-back level achieved. Clear goal to beat. | LOW | Store `highestNBackAchieved` per mode. Already partially done in v1.0 score tracking — extend it. |
| Per-attribute accuracy breakdown | Poly N-Back's USP is four simultaneous attributes. Showing which attribute a user struggles with (position vs. color vs. emoji vs. shape) is directly actionable coaching. No competitor offers this because most have single-attribute games. | MEDIUM | Per session: track hits/misses per button type. Store as `{ position: 0.72, color: 0.91, emoji: 0.65, shape: 0.88 }`. Display as bar chart or attribute card grid. |

#### Game Modes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Zen Mode | Users burned out by strike-based pressure need an accessible entry point. Without a no-pressure mode, casual users self-select out. | LOW | Disable strike system. No game-over. Session ends on user tap. Timer pressure optional. All scoring/stats still tracked. |
| Time Attack (2-minute sprint) | Competitive users want fixed-duration challenges for consistent comparison and scheduling. "I have 2 minutes" is a real user behavior. | LOW | Fixed 120-second countdown. Game ends at zero. Score compared to personal best. Uses existing game loop — just add a countdown timer. |
| Daily Challenge (fixed seed) | Creates daily return habit and social currency ("I got 87% today, what did you get?"). Spelunky, Wordle, and dozens of games proved this pattern. | MEDIUM | Seed = YYYY-MM-DD string hashed to RNG seed. Same seed = identical stimulus sequence for all players on that day. One attempt per day per user. Server provides today's seed to prevent cheating. |
| Endless Mode (progressive difficulty) | Advanced users who blow past 5-back need a true progression challenge. Without it, expert users have no ceiling. | MEDIUM | Start at user's current n-back level. Auto-promote after N consecutive correct rounds (e.g., 3). Auto-demote after 2 misses. Session continues until user quits. Log final level reached. |

#### App Store & Store Listing

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| App Store listing (iOS + Android) | The app doesn't exist for users until it's in the stores. | HIGH | App Store Connect + Google Play Console. Screenshots, description, keywords, privacy policy URL, age rating. Apply for App Store subscription entitlements only for IAP, not subscription. |
| Privacy policy at polynback.com/privacy | Required by both stores. Required to be linked in App Store Connect. | LOW | Static page. "We collect: email (if you sign in), session stats (if syncing). We do not sell data." Simple and honest. |
| App review demo credentials | If reviewers can't test premium features, they'll reject the app. Include test account credentials in App Review notes with premium already unlocked. | LOW | Create a test account with premium unlocked via a backend flag. Include in submission notes. |

#### Marketing Site

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Marketing landing page at polynback.com | Users who hear about the app via word of mouth or press will Google it. No website = no credibility. | MEDIUM | Hero, value prop, screenshots, App Store + Google Play badges, FAQs. Static or Laravel blade view. |
| App store download badges (iOS + Android) | Standard convention. Users expect to tap a badge and go directly to the store listing. Missing = unprofessional. | LOW | Official Apple and Google badge assets with deep links to app store listings. |
| Privacy policy page | Required for store listing. Must be a live, accessible URL — not a PDF or in-app only. | LOW | polynback.com/privacy — static content, consistent with in-app policy. |
| polynback.fun → polynback.com redirect | The existing live URL needs to continue working while brand transitions. Users who bookmarked it should land on the new domain. | LOW | 301 redirect from polynback.fun to polynback.com. GitHub Pages supports custom redirects via HTML meta refresh or Cloudflare redirect rules. Keep GitHub Pages live during transition. |

---

### Differentiators (Competitive Advantage)

Features that set Poly N-Back apart. Not required, but each one meaningfully improves conversion, retention, or brand.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Per-attribute accuracy stats | No n-back competitor shows per-attribute breakdown because they only have 1-2 attributes. This is a direct translation of Poly N-Back's unique 4-attribute gameplay into unique analytical value. "You're good at color matching but weak on position — focus there." | MEDIUM | High-value, low-marginal-cost. Per-session data already tracked in gameplay; this is storage + visualization. |
| Science credibility framing | Brain training space has FTC scrutiny (Lumosity $2M fine in 2016). Apps that lean into legitimate n-back research without overclaiming convert better with the target audience (students, knowledge workers, parents). | LOW | Copy-driven. Already documented in ABOUT_POLY_NBACK.md. Translate to landing page, App Store description, and onboarding screen. No extra engineering. |
| No subscription, no ads, ever | In a market dominated by aggressive subscription models (Lumosity, Peak, Elevate), a one-time $3.99 with no hidden costs is a meaningful differentiator. Users explicitly search for "brain training without subscription." | LOW | Position this in marketing and paywall copy. Existing PROJECT.md decision confirms ads are never. |
| Quad n-back (4 simultaneous attributes) | Dual n-back is the scientific standard. Poly N-Back extends to 4 attributes simultaneously — genuine novelty in the space. No other published app does this at quad level. | EXISTING | Core gameplay already built. Needs better marketing articulation, not engineering. Ensure app store screenshots and marketing site showcase all 4 attributes clearly. |
| Daily Challenge with date-seeded RNG | Most n-back apps have no social sharing moment. Daily Challenge creates a daily conversation point. Implemented correctly (deterministic seed from date), it requires no server infrastructure beyond seed delivery. | MEDIUM | Seed generation is trivial. The challenge is: enforce one-attempt-per-day without backend games. Use server-issued seed with UTC date to prevent local time manipulation. |
| Fresh visual identity | The existing UI is functional but generic. Competitors like Elevate and Peak have invested in distinctive visual languages. A coherent brand (wordmark, color system, iconography) increases perceived value and App Store screenshot quality. | MEDIUM | Solo dev — use AI tooling (Midjourney, Figma AI, or Canva Brand Kit) to establish identity without hiring a designer. Core decisions: primary color, wordmark, app icon system. Apply consistently to app + site. |
| Offline-first with sync on reconnect | Users train on subway, airplane, and gym where connectivity is intermittent. Offline-first = game always works. Sync on reconnect = data preserved when connectivity returns. Shows architectural maturity. | HIGH | Already partial: Capacitor Preferences persist locally. Add: queue failed sync attempts, replay on reconnect. Laravel endpoint accepts timestamped session payloads. |

---

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem like good ideas but create problems disproportionate to their value for this product at this stage.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Subscription model (monthly/yearly) | Higher LTV per user theoretically | Brain training users specifically resist subscriptions ("it's a practice tool, not a service"). Market data shows paid one-time is fastest-growing segment in 2025. Subscription adds entitlement management complexity, refund policy complexity, and ongoing churn pressure. | One-time $3.99 as planned. Revisit subscription as M3 only if one-time revenue validates the audience size. |
| RevenueCat | Subscription management made easy | RevenueCat is optimized for subscriptions. For a one-time purchase-only app, it adds an unnecessary third-party SDK, a monthly cost after thresholds, and a dependency that complicates the simple "buy once, own forever" transaction. Overkill. | Direct StoreKit 2 + Google Play Billing via `capacitor-native-purchases`. Server-side validation via Laravel. Simple, no ongoing cost. |
| Social leaderboards | Competitive motivation; "compare with friends" | Leaderboards in cognitive training create anxiety for below-average performers (the majority) and skew the product toward gaming over training. They require moderation infrastructure. They produce fake accounts and score inflation. Per PROJECT.md: out of scope for M2, future consideration. | Streak counts and personal best tracking give competitive users something to beat without the infrastructure and anxiety of leaderboards. |
| Ads of any kind | Revenue without user payment | Ads fracture the focus experience that is literally the product's core value proposition. A brain training app with ads is a self-defeating product. Users in focus mode should not be interrupted. Per PROJECT.md: "never." | Pure IAP revenue. Small audience of paying users is better than large audience of distracted ad-viewers for this product. |
| Email/password authentication | Familiar login pattern | Mobile users have universally adopted social login. Email + password requires: secure password hashing, forgot password flow, email verification flow, and still ends up being lower conversion than social login. Doubles auth surface area for no UX gain. | Google Sign-In + Sign in with Apple covers 95%+ of users. No email/password needed. |
| Real-time multiplayer / head-to-head | "Play with friends" appeal | Real-time sync across two game instances requires WebSocket infrastructure, match-making, and fundamentally changes the game from a solo practice tool to a competitive game. Different product category, different user expectation. | Daily Challenge creates shared experience (same sequence, same day) without live infrastructure. |
| Push notifications (aggressive) | Re-engagement / retention | Cognitive training apps that send daily push notifications are among the most aggressively uninstalled categories. Users feel nagged. Low-quality notification strategies damage the brand. | Optional streak reminder notification only, user-configured. "You haven't trained today" at user-chosen time, off by default. |
| Full analytics suite (Mixpanel, Firebase) | Data-driven iteration | Zero users currently. Analytics before users is premature optimization. Adds privacy policy burden, consent flow engineering, GDPR compliance surface area, and another SDK. Sentry already provides error signal. | Add analytics in M3 after real user base exists. Sentry covers error signal. Manual review of session data from own Laravel backend provides behavior insight. |
| Dark mode toggle | User preference | App is already dark-themed. A toggle requires full light-mode design system, doubles visual testing surface, and adds UI complexity. The dark theme is part of the "focus zone" brand identity — it should not be optional. | Keep dark-only. It's a feature, not a limitation. |
| Multiple n-back attribute sets (new shapes, sounds) | Variety | Attribute variety is a future-milestone feature (per PROJECT.md "Out of Scope"). Adding new attributes before cross-device sync and IAP are solid adds combinatorial complexity to testing all modes × all attributes. | Ship the 4 existing attributes perfectly. Document attribute catalog for M3. |
| Onboarding wizard (multi-step) | First-time user guidance | The existing tutorial overlay already handles onboarding. A lengthy wizard delays the first game session — the moment users decide if the app is worth keeping. Every screen between download and first stimulus is churn opportunity. | Keep existing single-overlay tutorial. Move it to appear on first game start, not app launch. |
| Web app / PWA at polynback.com | Reach web users | iOS WKWebView doesn't support service workers. Web delivery requires a separate distribution, build, and test path. The marketing site at polynback.com is not the web app — it's the storefront for the native apps. | polynback.fun stays as legacy web demo. polynback.com is the marketing site. Native apps are the product. |

---

## Feature Dependencies

```
User accounts (social login)
    └──requires──> Laravel API backend
    └──requires──> Apple Sign-In (mandatory if Google offered)
    └──enables──> Cross-device sync
    └──enables──> Daily Challenge (server-issued seed, one-attempt enforcement)
    └──enables──> Stats persistence beyond device
    └──enables──> Purchase receipt validation

IAP (one-time purchase)
    └──requires──> Native app in app stores (iOS + Android)
    └──requires──> Laravel API (receipt validation endpoint)
    └──requires──> User accounts (to persist premium status cross-device)
    └──enables──> Freemium gate logic (check premium status before unlocking)

App Store submission (iOS + Android)
    └──requires──> App icons, splash screen (done in v1.0)
    └──requires──> Privacy policy live at polynback.com/privacy
    └──requires──> marketing site (polynback.com must exist before review)
    └──requires──> IAP configured in App Store Connect / Google Play Console

Stats dashboard
    └──requires──> Session data model (schema for stored sessions)
    └──requires──> persistenceStore extension (save per-session data)
    └──requires──> Premium gate (stats are paid feature)
    └──enhances with──> User accounts (sync history cross-device)

Game modes (Zen, Time Attack, Endless, Daily Challenge)
    └──requires──> Existing game loop (already built — modes are configuration layers)
    └──requires──> Premium gate (modes are paid feature)
    Daily Challenge additionally requires──> Server-issued daily seed
    Daily Challenge additionally requires──> One-attempt enforcement (server or client)

Marketing site (polynback.com)
    └──requires──> Laravel backend is live
    └──requires──> App Store listings exist (to link the badges)
    └──requires──> Privacy policy content written
    └──enhances──> Brand refresh (visual identity applied to site)

Brand refresh
    └──enhances──> App Store screenshots (more professional listing)
    └──enhances──> Marketing site (visual identity consistency)
    └──has no hard blockers──> Can start independently of backend work

Cross-device sync
    └──requires──> User accounts
    └──requires──> Laravel API (sync endpoints)
    └──requires──> Session data model defined
```

### Dependency Notes

- **IAP requires app store listings:** You cannot configure IAP products in App Store Connect or Google Play Console until the app is registered. App registration should happen early.
- **User accounts gate multiple features:** Accounts, sync, Daily Challenge enforcement, and premium persistence all depend on the Laravel backend. Backend is the critical path dependency for the second half of M2.
- **Game modes are configuration layers, not rewrites:** Zen, Time Attack, Endless all reuse the existing game loop. They are low-risk additions. Daily Challenge adds server dependency.
- **Brand refresh is independent:** Design work can happen in parallel with backend work. Apply brand to site and screenshots when both are ready.
- **Marketing site requires app store listings to be complete:** You can't include real download badge links until the app is live. Build the site structure first, add live links post-submission.

---

## MVP Definition for M2

### Launch With (v2.0)

Minimum set to ship a monetized, reviewable product.

- [ ] App Store + Google Play listings live — without this, nothing else matters
- [ ] One-time IAP ($3.99) with purchase + restore — monetization core
- [ ] Freemium gate (2-back cap for free, all levels for paid) — defines the value exchange
- [ ] Google Sign-In + Sign in with Apple — required for App Store (Apple mandate) and reduces friction
- [ ] Account creation / guest mode — account required for sync, but game must work without it
- [ ] Cross-device premium status sync — buying on iPhone must unlock on iPad
- [ ] Session history storage (local + synced) — users expect to see their history
- [ ] Streak tracking — strongest retention lever, lowest engineering cost
- [ ] Privacy policy at polynback.com/privacy — required for both store submissions
- [ ] Marketing landing page at polynback.com — storefront for the product
- [ ] polynback.fun → polynback.com redirect — legacy URL continuity

### Add After Validation (v2.x)

Features that make M2 better but are not blocking.

- [ ] Per-attribute accuracy charts — after session data model is live and populated, add visualization layer
- [ ] Zen Mode — very low complexity, add once core game modes are stable
- [ ] Time Attack Mode — low complexity, add once core game modes are stable
- [ ] Endless Mode — moderate complexity, add after simpler modes are tested
- [ ] Daily Challenge — add after server infrastructure is live; seed delivery is simple, one-attempt enforcement needs design
- [ ] Progression accuracy trendline chart — after sufficient session history exists to make it meaningful
- [ ] Brand refresh applied to app — after visual identity is established, apply to UI

### Future Consideration (v3+)

Explicitly deferred.

- [ ] Leaderboards / social features — per PROJECT.md, future milestone
- [ ] Subscription layer — revisit if one-time revenue validates demand
- [ ] Analytics suite — add when real user base exists to analyze
- [ ] New attributes (sound, size, etc.) — per PROJECT.md, future milestone
- [ ] RevenueCat — reconsider only if subscription model is added

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| App Store submission (iOS) | HIGH | HIGH | P1 |
| App Store submission (Android) | HIGH | MEDIUM | P1 |
| One-time IAP | HIGH | MEDIUM | P1 |
| Freemium gate (2-back cap) | HIGH | LOW | P1 |
| Sign in with Apple | HIGH | MEDIUM | P1 (App Store required) |
| Google Sign-In | HIGH | MEDIUM | P1 |
| Cross-device premium sync | HIGH | MEDIUM | P1 |
| Guest/unauthenticated mode | HIGH | LOW | P1 |
| Session history storage | HIGH | MEDIUM | P1 |
| Privacy policy (polynback.com/privacy) | HIGH | LOW | P1 (store required) |
| Marketing site (polynback.com) | HIGH | MEDIUM | P1 |
| Streak tracking | HIGH | LOW | P1 |
| Purchase restoration | HIGH | LOW | P1 (Apple required) |
| Account deletion | MEDIUM | LOW | P1 (Apple required) |
| polynback.fun → polynback.com redirect | MEDIUM | LOW | P1 |
| Zen Mode | MEDIUM | LOW | P2 |
| Time Attack Mode | MEDIUM | LOW | P2 |
| Endless Mode | MEDIUM | MEDIUM | P2 |
| Per-attribute accuracy breakdown | HIGH | MEDIUM | P2 |
| Accuracy trendline chart | HIGH | MEDIUM | P2 |
| Daily Challenge | MEDIUM | MEDIUM | P2 |
| Brand refresh | MEDIUM | MEDIUM | P2 |
| Personal best tracking | MEDIUM | LOW | P2 |
| Optional streak reminder notification | LOW | LOW | P3 |

**Priority key:**
- P1: Required for v2.0 launch (blocking)
- P2: Significant value, add in v2.x (enhancing)
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | Lumosity | Peak | Elevate | Dual N-Back (generic) | Poly N-Back M2 |
|---------|----------|------|---------|----------------------|----------------|
| Monetization | Subscription ($11.99/mo or $59.99/yr) | Subscription ($3.99/mo) | Subscription ($2.99/mo) | Mostly free/ads | One-time $3.99 (no subscription) |
| Free tier | 3 games/day | Limited games | 5 games/day | Full game, fewer modes | Core quad n-back, 2-back cap |
| Social login | Email only | Email only | Google + Apple | None | Google + Apple |
| Stats depth | Per-game scores, age comparison | Brain map, comparative stats | Weekly reports | Basic score | Per-attribute + session history + trendline |
| Game modes | Fixed daily 15-min workout | Multiple games, single-attribute | Writing/math focus | Configurable n-back | Zen, Time Attack, Endless, Daily Challenge |
| Cross-device sync | Yes (subscription) | Yes (subscription) | Yes (subscription) | No | Yes (with account) |
| Attributes tracked | Single per game | Single per game | Single per game | 2 (position + audio) | 4 simultaneous (position, color, emoji, shape) |
| Science credibility | Moderate (FTC issues) | Moderate | Moderate | High (n-back research) | High (n-back + honest claims) |
| Marketing site | lumosity.com (heavy, subscription-push) | peakapp.co (minimal) | elevateapp.com (moderate) | None or minimal | polynback.com (clean, credibility-first) |

**Key observation:** No competitor offers a one-time purchase model at this price point. The "no subscription" positioning is genuinely differentiated in 2026.

---

## Sources

### Verified (MEDIUM-HIGH confidence)
- [Brain Training Apps Market Report 2025-2033](https://www.snsinsider.com/reports/brain-training-apps-market-8665) — Freemium 45.24% market share; Paid fastest-growing at 19.20% CAGR
- [Peak App on Google Play](https://play.google.com/store/apps/details?id=com.peak.brain&hl=en_US) — Peak subscription pricing ($3.99/mo) and freemium structure
- [Sign in with Apple — Apple Developer](https://developer.apple.com/sign-in-with-apple/) — Mandatory when any third-party social login offered (App Store guideline 4.8)
- [App Store Requirements 2026](https://natively.dev/articles/app-store-requirements) — SDK requirements, submission checklist, AI disclosure rules
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) — Account deletion requirement, IAP rules, completeness requirements
- [Streaks and Milestones for Gamification](https://www.plotline.so/blog/streaks-for-gamification-in-mobile-apps) — 40-60% higher DAU with streak + milestone systems
- [Social Login Rise 2025](https://www.marketingscoop.com/marketing/the-rise-of-social-logins-which-platforms-do-users-prefer-in-2024/) — Google 10%, Apple 5% and growing; mobile social login as expected pattern
- [Capacitor In-App Purchases Guide](https://capacitorjs.com/docs/guides/in-app-purchases) — Official Capacitor IAP guidance
- [Cap-go Capacitor Native Purchases](https://github.com/Cap-go/capacitor-native-purchases) — StoreKit 2 + Google Play Billing 7.x plugin
- [Daily Challenge Mode — Spelunky Wiki](https://spelunky.fandom.com/wiki/Daily_Challenge_Mode) — Fixed-seed daily mode pattern documentation
- [App Landing Page Best Practices](https://webflow.com/blog/app-landing-page) — Marketing site structure and conversion patterns
- [Offline-First Sync Patterns](https://developersvoice.com/blog/mobile/offline-first-sync-patterns/) — Mobile sync architecture patterns
- [Free Brain Training Without Subscription](https://moadly.app/blog/en/free-non-subscription-brain-training-games-like-luminosity) — User demand evidence for non-subscription models

### Community / Industry Pattern (LOW-MEDIUM confidence)
- [Brain Training Competitive Analysis (Brainturk)](https://www.brainturk.com/comparing-brain-training-apps) — Feature matrix across Lumosity, Peak, Elevate, Neuronation
- [Impulse Brain Training Paywall Analysis (ScreensDesign)](https://screensdesign.com/showcase/impulse-brain-training) — Paywall strategy patterns
- [JMIR Formative Research — Cognitive Training Engagement](https://formative.jmir.org/2025/1/e80027) — More weeks of use correlates with reported cognitive improvement
- Forrester 2024 (cited via plotline.so) — Dual streak+milestone system reduces 30-day churn 35% vs. non-gamified

---

*Feature research for: Poly N-Back v2.0 Monetized Platform*
*Researched: 2026-03-02*

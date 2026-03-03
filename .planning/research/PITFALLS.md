# Pitfalls Research

**Domain:** Adding monetization, backend API, social login, app store submission, and cross-device sync to an existing Vue/Capacitor brain training app
**Researched:** 2026-03-02
**Confidence:** HIGH (IAP, App Store rules, FTC claims) | MEDIUM (Capacitor social login edge cases, offline sync conflict resolution)

---

## Critical Pitfalls

### Pitfall 1: Client-Side IAP Trust — The Paywall Bypass Vulnerability

**What goes wrong:**
The Vue layer checks a Pinia store value (`isPremium: true`) to decide whether to show gated content. If the IAP transaction is verified only on the client side, a determined user can set `isPremium = true` in the console, or on a jailbroken device run tools like "iAPCracker" that fake StoreKit responses. The paywall evaporates. For a $3.99 one-time purchase, this is a real attack vector.

**Why it happens:**
Capacitor plugins return a purchase result to JavaScript. Developers trust that result and set premium state immediately. It feels complete — the store returned success. The missing step is that only Apple/Google servers can authoritatively confirm a purchase happened.

**How to avoid:**
- Never grant entitlement from client-side purchase result alone.
- On purchase success, send the transaction receipt/token to the Laravel backend.
- Backend verifies with Apple App Store Server API (for iOS) or Google Play Developer API (for Android).
- Only after backend confirmation does the server mark the user's account as premium.
- Premium status is fetched from the server on app launch, not inferred from local state.
- For the web/GitHub Pages version, this is moot — but for native app builds, it is mandatory.

**Warning signs:**
- Pinia `isPremium` flag set from JS before backend confirmation
- No `/api/verify-purchase` endpoint in the Laravel API
- Premium state stored only in Capacitor Preferences (local storage)

**Phase to address:** IAP phase (before App Store submission)

---

### Pitfall 2: Apple Requires Sign In with Apple When Offering Google Sign-In

**What goes wrong:**
App Store guideline 4.8: if your app allows users to sign in via any third-party service (Google, Facebook, etc.), you must also offer an equivalent privacy-focused login option — meaning Sign In with Apple. Apps that offer Google Sign-In without Apple Sign-In get rejected at review.

**Why it happens:**
Developers add Google Sign-In first (usually easier to configure), test it, ship it to review, and get hit with the 4.8 rejection. Apple's wording changed in early 2024 — the "exclusively" qualifier was removed, meaning the rule now applies even if you also have email/password login.

**How to avoid:**
- Build Sign In with Apple and Google Sign-In together in the same phase, not sequentially.
- Sign In with Apple is required if ANY social/third-party login is offered.
- Sign In with Apple must use `ASWebAuthenticationSession` on Capacitor, not a WKWebView — Apple rejects implementations that use a custom web view for the sign-in flow.
- The SIWA button must meet Apple's visual guidelines exactly (color, sizing, corner radius). Deviations cause rejection.
- Test SIWA on a real device — it does not work in the iOS Simulator.

**Warning signs:**
- Only Google Sign-In configured with no Apple fallback
- SIWA button using custom styling that doesn't match Apple's requirements
- SIWA flow implemented via WKWebView instead of native ASWebAuthenticationSession

**Phase to address:** Auth/social login phase (must ship both providers together)

---

### Pitfall 3: FTC Compliance — "Scientifically Proven" Brain Training Claims

**What goes wrong:**
Any marketing copy or App Store description claiming the app will "improve your fluid intelligence," "increase IQ," "enhance memory," or "scientifically proven to make you smarter" exposes the developer to FTC enforcement action. In 2016, Lumosity paid $2M to settle. In 2016, LearningRx paid $200K. The FTC continues to monitor this space. Apple's App Store review team also flags unvalidated health claims and can reject or remove the app.

**Why it happens:**
Brain training is the product's core value prop. Developers write enthusiastic marketing copy that makes strong causal claims. The science around n-back training and fluid intelligence is real but contested — the research shows correlation and potential, not proof that any specific commercial app delivers specific outcomes to specific users.

**How to avoid:**
- Distinguish claims: "n-back training is associated with improvements in working memory" (supportable) vs. "Our app will improve your fluid intelligence by 20%" (FTC target).
- Safe framing patterns: "practice the task most associated with..." / "based on n-back research" / "train the cognitive skills studied in..." — these describe the science without guaranteeing personal outcomes.
- Never claim the app treats, prevents, or mitigates any medical condition (ADHD, dementia, Alzheimer's, TBI, autism).
- The App Store description, app screenshots, in-app copy, marketing site, and social posts all count as advertising under FTC jurisdiction — they must be consistent.
- The existing `ABOUT_POLY_NBACK.md` marketing copy must be audited for compliance before any of it appears in App Store listings or on polynback.com.

**Warning signs:**
- App Store description uses "proven," "clinically," "scientifically proven," or "guaranteed to improve"
- Copy claims cognitive benefits will transfer to real-world tasks (the "far transfer" claim the FTC targeted)
- Marketing site makes different (bolder) claims than the App Store listing

**Phase to address:** Marketing site + App Store metadata phase (before first submission)

---

### Pitfall 4: Google Play Billing — Unacknowledged Purchase Auto-Refund

**What goes wrong:**
On Android, if your app purchases a product but fails to acknowledge it within 3 days, Google Play automatically refunds the user and revokes the purchase. Unlike iOS, Google Play does not handle acknowledgment automatically — you must call `BillingClient.acknowledgePurchase()`. If this call fails silently (network error, app backgrounded, etc.), the user paid but you must refund them 3 days later.

**Why it happens:**
iOS StoreKit 2 handles transaction finalization for non-consumables with `transaction.finish()`, which is more forgiving. Google Play Billing has a separate acknowledgment requirement that is easy to miss, especially when testing only the happy path. Many Capacitor IAP plugins handle this internally, but if using a lower-level plugin or custom integration, it must be called explicitly.

**How to avoid:**
- Verify that the Capacitor IAP plugin used automatically acknowledges non-consumable purchases. If not, implement acknowledgment explicitly.
- After verifying purchase with backend, send acknowledgment to Google Play.
- On app launch, check for purchases in `PURCHASED` state that are not yet acknowledged and acknowledge them.
- Handle the `PENDING` purchase state separately — do not grant entitlement until a `PENDING` purchase transitions to `PURCHASED` state.
- Never grant access based on `PENDING` state purchases (common when users pay via carrier billing or deferred payments).

**Warning signs:**
- Capacitor IAP plugin integration missing explicit acknowledgment call
- No handling of `PENDING` purchase state in the purchase flow
- No on-launch check for unacknowledged purchases
- Testing only via sandbox accounts on Android (doesn't simulate all edge cases)

**Phase to address:** IAP phase (Android implementation specifically)

---

### Pitfall 5: Migrating Local-Only Data to Server Sync Without Losing User History

**What goes wrong:**
The app currently stores all user data in Capacitor Preferences (iOS Keychain / Android SharedPreferences): high scores, achievements, game settings, tutorial completion, audio preferences. When accounts are introduced, users expect their existing data to carry over. If migration is not designed, a user creates an account and sees a blank profile — their months of progress gone.

**Why it happens:**
Backend sync is designed for new users. Existing users are an afterthought. The migration path (local data → account → server) requires a specific "first login" flow that reads local state, uploads it, then uses server as source of truth going forward.

**How to avoid:**
- Design a "first account creation" migration flow:
  1. User taps "Create Account."
  2. App reads all local Capacitor Preferences data.
  3. Data is uploaded to the backend as the user's initial state.
  4. Server becomes source of truth from this point forward.
  5. Local preferences remain as cache/offline fallback.
- For "log into existing account on a new device," server state wins — but warn users before overwriting if local data exists.
- Soft-delete local data after successful sync (don't immediately wipe it).
- Test the migration path explicitly: user who has played for weeks, creates account, all data preserved.

**Warning signs:**
- Backend API designed only for fresh users with no migration endpoint
- No "upload local state" step in account creation flow
- Local Preferences cleared on login without server confirmation of receipt

**Phase to address:** Auth + user accounts phase

---

### Pitfall 6: Sanctum Token Management — No Refresh Flow Means Forced Re-Login

**What goes wrong:**
Laravel Sanctum issues personal access tokens with configurable expiration. If the token expires while the user is offline (which happens in a mobile app used sporadically), the next API call returns 401 Unauthorized. Without a refresh flow, the app either crashes the API call silently or forces the user to log in again — losing game context.

**Why it happens:**
Sanctum's default token model does not include refresh tokens — unlike OAuth2's access/refresh token pair, Sanctum issues one durable token. Developers either set expiration too short (frequent logouts) or disable expiration entirely (security risk). The mobile app offline-first pattern makes this worse because tokens can age undetected.

**How to avoid:**
- Use long-lived Sanctum tokens (30–90 days) for mobile apps where forced re-login is extremely disruptive.
- Implement token rotation: on each successful API response, the backend can issue a new token and invalidate the old one.
- Store tokens in Capacitor's secure storage (iOS Keychain / Android Keystore) — not in localStorage or Capacitor Preferences, which are not encrypted.
- On 401 response: attempt one token refresh before presenting the login screen.
- On app foreground (Capacitor App state change event): ping the backend to validate token freshness before user attempts a sync.
- Run a scheduled Laravel command (`sanctum:prune-expired`) to clean the personal_access_tokens table.

**Warning signs:**
- Token stored in Capacitor Preferences (plaintext on Android)
- No 401 handler in Axios/fetch interceptor
- Token expiration set to `null` (never expires — security risk)
- No mechanism to detect stale tokens before user hits a sync error

**Phase to address:** Auth/backend phase

---

### Pitfall 7: Capacitor IAP Testing — "Product Not Found" During Development

**What goes wrong:**
Developers set up products in App Store Connect or Google Play Console, write the integration code, run the app in development — and get "Product not found" or empty product arrays. The integration looks broken. Hours are lost debugging the plugin, the product IDs, or the native build — when the actual cause is that newly created products take up to 24 hours to propagate to the Sandbox API, and Android APK-sideloaded builds cannot access Play Billing at all.

**Why it happens:**
- Apple's product propagation delay: newly created products in App Store Connect are not immediately available via the Sandbox API. The delay is typically a few hours, sometimes 24 hours.
- Android: you must upload a signed APK/AAB to Google Play Console (even just to Internal Testing track) before Play Billing works. Direct APK installs cannot reach Play Billing.
- Product status must be "Ready to Submit" or "Waiting for Review" in App Store Connect — not just "Prepared for Submission."

**How to avoid:**
- Create products in both stores before writing integration code — give them the propagation buffer.
- Use StoreKit Configuration Files (Xcode) for iOS local sandbox testing that doesn't depend on App Store Connect.
- For Android, always test via Google Play Internal Testing track, not direct APK install.
- Use static product IDs that match exactly between code and store listings — they cannot be changed or reused after creation.
- Set product IDs consistently across both platforms or accept cross-platform backend complexity.

**Warning signs:**
- "Product not found" during testing after correct product ID setup
- Testing Android IAP via direct APK install
- No StoreKit configuration file set up for local Xcode testing

**Phase to address:** IAP phase (setup and testing sub-task)

---

### Pitfall 8: Freemium Gate Backlash — Over-Restricting the Free Tier

**What goes wrong:**
The planned free tier caps gameplay at 2-back. If the free experience feels crippled (2-back is genuinely too easy for returning players, and users can't even explore the game properly), the App Store reviews will say "used to be free, now gutted" and the conversion rate will be driven by resentment rather than genuine value perception. This is the Duolingo "energy system" problem — users experience the gate as punishment.

**Why it happens:**
Developers design the paywall to maximize pressure to convert. The free tier becomes a demo, not a product. Users who came from the free web version at polynback.fun feel betrayed rather than excited.

**How to avoid:**
- The 2-back cap is a reasonable starting constraint but evaluate it honestly: can a new user actually experience the game's core loop and feel its value at 2-back? If yes, proceed. If the game only gets interesting at 3-back+, the cap kills conversion by eliminating the "aha moment."
- Frame the paywall as "unlock your potential" not "you've hit a wall." Messaging matters enormously.
- Show the locked content clearly (grayed-out modes, locked level indicators) — users who see what they're missing convert better than users who hit invisible walls.
- Offer a clear one-time purchase call to action at the moment of natural frustration (just after a great run that would unlock at higher levels), not as a constant overlay.
- Do NOT convert the polynback.fun web version to freemium — keep it fully free as the marketing/discovery funnel to the app.

**Warning signs:**
- Conversion rate under 1% after launch (industry average 2.18% freemium, 12.11% hard paywall)
- App Store reviews mentioning "used to be free" or "cash grab"
- No clear in-app explanation of what premium unlocks

**Phase to address:** IAP + UX phase

---

### Pitfall 9: App Store Metadata Rejection — Capacitor/WebView Apps

**What goes wrong:**
Apple reviews Capacitor apps (WKWebView-based) more carefully than fully native apps. Common rejection reasons specific to Capacitor/hybrid apps:
- Privacy manifest (`PrivacyInfo.xcprivacy`) is missing or incomplete — rejection since May 2024, required for all submissions.
- App looks identical to a website (reviewer perceives it as "web app wrapped in native shell") and rejects under guideline 4.2 (minimum functionality).
- Non-public API usage flags — older Capacitor/Ionic framework versions had this issue; Capacitor 8 resolved most cases but third-party plugins may still trigger it.
- App accesses UserDefaults (Capacitor Preferences) without listing `NSPrivacyAccessedAPICategoryUserDefaults` with reason code `CA92.1` in the privacy manifest.

**Why it happens:**
Privacy manifest requirements were introduced in 2024. Many Capacitor plugin authors have added manifests to their plugins, but app-level manifests still need to list each API category and approved reason code. The `@capacitor/preferences` plugin accesses UserDefaults, which requires explicit privacy manifest declaration.

**How to avoid:**
- Ensure `PrivacyInfo.xcprivacy` exists in the Xcode project and includes all required API categories.
- `@capacitor/preferences` requires `NSPrivacyAccessedAPICategoryUserDefaults` with reason `CA92.1`.
- Audit all Capacitor plugins for their own privacy manifests — each plugin with a manifest contributes to the aggregate.
- The app must have enough native differentiation to pass guideline 4.2 — haptic feedback, native IAP sheets, native social login flows, and offline capability all support this.
- Use Capacitor 6+ (this project uses 8) — versions 4 and 5 before patch releases lacked privacy manifest support.

**Warning signs:**
- No `PrivacyInfo.xcprivacy` file in the Xcode project
- Privacy manifest exists but does not list `NSPrivacyAccessedAPICategoryUserDefaults`
- First submission — expect higher scrutiny; have responses ready for common reviewer questions

**Phase to address:** App Store submission phase (before first submission)

---

### Pitfall 10: Restore Purchases — Missing Flow Causes App Store Rejection

**What goes wrong:**
Apple requires that all apps with non-consumable IAP provide a "Restore Purchases" mechanism. Users who bought on one device and reinstall or buy a new device must be able to restore without paying again. If the restore button is absent or non-functional, Apple rejects the app at review.

**Why it happens:**
Developers implement the purchase flow but forget the restore flow. The restore flow is also the mechanism for users who uninstall and reinstall — without it, they must repurchase or lose access.

**How to avoid:**
- Include a visible "Restore Purchases" button accessible from the paywall screen and from Settings.
- The restore function must be wired to the platform's restore API (StoreKit `Transaction.currentEntitlements` / Google Play `queryPurchasesAsync`).
- After restore, the backend must be notified to re-validate and re-mark the account as premium.
- Test restore explicitly: purchase in sandbox, delete app, reinstall, tap Restore — confirm premium status returns without repurchasing.
- For account-based premium (the planned model), restore is simpler — user logs in and the server knows they're premium. Still, a standalone "Restore Purchases" button is required even if it just triggers a server re-check.

**Warning signs:**
- No Restore Purchases button in the app
- Restore flow only works for logged-in users (breaks for users who bought before accounts existed)
- Restore tested only on the same device without reinstall

**Phase to address:** IAP phase

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store premium flag only in Capacitor Preferences | Simple, instant | Bypassable, lost on reinstall | Never — always back with server |
| Skip server-side receipt validation | Saves backend work | IAP bypass on jailbroken devices | Never for paid content |
| Never-expiring Sanctum tokens | No re-login friction | Security risk if token leaked | Never — use long but finite expiry |
| Single token for both iOS and Android with same product ID | Simplified backend | Product IDs are platform-specific in store consoles | Acceptable at backend level — one product record maps to two platform IDs |
| Use Capacitor Preferences for auth token storage | Quick to implement | Unencrypted on Android | Never — use secure keychain/keystore plugin |
| Same marketing claims on web and App Store | Consistent messaging | App Store reviews both; FTC covers both | Acceptable if claims are already conservative/compliant |
| Hardcode product prices in UI | Avoids async product fetch | Breaks when price is localized or discounted | Never — always use `product.displayPrice` from the store |
| Skip grandfathering plan for web users | Simpler IAP logic | Web users who migrate to app lose progress | Never — design migration path before launch |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| StoreKit 2 / Capacitor | Trust client-side `Transaction.currentEntitlements` for access control | Verify transaction JWS with Apple App Store Server API on backend |
| Google Play Billing | Call `consume()` on non-consumable to "re-enable" purchasing | Call `acknowledge()` only — consuming makes it repurchasable |
| Laravel Sanctum + Mobile | Use cookie-based session auth (web default) | Use token-based auth (header `Authorization: Bearer {token}`) |
| Google Sign-In / iOS | Use WKWebView for Google OAuth redirect | Use ASWebAuthenticationSession (required by App Store) |
| Apple Sign-In / Android | Implement natively with Google SDK equivalent | Use capacitor-social-login plugin or backend-side SIWA validation |
| Capacitor Preferences | Store auth token directly | Use `capacitor-secure-storage` or equivalent (AES-256 on Keychain/Keystore) |
| Google Sign-In | Include Facebook SDK transitively | Explicitly set `facebook: false` in capacitor config to avoid AD_ID permission |
| App Store Connect products | Create product, immediately test in sandbox | Wait 1–24 hours for product propagation, or use StoreKit Config File locally |
| Privacy manifest | Write single app-level manifest | Each plugin with NSPrivacyAccessedAPITypes contributes; audit all plugins |
| iOS URL scheme for OAuth | Skip or use wrong bundle ID | URL scheme must match exactly; Google Sign-In requires reversed client ID scheme |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Sync on every game round completion | Slow round transitions as API waits | Batch sync asynchronously, fire-and-forget with queue | From day 1 on slow connections |
| Fetch all user stats on app launch | Slow app startup, spinner before game | Cache stats locally, update in background after game session | At 1k+ sessions per user |
| No offline queue for stats | Data loss when user plays offline | Queue writes locally, flush on next connection | Any time a user plays on airplane mode |
| Re-validate premium status on every screen navigation | UI flash as premium check resolves | Cache entitlement, revalidate on foreground/session start only | From day 1 on slow connections |
| Sync conflict resolution by last-write-wins | High scores overwritten by older device data | Use max() strategy for scores, not last-write-wins | When user has multiple devices |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Premium entitlement gated only by local Pinia flag | Trivially bypassed via devtools or jailbreak | Gate on server-issued JWT claim or backend-verified session |
| Sanctum token stored in Capacitor Preferences (plaintext) | Token readable from device file system | Use `@capacitor-community/secure-storage` with Keychain/Keystore |
| Receipt validation logic in client JavaScript | Attacker can modify JS bundle | All validation runs server-side in Laravel; client only passes receipts |
| No HTTPS enforcement on Laravel API | Token interception on open WiFi | Enforce HTTPS in Laravel, Capacitor already uses HTTPS for WKWebView |
| Google Sign-In client secret exposed in frontend code | OAuth credential theft | Only `client_id` (public) goes in frontend; `client_secret` stays in Laravel .env |
| Hardcoded App Store shared secret in mobile bundle | Receipt validation secret extractable from IPA | Shared secret only in Laravel `.env`, never in Capacitor/JS bundle |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Paywall modal fires immediately on first launch | Alienates new users before they understand the game | Gate only after user has completed at least one game session |
| No indication what premium unlocks | Users don't know what they're paying for | Show locked content visually (grayed modes, locked n-back levels) with clear unlock CTA |
| "Log in required" for stats during first session | Friction kills early engagement | Allow offline stats locally, prompt account creation after first few sessions |
| Restore Purchases requires account login | Users who bought before accounts existed cannot restore | Restore must work via platform's native receipt lookup, independent of account |
| Paywall interrupts game mid-session | Breaks the flow the product is built around | Show paywall only at natural pause points: game over screen, menu navigation |
| Account creation email verification blocks immediate play | User abandons during verification wait | Allow immediate play after registration; verify email asynchronously |
| Sync failure shown as error modal | Disruptive to gameplay | Surface sync issues silently (banner or subtle indicator), never block gameplay |

---

## "Looks Done But Isn't" Checklist

- [ ] **IAP Purchase Flow:** Purchase succeeds on device — verify backend also confirmed via receipt validation. Both iOS and Android must go through server.
- [ ] **Restore Purchases:** "Restore" button visible, wired to platform restore API, tested with reinstall on sandbox account.
- [ ] **Sign In with Apple:** Flows through `ASWebAuthenticationSession`, not a WKWebView. Tested on physical device (not simulator).
- [ ] **Google Sign-In iOS:** Reversed client ID URL scheme registered in `Info.plist`. Tested on physical device with correct bundle ID.
- [ ] **Privacy Manifest:** `PrivacyInfo.xcprivacy` lists `NSPrivacyAccessedAPICategoryUserDefaults` with `CA92.1`. All plugins audited.
- [ ] **Auth Token Storage:** Token written to Keychain/Keystore (secure storage plugin), not Capacitor Preferences.
- [ ] **FTC Compliance:** App Store description, marketing site copy, and in-app copy reviewed for unsubstantiated efficacy claims.
- [ ] **Data Migration:** User who played before accounts were introduced can create an account and finds their history preserved.
- [ ] **Offline Gameplay:** App functions fully without internet. Stats queue locally. Sync happens when connection returns.
- [ ] **Premium State on Launch:** App fetches/validates premium status from server on each foreground event, not only on purchase.
- [ ] **Google Play Acknowledgment:** Non-consumable purchase acknowledged within 3 days (by backend) — not silently auto-refunded.
- [ ] **PENDING Purchase State (Android):** App does not grant entitlement to purchases in PENDING state; waits for PURCHASED state.
- [ ] **Marketing Claims:** No copy uses "scientifically proven," "clinically proven," "guaranteed to improve," or disease-treatment language.
- [ ] **Apple Sign-In Button:** Meets Apple's visual design requirements exactly (color, corner radius, sizing). Custom styling causes rejection.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Client-side IAP bypass discovered post-launch | HIGH | Add server validation endpoint, force app update, revoke local entitlements on next launch |
| App Store rejection for guideline 4.8 (missing SIWA) | MEDIUM | Implement SIWA, resubmit — typical review turnaround 24–48h |
| App Store rejection for unsubstantiated claims | MEDIUM | Revise metadata/copy, resubmit — no code change needed, review 24–48h |
| User data lost during local→server migration | HIGH | Restore from backup (if any), implement migration flow, issue goodwill credits |
| Google Play auto-refund from missing acknowledgment | MEDIUM | Add acknowledgment logic, release patch, accept revenue loss for unacknowledged transactions |
| FTC inquiry into marketing claims | VERY HIGH | Remove claims immediately, consult legal, preserve all marketing materials for audit |
| Auth token in plaintext discovered | HIGH | Force token invalidation server-side, push update with secure storage, rotate all tokens |
| SIWA implementation rejected for using WKWebView | LOW | Switch to ASWebAuthenticationSession (supported by capacitor-social-login plugin), resubmit |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Client-side IAP trust (Pitfall 1) | IAP implementation phase | Test paywall bypass attempt with devtools; confirm server-side validation rejects it |
| Missing Apple Sign-In alongside Google (Pitfall 2) | Auth/social login phase | Submit test build to TestFlight; both login providers visible and functional |
| FTC marketing claims (Pitfall 3) | Marketing site + App Store metadata phase | Legal review of all copy; cross-reference against FTC Lumosity order language |
| Google Play unacknowledged purchase auto-refund (Pitfall 4) | IAP implementation phase | Simulate interrupted purchase in Android sandbox; confirm acknowledgment fires |
| Local data migration to server (Pitfall 5) | Auth/accounts phase | QA path: existing user with data, creates account, all history present |
| Sanctum token expiry / forced re-login (Pitfall 6) | Auth/backend phase | Expire a test token manually; confirm app handles 401 gracefully without data loss |
| IAP "Product not found" during development (Pitfall 7) | IAP implementation phase | Use StoreKit Config File (iOS) and Internal Testing track (Android) from day one |
| Freemium gate backlash (Pitfall 8) | IAP + UX design phase | Internal playtest: is the free experience genuinely enjoyable for a new user? |
| App Store metadata / privacy manifest rejection (Pitfall 9) | App Store submission phase | Run Xcode privacy report before submission; ensure all APIs declared |
| Missing Restore Purchases flow (Pitfall 10) | IAP implementation phase | Sandbox test: purchase, uninstall, reinstall, restore — premium state returns |

---

## Sources

- [Apple App Store Review Guidelines — Sections 3.1.1, 3.1.2, 4.8](https://developer.apple.com/app-store/review/guidelines/) — HIGH confidence
- [Capawesome: Tips for Setting Up In-App Purchases with Capacitor](https://capawesome.io/blog/tips-for-setting-up-in-app-purchases-with-capacitor/) — HIGH confidence
- [FTC v. Lumos Labs (Lumosity) — Stipulated Final Order](https://www.ftc.gov/system/files/documents/cases/160105lumoslabsstip.pdf) — HIGH confidence
- [FTC: Marketers of LearningRx Programs Settle FTC Charges](https://www.ftc.gov/news-events/news/press-releases/2016/05/marketers-one-one-brain-training-programs-settle-ftc-charges-claims-about-ability-treat-severe) — HIGH confidence
- [Apple: Sign in with Apple No Longer Exclusively Required — 9to5Mac / Jan 2024](https://9to5mac.com/2024/01/27/sign-in-with-apple-rules-app-store/) — HIGH confidence
- [Google Play Billing: One-Time Purchase Lifecycle — Android Developers](https://developer.android.com/google/play/billing/lifecycle/one-time) — HIGH confidence
- [Google Play Billing: Fighting Fraud and Abuse](https://developer.android.com/google/play/billing/security) — HIGH confidence
- [RevenueCat: Handling Google Play Billing Edge Cases](https://www.revenuecat.com/blog/engineering/google-play-edge-cases/) — MEDIUM confidence
- [Cap-go: capacitor-social-login issues — URL scheme and provider bugs](https://github.com/Cap-go/capacitor-social-login/issues) — MEDIUM confidence
- [Capacitor: Privacy Manifest Documentation](https://capacitorjs.com/docs/v5/ios/privacy-manifest) — HIGH confidence
- [Adapty: iOS In-App Purchase Server-Side Receipt Validation](https://adapty.io/blog/ios-in-app-purchase-server-side-validation/) — MEDIUM confidence
- [Laravel Sanctum — Refresh Token Patterns](https://www.liquidbcn.com/en/insights/implementing-access-tokens-refresh-tokens-laravel-sanctum) — MEDIUM confidence
- [Medium: Freemium Bait-and-Switch Pattern 2025](https://www.bez-kabli.pl/news/free-apps-are-getting-worse-in-2025-how-freemium-turned-into-a-bait-and-switch/) — MEDIUM confidence
- [Adapty: Freemium to Premium Conversion Techniques](https://adapty.io/blog/freemium-to-premium-conversion-techniques/) — MEDIUM confidence
- [Offline Sync Conflict Resolution Patterns — Sachith Dassanayake, Feb 2026](https://www.sachith.co.uk/offline-sync-conflict-resolution-patterns-architecture-trade%E2%80%91offs-practical-guide-feb-19-2026/) — MEDIUM confidence
- [Paywall Bypass via Client-Side Trust — Medium, Feb 2026](https://medium.com/@default_Ox/paywall-bypass-how-client-side-trust-led-to-a-free-premium-upgrade-f54e65699628) — MEDIUM confidence

---

*Pitfalls research for: Adding monetization, backend API, social login, app store submission to Vue/Capacitor brain training app*
*Researched: 2026-03-02*

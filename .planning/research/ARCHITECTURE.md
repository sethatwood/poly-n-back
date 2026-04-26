# Architecture Research

**Domain:** Vue 3 + Capacitor + Laravel — Monetized Platform integration
**Researched:** 2026-03-02
**Confidence:** HIGH (existing codebase verified; external API patterns from official docs)

---

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Mobile App (Capacitor 8)                      │
│                                                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  MenuScreen  │  │  GameScreen  │  │  StatsScreen│  │  AuthScreen │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │
│         │                │                │                │          │
│  ┌──────┴────────────────┴────────────────┴────────────────┴──────┐   │
│  │                     Pinia Store Layer                           │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐   │   │
│  │  │ gameStore │  │ authStore │  │ statsStore│  │ iapStore  │   │   │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘   │   │
│  │  ┌───────────┐  ┌───────────┐                                  │   │
│  │  │audioStore │  │persStore  │                                  │   │
│  │  └───────────┘  └───────────┘                                  │   │
│  └──────────────────────────────────────────────────────────────--┘   │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                     Service Layer                                │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐                 │  │
│  │  │ apiService │  │ iapService │  │socialLogin │                 │  │
│  │  └────────────┘  └────────────┘  └────────────┘                 │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────┐  ┌───────────────────────────────────────┐  │
│  │  Capacitor Plugins   │  │  Local Persistence                    │  │
│  │  @capgo/social-login │  │  persistenceStore (Preferences)       │  │
│  │  cap-native-purchases│  │  Sanctum token (SecureStorage)        │  │
│  └──────────┬───────────┘  └───────────────────────────────────────┘  │
└─────────────┼────────────────────────────────────────────────────────-┘
              │ HTTPS / Sanctum token
              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      Laravel 12 API (polynback.com)                   │
│                                                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ AuthController│  │SessionController│ StatsController│ IAPController│ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ Sanctum | Socialite (Google/Apple) | Eloquent ORM               │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────┐    │
│  │  MySQL/PostgreSQL │  │   Apple/Google   │  │  Marketing Site   │    │
│  │  (user, sessions,│  │  IAP Receipt     │  │  (Blade + Vite)   │    │
│  │   stats tables)  │  │  Validation APIs │  │  polynback.com    │    │
│  └──────────────────┘  └──────────────────┘  └───────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

#### Existing (Modified)

| Component | Current Role | M2 Changes |
|-----------|-------------|------------|
| `gameStore` | Game rules, score tracking, stimuli | Add `gameModeStore` composition; emit session data to `statsStore` on game over; check `iapStore.isPremium` for level gating |
| `persistenceStore` | Capacitor Preferences read/write | Add Sanctum token storage (via Secure Storage, not Preferences); sync dirty flag for offline sessions |
| `App.vue` | Screen routing | Add auth guard: redirect to AuthScreen if not logged in and action requires account |
| `ConfigStart.vue` | n-back + timer config | Add game mode selector; gating check (`iapStore.isPremium`) blocks Zen/Time Attack/Endless modes |

#### New Stores

| Store | Responsibility | Key State |
|-------|---------------|-----------|
| `authStore` | Authentication state, token lifecycle, login/logout | `user`, `token`, `isLoggedIn`, `isPending` |
| `statsStore` | Session history capture, aggregation, sync queue | `sessions[]`, `pendingSync[]`, `stats` (computed) |
| `iapStore` | Purchase state, premium entitlement, paywall trigger | `isPremium`, `purchasePending`, `purchaseError` |

#### New Services (`src/services/`)

| Service | Purpose | Used By |
|---------|---------|---------|
| `apiService.ts` | Typed axios/fetch wrapper with Sanctum token injection, retry, 401 handling | `authStore`, `statsStore`, `iapStore` |
| `iapService.ts` | `capacitor-native-purchases` wrapper: product load, purchase, restore, receipt extraction | `iapStore` |
| `socialLoginService.ts` | `@capgo/capacitor-social-login` wrapper: Google/Apple token acquisition | `authStore` |

#### New Components

| Component | Screen | Purpose |
|-----------|--------|---------|
| `AuthScreen.vue` | Full screen | Login/register with Google/Apple |
| `StatsScreen.vue` | Full screen | Session history, accuracy trends, streaks |
| `PaywallModal.vue` | Modal | Triggered on gated-feature tap; shows $3.99 unlock CTA |
| `GameModeSelector.vue` | Menu | Composable within ConfigStart/MenuScreen; shows available modes with lock icons |
| `UserAvatarMenu.vue` | Menu header | Avatar + handle, taps to account/logout |

---

## Recommended Project Structure

Current structure after M1 (already in place):

```
src/
├── assets/
├── components/
│   ├── screens/        # MenuScreen, GameScreen
│   ├── game/           # GameTimer, ResponseButtons, ScoreDisplay, GameOverDisplay
│   ├── modals/         # GameOverModal, PauseModal
│   ├── overlays/       # TutorialOverlay, AchievementToast, GameHint
│   ├── config/         # ConfigStart
│   └── layout/         # IntroHead, IntroContent, Footer
├── composables/
│   ├── useAnimations.ts, useFeedback.ts, useGameLifecycle.ts, useManagedTimeout.ts
├── stores/
│   ├── audioStore.ts, gameStore.ts, persistenceStore.ts
├── types/
│   └── game.ts
└── utils/
    └── haptics.ts
```

M2 additions (new files only):

```
src/
├── components/
│   ├── screens/
│   │   ├── AuthScreen.vue          # NEW: social login UI
│   │   └── StatsScreen.vue         # NEW: stats dashboard
│   ├── modals/
│   │   └── PaywallModal.vue        # NEW: IAP purchase prompt
│   └── game/
│       └── GameModeSelector.vue    # NEW: mode picker with lock icons
├── stores/
│   ├── authStore.ts                # NEW: auth state + token
│   ├── statsStore.ts               # NEW: session capture + sync
│   └── iapStore.ts                 # NEW: purchase + entitlement
├── services/
│   ├── apiService.ts               # NEW: HTTP client with token injection
│   ├── iapService.ts               # NEW: Capacitor IAP wrapper
│   └── socialLoginService.ts       # NEW: Capacitor social login wrapper
└── types/
    ├── game.ts                     # MODIFY: add GameMode type, SessionRecord interface
    └── api.ts                      # NEW: API response types
```

### Structure Rationale

- **services/:** Separation of Capacitor plugin concerns from Pinia store logic. Stores should not import Capacitor plugins directly — thin service wrappers make stores testable and plugin-swappable.
- **stores/:** One store per domain. `authStore` owns identity. `statsStore` owns session history. `iapStore` owns purchase state. They do not own each other's data.
- **components/screens/:** AuthScreen and StatsScreen are full-screen routes, not modals. They follow the same screen pattern as MenuScreen and GameScreen.
- **types/api.ts:** Typed API response shapes separate from game domain types. Prevents leaking backend model shapes into game logic.

---

## Architectural Patterns

### Pattern 1: Offline-First Session Recording

**What:** Sessions are written to local storage immediately on game over. A background sync queue uploads them to the API when connected. Game over never blocks on network.

**When to use:** Any user-generated data that must not be lost to network failure.

**Trade-offs:** Requires conflict resolution strategy (last-write-wins by timestamp is sufficient for session stats — sessions are immutable once recorded).

**Example:**
```typescript
// statsStore.ts — called by gameStore on game over
async function recordSession(session: SessionRecord): Promise<void> {
  // 1. Always write local first
  const sessions = await persistenceStore.loadPreference('sessions', [])
  sessions.push({ ...session, syncedAt: null })
  await persistenceStore.savePreference('sessions', sessions)

  // 2. Attempt sync if logged in and online
  if (authStore.isLoggedIn) {
    await syncPendingSessions()
  }
  // If not logged in or offline, sync happens next app launch
}

async function syncPendingSessions(): Promise<void> {
  const sessions = await persistenceStore.loadPreference('sessions', [])
  const pending = sessions.filter((s: SessionRecord) => s.syncedAt === null)
  if (pending.length === 0) return

  try {
    await apiService.post('/api/sessions/batch', { sessions: pending })
    // Mark synced
    const updated = sessions.map((s: SessionRecord) =>
      pending.includes(s) ? { ...s, syncedAt: Date.now() } : s
    )
    await persistenceStore.savePreference('sessions', updated)
  } catch {
    // Silent failure — will retry next sync attempt
  }
}
```

### Pattern 2: Social Login Token Exchange

**What:** The Capacitor social login plugin acquires a provider identity token (Google ID token or Apple identity token) natively. The app POSTs this token to the Laravel backend. Laravel validates it with the provider, finds or creates the user, and returns a Sanctum API token.

**When to use:** Any social auth flow on a mobile + Laravel stack.

**Trade-offs:** Backend must handle both Google and Apple token validation. Apple tokens have strict first-party requirements (identity token is a JWT signed by Apple's public key). The backend validates the JWT rather than calling an endpoint.

**Flow:**
```
[App] SocialLogin.login({ provider: 'google' })
        ↓ Returns: { idToken: '...' }
[App] POST /api/auth/social { provider: 'google', token: idToken }
        ↓
[Laravel] Socialite::driver('google')->userFromToken($token)
        ↓ Returns: SocialiteUser { email, name, avatar }
[Laravel] User::firstOrCreate(['email' => $user->email], [...])
[Laravel] $apiToken = $user->createToken('mobile')->plainTextToken
        ↓ Returns: { token, user }
[App] authStore.token = token → persisted to SecureStorage
```

### Pattern 3: IAP Receipt Validation Pipeline

**What:** On purchase, the Capacitor plugin returns a transaction ID and receipt. The app sends this to the Laravel backend, which validates against Apple/Google servers. The backend grants the premium entitlement in the database and returns confirmation. The app only sets `isPremium = true` after backend confirmation.

**When to use:** Any in-app purchase that unlocks features — never trust client-side purchase state alone.

**Trade-offs:** Requires network to complete purchase unlock. Grace period pattern recommended: show "unlocking..." optimistically, timeout to error if backend unreachable.

**Flow:**
```
[App] NativePurchases.purchaseProduct({ productIdentifier: 'premium_unlock' })
        ↓ Returns: { transactionId, receipt }
[App] POST /api/iap/verify { platform: 'ios', receipt, transactionId }
        ↓
[Laravel] apple/google-play validation API
        ↓ Returns: verified purchase
[Laravel] user->update(['is_premium' => true])
        ↓ Returns: { success: true, isPremium: true }
[App] iapStore.isPremium = true → persisted to persistenceStore
```

### Pattern 4: Freemium Gating as a Computed Gate

**What:** Feature access is computed from `iapStore.isPremium`. All gating checks go through one place. Components do not make individual premium checks.

**When to use:** Any feature that requires paid access.

**Trade-offs:** Gate state must be initialized before screens render (handled in app startup flow).

**Example:**
```typescript
// iapStore.ts
const isPremium = ref(false)

// Computed gates — components import these, not isPremium directly
const canAccessAdvancedLevels = computed(() => isPremium.value)
const canAccessGameModes = computed(() => isPremium.value)
const canAccessStats = computed(() => isPremium.value) // stats are premium
const canAccessUnlimitedNBack = computed(() => isPremium.value)

// Free tier limits
const freeNBackCap = 2
const effectiveNBackMax = computed(() =>
  isPremium.value ? 10 : freeNBackCap
)
```

```typescript
// In gameStore — gating n-back at game start
function startGame(timeLeftParam: number = 5): void {
  const { effectiveNBackMax } = iapStore
  if (nBack.value > effectiveNBackMax.value) {
    nBack.value = effectiveNBackMax.value // Clamp, do not throw
  }
  // ... rest of startGame
}
```

---

## Data Flow

### Request Flow: Game Session Capture

```
[Game Over]
    ↓
gameStore.respondToStimulus() → incorrectResponses >= 3
    ↓
gameStore.stopGame() + showGameOverModal = true
    ↓
statsStore.recordSession({
  nBack, score, accuracy, duration, gameMode, timestamp
})
    ↓
[Always] → persistenceStore.savePreference('sessions', [...])
    ↓ if authStore.isLoggedIn
[Try] → POST /api/sessions/batch
    ↓
[Success] → mark sessions synced
[Failure] → silent, retry on next app open
```

### Request Flow: Social Login

```
[User taps "Sign in with Google"]
    ↓
AuthScreen → authStore.loginWithGoogle()
    ↓
socialLoginService.loginGoogle()
    → SocialLogin.login({ provider: 'google' })
    → Returns { idToken }
    ↓
apiService.post('/api/auth/social', { provider: 'google', token: idToken })
    ↓
[Laravel validates idToken, creates/finds user, returns Sanctum token]
    ↓
authStore.setUser(user) + authStore.setToken(token)
    → persistenceStore.savePreference('authToken', token) [via SecureStorage]
    ↓
statsStore.syncPendingSessions()  ← sync any offline sessions
iapStore.restorePurchases()       ← restore IAP state for this user
    ↓
App.vue router → navigate to MenuScreen
```

### Request Flow: IAP Purchase

```
[User taps "Unlock — $3.99"]
    ↓
PaywallModal → iapStore.purchase()
    ↓
iapService.purchase('com.polynback.premium')
    → NativePurchases.purchaseProduct(...)
    → Returns { transactionId, receipt }
    ↓
apiService.post('/api/iap/verify', { platform, receipt, transactionId })
    ↓
[Laravel validates, sets user.is_premium = true, returns confirmation]
    ↓
iapStore.isPremium = true
persistenceStore.savePreference('isPremium', true)
    ↓
PaywallModal closes → all gated features unlock reactively
```

### State Management

```
[authStore]
  ├── isLoggedIn (computed from token)
  ├── user: { id, email, name, avatar }
  └── token: string (loaded from SecureStorage on app start)

[iapStore]
  ├── isPremium: boolean (loaded from persistenceStore + refreshed from API)
  └── computed gates: canAccessGameModes, effectiveNBackMax, etc.

[statsStore]
  ├── sessions: SessionRecord[] (local)
  ├── pendingSync: SessionRecord[] (computed: sessions without syncedAt)
  └── stats: computed { totalSessions, bestScore, avgAccuracy, currentStreak }

[gameStore]  ← reads iapStore for gating, writes to statsStore on game over
  ├── gameMode: GameMode (new: 'classic' | 'zen' | 'timeAttack' | 'endless' | 'dailyChallenge')
  └── [existing state unchanged]
```

---

## Integration Points

### New vs Modified: Explicit Inventory

| File | New or Modified | What Changes |
|------|----------------|--------------|
| `src/stores/gameStore.ts` | **MODIFIED** | Add `gameMode` ref; call `statsStore.recordSession()` on game over; check `iapStore.effectiveNBackMax` on startGame |
| `src/types/game.ts` | **MODIFIED** | Add `GameMode` type, `SessionRecord` interface, `GameModeConfig` interface |
| `src/App.vue` | **MODIFIED** | Add auth check on startup (load token → validate); add StatsScreen and AuthScreen to screen router |
| `src/main.ts` | **MODIFIED** | Initialize `authStore`, `iapStore`, `statsStore` on app boot |
| `src/components/config/ConfigStart.vue` | **MODIFIED** | Add `GameModeSelector` sub-component; emit mode changes |
| `src/stores/authStore.ts` | **NEW** | Auth state, login, logout, token lifecycle |
| `src/stores/statsStore.ts` | **NEW** | Session recording, local storage, sync queue |
| `src/stores/iapStore.ts` | **NEW** | Purchase state, premium entitlement, paywall trigger |
| `src/services/apiService.ts` | **NEW** | Fetch wrapper with Sanctum Bearer token, 401 auto-logout |
| `src/services/iapService.ts` | **NEW** | Capacitor Native Purchases wrapper |
| `src/services/socialLoginService.ts` | **NEW** | Capacitor Social Login wrapper |
| `src/components/screens/AuthScreen.vue` | **NEW** | Google/Apple sign-in UI |
| `src/components/screens/StatsScreen.vue` | **NEW** | Stats dashboard |
| `src/components/modals/PaywallModal.vue` | **NEW** | Purchase prompt |
| `src/components/game/GameModeSelector.vue` | **NEW** | Mode picker |
| `src/types/api.ts` | **NEW** | API response types |

### External Services

| Service | Integration Pattern | Confidence | Notes |
|---------|---------------------|-----------|-------|
| Laravel Sanctum (auth) | Sanctum API token — POST `/api/auth/social`, receive `{ token }`, send as `Authorization: Bearer {token}` on all subsequent requests | HIGH | Official Laravel docs. Token stored in Preferences (acceptable) or SecureStorage plugin (more secure). |
| Google Sign-In | `@capgo/capacitor-social-login` returns Google ID token → POST to Laravel → Socialite validates | HIGH | capgo plugin is active, maintained, Capacitor 8 compatible |
| Apple Sign-In | Same plugin returns Apple identity token (JWT) → POST to Laravel → `socialiteproviders/apple` validates JWT signature | MEDIUM | Apple's identity token is a JWT verifiable without API call — Laravel validates signature against Apple's public keys |
| Capacitor Native Purchases | `capacitor-native-purchases` (capgo) v8.x for StoreKit 2 (iOS) + Google Play Billing 7.x (Android) — returns `transactionId` + receipt → POST to Laravel | HIGH | Plugin v8.x = Capacitor 8.x. `imdhemy/laravel-purchases` package handles backend validation |
| Apple IAP Validation | App Store Server API v2 (JWS-based) via `imdhemy/laravel-purchases` package | MEDIUM | Backend calls Apple API with transactionId; confirms purchase is valid and not refunded |
| Google IAP Validation | Google Play Developer API via `imdhemy/laravel-purchases` package | MEDIUM | Backend calls Google API with purchaseToken; confirms purchase status |
| Marketing site | Same Laravel app, separate routes/controllers. Blade templates + Vite asset pipeline. Route group `/` and `/privacy`, `/about`. App routes prefixed `/api/`. | HIGH | Single deployment, one Forge server. No monorepo complexity needed at this scale. |

### Internal Boundaries

| Boundary | Communication Pattern | Notes |
|----------|-----------------------|-------|
| `gameStore` → `statsStore` | Direct function call: `statsStore.recordSession(payload)` on game over | One-way data push; statsStore does not read from gameStore |
| `gameStore` → `iapStore` | Reads `iapStore.effectiveNBackMax` (computed) and `iapStore.canAccessGameModes` (computed) | Read-only access to gating; gameStore does not mutate iapStore |
| `authStore` → `apiService` | authStore passes token; apiService is imported and used inside authStore actions | apiService is not a store — it is a plain service module |
| `statsStore` → `apiService` | statsStore calls apiService for sync | Same pattern as authStore |
| `iapStore` → `iapService` | iapStore calls iapService.purchase(), iapService.restore() | iapService wraps Capacitor plugin, iapStore owns state |
| `App.vue` → auth gate | App.vue reads `authStore.isLoggedIn` on startup; shows AuthScreen if token missing and action requires account | Soft gate: anonymous users can still play core game |
| `PaywallModal` → `iapStore` | PaywallModal calls `iapStore.purchase()`, watches `iapStore.isPremium` | Modal is decoupled — any component can trigger `iapStore.showPaywall()` |

---

## Game Mode Integration

Game modes integrate into the existing `gameStore` by adding a `gameMode` ref that alters behavior in existing actions — not by creating separate stores per mode.

### GameMode Type Addition

```typescript
// src/types/game.ts — addition
export type GameMode =
  | 'classic'        // Existing: 3-strike game over, unlimited time
  | 'zen'            // No strikes — play until you choose to stop
  | 'timeAttack'     // Fixed 2-minute clock, maximize score
  | 'endless'        // No strikes, no timer, meditative
  | 'dailyChallenge' // Fixed seed + config, once per day
```

### GameStore Modifications

```typescript
// src/stores/gameStore.ts — additions (not replacements)
const gameMode = ref<GameMode>('classic')

// Modified: stopGame condition now mode-aware
function respondToStimulus(stimulusType: StimulusAttribute): void {
  // ... existing correct/incorrect logic unchanged ...

  if (!isCorrect) {
    incorrectResponses.value += 1

    // Zen and Endless: no game over on strike
    const strikeBasedGameOver =
      gameMode.value === 'classic' || gameMode.value === 'timeAttack'

    if (strikeBasedGameOver && incorrectResponses.value >= 3) {
      // ... existing game over logic ...
    }
  }
}

// Modified: startGame takes optional mode
function startGame(timeLeftParam: number = 5, mode: GameMode = 'classic'): void {
  gameMode.value = mode

  // Time Attack: start a separate countdown timer
  if (mode === 'timeAttack') {
    startTimeAttackCountdown() // 120 seconds, ends game when 0
  }
  // ... rest of startGame unchanged ...
}
```

The key insight: game modes modify **termination conditions** and **time constraints** — they do not change stimulus generation, n-back evaluation, or score calculation. The existing game loop is fully reused.

---

## Freemium Gating Architecture

### Gate Location: `iapStore` (single source of truth)

```typescript
// src/stores/iapStore.ts
export const useIapStore = defineStore('iap', () => {
  const isPremium = ref(false)

  // Computed gates — the ONLY place that defines what requires premium
  const freeNBackCap = 2
  const effectiveNBackMax = computed(() => isPremium.value ? 10 : freeNBackCap)
  const canAccessGameModes = computed(() => isPremium.value)
  const canAccessStats = computed(() => isPremium.value)

  // Paywall trigger state
  const paywallVisible = ref(false)
  const paywallReason = ref<string>('')

  function showPaywall(reason: string) {
    paywallReason.value = reason
    paywallVisible.value = true
  }

  async function purchase(): Promise<void> { /* ... iapService + backend verify ... */ }
  async function restorePurchases(): Promise<void> { /* ... */ }
  async function loadEntitlement(): Promise<void> {
    // Check local cache first, then backend if logged in
    isPremium.value = await persistenceStore.loadPreference('isPremium', false)
    if (authStore.isLoggedIn) {
      const { data } = await apiService.get('/api/user/entitlement')
      isPremium.value = data.isPremium
      await persistenceStore.savePreference('isPremium', data.isPremium)
    }
  }

  return {
    isPremium,
    effectiveNBackMax,
    canAccessGameModes,
    canAccessStats,
    paywallVisible,
    paywallReason,
    showPaywall,
    purchase,
    restorePurchases,
    loadEntitlement,
  }
})
```

### Where Paywall Is Triggered

| Action | Component | Trigger |
|--------|-----------|---------|
| N-back slider > 2 (free) | `ConfigStart.vue` | `iapStore.showPaywall('Levels above 2-back require Poly N-Back Premium')` |
| Tap Zen / Time Attack / Endless mode | `GameModeSelector.vue` | `iapStore.showPaywall('Game modes require Poly N-Back Premium')` |
| Tap Stats tab | `App.vue` nav | `iapStore.showPaywall('Stats tracking requires Poly N-Back Premium')` |
| Daily Challenge | `GameModeSelector.vue` | Same gate as other modes |

**The paywall check is always a computed gate check + `showPaywall()` call. No component implements its own premium check inline.**

---

## Laravel Backend Architecture

### Route Groups

```
/                          → Marketing site (Blade)
/privacy, /about, /contact → Marketing pages (Blade)

/api/auth/social           → POST: social token exchange → Sanctum token
/api/auth/logout           → POST: revoke Sanctum token
/api/user                  → GET: current user + entitlement
/api/user/entitlement      → GET: { isPremium: bool }
/api/sessions/batch        → POST: bulk session record sync
/api/iap/verify            → POST: receipt validation → grant premium
```

### Database Tables (New)

```
users:
  id, email, name, avatar_url,
  provider (google|apple), provider_id,
  is_premium, premium_granted_at,
  created_at, updated_at

game_sessions:
  id, user_id, game_mode, n_back,
  score, accuracy, duration_seconds,
  played_at, created_at

personal_access_tokens:   ← Sanctum default table (already exists)
  id, tokenable_id, tokenable_type, name, token, ...
```

### Marketing Site: Same Laravel App

The marketing site lives in the same Laravel application as the API — not a separate deployment. This is the correct choice at this scale:

- **One Forge server, one deploy** — simpler for a solo dev
- **Shared auth context** — web users logged into polynback.com are the same users as app users (future)
- **No CORS complexity** between marketing site and API
- Route groups keep concerns separated without physical separation

Blade templates handle marketing pages. The Vite-built Vue SPA is served as a static asset bundle — it does not live "inside" Laravel. Capacitor apps fetch the bundle from embedded assets; web users fetch from Laravel's public path.

---

## App Startup Flow (New)

The app boot sequence must be extended for M2 to initialize auth and entitlement before any screen renders:

```typescript
// src/main.ts — extended startup
const app = createApp(App)
app.use(pinia)

// Parallel initialization (order-independent)
await Promise.all([
  gameStore.loadPersistedState(),    // existing
  authStore.init(),                  // NEW: load token from storage, validate
  iapStore.loadEntitlement(),        // NEW: load isPremium from cache
])

// If auth token exists: sync pending sessions + refresh entitlement from API
if (authStore.isLoggedIn) {
  // Fire-and-forget — don't block app mount on network
  statsStore.syncPendingSessions().catch(() => {})
  iapStore.loadEntitlement().catch(() => {})  // refresh from backend
}

app.mount('#app')
```

**Critical:** App mount is NOT blocked on network calls. Local cache values are used immediately. Network refresh happens async.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Current monolith is fine. SQLite on Forge, no queue worker needed. Sync is synchronous in request cycle. |
| 1k-10k users | Add database indices on `game_sessions.user_id` + `played_at`. Add Laravel queue for async receipt validation (IAP calls Apple/Google APIs, which can be slow). |
| 10k-100k users | Add Redis for session caching. Separate API from marketing site onto distinct subdomains (`api.polynback.com`). Consider read replicas for stats queries. |
| 100k+ users | Stats aggregation jobs (pre-compute leaderboards). CDN for marketing site assets. Rate limit `/api/sessions/batch` endpoint. |

**First bottleneck:** Stats query performance. `game_sessions` grows unboundedly. Add `played_at` index at table creation — not as an afterthought.

---

## Anti-Patterns

### Anti-Pattern 1: Client-Side IAP Trust

**What:** Setting `iapStore.isPremium = true` immediately on `purchaseProduct()` success without backend verification.
**Why it's wrong:** Purchase receipts can be replayed, spoofed, or generated by jailbroken devices. Apple and Google's own guidelines require server-side validation for feature unlocks.
**Do this instead:** Purchase → send receipt to Laravel → Laravel validates with Apple/Google → backend sets `is_premium` in database → return confirmation → app sets `isPremium = true`.

### Anti-Pattern 2: Token in Capacitor Preferences

**What:** Storing the Sanctum Bearer token in `@capacitor/preferences` (which maps to UserDefaults on iOS / SharedPreferences on Android).
**Why it's wrong:** UserDefaults and SharedPreferences are not encrypted. A rooted/jailbroken device can read them. Auth tokens in unencrypted storage are a security concern.
**Do this instead:** Use `@capacitor-community/secure-storage` or `@capawesome/capacitor-secure-storage` (Keychain on iOS, EncryptedSharedPreferences on Android) for the auth token. Use `@capacitor/preferences` for non-sensitive app state (isPremium cache, preferences, session records).

### Anti-Pattern 3: Inline Premium Checks in Components

**What:** Each component that has a gated feature checking `authStore.isLoggedIn && iapStore.isPremium` directly in its template.
**Why it's wrong:** Logic is scattered. Changing the freemium model (e.g., adding a trial period) requires touching every component. Tests must mock stores everywhere.
**Do this instead:** All gating goes through `iapStore` computed properties (`canAccessGameModes`, `effectiveNBackMax`). Components import the computed, not the raw `isPremium` flag.

### Anti-Pattern 4: Blocking App Mount on Network

**What:** `await authStore.refreshFromServer()` before `app.mount('#app')`.
**Why it's wrong:** If the server is slow or offline, the user stares at a blank screen. Capacitor apps must feel instant.
**Do this instead:** Load from local cache first, mount immediately. Refresh from server after mount in a non-blocking `catch()`-wrapped call. UI shows stale data for 1-2 seconds, then updates reactively. This is imperceptible to users.

### Anti-Pattern 5: Game Modes as Separate Stores

**What:** Creating a `zenStore`, `timeAttackStore`, etc., each duplicating game loop logic.
**Why it's wrong:** Stimulus generation, response evaluation, and score tracking are identical across modes. Mode-specific behavior is limited to termination conditions and time constraints.
**Do this instead:** One `gameStore` with a `gameMode` ref. Mode-specific behavior lives in conditional branches within existing actions (`startGame`, `respondToStimulus`). If a mode needs significantly different behavior, use a strategy/config object, not a new store.

---

## Build Order (Phase Dependencies)

```
1. Laravel API scaffolding (Sanctum, DB tables, social auth routes, IAP routes)
   ↓
2. authStore + apiService + socialLoginService (requires Laravel auth endpoints)
   ↓
3. AuthScreen.vue (requires authStore)
   ↓
4. iapStore + iapService (requires authStore for token, Laravel IAP endpoint)
   ↓
5. PaywallModal.vue (requires iapStore)
   ↓
6. GameModeSelector.vue + game mode additions to gameStore (requires iapStore.canAccessGameModes)
   ↓
7. statsStore (requires authStore for sync, persistenceStore for local write)
   ↓
8. StatsScreen.vue (requires statsStore)
   ↓
9. Marketing site (independent of all above — can be built in parallel with 1-8)
   ↓
10. App store submission (requires all above to be stable)
```

**Parallel tracks possible:**
- Marketing site (Laravel Blade) can be built entirely in parallel with mobile features
- Laravel API and Capacitor plugins can be scaffolded simultaneously before stores are built
- Stats UI (StatsScreen) can be built with mock data while statsStore sync is not yet wired

---

## Sources

- [Laravel Sanctum — Official Docs (12.x)](https://laravel.com/docs/12.x/sanctum) — HIGH confidence. Token-based auth for mobile apps, API token patterns.
- [Laravel Socialite — Official Docs (12.x)](https://laravel.com/docs/12.x/socialite) — HIGH confidence. OAuth provider driver pattern, `userFromToken()` method.
- [Laravel Socialite Apple Provider](https://laravel-news.com/package/socialiteproviders-apple) — MEDIUM confidence. Community provider for Apple Sign In, JWT verification approach.
- [@capgo/capacitor-social-login — GitHub](https://github.com/Cap-go/capacitor-social-login) — MEDIUM confidence. Actively maintained, Capacitor 8 support confirmed, returns Google ID token and Apple identity token.
- [capacitor-native-purchases — GitHub](https://github.com/Cap-go/capacitor-native-purchases) — MEDIUM confidence. Plugin v8.x = Capacitor 8.x, StoreKit 2, returns transactionId for server validation.
- [imdhemy/laravel-in-app-purchases — GitHub](https://github.com/imdhemy/laravel-in-app-purchases) — MEDIUM confidence. Laravel package for validating Apple and Google receipts server-side.
- [Capacitor IAP Guide](https://capacitorjs.com/docs/guides/in-app-purchases) — MEDIUM confidence. Official guide references cordova-plugin-purchase; capgo plugin is more current.
- [Offline-First Architecture (DEV)](https://dev.to/odunayo_dada/offline-first-mobile-app-architecture-syncing-caching-and-conflict-resolution-518n) — MEDIUM confidence. Local-first write pattern, sync queue design.
- [Laravel Sanctum Mobile Auth — Laravel News](https://laravel-news.com/using-sanctum-to-authenticate-a-mobile-app) — MEDIUM confidence. Token storage and header injection patterns for mobile.
- [Apple App Store Server API v2](https://developer.apple.com/documentation/appstoreserverapi) — HIGH confidence. JWS-based receipt validation (modern replacement for verifyReceipt endpoint).
- [Validating Android Purchases with Laravel — Go Foryt](https://blog.goforyt.com/validating-android-app-purchases-laravel/) — LOW confidence. Illustrative pattern, verify Google Play API approach at implementation time.

---

*Architecture research for: Poly N-Back M2 — Monetized Platform integration*
*Researched: 2026-03-02*

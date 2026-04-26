# Phase 9: Platform Polish - Research

**Researched:** 2026-03-02
**Domain:** Capacitor native integration (app lifecycle, haptics, crash reporting)
**Confidence:** HIGH

## Summary

Phase 9 addresses three native platform concerns: auto-pausing the game when the app is backgrounded, providing haptic feedback for game events, and installing Sentry crash reporting with Vue component context. All three are well-supported by mature Capacitor plugins and the Sentry SDK ecosystem.

The `@capacitor/app` plugin provides an `appStateChange` listener that fires on iOS (`UIApplication.willResignActiveNotification`), Android (`Activity.onStop`), and web (`visibilitychange`). The game store already has `pauseGame()` and `resumeGame()` actions, so wiring this up is straightforward. The `@capacitor/haptics` plugin provides `impact()` and `notification()` methods with typed enums for feedback styles. The haptics toggle must be opt-in (off by default) and persisted via `persistenceStore`. For Sentry, `@sentry/capacitor` v3.x added Capacitor 8 support and changed the Vue init pattern: Vue-specific options now go in `siblingOptions.vueOptions` rather than at the root of `Sentry.init()`. This addresses a prior bug where Vue's error handler was not set when using the Capacitor wrapper (GitHub issue #644).

**Primary recommendation:** Install `@capacitor/app@^8`, `@capacitor/haptics@^8`, `@sentry/capacitor@^3`, and `@sentry/vue@10.40.0`. Wire app state listener into the game lifecycle composable. Create a haptics utility that wraps `@capacitor/haptics` with a preference check. Replace the existing `console.error` global error handlers in `main.ts` with Sentry initialization.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PLSH-01 | Game auto-pauses when app is backgrounded via @capacitor/app appStateChange listener | @capacitor/app v8.0 provides `appStateChange` event with `isActive` boolean; gameStore already exposes `pauseGame()`/`resumeGame()` actions; listener should only pause during active gameplay (not menu/game-over) |
| PLSH-02 | Haptic feedback on correct/incorrect/game-over via @capacitor/haptics (opt-in toggle, off by default) | @capacitor/haptics v8.0 provides `impact()` and `notification()` with typed enums; no-op on unsupported devices; preference stored via persistenceStore; toggle added to settings UI |
| PLSH-03 | Sentry crash reporting active via @sentry/capacitor with Vue 3 error handler integration | @sentry/capacitor v3.x supports Capacitor 8; Vue options use `siblingOptions.vueOptions` pattern; `@sentry/vue` hooks into `app.config.errorHandler` to capture component name, props, and lifecycle hook context |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @capacitor/app | ^8.0.0 | App lifecycle events (background/foreground detection) | Official Capacitor plugin; only way to detect appStateChange on native platforms |
| @capacitor/haptics | ^8.0.0 | Native haptic feedback (impact, notification, vibration) | Official Capacitor plugin; graceful no-op on unsupported devices |
| @sentry/capacitor | ^3.1.0 | Crash reporting wrapper for Capacitor apps | Official Sentry SDK; v3.0 added Capacitor 8 support |
| @sentry/vue | 10.40.0 | Vue 3 error handler integration | Required peer of @sentry/capacitor v3.1; provides vueIntegration with component context |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @sentry/vue (createSentryPiniaPlugin) | 10.40.0 | Pinia state attachments to Sentry events | If you want store state captured with crash reports (optional, adds context) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @sentry/capacitor | @sentry/vue alone | Loses native crash reporting on iOS/Android; only captures JS errors |
| @capacitor/haptics | Web Vibration API | Not available on iOS WebKit; Capacitor plugin provides cross-platform Taptic Engine + Android vibrator support |

**Installation:**
```bash
npm install @capacitor/app@^8 @capacitor/haptics@^8 @sentry/capacitor@^3 @sentry/vue@10.40.0 --save-exact
npx cap sync
```

Note: `@sentry/vue` version MUST match the `@sentry/capacitor` peer dependency exactly (`10.40.0` for v3.1.x). Using `--save-exact` prevents accidental version drift.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── composables/
│   └── useGameLifecycle.ts   # Add appStateChange listener here
├── stores/
│   ├── gameStore.ts          # Existing: pauseGame/resumeGame
│   └── persistenceStore.ts   # Existing: store haptics preference
├── utils/
│   └── haptics.ts            # NEW: thin wrapper around @capacitor/haptics
├── main.ts                   # Replace console.error handlers with Sentry.init
└── sentry.ts                 # NEW: Sentry configuration (imported by main.ts)
```

### Pattern 1: App State Listener in Composable
**What:** Register `@capacitor/app` `appStateChange` listener inside the game lifecycle composable, auto-pausing when `isActive` becomes false during active gameplay.
**When to use:** Whenever the game is running (not on menu or game-over screens).
**Example:**
```typescript
// Source: https://capacitorjs.com/docs/apis/app
import { App } from '@capacitor/app';

// Inside useGameLifecycle or App.vue onMounted:
let appStateListener: PluginListenerHandle | null = null;

async function setupAppStateListener(gameStore: GameStore) {
  appStateListener = await App.addListener('appStateChange', ({ isActive }) => {
    if (!isActive && !gameStore.isStopped && !gameStore.isPaused) {
      gameStore.pauseGame();
    }
    // Do NOT auto-resume -- user should explicitly tap Resume
  });
}

// Cleanup in onUnmounted:
appStateListener?.remove();
```

### Pattern 2: Haptics Utility with Preference Gate
**What:** Thin wrapper function that checks the haptics preference before firing. No-ops on web and unsupported devices automatically.
**When to use:** Called from `respondToStimulus()` result handling and game-over logic.
**Example:**
```typescript
// src/utils/haptics.ts
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export async function hapticsCorrect(): Promise<void> {
  await Haptics.impact({ style: ImpactStyle.Light });
}

export async function hapticsIncorrect(): Promise<void> {
  await Haptics.notification({ type: NotificationType.Warning });
}

export async function hapticsGameOver(): Promise<void> {
  await Haptics.notification({ type: NotificationType.Error });
}
```

The preference check happens at the call site (gameStore or composable), NOT inside the utility. This keeps the utility pure and testable.

### Pattern 3: Sentry Init with Vue siblingOptions (v3.x pattern)
**What:** Initialize Sentry using the Capacitor wrapper, passing Vue-specific config through `siblingOptions.vueOptions`.
**When to use:** Once in `main.ts` before `app.mount()`.
**Example:**
```typescript
// src/sentry.ts
import * as Sentry from '@sentry/capacitor';
import * as SentryVue from '@sentry/vue';
import type { App } from 'vue';

export function initSentry(app: App): void {
  if (import.meta.env.PROD) {
    Sentry.init(
      {
        dsn: import.meta.env.VITE_SENTRY_DSN,
        release: `poly-n-back@${import.meta.env.VITE_APP_VERSION ?? '0.0.0'}`,
        environment: import.meta.env.MODE,
        siblingOptions: {
          vueOptions: {
            app,
            attachProps: true,
            trackComponents: true,
          },
        },
      },
      SentryVue.init,
    );
  }
}
```

### Anti-Patterns to Avoid
- **Auto-resuming on foreground:** Do NOT call `resumeGame()` when `isActive` becomes true. The user may have been interrupted by a phone call or notification. Always require explicit user action (tap Resume button) to continue.
- **Putting haptics in the UI layer:** Haptic feedback is a game logic concern (correct/incorrect/game-over), not a visual concern. Trigger haptics alongside audio in `respondToStimulus()` and `stopGame()`, not in Vue component event handlers.
- **Passing `app` to Sentry.init at root level (v3.x):** This was the old pattern. In `@sentry/capacitor` v3.0+, Vue options MUST go inside `siblingOptions.vueOptions`. Passing `app` at the root level will be silently ignored, and Vue's error handler will not be set.
- **Sentry init after app.mount():** Must call `Sentry.init()` BEFORE `app.mount('#app')` so the Vue error handler is installed before any component renders.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| App background detection | Custom `visibilitychange` + Cordova bridge | `@capacitor/app` appStateChange | Handles iOS/Android/Web platform differences; correct native lifecycle events |
| Haptic feedback | Direct `navigator.vibrate()` calls | `@capacitor/haptics` | `navigator.vibrate()` is not available on iOS; Capacitor plugin handles Taptic Engine on iOS and Vibrator on Android |
| Crash reporting | Manual `window.onerror` + remote logging | `@sentry/capacitor` + `@sentry/vue` | Source maps, breadcrumbs, Vue component context, native crash capture, release tracking |
| Haptics "supported" check | `try/catch` around `Haptics.impact()` | N/A -- API calls are no-op on unsupported devices | The plugin resolves silently when hardware is unavailable; no detection needed |

**Key insight:** All three features map 1:1 to well-maintained Capacitor/Sentry plugins. There is zero custom native code needed. The work is integration and preference wiring, not implementation.

## Common Pitfalls

### Pitfall 1: appStateChange fires before game starts
**What goes wrong:** Listener triggers `pauseGame()` while user is on the menu screen, setting `isPaused: true`. Next game start doesn't clear it.
**Why it happens:** Listener is registered globally without checking game state.
**How to avoid:** Guard the listener callback: only call `pauseGame()` when `!gameStore.isStopped && !showModal.value` (game is actively running).
**Warning signs:** Game appears frozen after returning from background on menu screen.

### Pitfall 2: Sentry DSN in source code
**What goes wrong:** DSN committed to git; anyone with the DSN can send events to your project.
**Why it happens:** DSN put directly in source instead of environment variable.
**How to avoid:** Use `import.meta.env.VITE_SENTRY_DSN` and add the DSN to `.env.production` (gitignored). For CI, set it as a GitHub Actions secret.
**Warning signs:** DSN string visible in git history or built JS bundle.

### Pitfall 3: Haptics preference not loaded before first game
**What goes wrong:** Haptics fire on first game before the async preference load completes, or don't fire when they should.
**Why it happens:** `persistenceStore.loadPreference` is async; the haptics toggle ref starts at default (false) and isn't ready until after `loadPersistedState()`.
**How to avoid:** The default is `false` (off), which is the correct safe default. Haptics only fire after user enables them, by which time the preference is already loaded. No race condition exists with the "off by default" requirement.
**Warning signs:** Haptics firing before user opts in.

### Pitfall 4: @sentry/vue version mismatch with @sentry/capacitor
**What goes wrong:** Runtime errors or silent failures when `@sentry/vue` version doesn't match `@sentry/capacitor` peer requirement.
**Why it happens:** `@sentry/capacitor@3.1.0` requires `@sentry/vue@10.40.0` exactly. Running `npm install @sentry/vue` without pinning gets latest, which may differ.
**How to avoid:** Install with `--save-exact` and pin to `10.40.0`.
**Warning signs:** npm peer dependency warnings during install; Sentry events missing Vue context.

### Pitfall 5: Sentry in development mode
**What goes wrong:** Development errors flood Sentry project; noise drowns real production issues.
**Why it happens:** Sentry initialized without environment guard.
**How to avoid:** Only call `Sentry.init()` when `import.meta.env.PROD` is true. In dev, keep the existing `console.error` handlers.
**Warning signs:** Sentry dashboard full of HMR errors and Vue dev warnings.

### Pitfall 6: iOS minimum version requirement
**What goes wrong:** Build fails on older iOS targets.
**Why it happens:** `@sentry/capacitor` v3.0 raised minimum iOS from 11.0 to 15.0 (via Sentry Cocoa SDK v9).
**How to avoid:** Capacitor 8 already requires iOS 16+, so this is a non-issue for this project. But document the requirement.
**Warning signs:** Xcode build errors mentioning deployment target.

## Code Examples

Verified patterns from official sources:

### App State Change Listener
```typescript
// Source: https://capacitorjs.com/docs/apis/app
import { App, type PluginListenerHandle } from '@capacitor/app';

let listener: PluginListenerHandle | null = null;

// Register
listener = await App.addListener('appStateChange', ({ isActive }) => {
  console.log('App state changed. Is active?', isActive);
});

// Cleanup
listener.remove();
```

### Haptic Impact Feedback
```typescript
// Source: https://capacitorjs.com/docs/apis/haptics
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Light tap for correct answer
await Haptics.impact({ style: ImpactStyle.Light });

// Medium tap
await Haptics.impact({ style: ImpactStyle.Medium });

// Heavy tap
await Haptics.impact({ style: ImpactStyle.Heavy });
```

### Haptic Notification Feedback
```typescript
// Source: https://capacitorjs.com/docs/apis/haptics
import { Haptics, NotificationType } from '@capacitor/haptics';

// Success
await Haptics.notification({ type: NotificationType.Success });

// Warning (incorrect answer)
await Haptics.notification({ type: NotificationType.Warning });

// Error (game over)
await Haptics.notification({ type: NotificationType.Error });
```

### Sentry Capacitor v3 + Vue 3 Initialization
```typescript
// Source: https://github.com/getsentry/sentry-capacitor/blob/main/CHANGELOG.md (v3.0.0)
// Source: https://docs.sentry.io/platforms/javascript/guides/capacitor/
import * as Sentry from '@sentry/capacitor';
import * as SentryVue from '@sentry/vue';

const app = createApp(App);

Sentry.init(
  {
    dsn: '__PUBLIC_DSN__',
    release: 'poly-n-back@1.0.0',
    environment: 'production',
    siblingOptions: {
      vueOptions: {
        app,
        attachProps: true,
        trackComponents: true,
      },
    },
  },
  SentryVue.init,
);

app.mount('#app');
```

### Existing Error Handlers to Replace
```typescript
// Current main.ts -- these get REPLACED by Sentry in production:
app.config.errorHandler = (err, instance, info) => {
  console.error('[Vue Error]', err, info);
};
window.onerror = (message, source, lineno, colno, error) => {
  console.error('[Global Error]', { message, source, lineno, colno, error });
};
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise Rejection]', event.reason);
});
```

In production, `@sentry/vue` takes over `app.config.errorHandler` and captures `window.onerror` + `unhandledrejection` automatically. In development, keep the console.error handlers.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@sentry/capacitor` v2 with `app` at init root | v3 with `siblingOptions.vueOptions.app` | Feb 2026 (v3.0.0) | Vue options at root are silently ignored; must use siblingOptions |
| `@sentry/capacitor` v2 peer: `@sentry/vue@^8` | v3 peer: `@sentry/vue@10.40.0` | Feb 2026 (v3.0.0) | Must pin exact version |
| Minimum iOS 11.0 for Sentry | iOS 15.0+ | Feb 2026 (Cocoa SDK v9) | Non-issue: Capacitor 8 already requires iOS 16+ |
| `new Sentry.VueIntegration()` class-based | `Sentry.vueIntegration()` functional | Sentry JS SDK v8 | Class-based integrations removed |

**Deprecated/outdated:**
- `@sentry/capacitor` v2.x: Does not support Capacitor 8. Must use v3.0+.
- Root-level `app` in `Sentry.init()`: Silently ignored in v3.x. Use `siblingOptions.vueOptions.app`.
- `new Replay()` / `new VueIntegration()`: Class-based integration constructors removed in Sentry JS SDK v8. Use functional `replayIntegration()` / `vueIntegration()`.

## Open Questions

1. **Sentry DSN provisioning**
   - What we know: A Sentry project (sentry.io or self-hosted) must be created to get a DSN.
   - What's unclear: Whether the user already has a Sentry account/project, or if this needs to be set up.
   - Recommendation: Plan should include creating `.env.production` with a placeholder `VITE_SENTRY_DSN=` and document that the user must fill it in. Add `VITE_SENTRY_DSN` to `.env.example` if one exists. The code should gracefully handle a missing DSN (guard with `if (import.meta.env.VITE_SENTRY_DSN)` before calling init).

2. **Source maps upload for Sentry**
   - What we know: Sentry can ingest source maps for readable stack traces. The wizard (`npx @sentry/wizard@latest -i sourcemaps`) sets this up.
   - What's unclear: Whether source map upload should be part of this phase or deferred to CI/deployment.
   - Recommendation: Defer source map upload to a separate concern. This phase focuses on SDK integration and crash capture. Source maps can be configured when a CI/CD deployment pipeline is established.

3. **Haptics toggle UI placement**
   - What we know: A toggle must exist in settings, off by default. The current menu screen has ConfigStart (n-back input, timer input, start button) and IntroContent (how to play, tutorial link).
   - What's unclear: Best UX placement for the haptics toggle.
   - Recommendation: Add a small settings row below the ConfigStart inputs or in a footer settings section. Keep it minimal -- a labeled toggle/checkbox. Could be alongside the existing audio toggle pattern.

## Sources

### Primary (HIGH confidence)
- [Capacitor App Plugin docs](https://capacitorjs.com/docs/apis/app) - appStateChange API, platform behavior, listener interface
- [Capacitor Haptics Plugin docs](https://capacitorjs.com/docs/apis/haptics) - impact/notification/vibrate methods, ImpactStyle/NotificationType enums
- [Sentry Capacitor docs](https://docs.sentry.io/platforms/javascript/guides/capacitor/) - installation, init pattern
- [Sentry Vue docs](https://docs.sentry.io/platforms/javascript/guides/vue/) - Vue 3 init, component tracking, error handler integration
- [sentry-capacitor GitHub releases](https://github.com/getsentry/sentry-capacitor/releases) - v3.0.0 changelog: Capacitor 8 support, siblingOptions breaking change
- [sentry-capacitor CHANGELOG.md](https://github.com/getsentry/sentry-capacitor/blob/main/CHANGELOG.md) - v3.0.0 breaking changes detail
- [sentry-capacitor package.json](https://github.com/getsentry/sentry-capacitor/blob/main/package.json) - peer dependencies: @sentry/vue@10.40.0

### Secondary (MEDIUM confidence)
- [sentry-capacitor issue #644](https://github.com/getsentry/sentry-capacitor/issues/644) - Vue integration not loaded bug; workaround confirmed; v3.0 siblingOptions pattern likely resolves this
- [Sentry Vue component tracking docs](https://docs.sentry.io/platforms/javascript/guides/vue/features/component-tracking/) - trackComponents, attachProps, lifecycle hooks

### Tertiary (LOW confidence)
- [Capacitor Haptics web discussion](https://github.com/ionic-team/capacitor/discussions/3347) - Haptics plugin is no-op on web (not officially documented as such, but confirmed by community)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries are official Capacitor/Sentry plugins with verified version compatibility
- Architecture: HIGH - Integration points are clear (existing gameStore actions, existing persistenceStore, existing error handlers in main.ts)
- Pitfalls: HIGH - Sentry v3 siblingOptions pattern is documented in official changelog; version pinning requirements verified from package.json peer deps

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (stable ecosystem, 30-day validity)

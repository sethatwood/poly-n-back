# Phase 3: Capacitor Migration - Research

**Researched:** 2026-03-01
**Domain:** Capacitor native shell upgrade (5 to 8) with iOS/Android build verification
**Confidence:** HIGH

## Summary

Capacitor 8 (latest 8.1.0) is a mature release with well-documented migration paths. The project's situation is favorable: no custom native code, no live users, and native projects will be regenerated fresh. The direct jump from Cap 5 to 8 is feasible because native projects are being deleted and recreated -- the `npx cap migrate` tool is designed for single-version hops (7 to 8), but regenerating fresh sidesteps all intermediate migration concerns.

The three critical areas are: (1) npm package updates from `^5.5.1` to `^8.1.0` for all four Capacitor packages, (2) creating a new `capacitor.config.ts` with the updated app ID `com.polynback` and correct scheme/color settings, and (3) regenerating both `ios/` and `android/` directories via `npx cap add` followed by `npx cap sync`. The existing `server.androidScheme: "https"` setting aligns with Cap 8's default, so no localStorage data loss risk exists on Android. Since the app is not live, the app ID change from `fun.polynback` to `com.polynback` has zero migration consequences.

**Primary recommendation:** Delete both native directories, update all npm packages to `^8.1.0`, create `capacitor.config.ts`, then run `npx cap add ios --packagemanager SPM` and `npx cap add android` to get fresh Cap 8 native projects.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Direct jump from Capacitor 5 to 8 -- skip intermediate versions (6, 7)
- If the direct jump hits issues, debug against Cap 8 directly -- do not fall back to sequential migration
- Regenerate native projects fresh (delete ios/ and android/, let Cap 8 recreate them) -- no custom native code exists
- Update ROADMAP.md goal/criteria to reflect direct 5 to 8 approach instead of sequential 5 to 6 to 7 to 8
- Accept whatever minimums Capacitor 8 requires (likely iOS 16+, Android API 23+)
- No existing users on old devices -- app is not live yet
- Target latest stable Xcode (currently Xcode 26)
- Match Capacitor 8's required compileSdk, targetSdk, and Gradle version for Android
- Final Cap 8 step: full gameplay verification (play a game, hear audio, check scores persist, test iOS audio unlock)
- Simulator/emulator only -- no real device testing required for this migration
- Migrate from capacitor.config.json to capacitor.config.ts (TypeScript config)
- New app ID: `com.polynback` (replacing `fun.polynback` -- aligns with future polynback.com domain)
- Keep theme/background color: `#0f1729` (dark blue)

### Claude's Discretion
- Whether to keep or remove `server.androidScheme: "https"` based on Cap 8 defaults
- Exact order of operations within the migration (npm updates, config migration, native regen)
- Any Cap 8-specific config options that should be enabled

### Deferred Ideas (OUT OF SCOPE)
- Domain change to polynback.com -- infrastructure/DNS concern, not part of this migration
- localStorage to Capacitor Preferences migration -- Phase 4
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DEPS-06 | Capacitor upgraded from 5 to 8 with native build verified | Direct 5-to-8 jump via fresh native project regeneration. All four npm packages (@capacitor/core, @capacitor/cli, @capacitor/ios, @capacitor/android) updated to ^8.1.0. Fresh `npx cap add` creates Cap 8-native projects with correct Gradle, SDK versions, and SPM setup. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @capacitor/core | ^8.1.0 | Core runtime bridge between web and native | Required -- the Capacitor runtime |
| @capacitor/cli | ^8.1.0 | CLI tools for sync, add, build, migrate | Required -- manages native project lifecycle |
| @capacitor/ios | ^8.1.0 | iOS native platform integration | Required -- iOS WebView shell |
| @capacitor/android | ^8.1.0 | Android native platform integration | Required -- Android WebView shell |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | - | No additional Capacitor plugins needed for Phase 3 | Plugins like @capacitor/preferences, @capacitor/app, @capacitor/haptics are Phase 4/9 concerns |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SPM (default for new iOS) | CocoaPods (`--packagemanager CocoaPods`) | CocoaPods is legacy; SPM is the future. Since we're regenerating fresh, use SPM. No third-party plugins that would need CocoaPods compatibility. |

**Installation:**
```bash
npm install @capacitor/core@^8.1.0 @capacitor/cli@^8.1.0 @capacitor/ios@^8.1.0 @capacitor/android@^8.1.0
```

## Architecture Patterns

### Recommended Migration Order
```
1. npm update          # Update all 4 Capacitor packages to ^8.1.0
2. config migration    # Delete capacitor.config.json, create capacitor.config.ts
3. web build           # npm run build (produces dist/)
4. delete native dirs  # rm -rf ios/ android/
5. add ios             # npx cap add ios --packagemanager SPM
6. add android         # npx cap add android
7. sync                # npx cap sync
8. verify iOS build    # npx cap open ios -> build in Xcode 26 simulator
9. verify Android      # npx cap open android -> build in Android Studio
10. gameplay test      # Full gameplay verification on both simulators
```

### Pattern 1: capacitor.config.ts Format
**What:** TypeScript configuration file replacing JSON format
**When to use:** Always (user decision to migrate to .ts)
**Example:**
```typescript
// Source: https://capacitorjs.com/docs/config
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.polynback',
  appName: 'Poly N-Back',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#0f1729',
  },
  ios: {
    backgroundColor: '#0f1729',
  },
};

export default config;
```

### Pattern 2: Fresh Native Project Generation
**What:** Delete existing native directories and let Cap 8 CLI create new ones
**When to use:** When no custom native code exists and the version gap is large
**Example:**
```bash
# Build web assets first (Cap needs dist/ to exist)
npm run build

# Remove old native projects
rm -rf ios/ android/

# Add fresh Cap 8 native projects
npx cap add ios --packagemanager SPM
npx cap add android

# Sync web assets and config into native projects
npx cap sync
```

### Anti-Patterns to Avoid
- **Running `npx cap migrate` on a Cap 5 project:** The migrate command is designed for single-version hops (e.g., 7 to 8). On a Cap 5 project, it will not apply all intermediate changes correctly. Since we're regenerating fresh, this is irrelevant anyway.
- **Keeping old ios/android directories and patching them:** With a 3-major-version gap (5 to 8), the Gradle wrapper, AGP version, SDK targets, Podfile/SPM structure, and project templates are completely different. Fresh generation is cleaner.
- **Accepting Android Studio's AGP upgrade prompt to 9.0.0:** Cap 8 specifies AGP 8.13.0. Upgrading to AGP 9.0 breaks the build due to removed `proguard-android.txt` support. Dismiss the prompt.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Native project configuration | Manual Xcode/Android Studio project setup | `npx cap add ios/android` | Cap CLI generates correct project structure, SDK versions, dependencies |
| Gradle/AGP version management | Manual build.gradle editing | Fresh `npx cap add android` output | Cap 8 generates correct AGP 8.13.0, Gradle 8.14.3, compileSdk 36, targetSdk 36 |
| iOS dependency management | Manual Xcode package setup | `npx cap sync` with SPM | CLI manages CapApp-SPM package automatically |
| Config migration | Manual JSON-to-TS conversion | Write new capacitor.config.ts from scratch | Config is small (10 lines); rewriting is faster and less error-prone than converting |

**Key insight:** The Capacitor CLI is the authority on native project structure. Never manually edit generated files when the CLI can regenerate them correctly.

## Common Pitfalls

### Pitfall 1: androidScheme Change Causing Data Loss
**What goes wrong:** Changing `androidScheme` from `http` to `https` (or vice versa) is equivalent to changing the origin domain. All localStorage, cookies, and IndexedDB data become inaccessible.
**Why it happens:** Cap 5 defaulted to `http` for Android. Cap 6+ defaults to `https`. If the scheme changes, the WebView treats it as a different origin.
**How to avoid:** This project already has `server.androidScheme: "https"` set in its Cap 5 config, which matches the Cap 8 default. Keep it explicitly set in the new config to be safe. No data loss risk.
**Warning signs:** localStorage reads returning null after migration when they had data before.

### Pitfall 2: Forgetting to Build Web Assets Before cap add/sync
**What goes wrong:** `npx cap add` or `npx cap sync` fails or creates empty native projects because `dist/` doesn't exist.
**Why it happens:** Vite must build web assets into `dist/` before Capacitor can bundle them into native projects.
**How to avoid:** Always run `npm run build` before any `cap add` or `cap sync` command.
**Warning signs:** Missing web assets in the native app, blank screen on launch.

### Pitfall 3: Android Studio Prompts AGP Upgrade to 9.0
**What goes wrong:** Android Studio 2025.2.3+ may suggest upgrading AGP from 8.13.0 to 9.0.0. Accepting this breaks the build because AGP 9.0 removed support for `proguard-android.txt`.
**Why it happens:** Android Studio auto-detects newer AGP versions and suggests upgrades.
**How to avoid:** Dismiss the AGP upgrade prompt. Stay on AGP 8.13.0 as Capacitor 8 specifies. If already upgraded, revert `build.gradle` to AGP 8.13.0 and `gradle-wrapper.properties` to 8.14.3.
**Warning signs:** Build error mentioning `proguard-android.txt` not found.

### Pitfall 4: Edge-to-Edge Layout Changes on Android
**What goes wrong:** Cap 8 removes `android.adjustMarginsForEdgeToEdge` in favor of the new SystemBars core plugin. Content may render behind the status bar or navigation bar on Android.
**Why it happens:** Cap 8 adopts modern Android edge-to-edge layout by default.
**How to avoid:** The project already uses CSS `env(safe-area-inset-*)` variables in `style.css` and component styles, which is exactly what Cap 8 expects. The built-in SystemBars plugin (default `insetsHandling: 'css'`) injects `--safe-area-inset-*` CSS variables as fallbacks for older Android WebView. No code changes needed -- verify visually.
**Warning signs:** Content overlapping status bar or navigation bar on Android emulator.

### Pitfall 5: iOS SPM Project vs CocoaPods Confusion
**What goes wrong:** Mixing CocoaPods commands (like `pod install`) with an SPM-based project, or editing the CapApp-SPM package manually.
**Why it happens:** Historical habit from Cap 5 which used CocoaPods exclusively.
**How to avoid:** Use `--packagemanager SPM` when adding iOS. Never edit `CapApp-SPM/` directory manually -- `npx cap sync` manages it. Use `npx cap open ios` to open the `.xcodeproj` (not `.xcworkspace` which was the CocoaPods pattern).
**Warning signs:** Xcode can't find Capacitor framework, "no such module" errors.

### Pitfall 6: Stale DerivedData / Build Caches
**What goes wrong:** Xcode or Android Studio uses cached build artifacts from the old Cap 5 project, causing confusing build failures.
**Why it happens:** The `ios/DerivedData/` directory from the old project may persist, or Xcode's global DerivedData cache may have stale entries.
**How to avoid:** Delete `ios/DerivedData/` (it's gitignored anyway) when removing old `ios/` directory. In Xcode: Product -> Clean Build Folder. In Android Studio: Build -> Clean Project.
**Warning signs:** Build errors referencing old Capacitor versions or missing symbols.

## Code Examples

Verified patterns from official sources:

### capacitor.config.ts for This Project
```typescript
// Source: https://capacitorjs.com/docs/config
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.polynback',
  appName: 'Poly N-Back',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#0f1729',
  },
  ios: {
    backgroundColor: '#0f1729',
  },
};

export default config;
```

### Fresh iOS Project Generation (SPM)
```bash
# Source: https://capacitorjs.com/docs/ios/spm
npm run build
rm -rf ios/
npx cap add ios --packagemanager SPM
npx cap sync ios
npx cap open ios
```

### Fresh Android Project Generation
```bash
# Source: https://capacitorjs.com/docs/android
npm run build
rm -rf android/
npx cap add android
npx cap sync android
npx cap open android
```

### SystemBars CSS Fallback Pattern (already in project)
```css
/* Source: https://capacitorjs.com/docs/apis/system-bars */
/* The project's existing safe area CSS works with Cap 8's SystemBars plugin */
#app {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

### Android Build Verification
```bash
# Open in Android Studio
npx cap open android
# In Android Studio: Build -> Make Project (or Run on emulator)
# Expected: Clean build, app launches, WebView loads dist/ content
```

### iOS Build Verification
```bash
# Open in Xcode
npx cap open ios
# In Xcode: Select a simulator target, click Run (Cmd+R)
# Expected: Clean build, app launches, WebView loads dist/ content
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CocoaPods for iOS deps | Swift Package Manager (SPM) default | Cap 8 (2025) | New `npx cap add ios` creates SPM project. Cleaner, no Podfile needed. |
| `android.adjustMarginsForEdgeToEdge` | SystemBars core plugin with CSS env vars | Cap 8 (2025) | Edge-to-edge handled via CSS, not native margin adjustments |
| `capacitor.config.json` only | `capacitor.config.ts` supported | Cap 3+ (available since 2021) | TypeScript config enables conditional logic and type checking |
| Gradle 8.2 / AGP 8.2.0 (Cap 5) | Gradle 8.14.3 / AGP 8.13.0 (Cap 8) | Cap 8 (2025) | Must use newer build tools; old versions incompatible |
| `androidScheme` default `http` (Cap 5) | `androidScheme` default `https` (Cap 6+) | Cap 6 (2024) | This project already uses https -- no impact |
| CAPBridgeViewController manual notifications | Auto-handled by Cap 8 | Cap 8 (2025) | Remove custom viewDidAppear/viewWillTransition overrides if any (none in this project) |
| `bridge_layout_main.xml` (Android) | `capacitor_bridge_layout_main.xml` | Cap 8 (2025) | Fresh generation handles this automatically |

**Deprecated/outdated:**
- CocoaPods: Still works but SPM is the default and recommended path for new projects
- `android.adjustMarginsForEdgeToEdge`: Removed entirely in Cap 8; use SystemBars plugin CSS handling
- `bundledWebRuntime` config option: Removed in Cap 7
- `cordova.staticPlugins` config option: Removed in Cap 7

## Claude's Discretion Recommendations

### androidScheme: Keep "https" explicitly
**Recommendation:** Keep `server.androidScheme: "https"` in the new `capacitor.config.ts`.
**Reasoning:** While Cap 8 defaults to `https`, explicitly setting it documents intent and prevents surprises if defaults ever change. The project's Cap 5 config already had this set, so there's zero data migration risk. Cost is one line of config.

### Order of Operations
**Recommendation:** npm updates first, then config migration, then native regeneration.
**Reasoning:** The Capacitor CLI reads `capacitor.config.ts` during `npx cap add`. The config must exist and be correct before generating native projects. npm packages must be at v8 before the CLI can generate v8 native projects. Build web assets (`npm run build`) before `cap add` so the native projects include bundled web content.

### Cap 8-Specific Config Options
**Recommendation:** No additional config options needed for Phase 3. The SystemBars plugin works with defaults (`insetsHandling: 'css'`, `style: 'DEFAULT'`). The project's existing CSS safe-area-inset handling is compatible.
**Reasoning:** The app already handles safe areas via CSS env vars. Adding SystemBars configuration would only be needed to customize status bar appearance, which is a Phase 9 (Platform Polish) concern if at all.

## Expected variables.gradle Values (Cap 8)

For reference, the Cap 8 fresh Android project will generate these values (replacing the current Cap 5 values):

| Property | Cap 5 (current) | Cap 8 (target) |
|----------|-----------------|----------------|
| minSdkVersion | 22 | 24 |
| compileSdkVersion | 33 | 36 |
| targetSdkVersion | 33 | 36 |
| androidxActivityVersion | 1.7.0 | 1.11.0 |
| androidxAppCompatVersion | 1.6.1 | 1.7.1 |
| androidxCoordinatorLayoutVersion | 1.2.0 | 1.3.0 |
| androidxCoreVersion | 1.10.0 | 1.17.0 |
| androidxFragmentVersion | 1.5.6 | 1.8.9 |
| coreSplashScreenVersion | 1.0.0 | 1.2.0 |
| androidxWebkitVersion | 1.6.1 | 1.14.0 |
| Gradle wrapper | 8.2 | 8.14.3 |
| AGP (build.gradle) | 8.2.0 | 8.13.0 |

These are generated automatically by `npx cap add android` -- no manual editing required.

## Open Questions

1. **Xcode 26 SPM Compatibility**
   - What we know: Cap 8 docs say Xcode 26.0+ required. SPM is the default for new iOS projects.
   - What's unclear: Whether Xcode 26.3 (user's installed version) has any SPM-specific quirks with Cap 8.
   - Recommendation: Proceed with SPM. If Xcode build fails, the error will be specific and debuggable. CocoaPods fallback (`--packagemanager CocoaPods`) is available but unlikely needed.

2. **Android Studio Version on User's Machine**
   - What we know: Cap 8 requires Android Studio Otter (2025.2.1)+. The user hasn't confirmed their installed version.
   - What's unclear: Whether the user has the required Android Studio version installed.
   - Recommendation: Check Android Studio version at plan execution time. If outdated, upgrading Android Studio is a prerequisite step.

3. **Gradle Property Syntax Deprecation**
   - What we know: Cap 8 migration guide warns that Gradle deprecated the old property syntax (e.g., `namespace "fun.polynback"`) in favor of equals syntax (`namespace = "fun.polynback"`). This currently only produces warnings but will break in future Gradle versions.
   - What's unclear: Whether `npx cap add android` generates files with the new syntax or the old syntax.
   - Recommendation: After generating the Android project, check if `app/build.gradle` uses `=` syntax. If not, update it. This is a minor fixup.

## Sources

### Primary (HIGH confidence)
- [Capacitor 8 Update Guide](https://capacitorjs.com/docs/updating/8-0) - Complete migration steps, breaking changes, variables.gradle values
- [Capacitor Configuration Docs](https://capacitorjs.com/docs/config) - CapacitorConfig interface, server defaults, platform options
- [Capacitor SPM Documentation](https://capacitorjs.com/docs/ios/spm) - SPM setup, migration from CocoaPods, plugin compatibility
- [SystemBars Plugin API](https://capacitorjs.com/docs/apis/system-bars) - Edge-to-edge configuration, CSS variable injection, insetsHandling options
- [@capacitor/core npm](https://www.npmjs.com/package/@capacitor/core) - Latest version 8.1.0

### Secondary (MEDIUM confidence)
- [Capacitor 8 Announcement](https://ionic.io/blog/announcing-capacitor-8) - SPM adoption, edge-to-edge support, adoption metrics
- [Cap 6 Update Guide](https://capacitorjs.com/docs/updating/6-0) - androidScheme default change from http to https, data loss implications
- [Cap 7 Update Guide](https://capacitorjs.com/docs/updating/7-0) - Removed config options (bundledWebRuntime, cordova.staticPlugins)
- [GitHub Issue #8314](https://github.com/ionic-team/capacitor/issues/8314) - AGP 9.0 build failure with proguard-android.txt (resolved)

### Tertiary (LOW confidence)
- [Nouman Sehgal Migration Guide](https://noumansehgal.com/blog/migrating-capacitor-7-to-8-guide) - Community walkthrough, used for cross-reference only

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official npm packages, well-documented versions, straightforward dependency update
- Architecture: HIGH - Fresh native project regeneration is the simplest and most reliable path; official CLI handles all complexity
- Pitfalls: HIGH - androidScheme data loss, AGP version conflicts, and edge-to-edge changes are well-documented with clear mitigations; all verified against official docs

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (Capacitor 8.x is stable; minor version bumps unlikely to affect migration strategy)

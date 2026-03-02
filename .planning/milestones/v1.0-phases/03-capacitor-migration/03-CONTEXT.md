# Phase 3: Capacitor Migration - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Upgrade the Capacitor native shell from version 5 to version 8 with verified iOS and Android builds. This is a direct jump (not sequential through 6/7). Native projects are regenerated fresh. The app ID changes from `fun.polynback` to `com.polynback`.

</domain>

<decisions>
## Implementation Decisions

### Migration strategy
- Direct jump from Capacitor 5 to 8 — skip intermediate versions (6, 7)
- If the direct jump hits issues, debug against Cap 8 directly — do not fall back to sequential migration
- Regenerate native projects fresh (delete ios/ and android/, let Cap 8 recreate them) — no custom native code exists
- Update ROADMAP.md goal/criteria to reflect direct 5→8 approach instead of sequential 5→6→7→8

### Platform minimums
- Accept whatever minimums Capacitor 8 requires (likely iOS 16+, Android API 23+)
- No existing users on old devices — app is not live yet
- Target latest stable Xcode (currently Xcode 26)
- Match Capacitor 8's required compileSdk, targetSdk, and Gradle version for Android

### Build verification depth
- Final Cap 8 step: full gameplay verification (play a game, hear audio, check scores persist, test iOS audio unlock)
- Simulator/emulator only — no real device testing required for this migration
- If intermediate steps were needed (fallback): compile + launch is sufficient

### Config & project format
- Migrate from capacitor.config.json to capacitor.config.ts (TypeScript config)
- New app ID: `com.polynback` (replacing `fun.polynback` — aligns with future polynback.com domain)
- Keep theme/background color: `#0f1729` (dark blue)

### Claude's Discretion
- Whether to keep or remove `server.androidScheme: "https"` based on Cap 8 defaults
- Exact order of operations within the migration (npm updates, config migration, native regen)
- Any Cap 8-specific config options that should be enabled

</decisions>

<specifics>
## Specific Ideas

- Domain is moving to polynback.com, so app ID should be `com.polynback` not `fun.polynback`
- Since app isn't live, there are zero constraints from existing installs or store listings

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `capacitor.config.json`: Simple config with appId, webDir, server scheme, and background colors — easy to port to .ts format
- No additional Capacitor plugins in use — just core, cli, ios, android packages

### Established Patterns
- Web Audio API with iOS AudioContext unlock flow (`unlockAudio()` in gameStore) — must survive migration
- localStorage for persistence (high scores, achievements, audio pref) — Phase 4 migrates to Capacitor Preferences, but Phase 3 must not break existing localStorage access
- Safe area insets in CSS (style.css, App.vue) — may need adjustment if Cap 8 changes webview behavior

### Integration Points
- `ios/App/Podfile` — will be regenerated (currently minimal: just Capacitor pods)
- `android/variables.gradle` — will be regenerated (currently minSdk 22, targetSdk 33)
- `vite.config.js` — Cap 8 may require build output changes (webDir: dist)
- `index.html` — viewport-fit=cover and manifest.json reference should be preserved

</code_context>

<deferred>
## Deferred Ideas

- Domain change to polynback.com — infrastructure/DNS concern, not part of this migration
- localStorage → Capacitor Preferences migration — Phase 4

</deferred>

---

*Phase: 03-capacitor-migration*
*Context gathered: 2026-03-01*

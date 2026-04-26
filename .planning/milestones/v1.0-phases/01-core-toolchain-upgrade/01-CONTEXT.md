# Phase 1: Core Toolchain Upgrade - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Upgrade the build toolchain to Node 22, Vue 3.5, Pinia 3, Vite 7, and remove dead dependencies. The app must build and run identically to current behavior after all upgrades. No new features, no architecture changes beyond what the upgrades require.

</domain>

<decisions>
## Implementation Decisions

### Package manager
- Stay with npm — Node 22 ships npm 10 which is a meaningful speed improvement over current npm 8
- No migration to pnpm or bun — user's work machine relies on npm for day job projects
- Delete and regenerate package-lock.json after upgrades to get clean v3 lockfile

### Dead dependency cleanup
- Remove from package.json: postcss, autoprefixer, register-service-worker, @vue/cli-plugin-pwa
- Delete src/registerServiceWorker.js and remove its import from main.js
- Keep public/manifest.json and PWA icon files — web version may become a marketing funnel to drive app store installs
- Keep index.html manifest link intact

### Pinia 3 store syntax
- Migrate gameStore.js from options API (state/actions/getters) to setup syntax (ref/computed/function) during this phase
- This front-loads the syntax migration so Phase 5 (Store Extraction) can focus purely on splitting stores, and Phase 7 (TypeScript) gets a cleaner starting point

### Claude's Discretion
- Upgrade sequencing order (which dep to upgrade first)
- How to handle any Vite 7 config changes (vite.config.js adjustments)
- Whether to update .github/workflows/deploy.yml to Node 22 now or defer to Phase 8

</decisions>

<specifics>
## Specific Ideas

- Web version deploys to GitHub Pages and may serve as a teaser/funnel for paid native app — preserve web-facing assets
- "Migrate as much as possible to the latest and greatest" — user prefers forward-looking choices over minimal-change safety

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- gameStore.js: Single Pinia store with all game logic — will be rewritten to setup syntax during this phase
- vite.config.js: Minimal config (Vue plugin only, no aliases) — straightforward to update for Vite 7

### Established Patterns
- No path aliases configured — relative imports only
- PostCSS pipeline (tailwind + autoprefixer) currently in postcss.config.js — autoprefixer removal may simplify this
- 2-space indentation, semicolons, ES modules (type: "module" in package.json)

### Integration Points
- .github/workflows/deploy.yml references Node 18 — needs update for Node 22
- capacitor.config.json unchanged (Capacitor upgrade is Phase 3)
- tailwind.config.js unchanged (Tailwind upgrade is Phase 2)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-core-toolchain-upgrade*
*Context gathered: 2026-03-01*

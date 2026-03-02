# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Harden the Foundation

**Shipped:** 2026-03-02
**Phases:** 10 | **Plans:** 24 | **Execution time:** 1.41 hours

### What Was Built
- Modern toolchain: Node 22, Vue 3.5, Vite 7, Pinia 3, Capacitor 8, Tailwind 4
- Full bug fix pass: division-by-zero, debounce, history cap, storage migration, audio degradation
- Clean architecture: 3 Pinia stores, 4 composables, 17 focused Vue components
- TypeScript strict mode with zero type errors
- 58 automated tests (unit + integration + E2E) with GitHub Actions CI
- Native platform polish: auto-pause, haptic feedback, Sentry crash reporting

### What Worked
- **Sequential dependency ordering** — upgrading deps first (when codebase was simplest) eliminated cascading breakage. Each phase built on stable ground.
- **Architecture before types, types before tests** — extracting stores/composables/components first gave TypeScript clean API surfaces to type, and tests stable interfaces to test against. Zero rework.
- **GSD workflow execution speed** — 24 plans in 1.41 hours total execution time. Research + plan + execute + verify loop was tight.
- **Direct Capacitor 5→8 jump** — skipping intermediate versions and regenerating native projects was cleaner than incremental migration.
- **Milestone audit before completion** — catching the LINT-CI-GAP before declaring done prompted Phase 10, which resolved real issues.

### What Was Inefficient
- **Phase 10 was reactive** — the lint regression (20 ESLint errors, lint not in CI) should have been caught during Phase 4 or Phase 7, not discovered by audit.
- **SUMMARY.md one-liners** — the `summary-extract` tool returned null for all files; one-liner format may not have been populated correctly during execution. Had to read files manually.
- **Early phases needed human verification** — Phases 1-3 and 10 had `human_needed` verification status for runtime/visual/device checks that couldn't be automated.

### Patterns Established
- **Composable dependency injection** — composables accept store as parameter rather than importing internally, keeping them testable
- **`defineProps<Props>()` with local interface** — established pattern for all component props
- **`ReturnType<typeof useStore>` pattern** — for typing store parameters in composables
- **Separate `vitest.config.ts`** — avoids TypeScript/Vite 7 config conflicts
- **E2E tests use text/ARIA selectors** — resilient to CSS class changes
- **`eslint-disable` with `--` suffix convention** — consistent documentation for justified disables

### Key Lessons
1. **Lint should be in CI from the moment it's configured.** Adding lint tooling in Phase 4 but not gating CI on it until Phase 10 allowed regressions to accumulate silently.
2. **Fresh native project regeneration > incremental Capacitor migration.** For major version jumps (5→8), starting fresh with `npx cap add` is cleaner than trying to patch existing native projects.
3. **Architecture extraction is the highest-leverage phase.** Once stores, composables, and components were separated (Phases 5-6), TypeScript migration and testing went smoothly because each unit had clear boundaries.
4. **Milestone audits catch real gaps.** The v1.0 audit identified lint regression and Sentry DSN issues that would have shipped unnoticed.

### Cost Observations
- Model mix: primarily opus for planning/execution, sonnet/haiku for research agents
- Sessions: ~4-5 across 2 days
- Notable: 24 plans averaging 3.5 minutes each — research + plan-check agents added quality without significant time overhead

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Execution Time | Phases | Key Change |
|-----------|---------------|--------|------------|
| v1.0 | 1.41 hours | 10 | First milestone — established GSD workflow patterns |

### Cumulative Quality

| Milestone | Tests | TypeScript | CI Pipeline |
|-----------|-------|------------|-------------|
| v1.0 | 58 | strict mode | lint + type-check + test + build + e2e |

### Top Lessons (Verified Across Milestones)

1. Order matters: deps → bugs → architecture → types → tests → polish minimizes rework
2. Milestone audits before completion catch real gaps worth fixing

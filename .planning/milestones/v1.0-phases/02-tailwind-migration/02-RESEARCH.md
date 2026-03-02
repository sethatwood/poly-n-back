# Phase 2: Tailwind Migration - Research

**Researched:** 2026-03-01
**Domain:** CSS framework migration (Tailwind CSS 3.4 to 4.2)
**Confidence:** HIGH

## Summary

Tailwind CSS 4 is a ground-up rewrite with a Rust-powered engine, CSS-first configuration, and automatic content detection. The migration from v3 to v4 replaces the JavaScript config file + PostCSS pipeline with a first-party Vite plugin (`@tailwindcss/vite`) and CSS-native `@theme` directives. The official `npx @tailwindcss/upgrade` tool automates roughly 90% of changes -- dependency updates, config migration, import syntax rewrites, and class renames in templates.

This project's migration is **low-to-moderate complexity**. The codebase has 11 Vue components and 1 CSS file. There are no `@apply` directives in Vue SFC `<style>` blocks (avoiding the biggest Vue+TW4 pitfall). The main risk areas are: (1) a handful of deprecated opacity utilities (`ring-opacity-50`) that the upgrade tool does NOT handle automatically, (2) gradient class renames (`bg-gradient-to-r` to `bg-linear-to-r`), (3) the default border color change from `gray-200` to `currentColor`, and (4) hover variant behavior on touch/Capacitor WebView requiring a `@custom-variant` override. All are well-understood, documented, and fixable with targeted edits.

**Primary recommendation:** Run `npx @tailwindcss/upgrade`, then manually fix the ~6 specific class patterns the tool misses, add the hover `@custom-variant` override for Capacitor touch devices, and verify each game screen visually.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DEPS-05 | Tailwind CSS upgraded from 3 to 4.2+ with @tailwindcss/vite replacing PostCSS pipeline | Fully supported. @tailwindcss/vite@4.2.1 supports Vite 7 (peer dep `^5.2.0 \|\| ^6 \|\| ^7`). PostCSS config and tailwind.config.js are replaced by Vite plugin + CSS @theme. Automated upgrade tool handles dependency swap. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tailwindcss | 4.2.1 | CSS utility framework | Current stable, CSS-first config, 5x faster builds |
| @tailwindcss/vite | 4.2.1 | Vite integration plugin | First-party, replaces PostCSS pipeline, automatic content detection |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tailwindcss/upgrade | 4.2.1 | Automated migration tool | Run once during migration to automate 90% of changes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @tailwindcss/vite | @tailwindcss/postcss | PostCSS route works but is slower and requires more config; Vite plugin is the recommended path for Vite projects |

### Removed (no longer needed)
| Package | Why Removed |
|---------|-------------|
| postcss (as Tailwind pipeline) | @tailwindcss/vite handles CSS processing internally |
| tailwind.config.js | Configuration moves to CSS @theme directive in style.css |
| postcss.config.js | No longer needed when using @tailwindcss/vite |

**Installation:**
```bash
# Step 1: Run automated upgrade (handles deps + config + class renames)
npx @tailwindcss/upgrade

# Or manual equivalent:
npm install tailwindcss@latest @tailwindcss/vite@latest
npm uninstall postcss  # if still in deps (was already removed in Phase 1)
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── style.css           # Tailwind entry: @import "tailwindcss" + @theme + overrides
├── App.vue             # No @apply in <style> blocks (current pattern is correct)
├── [Component].vue     # Tailwind classes in templates only (current pattern is correct)
vite.config.js          # @tailwindcss/vite plugin added to plugins array
```

### Pattern 1: CSS Entry Point (style.css)
**What:** Single CSS file with Tailwind import, theme customization, and base overrides
**When to use:** Always -- this replaces tailwind.config.js
**Example:**
```css
/* Source: https://tailwindcss.com/docs/upgrade-guide */
@import "tailwindcss";

@theme {
  --font-sans: 'Share Tech Mono', monospace;
}

/* Restore v3 button cursor behavior for non-disabled buttons */
@layer base {
  button:not(:disabled),
  [role="button"]:not(:disabled) {
    cursor: pointer;
  }
}

/* Override hover variant for Capacitor touch WebView */
@custom-variant hover (&:hover);
```

### Pattern 2: Vite Plugin Configuration
**What:** Add @tailwindcss/vite to Vite plugins, replacing PostCSS-based Tailwind
**When to use:** Always for Vite projects
**Example:**
```javascript
// Source: https://tailwindcss.com/docs/upgrade-guide
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
})
```

### Pattern 3: Dynamic Class Bindings (No Change Needed)
**What:** Vue dynamic `:class` bindings with Tailwind classes work identically in v4
**When to use:** This project uses dynamic classes extensively for button states, feedback colors, and animation triggers
**Example:**
```javascript
// These patterns work unchanged in TW4 (automatic content detection finds them):
const buttonClass = (isResponded) => {
  return isResponded
    ? 'bg-slate-700/40 text-slate-500 cursor-not-allowed'
    : 'bg-blue-600 hover:bg-blue-500';
};
```

### Anti-Patterns to Avoid
- **Using @apply in Vue SFC `<style>` blocks:** Causes build performance issues in TW4 (out-of-memory on 50+ components). This project correctly avoids @apply entirely -- keep it that way.
- **Keeping tailwind.config.js alongside @tailwindcss/vite:** Creates confusion about which config is active. Migrate config to CSS @theme and delete the JS file.
- **Using @tailwind directives instead of @import:** The old `@tailwind base; @tailwind components; @tailwind utilities;` syntax is replaced by `@import "tailwindcss";`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Migration automation | Manual find-and-replace of class names | `npx @tailwindcss/upgrade` | Handles deps, config, imports, and ~90% of class renames automatically |
| Vendor prefixing | Custom PostCSS autoprefixer setup | Built into @tailwindcss/vite | TW4 includes Lightning CSS which handles prefixing internally |
| Content detection | Manual content glob configuration | @tailwindcss/vite auto-detection | The Vite plugin discovers template files automatically, no content config needed |

**Key insight:** The upgrade tool exists specifically to handle this migration. Running it first and then fixing the remaining ~10% manually is far safer and faster than attempting a full manual migration.

## Common Pitfalls

### Pitfall 1: Deprecated Opacity Utilities Not Caught by Upgrade Tool
**What goes wrong:** `ring-opacity-50`, `bg-opacity-*`, `text-opacity-*` classes silently stop working (no error, just no visual effect)
**Why it happens:** The upgrade tool operates on individual class names and doesn't understand the connection between e.g. `ring-indigo-200` and `ring-opacity-50` (they need to be merged into `ring-indigo-200/50`)
**How to avoid:** After running the upgrade tool, manually search for and replace these patterns:
- `ring-{color} ring-opacity-{n}` becomes `ring-{color}/{n}` (e.g., `ring-indigo-200 ring-opacity-50` becomes `ring-indigo-200/50`)
- `ring-slate-600 ring-opacity-50` becomes `ring-slate-600/50`
**Warning signs:** Visual inspection shows rings, borders, or backgrounds at full opacity instead of reduced
**Affected files in this project:**
- `src/ConfigStart.vue`: `focus:ring focus:ring-indigo-200 focus:ring-opacity-50` (2 instances)
- `src/Stimulus.vue`: `ring-2 ring-slate-600 ring-opacity-50` (1 instance, in dynamic class binding)

### Pitfall 2: Gradient Class Rename
**What goes wrong:** `bg-gradient-to-r` stops rendering gradients
**Why it happens:** TW4 renames `bg-gradient-*` to `bg-linear-*`
**How to avoid:** The upgrade tool should handle this automatically, but verify. Search for `bg-gradient-to-` in templates.
**Affected files in this project:**
- `src/AchievementToast.vue`: `bg-gradient-to-r` (1 instance)
- `src/GameOverModal.vue`: `bg-gradient-to-r` (1 instance)

### Pitfall 3: Default Border Color Change
**What goes wrong:** Elements using `border` class without explicit color get `currentColor` borders instead of subtle `gray-200`
**Why it happens:** TW4 changes default border color from `gray-200` to `currentColor`
**How to avoid:** This project already specifies explicit border colors everywhere (`border-slate-700`, `border-gray-600`, `border-gray-300`, `border-yellow-500/50`). No action needed, but verify visually.
**Warning signs:** Dark borders appearing on elements that previously had light gray borders

### Pitfall 4: Shadow/Ring/Rounded Scale Renames
**What goes wrong:** Visual elements appear with wrong sizing due to renamed scale utilities
**Why it happens:** TW4 shifts scale names: `shadow-sm` becomes `shadow-xs`, `shadow` becomes `shadow-sm`, `rounded-sm` becomes `rounded-xs`, `rounded` becomes `rounded-sm`, `ring` (3px) becomes `ring-3` (1px default for bare `ring`)
**How to avoid:** The upgrade tool handles these renames. Verify after running.
**Affected files in this project:**
- `shadow-sm` in ConfigStart.vue (3 instances) -- will become `shadow-xs`
- `shadow-lg` used extensively (already explicit, not affected)
- `shadow-2xl` used in modals (already explicit, not affected)
- `focus:ring` in ConfigStart.vue (2 instances) -- `ring` utility changes from 3px to 1px; needs `ring-3` for v3 behavior
- `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-full` (already explicit, not affected)
- `backdrop-blur-sm` in GameOverModal, PauseModal, GameHint (3 instances) -- will become `backdrop-blur-xs`

### Pitfall 5: Hover Variant Breaks on Capacitor Touch Devices
**What goes wrong:** `hover:bg-blue-500`, `hover:text-white`, etc. stop working on iOS/Android WebView
**Why it happens:** TW4 wraps hover in `@media (hover: hover)` which excludes touch-primary devices. Capacitor's WKWebView/Android WebView reports as touch-primary.
**How to avoid:** Add `@custom-variant hover (&:hover);` to style.css. This restores v3 behavior where hover applies universally. This is the correct choice for a Capacitor hybrid app -- buttons with `active:` states already handle the touch interaction, and hover provides visual feedback that doesn't hurt on touch.
**Warning signs:** Hover-styled buttons appear flat/unstyled when tapped on device (but work fine in desktop browser)
**Affected files:** All 7 components use `hover:` variants (App.vue, ConfigStart.vue, GameOverModal.vue, PauseModal.vue, IntroHead.vue, IntroContent.vue, TutorialOverlay.vue)

### Pitfall 6: focus:outline-none Accessibility Rename
**What goes wrong:** `focus:outline-none` sets `outline-style: none` which removes accessibility focus indicators entirely
**Why it happens:** TW4 renames `outline-none` to `outline-hidden` (which uses `outline: 2px solid transparent` instead, preserving Windows High Contrast Mode accessibility). `outline-none` still works but is now the more destructive version.
**How to avoid:** The upgrade tool should rename these. Verify the two instances:
- `src/ConfigStart.vue`: `focus:outline-none` (1 instance)
- `src/App.vue`: `focus:outline-none` (1 instance)

### Pitfall 7: Button Default Cursor Change
**What goes wrong:** Buttons no longer show `cursor: pointer` on desktop hover
**Why it happens:** TW4 changes button default cursor from `pointer` to `default`
**How to avoid:** Add a base layer override in style.css (shown in Pattern 1 above). Low priority for this project since it's primarily a mobile/Capacitor app, but good practice.

## Code Examples

Verified patterns from official sources:

### CSS Entry Point Migration (style.css)
```css
/* Source: https://tailwindcss.com/docs/upgrade-guide */

/* BEFORE (v3): */
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

/* AFTER (v4): */
@import "tailwindcss";

@theme {
  --font-sans: 'Share Tech Mono', monospace;
}
```

### Opacity Utility Migration
```html
<!-- Source: https://tailwindcss.com/docs/upgrade-guide -->

<!-- BEFORE (v3): -->
<input class="focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />

<!-- AFTER (v4): -->
<input class="focus:ring-3 focus:ring-indigo-200/50" />
```

### Gradient Class Migration
```html
<!-- Source: https://tailwindcss.com/docs/upgrade-guide -->

<!-- BEFORE (v3): -->
<div class="bg-gradient-to-r from-amber-600 to-yellow-500">

<!-- AFTER (v4): -->
<div class="bg-linear-to-r from-amber-600 to-yellow-500">
```

### Ring Width Migration
```html
<!-- Source: https://tailwindcss.com/docs/upgrade-guide -->

<!-- BEFORE (v3): ring = 3px width -->
<input class="focus:ring focus:ring-indigo-200" />

<!-- AFTER (v4): ring = 1px width, use ring-3 for v3 behavior -->
<input class="focus:ring-3 focus:ring-indigo-200" />
```

### Hover Override for Capacitor/Touch
```css
/* Source: https://tailwindcss.com/docs/upgrade-guide */

/* Restores v3 hover behavior (no @media (hover: hover) wrapper) */
@custom-variant hover (&:hover);
```

### Shadow Scale Rename
```html
<!-- Source: https://tailwindcss.com/docs/upgrade-guide -->

<!-- BEFORE (v3): -->
<div class="shadow-sm">    <!-- 0 1px 2px -->
<div class="shadow">       <!-- 0 1px 3px -->
<div class="backdrop-blur-sm">

<!-- AFTER (v4): -->
<div class="shadow-xs">    <!-- 0 1px 2px (was shadow-sm) -->
<div class="shadow-sm">    <!-- 0 1px 3px (was shadow) -->
<div class="backdrop-blur-xs">
```

## State of the Art

| Old Approach (TW3) | Current Approach (TW4) | When Changed | Impact |
|---------------------|------------------------|--------------|--------|
| tailwind.config.js (JavaScript) | @theme in CSS | v4.0 (Jan 2025) | Config lives in CSS, no JS needed |
| PostCSS plugin pipeline | @tailwindcss/vite first-party plugin | v4.0 (Jan 2025) | Faster builds, less config |
| `@tailwind base/components/utilities` | `@import "tailwindcss"` | v4.0 (Jan 2025) | Single import replaces three directives |
| Content globs in config | Automatic content detection | v4.0 (Jan 2025) | No configuration needed |
| `bg-gradient-to-*` | `bg-linear-to-*` | v4.0 (Jan 2025) | Class rename for semantic accuracy |
| `*-opacity-*` utilities | Color/opacity syntax (`/50`) | v4.0 (Jan 2025) | Deprecated utilities removed |
| `ring` = 3px | `ring` = 1px, `ring-3` = 3px | v4.0 (Jan 2025) | Scale shift |
| `shadow-sm/shadow` | `shadow-xs/shadow-sm` | v4.0 (Jan 2025) | Scale shift |
| `outline-none` (safe) | `outline-hidden` (safe), `outline-none` (destructive) | v4.0 (Jan 2025) | Accessibility improvement |
| Hover always applies | Hover only on hover-capable devices | v4.0 (Jan 2025) | Touch device behavior change |

**Deprecated/outdated:**
- `tailwind.config.js`: Still works via `@config` directive but is legacy; migrate to `@theme`
- PostCSS-based Tailwind integration: Replaced by `@tailwindcss/vite` for Vite projects
- `*-opacity-*` utilities: Fully removed, use color/opacity modifier syntax
- `@tailwind` directives: Replaced by `@import "tailwindcss"`

## Open Questions

1. **Upgrade tool behavior with dynamic class bindings in JS**
   - What we know: The upgrade tool rewrites class names in template files. This project has dynamic class construction in `App.vue` `setup()` (e.g., `buttonClass()` function returning string concatenations with Tailwind classes).
   - What's unclear: Whether the upgrade tool handles class names inside JS string literals in `.vue` files or only template attributes.
   - Recommendation: After running the tool, manually verify the `buttonClass()` and `feedbackClass()` functions in App.vue and the `shapeClass`/`cellClass` computed properties in Stimulus.vue. These build class strings programmatically and may need manual updates if the tool misses them.

2. **backdrop-blur-sm rename verification**
   - What we know: `backdrop-blur-sm` should be renamed to `backdrop-blur-xs` in TW4's scale shift.
   - What's unclear: Whether the upgrade tool catches this in all three instances (GameOverModal, PauseModal, GameHint).
   - Recommendation: Verify after running upgrade tool. If missed, manual search-and-replace.

## Codebase-Specific Migration Audit

### Files Requiring Changes (Complete List)

| File | Changes Needed | Automated by Upgrade Tool? |
|------|---------------|---------------------------|
| `package.json` | Update tailwindcss, add @tailwindcss/vite | YES |
| `vite.config.js` | Add tailwindcss() to plugins | YES |
| `postcss.config.js` | DELETE entirely | YES |
| `tailwind.config.js` | DELETE (migrate font to @theme in style.css) | YES (migrates to CSS) |
| `src/style.css` | Replace @tailwind directives with @import, add @theme, add @custom-variant hover, add cursor override | PARTIAL (import YES, theme PARTIAL, overrides NO) |
| `src/ConfigStart.vue` | `shadow-sm` rename, `focus:ring` to `focus:ring-3`, `ring-opacity-50` to `/50`, `focus:outline-none` to `focus:outline-hidden` | PARTIAL (ring-opacity NO, rest likely YES) |
| `src/Stimulus.vue` | `ring-opacity-50` to `/50` in JS computed property | NO (dynamic class in JS) |
| `src/App.vue` | `focus:outline-none` rename, verify buttonClass() strings | PARTIAL (template YES, JS strings UNKNOWN) |
| `src/GameOverModal.vue` | `bg-gradient-to-r` rename, `backdrop-blur-sm` rename | YES |
| `src/AchievementToast.vue` | `bg-gradient-to-r` rename | YES |
| `src/PauseModal.vue` | `backdrop-blur-sm` rename | YES |
| `src/GameHint.vue` | `backdrop-blur-sm` rename | YES |
| `index.html` | `bg-slate-900` on body -- verify still works (it will) | NO CHANGE NEEDED |

### Files Requiring NO Changes
- `src/IntroHead.vue` -- only uses stable classes
- `src/IntroContent.vue` -- only uses stable classes
- `src/Footer.vue` -- only uses stable classes
- `src/TutorialOverlay.vue` -- only uses stable classes
- `src/main.js` -- imports style.css (path unchanged)

### Visual Regression Risk Assessment
| Screen | Risk Level | Key Concern |
|--------|------------|-------------|
| Menu screen | LOW | Only IntroHead, IntroContent, ConfigStart, Footer -- minimal TW changes |
| Gameplay screen | MEDIUM | Dynamic button colors, ring-opacity on stimulus cells, shadow on buttons |
| Game Over modal | LOW | Gradient rename (automated), backdrop blur rename (automated), border colors (already explicit) |
| Pause modal | LOW | Same as Game Over -- backdrop blur rename |
| Tutorial overlay | LOW | No affected utilities, stable classes throughout |
| Achievement toast | LOW | Gradient rename (automated) |
| Game hint | LOW | Backdrop blur rename (automated) |

## Sources

### Primary (HIGH confidence)
- [Tailwind CSS Official Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide) -- comprehensive migration reference, all breaking changes documented
- npm registry `@tailwindcss/vite@4.2.1` -- verified peer dependency `vite: ^5.2.0 || ^6 || ^7` via `npm view`
- npm registry `tailwindcss@4.2.1` -- verified latest stable version via `npm view`

### Secondary (MEDIUM confidence)
- [Tailwind CSS v4.0 Announcement](https://tailwindcss.com/blog/tailwindcss-v4) -- confirmed gradient rename, engine rewrite, performance improvements
- [GitHub Discussion #16517](https://github.com/tailwindlabs/tailwindcss/discussions/16517) -- confirmed border color default change and dark mode impacts
- [GitHub Discussion #15205](https://github.com/tailwindlabs/tailwindcss/discussions/15205) -- confirmed @apply in Vue SFC performance issues and @reference workaround
- [GitHub Discussion #16688](https://github.com/tailwindlabs/tailwindcss/discussions/16688) -- confirmed upgrade tool does not handle opacity utility merging

### Tertiary (LOW confidence)
- Various blog posts on hover behavior with touch devices -- cross-verified with official docs and GitHub discussions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- versions verified via npm registry, peer deps confirmed compatible with Vite 7
- Architecture: HIGH -- patterns verified against official docs, codebase audited for all affected classes
- Pitfalls: HIGH -- all pitfalls verified against official upgrade guide and cross-referenced with GitHub issues; codebase-specific impact assessed file-by-file

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable domain, TW4 is mature)

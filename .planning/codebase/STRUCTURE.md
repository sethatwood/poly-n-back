# Codebase Structure

**Analysis Date:** 2026-02-28

## Directory Layout

```
poly-n-back/
├── src/                          # Application source code
│   ├── store/                    # Pinia store
│   │   └── gameStore.js          # Centralized game state and logic
│   ├── assets/                   # Static assets (fonts, sounds, images)
│   │   ├── ShareTechMono-Regular.ttf
│   │   ├── stimulus.wav
│   │   ├── ting.mp3
│   │   ├── whip.mp3
│   │   ├── volume-mute-solid.svg
│   │   └── volume-up-solid.svg
│   ├── App.vue                   # Root application component
│   ├── main.js                   # Vue app entry point
│   ├── style.css                 # Global styles (Tailwind + custom)
│   ├── registerServiceWorker.js  # PWA service worker registration
│   ├── ConfigStart.vue           # Game configuration inputs
│   ├── Stimulus.vue              # Visual stimulus display
│   ├── IntroHead.vue             # Game title/intro header
│   ├── IntroContent.vue          # Game description/rules
│   ├── Footer.vue                # Footer with credits
│   ├── PauseModal.vue            # Pause screen modal
│   ├── GameOverModal.vue         # Game over results modal
│   ├── GameHint.vue              # Contextual gameplay hints
│   ├── TutorialOverlay.vue       # First-time tutorial
│   └── AchievementToast.vue      # Achievement notifications
├── android/                      # Android native project (Capacitor)
├── ios/                          # iOS native project (Capacitor)
├── public/                       # Static files served as-is
├── dist/                         # Built output (generated)
├── index.html                    # HTML entry point
├── capacitor.config.json         # Capacitor app configuration
├── package.json                  # Node dependencies
├── vite.config.js                # Vite build configuration
├── tailwind.config.js            # TailwindCSS configuration
├── postcss.config.js             # PostCSS configuration
└── README.md                     # Project documentation
```

## Directory Purposes

**src/**
- Purpose: All application source code
- Contains: Vue components, store, styles, service worker
- Key files: `App.vue` (root), `gameStore.js` (state management), `style.css` (global styles)

**src/store/**
- Purpose: Pinia state management
- Contains: Single store file with game logic
- Key files: `gameStore.js` - all game state, actions, getters, audio management

**src/assets/**
- Purpose: Static media assets
- Contains: TrueType font, audio files (WAV/MP3), SVG icons
- Key files: `stimulus.wav` (game event sound), `ting.mp3` (correct answer), `whip.mp3` (strike/error)

**android/**
- Purpose: Android native project wrapper (Capacitor)
- Contains: AndroidManifest.xml, Gradle files, native configuration
- Committed: Yes - contains version control

**ios/**
- Purpose: iOS native project wrapper (Capacitor)
- Contains: Podfile, .xcworkspace, native configuration
- Committed: Yes - contains version control

**public/**
- Purpose: Static web assets served as-is (favicons, app icons, manifest)
- Contains: PWA manifest.json, favicon sizes, app icons
- Key files: `manifest.json` (PWA metadata)

**dist/**
- Purpose: Compiled production build output
- Generated: Yes - by `npm run build`
- Committed: No - regenerated per build

## Key File Locations

**Entry Points:**
- `index.html`: HTML document root - loads Vue app and defines #app div
- `src/main.js`: JavaScript entry point - initializes Vue 3 app, Pinia store, mounts to DOM
- `src/App.vue`: Vue root component - renders main game UI and modal screens

**Configuration:**
- `package.json`: Node dependencies, build scripts
- `vite.config.js`: Vite bundler configuration (Vue plugin only, no aliases)
- `tailwind.config.js`: TailwindCSS theme extension (Share Tech Mono font family)
- `postcss.config.js`: PostCSS plugins (Tailwind + Autoprefixer)
- `capacitor.config.json`: Capacitor app metadata, Android/iOS settings

**Core Logic:**
- `src/store/gameStore.js`: All game state, stimulus generation, scoring, audio management
- `src/App.vue`: Game lifecycle, screen transitions, modal handling

**Presentation Components:**
- `src/Stimulus.vue`: Displays current stimulus (3-cell grid with shape/emoji/color)
- `src/ConfigStart.vue`: Input controls for n-back and timer configuration
- `src/PauseModal.vue`: Pause screen with resume/quit options
- `src/GameOverModal.vue`: Results screen with score, accuracy, high score comparison
- `src/TutorialOverlay.vue`: First-time player tutorial walkthrough
- `src/AchievementToast.vue`: Toast notifications for achievement unlocks
- `src/GameHint.vue`: Context-sensitive gameplay hints during active game
- `src/IntroHead.vue`: Game title display on menu screen
- `src/IntroContent.vue`: Game description and rules on menu screen
- `src/Footer.vue`: Footer credits/links

**Styling:**
- `src/style.css`: Global styles (Tailwind imports, custom animations, base styles, iOS safe areas)

**Service Worker:**
- `src/registerServiceWorker.js`: Registers PWA service worker for offline support

## Naming Conventions

**Files:**
- Vue components: PascalCase (e.g., `App.vue`, `ConfigStart.vue`, `PauseModal.vue`)
- JavaScript modules: camelCase (e.g., `gameStore.js`, `registerServiceWorker.js`)
- Static assets: lowercase with hyphens (e.g., `volume-up-solid.svg`, `stimulus.wav`)

**Directories:**
- Functional directories: lowercase (e.g., `src`, `store`, `assets`, `android`, `ios`)

**Vue Component Names:**
- Match filename exactly (e.g., component in `ConfigStart.vue` is named `'ConfigStart'`)
- Descriptive names indicating purpose (Modal, Toast, Overlay, Hint)

**JavaScript Identifiers:**
- Store: `useGameStore` (Pinia convention)
- Audio manager: `audioManager` (internal object in gameStore.js)
- Game state: properties in lowercase with camelCase (e.g., `currentStimulus`, `incorrectResponses`, `highScoreData`)

**CSS Classes:**
- Utility-first: TailwindCSS classes (`p-4 rounded-lg text-lg`)
- Custom: kebab-case for keyframe names (e.g., `@keyframes stimulus-appear`, `@keyframes score-pulse`)
- Animation classes: descriptive and namespaced (e.g., `.animate-stimulus-appear`, `.animate-score-pulse`)

## Where to Add New Code

**New Feature (e.g., sound effects, new stimulus type):**
- Primary code: `src/store/gameStore.js` - add state, actions, getters
- Components: Create new `.vue` file in `src/` or modify existing components
- Styling: Add keyframes to `src/style.css` or component-scoped `<style>`
- Tests: Not currently used - would go in `__tests__/` directory if added

**New Component/Modal:**
- Implementation: `src/NewComponentName.vue` - follow PascalCase naming
- Integration: Import in `src/App.vue` and add to components object
- Styling: Scoped `<style scoped>` in component or global in `src/style.css`
- State: Access via `const gameStore = useGameStore()` in setup()

**New Assets (sounds, images, fonts):**
- Location: `src/assets/` with appropriate subdirectory if scaling
- Import: `import assetUrl from './assets/filename'`
- Reference: Use imported URL in components or store

**Utilities/Helpers:**
- Location: Create `src/utils/` directory if none exists, or `src/lib/`
- Export: `export function helperName() { ... }`
- Import: `import { helperName } from './utils/helper.js'`

**Game Store Extensions:**
- Location: Add to existing `src/store/gameStore.js` - single store approach
- Pattern: Add to `state() {}`, `actions: {}`, `getters: {}` as appropriate
- No separate store files - all game logic centralized

## Special Directories

**dist/**
- Purpose: Build output directory
- Generated: Yes - created by `vite build`
- Committed: No - ignored in .gitignore
- Deployed: These files deployed to web server/Capacitor app

**node_modules/**
- Purpose: npm package dependencies
- Generated: Yes - created by `npm install`
- Committed: No - ignored in .gitignore
- Lockfile: `package-lock.json` (used to reproduce exact versions)

**.git/**
- Purpose: Git version control
- Generated: Yes - by `git init`
- Committed: N/A - not a project file

**.github/**
- Purpose: GitHub configuration (workflows, etc.)
- Contains: GitHub Actions CI/CD if configured
- Committed: Yes

**.planning/**
- Purpose: GSD planning documents
- Contains: Architecture analysis, design decisions
- Committed: Yes - preserves project knowledge

**.vscode/**
- Purpose: VS Code workspace settings
- Contains: Extensions recommendations, settings overrides
- Committed: Yes - shared team configuration

---

*Structure analysis: 2026-02-28*

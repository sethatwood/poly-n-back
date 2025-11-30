# Poly N-Back: Comprehensive Audit & Premium App Roadmap

*Last Updated: November 2025*

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [What is Poly N-Back?](#what-is-poly-n-back)
3. [Current Codebase Analysis](#current-codebase-analysis)
4. [UX/UI Audit](#uxui-audit)
5. [Game Mechanics Analysis](#game-mechanics-analysis)
6. [Future Attributes & Game Modes](#future-attributes--game-modes)
7. [Technical Debt & Issues](#technical-debt--issues)
8. [Recommendations for Premium Release](#recommendations-for-premium-release)
9. [Implementation Roadmap](#implementation-roadmap)
10. [Monetization Strategy](#monetization-strategy)
11. [App Store Preparation](#app-store-preparation)

---

## Executive Summary

Poly N-Back is a multi-modal cognitive training game that extends the classic Dual N-Back paradigm to four simultaneous attributes: **Color**, **Emoji**, **Position**, and **Shape**. The game has solid foundational mechanics and a clean Vue.js codebase, but requires significant UX refinement, feature additions, and polish to compete as a premium mobile app.

**Current State:** Functional MVP with basic gameplay
**Target State:** Polished, sticky, delightful premium cognitive training experience
**Estimated Effort:** 4-8 weeks of focused development

---

## What is Poly N-Back?

### The N-Back Paradigm

The N-Back task is a continuous performance task used in cognitive neuroscience to measure working memory capacity. In a traditional N-Back task, participants are presented with a sequence of stimuli and must indicate when the current stimulus matches the one from N steps earlier.

**Dual N-Back** extends this by tracking two attributes simultaneously (typically position and audio), and research suggests it may improve fluid intelligence and working memory.

### Poly N-Back's Innovation

Poly N-Back takes this concept further by requiring players to track **four attributes simultaneously**:

| Attribute | Values |
|-----------|--------|
| **Color** | Purple, Green, Blue |
| **Emoji** | 🔥 Fire, 🧊 Ice, 🌸 Flower |
| **Position** | Left, Center, Right |
| **Shape** | Circle, Square, Triangle |

This creates a significantly more challenging cognitive task, as players must maintain four separate "streams" of working memory while identifying matches across any or all of them.

### Current Gameplay Flow

1. **Start Screen**: Player configures N-Back level (default: 2) and timer interval (default: 5 seconds)
2. **Game Loop**: Every N seconds, a new stimulus appears showing all four attributes
3. **Response Phase**: After N+1 stimuli, players can tap buttons to indicate matches
4. **Scoring**: Correct matches add points; incorrect responses add strikes
5. **Game Over**: Three strikes ends the game; high scores are persisted locally

---

## Current Codebase Analysis

### Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Vue 3 | 3.3.4 |
| State Management | Pinia | 2.1.7 |
| Build Tool | Vite | 4.4.5 |
| Styling | Tailwind CSS | 3.3.5 |
| Mobile Wrapper | Capacitor | 5.5.1 |
| PWA Support | register-service-worker | 1.7.2 |

### File Structure

```
poly-n-back/
├── src/
│   ├── App.vue              # Main component (254 lines) - handles game UI and state
│   ├── Stimulus.vue         # Visual stimulus display component
│   ├── ConfigStart.vue      # Game configuration and start button
│   ├── IntroHead.vue        # Welcome header with logo
│   ├── IntroContent.vue     # How-to-play instructions
│   ├── Footer.vue           # Attribution footer
│   ├── store/
│   │   └── gameStore.js     # Pinia store - ALL game logic (236 lines)
│   ├── main.js              # App initialization
│   ├── style.css            # Tailwind imports + custom font
│   ├── registerServiceWorker.js
│   └── assets/
│       ├── ShareTechMono-Regular.ttf
│       ├── stimulus.wav     # New stimulus sound
│       ├── ting.mp3         # Correct answer sound
│       └── whip.mp3         # Strike sound
├── public/
│   ├── logo.png             # Beautiful polygonal brain logo
│   ├── manifest.json        # PWA manifest
│   └── img/icons/           # App icons for various platforms
├── capacitor.config.json    # Mobile app configuration
├── tailwind.config.js
├── vite.config.js
└── package.json
```

### Code Quality Assessment

**Strengths:**
- Clean separation of concerns (components vs. store)
- Reactive state management with Pinia
- Consistent use of Tailwind CSS
- PWA-ready with service worker registration
- Capacitor already configured for mobile builds
- Good audio feedback system

**Weaknesses:**
- All game logic concentrated in `gameStore.js` (god object pattern)
- Mixed Options API and Composition API usage
- Commented-out debug code throughout
- No TypeScript (increases bug risk)
- No testing infrastructure
- Hardcoded magic numbers (3 strikes, fixed attribute counts)
- `alert()` used for game over (jarring UX)

---

## UX/UI Audit

### Visual Design

**Current Positives:**
- ✅ Beautiful polygonal brain logo
- ✅ Dark theme reduces eye strain
- ✅ Clean, minimal interface
- ✅ Monospace font (Share Tech Mono) fits the cognitive/tech aesthetic

**Current Issues:**
- ❌ Generic dark slate color scheme lacks personality
- ❌ No visual hierarchy—everything feels equally weighted
- ❌ Buttons lack affordance (no shadows, minimal hover states)
- ❌ No animations or transitions (feels static and lifeless)
- ❌ Timer is just a number—no visual urgency as time runs out
- ❌ Score/strikes display is cramped and hard to parse quickly
- ❌ No celebration for correct answers or milestones
- ❌ Stimulus change is abrupt (just a border flash)

### Interaction Design

**Current Positives:**
- ✅ Simple four-button response system
- ✅ Buttons disable appropriately after response
- ✅ Clear instruction message at top
- ✅ Audio feedback for actions

**Current Issues:**
- ❌ No haptic feedback on mobile
- ❌ `alert()` for game over breaks immersion entirely
- ❌ No tutorial or onboarding for new players
- ❌ Instruction message can be dismissed but there's no way to bring it back
- ❌ No pause functionality during gameplay
- ❌ No confirmation before resetting high score
- ❌ Start button requires two taps (one to dismiss modal, implicit in start)

### Information Architecture

**Current Issues:**
- ❌ High score display is cluttered with too much data
- ❌ No session history or progress tracking
- ❌ No explanation of what N-Back means for new users
- ❌ Timer settings not explained (why would someone change it?)

---

## Game Mechanics Analysis

### Core Loop Evaluation

The core gameplay loop is sound but lacks the "one more game" hooks that make games sticky:

| Element | Current State | Ideal State |
|---------|---------------|-------------|
| Challenge | Constant difficulty | Adaptive difficulty progression |
| Mastery | N-Back level only | Skill trees, achievements, levels |
| Reward | Score + high score | Streaks, combos, unlockables, stats |
| Feedback | Basic audio | Rich audio/visual/haptic feedback |
| Social | None | Leaderboards, challenges, sharing |

### Difficulty Curve

**Problem:** The game is either too easy (low N, long timer) or extremely hard (high N, short timer) with no middle ground. Players who find it too hard will churn; players who find it too easy will get bored.

**Solution:** Implement adaptive difficulty and guided progression.

### Session Length

**Current:** Unlimited until 3 strikes
**Problem:** Sessions can be very short (quick 3 strikes) or indefinitely long (skilled players). Neither is ideal for mobile gaming patterns.

**Recommendation:** Consider timed sessions (e.g., 2-minute rounds) or round-based play.

---

## Future Attributes & Game Modes

One of Poly N-Back's greatest opportunities for differentiation and depth is the expansion of trackable attributes beyond the current four (Color, Emoji, Position, Shape). This section catalogs potential new attributes and game modes for future development.

### Current Attribute System

| Attribute | Current Values | Cognitive Load |
|-----------|---------------|----------------|
| **Color** | Purple, Green, Blue | Visual/Chromatic |
| **Emoji** | 🔥 Fire, 🧊 Ice, 🌸 Flower | Semantic/Symbolic |
| **Position** | Left, Center, Right | Spatial |
| **Shape** | Circle, Square, Triangle | Geometric/Visual |

### Potential New Attributes

#### Tier 1: High Priority (Easy to Implement, Clear Value)

| Attribute | Values | Implementation | Cognitive Benefit |
|-----------|--------|----------------|-------------------|
| **Size** | Small, Medium, Large | Scale shape to 60%, 100%, 140% | Visual discrimination, adds variety |
| **Sound/Tone** | 3 distinct tones (piano, bell, drum) or pitches | Play audio with each stimulus | Auditory processing, true multi-sensory (classic Dual N-Back) |
| **Rotation** | 0°, 90°, 180° (or Up, Right, Down for triangles) | CSS transform rotation | Spatial reasoning, mental rotation |
| **Count/Number** | 1, 2, or 3 shapes displayed | Render multiple instances | Subitizing, numerical cognition |
| **Border Style** | None, Thin, Thick | CSS border-width | Visual attention to detail |

#### Tier 2: Medium Priority (Valuable, Requires More Design)

| Attribute | Values | Implementation | Considerations |
|-----------|--------|----------------|----------------|
| **Fill Pattern** | Solid, Striped, Dotted | SVG patterns or CSS | May be hard to see quickly on small screens |
| **Animation Style** | Pulse, Spin, Bounce, Static | CSS animations on appearance | Fun/modern, but may distract from other attributes |
| **Grid Position (2D)** | 3×3 grid instead of 1×3 row | Expand position system | Classic N-Back style, significantly increases difficulty |
| **Opacity/Transparency** | 25%, 50%, 100% | CSS opacity | Subtle, risk of confusion with color |
| **Background Glow** | None, Warm glow, Cool glow | Box-shadow or radial gradient | Atmospheric, clearly different from shape color |
| **Direction/Arrow** | ↑ Up, → Right, ↓ Down, ← Left | Arrow overlay or shape orientation | Directional processing |
| **Speed** | Slow, Medium, Fast appearance | Animation duration variation | Temporal perception |

#### Tier 3: Advanced/Experimental (Novel, Higher Risk)

| Attribute | Values | Implementation | Considerations |
|-----------|--------|----------------|----------------|
| **Spoken Word** | "Alpha", "Beta", "Gamma" or colors spoken aloud | Text-to-speech or recorded audio | True multi-sensory, requires audio enabled |
| **Vibration Pattern** | Short pulse, Long pulse, Double pulse | Capacitor Haptics API | Mobile-only, very novel for N-Back games |
| **Letter/Digit** | A, B, C or 1, 2, 3 displayed on shape | Text overlay | Semantic/verbal processing |
| **Timing/Rhythm** | Appears early, middle, or late in interval | Delay stimulus appearance | Temporal memory—very challenging |
| **Pitch Sequence** | Rising, Falling, Steady tone | Audio frequency modulation | Musical/auditory pattern recognition |
| **Temperature Color** | Warm palette, Cool palette, Neutral | Shift entire color scheme | Gestalt/holistic perception |
| **Texture** | Smooth, Rough, Patterned fill | SVG filters or patterns | Visual texture discrimination |
| **Symbol Overlay** | +, −, × displayed on shape | Math symbol overlay | Symbolic processing |
| **Weather Icon** | ☀️ Sun, 🌧️ Rain, ❄️ Snow | Additional icon set | Semantic variety |
| **Hand Gesture** | ✊ Rock, ✋ Paper, ✌️ Scissors | Gesture emoji set | Familiar symbols, game-like |

### Attribute Compatibility Matrix

Some attributes work better together than others. This matrix helps plan attribute combinations:

| | Size | Sound | Rotation | Count | Pattern | 2D Grid |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Color** | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| **Emoji** | ✅ | ✅ | ⚠️ | ⚠️ | ❌ | ✅ |
| **Position** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Shape** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Size** | — | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| **Sound** | — | — | ✅ | ✅ | ✅ | ✅ |

✅ = Works well together | ⚠️ = Possible confusion | ❌ = Conflicts

### Proposed Game Modes

#### Preset Training Modes

| Mode Name | Attributes | Description | Target Audience |
|-----------|------------|-------------|-----------------|
| **Classic Dual** | Position + Sound | Traditional Dual N-Back experience | N-Back purists, research replication |
| **Visual Quad** | Color, Emoji, Position, Shape | Current signature mode | General users |
| **Sensory Blend** | Position, Sound, Size | Multi-sensory without visual overload | Balanced training |
| **Maximum Challenge** | All 6-7 attributes | Ultimate cognitive workout | Hardcore players, advanced users |
| **Spatial Focus** | Position (2D), Size, Rotation | Emphasize spatial reasoning | Spatial skills training |
| **Visual Focus** | Color, Shape, Pattern, Size | All visual attributes | Visual processing training |
| **Auditory Focus** | Sound, Pitch, Spoken Word | Primarily audio-based | Auditory processing, accessibility |
| **Speed Demon** | 3 attributes, 2-second timer | Fast-paced challenge | Experienced players seeking intensity |

#### Special Game Modes

| Mode Name | Mechanic | Description |
|-----------|----------|-------------|
| **Zen Mode** | No strikes, no timer pressure | Relaxed practice without failure |
| **Endless Mode** | Progressive difficulty increase | N-Back level increases every 10 correct answers |
| **Time Attack** | 2-minute fixed sessions | Score as many points as possible in limited time |
| **Survival Mode** | One strike and out | High-stakes, high-focus gameplay |
| **Daily Challenge** | Fixed seed, once per day | Fair competition, streak rewards |
| **Practice Mode** | Slower pace, hints available | Learning-focused for beginners |
| **Custom Mode** | User selects attributes | Full control over training regimen |

#### Advanced Mode Concepts

| Concept | Description | Cognitive Rationale |
|---------|-------------|---------------------|
| **Asymmetric N-Back** | Different N values per attribute (Color=2, Sound=3) | Trains flexible working memory allocation |
| **Interference Mode** | Two stimuli shown simultaneously, track both | Divided attention, filtering |
| **Sequence Mode** | Identify repeating 3-stimulus patterns | Pattern recognition, chunking |
| **Negative Space** | Match what's *missing* from previous stimulus | Inhibitory control, reversal |
| **Prediction Mode** | Guess next stimulus before it appears | Predictive processing, pattern learning |
| **Decay Mode** | Older memories worth more points | Encourages longer retention |
| **Switching Mode** | Attribute to track changes mid-game | Cognitive flexibility, task switching |

### Custom Mode Builder (Premium Feature)

Allow advanced users to configure their own training sessions:

```
┌─────────────────────────────────────────┐
│         CUSTOM MODE BUILDER             │
├─────────────────────────────────────────┤
│ Attributes (select 2-6):                │
│ ☑ Color    ☑ Position   ☐ Sound        │
│ ☑ Shape    ☐ Size       ☐ Rotation     │
│ ☑ Emoji    ☐ Count      ☐ Pattern      │
├─────────────────────────────────────────┤
│ N-Back Level:     [2] ▼                 │
│ Timer Interval:   [5] seconds           │
│ Strikes Allowed:  [3]                   │
│ Session Length:   [∞] Unlimited         │
├─────────────────────────────────────────┤
│ [ ] Asymmetric Mode (different N per    │
│     attribute)                          │
│ [ ] Progressive Difficulty              │
├─────────────────────────────────────────┤
│           [ START TRAINING ]            │
└─────────────────────────────────────────┘
```

### Implementation Priority Recommendation

**Phase 1 - MVP Expansion:**
1. **Sound** - Essential for true Dual N-Back parity
2. **Size** - Easy win, high visual impact

**Phase 2 - Depth:**
3. **Rotation** - Elegant, leverages existing shapes
4. **2D Grid Position** - Classic N-Back, significant challenge increase

**Phase 3 - Polish:**
5. **Count** - Adds numerical cognition
6. **Vibration** - Mobile differentiator

**Phase 4 - Premium:**
7. Custom Mode Builder
8. Asymmetric N-Back
9. Advanced experimental modes

### Research Considerations

When adding new attributes, consider:

1. **Cognitive Load Balance**: Each attribute adds working memory burden. 6+ attributes may exceed practical limits for most users.

2. **Discriminability**: Values within an attribute must be instantly distinguishable (e.g., "small" vs "medium" size needs clear visual difference).

3. **Independence**: Ideally, attributes should be cognitively independent (visual vs. auditory vs. spatial) for maximum training benefit.

4. **Accessibility**: Audio attributes require sound; vibration requires mobile. Always provide alternatives.

5. **Scientific Validity**: The original Dual N-Back research used position + audio. Straying too far may reduce evidence-based credibility, though the multi-modal approach is a reasonable extension.

---

## Technical Debt & Issues

### Critical Issues

1. **`alert()` for Game Over**
   - Location: `gameStore.js:211`
   - Impact: Completely breaks immersion, looks unprofessional
   - Fix: Replace with in-game modal with animations

2. **No Error Boundaries**
   - Impact: Any JS error crashes the entire app
   - Fix: Add Vue error handling

3. **Audio Objects Created in Store State**
   - Location: `gameStore.js:21-22, 36-38`
   - Impact: Audio objects in reactive state can cause issues
   - Fix: Move audio handling to a separate service

4. **Service Worker Configuration Incomplete**
   - Location: `registerServiceWorker.js:6`
   - Impact: `process.env.BASE_URL` may not be defined in Vite
   - Fix: Use Vite's `import.meta.env` or configure properly

### Moderate Issues

1. **Mixed API Styles**
   - Components use both Options API and Composition API inconsistently
   - Recommendation: Standardize on Composition API with `<script setup>`

2. **No Loading States**
   - Audio files and assets load without feedback
   - Add loading indicators

3. **Hardcoded Values**
   - 3 strikes, 3 colors, 3 emojis, etc. are all hardcoded
   - Extract to configuration for easier tuning

4. **Console Logging in Production**
   - Many `console.log` statements throughout
   - Remove or gate behind development flag

### Minor Issues

1. **Duplicate Component Import**
   - `App.vue:135` imports `IntroHead` twice

2. **Unused Watch Import**
   - `Stimulus.vue:18` imports `watch` but it's commented out

3. **Font Path Issue**
   - `style.css:7` uses `~/assets/fonts/` which may not resolve correctly

---

## Recommendations for Premium Release

### Phase 1: Foundation & Polish (Week 1-2)

#### 1.1 Replace Alert with Game Over Screen
Create an animated, in-game game over experience:
- Fade to a dedicated game over view
- Show final score with animation
- Display accuracy percentage
- Show "New High Score!" celebration if applicable
- Offer "Play Again" and "Back to Menu" options

#### 1.2 Add Micro-Animations
- Stimulus appearance: Scale/fade in effect
- Correct answer: Satisfying pulse/glow on score
- Strike: Screen shake or flash
- Button press: Tactile press animation
- Timer: Pulsing urgency as time runs low

#### 1.3 Visual Refresh
- Add gradient backgrounds or subtle patterns
- Improve button styling with shadows and depth
- Create visual distinction between game states
- Add a progress indicator showing stimulus history

#### 1.4 Audio Improvements
- Add background ambient music (optional, toggleable)
- Improve sound effects quality
- Add haptic feedback on mobile (via Capacitor)

### Phase 2: Engagement Features (Week 2-3)

#### 2.1 Onboarding Tutorial
Create an interactive tutorial that:
- Explains the N-Back concept visually
- Walks through a practice round with guided prompts
- Gradually introduces all four attributes
- Celebrates completion with encouragement

#### 2.2 Achievement System
Implement achievements to drive engagement:
- "First Steps" - Complete your first game
- "Perfect Round" - Complete a round with 100% accuracy
- "Memory Master" - Reach N=4
- "Streak King" - Get 10 correct answers in a row
- "Dedicated" - Play 7 days in a row

#### 2.3 Statistics Dashboard
Track and display:
- Games played
- Total time trained
- Accuracy over time (chart)
- Best N-Back level achieved
- Current streak
- Historical high scores

#### 2.4 Daily Challenge
- One curated challenge per day
- Fixed seed for fair comparison
- Special rewards for completion

### Phase 3: Progression System (Week 3-4)

#### 3.1 Level/XP System
- Earn XP for playing and achieving goals
- Level up to unlock new features
- Display level prominently

#### 3.2 Unlockable Themes
- Start with base theme
- Unlock new color schemes through play
- Possible themes: Neon, Nature, Minimal, Retro

#### 3.3 Unlockable Emoji Sets
- Base: 🔥🧊🌸
- Unlock: Animals (🐱🐕🐦), Food (🍎🍕🍩), Space (🚀🌙⭐)

#### 3.4 Difficulty Modes
- **Zen Mode**: No strikes, no timer pressure
- **Classic Mode**: Current gameplay
- **Challenge Mode**: Faster timer, more attributes
- **Endless Mode**: Progressive difficulty increase

### Phase 4: Social & Retention (Week 4-6)

#### 4.1 Leaderboards
- Global leaderboards by N-Back level
- Weekly/monthly competitions
- Friend leaderboards (if implementing accounts)

#### 4.2 Share Functionality
- Share score cards to social media
- Generate attractive score images
- Deep links back to app

#### 4.3 Push Notifications
- Daily reminder to train
- Streak preservation warnings
- Achievement unlocked notifications

#### 4.4 Cloud Sync (Optional)
- Sync progress across devices
- Requires account system
- Consider Apple/Google sign-in

### Phase 5: Premium Features (Week 6-8)

#### 5.1 In-App Purchases or Premium Tier
Options:
- **One-time Premium**: Unlock all features for $4.99
- **Freemium**: Base game free, premium features locked
- Avoid ads entirely (cognitive training + ads = bad UX)

#### 5.2 Advanced Training Modes
- Custom attribute selection (train specific skills)
- Interval training (alternating difficulty)
- Timed challenges (2-minute sprints)

#### 5.3 Detailed Analytics
- Cognitive performance insights
- Attribute-specific accuracy breakdown
- Optimal training time recommendations

---

## Implementation Roadmap

The roadmap is organized into three major releases, each building on the previous. This allows for iterative launches—you could ship v1.0 after Phase 1, then update with new features.

---

### 🚀 PHASE 1: Polish & Foundation (Weeks 1-3)
**Goal:** Transform the MVP into a polished, shippable product

#### Sprint 1: Critical Fixes (Days 1-5)
- [ ] Replace `alert()` with animated in-game modal
- [ ] Fix technical debt (console logs, duplicate imports, unused code)
- [ ] Add pause functionality with overlay
- [ ] Implement proper game over flow with replay option
- [ ] Add confirmation dialog for high score reset

#### Sprint 2: Visual & Audio Polish (Days 6-12)
- [ ] Add micro-animations throughout:
  - [ ] Stimulus appearance (scale/fade in)
  - [ ] Button press feedback (tactile depression)
  - [ ] Score increment (pulse/glow)
  - [ ] Strike received (shake/flash)
  - [ ] Timer urgency (pulse when ≤2 seconds)
- [ ] Improve visual hierarchy and spacing
- [ ] Add celebration effects for correct answers
- [ ] Smooth transitions between screens
- [ ] Audit and improve sound effects quality

#### Sprint 3: Onboarding & UX (Days 13-21)
- [ ] Design and implement interactive tutorial
  - [ ] Explain N-Back concept visually
  - [ ] Guided practice round with prompts
  - [ ] Progressive introduction of attributes
- [ ] Add accessible "How to Play" from game screen
- [ ] Improve instruction clarity
- [ ] First-time user experience polish
- [ ] Add visual N-Back history indicator (show recent stimuli)

**🎯 Milestone: v1.0 Release Candidate**
*A polished version of current gameplay, ready for early users*

---

### 🎮 PHASE 2: New Attributes & Modes (Weeks 4-7)
**Goal:** Expand the core game with new cognitive challenges

#### Sprint 4: Sound Attribute (Days 22-28)
- [ ] Implement audio stimulus system
  - [ ] Three distinct tones (piano, bell, drum) or pitches
  - [ ] Audio plays alongside visual stimulus
- [ ] Add "Sound" button to response grid
- [ ] Create audio-only practice mode
- [ ] Add volume control separate from mute
- [ ] Implement **Classic Dual Mode** (Position + Sound only)

#### Sprint 5: Size Attribute (Days 29-35)
- [ ] Implement size variation (Small 60%, Medium 100%, Large 140%)
- [ ] Add "Size" button to response grid
- [ ] Ensure size is clearly distinguishable on all screen sizes
- [ ] Update tutorial to cover new attributes
- [ ] Implement **Sensory Blend Mode** (Position, Sound, Size)

#### Sprint 6: Game Modes Foundation (Days 36-42)
- [ ] Refactor attribute system to be configurable
- [ ] Implement mode selection screen
- [ ] Create preset mode configurations:
  - [ ] **Visual Quad** (current default)
  - [ ] **Classic Dual** (Position + Sound)
  - [ ] **Sensory Blend** (Position, Sound, Size)
- [ ] Implement **Zen Mode** (no strikes, no pressure)
- [ ] Implement **Time Attack** (2-minute sessions)

#### Sprint 7: Rotation & Additional Modes (Days 43-49)
- [ ] Implement rotation attribute (0°, 90°, 180°)
  - [ ] Rotate triangles and squares
  - [ ] Add directional indicator for circles
- [ ] Add "Rotation" button
- [ ] Implement **Endless Mode** (progressive difficulty)
- [ ] Implement **Survival Mode** (one strike out)
- [ ] Create mode descriptions and difficulty indicators

**🎯 Milestone: v1.5 "Expanded" Release**
*6 attributes, 6+ modes, significantly more replayability*

---

### 📈 PHASE 3: Engagement & Progression (Weeks 8-11)
**Goal:** Make the game sticky with reasons to return daily

#### Sprint 8: Statistics System (Days 50-56)
- [ ] Design and implement local statistics storage
- [ ] Track per-session: score, accuracy, duration, mode, attributes
- [ ] Track lifetime: games played, total time, best scores per mode
- [ ] Track per-attribute accuracy (identify weak areas)
- [ ] Build statistics dashboard UI
- [ ] Add accuracy-over-time chart

#### Sprint 9: Achievements & Streaks (Days 57-63)
- [ ] Design achievement system architecture
- [ ] Implement achievement unlock logic
- [ ] Create achievement gallery UI
- [ ] Core achievements:
  - [ ] "First Steps" - Complete first game
  - [ ] "Perfect Round" - 100% accuracy
  - [ ] "Memory Master" - Reach N=4
  - [ ] "Streak King" - 10 correct in a row
  - [ ] "Dedicated" - 7-day streak
  - [ ] "Dual Wielder" - Complete Classic Dual mode
  - [ ] "Sensory Overload" - Play with 6 attributes
- [ ] Implement daily streak tracking
- [ ] Add streak preservation warnings

#### Sprint 10: Daily Challenges (Days 64-70)
- [ ] Implement seeded random for reproducible challenges
- [ ] Create daily challenge system (new challenge at midnight)
- [ ] Design daily challenge UI with countdown
- [ ] Add special rewards/badges for daily completion
- [ ] Implement streak bonuses

#### Sprint 11: Progression & Unlockables (Days 71-77)
- [ ] Implement XP/level system
- [ ] Create unlockable themes:
  - [ ] Base theme (free)
  - [ ] Neon theme (level 5)
  - [ ] Nature theme (level 10)
  - [ ] Minimal theme (level 15)
  - [ ] Retro theme (complete 50 games)
- [ ] Create unlockable emoji sets:
  - [ ] Base: 🔥🧊🌸
  - [ ] Animals: 🐱🐕🐦 (level 3)
  - [ ] Food: 🍎🍕🍩 (level 7)
  - [ ] Space: 🚀🌙⭐ (level 12)
- [ ] Design and implement unlock celebrations

**🎯 Milestone: v2.0 "Complete" Release**
*Full engagement systems, daily reasons to return*

---

### 📱 PHASE 4: Mobile & Launch (Weeks 12-14)
**Goal:** Optimize for mobile and prepare for app store launch

#### Sprint 12: Mobile Optimization (Days 78-84)
- [ ] Test and optimize Capacitor builds (iOS + Android)
- [ ] Implement haptic feedback via Capacitor
  - [ ] Light tap on button press
  - [ ] Success haptic on correct answer
  - [ ] Error haptic on strike
- [ ] Implement vibration attribute (if pursuing)
- [ ] Optimize for various screen sizes (phones + tablets)
- [ ] Performance profiling and optimization
- [ ] Battery usage optimization
- [ ] Test offline functionality

#### Sprint 13: App Store Preparation (Days 85-91)
- [ ] Create app store screenshots (multiple device sizes)
- [ ] Record app preview video (15-30 seconds)
- [ ] Write compelling app store descriptions
- [ ] Prepare keyword strategy
- [ ] Create/host privacy policy
- [ ] Set up support email
- [ ] Configure analytics (privacy-respecting)
- [ ] Set up crash reporting (Sentry)
- [ ] Finalize app icons

#### Sprint 14: Beta & Launch (Days 92-98)
- [ ] TestFlight beta (iOS)
- [ ] Play Console beta (Android)
- [ ] Gather and incorporate beta feedback
- [ ] Final bug fixes
- [ ] Submit to App Store review
- [ ] Submit to Google Play review
- [ ] Prepare launch marketing

**🎯 Milestone: v2.0 App Store Launch**
*Live on iOS and Android app stores*

---

### 🔮 PHASE 5: Premium & Advanced (Post-Launch)
**Goal:** Monetization and advanced features for power users

#### Post-Launch Sprint A: Premium Features
- [ ] Implement in-app purchase system
- [ ] Create premium unlock gate
- [ ] **Custom Mode Builder**:
  - [ ] Attribute toggle selection
  - [ ] Adjustable N-Back level per mode
  - [ ] Timer customization
  - [ ] Strikes customization
  - [ ] Session length options
- [ ] **Asymmetric N-Back Mode** (different N per attribute)
- [ ] Detailed cognitive analytics

#### Post-Launch Sprint B: Advanced Attributes
- [ ] **Count attribute** (1, 2, or 3 shapes)
- [ ] **2D Grid position** (3×3 instead of 1×3)
- [ ] **Pattern/Fill attribute** (Solid, Striped, Dotted)
- [ ] **Maximum Challenge Mode** (all attributes)

#### Post-Launch Sprint C: Social Features
- [ ] Leaderboards (Game Center / Google Play Games)
- [ ] Share score cards to social media
- [ ] Friend challenges (if implementing accounts)
- [ ] Cloud sync (optional account system)

#### Post-Launch Sprint D: Experimental Modes
- [ ] **Interference Mode** (two simultaneous stimuli)
- [ ] **Sequence Mode** (pattern recognition)
- [ ] **Switching Mode** (tracked attribute changes mid-game)
- [ ] **Spoken Word attribute** (audio names)

---

### Timeline Summary

| Phase | Weeks | Key Deliverable |
|-------|-------|-----------------|
| Phase 1: Polish | 1-3 | v1.0 - Polished current game |
| Phase 2: Attributes & Modes | 4-7 | v1.5 - Sound, Size, Rotation + 6 modes |
| Phase 3: Engagement | 8-11 | v2.0 - Stats, achievements, daily challenges |
| Phase 4: Mobile Launch | 12-14 | App Store Release |
| Phase 5: Premium | Ongoing | Premium features, advanced modes |

**Total to App Store Launch: ~14 weeks (3.5 months)**

This timeline assumes focused part-time development (~15-20 hrs/week). Full-time development could compress this to 6-8 weeks.

---

## Monetization Strategy

### Recommended: Premium Unlock Model

**Why Premium over Ads:**
- Cognitive training requires focus—ads are antithetical
- Premium users are more engaged and valuable
- Cleaner UX leads to better reviews
- Simpler implementation

**Pricing Strategy:**
- **iOS**: $4.99 one-time purchase
- **Android**: $3.99 one-time purchase
- Consider launch discount (50% off first week)
- Consider regional pricing for emerging markets

### Free vs Premium Feature Split

| Feature Category | Free Tier | Premium Tier |
|------------------|-----------|--------------|
| **Attributes** | Color, Emoji, Position, Shape (original 4) | + Sound, Size, Rotation, Count, 2D Grid |
| **Game Modes** | Visual Quad, Classic Dual, Zen Mode | + All modes, Custom Mode Builder |
| **Themes** | Base theme + 1 unlockable | All themes (5+) |
| **Emoji Sets** | Base set (🔥🧊🌸) | All sets (Animals, Food, Space, etc.) |
| **Statistics** | Basic (games played, high scores) | Full analytics, per-attribute breakdown, charts |
| **Achievements** | Core achievements (10) | All achievements (25+) |
| **Daily Challenges** | ✅ Available | ✅ Available |
| **Streaks** | ✅ Available | ✅ Available |
| **Asymmetric N-Back** | ❌ | ✅ Premium exclusive |
| **Cloud Sync** | ❌ | ✅ Premium exclusive |

### Alternative Monetization Models

#### Option B: Freemium with Attribute Packs
- Base game completely free with 4 attributes
- Sell attribute packs: $1.99 each
  - "Audio Pack" (Sound attribute + Classic Dual mode)
  - "Visual Pack" (Size + Rotation attributes)
  - "Advanced Pack" (2D Grid + Count + all advanced modes)
- "Complete Bundle" for $4.99 (all packs)

#### Option C: Subscription Model
If planning ongoing content development:
- $2.99/month or $19.99/year
- All current and future features included
- New attributes/modes added regularly
- More sustainable revenue for long-term development
- Harder to sell for a "simple" game

#### Option D: Completely Free + Donations
- Everything free, no restrictions
- "Support the Developer" tip jar ($1, $3, $5, $10)
- Lower revenue but maximum reach
- Good for building audience before premium features

### Recommended Approach

**Start with Option A (One-Time Premium)** for simplicity, then evaluate:
- If users want more content → transition to subscription
- If acquisition is low → try freemium with packs
- Premium unlocks everything, no nickel-and-diming

---

## App Store Preparation

### iOS App Store Requirements

1. **App Icons**: Already have various sizes ✅
2. **Screenshots**: Need 6.5" and 5.5" iPhone screenshots
3. **App Preview Video**: 15-30 second gameplay video (recommended)
4. **Description**: Compelling copy highlighting cognitive benefits
5. **Keywords**: "brain training, n-back, memory game, cognitive, focus"
6. **Privacy Policy**: Required - host on website
7. **Age Rating**: 4+ (no objectionable content)
8. **Category**: Games > Puzzle or Health & Fitness > Mind & Body

### Google Play Store Requirements

1. **Feature Graphic**: 1024x500 banner image
2. **Screenshots**: Phone and tablet sizes
3. **Short Description**: 80 characters max
4. **Full Description**: Up to 4000 characters
5. **Privacy Policy**: Required URL
6. **Content Rating**: Complete questionnaire
7. **Category**: Puzzle or Educational

### Pre-Launch Checklist

- [ ] Apple Developer Account ($99/year)
- [ ] Google Play Developer Account ($25 one-time)
- [ ] Privacy policy page hosted
- [ ] Terms of service (if needed)
- [ ] Support email configured
- [ ] App icons finalized
- [ ] Screenshots created
- [ ] Beta testing completed
- [ ] Analytics configured
- [ ] Crash reporting configured (Sentry recommended)

---

## Conclusion

Poly N-Back has a solid foundation and a genuinely valuable core mechanic. The path to a premium app release requires focused effort on:

1. **Polish**: Replace jarring elements (alerts), add animations, improve visual design
2. **Engagement**: Tutorial, achievements, statistics, daily challenges
3. **Progression**: Give players reasons to return (streaks, unlockables, levels)
4. **Mobile Excellence**: Haptics, performance, platform conventions

With 4-8 weeks of dedicated development, Poly N-Back can transform from a functional prototype into a polished, sticky, premium cognitive training experience that stands out in the app stores.

The cognitive training market is proven (apps like Lumosity, Peak, Elevate), and Poly N-Back's unique four-attribute approach provides genuine differentiation. Focus on the science-backed benefits while delivering a delightful experience, and this game has real potential for success.

---

*Document prepared by AI analysis of codebase and live application at https://polynback.fun/*


# Poly N-Back: Game Design Reference

*Extracted from comprehensive audit (November 2025). This document catalogs the game's attribute system, game modes, and design principles — the product design bible independent of tech stack.*

---

## Current Attribute System

| Attribute | Current Values | Cognitive Load |
|-----------|---------------|----------------|
| **Color** | Purple, Green, Blue | Visual/Chromatic |
| **Emoji** | Fire, Ice, Flower | Semantic/Symbolic |
| **Position** | Left, Center, Right | Spatial |
| **Shape** | Circle, Square, Triangle | Geometric/Visual |

---

## Future Attributes

### Tier 1: High Priority (Easy to Implement, Clear Value)

| Attribute | Values | Implementation | Cognitive Benefit |
|-----------|--------|----------------|-------------------|
| **Size** | Small, Medium, Large | Scale shape to 60%, 100%, 140% | Visual discrimination, adds variety |
| **Sound/Tone** | 3 distinct tones (piano, bell, drum) or pitches | Play audio with each stimulus | Auditory processing, true multi-sensory (classic Dual N-Back) |
| **Rotation** | 0, 90, 180 degrees (or Up, Right, Down for triangles) | CSS transform rotation | Spatial reasoning, mental rotation |
| **Count/Number** | 1, 2, or 3 shapes displayed | Render multiple instances | Subitizing, numerical cognition |
| **Border Style** | None, Thin, Thick | CSS border-width | Visual attention to detail |

### Tier 2: Medium Priority (Valuable, Requires More Design)

| Attribute | Values | Implementation | Considerations |
|-----------|--------|----------------|----------------|
| **Fill Pattern** | Solid, Striped, Dotted | SVG patterns or CSS | May be hard to see quickly on small screens |
| **Animation Style** | Pulse, Spin, Bounce, Static | CSS animations on appearance | Fun/modern, but may distract from other attributes |
| **Grid Position (2D)** | 3x3 grid instead of 1x3 row | Expand position system | Classic N-Back style, significantly increases difficulty |
| **Opacity/Transparency** | 25%, 50%, 100% | CSS opacity | Subtle, risk of confusion with color |
| **Background Glow** | None, Warm glow, Cool glow | Box-shadow or radial gradient | Atmospheric, clearly different from shape color |
| **Direction/Arrow** | Up, Right, Down, Left | Arrow overlay or shape orientation | Directional processing |
| **Speed** | Slow, Medium, Fast appearance | Animation duration variation | Temporal perception |

### Tier 3: Advanced/Experimental (Novel, Higher Risk)

| Attribute | Values | Implementation | Considerations |
|-----------|--------|----------------|----------------|
| **Spoken Word** | "Alpha", "Beta", "Gamma" or colors spoken aloud | Text-to-speech or recorded audio | True multi-sensory, requires audio enabled |
| **Vibration Pattern** | Short pulse, Long pulse, Double pulse | Capacitor Haptics API | Mobile-only, very novel for N-Back games |
| **Letter/Digit** | A, B, C or 1, 2, 3 displayed on shape | Text overlay | Semantic/verbal processing |
| **Timing/Rhythm** | Appears early, middle, or late in interval | Delay stimulus appearance | Temporal memory — very challenging |
| **Pitch Sequence** | Rising, Falling, Steady tone | Audio frequency modulation | Musical/auditory pattern recognition |
| **Temperature Color** | Warm palette, Cool palette, Neutral | Shift entire color scheme | Gestalt/holistic perception |
| **Texture** | Smooth, Rough, Patterned fill | SVG filters or patterns | Visual texture discrimination |
| **Symbol Overlay** | +, -, x displayed on shape | Math symbol overlay | Symbolic processing |
| **Weather Icon** | Sun, Rain, Snow | Additional icon set | Semantic variety |
| **Hand Gesture** | Rock, Paper, Scissors | Gesture emoji set | Familiar symbols, game-like |

### Attribute Implementation Priority

**Phase 1 — MVP Expansion:**
1. **Sound** — Essential for true Dual N-Back parity
2. **Size** — Easy win, high visual impact

**Phase 2 — Depth:**
3. **Rotation** — Elegant, leverages existing shapes
4. **2D Grid Position** — Classic N-Back, significant challenge increase

**Phase 3 — Polish:**
5. **Count** — Adds numerical cognition
6. **Vibration** — Mobile differentiator

**Phase 4 — Premium:**
7. Custom Mode Builder
8. Asymmetric N-Back
9. Advanced experimental modes

---

## Attribute Compatibility Matrix

Some attributes work better together than others:

| | Size | Sound | Rotation | Count | Pattern | 2D Grid |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Color** | Yes | Yes | Yes | Yes | Caution | Yes |
| **Emoji** | Yes | Yes | Caution | Caution | No | Yes |
| **Position** | Yes | Yes | Yes | Yes | Yes | No |
| **Shape** | Yes | Yes | Yes | Yes | Yes | Yes |
| **Size** | — | Yes | Yes | Caution | Yes | Yes |
| **Sound** | — | — | Yes | Yes | Yes | Yes |

Yes = Works well together | Caution = Possible confusion | No = Conflicts

---

## Game Modes

### Preset Training Modes

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

### Special Game Modes

| Mode Name | Mechanic | Description |
|-----------|----------|-------------|
| **Zen Mode** | No strikes, no timer pressure | Relaxed practice without failure |
| **Endless Mode** | Progressive difficulty increase | N-Back level increases every 10 correct answers |
| **Time Attack** | 2-minute fixed sessions | Score as many points as possible in limited time |
| **Survival Mode** | One strike and out | High-stakes, high-focus gameplay |
| **Daily Challenge** | Fixed seed, once per day | Fair competition, streak rewards |
| **Practice Mode** | Slower pace, hints available | Learning-focused for beginners |
| **Custom Mode** | User selects attributes | Full control over training regimen |

### Advanced Mode Concepts (Future)

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

```
+------------------------------------------+
|         CUSTOM MODE BUILDER              |
+------------------------------------------+
| Attributes (select 2-6):                 |
| [x] Color    [x] Position   [ ] Sound   |
| [x] Shape    [ ] Size       [ ] Rotation |
| [x] Emoji    [ ] Count      [ ] Pattern  |
+------------------------------------------+
| N-Back Level:     [2]                    |
| Timer Interval:   [5] seconds            |
| Strikes Allowed:  [3]                    |
| Session Length:   [Unlimited]            |
+------------------------------------------+
| [ ] Asymmetric Mode (different N per     |
|     attribute)                           |
| [ ] Progressive Difficulty               |
+------------------------------------------+
|           [ START TRAINING ]             |
+------------------------------------------+
```

---

## Design Principles for New Attributes

When adding new attributes, consider:

1. **Cognitive Load Balance**: Each attribute adds working memory burden. 6+ attributes may exceed practical limits for most users.

2. **Discriminability**: Values within an attribute must be instantly distinguishable (e.g., "small" vs "medium" size needs clear visual difference).

3. **Independence**: Ideally, attributes should be cognitively independent (visual vs. auditory vs. spatial) for maximum training benefit.

4. **Accessibility**: Audio attributes require sound; vibration requires mobile. Always provide alternatives.

5. **Scientific Validity**: The original Dual N-Back research used position + audio. Straying too far may reduce evidence-based credibility, though the multi-modal approach is a reasonable extension.

---

## Core Gameplay Loop Assessment

The core loop is sound but needs hooks for stickiness:

| Element | Current State | Target State |
|---------|---------------|--------------|
| Challenge | Constant difficulty | Adaptive difficulty progression |
| Mastery | N-Back level only | Skill trees, achievements, levels |
| Reward | Score + high score | Streaks, combos, unlockables, stats |
| Feedback | Basic audio | Rich audio/visual/haptic feedback |
| Social | None | Leaderboards, challenges, sharing |

### Difficulty Curve

**Problem:** The game is either too easy (low N, long timer) or extremely hard (high N, short timer) with no middle ground.

**Solution:** Implement adaptive difficulty and guided progression.

### Session Length

**Current:** Unlimited until 3 strikes.
**Problem:** Sessions can be very short (quick 3 strikes) or indefinitely long.

**Recommendation:** Consider timed sessions (e.g., 2-minute rounds) or round-based play alongside the current mode.

---

## Monetization Framework

**Model:** Freemium + Subscription (industry standard, fastest-growing segment)

| Feature | Free | Premium |
|---------|------|---------|
| Core quad mode | Unlimited | Unlimited |
| Game modes | Visual Quad + Zen | All modes |
| Stats history | 7 days | Unlimited |
| Analytics | Basic | Full (per-attribute, charts) |
| Achievements | Core set (10) | All (25+) |
| Daily challenges | Yes | Yes |
| Streaks | Yes | Yes + streak freeze |
| Themes | Base | All unlockable |
| Emoji sets | Base (fire/ice/flower) | All sets |
| Custom attributes | No | Yes |
| Cross-device sync | No | Yes |

**Pricing:** $4.99/month or $29.99/year. No ads ever — focus is sacred in a cognitive training app.

**Revenue target:** 3,000 paying subscribers = ~$10.5K MRR = ~$126K ARR. At 3-5% conversion rate, requires 60K-100K active free users.

---

*This document is the product design reference. For engineering execution, see `.planning/ROADMAP.md`. For market analysis, see `poly-n-back-analysis.md`. For marketing copy, see `ABOUT_POLY_NBACK.md`.*

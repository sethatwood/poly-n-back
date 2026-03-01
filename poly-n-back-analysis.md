# Poly N-Back: Million-Dollar Asset Assessment

## The Honest Verdict Up Front

You might actually be sitting on something. Not because the app is ready — it's not even close — but because the intersection of what you've built, what the market wants, and what your skills can deliver is unusually strong. Here's why your instinct keeps pulling you back.

---

## The Market Is Real and Growing Fast

The brain training app market was valued at roughly $10–16 billion in 2025 (estimates vary by source, but all directionally agree). Growth projections range from 19% to 26% CAGR through 2033–2035. The U.S. alone represents about 35% of the global market — approximately $2.5–3.5 billion.

These aren't speculative projections for an unproven category. Lumosity alone has over 100 million registered users. The top five players (Lumosity, Elevate, Peak, CogniFit, BrainHQ) control roughly 55% of the market. The freemium model dominates at 45% market share, with paid subscriptions being the fastest-growing segment at 19% CAGR. The adult segment leads at 50%, while the elderly segment is the fastest-growing demographic.

This matters because it means there's proven willingness to pay for brain training, established distribution channels, and an audience actively searching for solutions. You don't have to create demand — you have to capture existing demand better than alternatives.

### A Massive Validation Event Just Happened

In December 2025, Lumosity received FDA 510(k) clearance for LumosityRx — a prescription digital therapeutic for adult ADHD. This is enormous for the entire category. It validates brain training as clinically meaningful, opens the door to insurance reimbursement and clinical referrals, and signals that the category is evolving from "wellness entertainment" to "evidence-based cognitive health." The GAMES study behind it enrolled 500+ participants across 13 U.S. clinical sites.

This creates a rising tide that lifts all boats in brain training. When Lumosity spends millions marketing their FDA-cleared product, every brain training app benefits from increased category awareness and legitimacy.

---

## N-Back Has the Strongest Scientific Foundation in Brain Training

This is your single biggest competitive advantage, and most n-back apps fail to leverage it properly.

### What the Science Actually Says

The seminal Jaeggi et al. (2008) study published in PNAS found that n-back training improved fluid intelligence — a finding that sent shockwaves through cognitive science because fluid intelligence was long believed to be fixed. Subsequent meta-analyses tell a nuanced story: Au et al. (2014) analyzed 20 studies and found a small but statistically significant positive effect of n-back training on fluid intelligence. Soveri et al. (2017) conducted a multi-level meta-analysis of 33 randomized controlled trials and found small to large near-transfer effects and small effects on fluid intelligence. The most recent comprehensive review (Frontiers in Human Neuroscience, 2025) confirms n-back remains the most studied working memory training paradigm with applications in ADHD, depression, neurological rehabilitation, and educational settings.

The debate is real — Melby-Lervåg and Hulme have published skeptical analyses, and Gwern's extensive meta-analysis highlights methodological concerns about active vs. passive control groups. But here's what matters commercially: n-back is the *only* specific brain training task with this depth of research behind it. Lumosity, Elevate, and Peak all use proprietary gamified tasks with far less independent validation. BrainHQ, which scored highest in a systematic review of brain training apps, is built on speed-of-processing training — a different paradigm.

### Your "Poly" Innovation Is Genuinely Novel

Standard dual n-back tracks 2 simultaneous stimuli (typically position + audio). Your Poly N-Back tracks 4 simultaneous attributes: Color, Emoji, Position, and Shape. This is significant because it creates a much richer cognitive challenge that scales difficulty more granularly than simply increasing N. No major competitor offers this multi-attribute approach. It aligns with research showing that multi-dimensional cognitive challenges may produce broader transfer effects.

You've essentially created a "quad n-back" with an intuitive visual interface that makes the complexity accessible. The standard dual n-back implementations feel clinical and intimidating. Your approach of presenting all attributes in a single visual stimulus (an emoji on a colored shape in a position) is more elegant than the typical split-screen audio+visual dual n-back.

---

## Competitive Landscape: Crowded at the Top, Empty in the Middle

### The Giants (Don't Compete Here)

**Lumosity** — 100M+ users, $67M raised, now FDA-cleared for ADHD. Consumer pricing $12/month or $60/year. 70% of brain training app users have tried Lumosity. They own brand recognition.

**Elevate** — Apple's App of the Year (2014). Focus on communication and analytical skills. Clean design, strong retention. 30%+ better retention than static apps.

**Peak** — Gamified approach, one of only two apps rated "good" by systematic scientific review. Strong in Europe.

**BrainHQ** (Posit Science) — The scientific heavyweight. Only app to score 4+ across all categories in quality review. 300+ supporting studies. FDA-cleared EndeavorRx for ADHD predated Lumosity's clearance.

**CogniFit** — Clinical focus, evidence-based assessments, healthcare professional partnerships.

### The N-Back Niche (This Is Where You Compete)

Here's where it gets interesting. The dedicated n-back space is full of **bad apps**:

**dual-n-back.io** — Web app, functional but zero visual appeal. No progression system, no accounts, no monetization beyond donations.

**Dual N-Back Ultimate** (Android) — Recent entry (Feb 2025), clean minimalist design, up to 4 stimuli. Subscription model ($4.99?). Complaints about aggressive upselling. 170K downloads on Android variant. This is your closest competitor and shows the niche has demand.

**Brain Workshop** — Open-source desktop app, looks like it was built in 2008 (it was). Still gets traffic because n-back enthusiasts have limited options.

**nbacking.com** — Basic web implementation, minimal features.

**Various Google Play / App Store apps** — Dozens of low-quality implementations, most with under 10K downloads, poor UI, minimal updates.

### The Gap You Can Fill

The brain training market has a missing middle: serious n-back practitioners want something with Lumosity-level polish but n-back-specific depth. The Google Groups community "Dual N-Back, Brain Training & Intelligence" is still active in 2025, with people actively sharing and critiquing new apps. Reddit's r/nootropics and r/BrainTraining regularly discuss n-back. These communities want a well-built, scientifically grounded n-back app and are willing to pay for one.

Nobody has built the "Duolingo of N-Back" — the app that makes an evidence-based cognitive training paradigm feel engaging, tracks your progress meaningfully, and respects the science while being genuinely fun to use. That's the gap.

---

## What You've Actually Built (Honest Assessment)

### Strengths

- **Vue/Vite/Tailwind/Capacitor stack** — Your exact wheelhouse. Laravel/Vue/React/Svelte developer working in Vue/JS. No stack translation needed.
- **Mobile-ready architecture** — Capacitor setup with both iOS and Android directories. 103 commits of real work over years, not a weekend project.
- **Novel game mechanic** — The 4-attribute "Poly" approach is genuinely differentiated.
- **PWA with service worker** — Already works offline, already installable.
- **Clean codebase** — Small, comprehensible component structure (Stimulus.vue, GameHint.vue, ConfigStart.vue, etc.). Vuex store for state management.
- **Nice logo and branding** — The crystalline brain logo has character.
- **Tutorial/onboarding flow** — You've already thought about first-run experience.
- **Sound design** — Recent commits show you're refining audio feedback.

### Gaps (What's Missing for Revenue)

- **No user accounts or authentication** — Can't track users across devices, can't build a subscriber base, can't analyze cohort retention.
- **No progression system** — No levels, no streaks, no daily goals, no adaptive difficulty. The N-Back and Timer inputs are manual. This is the single biggest gap. Brain training apps live and die by retention, and retention is driven by progression loops.
- **No analytics or cognitive tracking** — Users can't see their improvement over time. No charts, no history, no "your working memory improved 23% this month." This is what people pay for.
- **No monetization infrastructure** — No payment processing, no subscription tiers, no paywall.
- **No social features** — No leaderboards, no sharing, no streaks with friends.
- **Minimal visual feedback** — Correct/incorrect gets basic feedback, but there's no celebration, no particle effects, no satisfying micro-animations.
- **No content variety** — One game mode (classic n-back). No themed sessions, no daily challenges, no varied stimuli sets.
- **No SEO/marketing presence** — polynback.fun exists but has no content marketing, no blog, no landing page optimized for conversion.
- **0 GitHub stars, 0 forks** — No community traction yet.

---

## The Path to Revenue (Concrete Roadmap)

### Phase 1: Foundation (Months 1–3) — Cost: ~$0–$500

**Make it sticky before you monetize.**

1. **User accounts** — Firebase Auth or Supabase (free tier handles 50K MAU). Email + Google + Apple Sign-In. This unlocks everything else.

2. **Session history and analytics** — Store every session: date, N-level, accuracy per attribute, response times. Show users a dashboard with charts. "Your position accuracy improved from 62% to 78% this month." This is the core value proposition people pay for.

3. **Adaptive difficulty** — Auto-adjust N-level based on performance. If accuracy > 80% for 3 consecutive sessions, suggest increasing N. If < 50%, suggest decreasing. Eventually, auto-adapt within sessions.

4. **Streak system** — Daily training reminder, streak counter, streak freeze (premium feature). Duolingo proved this is the most powerful retention mechanic in app history.

5. **Improved feedback and polish** — Satisfying animations on correct answers. Screen shake on mistakes. Progress bar during session. End-of-session summary with "new personal best" celebrations.

### Phase 2: Monetize (Months 3–6) — Cost: ~$500–$2,000

**Freemium model (the industry standard that works).**

Free tier:
- 1 training session per day
- Basic 2-back with all 4 attributes
- 7-day history
- Core game functionality

Premium tier ($4.99/month or $29.99/year):
- Unlimited sessions
- Full history and analytics dashboard
- Adaptive difficulty
- Custom attribute selection (train specific weaknesses)
- N-levels 1–9 (free caps at 3)
- Streak freeze (1 per week)
- Multiple game modes (speed round, endurance, attribute isolation)
- Export training data (CSV)
- No ads (if you add ads to free tier)

Payment: Stripe for web, App Store / Google Play in-app purchases for mobile. RevenueCat ($0 until $2.5K MTR) handles cross-platform subscription management.

### Phase 3: Growth (Months 6–12) — Cost: ~$2,000–$5,000

1. **App Store presence** — Ship native iOS and Android apps via Capacitor. You already have the directories set up. The App Store is where brain training discovery happens. Target "n-back," "brain training," "working memory," "cognitive training" keywords.

2. **Content marketing** — Blog at polynback.fun/blog. Articles: "N-Back Training: What the Science Actually Says," "Dual N-Back vs Poly N-Back: Why More Dimensions Matter," "How I Improved My Working Memory in 30 Days." Target long-tail SEO for "best n-back app," "dual n-back training," "improve working memory."

3. **Community** — Share on r/nootropics, r/BrainTraining, HackerNews, IndieHackers. The "built by Human+AI collaboration" angle is genuinely interesting to tech communities. Post your MRR journey transparently.

4. **Visual upgrade** — Hire a freelance illustrator ($1,500–$3,000) for themed visual sets. Not tower-defense-level 3D art — think clean, scientific-but-warm illustrations. Brain-themed achievements, level badges, progress visualization. This is where the Giftbox Games screenshots were pulling you — and the instinct is right that visual polish matters — but the execution should match the brain training aesthetic, not mobile gaming.

5. **Referral system** — "Give a friend 1 week of Premium, get 1 week free." Word of mouth is the #1 acquisition channel for brain training apps.

---

## The Million-Dollar Math

Let's be rigorous about what "million-dollar asset" actually means.

### Revenue Path

A brain training app is valued at roughly 4–8x annual revenue (SaaS multiples for consumer subscription apps). To be worth $1M, you need approximately $125K–$250K ARR, which translates to roughly $10K–$21K MRR.

At $29.99/year (or $4.99/month, averaging ~$3.50/month with annual discount):
- 3,000 paying subscribers = ~$10.5K MRR = ~$126K ARR → **~$500K–$1M valuation**
- 6,000 paying subscribers = ~$21K MRR = ~$252K ARR → **~$1M–$2M valuation**

At a 3–5% free-to-paid conversion rate (industry standard for brain training freemium):
- 3,000 paid requires 60K–100K active free users
- 6,000 paid requires 120K–200K active free users

Is 100K active users achievable? The dedicated Dual N-Back app on Google Play has 170K lifetime downloads — and it's a mediocre app with limited features. Lumosity has 100M+ users. The n-back niche audience alone (people who specifically seek out n-back training) is likely in the hundreds of thousands globally, based on Google Trends data, subreddit sizes, and app download volumes.

### Timeline Reality

- **Month 6**: 500–2,000 free users, 15–60 paid → $50–$200/month
- **Month 12**: 5,000–15,000 free users, 150–750 paid → $500–$2,500/month
- **Month 18**: 20,000–50,000 free users, 600–2,500 paid → $2,000–$8,500/month
- **Month 24**: 50,000–100,000 free users, 1,500–5,000 paid → $5,000–$17,500/month

These ranges are wide because growth depends heavily on App Store ranking momentum, content marketing traction, and word-of-mouth velocity. The optimistic end assumes you hit the App Store "Editors' Choice" type of discovery moment or a viral Reddit/HN post. The conservative end assumes steady organic growth.

### How This Compares to Micro-Acquisition

Your Flippa strategy targets $200–$800/month profit from a first $12K–$24K acquisition. Poly N-Back could reach that same revenue level within 6–12 months with $2K–$5K invested (mostly in design and App Store fees), plus your development time. The ceiling is dramatically higher because you own the product, the brand, and the roadmap entirely.

---

## Why This Might NOT Work (Red Flags)

Intellectual honesty demands these:

1. **Consumer apps are brutally hard.** The graveyard of brain training apps is enormous. Most never reach 1,000 users. Distribution is the hardest problem in consumer software, and no amount of engineering quality solves it alone.

2. **You said you have limited sales/marketing experience.** This is a consumer product that needs marketing to succeed. The code is maybe 30% of the equation. Growth hacking, ASO (App Store Optimization), content marketing, community building — these are the multipliers.

3. **The science is contested.** If a major study or meta-analysis drops concluding "n-back training doesn't work," it could deflate the entire niche overnight. The Lumosity FTC settlement in 2016 ($2M fine for false claims) shows regulators are watching. You'd need to be careful about claims.

4. **Solo operator time constraints.** You're targeting 5–10 hours/week per property in your acquisition strategy. Building Poly N-Back into a serious product is probably 15–25 hours/week for the first 6 months. It's a different commitment level.

5. **Platform risk.** Apple and Google take 15–30% of subscription revenue. They can change rules, reject updates, or feature competitors. The web version (PWA) mitigates this somewhat, but most brain training revenue comes through app stores.

---

## The Strategic Recommendation

**Don't choose between Poly N-Back and micro-acquisitions. Sequence them.**

**Next 6 months**: Go all-in on Poly N-Back. Implement Phase 1 and Phase 2. Ship to App Store and Google Play. Get to your first 1,000 free users and first 50 paying subscribers. This costs under $3K in direct expenses and is the highest-leverage use of your time and technical skills.

**At the 6-month mark**, you'll have real data: retention curves, conversion rates, organic growth velocity. If the numbers look promising (>30% Day-7 retention, >3% conversion, growing organically), double down. If they don't, you haven't burned your acquisition capital, and you've built a live portfolio piece that demonstrates your ability to build, ship, and monetize — which actually makes you a better micro-acquirer.

**Preserve $15K–$25K** of your acquisition capital untouched during this period. If Poly N-Back shows traction, you might reinvest some into marketing and design. If it doesn't reach product-market fit, pivot back to the acquisition strategy with your capital intact and valuable experience gained.

The reason your instinct keeps circling back to Poly N-Back is that it passes every filter from the acquisition playbook:

- ✅ Only buy what your code skills can improve → You built it. Your skills directly improve it.
- ✅ Core value proposition LLMs can't replicate → N-back requires real-time interactive cognitive challenge. ChatGPT can't replace this.
- ✅ Not Google-organic-dependent → App stores are the primary distribution channel.
- ✅ Scientifically grounded moat → The research backing is a real differentiator vs. generic "brain game" apps.
- ✅ Growing market with proven willingness to pay → $10B+ market growing 19%+ annually.
- ✅ $0 acquisition cost → All capital goes to improvement, not purchase price.

The best micro-acquisition opportunity you have might be the one you've already built.

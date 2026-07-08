# Vitality Health 🌿

A clean, responsive **health & wellness website** — evidence-based guidance plus a few handy interactive tools. Built with plain HTML, CSS, and vanilla JavaScript, so it runs anywhere with no build step.

## Features

- **Vita — a JARVIS-style AI assistant** 💬 A proactive chat companion that **greets
  you on open** with a time- and data-aware briefing, can **speak** (text-to-speech)
  and **listen** (voice input via the mic), and shows a typing indicator. It
  understands plain-language commands to **log** your weight, water, sleep, steps,
  mood, workouts, and meals, and to **set reminders** (`"remind me to stretch in 30
  minutes"`, `"at 3pm"`) — firing browser notifications + on-screen toasts when due.
- **Personalized for every body** — a "Choose your path" selector (Just starting /
  Keeping fit / Athlete-bodybuilder) tailors the workout planner defaults and Vita's
  coaching tone to your level.
- **Simple & Full views** — the site opens in a calm Simple view for everyday
  visitors; the power tools (workout planner, fuel calculator, 1RM estimator) are
  one tap away behind the "Full view" toggle. Picking the "Just starting" path
  keeps things simple; athletes get Full view automatically.
- **kg ⇄ lb everywhere** — a global unit switch in the nav converts your logged
  weights across the journal, charts, and Vita, and points the BMI/fuel/1RM tools
  at matching defaults.
- **Fuel calculator** — estimates daily calories and protein/carb/fat targets for
  cutting, maintaining, or bulking (Mifflin-St Jeor).
- **Health journal** — a live dashboard of everything Vita logs: today's snapshot
  tiles, recent entries, and active reminders. All data stays in `localStorage`.
- **Trends over time** — small-multiple charts (weight, water, sleep, steps, and
  mood on a low→great scale) built from your journal, with 7/14/30-day ranges,
  hover tooltips, and a "Try sample data" preview. Accessible single-hue marks
  validated for colour-vision safety.
- **Strength tools** — a one-rep max estimator (Epley) with training-percentage
  tiles, plus lift logging via Vita (`"log bench 80kg x 5"`) that replies with
  your estimated 1RM.
- **CSV export** — download your whole journal from the Journal section or by
  telling Vita `"export my data"`.
- **Beginner workouts** — a "New to exercise? Start here" guide with a 15-minute
  starter routine, first-timer tips, and eight no-equipment moves explained.
- **Health A–Z library** — 49 guides in a clean alphabetical directory (slim
  expandable rows, not cards) with live search and filters across 11 categories:
  heart & blood, mind, sleep, bones & muscles, breathing & allergy, digestion &
  metabolism, skin & sun, eyes/ears/teeth, women's health, men's health, and
  prevention & habits. Each topic is curated from a renowned organization — WHO,
  CDC, NIH institutes, APA, American Heart Association, American Academy of
  Dermatology, American Cancer Society, Sleep Foundation, American Lung
  Association, Urology Care Foundation, Office on Women's Health, AAFA — and
  links to the full expert guidance. Ask Vita `"tell me about blood pressure"`
  (or PCOS, stroke, thyroid…) for any topic in chat.
- **Hero + wellness pillars** — Movement, Nutrition, Sleep, and Mind.
- **Daily habit tracker** — check off habits with a live progress ring; state is saved in `localStorage` and resets each day.
- **Water intake tracker** — tappable glasses; syncs with anything you log via Vita.
- **Workout planner** — generates a weekly split from your goal, experience, and training days.
- **BMI calculator** — metric/imperial toggle with category classification.
- **Dark mode** — toggle with system-preference detection and persistence.
- **Articles section** and **newsletter signup** (client-side demo).
- Fully **responsive** with a mobile nav, accessible markup, and reduced-motion support.

> 🔒 **Privacy:** Vita is a rule-based assistant that runs entirely in your browser.
> No data ever leaves your device — there is no server and no tracking.

> ⚕️ This site is for general education only and is **not medical advice**. Consult a qualified healthcare professional for personal guidance.

## 📲 It's an app (PWA)

Vitality Health is an installable **Progressive Web App**:

- **Install it** — tap the "📲 Install" button in the nav (Chrome/Edge/Android), or
  Share → *Add to Home Screen* on iOS Safari. It opens full-screen with its own
  icon, like a native app.
- **Works offline** — a service worker caches the whole app, so trackers, Vita,
  and the Health A–Z all work with no connection. Your data lives in
  `localStorage` on the device either way.
- **Deploys itself** — pushing to the default branch publishes the app to GitHub
  Pages via `.github/workflows/pages.yml`.

## Run it locally

No dependencies. Serve the folder (a server is needed for the service worker):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page structure and content |
| `styles.css` | Styling, layout, dark theme, responsive rules |
| `script.js`  | Vita assistant, health journal, reminders, habit & water trackers, workout planner, BMI tool, dark mode, nav |
| `manifest.webmanifest` | PWA identity: name, icons, standalone display |
| `sw.js` | Service worker: offline-first app-shell caching |
| `icons/` | App icons (192/512, maskable, apple-touch) |
| `.github/workflows/pages.yml` | GitHub Pages deploy |

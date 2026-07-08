# Vitality Health 🌿

A clean, responsive **health & wellness website** — evidence-based guidance plus a few handy interactive tools. Built with plain HTML, CSS, and vanilla JavaScript, so it runs anywhere with no build step.

## Features

- **Vita — AI health assistant** 💬 A chat companion (bottom-right) that understands
  plain-language commands to **log** your weight, water, sleep, steps, mood, workouts,
  and meals, and to **set reminders** (`"remind me to stretch in 30 minutes"`,
  `"at 3pm"`). Fires browser notifications + on-screen toasts when reminders are due.
- **Health journal** — a live dashboard of everything Vita logs: today's snapshot
  tiles, recent entries, and active reminders. All data stays in `localStorage`.
- **Trends over time** — small-multiple charts (weight, water, sleep, steps) built
  from your journal, with 7/14/30-day ranges, hover tooltips, and a "Try sample
  data" preview. Accessible single-hue marks validated for colour-vision safety.
- **Beginner workouts** — a "New to exercise? Start here" guide with a 15-minute
  starter routine, first-timer tips, and eight no-equipment moves explained.
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

## Run it

No dependencies. Just open the file, or serve the folder:

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

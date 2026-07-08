/* ===== Vitality Health — interactivity ===== */
(function () {
  "use strict";

  /* Footer year */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Mobile nav toggle */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("nav-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ===== Habit tracker (persisted in localStorage, reset daily) ===== */
  var STORAGE_KEY = "vh-habits";
  var boxes = Array.prototype.slice.call(
    document.querySelectorAll("#habit-list input[type=checkbox]")
  );
  var ring = document.getElementById("progress-ring");
  var ringText = document.getElementById("progress-text");
  var msg = document.getElementById("progress-msg");
  var resetBtn = document.getElementById("reset-habits");

  var messages = [
    "Let's build a great day.",
    "Nice start — keep going!",
    "You're building momentum.",
    "Halfway there. Strong work!",
    "Almost done — finish strong.",
    "So close!",
    "Perfect day. Well done! 🎉",
  ];

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function loadState() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (raw.date !== todayKey()) return {};
      return raw.habits || {};
    } catch (e) {
      return {};
    }
  }

  function saveState() {
    var habits = {};
    boxes.forEach(function (b) {
      habits[b.dataset.habit] = b.checked;
    });
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ date: todayKey(), habits: habits })
      );
    } catch (e) {
      /* storage unavailable — non-fatal */
    }
  }

  function render() {
    if (!boxes.length) return;
    var done = boxes.filter(function (b) {
      return b.checked;
    }).length;
    var pct = Math.round((done / boxes.length) * 100);
    if (ring) ring.style.setProperty("--pct", pct);
    if (ringText) ringText.textContent = pct + "%";
    if (msg) {
      var idx = Math.round((done / boxes.length) * (messages.length - 1));
      msg.textContent = messages[idx];
    }
  }

  if (boxes.length) {
    var saved = loadState();
    boxes.forEach(function (b) {
      if (saved[b.dataset.habit]) b.checked = true;
      b.addEventListener("change", function () {
        saveState();
        render();
      });
    });
    render();

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        boxes.forEach(function (b) {
          b.checked = false;
        });
        saveState();
        render();
      });
    }
  }

  /* ===== BMI calculator ===== */
  var bmiForm = document.getElementById("bmi-form");
  var heightInput = document.getElementById("height");
  var weightInput = document.getElementById("weight");
  var heightLabel = document.getElementById("height-label");
  var weightLabel = document.getElementById("weight-label");
  var resultBox = document.getElementById("bmi-result");
  var valueEl = document.getElementById("bmi-value");
  var categoryEl = document.getElementById("bmi-category");
  var unitBtns = Array.prototype.slice.call(document.querySelectorAll(".unit-btn"));
  var unit = "metric";

  function setUnit(next) {
    unit = next;
    unitBtns.forEach(function (b) {
      b.classList.toggle("active", b.dataset.unit === next);
    });
    if (next === "metric") {
      heightLabel.textContent = "Height (cm)";
      weightLabel.textContent = "Weight (kg)";
      heightInput.placeholder = "170";
      weightInput.placeholder = "68";
    } else {
      heightLabel.textContent = "Height (in)";
      weightLabel.textContent = "Weight (lb)";
      heightInput.placeholder = "67";
      weightInput.placeholder = "150";
    }
    heightInput.value = "";
    weightInput.value = "";
    if (resultBox) resultBox.hidden = true;
  }

  unitBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      setUnit(b.dataset.unit);
    });
  });

  function classify(bmi) {
    if (bmi < 18.5) return { label: "Underweight", cls: "cat-under" };
    if (bmi < 25) return { label: "Normal weight", cls: "cat-normal" };
    if (bmi < 30) return { label: "Overweight", cls: "cat-over" };
    return { label: "Obese", cls: "cat-obese" };
  }

  if (bmiForm) {
    bmiForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var h = parseFloat(heightInput.value);
      var w = parseFloat(weightInput.value);
      if (!(h > 0) || !(w > 0)) {
        resultBox.hidden = false;
        valueEl.textContent = "–";
        categoryEl.textContent = "Please enter valid height and weight.";
        categoryEl.className = "bmi-category cat-over";
        return;
      }
      var bmi;
      if (unit === "metric") {
        var m = h / 100;
        bmi = w / (m * m);
      } else {
        bmi = (703 * w) / (h * h);
      }
      bmi = Math.round(bmi * 10) / 10;
      var c = classify(bmi);
      resultBox.hidden = false;
      valueEl.textContent = bmi.toFixed(1);
      categoryEl.textContent = c.label;
      categoryEl.className = "bmi-category " + c.cls;
    });
  }

  /* ===== Dark mode toggle ===== */
  var themeToggle = document.getElementById("theme-toggle");
  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") || "light";
  }
  function paintThemeIcon() {
    var icon = themeToggle && themeToggle.querySelector(".theme-icon");
    if (icon) icon.textContent = currentTheme() === "dark" ? "☀️" : "🌙";
  }
  if (themeToggle) {
    paintThemeIcon();
    themeToggle.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem("vh-theme", next);
      } catch (e) {}
      paintThemeIcon();
    });
  }

  /* ===== Water intake tracker ===== */
  var WATER_KEY = "vh-water";
  var WATER_GOAL = 8;
  var ML_PER_GLASS = 250;
  var waterWrap = document.getElementById("water-glasses");
  var waterCurrentEl = document.getElementById("water-current");
  var waterGoalEl = document.getElementById("water-goal");
  var waterLitresEl = document.getElementById("water-litres");
  var waterMsg = document.getElementById("water-msg");
  var waterPlus = document.getElementById("water-plus");
  var waterMinus = document.getElementById("water-minus");
  var waterCount = 0;

  function loadWater() {
    try {
      var raw = JSON.parse(localStorage.getItem(WATER_KEY) || "{}");
      if (raw.date !== todayKey()) return 0;
      return Math.min(WATER_GOAL, Math.max(0, raw.count || 0));
    } catch (e) {
      return 0;
    }
  }
  function saveWater() {
    try {
      localStorage.setItem(WATER_KEY, JSON.stringify({ date: todayKey(), count: waterCount }));
    } catch (e) {}
  }
  function renderWater() {
    if (!waterWrap) return;
    var glasses = waterWrap.querySelectorAll(".glass");
    glasses.forEach(function (g, i) {
      g.classList.toggle("filled", i < waterCount);
      g.setAttribute("aria-pressed", String(i < waterCount));
    });
    if (waterCurrentEl) waterCurrentEl.textContent = waterCount;
    var litres = (waterCount * ML_PER_GLASS) / 1000;
    if (waterLitresEl) waterLitresEl.textContent = litres.toFixed(2) + " L logged";
    if (waterMsg) {
      waterMsg.textContent =
        waterCount >= WATER_GOAL ? "Goal reached — nicely hydrated! 💧"
        : waterCount === 0 ? ""
        : "Keep sipping — " + (WATER_GOAL - waterCount) + " to go.";
    }
  }
  function setWater(n) {
    waterCount = Math.min(WATER_GOAL, Math.max(0, n));
    saveWater();
    renderWater();
  }
  if (waterWrap) {
    if (waterGoalEl) waterGoalEl.textContent = WATER_GOAL;
    for (var i = 0; i < WATER_GOAL; i++) {
      var g = document.createElement("button");
      g.type = "button";
      g.className = "glass";
      g.textContent = "💧";
      g.setAttribute("aria-label", "Glass " + (i + 1));
      g.dataset.index = i;
      g.addEventListener("click", function (e) {
        var idx = parseInt(e.currentTarget.dataset.index, 10);
        // Clicking a filled glass at the top edge empties it; otherwise fill up to it.
        setWater(idx + 1 === waterCount ? idx : idx + 1);
      });
      waterWrap.appendChild(g);
    }
    waterCount = loadWater();
    renderWater();
    if (waterPlus) waterPlus.addEventListener("click", function () { setWater(waterCount + 1); });
    if (waterMinus) waterMinus.addEventListener("click", function () { setWater(waterCount - 1); });
  }
  // Expose a hook so the assistant can log water into this tracker.
  window.VitalityHealth = window.VitalityHealth || {};
  window.VitalityHealth.addWater = function (n) {
    if (!waterWrap) return 0;
    setWater(waterCount + (n || 1));
    return waterCount;
  };

  /* ===== Workout planner ===== */
  var workoutForm = document.getElementById("workout-form");
  var planWrap = document.getElementById("workout-plan");
  var planGrid = document.getElementById("plan-grid");
  var planTitle = document.getElementById("plan-title");
  var planNote = document.getElementById("plan-note");

  // Building blocks keyed by focus; exercises scale with level.
  var BLOCKS = {
    "Full body": {
      beginner: ["Bodyweight squats 3×10", "Incline push-ups 3×8", "Assisted rows 3×10", "Plank 3×20s"],
      intermediate: ["Goblet squats 4×10", "Push-ups 4×12", "Dumbbell rows 4×10", "Plank 3×40s"],
      advanced: ["Barbell squats 5×5", "Weighted push-ups 4×12", "Pull-ups 4×8", "Plank 3×60s"],
    },
    "Upper body": {
      beginner: ["Incline push-ups 3×8", "Band rows 3×12", "Shoulder press 3×10", "Bicep curls 3×12"],
      intermediate: ["Push-ups 4×12", "Dumbbell rows 4×10", "Overhead press 4×8", "Curls & dips 3×12"],
      advanced: ["Bench press 5×5", "Weighted pull-ups 4×6", "Overhead press 4×6", "Superset arms 4×12"],
    },
    "Lower body": {
      beginner: ["Bodyweight squats 3×12", "Glute bridges 3×12", "Calf raises 3×15", "Wall sit 3×30s"],
      intermediate: ["Goblet squats 4×10", "Romanian deadlifts 4×10", "Lunges 3×12", "Calf raises 4×15"],
      advanced: ["Back squats 5×5", "Deadlifts 4×5", "Walking lunges 4×12", "Hip thrusts 4×10"],
    },
    "Cardio & core": {
      beginner: ["Brisk walk 25 min", "Knee crunches 3×12", "Dead bug 3×10", "Side plank 2×20s"],
      intermediate: ["Intervals 20 min", "Bicycle crunches 3×20", "Mountain climbers 3×30s", "Side plank 3×30s"],
      advanced: ["HIIT 25 min", "Hanging leg raises 4×12", "Russian twists 4×20", "Plank complex 3×60s"],
    },
    "Conditioning": {
      beginner: ["Easy jog/row 20 min", "Jumping jacks 3×30s", "Step-ups 3×12", "Cool-down stretch"],
      intermediate: ["Tempo run/row 30 min", "Burpees 4×10", "Kettlebell swings 4×15", "Stretch 5 min"],
      advanced: ["Threshold run 35 min", "Burpees 5×12", "KB swings 5×20", "Mobility 10 min"],
    },
  };

  // Weekly focus split by number of training days.
  var SPLITS = {
    2: ["Full body", "Full body"],
    3: ["Full body", "Cardio & core", "Full body"],
    4: ["Upper body", "Lower body", "Upper body", "Lower body"],
    5: ["Upper body", "Lower body", "Cardio & core", "Upper body", "Lower body"],
  };

  var GOAL_NOTE = {
    general: "A balanced routine to build all-round fitness. Keep 1–2 rest days and listen to your body.",
    strength: "Progressive overload is key — add a little weight or a rep each week. Rest fully between sessions.",
    weight: "Pair this with a modest calorie deficit and daily steps. Consistency beats intensity.",
    endurance: "Focus on steady, repeatable effort. Build duration gradually — no more than ~10% per week.",
  };

  var DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  function buildPlan(goal, level, days) {
    var focuses = (SPLITS[days] || SPLITS[3]).slice();
    // For weight/endurance goals, bias one session toward conditioning.
    if ((goal === "weight" || goal === "endurance") && focuses.length >= 3) {
      focuses[focuses.length - 1] = "Conditioning";
    }
    // Spread training days + rest days across a 7-day week.
    var plan = [];
    var trainingIdx = 0;
    // Simple even-ish distribution: pick which weekdays are training.
    var trainDayNumbers = pickTrainingDays(days);
    for (var d = 0; d < 7; d++) {
      if (trainDayNumbers.indexOf(d) !== -1 && trainingIdx < focuses.length) {
        var focus = focuses[trainingIdx++];
        plan.push({
          day: DAY_NAMES[d],
          focus: focus,
          rest: false,
          items: (BLOCKS[focus][level] || BLOCKS[focus].beginner),
        });
      } else {
        plan.push({ day: DAY_NAMES[d], focus: "Rest / recovery", rest: true, items: ["Light walk or stretching", "Hydrate & sleep well"] });
      }
    }
    return plan;
  }

  function pickTrainingDays(days) {
    // Evenly spaced training days across the week.
    var chosen = [];
    var step = 7 / days;
    for (var i = 0; i < days; i++) chosen.push(Math.round(i * step));
    return chosen;
  }

  function renderPlan(plan, goal) {
    if (!planGrid) return;
    planGrid.innerHTML = "";
    plan.forEach(function (day) {
      var card = document.createElement("article");
      card.className = "card plan-day" + (day.rest ? " rest" : "");
      var list = day.items.map(function (x) { return "<li>" + x + "</li>"; }).join("");
      card.innerHTML =
        "<h4>" + day.day + "</h4>" +
        '<p class="plan-focus">' + day.focus + "</p>" +
        "<ul>" + list + "</ul>";
      planGrid.appendChild(card);
    });
    if (planNote) planNote.textContent = GOAL_NOTE[goal] || "";
    if (planWrap) {
      planWrap.hidden = false;
      planWrap.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  if (workoutForm) {
    workoutForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var goal = document.getElementById("wk-goal").value;
      var level = document.getElementById("wk-level").value;
      var days = parseInt(document.getElementById("wk-days").value, 10);
      if (planTitle) {
        var goalLabels = { general: "General fitness", strength: "Strength", weight: "Weight loss", endurance: "Endurance" };
        planTitle.textContent = "Your " + days + "-day " + (goalLabels[goal] || "") + " plan";
      }
      renderPlan(buildPlan(goal, level, days), goal);
    });
  }

  /* =====================================================================
     Vita — AI health assistant + health journal + reminders
     A privacy-first, rule-based companion. All data stays in localStorage.
     ===================================================================== */
  var J_KEY = "vh-journal";
  var R_KEY = "vh-reminders";
  var C_KEY = "vh-chat";

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function readStore(key) {
    try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch (e) { return []; }
  }
  function writeStore(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }
  function isToday(ts) {
    return new Date(ts).toISOString().slice(0, 10) === todayKey();
  }
  function timeLabel(ts) {
    var d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  var journal = readStore(J_KEY);
  var reminders = readStore(R_KEY);

  /* ---------- Journal rendering ---------- */
  var journalStats = document.getElementById("journal-stats");
  var journalList = document.getElementById("journal-list");
  var reminderList = document.getElementById("reminder-list");

  function todaysEntries() {
    return journal.filter(function (e) { return isToday(e.ts); });
  }

  function snapshot() {
    var t = todaysEntries();
    function latest(type) {
      for (var i = t.length - 1; i >= 0; i--) if (t[i].type === type) return t[i];
      return null;
    }
    var weight = latest("weight");
    var sleep = latest("sleep");
    var steps = latest("steps");
    var mood = latest("mood");
    var water = t.filter(function (e) { return e.type === "water"; })
      .reduce(function (s, e) { return s + (e.value || 1); }, 0);
    var workouts = t.filter(function (e) { return e.type === "workout"; }).length;
    return { weight: weight, sleep: sleep, steps: steps, mood: mood, water: water, workouts: workouts };
  }

  function renderStats() {
    if (!journalStats) return;
    var s = snapshot();
    var tiles = [
      { emoji: "⚖️", label: "Weight", value: s.weight ? s.weight.value + " <small>" + s.weight.unit + "</small>" : "—" },
      { emoji: "💧", label: "Water", value: s.water + " <small>glasses</small>" },
      { emoji: "😴", label: "Sleep", value: s.sleep ? s.sleep.value + " <small>h</small>" : "—" },
      { emoji: "👟", label: "Steps", value: s.steps ? Number(s.steps.value).toLocaleString() : "—" },
      { emoji: s.mood ? s.mood.emoji : "🙂", label: "Mood", value: s.mood ? '<small style="font-size:.8rem">' + s.mood.value + "</small>" : "—" },
      { emoji: "🏋️", label: "Workouts", value: String(s.workouts) },
    ];
    journalStats.innerHTML = tiles.map(function (t) {
      return '<div class="stat-tile"><span class="stat-emoji">' + t.emoji +
        '</span><span class="stat-value">' + t.value +
        '</span><span class="stat-label">' + t.label + "</span></div>";
    }).join("");
  }

  function renderJournalList() {
    if (!journalList) return;
    if (!journal.length) {
      journalList.innerHTML = '<li class="journal-empty">No entries yet. Open Vita (💬) and try <em>"log weight 70kg"</em>.</li>';
      return;
    }
    var recent = journal.slice(-8).reverse();
    journalList.innerHTML = recent.map(function (e) {
      return '<li><span class="j-emoji">' + e.emoji + '</span><span class="j-text">' +
        escapeHtml(e.text) + '</span><span class="j-time">' + timeLabel(e.ts) + "</span></li>";
    }).join("");
  }

  function renderReminderList() {
    if (!reminderList) return;
    var active = reminders.slice().sort(function (a, b) { return a.at - b.at; });
    if (!active.length) {
      reminderList.innerHTML = '<li class="journal-empty">No reminders yet. Try <em>"remind me to stretch in 30 minutes"</em>.</li>';
      return;
    }
    reminderList.innerHTML = active.map(function (r) {
      var when = r.fired ? "done" : timeLabel(r.at) + (isToday(r.at) ? "" : ", " + new Date(r.at).toLocaleDateString([], { month: "short", day: "numeric" }));
      return '<li class="' + (r.fired ? "fired" : "") + '"><span class="r-main">⏰ <span>' +
        escapeHtml(r.text) + '</span></span><span class="r-time">' + when +
        '</span><button class="r-cancel" data-id="' + r.id + '" aria-label="Cancel reminder">✕</button></li>';
    }).join("");
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function renderAll() {
    renderStats();
    renderJournalList();
    renderReminderList();
  }

  function addEntry(type, emoji, text, value, unit) {
    journal.push({ id: uid(), ts: Date.now(), type: type, emoji: emoji, text: text, value: value, unit: unit });
    if (journal.length > 400) journal = journal.slice(-400);
    writeStore(J_KEY, journal);
    renderAll();
    document.dispatchEvent(new CustomEvent("vh:journal-changed"));
  }

  if (reminderList) {
    reminderList.addEventListener("click", function (e) {
      var btn = e.target.closest(".r-cancel");
      if (!btn) return;
      var id = btn.dataset.id;
      reminders = reminders.filter(function (r) { return r.id !== id; });
      writeStore(R_KEY, reminders);
      renderReminderList();
    });
  }

  var journalClear = document.getElementById("journal-clear");
  if (journalClear) journalClear.addEventListener("click", function () {
    journal = [];
    writeStore(J_KEY, journal);
    renderAll();
    document.dispatchEvent(new CustomEvent("vh:journal-changed"));
  });
  var remindersClear = document.getElementById("reminders-clear");
  if (remindersClear) remindersClear.addEventListener("click", function () {
    reminders = [];
    writeStore(R_KEY, reminders);
    renderReminderList();
  });

  /* ---------- Toasts + notifications ---------- */
  var toastStack = document.getElementById("toast-stack");
  function showToast(emoji, title, body, ms) {
    if (!toastStack) return;
    var el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = '<span class="toast-emoji">' + emoji + "</span><div><strong>" +
      escapeHtml(title) + "</strong><span>" + escapeHtml(body) + "</span></div>";
    toastStack.appendChild(el);
    setTimeout(function () {
      el.style.transition = "opacity .3s, transform .3s";
      el.style.opacity = "0";
      el.style.transform = "translateX(-20px)";
      setTimeout(function () { el.remove(); }, 320);
    }, ms || 7000);
  }

  /* ---------- Reminder scheduling ---------- */
  var timers = {};
  function fireReminder(r) {
    if (r.fired) return;
    r.fired = true;
    writeStore(R_KEY, reminders);
    renderReminderList();
    showToast("⏰", "Reminder", r.text);
    if ("Notification" in window && Notification.permission === "granted") {
      try { new Notification("🌿 Vita reminder", { body: r.text }); } catch (e) {}
    }
    if (assistantOpen) botSay("⏰ Reminder: " + r.text);
  }
  function scheduleReminder(r) {
    if (r.fired) return;
    var delay = r.at - Date.now();
    if (delay <= 0) { fireReminder(r); return; }
    if (timers[r.id]) clearTimeout(timers[r.id]);
    // setTimeout caps around ~24.8 days; clamp and re-check via the sweep for longer waits.
    timers[r.id] = setTimeout(function () { fireReminder(r); }, Math.min(delay, 2147483647));
  }
  reminders.forEach(scheduleReminder);
  // Safety sweep: catches due reminders even if a timer was lost.
  setInterval(function () {
    var now = Date.now();
    reminders.forEach(function (r) { if (!r.fired && r.at <= now) fireReminder(r); });
  }, 20000);

  function addReminder(text, at) {
    var r = { id: uid(), text: text, at: at, created: Date.now(), fired: false };
    reminders.push(r);
    writeStore(R_KEY, reminders);
    renderReminderList();
    scheduleReminder(r);
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(function () {});
    }
    return r;
  }

  /* ---------- Natural-language parsing ---------- */
  var MOOD_EMOJI = {
    great: "😄", amazing: "🤩", awesome: "🤩", happy: "😄", good: "🙂", fine: "🙂",
    ok: "🙂", okay: "🙂", meh: "😐", tired: "😴", exhausted: "😴", sleepy: "😴",
    stressed: "😣", anxious: "😰", nervous: "😰", sad: "😔", down: "😔", low: "😔",
    bad: "😔", sick: "🤒", ill: "🤒", angry: "😠", energetic: "⚡", motivated: "💪",
  };
  var CRISIS = /\b(chest pain|can'?t breathe|cannot breathe|suicidal|kill myself|end my life|overdose|heart attack|stroke|seizure)\b/i;

  function parseWhen(str) {
    var m;
    if ((m = /\bin\s+(\d+(?:\.\d+)?)\s*(sec|secs|second|seconds|min|mins|minute|minutes|hour|hours|hr|hrs|day|days)\b/i.exec(str))) {
      var n = parseFloat(m[1]);
      var unit = m[2].toLowerCase();
      var ms = /sec/.test(unit) ? n * 1000
        : /min/.test(unit) ? n * 60000
        : /hour|hr/.test(unit) ? n * 3600000
        : n * 86400000;
      return { at: Date.now() + ms, matched: m[0] };
    }
    if ((m = /\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i.exec(str))) {
      var h = parseInt(m[1], 10);
      var min = m[2] ? parseInt(m[2], 10) : 0;
      var ap = m[3] ? m[3].toLowerCase() : "";
      if (ap === "pm" && h < 12) h += 12;
      if (ap === "am" && h === 12) h = 0;
      var d = new Date();
      d.setHours(h, min, 0, 0);
      if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1); // roll to tomorrow
      return { at: d.getTime(), matched: m[0] };
    }
    return null;
  }

  function num(str) {
    var m = /(\d[\d,]*(?:\.\d+)?)/.exec(str);
    return m ? parseFloat(m[1].replace(/,/g, "")) : null;
  }

  function handle(raw) {
    var text = raw.trim();
    var low = text.toLowerCase();
    if (!text) return "Type something like \"log water\" or \"remind me to walk in 1 hour\".";

    if (CRISIS.test(low)) {
      return "That sounds serious, and I'm only a wellness helper — not a medical service. " +
        "Please contact your local emergency number or a crisis line right away, or reach out to someone you trust. You deserve real support. 💚";
    }

    // Help
    if (/^(help|what can you do|commands|\?)/.test(low)) {
      return "I can log your health and remind you. Try:\n" +
        "• \"log weight 70kg\"\n• \"log water\" (or \"drank 2 glasses\")\n" +
        "• \"slept 7.5 hours\"\n• \"log 8000 steps\"\n• \"feeling great\"\n" +
        "• \"log workout 30 min run\"\n• \"remind me to stretch in 30 minutes\"\n" +
        "• \"summary\" for today's recap.";
    }

    // Greetings / thanks
    if (/^(hi|hey|hello|yo|hiya|good (morning|afternoon|evening))\b/.test(low))
      return "Hi! 🌿 I'm Vita. Tell me how you're doing — e.g. \"log water\" or \"slept 8 hours\". Say \"help\" for ideas.";
    if (/\b(thanks|thank you|cheers|ty)\b/.test(low))
      return "Anytime! Keep up the great work. 💚";

    // Clear
    if (/\bclear\b.*\breminder/.test(low) || /\breminder.*\bclear\b/.test(low)) {
      reminders = []; writeStore(R_KEY, reminders); renderReminderList();
      return "Cleared all reminders. ⏰";
    }
    if (/\b(clear|reset|delete)\b.*\b(log|journal|entries|history)\b/.test(low)) {
      journal = []; writeStore(J_KEY, journal); renderAll();
      return "Journal cleared. Fresh start! 🌱";
    }

    // Reminders
    if (/\bremind|\breminder\b/.test(low)) {
      var when = parseWhen(low);
      if (!when) return "When should I remind you? Try \"in 20 minutes\" or \"at 3pm\", e.g. \"remind me to drink water in 20 minutes\".";
      var task = text
        .replace(/\bremind me to\b/i, "")
        .replace(/\bremind me\b/i, "")
        .replace(/\breminder to\b/i, "")
        .replace(/\bremind\b/i, "")
        .replace(when.matched, "")
        .replace(/\bto\b\s*$/i, "")
        .trim();
      task = task.replace(/^to\s+/i, "").trim() || "check in on your health";
      addReminder(task, when.at);
      return "Got it — I'll remind you to " + task + " at " + timeLabel(when.at) +
        (isToday(when.at) ? "" : " tomorrow") + ". ⏰";
    }

    // Summary
    if (/\b(summary|recap|how am i|how'?m i|status|progress|today|report)\b/.test(low)) {
      var s = snapshot();
      var parts = [];
      parts.push("💧 Water: " + s.water + " glass" + (s.water === 1 ? "" : "es"));
      if (s.weight) parts.push("⚖️ Weight: " + s.weight.value + " " + s.weight.unit);
      if (s.sleep) parts.push("😴 Sleep: " + s.sleep.value + " h");
      if (s.steps) parts.push("👟 Steps: " + Number(s.steps.value).toLocaleString());
      if (s.mood) parts.push(s.mood.emoji + " Mood: " + s.mood.value);
      if (s.workouts) parts.push("🏋️ Workouts: " + s.workouts);
      var upcoming = reminders.filter(function (r) { return !r.fired; }).length;
      if (upcoming) parts.push("⏰ " + upcoming + " reminder" + (upcoming === 1 ? "" : "s") + " pending");
      return "Here's today so far:\n" + parts.join("\n") +
        (s.water < 8 ? "\n\nTip: " + (8 - s.water) + " more glass" + (8 - s.water === 1 ? "" : "es") + " to hit your water goal!" : "\n\nGreat hydration today! 💧");
    }

    // Weight
    if (/\bweigh|\bweight\b/.test(low)) {
      var w = num(low);
      if (w == null) return "How much? Try \"log weight 70kg\".";
      var unit = /\b(lb|lbs|pound)/.test(low) ? "lb" : "kg";
      addEntry("weight", "⚖️", "Weight: " + w + " " + unit, w, unit);
      return "Logged your weight: " + w + " " + unit + ". ⚖️";
    }

    // Sleep
    if (/\bslept\b|\bsleep\b/.test(low)) {
      var h = num(low);
      if (h == null) return "How many hours did you sleep? Try \"slept 7.5 hours\".";
      addEntry("sleep", "😴", "Slept " + h + " h", h, "h");
      var note = h >= 7 ? " Nicely rested! 😴" : h >= 6 ? " Try for a bit more tonight." : " That's short — prioritise rest tonight. 💤";
      return "Logged " + h + " hours of sleep." + note;
    }

    // Steps
    if (/\bsteps?\b/.test(low)) {
      var st = num(low);
      if (st == null) return "How many steps? Try \"log 8000 steps\".";
      addEntry("steps", "👟", Number(st).toLocaleString() + " steps", st, "steps");
      return "Logged " + Number(st).toLocaleString() + " steps." + (st >= 8000 ? " Crushing it! 👟" : " Keep moving!");
    }

    // Water
    if (/\bwater\b|\bhydrate\b|\bdrank\b|glass(?:es)? of water/.test(low)) {
      var g = num(low) || 1;
      g = Math.max(1, Math.min(12, Math.round(g)));
      var total = null;
      if (window.VitalityHealth && window.VitalityHealth.addWater) total = window.VitalityHealth.addWater(g);
      addEntry("water", "💧", "Drank " + g + " glass" + (g === 1 ? "" : "es") + " of water", g, "glass");
      return "Logged " + g + " glass" + (g === 1 ? "" : "es") + " of water. 💧" +
        (total != null ? " That's " + total + "/8 today." : "");
    }

    // Mood
    var moodMatch = /\b(?:feeling|feel|mood(?: is| of)?|i am|i'm)\s+([a-z]+)/.exec(low);
    if (moodMatch && MOOD_EMOJI[moodMatch[1]]) {
      var mword = moodMatch[1];
      addEntry("mood", MOOD_EMOJI[mword], "Feeling " + mword, mword, "");
      return MOOD_EMOJI[mword] + " Noted that you're feeling " + mword + ". Thanks for checking in.";
    }

    // Workout
    if (/\bworkout|worked out|exercis|trained|training|gym|\bran\b|\brun\b|jog|yoga|pilates|cycl|swim|walk(?:ed)?\b/.test(low)) {
      var mins = null;
      var mm = /(\d+)\s*(min|mins|minute|minutes)/.exec(low);
      if (mm) mins = parseInt(mm[1], 10);
      var kind = /yoga/.test(low) ? "yoga" : /run|ran|jog/.test(low) ? "a run" :
        /cycl|bike/.test(low) ? "cycling" : /swim/.test(low) ? "swimming" :
        /walk/.test(low) ? "a walk" : /gym|strength|lift/.test(low) ? "a gym session" : "a workout";
      var label = "Workout: " + kind + (mins ? " (" + mins + " min)" : "");
      addEntry("workout", "🏋️", label, mins, "min");
      return "Nice — logged " + kind + (mins ? " for " + mins + " minutes" : "") + ". 🏋️ Well done!";
    }

    // Meals
    if (/\b(ate|eat|eaten|meal|breakfast|lunch|dinner|snack|had)\b/.test(low)) {
      addEntry("meal", "🍽️", capitalize(text), null, "");
      return "Logged your meal. 🍽️ Aim for veggies and protein when you can!";
    }

    return "I didn't quite catch that. I can log weight, water, sleep, steps, mood, workouts and meals, or set reminders. Say \"help\" for examples. 🌿";
  }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ---------- Chat UI ---------- */
  var launch = document.getElementById("assistant-launch");
  var panel = document.getElementById("assistant-panel");
  var closeBtn = document.getElementById("assistant-close");
  var logEl = document.getElementById("assistant-log");
  var chipsEl = document.getElementById("assistant-chips");
  var form = document.getElementById("assistant-form");
  var input = document.getElementById("assistant-text");
  var assistantOpen = false;
  var chat = readStore(C_KEY);

  function pushMsg(text, who) {
    chat.push({ text: text, who: who });
    if (chat.length > 40) chat = chat.slice(-40);
    writeStore(C_KEY, chat);
  }
  function renderMsg(text, who) {
    if (!logEl) return;
    var el = document.createElement("div");
    el.className = "msg " + who;
    el.textContent = text;
    logEl.appendChild(el);
    logEl.scrollTop = logEl.scrollHeight;
  }
  function botSay(text) { renderMsg(text, "bot"); pushMsg(text, "bot"); }

  var CHIPS = ["Log water", "Log workout", "Summary", "Remind me to stretch in 30 minutes", "Help"];
  function renderChips() {
    if (!chipsEl) return;
    chipsEl.innerHTML = "";
    CHIPS.forEach(function (c) {
      var b = document.createElement("button");
      b.className = "chip";
      b.type = "button";
      b.textContent = c;
      b.addEventListener("click", function () { submitMessage(c); });
      chipsEl.appendChild(b);
    });
  }

  function submitMessage(text) {
    text = (text || "").trim();
    if (!text) return;
    renderMsg(text, "user");
    pushMsg(text, "user");
    var reply = handle(text);
    // Tiny delay to feel conversational.
    setTimeout(function () { botSay(reply); }, 220);
    if (input) input.value = "";
  }

  function openAssistant() {
    if (!panel) return;
    panel.hidden = false;
    assistantOpen = true;
    if (launch) launch.setAttribute("aria-expanded", "true");
    if (!logEl.childElementCount) {
      if (chat.length) {
        chat.forEach(function (m) { renderMsg(m.text, m.who); });
      } else {
        botSay("Hi, I'm Vita 🌿 your health companion. I can log your weight, water, sleep, steps, mood and workouts — and set reminders. Try a chip below or type \"help\".");
      }
    }
    setTimeout(function () { if (input) input.focus(); }, 50);
  }
  function closeAssistant() {
    if (!panel) return;
    panel.hidden = true;
    assistantOpen = false;
    if (launch) launch.setAttribute("aria-expanded", "false");
  }

  if (launch) launch.addEventListener("click", function () { assistantOpen ? closeAssistant() : openAssistant(); });
  if (closeBtn) closeBtn.addEventListener("click", closeAssistant);
  if (form) form.addEventListener("submit", function (e) { e.preventDefault(); submitMessage(input.value); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && assistantOpen) closeAssistant(); });

  renderChips();
  renderAll();

  /* ===== Beginner workout moves ===== */
  var MOVES = [
    { emoji: "🪑", name: "Chair sit-to-stand", reps: "3 × 10", desc: "Sit tall in a sturdy chair, then stand up without using your hands. Sit back down slowly.", tip: "Builds the same strength you use every day." },
    { emoji: "🧱", name: "Wall push-up", reps: "3 × 8", desc: "Hands on a wall, shoulder-width. Bend your elbows to lean in, then push back.", tip: "Move to knees on the floor when it feels easy." },
    { emoji: "🍑", name: "Glute bridge", reps: "3 × 10", desc: "Lie on your back, knees bent. Squeeze your glutes and lift your hips, then lower.", tip: "Keep the lift slow — no arching your lower back." },
    { emoji: "🐕", name: "Bird-dog", reps: "2 × 6 / side", desc: "On hands and knees, extend the opposite arm and leg, hold a beat, return.", tip: "Great for balance and a stable core." },
    { emoji: "🏋️", name: "Bodyweight squat", reps: "3 × 8", desc: "Feet shoulder-width, sit your hips back and down as if reaching for a chair, then stand.", tip: "Keep your heels planted and chest up." },
    { emoji: "🧘", name: "Knee plank", reps: "3 × 20 sec", desc: "Forearms down, knees on the floor, body in a straight line. Hold and breathe.", tip: "Squeeze your tummy — don't let your hips sag." },
    { emoji: "🦵", name: "Calf raise", reps: "3 × 12", desc: "Stand tall, rise onto the balls of your feet, then lower with control.", tip: "Hold a wall for balance if you need to." },
    { emoji: "🐞", name: "Dead bug", reps: "2 × 8 / side", desc: "On your back, arms up. Lower the opposite arm and leg slowly, then switch.", tip: "Press your lower back gently into the floor." },
  ];
  var movesGrid = document.getElementById("moves-grid");
  if (movesGrid) {
    movesGrid.innerHTML = MOVES.map(function (m) {
      return '<article class="card move"><span class="move-emoji">' + m.emoji +
        "</span><h4>" + m.name + '</h4><p class="move-reps">' + m.reps + "</p><p>" +
        m.desc + '</p><p class="move-tip"><strong>Tip:</strong> ' + m.tip + "</p></article>";
    }).join("");
  }

  /* =====================================================================
     Trends — small-multiple charts built from the health journal.
     Single-series per metric; validated hues; direct labels + hover.
     ===================================================================== */
  var trendsGrid = document.getElementById("trends-grid");
  var trendsEmpty = document.getElementById("trends-empty");
  var rangeToggle = document.getElementById("range-toggle");
  var sampleBtn = document.getElementById("sample-data");
  var rangeDays = 7;

  // One shared tooltip element for all charts.
  var chartTip = document.createElement("div");
  chartTip.className = "chart-tip";
  document.body.appendChild(chartTip);

  function dayKeyFromDate(d) { return d.toISOString().slice(0, 10); }
  function shortDay(dk) {
    var d = new Date(dk + "T00:00:00");
    return d.toLocaleDateString([], { weekday: "short" }).slice(0, 2);
  }
  function shortDate(dk) {
    var d = new Date(dk + "T00:00:00");
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  // Build an array of the last N day-keys (oldest → newest).
  function lastNDays(n) {
    var out = [];
    var now = new Date();
    for (var i = n - 1; i >= 0; i--) {
      var d = new Date(now);
      d.setDate(now.getDate() - i);
      out.push(dayKeyFromDate(d));
    }
    return out;
  }

  // Aggregate journal entries into per-day values for a metric.
  function seriesFor(type, days, agg) {
    var byDay = {};
    journal.forEach(function (e) {
      if (e.type !== type) return;
      var dk = new Date(e.ts).toISOString().slice(0, 10);
      if (!byDay[dk]) byDay[dk] = [];
      byDay[dk].push(e.value != null ? e.value : 1);
    });
    return days.map(function (dk) {
      var vals = byDay[dk];
      if (!vals || !vals.length) return { day: dk, value: null };
      var v = agg === "sum" ? vals.reduce(function (a, b) { return a + b; }, 0)
        : agg === "count" ? vals.length
        : vals[vals.length - 1]; // "last"
      return { day: dk, value: v };
    });
  }

  var CHART_DEFS = [
    { type: "weight", title: "Weight", emoji: "⚖️", unit: "kg", kind: "line", agg: "last", series: "#2a78d6", seriesDark: "#3987e5", fmt: function (v) { return v; } },
    { type: "water", title: "Water", emoji: "💧", unit: "glasses", kind: "bar", agg: "sum", series: "#199e70", seriesDark: "#199e70", fmt: function (v) { return v; } },
    { type: "sleep", title: "Sleep", emoji: "😴", unit: "hours", kind: "bar", agg: "last", series: "#4a3aa7", seriesDark: "#9085e9", fmt: function (v) { return v; } },
    { type: "steps", title: "Steps", emoji: "👟", unit: "steps", kind: "bar", agg: "last", series: "#eb6834", seriesDark: "#d95926", fmt: function (v) { return Number(v).toLocaleString(); } },
  ];

  function isDark() { return document.documentElement.getAttribute("data-theme") === "dark"; }

  function niceMax(v) {
    if (v <= 0) return 1;
    var pow = Math.pow(10, Math.floor(Math.log10(v)));
    var n = v / pow;
    var step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
    return step * pow;
  }

  function svgEl(tag, attrs) {
    var el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  function buildChart(def, days) {
    var data = seriesFor(def.type, days, def.agg);
    var present = data.filter(function (d) { return d.value != null; });
    var color = isDark() ? def.seriesDark : def.series;

    var card = document.createElement("article");
    card.className = "card chart-card";

    var latest = present.length ? present[present.length - 1].value : null;
    var prev = present.length > 1 ? present[present.length - 2].value : null;
    var deltaHtml = "";
    if (latest != null && prev != null && prev !== 0) {
      var diff = latest - prev;
      var cls = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
      // For weight, down is typically framed neutrally; keep arrows factual.
      var arrow = diff > 0 ? "▲" : diff < 0 ? "▼" : "▬";
      deltaHtml = '<span class="chart-delta ' + cls + '">' + arrow + " " + def.fmt(Math.abs(Math.round(diff * 10) / 10)) + "</span>";
    }
    var heroHtml = latest != null
      ? def.fmt(latest) + ' <small>' + def.unit + "</small>"
      : '<small>no data yet</small>';

    var head = document.createElement("div");
    head.className = "chart-head";
    head.innerHTML = "<h3>" + def.emoji + " " + def.title + "</h3>" +
      '<span class="chart-hero">' + heroHtml + "</span>";
    card.appendChild(head);
    if (deltaHtml) {
      var deltaWrap = document.createElement("div");
      deltaWrap.innerHTML = deltaHtml + ' <span class="chart-caption" style="display:inline">vs previous</span>';
      card.appendChild(deltaWrap);
    }

    if (!present.length) {
      var empty = document.createElement("p");
      empty.className = "chart-empty";
      empty.textContent = "No " + def.title.toLowerCase() + " logged in this range.";
      card.appendChild(empty);
      return card;
    }

    // Geometry
    var W = 320, H = 150, padL = 30, padR = 12, padT = 14, padB = 22;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var maxRaw = Math.max.apply(null, present.map(function (d) { return d.value; }));
    var minRaw = Math.min.apply(null, present.map(function (d) { return d.value; }));
    var yMax, yMin;
    if (def.kind === "bar") { yMin = 0; yMax = niceMax(maxRaw); }
    else { // line: pad around min/max
      var span = maxRaw - minRaw || Math.max(1, maxRaw * 0.1);
      yMin = Math.max(0, minRaw - span * 0.4);
      yMax = maxRaw + span * 0.4;
      if (yMax === yMin) yMax = yMin + 1;
    }
    function xAt(i) { return padL + (days.length === 1 ? plotW / 2 : (i / (days.length - 1)) * plotW); }
    function yAt(v) { return padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH; }

    var svg = svgEl("svg", { class: "chart-svg", viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": def.title + " over the last " + days.length + " days" });

    // Gridlines + y labels (3 lines)
    for (var g = 0; g <= 2; g++) {
      var gv = yMin + (yMax - yMin) * (g / 2);
      var gy = yAt(gv);
      svg.appendChild(svgEl("line", { class: "grid-line", x1: padL, y1: gy, x2: W - padR, y2: gy }));
      var lbl = svgEl("text", { class: "axis-label", x: padL - 5, y: gy + 3, "text-anchor": "end" });
      lbl.textContent = def.type === "steps" ? Math.round(gv / 1000) + "k" : Math.round(gv * 10) / 10;
      svg.appendChild(lbl);
    }

    // X labels (thinned to avoid collisions)
    var everyX = days.length > 10 ? Math.ceil(days.length / 7) : 1;
    days.forEach(function (dk, i) {
      if (i % everyX !== 0 && i !== days.length - 1) return;
      var t = svgEl("text", { class: "axis-label", x: xAt(i), y: H - 6, "text-anchor": "middle" });
      t.textContent = days.length > 14 ? shortDate(dk).split(" ")[1] : shortDay(dk);
      svg.appendChild(t);
    });

    if (def.kind === "bar") {
      var slot = plotW / days.length;
      var bw = Math.max(4, Math.min(26, slot - 6));
      data.forEach(function (d, i) {
        if (d.value == null) return;
        var x = xAt(i) - bw / 2;
        var y = yAt(d.value);
        var h = padT + plotH - y;
        var rect = svgEl("rect", { class: "bar", x: x, y: y, width: bw, height: Math.max(2, h), rx: 4, fill: color });
        svg.appendChild(rect);
        attachHover(rect, d, def, dk_label(d.day));
      });
    } else {
      // line path over present points (skip gaps)
      var dParts = [];
      present.forEach(function (d, k) {
        var i = days.indexOf(d.day);
        dParts.push((k === 0 ? "M" : "L") + xAt(i) + " " + yAt(d.value));
      });
      svg.appendChild(svgEl("path", { d: dParts.join(" "), fill: "none", stroke: color, "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" }));
      data.forEach(function (d, i) {
        if (d.value == null) return;
        var dot = svgEl("circle", { class: "dot", cx: xAt(i), cy: yAt(d.value), r: 3.5, fill: color, stroke: isDark() ? "#16241d" : "#fff", "stroke-width": 1.5 });
        svg.appendChild(dot);
        attachHover(dot, d, def, dk_label(d.day));
      });
    }

    // Direct-label the most recent value
    var lastIdx = days.indexOf(present[present.length - 1].day);
    var lv = present[present.length - 1].value;
    var vlabel = svgEl("text", { class: "value-label", x: xAt(lastIdx), y: yAt(lv) - 8, "text-anchor": "middle" });
    vlabel.textContent = def.type === "steps" ? Number(lv).toLocaleString() : lv;
    svg.appendChild(vlabel);

    card.appendChild(svg);

    var cap = document.createElement("p");
    cap.className = "chart-caption";
    cap.textContent = present.length + " day" + (present.length === 1 ? "" : "s") + " logged · hover for details";
    card.appendChild(cap);
    return card;

    function dk_label(dk) { return shortDate(dk); }
  }

  function attachHover(mark, d, def, dateLabel) {
    function move(ev) {
      var val = def.type === "steps" ? Number(d.value).toLocaleString() : d.value;
      chartTip.textContent = dateLabel + " · " + val + " " + def.unit;
      chartTip.classList.add("show");
      var x = (ev.touches ? ev.touches[0].clientX : ev.clientX) + 12;
      var y = (ev.touches ? ev.touches[0].clientY : ev.clientY) - 34;
      chartTip.style.left = Math.min(x, window.innerWidth - 160) + "px";
      chartTip.style.top = y + "px";
    }
    mark.addEventListener("mouseenter", move);
    mark.addEventListener("mousemove", move);
    mark.addEventListener("mouseleave", function () { chartTip.classList.remove("show"); });
  }

  function renderTrends() {
    if (!trendsGrid) return;
    var days = lastNDays(rangeDays);
    var hasAny = journal.some(function (e) {
      return CHART_DEFS.some(function (c) { return c.type === e.type; });
    });
    if (trendsEmpty) trendsEmpty.hidden = hasAny;
    trendsGrid.innerHTML = "";
    if (!hasAny) return;
    CHART_DEFS.forEach(function (def) {
      trendsGrid.appendChild(buildChart(def, days));
    });
  }

  if (rangeToggle) {
    rangeToggle.addEventListener("click", function (e) {
      var btn = e.target.closest(".range-btn");
      if (!btn) return;
      rangeDays = parseInt(btn.dataset.days, 10);
      rangeToggle.querySelectorAll(".range-btn").forEach(function (b) {
        b.classList.toggle("active", b === btn);
      });
      renderTrends();
    });
  }

  // Sample data — realistic-ish 14 days so trends are previewable.
  function addSampleData() {
    var days = lastNDays(14);
    var weight = 74 + Math.random();
    days.forEach(function (dk, i) {
      var base = new Date(dk + "T09:00:00").getTime();
      weight -= 0.05 + Math.random() * 0.12; // gentle downward trend
      pushSample(base, "weight", "⚖️", "Weight: " + weight.toFixed(1) + " kg", Math.round(weight * 10) / 10, "kg");
      var glasses = 4 + Math.floor(Math.random() * 5);
      pushSample(base + 3600000, "water", "💧", "Drank water", glasses, "glass");
      var sleep = Math.round((6 + Math.random() * 2.5) * 10) / 10;
      pushSample(base - 3600000, "sleep", "😴", "Slept " + sleep + " h", sleep, "h");
      var steps = 3500 + Math.floor(Math.random() * 8000);
      pushSample(base + 7200000, "steps", "👟", steps.toLocaleString() + " steps", steps, "steps");
      if (i % 3 === 0) pushSample(base + 5400000, "workout", "🏋️", "Workout: a walk", 30, "min");
    });
    if (journal.length > 400) journal = journal.slice(-400);
    writeStore(J_KEY, journal);
    renderAll();
    renderTrends();
  }
  function pushSample(ts, type, emoji, text, value, unit) {
    journal.push({ id: uid(), ts: ts, type: type, emoji: emoji, text: text, value: value, unit: unit });
  }
  if (sampleBtn) sampleBtn.addEventListener("click", addSampleData);

  // Re-render charts when the journal changes or the theme flips.
  document.addEventListener("vh:journal-changed", renderTrends);
  if (themeToggle) themeToggle.addEventListener("click", function () { setTimeout(renderTrends, 0); });

  renderTrends();

  /* ===== Newsletter (client-side demo only) ===== */
  var nlForm = document.getElementById("newsletter-form");
  var nlMsg = document.getElementById("newsletter-msg");
  if (nlForm) {
    nlForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("email").value.trim();
      var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!valid) {
        nlMsg.textContent = "Please enter a valid email address.";
        return;
      }
      nlMsg.textContent = "Thanks for subscribing! Check your inbox soon. 🌿";
      nlForm.reset();
    });
  }
})();

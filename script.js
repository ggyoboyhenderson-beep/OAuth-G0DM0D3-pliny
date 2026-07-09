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
    document.dispatchEvent(new CustomEvent("vh:water-changed"));
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
    var calories = latest("calories");
    var hr = latest("hr");
    return { weight: weight, sleep: sleep, steps: steps, mood: mood, water: water, workouts: workouts, calories: calories, hr: hr };
  }

  function renderStats() {
    if (!journalStats) return;
    var s = snapshot();
    var tiles = [
      { emoji: "⚖️", label: "Weight", value: s.weight ? prefWeight(s.weight.value, s.weight.unit) + " <small>" + currentWUnit() + "</small>" : "—" },
      { emoji: "💧", label: "Water", value: s.water + " <small>glasses</small>" },
      { emoji: "😴", label: "Sleep", value: s.sleep ? s.sleep.value + " <small>h</small>" : "—" },
      { emoji: "👟", label: "Steps", value: s.steps ? Number(s.steps.value).toLocaleString() : "—" },
      { emoji: s.mood ? s.mood.emoji : "🙂", label: "Mood", value: s.mood ? '<small style="font-size:.8rem">' + s.mood.value + "</small>" : "—" },
      { emoji: "🏋️", label: "Workouts", value: String(s.workouts) },
      { emoji: "🔥", label: "Calories", value: s.calories ? Number(s.calories.value).toLocaleString() + " <small>kcal</small>" : "—" },
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

  function addEntry(type, emoji, text, value, unit, extra) {
    var entry = { id: uid(), ts: Date.now(), type: type, emoji: emoji, text: text, value: value, unit: unit };
    if (extra) for (var k in extra) entry[k] = extra[k];
    journal.push(entry);
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

  /* ---------- CSV export ---------- */
  function exportJournalCSV() {
    if (!journal.length) return false;
    var rows = [["date", "time", "type", "entry", "value", "unit"]];
    journal.forEach(function (e) {
      var d = new Date(e.ts);
      rows.push([
        d.toISOString().slice(0, 10), timeLabel(e.ts), e.type, e.text,
        e.value == null ? "" : e.value, e.unit || "",
      ]);
    });
    var csv = rows.map(function (r) {
      return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(",");
    }).join("\n");
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "vitality-health-journal.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
    return true;
  }
  var journalExport = document.getElementById("journal-export");
  if (journalExport) journalExport.addEventListener("click", function () {
    if (!exportJournalCSV()) showToast("📄", "Nothing to export", "Log something with Vita first.");
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
  // 1–5 score so moods can be charted over time.
  var MOOD_SCORE = {
    great: 5, amazing: 5, awesome: 5, happy: 4, good: 4, motivated: 4, energetic: 4,
    fine: 3, ok: 3, okay: 3, meh: 3,
    tired: 2, exhausted: 2, sleepy: 2, stressed: 2, anxious: 2, nervous: 2, angry: 2,
    sad: 1, down: 1, low: 1, bad: 1, sick: 1, ill: 1,
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

    // Informational questions about serious conditions ("what is a stroke")
    // get educational answers; first-person urgency still routes to crisis.
    var askPat = /\b(tell me about|what is|what's|learn about|info(?:rmation)? (?:on|about)|explain|help with)\b/;
    var urgentPat = /\b(i'?m|i am|my|me|right now|happening|having|help me)\b/;
    if (CRISIS.test(low)) {
      if (askPat.test(low) && !urgentPat.test(low)) {
        var infoTopic = findTopic(low);
        if (infoTopic) {
          return topicReply(infoTopic) +
            "\n\n🚨 If this is happening to you or someone near you right now, call your local emergency number immediately.";
        }
      }
      return "That sounds serious, and I'm only a wellness helper — not a medical service. " +
        "Please contact your local emergency number or a crisis line right away, or reach out to someone you trust. You deserve real support. 💚";
    }

    // Help (exact command only, so "help with <topic>" reaches the library)
    if (/^(help|commands|\?)[\s!.]*$/.test(low) || /what can you do/.test(low)) {
      return "I can log your health and remind you. Try:\n" +
        "• \"log weight 70kg\"\n• \"log water\" (or \"drank 2 glasses\")\n" +
        "• \"slept 7.5 hours\"\n• \"log 8000 steps\"\n• \"feeling great\"\n" +
        "• \"log workout 30 min run\"\n• \"log bench 80kg x 5\" (I'll estimate your 1RM)\n" +
        "• \"remind me to stretch in 30 minutes\"\n" +
        "• \"tell me about blood pressure\" (or any Health A–Z topic)\n" +
        "• \"my name is Sam\" / \"set step goal 10000\"\n" +
        "• \"summary\" for today · \"weekly recap\" for your week\n" +
        "• \"export my data\" for a CSV download.";
    }

    // Greetings / thanks
    if (/^(hi|hey|hello|yo|hiya|good (morning|afternoon|evening))\b/.test(low))
      return "Hi! 🌿 I'm Vita. Tell me how you're doing — e.g. \"log water\" or \"slept 8 hours\". Say \"help\" for ideas.";
    if (/\b(thanks|thank you|cheers|ty)\b/.test(low))
      return "Anytime! Keep up the great work. 💚";

    // Profile: name, goals, and "who am I"
    var nameMatch = /\b(?:my name is|call me|i am called|i'?m called)\s+([a-z][a-z'-]*)/i.exec(text);
    if (nameMatch) {
      var newName = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1);
      saveProfile({ name: newName });
      return "Nice to meet you, " + newName + "! 🌿 I'll remember that — everything here is stored only on your device. Fill in Your Profile for even better personalization.";
    }
    var goalMatch = /\bset (?:my )?(step|steps|sleep) goal (?:to )?(\d+(?:\.\d+)?)/i.exec(low);
    if (goalMatch) {
      var gKind = goalMatch[1].indexOf("step") === 0 ? "stepGoal" : "sleepGoal";
      var gVal = parseFloat(goalMatch[2]);
      var upd = {}; upd[gKind] = gVal;
      saveProfile(upd);
      return "Done — your " + (gKind === "stepGoal" ? "daily step goal is now " + gVal.toLocaleString() + " steps" : "sleep goal is now " + gVal + " hours") + ". I'll track your streaks against it. 🎯";
    }
    if (/\bwho am i\b|\bmy profile\b/.test(low)) {
      return profileSummary();
    }

    // Weekly recap — must run before the daily summary branch
    if (/\bweek(?:ly)?\b/.test(low) && /\b(recap|summary|review|report)\b/.test(low) || /\bhow was my week\b|\bmy week\b/.test(low)) {
      return weeklyRecap();
    }

    // Health A–Z lookups ("tell me about blood pressure") — only replies
    // when a known topic matches, so other commands fall through untouched.
    if (askPat.test(low)) {
      var topic = findTopic(low);
      if (topic) return topicReply(topic);
    }

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
      if (s.weight) parts.push("⚖️ Weight: " + prefWeight(s.weight.value, s.weight.unit) + " " + currentWUnit());
      if (s.sleep) parts.push("😴 Sleep: " + s.sleep.value + " h");
      if (s.steps) parts.push("👟 Steps: " + Number(s.steps.value).toLocaleString());
      if (s.mood) parts.push(s.mood.emoji + " Mood: " + s.mood.value);
      if (s.workouts) parts.push("🏋️ Workouts: " + s.workouts);
      if (s.calories) parts.push("🔥 Active: " + Number(s.calories.value).toLocaleString() + " kcal");
      if (s.hr) parts.push("❤️ Avg HR: " + s.hr.value + " bpm");
      var upcoming = reminders.filter(function (r) { return !r.fired; }).length;
      if (upcoming) parts.push("⏰ " + upcoming + " reminder" + (upcoming === 1 ? "" : "s") + " pending");
      return "Here's today so far:\n" + parts.join("\n") +
        (s.water < 8 ? "\n\nTip: " + (8 - s.water) + " more glass" + (8 - s.water === 1 ? "" : "es") + " to hit your water goal!" : "\n\nGreat hydration today! 💧");
    }

    // Backup (full JSON) and CSV export
    if (/\bbackup\b/.test(low)) {
      downloadBackup();
      return "Backup downloaded — one file with your journal, profile, reminders, and settings. Restore it from the Profile section on any device. 💾";
    }
    if (/\brestore\b/.test(low)) {
      return "To restore, go to Your Profile → Backup & restore → \"Restore from file\" and pick your backup. It replaces this device's data. 💾";
    }
    if (/\bexport\b|\bdownload\b.*\b(data|journal|csv)\b/.test(low)) {
      if (!journal.length) return "Nothing to export yet — log a few things first!";
      exportJournalCSV();
      return "Done — your journal is downloading as a CSV file. 📄 (Say \"backup\" for a full restorable backup.)";
    }

    // Lifts (e.g. "log bench 80kg x 5") — must run before the weight branch
    var liftMatch = /\b(bench|squat|deadlift|overhead press|ohp|shoulder press|barbell row|row|curl|hip thrust|lat pulldown|leg press)\b[^0-9]*(\d+(?:\.\d+)?)\s*(kg|lb|lbs)?\s*(?:x|×|for)\s*(\d+)/i.exec(low);
    if (liftMatch) {
      var lname = liftMatch[1], lw = parseFloat(liftMatch[2]);
      var lunit = liftMatch[3] ? liftMatch[3].replace("lbs", "lb") : "kg";
      var lreps = Math.max(1, Math.min(20, parseInt(liftMatch[4], 10)));
      var e1 = lreps === 1 ? lw : lw * (1 + lreps / 30); // Epley
      e1 = Math.round(e1 * 10) / 10;
      addEntry("lift", "💪", capitalize(lname) + " " + lw + " " + lunit + " × " + lreps + " (e1RM " + e1 + ")", e1, lunit, { weight: lw, reps: lreps, lift: lname });
      return "Logged " + lname + " " + lw + " " + lunit + " × " + lreps + ". Estimated 1RM ≈ " + e1 + " " + lunit + ". 💪 Add a little weight when every rep feels solid.";
    }

    // At-home workout suggestions
    if (/\b(home workout|at home|no equipment|living room|apartment)\b/.test(low) && /\bworkout|exercise|train|sweat|routine|cardio|stretch\b/.test(low)) {
      var picks = HOME_WORKOUTS.slice(0, 4).map(function (r) { return "• " + r.emoji + " " + r.name + " (" + r.mins + " min)"; }).join("\n");
      return "🏠 I've got " + HOME_WORKOUTS.length + " no-equipment routines with a guided timer:\n" + picks +
        "\n…and more in the At-home workouts section — tap ▶ Start and I'll pace you through it. It logs itself when you finish!";
    }

    // Questions & how-tos run BEFORE the loose loggers, so "how much water
    // should I drink?" is answered instead of logging a glass. Keys are
    // specific phrases, so real log commands ("log water") won't match.
    if (/\bhow\b|\bform\b|\btechnique\b|\bdo a\b|\bdo the\b|\bproper\b|\bdemo\b/.test(low)) {
      var exH = typeof findExercise === "function" && findExercise(low);
      if (exH) return exerciseReply(exH);
    }
    var fqA = typeof findFaq === "function" && findFaq(low);
    if (fqA) return fqA.a + "\n(You'll find this and more in the Q&A section.)";

    // Weight
    if (/\bweigh|\bweight\b/.test(low)) {
      var w = num(low);
      if (w == null) return "How much? Try \"log weight 70kg\" or \"log weight 150 lb\".";
      var unit = /\b(lb|lbs|pound)/.test(low) ? "lb"
        : /\b(kg|kilo)/.test(low) ? "kg"
        : currentWUnit();
      addEntry("weight", "⚖️", "Weight: " + w + " " + unit, w, unit);
      updateProfileWeight(unit === "lb" ? w * 0.453592 : w); // keep the profile current
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
      addEntry("mood", MOOD_EMOJI[mword], "Feeling " + mword, mword, "", { score: MOOD_SCORE[mword] || 3 });
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

    return "I didn't quite catch that. I can log your health, set reminders, explain Health A–Z topics, answer FAQs, or coach exercises. Say \"help\" for examples. 🌿";
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

  var CHIPS = ["Log water", "Summary", "Weekly recap", "Log bench 60kg x 5", "Remind me to stretch in 30 minutes", "Help"];
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
    if (input) input.value = "";
    var reply = handle(text);
    showTyping();
    setTimeout(function () {
      hideTyping();
      botSay(reply);
      speak(reply);
    }, 480);
  }

  function openAssistant() {
    if (!panel) return;
    panel.hidden = false;
    assistantOpen = true;
    hideGreetingBubble();
    if (launch) launch.setAttribute("aria-expanded", "true");
    if (!logEl.childElementCount && chat.length) {
      chat.forEach(function (m) { renderMsg(m.text, m.who); });
    }
    // JARVIS-style: deliver a fresh, context-aware briefing on open.
    proactiveGreet();
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
  function seriesFor(type, days, agg, extract) {
    var byDay = {};
    journal.forEach(function (e) {
      if (e.type !== type) return;
      var val = extract ? extract(e) : (e.value != null ? e.value : 1);
      if (val == null) return;
      var dk = new Date(e.ts).toISOString().slice(0, 10);
      if (!byDay[dk]) byDay[dk] = [];
      byDay[dk].push(val);
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
    {
      type: "weight", title: "Weight", emoji: "⚖️", unit: "kg", kind: "line", agg: "last",
      series: "#2a78d6", seriesDark: "#3987e5", fmt: function (v) { return v; },
      extract: function (e) { return e.value == null ? null : prefWeight(e.value, e.unit); },
    },
    { type: "water", title: "Water", emoji: "💧", unit: "glasses", kind: "bar", agg: "sum", series: "#199e70", seriesDark: "#199e70", fmt: function (v) { return v; } },
    { type: "sleep", title: "Sleep", emoji: "😴", unit: "hours", kind: "bar", agg: "last", series: "#4a3aa7", seriesDark: "#9085e9", fmt: function (v) { return v; } },
    { type: "steps", title: "Steps", emoji: "👟", unit: "steps", kind: "bar", agg: "last", series: "#eb6834", seriesDark: "#d95926", fmt: function (v) { return Number(v).toLocaleString(); } },
    { type: "calories", title: "Active calories", emoji: "🔥", unit: "kcal", kind: "bar", agg: "last", series: "#eda100", seriesDark: "#c98500", fmt: function (v) { return Math.round(v).toLocaleString(); } },
    {
      type: "workout", title: "Workout minutes", emoji: "🏋️", unit: "min", kind: "bar", agg: "sum",
      series: "#008300", seriesDark: "#008300",
      extract: function (e) { return e.value > 0 ? e.value : null; },
      fmt: function (v) { return Math.round(v); },
    },
    {
      type: "mood", title: "Mood", emoji: "🙂", unit: "", kind: "line", agg: "last",
      domain: [1, 5], noDelta: true, series: "#e87ba4", seriesDark: "#d55181",
      extract: function (e) { return e.score != null ? e.score : null; },
      fmt: function (v) { return ({ 1: "low", 2: "meh", 3: "ok", 4: "good", 5: "great" })[Math.round(v)] || v; },
      tickFmt: function (v) { return ({ 1: "low", 3: "ok", 5: "great" })[Math.round(v)] || ""; },
    },
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
    var data = seriesFor(def.type, days, def.agg, def.extract);
    var present = data.filter(function (d) { return d.value != null; });
    var color = isDark() ? def.seriesDark : def.series;

    var card = document.createElement("article");
    card.className = "card chart-card";

    var latest = present.length ? present[present.length - 1].value : null;
    var prev = present.length > 1 ? present[present.length - 2].value : null;
    var deltaHtml = "";
    if (!def.noDelta && latest != null && prev != null && prev !== 0) {
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
    if (def.domain) { yMin = def.domain[0]; yMax = def.domain[1]; }
    else if (def.kind === "bar") { yMin = 0; yMax = niceMax(maxRaw); }
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
      lbl.textContent = def.tickFmt ? def.tickFmt(gv)
        : def.type === "steps" ? Math.round(gv / 1000) + "k"
        : Math.round(gv * 10) / 10;
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
    vlabel.textContent = def.fmt(lv);
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
      chartTip.textContent = dateLabel + " · " + def.fmt(d.value) + (def.unit ? " " + def.unit : "");
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
      var score = 2 + Math.floor(Math.random() * 4);
      var mword = ({ 2: "tired", 3: "ok", 4: "good", 5: "great" })[score];
      pushSample(base + 1800000, "mood", MOOD_EMOJI[mword], "Feeling " + mword, mword, "", { score: score });
      if (i % 3 === 0) pushSample(base + 5400000, "workout", "🏋️", "Workout: a walk", 30, "min");
    });
    if (journal.length > 400) journal = journal.slice(-400);
    writeStore(J_KEY, journal);
    renderAll();
    renderTrends();
  }
  function pushSample(ts, type, emoji, text, value, unit, extra) {
    var entry = { id: uid(), ts: ts, type: type, emoji: emoji, text: text, value: value, unit: unit };
    if (extra) for (var k in extra) entry[k] = extra[k];
    journal.push(entry);
  }
  if (sampleBtn) sampleBtn.addEventListener("click", addSampleData);

  // Re-render charts when the journal changes or the theme flips.
  document.addEventListener("vh:journal-changed", renderTrends);
  if (themeToggle) themeToggle.addEventListener("click", function () { setTimeout(renderTrends, 0); });

  renderTrends();

  /* ===== Persona / level personalization ===== */
  var PERSONA_KEY = "vh-level";
  var currentPersona = null;
  var personaGrid = document.getElementById("persona-grid");
  var personaNote = document.getElementById("persona-note");
  var PERSONAS = {
    starter: {
      title: "Just starting",
      note: "Welcome! We'll keep things gentle and simple — start with the beginner moves and let Vita cheer you on. 🌱",
      wkLevel: "beginner", wkGoal: "general", role: "Your gentle guide",
    },
    fit: {
      title: "Keeping fit",
      note: "Nice — let's keep you consistent. Your planner is set for balanced, moderate training. 🚶",
      wkLevel: "intermediate", wkGoal: "general", role: "Your fitness partner",
    },
    athlete: {
      title: "Athlete / bodybuilder",
      note: "Let's build. Your planner is set to advanced strength — use the Fuel calculator to dial in protein and macros. 🏆",
      wkLevel: "advanced", wkGoal: "strength", role: "Your training coach",
    },
  };
  function setPersona(level, opts) {
    if (!PERSONAS[level]) return;
    currentPersona = level;
    document.documentElement.setAttribute("data-level", level);
    try { localStorage.setItem(PERSONA_KEY, level); } catch (e) {}
    if (personaGrid) {
      personaGrid.querySelectorAll(".persona-card").forEach(function (c) {
        c.setAttribute("aria-pressed", String(c.dataset.level === level));
      });
    }
    if (personaNote) personaNote.textContent = PERSONAS[level].note;
    var wl = document.getElementById("wk-level"), wg = document.getElementById("wk-goal");
    if (wl) wl.value = PERSONAS[level].wkLevel;
    if (wg) wg.value = PERSONAS[level].wkGoal;
    var roleEl = document.getElementById("assistant-role");
    if (roleEl) roleEl.textContent = PERSONAS[level].role;
    maybeAutoView(level);
    if (opts && opts.announce && assistantOpen) {
      var line = "Got it — I'll coach you as \"" + PERSONAS[level].title + "\". " + PERSONAS[level].note;
      botSay(line); speak(line);
    }
  }
  if (personaGrid) {
    personaGrid.addEventListener("click", function (e) {
      var card = e.target.closest(".persona-card");
      if (card) setPersona(card.dataset.level, { announce: true });
    });
    var savedLevel = null;
    try { savedLevel = localStorage.getItem(PERSONA_KEY); } catch (e) {}
    if (savedLevel && PERSONAS[savedLevel]) setPersona(savedLevel);
  }

  /* ===== Fuel / macro calculator ===== */
  var macroForm = document.getElementById("macro-form");
  if (macroForm) {
    var macroUnit = "metric";
    var mHeightLabel = document.getElementById("m-height-label");
    var mWeightLabel = document.getElementById("m-weight-label");
    var mHeight = document.getElementById("m-height");
    var mWeight = document.getElementById("m-weight");
    var munitBtns = Array.prototype.slice.call(document.querySelectorAll(".munit-btn"));
    munitBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        macroUnit = b.dataset.unit;
        munitBtns.forEach(function (x) { x.classList.toggle("active", x === b); });
        if (macroUnit === "metric") {
          mHeightLabel.textContent = "Height (cm)"; mWeightLabel.textContent = "Weight (kg)";
          mHeight.placeholder = "175"; mWeight.placeholder = "75";
        } else {
          mHeightLabel.textContent = "Height (in)"; mWeightLabel.textContent = "Weight (lb)";
          mHeight.placeholder = "69"; mWeight.placeholder = "165";
        }
        mHeight.value = ""; mWeight.value = "";
      });
    });
    macroForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var age = parseFloat(document.getElementById("m-age").value);
      var sex = document.getElementById("m-sex").value;
      var h = parseFloat(mHeight.value);
      var w = parseFloat(mWeight.value);
      var activity = parseFloat(document.getElementById("m-activity").value);
      var goal = document.getElementById("m-goal").value;
      var box = document.getElementById("macro-result");
      var calEl = document.getElementById("m-calories");
      var pEl = document.getElementById("m-protein"), cEl = document.getElementById("m-carbs"), fEl = document.getElementById("m-fat");
      var noteEl = document.getElementById("m-note");
      box.hidden = false;
      if (!(age > 0) || !(h > 0) || !(w > 0)) {
        calEl.textContent = "–"; pEl.textContent = cEl.textContent = fEl.textContent = "–";
        noteEl.textContent = "Please enter your age, height, and weight.";
        return;
      }
      var kg = macroUnit === "metric" ? w : w * 0.453592;
      var cm = macroUnit === "metric" ? h : h * 2.54;
      var bmr = 10 * kg + 6.25 * cm - 5 * age + (sex === "male" ? 5 : -161);
      var tdee = bmr * activity;
      var cal = goal === "cut" ? tdee - 400 : goal === "bulk" ? tdee + 350 : tdee;
      cal = Math.max(1200, Math.round(cal / 10) * 10);
      var proteinPerKg = goal === "cut" ? 2.2 : goal === "bulk" ? 2.0 : 1.8;
      var protein = Math.round(proteinPerKg * kg);
      var fat = Math.round((cal * 0.25) / 9);
      var carbs = Math.max(0, Math.round((cal - protein * 4 - fat * 9) / 4));
      calEl.textContent = cal.toLocaleString();
      pEl.textContent = protein + "g"; cEl.textContent = carbs + "g"; fEl.textContent = fat + "g";
      noteEl.textContent = (goal === "cut" ? "A ~400 kcal deficit for steady fat loss while protein protects muscle. "
        : goal === "bulk" ? "A modest surplus to build muscle with minimal fat gain — train hard! "
        : "Balanced to maintain your current weight. ") + "Estimates only — adjust to how your body responds.";
    });
  }

  /* =====================================================================
     Vita — JARVIS-style layer: voice, proactive greeting, voice input
     ===================================================================== */
  var VOICE_KEY = "vh-voice";
  var voiceOn = false;
  try { voiceOn = localStorage.getItem(VOICE_KEY) === "on"; } catch (e) {}
  var voiceBtn = document.getElementById("assistant-voice");
  var micBtn = document.getElementById("assistant-mic");
  var greetingBubble = document.getElementById("assistant-greeting");
  var greetingText = document.getElementById("greeting-text");
  var greetingCloseBtn = document.getElementById("greeting-close");
  var ttsSupported = "speechSynthesis" in window;
  var pickedVoice = null;
  var lastGreetAt = 0;

  function chooseVoice() {
    if (!ttsSupported) return;
    var voices = window.speechSynthesis.getVoices();
    if (!voices.length) return;
    pickedVoice = voices.filter(function (v) { return /en-GB/i.test(v.lang); })[0]
      || voices.filter(function (v) { return /^en/i.test(v.lang); })[0]
      || voices[0];
  }
  if (ttsSupported) {
    chooseVoice();
    window.speechSynthesis.onvoiceschanged = chooseVoice;
  }
  function speak(text) {
    if (!voiceOn || !ttsSupported || !text) return;
    try {
      window.speechSynthesis.cancel();
      var clean = text.replace(/[\u{1F000}-\u{1FFFF}←-➿⬀-⯿•]/gu, "").replace(/\s+/g, " ").trim();
      if (!clean) return;
      var u = new SpeechSynthesisUtterance(clean);
      if (pickedVoice) u.voice = pickedVoice;
      u.rate = 1; u.pitch = 1;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }
  function updateVoiceBtn() {
    if (!voiceBtn) return;
    voiceBtn.textContent = voiceOn ? "🔊" : "🔈";
    voiceBtn.setAttribute("aria-pressed", String(voiceOn));
    voiceBtn.setAttribute("aria-label", voiceOn ? "Turn Vita's voice off" : "Turn Vita's voice on");
  }
  if (voiceBtn) {
    if (!ttsSupported) voiceBtn.hidden = true;
    updateVoiceBtn();
    voiceBtn.addEventListener("click", function () {
      voiceOn = !voiceOn;
      try { localStorage.setItem(VOICE_KEY, voiceOn ? "on" : "off"); } catch (e) {}
      updateVoiceBtn();
      if (voiceOn) speak("Voice enabled. I'm here whenever you need me.");
      else if (ttsSupported) window.speechSynthesis.cancel();
    });
  }

  // Typing indicator
  var typingEl = null;
  function showTyping() {
    if (!logEl || typingEl) return;
    typingEl = document.createElement("div");
    typingEl.className = "msg bot typing";
    typingEl.innerHTML = "<span></span><span></span><span></span>";
    logEl.appendChild(typingEl);
    logEl.scrollTop = logEl.scrollHeight;
  }
  function hideTyping() { if (typingEl) { typingEl.remove(); typingEl = null; } }

  // Proactive, context-aware greeting (JARVIS-style briefing)
  function vitaGreeting() {
    var hr = new Date().getHours();
    var partOfDay = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
    var s = snapshot();
    var pname = profileName();
    var lines = [partOfDay + (pname ? ", " + pname : "") + ". Vita online and at your service. 🌿"];
    var insights = [];
    if (new Date().getDay() === 1) insights.push("It's Monday — say \"weekly recap\" for your week in review.");
    if (s.water < 8) insights.push("You're at " + s.water + "/8 glasses of water — say \"log water\" and I'll track it.");
    if (!s.sleep) insights.push("You haven't logged sleep yet — how did you rest?");
    if (!s.steps) insights.push("No steps logged today — even a short walk counts.");
    var pending = reminders.filter(function (r) { return !r.fired; }).length;
    if (pending) insights.push("You have " + pending + " reminder" + (pending === 1 ? "" : "s") + " pending.");
    if (currentPersona === "athlete") insights.push("Training day? Open the Fuel calculator to hit your protein target.");
    if (currentPersona === "starter") insights.push("One small habit today is a win — what shall we log first?");
    lines.push(insights.length ? insights[Math.floor(Math.random() * insights.length)] : "You're on track today. What can I help you log?");
    return lines.join(" ");
  }
  function proactiveGreet() {
    var now = Date.now();
    if (now - lastGreetAt < 60000) return; // throttle rapid re-opens
    lastGreetAt = now;
    var g = vitaGreeting();
    botSay(g);
    speak(g);
  }

  // Greeting bubble shown when the panel is closed
  function showGreetingBubble() {
    if (!greetingBubble || assistantOpen) return;
    var hr = new Date().getHours();
    var part = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
    greetingText.textContent = part + " — I'm Vita. Tap to log your health or set a reminder.";
    greetingBubble.hidden = false;
  }
  function hideGreetingBubble() { if (greetingBubble) greetingBubble.hidden = true; }
  if (greetingCloseBtn) greetingCloseBtn.addEventListener("click", function (e) {
    e.stopPropagation(); hideGreetingBubble();
  });
  if (greetingBubble) greetingBubble.addEventListener("click", openAssistant);

  // Voice input (Web Speech API) — feature-detected; button stays hidden if unsupported
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR && micBtn) {
    micBtn.hidden = false;
    var recog = new SR();
    recog.lang = "en-US"; recog.interimResults = false; recog.maxAlternatives = 1;
    var listening = false;
    micBtn.addEventListener("click", function () {
      if (listening) { try { recog.stop(); } catch (e) {} return; }
      try { recog.start(); } catch (e) {}
    });
    recog.onstart = function () { listening = true; micBtn.classList.add("listening"); };
    recog.onend = function () { listening = false; micBtn.classList.remove("listening"); };
    recog.onerror = function () { listening = false; micBtn.classList.remove("listening"); };
    recog.onresult = function (ev) {
      var t = ev.results[0][0].transcript;
      submitMessage(t);
    };
  }

  // Auto-open once per tab session on larger screens; on phones the panel
  // would cover the whole page, so just nudge with the greeting bubble.
  var openedThisSession = false;
  try { openedThisSession = sessionStorage.getItem("vh-opened") === "1"; } catch (e) {}
  var smallScreen = window.matchMedia("(max-width: 640px)").matches;
  setTimeout(function () {
    if (!panel) return;
    if (!openedThisSession && !smallScreen) {
      try { sessionStorage.setItem("vh-opened", "1"); } catch (e) {}
      openAssistant();
    } else {
      showGreetingBubble();
    }
  }, 800);

  /* ===== One-rep max estimator ===== */
  var rmForm = document.getElementById("rm-form");
  if (rmForm) {
    rmForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var w = parseFloat(document.getElementById("rm-weight").value);
      var reps = parseInt(document.getElementById("rm-reps").value, 10);
      var unit = document.getElementById("rm-unit").value;
      var box = document.getElementById("rm-result");
      var maxEl = document.getElementById("rm-max");
      var pctEl = document.getElementById("rm-percents");
      box.hidden = false;
      if (!(w > 0) || !(reps >= 1)) {
        maxEl.textContent = "–";
        pctEl.innerHTML = "";
        return;
      }
      reps = Math.min(12, reps);
      var e1 = reps === 1 ? w : w * (1 + reps / 30); // Epley
      e1 = Math.round(e1 * 10) / 10;
      maxEl.textContent = e1 + " " + unit;
      var scheme = [
        { p: 95, r: 2 }, { p: 90, r: 4 }, { p: 85, r: 6 },
        { p: 80, r: 8 }, { p: 75, r: 10 }, { p: 70, r: 12 },
      ];
      pctEl.innerHTML = scheme.map(function (s) {
        var lw = Math.round((e1 * s.p) / 100 * 2) / 2; // nearest 0.5
        return '<div class="rm-p"><span>' + lw + " " + unit + "</span><small>" + s.p + "% × " + s.r + "</small></div>";
      }).join("");
    });
  }

  /* =====================================================================
     Simple / Full view — progressive disclosure so the page never
     overwhelms; power tools are one tap away in Full view.
     ===================================================================== */
  var VIEW_KEY = "vh-view";
  var VIEW_EXPLICIT_KEY = "vh-view-explicit";
  var viewToggle = document.getElementById("view-toggle");

  function currentView() {
    return document.documentElement.getAttribute("data-view") || "simple";
  }
  function setView(v, explicit) {
    document.documentElement.setAttribute("data-view", v);
    try {
      localStorage.setItem(VIEW_KEY, v);
      if (explicit) localStorage.setItem(VIEW_EXPLICIT_KEY, "1");
    } catch (e) {}
    if (viewToggle) viewToggle.textContent = v === "simple" ? "Full view" : "Simple view";
  }
  // Persona picks a sensible default view unless the user chose one themselves.
  function maybeAutoView(level) {
    var explicit = false;
    try { explicit = localStorage.getItem(VIEW_EXPLICIT_KEY) === "1"; } catch (e) {}
    if (explicit) return;
    setView(level === "starter" ? "simple" : "full", false);
  }
  setView(currentView(), false); // sync toggle label with pre-paint state
  if (viewToggle) viewToggle.addEventListener("click", function () {
    setView(currentView() === "simple" ? "full" : "simple", true);
  });
  var teaserBtn = document.getElementById("teaser-full");
  if (teaserBtn) teaserBtn.addEventListener("click", function () {
    setView("full", true);
    var wk = document.getElementById("workout");
    if (wk) wk.scrollIntoView({ behavior: "smooth" });
  });
  var beginnerMore = document.getElementById("beginner-more");
  if (beginnerMore) beginnerMore.addEventListener("click", function () {
    if (currentView() === "simple") setView("full", true); // unhide before the anchor jump
  });

  /* ===== Weight units (kg ⇄ lb) ===== */
  var WUNIT_KEY = "vh-wunit";
  var wunitPref = "kg";
  try { wunitPref = localStorage.getItem(WUNIT_KEY) || "kg"; } catch (e) {}
  var wunitBtn = document.getElementById("wunit-toggle");

  function currentWUnit() { return wunitPref || "kg"; }
  function prefWeight(v, u) {
    var kg = (u === "lb") ? v * 0.453592 : v;
    var out = currentWUnit() === "lb" ? kg / 0.453592 : kg;
    return Math.round(out * 10) / 10;
  }
  function applyWUnit(interactive) {
    if (wunitBtn) wunitBtn.textContent = wunitPref;
    CHART_DEFS.forEach(function (d) { if (d.type === "weight") d.unit = wunitPref; });
    // Point the calculators at matching defaults.
    var wantImperial = wunitPref === "lb";
    var bmiBtn = document.querySelector('.unit-btn[data-unit="' + (wantImperial ? "imperial" : "metric") + '"]');
    if (bmiBtn && !bmiBtn.classList.contains("active")) bmiBtn.click();
    var mBtn = document.querySelector('.munit-btn[data-unit="' + (wantImperial ? "imperial" : "metric") + '"]');
    if (mBtn && !mBtn.classList.contains("active")) mBtn.click();
    var rmSel = document.getElementById("rm-unit");
    if (rmSel) rmSel.value = wantImperial ? "lb" : "kg";
    renderStats();
    renderTrends();
    if (interactive && assistantOpen) {
      botSay("Switched to " + (wantImperial ? "pounds" : "kilograms") + " — your weights now show in " + wunitPref + ". ⚖️");
    }
  }
  if (wunitBtn) wunitBtn.addEventListener("click", function () {
    wunitPref = wunitPref === "kg" ? "lb" : "kg";
    try { localStorage.setItem(WUNIT_KEY, wunitPref); } catch (e) {}
    applyWUnit(true);
  });
  applyWUnit(false);

  /* =====================================================================
     Health A–Z — curated guidance from renowned health organizations,
     each topic linking to its authoritative source. Also powers Vita's
     "tell me about ..." answers.
     ===================================================================== */
  var TOPIC_CATS = {
    heart: "Heart & blood", mind: "Mind", sleep: "Sleep",
    bones: "Bones & muscles", breath: "Breathing & allergy", gut: "Digestion & metabolism",
    skin: "Skin & sun", sense: "Eyes, ears & teeth",
    women: "Women's health", men: "Men's health", prev: "Prevention & habits",
  };
  var TOPICS = [
    { emoji: "🫀", name: "High blood pressure", cat: "heart", keys: ["blood pressure", "hypertension"],
      blurb: "Usually has no symptoms — that's why it's called the silent killer.",
      tips: ["Get it checked regularly, even if you feel fine", "Cut back on salt and processed foods", "Daily movement and a healthy weight lower it"],
      src: { label: "WHO", url: "https://www.who.int/news-room/fact-sheets/detail/hypertension" } },
    { emoji: "❤️", name: "Heart health", cat: "heart", keys: ["heart health", "heart disease", "cardio"],
      blurb: "Most heart disease is preventable with everyday habits.",
      tips: ["Know your numbers: blood pressure, cholesterol, blood sugar", "Aim for 150 minutes of activity a week", "Don't smoke — quitting helps at any age"],
      src: { label: "American Heart Association", url: "https://www.heart.org" } },
    { emoji: "🩸", name: "High cholesterol", cat: "heart", keys: ["cholesterol"],
      blurb: "No symptoms — only a blood test can tell you where you stand.",
      tips: ["Get tested and know your levels", "Eat more fiber: oats, beans, fruit and veg", "Regular exercise raises the good (HDL) kind"],
      src: { label: "CDC", url: "https://www.cdc.gov/cholesterol/" } },
    { emoji: "🍬", name: "Type 2 diabetes", cat: "gut", keys: ["diabetes", "blood sugar", "glucose"],
      blurb: "Largely preventable and manageable with lifestyle changes.",
      tips: ["Regular activity and a healthy weight cut your risk sharply", "Choose whole grains over refined carbs", "Know your risk — a simple test can catch it early"],
      src: { label: "WHO", url: "https://www.who.int/news-room/fact-sheets/detail/diabetes" } },
    { emoji: "⚖️", name: "Weight management", cat: "gut", keys: ["obesity", "overweight", "lose weight", "weight management"],
      blurb: "Sustainable beats drastic — small changes you can keep win.",
      tips: ["Build meals around protein, fiber and vegetables", "Strength training preserves muscle while losing fat", "Sleep and stress strongly affect appetite"],
      src: { label: "WHO", url: "https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight" } },
    { emoji: "🔥", name: "Heartburn & reflux", cat: "gut", keys: ["heartburn", "reflux", "gerd", "acid"],
      blurb: "Common and very manageable with a few habit changes.",
      tips: ["Eat smaller meals, and not close to bedtime", "Raise the head of your bed if nights are bad", "Notice your triggers — often coffee, alcohol, fried food"],
      src: { label: "NIH (NIDDK)", url: "https://www.niddk.nih.gov/health-information/digestive-diseases/acid-reflux-ger-gerd-adults" } },
    { emoji: "😰", name: "Anxiety", cat: "mind", keys: ["anxiety", "panic", "worry"],
      blurb: "One of the most common — and most treatable — mental health conditions.",
      tips: ["Slow breathing calms your nervous system fast", "Limit caffeine and prioritise sleep", "Talking therapies work — reaching out is strength"],
      src: { label: "NIH (NIMH)", url: "https://www.nimh.nih.gov/health/topics/anxiety-disorders" } },
    { emoji: "💙", name: "Depression", cat: "mind", keys: ["depression", "depressed", "low mood"],
      blurb: "A real illness, not a weakness — and it responds to treatment.",
      tips: ["Movement and daylight genuinely help mood", "Stay connected — isolation feeds it", "Talk to a professional; you don't have to carry it alone"],
      src: { label: "WHO", url: "https://www.who.int/news-room/fact-sheets/detail/depression" } },
    { emoji: "🧠", name: "Stress", cat: "mind", keys: ["stress", "burnout", "overwhelmed"],
      blurb: "Short bursts are normal; chronic stress wears the whole body down.",
      tips: ["Take micro-breaks — even 2 minutes of breathing counts", "Protect sleep; stress and sleep loss feed each other", "Connection with people is a powerful buffer"],
      src: { label: "American Psychological Association", url: "https://www.apa.org/topics/stress" } },
    { emoji: "⚡", name: "Migraine", cat: "mind", keys: ["migraine", "headache"],
      blurb: "More than a headache — a neurological condition with real treatments.",
      tips: ["Keep a diary to spot your triggers", "Regular sleep, meals and hydration prevent attacks", "See a doctor — modern treatments help most people"],
      src: { label: "WHO", url: "https://www.who.int/news-room/fact-sheets/detail/headache-disorders" } },
    { emoji: "🌙", name: "Insomnia", cat: "sleep", keys: ["insomnia", "can't sleep", "trouble sleeping"],
      blurb: "The fix is usually habits, not willpower.",
      tips: ["Wake at the same time every day — even weekends", "Keep the room cool, dark and quiet", "No screens in the last hour; wind down instead"],
      src: { label: "Sleep Foundation", url: "https://www.sleepfoundation.org/insomnia" } },
    { emoji: "😴", name: "Snoring & sleep apnea", cat: "sleep", keys: ["snoring", "apnea", "apnoea"],
      blurb: "Loud snoring plus daytime sleepiness is worth getting checked.",
      tips: ["Side-sleeping often reduces snoring", "Weight loss can improve it significantly", "Untreated apnea strains the heart — ask about a sleep study"],
      src: { label: "Sleep Foundation", url: "https://www.sleepfoundation.org/sleep-apnea" } },
    { emoji: "🦴", name: "Lower back pain", cat: "bones", keys: ["back pain", "backache", "lower back"],
      blurb: "Most back pain improves within weeks — movement helps, rest doesn't.",
      tips: ["Keep gently moving; bed rest slows recovery", "Strengthen your core to protect your spine", "Numbness, weakness or fever with it → see a doctor"],
      src: { label: "NIH (NINDS)", url: "https://www.ninds.nih.gov/health-information/disorders/back-pain" } },
    { emoji: "🦵", name: "Osteoarthritis", cat: "bones", keys: ["arthritis", "joint pain", "osteoarthritis"],
      blurb: "\"Motion is lotion\" — active joints hurt less than idle ones.",
      tips: ["Strengthen the muscles around the joint", "Joint-friendly cardio: swimming, cycling, walking", "Every kilo lost takes several off your knees"],
      src: { label: "CDC", url: "https://www.cdc.gov/arthritis/" } },
    { emoji: "🤧", name: "Seasonal allergies", cat: "breath", keys: ["allergy", "allergies", "hay fever", "pollen"],
      blurb: "You can't avoid pollen entirely, but you can outsmart it.",
      tips: ["Check pollen counts and plan outdoor time", "Shower and change clothes after being outside", "Keep windows closed on high-pollen days"],
      src: { label: "AAFA", url: "https://aafa.org" } },
    { emoji: "🌬️", name: "Asthma", cat: "breath", keys: ["asthma", "wheez", "inhaler"],
      blurb: "Well-controlled asthma shouldn't limit your life.",
      tips: ["Take controller medication as prescribed, even when fine", "Know your triggers: smoke, cold air, dust, exercise", "Have a written action plan for flare-ups"],
      src: { label: "WHO", url: "https://www.who.int/news-room/fact-sheets/detail/asthma" } },
    { emoji: "🤒", name: "Colds & flu", cat: "breath", keys: ["cold", "flu", "influenza", "sick"],
      blurb: "Mostly prevention: hands, vaccines, and rest when it hits.",
      tips: ["Wash hands often — it's still the best defense", "An annual flu vaccine protects you and others", "Rest and fluids; see a doctor if symptoms are severe"],
      src: { label: "CDC", url: "https://www.cdc.gov/flu/" } },
    { emoji: "🚨", name: "Stroke", cat: "heart", keys: ["stroke", "fast signs"],
      blurb: "Every minute counts — knowing the signs saves brains.",
      tips: ["Think F.A.S.T.: Face drooping, Arm weakness, Speech trouble → Time to call emergency services", "Blood pressure control is the #1 prevention", "Most risk factors are the same as heart disease"],
      src: { label: "CDC", url: "https://www.cdc.gov/stroke/" } },
    { emoji: "🔴", name: "Anemia", cat: "heart", keys: ["anemia", "anaemia", "iron", "low iron"],
      blurb: "Constant tiredness and pale skin can mean low iron — a blood test tells.",
      tips: ["Iron-rich foods: beans, lentils, red meat, fortified cereals", "Vitamin C helps your body absorb iron", "Don't self-diagnose fatigue — get tested first"],
      src: { label: "NIH (NHLBI)", url: "https://www.nhlbi.nih.gov/health/anemia" } },
    { emoji: "🌀", name: "Irritable bowel (IBS)", cat: "gut", keys: ["ibs", "irritable bowel"],
      blurb: "Very common, very manageable — and strongly linked to stress.",
      tips: ["Keep a food diary to find your triggers", "Soluble fiber (oats) usually helps; harsh bran can worsen", "Stress management often helps as much as diet"],
      src: { label: "NIH (NIDDK)", url: "https://www.niddk.nih.gov/health-information/digestive-diseases/irritable-bowel-syndrome" } },
    { emoji: "🥦", name: "Constipation", cat: "gut", keys: ["constipation", "constipated"],
      blurb: "Usually fixed by the big three: fiber, fluids, and movement.",
      tips: ["Aim for gradual fiber increases, not sudden ones", "Drink more water as you add fiber", "A daily walk genuinely gets things moving"],
      src: { label: "NIH (NIDDK)", url: "https://www.niddk.nih.gov/health-information/digestive-diseases/constipation" } },
    { emoji: "🦋", name: "Thyroid issues", cat: "gut", keys: ["thyroid", "hypothyroid", "hyperthyroid"],
      blurb: "A tiny gland with huge effects on energy, weight, and mood.",
      tips: ["Unexplained fatigue or weight change? Ask for a TSH blood test", "Both over- and under-active thyroid are very treatable", "Symptoms creep in slowly — easy to miss for years"],
      src: { label: "American Thyroid Association", url: "https://www.thyroid.org" } },
    { emoji: "🥜", name: "Food allergies", cat: "gut", keys: ["food allergy", "food allergies", "peanut", "anaphylaxis"],
      blurb: "Serious reactions need a plan, not luck.",
      tips: ["Read every label, every time — recipes change", "If prescribed epinephrine, carry two and know how to use them", "Mild symptoms can escalate — take reactions seriously"],
      src: { label: "FARE", url: "https://www.foodallergy.org" } },
    { emoji: "🎯", name: "ADHD", cat: "mind", keys: ["adhd", "attention deficit", "focus problems"],
      blurb: "Not just kids — many adults discover it late, and treatment changes lives.",
      tips: ["External structure beats willpower: lists, timers, routines", "Exercise measurably improves focus", "A proper assessment beats self-diagnosis from social media"],
      src: { label: "NIH (NIMH)", url: "https://www.nimh.nih.gov/health/topics/attention-deficit-hyperactivity-disorder-adhd" } },
    { emoji: "🕊️", name: "Grief & loss", cat: "mind", keys: ["grief", "grieving", "bereavement", "loss"],
      blurb: "There's no correct timeline — grief is love with nowhere to go.",
      tips: ["Waves are normal; they space out with time", "Keep eating, sleeping and moving — basics carry you", "If it stays overwhelming for months, grief counselling helps"],
      src: { label: "American Psychological Association", url: "https://www.apa.org/topics/grief" } },
    { emoji: "🛌", name: "Restless legs", cat: "sleep", keys: ["restless legs", "rls"],
      blurb: "That irresistible urge to move at night is a real, treatable condition.",
      tips: ["Check iron levels — low iron is a common cause", "Evening caffeine and alcohol make it worse", "Gentle stretching before bed can calm it"],
      src: { label: "Sleep Foundation", url: "https://www.sleepfoundation.org/restless-legs-syndrome" } },
    { emoji: "🩻", name: "Osteoporosis", cat: "bones", keys: ["osteoporosis", "bone density", "brittle bones"],
      blurb: "Bones thin silently — the first sign is often a fracture.",
      tips: ["Weight-bearing exercise builds bone at any age", "Get enough calcium and vitamin D", "Ask about a bone density scan after menopause or 65+"],
      src: { label: "NIH (NIAMS)", url: "https://www.niams.nih.gov/health-topics/osteoporosis" } },
    { emoji: "🤕", name: "Sprains & strains", cat: "bones", keys: ["sprain", "strain", "twisted ankle"],
      blurb: "R.I.C.E. first, then gentle movement — not weeks of rest.",
      tips: ["First 48h: Rest, Ice, Compression, Elevation", "Start gentle range-of-motion as pain allows", "Can't bear weight at all? Get it checked for a fracture"],
      src: { label: "NIH (NIAMS)", url: "https://www.niams.nih.gov/health-topics/sprains-and-strains" } },
    { emoji: "🫁", name: "COPD", cat: "breath", keys: ["copd", "emphysema", "chronic bronchitis"],
      blurb: "Mostly caused by smoking — and quitting helps at every stage.",
      tips: ["Quitting smoking is the single biggest step", "Pulmonary rehab genuinely improves breathing and stamina", "Get flu and pneumonia vaccines — infections hit harder"],
      src: { label: "American Lung Association", url: "https://www.lung.org" } },
    { emoji: "🦠", name: "COVID-19", cat: "breath", keys: ["covid", "coronavirus"],
      blurb: "Still around — still worth basic precautions if you're higher-risk.",
      tips: ["Stay up to date with recommended vaccines", "Test when symptomatic before visiting vulnerable people", "Ventilation and fresh air cut transmission"],
      src: { label: "CDC", url: "https://www.cdc.gov/covid/" } },
    { emoji: "🧴", name: "Acne", cat: "skin", keys: ["acne", "pimples", "breakout"],
      blurb: "Not about being unclean — it's hormones, genetics, and pores.",
      tips: ["Be gentle: harsh scrubbing makes it worse", "Give any new routine 8–12 weeks to work", "Persistent acne responds well to dermatologist treatment"],
      src: { label: "American Academy of Dermatology", url: "https://www.aad.org/public/diseases/acne" } },
    { emoji: "🩹", name: "Eczema", cat: "skin", keys: ["eczema", "dermatitis", "itchy skin"],
      blurb: "A leaky skin barrier — moisture is the medicine.",
      tips: ["Moisturise daily, especially right after showers", "Short, lukewarm showers beat long hot ones", "Fragrance-free everything: soap, detergent, lotion"],
      src: { label: "American Academy of Dermatology", url: "https://www.aad.org/public/diseases/eczema" } },
    { emoji: "☀️", name: "Sun safety & skin cancer", cat: "skin", keys: ["sunburn", "sunscreen", "skin cancer", "melanoma", "mole"],
      blurb: "The most preventable cancer — and the easiest to catch early.",
      tips: ["Broad-spectrum SPF 30+ whenever you're out for long", "Know your moles: Asymmetry, Border, Color, Diameter, Evolving", "One bad sunburn does lasting damage — shade at midday"],
      src: { label: "Skin Cancer Foundation", url: "https://www.skincancer.org" } },
    { emoji: "💇", name: "Hair loss", cat: "skin", keys: ["hair loss", "balding", "thinning hair"],
      blurb: "Common, often treatable — and earlier is easier.",
      tips: ["Sudden shedding is often stress or illness and grows back", "Proven treatments exist — the earlier, the better", "Crash diets and low iron both thin hair"],
      src: { label: "American Academy of Dermatology", url: "https://www.aad.org/public/diseases/hair-loss" } },
    { emoji: "👁️", name: "Digital eye strain", cat: "sense", keys: ["eye strain", "dry eyes", "screen eyes", "vision"],
      blurb: "Screens don't damage eyes — but they do exhaust them.",
      tips: ["20-20-20: every 20 minutes, look 20 feet away for 20 seconds", "Blink more — screen staring halves your blink rate", "Yearly eye exams catch problems glasses can fix"],
      src: { label: "American Academy of Ophthalmology", url: "https://www.aao.org/eye-health" } },
    { emoji: "👂", name: "Hearing protection", cat: "sense", keys: ["hearing", "tinnitus", "ear ringing", "loud noise"],
      blurb: "Noise damage is permanent — but completely preventable.",
      tips: ["If others can hear your earbuds, they're too loud", "60/60 rule: max 60% volume for max 60 minutes", "Ringing after a loud night is a warning, not a quirk"],
      src: { label: "NIH (NIDCD)", url: "https://www.nidcd.nih.gov/health/noise-induced-hearing-loss" } },
    { emoji: "🦷", name: "Gum & oral health", cat: "sense", keys: ["teeth", "gums", "dental", "cavity", "oral health"],
      blurb: "Your mouth is connected to your heart — literally.",
      tips: ["Brush twice daily for two minutes; floss once", "Bleeding gums aren't normal — they're early gum disease", "Regular dental checks catch problems while they're small"],
      src: { label: "CDC", url: "https://www.cdc.gov/oral-health/" } },
    { emoji: "🌸", name: "PCOS", cat: "women", keys: ["pcos", "polycystic"],
      blurb: "One of the most common hormonal conditions — and often undiagnosed.",
      tips: ["Irregular periods + acne or excess hair? Ask about PCOS", "Exercise and weight management improve symptoms markedly", "It's linked to diabetes risk — worth managing early"],
      src: { label: "Office on Women's Health", url: "https://www.womenshealth.gov/a-z-topics/polycystic-ovary-syndrome" } },
    { emoji: "🌡️", name: "Menopause", cat: "women", keys: ["menopause", "perimenopause", "hot flashes", "hot flushes"],
      blurb: "A transition, not an illness — but you don't have to white-knuckle it.",
      tips: ["Hot flashes, sleep and mood changes are all treatable", "Strength training protects bone and muscle now", "Talk to a doctor about options — including hormone therapy"],
      src: { label: "NIH (NIA)", url: "https://www.nia.nih.gov/health/menopause" } },
    { emoji: "🩷", name: "Period pain & PMS", cat: "women", keys: ["period", "pms", "cramps", "menstrual"],
      blurb: "Common — but pain that derails your life isn't something to just endure.",
      tips: ["Heat and regular exercise genuinely reduce cramps", "Track symptoms — patterns make treatment easier", "Severe pain can be endometriosis — push for answers"],
      src: { label: "Office on Women's Health", url: "https://www.womenshealth.gov/a-z-topics/premenstrual-syndrome" } },
    { emoji: "🤰", name: "Pregnancy basics", cat: "women", keys: ["pregnancy", "pregnant", "prenatal", "folic acid"],
      blurb: "The essentials: early care, key vitamins, and honest conversations.",
      tips: ["Folic acid before and during early pregnancy prevents birth defects", "Book prenatal care as early as you can", "No known safe amount of alcohol in pregnancy"],
      src: { label: "CDC", url: "https://www.cdc.gov/pregnancy/" } },
    { emoji: "🎀", name: "Breast health", cat: "women", keys: ["breast", "mammogram"],
      blurb: "Know your normal — changes found early are highly treatable.",
      tips: ["Learn how your breasts normally look and feel", "Report new lumps, skin or nipple changes promptly", "Follow mammogram screening advice for your age and risk"],
      src: { label: "American Cancer Society", url: "https://www.cancer.org" } },
    { emoji: "👨‍⚕️", name: "Prostate health", cat: "men", keys: ["prostate", "psa"],
      blurb: "Very common with age — and very survivable when caught early.",
      tips: ["Discuss PSA screening with your doctor from ~50 (45 if higher risk)", "Weak stream or frequent night trips? Get it checked", "Most prostate changes are benign — but check, don't guess"],
      src: { label: "Urology Care Foundation", url: "https://www.urologyhealth.org" } },
    { emoji: "🔋", name: "Low testosterone", cat: "men", keys: ["testosterone", "low t"],
      blurb: "Real when it's real — but fatigue alone usually isn't it.",
      tips: ["Sleep, strength training and weight loss raise it naturally", "Get proper morning blood tests before any treatment", "Skip unregulated 'T boosters' — most do nothing"],
      src: { label: "Urology Care Foundation", url: "https://www.urologyhealth.org" } },
    { emoji: "💊", name: "Erectile dysfunction", cat: "men", keys: ["erectile", " ed", "impotence"],
      blurb: "Often an early warning light for heart health — worth a real checkup.",
      tips: ["It's common and very treatable — talk to a doctor", "The same habits that help your heart help here", "It can flag blood-vessel problems years early"],
      src: { label: "NIH (NIDDK)", url: "https://www.niddk.nih.gov/health-information/urologic-diseases/erectile-dysfunction" } },
    { emoji: "🧢", name: "Men's mental health", cat: "men", keys: ["men's mental health", "mens mental"],
      blurb: "Men seek help less and suffer more silently — talking works.",
      tips: ["Irritability and overworking can be depression in disguise", "One honest conversation is a strong first step", "Therapy is a tool, not a verdict"],
      src: { label: "NIH (NIMH)", url: "https://www.nimh.nih.gov/health/topics/men-and-mental-health" } },
    { emoji: "💉", name: "Vaccinations", cat: "prev", keys: ["vaccine", "vaccination", "immunization", "shots"],
      blurb: "One of the biggest life-savers in medical history — for adults too.",
      tips: ["Adults need boosters: tetanus, flu, and more with age", "Vaccines protect the people around you as well", "Check your schedule — many adults are behind without knowing"],
      src: { label: "CDC", url: "https://www.cdc.gov/vaccines/" } },
    { emoji: "🚭", name: "Quitting smoking", cat: "prev", keys: ["smoking", "quit smoking", "nicotine", "vaping"],
      blurb: "The single best thing a smoker can do for their health — at any age.",
      tips: ["Benefits start within 20 minutes of the last cigarette", "Meds + support double or triple your odds vs willpower alone", "Slips aren't failure — most people need several attempts"],
      src: { label: "Smokefree.gov (NIH)", url: "https://smokefree.gov" } },
    { emoji: "🍷", name: "Alcohol & health", cat: "prev", keys: ["alcohol", "drinking", "hangover"],
      blurb: "Less is better — and 'moderate' is smaller than most people think.",
      tips: ["Keep several alcohol-free days each week", "Alcohol quietly wrecks sleep quality", "If cutting down feels hard, that's information — support helps"],
      src: { label: "NIH (NIAAA)", url: "https://www.rethinkingdrinking.niaaa.nih.gov" } },
  ];

  function findTopic(low) {
    for (var ti = 0; ti < TOPICS.length; ti++) {
      var tp = TOPICS[ti];
      for (var ki = 0; ki < tp.keys.length; ki++) {
        if (low.indexOf(tp.keys[ki]) !== -1) return tp;
      }
    }
    return null;
  }
  function topicReply(tp) {
    return tp.emoji + " " + tp.name + "\n" + tp.blurb + "\n" +
      tp.tips.map(function (x) { return "• " + x; }).join("\n") +
      "\nSource: " + tp.src.label + " — the full guide is linked in the Health A–Z section.";
  }

  var topicsGrid = document.getElementById("topics-grid");
  var topicsEmpty = document.getElementById("topics-empty");
  var topicSearch = document.getElementById("topic-search");
  var topicChipsWrap = document.getElementById("topic-chips");
  var topicCat = "all";

  function topicMatches(t, q) {
    if (topicCat !== "all" && t.cat !== topicCat) return false;
    if (!q) return true;
    var hay = (t.name + " " + t.keys.join(" ") + " " + t.blurb).toLowerCase();
    return hay.indexOf(q) !== -1;
  }
  function renderTopics() {
    if (!topicsGrid) return;
    var q = topicSearch ? topicSearch.value.trim().toLowerCase() : "";
    var shown = TOPICS.filter(function (t) { return topicMatches(t, q); })
      .slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
    var html = "", lastLetter = "";
    shown.forEach(function (t) {
      var letter = t.name.charAt(0).toUpperCase();
      if (letter !== lastLetter) {
        html += '<h3 class="topic-letter">' + letter + "</h3>";
        lastLetter = letter;
      }
      html += '<details class="topic-row"><summary>' +
        '<span class="topic-row-emoji" aria-hidden="true">' + t.emoji + "</span>" +
        '<span class="topic-row-name">' + t.name + "</span>" +
        '<span class="topic-row-cat">' + TOPIC_CATS[t.cat] + "</span>" +
        '<span class="topic-chevron" aria-hidden="true">▾</span></summary>' +
        '<div class="topic-body"><p>' + t.blurb + "</p><ul>" +
        t.tips.map(function (x) { return "<li>" + x + "</li>"; }).join("") +
        '</ul><a class="topic-src" href="' + t.src.url + '" target="_blank" rel="noopener">Full guide: ' + t.src.label + " →</a></div></details>";
    });
    topicsGrid.innerHTML = html;
    if (topicsEmpty) topicsEmpty.hidden = shown.length > 0;
  }
  if (topicChipsWrap) {
    var cats = [["all", "All"]].concat(Object.keys(TOPIC_CATS).map(function (k) { return [k, TOPIC_CATS[k]]; }));
    topicChipsWrap.innerHTML = cats.map(function (c) {
      return '<button type="button" class="tchip' + (c[0] === "all" ? " active" : "") + '" data-cat="' + c[0] + '">' + c[1] + "</button>";
    }).join("");
    topicChipsWrap.addEventListener("click", function (e) {
      var chip = e.target.closest(".tchip");
      if (!chip) return;
      topicCat = chip.dataset.cat;
      topicChipsWrap.querySelectorAll(".tchip").forEach(function (b) {
        b.classList.toggle("active", b === chip);
      });
      renderTopics();
    });
  }
  if (topicSearch) topicSearch.addEventListener("input", renderTopics);
  renderTopics();

  /* =====================================================================
     App install (PWA) — offline service worker + install button
     ===================================================================== */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js").catch(function () {
        /* offline support unavailable — the site still works normally */
      });
    });
  }
  var installBtn = document.getElementById("install-btn");
  var deferredInstall = null;
  var isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredInstall = e;
    if (installBtn && !isStandalone) installBtn.hidden = false;
  });
  // iOS Safari never fires beforeinstallprompt — show the button with instructions.
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (installBtn && isIOS && !isStandalone) installBtn.hidden = false;
  if (installBtn) {
    installBtn.addEventListener("click", function () {
      if (deferredInstall) {
        deferredInstall.prompt();
        deferredInstall.userChoice.finally(function () {
          deferredInstall = null;
          installBtn.hidden = true;
        });
      } else {
        showToast("📲", "Install Vitality", isIOS
          ? "In Safari: tap Share, then \"Add to Home Screen\"."
          : "In your browser menu, choose \"Install app\" or \"Add to Home Screen\".", 9000);
      }
    });
  }
  window.addEventListener("appinstalled", function () {
    if (installBtn) installBtn.hidden = true;
    showToast("🌿", "Installed!", "Vitality Health is now on your home screen.");
  });

  /* =====================================================================
     Explore hub — jump to any section; unhide advanced ones first
     ===================================================================== */
  var ADV_SECTIONS = { workout: 1, nutrition: 1 };
  document.querySelectorAll(".hub-tile").forEach(function (a) {
    a.addEventListener("click", function () {
      var id = (a.getAttribute("href") || "").slice(1);
      if (ADV_SECTIONS[id] && typeof currentView === "function" &&
          currentView() === "simple" && typeof setView === "function") {
        setView("full", true);
      }
    });
  });

  /* =====================================================================
     Generic expandable directory (shared by Exercises and Q&A)
     ===================================================================== */
  function buildDirectory(cfg) {
    var activeCat = "all";
    function matches(it, q) {
      if (activeCat !== "all" && cfg.catOf(it) !== activeCat) return false;
      if (!q) return true;
      return cfg.textOf(it).toLowerCase().indexOf(q) !== -1;
    }
    function render() {
      var q = cfg.searchEl ? cfg.searchEl.value.trim().toLowerCase() : "";
      var shown = cfg.items.filter(function (it) { return matches(it, q); });
      var html = "", lastG = "";
      shown.forEach(function (it) {
        var g = cfg.groupOf ? cfg.groupOf(it) : "";
        if (g && g !== lastG) { html += '<h3 class="topic-letter">' + g + "</h3>"; lastG = g; }
        html += cfg.rowHtml(it);
      });
      cfg.listEl.innerHTML = html;
      if (cfg.emptyEl) cfg.emptyEl.hidden = shown.length > 0;
    }
    if (cfg.chipsEl) {
      var cats = [["all", "All"]].concat(Object.keys(cfg.cats).map(function (k) { return [k, cfg.cats[k]]; }));
      cfg.chipsEl.innerHTML = cats.map(function (c) {
        return '<button type="button" class="tchip' + (c[0] === "all" ? " active" : "") + '" data-cat="' + c[0] + '">' + c[1] + "</button>";
      }).join("");
      cfg.chipsEl.addEventListener("click", function (e) {
        var chip = e.target.closest(".tchip");
        if (!chip) return;
        activeCat = chip.dataset.cat;
        cfg.chipsEl.querySelectorAll(".tchip").forEach(function (b) { b.classList.toggle("active", b === chip); });
        render();
      });
    }
    if (cfg.searchEl) cfg.searchEl.addEventListener("input", render);
    render();
    return { render: render };
  }

  /* =====================================================================
     Exercise library
     ===================================================================== */
  var EX_CATS = { push: "Push", pull: "Pull", legs: "Legs", core: "Core", cardio: "Cardio", mobility: "Mobility", full: "Full body" };
  var EXERCISES = [
    { emoji: "🤸", name: "Bodyweight squat", cat: "legs", target: "Quads, glutes, core", keys: ["squat", "air squat"],
      steps: ["Stand feet shoulder-width, toes slightly out", "Push your hips back and bend your knees like sitting into a chair", "Go as low as comfortable with heels flat and chest up", "Drive through your heels to stand tall"], tip: "Knees track over your toes — don't let them cave inward." },
    { emoji: "🏋️", name: "Goblet squat", cat: "legs", target: "Quads, glutes, core", keys: ["goblet squat", "dumbbell squat"],
      steps: ["Hold a dumbbell or kettlebell at your chest", "Squat down keeping the weight close and elbows inside your knees", "Keep your chest tall throughout", "Stand back up squeezing your glutes"], tip: "The front weight helps you sit upright and hit depth." },
    { emoji: "🦵", name: "Walking lunge", cat: "legs", target: "Quads, glutes, hamstrings", keys: ["lunge", "walking lunge"],
      steps: ["Step forward into a long stride", "Lower until both knees are ~90°", "Push through the front heel to step through", "Alternate legs as you walk forward"], tip: "Keep your torso upright and front knee over your ankle." },
    { emoji: "🍑", name: "Glute bridge", cat: "legs", target: "Glutes, hamstrings", keys: ["glute bridge", "bridge", "hip raise"],
      steps: ["Lie on your back, knees bent, feet flat", "Squeeze your glutes and lift your hips", "Form a straight line from knees to shoulders", "Lower with control"], tip: "Push through your heels and avoid arching your lower back." },
    { emoji: "🏋️", name: "Romanian deadlift", cat: "pull", target: "Hamstrings, glutes, back", keys: ["romanian deadlift", "rdl", "deadlift"],
      steps: ["Hold weights in front of your thighs", "Soft knees, push hips back and lower the weights down your legs", "Keep your back flat and weights close", "Drive hips forward to stand"], tip: "Feel the stretch in your hamstrings — don't round your back." },
    { emoji: "🧗", name: "Step-up", cat: "legs", target: "Quads, glutes", keys: ["step up", "step-up"],
      steps: ["Stand facing a sturdy step or bench", "Place one whole foot on it", "Drive through that heel to stand up on the step", "Step down with control and alternate"], tip: "Let the top leg do the work — don't push off the bottom foot." },
    { emoji: "💪", name: "Push-up", cat: "push", target: "Chest, shoulders, triceps, core", keys: ["push up", "push-up", "pushup"],
      steps: ["Hands slightly wider than shoulders, body in a straight line", "Lower your chest toward the floor, elbows ~45°", "Keep your core and glutes tight", "Press back up to full arm extension"], tip: "Too hard? Do them on your knees or against a wall first." },
    { emoji: "🔺", name: "Incline push-up", cat: "push", target: "Chest, shoulders, triceps", keys: ["incline push up", "wall push up"],
      steps: ["Place your hands on a bench, table, or wall", "Walk your feet back to a straight-body angle", "Lower your chest to the surface", "Press back up"], tip: "The higher the surface, the easier — lower it as you get stronger." },
    { emoji: "🎯", name: "Dumbbell bench press", cat: "push", target: "Chest, shoulders, triceps", keys: ["bench press", "dumbbell press", "chest press"],
      steps: ["Lie on a bench with a dumbbell in each hand at chest level", "Press the weights up until arms are extended", "Lower slowly to a deep stretch", "Keep wrists stacked over elbows"], tip: "Keep your shoulder blades pinched back on the bench." },
    { emoji: "🙆", name: "Overhead press", cat: "push", target: "Shoulders, triceps, core", keys: ["overhead press", "shoulder press", "ohp", "military press"],
      steps: ["Hold weights at shoulder height", "Brace your core and press straight overhead", "Lock out with the weights over your mid-foot", "Lower back to your shoulders with control"], tip: "Don't lean back — squeeze your glutes to protect your spine." },
    { emoji: "🚣", name: "Bent-over row", cat: "pull", target: "Back, biceps, rear delts", keys: ["row", "bent over row", "barbell row", "dumbbell row"],
      steps: ["Hinge at the hips with a flat back, weights hanging", "Pull the weights to your lower ribs", "Squeeze your shoulder blades together", "Lower under control"], tip: "Lead with your elbows, not your hands." },
    { emoji: "🧲", name: "Pull-up / assisted", cat: "pull", target: "Back, biceps", keys: ["pull up", "pull-up", "chin up", "lat pulldown"],
      steps: ["Hang from a bar with hands just wider than shoulders", "Pull your chest toward the bar, driving elbows down", "Chin over the bar if you can", "Lower slowly to a full hang"], tip: "Use a band or the assisted machine to build up — negatives help a lot." },
    { emoji: "💪", name: "Bicep curl", cat: "pull", target: "Biceps", keys: ["curl", "bicep curl"],
      steps: ["Hold weights at your sides, palms forward", "Curl up by bending only your elbows", "Squeeze at the top", "Lower slowly all the way down"], tip: "Keep your elbows pinned to your sides — no swinging." },
    { emoji: "🔙", name: "Face pull", cat: "pull", target: "Rear delts, upper back", keys: ["face pull"],
      steps: ["Set a band or cable at head height", "Pull toward your face, hands splitting apart", "Aim elbows high and squeeze your upper back", "Return slowly"], tip: "Great for posture and healthy shoulders — go light and controlled." },
    { emoji: "🧘", name: "Plank", cat: "core", target: "Core, shoulders", keys: ["plank"],
      steps: ["Forearms on the floor, elbows under shoulders", "Extend your legs to a straight line", "Squeeze glutes and brace your abs", "Hold, breathing steadily"], tip: "Hips level — don't let them sag or pike up." },
    { emoji: "🚲", name: "Bicycle crunch", cat: "core", target: "Abs, obliques", keys: ["bicycle crunch", "crunch"],
      steps: ["Lie on your back, hands by your ears", "Bring one knee in and rotate the opposite elbow toward it", "Extend the other leg", "Alternate in a smooth pedaling motion"], tip: "Move slowly and rotate from your ribs, not your neck." },
    { emoji: "🐞", name: "Dead bug", cat: "core", target: "Deep core", keys: ["dead bug"],
      steps: ["Lie on your back, arms up, knees bent 90°", "Lower one arm and the opposite leg slowly", "Keep your lower back pressed to the floor", "Return and switch sides"], tip: "If your back arches, don't reach as far." },
    { emoji: "🌉", name: "Side plank", cat: "core", target: "Obliques, core", keys: ["side plank"],
      steps: ["Lie on your side, forearm under your shoulder", "Lift your hips into a straight line", "Hold, keeping your body stacked", "Switch sides"], tip: "Drop to your bottom knee to make it easier." },
    { emoji: "🏃", name: "Brisk walking", cat: "cardio", target: "Heart, legs", keys: ["walk", "walking", "brisk walk"],
      steps: ["Pick a pace where you can talk but not sing", "Stand tall and swing your arms", "Aim for 20–40 minutes", "Add small hills to raise the intensity"], tip: "The most sustainable cardio there is — consistency wins." },
    { emoji: "🏃", name: "Running / jogging", cat: "cardio", target: "Heart, legs", keys: ["run", "running", "jog", "jogging"],
      steps: ["Start with a 5-minute walk to warm up", "Ease into a comfortable jogging pace", "Land softly under your hips, relaxed shoulders", "Cool down with a walk"], tip: "New to it? Alternate 1 min jog / 2 min walk and build up." },
    { emoji: "🤸", name: "Jumping jacks", cat: "cardio", target: "Full body, heart", keys: ["jumping jack", "star jump"],
      steps: ["Stand tall, arms at your sides", "Jump feet out while raising your arms overhead", "Jump back to the start", "Keep a steady rhythm"], tip: "Low-impact option: step one foot out at a time." },
    { emoji: "🔥", name: "Burpee", cat: "cardio", target: "Full body, heart", keys: ["burpee"],
      steps: ["From standing, squat and place your hands down", "Jump or step your feet back to a plank", "Do a push-up (optional), then jump feet back in", "Explode up into a jump"], tip: "Scale it: skip the push-up and the jump until you build stamina." },
    { emoji: "⛰️", name: "Mountain climbers", cat: "cardio", target: "Core, shoulders, heart", keys: ["mountain climber"],
      steps: ["Start in a high plank", "Drive one knee toward your chest", "Quickly switch legs", "Keep your hips low and core tight"], tip: "Speed up for cardio, slow down for core control." },
    { emoji: "🏋️", name: "Kettlebell swing", cat: "full", target: "Glutes, hamstrings, back, heart", keys: ["kettlebell swing", "swing"],
      steps: ["Stand with a kettlebell an arm's length in front", "Hinge at the hips and hike it back between your legs", "Snap your hips forward to float it to chest height", "Let it swing back and repeat"], tip: "It's a hip snap, not a squat or an arm lift." },
    { emoji: "🧎", name: "Bird-dog", cat: "core", target: "Core, back, balance", keys: ["bird dog", "bird-dog"],
      steps: ["On hands and knees, back flat", "Extend the opposite arm and leg", "Hold a beat, keeping hips level", "Return and switch"], tip: "Imagine balancing a cup of water on your lower back." },
    { emoji: "🤲", name: "Calf raise", cat: "legs", target: "Calves", keys: ["calf raise"],
      steps: ["Stand tall, feet hip-width", "Rise onto the balls of your feet", "Pause at the top", "Lower slowly"], tip: "Do them on a step for a bigger stretch and range." },
    { emoji: "🧎", name: "Hip flexor stretch", cat: "mobility", target: "Hip flexors", keys: ["hip flexor", "lunge stretch"],
      steps: ["Kneel in a half-lunge, back knee down", "Tuck your pelvis and gently push hips forward", "Feel the stretch in the front of the back hip", "Hold 30 seconds each side"], tip: "Great after long hours of sitting." },
    { emoji: "🐈", name: "Cat–cow", cat: "mobility", target: "Spine mobility", keys: ["cat cow", "cat-cow"],
      steps: ["On hands and knees", "Drop your belly and lift your gaze (cow)", "Round your spine and tuck your chin (cat)", "Flow slowly with your breath"], tip: "A gentle wake-up for a stiff back." },
    { emoji: "🙆", name: "Doorway chest stretch", cat: "mobility", target: "Chest, shoulders", keys: ["chest stretch", "doorway stretch"],
      steps: ["Place a forearm on a door frame, elbow at shoulder height", "Step through gently until you feel a stretch", "Hold 30 seconds", "Switch sides"], tip: "Counteracts hunching over screens." },
    { emoji: "🦵", name: "Hamstring stretch", cat: "mobility", target: "Hamstrings", keys: ["hamstring stretch"],
      steps: ["Sit with one leg extended", "Hinge forward from your hips toward your toes", "Keep your back long, not rounded", "Hold 30 seconds each side"], tip: "Reach with your chest, not your chin." },
    { emoji: "🧍", name: "Wall sit", cat: "legs", target: "Quads, endurance", keys: ["wall sit"],
      steps: ["Lean your back flat against a wall", "Slide down until knees are ~90°", "Hold with weight in your heels", "Keep breathing steadily"], tip: "Start with 20–30 seconds and build up." },
    { emoji: "🍑", name: "Hip thrust", cat: "legs", target: "Glutes", keys: ["hip thrust"],
      steps: ["Upper back on a bench, weight across your hips", "Drive through your heels to lift your hips", "Squeeze glutes to a flat tabletop", "Lower under control"], tip: "The single best glute builder — squeeze hard at the top." },
    { emoji: "💪", name: "Tricep dip", cat: "push", target: "Triceps, chest", keys: ["dip", "tricep dip"],
      steps: ["Hands on a sturdy chair or bench behind you", "Slide your hips off, legs out front", "Bend your elbows to lower straight down", "Press back up"], tip: "Keep elbows pointing back, not flaring out." },
  ];
  function findExercise(low) {
    for (var i = 0; i < EXERCISES.length; i++) {
      var x = EXERCISES[i];
      if (low.indexOf(x.name.toLowerCase()) !== -1) return x;
      for (var k = 0; k < x.keys.length; k++) if (low.indexOf(x.keys[k]) !== -1) return x;
    }
    return null;
  }
  function exerciseReply(x) {
    return "🏋️ " + x.name + " — targets " + x.target + ".\n" +
      x.steps.map(function (s, i) { return (i + 1) + ". " + s; }).join("\n") +
      "\nTip: " + x.tip + "\n(Full library is in the Exercise library section.)";
  }
  function exRowHtml(x) {
    return '<details class="topic-row"><summary>' +
      '<span class="topic-row-emoji" aria-hidden="true">' + x.emoji + "</span>" +
      '<span class="topic-row-name">' + x.name + "</span>" +
      '<span class="topic-row-cat">' + EX_CATS[x.cat] + "</span>" +
      '<span class="topic-chevron" aria-hidden="true">▾</span></summary>' +
      '<div class="topic-body"><p><strong>Targets:</strong> ' + x.target + "</p><ol>" +
      x.steps.map(function (s) { return "<li>" + s + "</li>"; }).join("") +
      '</ol><p class="move-tip"><strong>Tip:</strong> ' + x.tip + "</p></div></details>";
  }
  if (document.getElementById("ex-list")) {
    var exSorted = EXERCISES.slice().sort(function (a, b) {
      return EX_CATS[a.cat].localeCompare(EX_CATS[b.cat]) || a.name.localeCompare(b.name);
    });
    buildDirectory({
      items: exSorted,
      listEl: document.getElementById("ex-list"),
      emptyEl: document.getElementById("ex-empty"),
      searchEl: document.getElementById("ex-search"),
      chipsEl: document.getElementById("ex-chips"),
      cats: EX_CATS,
      catOf: function (x) { return x.cat; },
      groupOf: function (x) { return EX_CATS[x.cat]; },
      textOf: function (x) { return x.name + " " + x.keys.join(" ") + " " + x.target; },
      rowHtml: exRowHtml,
    });
  }

  /* =====================================================================
     Questions & Answers (FAQ)
     ===================================================================== */
  var FAQ_CATS = { general: "General", nutrition: "Nutrition", exercise: "Exercise", weight: "Weight", sleep: "Sleep", mind: "Mental health", app: "This app" };
  var FAQS = [
    { cat: "general", q: "How much exercise do I actually need?", keys: ["how much exercise", "how much activity", "150 minutes"],
      a: "For most adults: about 150 minutes of moderate activity (like brisk walking) per week, plus muscle-strengthening on 2+ days. That's ~30 minutes, 5 days a week — and it can be broken into short chunks. Any movement beats none." },
    { cat: "general", q: "Is it better to work out in the morning or evening?", keys: ["morning or evening", "best time to work out", "best time to exercise"],
      a: "The best time is whenever you'll actually do it consistently. Morning workouts build routine and are rarely 'cancelled' by the day; evening sessions may feel stronger since your body is warm. Pick what fits your life." },
    { cat: "general", q: "How long until I see results?", keys: ["see results", "how long results", "when will i see"],
      a: "Energy, mood, and sleep often improve within 1–2 weeks. Strength gains show in 4–6 weeks. Visible body changes usually take 8–12 weeks of consistency. Track habits, not just the mirror." },
    { cat: "exercise", q: "How many sets and reps should I do?", keys: ["how many reps", "how many sets", "sets and reps"],
      a: "General strength: 3–4 sets of 6–12 reps. Endurance: 2–3 sets of 12–20. Beginners do great with 2–3 sets of 8–12, stopping 1–2 reps short of failure. Add a little weight or a rep when it feels easy." },
    { cat: "exercise", q: "How much rest between sets?", keys: ["rest between sets", "how long rest", "rest time"],
      a: "Roughly 30–60 seconds for endurance/toning, 1–2 minutes for general strength, and 2–3 minutes for heavy lifts. Rest enough that your form stays clean on the next set." },
    { cat: "exercise", q: "Should I do cardio or weights first?", keys: ["cardio or weights", "cardio before weights", "cardio first"],
      a: "Do whichever matches your main goal first, while you're fresh. Strength goal → lift first. Endurance goal → cardio first. A short 5–10 minute cardio warm-up before lifting is always fine." },
    { cat: "exercise", q: "How many rest days do I need?", keys: ["rest days", "how many rest days", "recovery days"],
      a: "Most people do well with 1–3 rest days a week, and shouldn't train the same muscle hard two days in a row. Muscles grow during recovery, not during the workout. Light walking on rest days is great." },
    { cat: "exercise", q: "Why am I sore after working out?", keys: ["sore", "doms", "muscle soreness", "why am i sore"],
      a: "That's DOMS (delayed-onset muscle soreness), a normal response to new or harder training that peaks 24–48h later. Gentle movement, hydration, and sleep help. Sharp or joint pain is different — back off and check it." },
    { cat: "exercise", q: "Can I build muscle with just bodyweight?", keys: ["bodyweight build muscle", "no equipment muscle", "calisthenics"],
      a: "Yes — especially as a beginner. Progress by doing harder variations, more reps, slower tempos, and shorter rest. Eventually adding external weight helps continue progress, but you can get strong with bodyweight alone." },
    { cat: "exercise", q: "Do I need to lift heavy to get toned?", keys: ["get toned", "lift heavy", "tone up", "toning"],
      a: "'Toned' just means muscle + lower body fat. You build muscle with challenging resistance (any load that's hard for your rep range) and reveal it by managing nutrition. Light weights for endless reps do less than moderate, challenging sets." },
    { cat: "weight", q: "What's the best way to lose weight?", keys: ["lose weight", "weight loss", "best way to lose"],
      a: "A modest, sustainable calorie deficit — mostly from whole foods with plenty of protein and vegetables — combined with strength training (to keep muscle) and daily steps. Aim for ~0.5–1% of body weight per week. Consistency beats extremes." },
    { cat: "weight", q: "How much protein should I eat?", keys: ["how much protein", "protein intake", "grams of protein"],
      a: "A common range is about 1.6–2.2 g per kg of body weight per day when you're active or trying to lose fat while keeping muscle. Spread it across meals. The Fuel calculator in this app estimates a target for you." },
    { cat: "weight", q: "Are carbs bad for me?", keys: ["carbs bad", "are carbs", "low carb"],
      a: "No — carbs are your body's main fuel, especially for exercise. Favor whole sources (oats, rice, potatoes, fruit, beans) over heavily processed ones. What matters most is your overall calories and food quality, not cutting a whole macro." },
    { cat: "weight", q: "Can I target fat loss on my belly?", keys: ["spot reduce", "belly fat", "target fat", "lose belly"],
      a: "Spot reduction isn't a thing — you can't choose where fat comes off. Fat loss happens body-wide through an overall calorie deficit. Core exercises strengthen the muscles underneath, but the fat on top comes off with your whole body." },
    { cat: "nutrition", q: "How much water should I drink?", keys: ["how much water", "water intake", "hydration"],
      a: "A common guide is ~2 litres (about 8 glasses) a day, but needs vary with size, heat, and activity. Check your urine — pale yellow is well-hydrated. Thirst, dark urine, or headaches are signs to drink more." },
    { cat: "nutrition", q: "Do I need supplements or protein powder?", keys: ["supplements", "protein powder", "do i need supplements"],
      a: "Food first — most people can hit their needs with whole foods. Protein powder is just a convenient way to reach a protein target, not magic. Creatine and vitamin D are among the few with strong evidence; check with a professional for your situation." },
    { cat: "nutrition", q: "Should I eat before or after a workout?", keys: ["eat before workout", "eat after workout", "pre workout meal", "post workout"],
      a: "A small carb+protein snack 1–2 hours before can help energy; a meal with protein within a few hours after supports recovery. The exact timing matters far less than your total daily food. Train in whatever state feels good to you." },
    { cat: "sleep", q: "How many hours of sleep do I need?", keys: ["how much sleep", "hours of sleep", "sleep need"],
      a: "Most adults need 7–9 hours. Consistency matters as much as quantity — a steady sleep and wake time, a dark cool room, and no screens in the last hour make the biggest difference." },
    { cat: "sleep", q: "Why can't I fall asleep?", keys: ["can't sleep", "cant fall asleep", "insomnia", "trouble sleeping"],
      a: "Common culprits: caffeine late in the day, screens and bright light at night, irregular schedule, stress, and alcohol. Keep a wind-down routine, get morning daylight, and if it persists for weeks, talk to a doctor about it." },
    { cat: "mind", q: "How do I stay motivated?", keys: ["stay motivated", "motivation", "lose motivation"],
      a: "Motivation follows action more than it precedes it. Make it easy: tiny goals, a set time, lay out your gear, and track streaks (the habit tracker here helps). Focus on showing up, not on feeling inspired." },
    { cat: "mind", q: "How can I manage stress?", keys: ["manage stress", "reduce stress", "stressed"],
      a: "Movement, daylight, connection with people, and slow breathing all genuinely lower stress. Short breaks, protecting sleep, and limiting doom-scrolling help too. If stress is constant or overwhelming, talking to a professional is a strength, not a weakness." },
    { cat: "general", q: "Is it safe to work out every day?", keys: ["work out every day", "exercise every day", "train daily"],
      a: "Light daily activity (walking, mobility, easy cycling) is great. Hard training every day without recovery leads to burnout and injury. Alternate hard and easy days, or rotate muscle groups, and take at least one easier day a week." },
    { cat: "general", q: "When should I see a doctor before exercising?", keys: ["doctor before exercise", "safe to exercise", "medical clearance"],
      a: "Check with a professional first if you have heart/lung conditions, chest pain, dizziness, are pregnant, are recovering from injury or surgery, or have been inactive with other risk factors. When in doubt, get cleared — then start gradually." },
    { cat: "app", q: "Is my data private?", keys: ["is my data private", "privacy", "data stored", "where is my data"],
      a: "Yes. Everything you log stays in your browser's local storage on your device — there's no account, no server, and no tracking. Clearing your browser data or using the Clear buttons removes it. Use 'Export my data' to save a CSV backup." },
    { cat: "app", q: "Does the app work offline?", keys: ["work offline", "offline", "no internet"],
      a: "Yes — once loaded, it's installed as an app with a service worker that caches everything, so the trackers, Vita, exercises, and Health A–Z all work with no connection." },
    { cat: "app", q: "Can it sync with my Apple Watch, Fitbit, or Garmin?", keys: ["apple watch", "fitbit", "garmin", "sync watch", "smartwatch"],
      a: "Yes — via the native companion app (see NATIVE.md in the project). It reads Apple Health / Health Connect, where your phone and watch record steps around the clock; Fitbit and Garmin flow in through their own apps' health-sync settings. In the browser version you get the live step counter and Bluetooth heart-rate pairing, but not stored watch data — browsers can't access it." },
    { cat: "app", q: "How do I count steps in the background?", keys: ["count steps background", "background steps", "steps when closed", "pedometer"],
      a: "Your phone already does — the OS health app (Apple Health / Health Connect) counts steps 24/7 at near-zero battery cost. The native companion app (NATIVE.md) reads that total and syncs it to your journal every time you open it: the ⌚ card in the Steps section. In the browser, use the live counter while the app is open." },
    { cat: "app", q: "How do I move my data to a new phone?", keys: ["new phone", "move my data", "transfer data", "backup", "restore"],
      a: "Your Profile → Backup & restore → 'Download backup' saves one file with your whole journal, profile, reminders, and settings. On the new device, open the app and use 'Restore from file'. You can also just tell Vita 'backup'. Since there's no account or server, this file is the only copy — keep it safe." },
    { cat: "app", q: "How do I ask Vita something?", keys: ["how to use vita", "ask vita", "what can vita do"],
      a: "Tap the 💬 button. Vita understands plain language — log health ('log water', 'slept 7 hours'), set reminders, explain Health A–Z topics, answer these FAQs, and coach exercises ('how do I do a squat'). Say 'help' for the full list." },
  ];
  function findFaq(low) {
    for (var i = 0; i < FAQS.length; i++) {
      var f = FAQS[i];
      for (var k = 0; k < f.keys.length; k++) if (low.indexOf(f.keys[k]) !== -1) return f;
    }
    return null;
  }
  function faqRowHtml(f) {
    return '<details class="topic-row"><summary>' +
      '<span class="topic-row-emoji" aria-hidden="true">❓</span>' +
      '<span class="topic-row-name">' + f.q + "</span>" +
      '<span class="topic-row-cat">' + FAQ_CATS[f.cat] + "</span>" +
      '<span class="topic-chevron" aria-hidden="true">▾</span></summary>' +
      '<div class="topic-body"><p>' + f.a + "</p></div></details>";
  }
  if (document.getElementById("faq-list")) {
    var faqSorted = FAQS.slice().sort(function (a, b) {
      return FAQ_CATS[a.cat].localeCompare(FAQ_CATS[b.cat]);
    });
    buildDirectory({
      items: faqSorted,
      listEl: document.getElementById("faq-list"),
      emptyEl: document.getElementById("faq-empty"),
      searchEl: document.getElementById("faq-search"),
      chipsEl: document.getElementById("faq-chips"),
      cats: FAQ_CATS,
      catOf: function (f) { return f.cat; },
      groupOf: function (f) { return FAQ_CATS[f.cat]; },
      textOf: function (f) { return f.q + " " + f.keys.join(" ") + " " + f.a; },
      rowHtml: faqRowHtml,
    });
  }

  /* =====================================================================
     Live step counter (accelerometer, while the app is open)
     ===================================================================== */
  var stepsStartBtn = document.getElementById("steps-start");
  var stepsLogBtn = document.getElementById("steps-log");
  var liveStepsEl = document.getElementById("live-steps");
  var stepsMsg = document.getElementById("steps-msg");
  var liveSteps = 0, stepCounting = false, stepBaseline = 0, lastStepAt = 0;

  function onMotion(e) {
    var a = e.accelerationIncludingGravity || e.acceleration;
    if (!a) return;
    var mag = Math.sqrt((a.x || 0) * (a.x || 0) + (a.y || 0) * (a.y || 0) + (a.z || 0) * (a.z || 0));
    stepBaseline = stepBaseline ? stepBaseline * 0.95 + mag * 0.05 : mag;
    var dev = mag - stepBaseline;
    var now = Date.now();
    if (dev > 2.5 && (now - lastStepAt) > 300) {
      lastStepAt = now;
      liveSteps++;
      if (liveStepsEl) liveStepsEl.textContent = liveSteps.toLocaleString();
      if (stepsLogBtn) stepsLogBtn.disabled = false;
    }
  }
  function stopSteps() {
    stepCounting = false;
    window.removeEventListener("devicemotion", onMotion);
    if (stepsStartBtn) stepsStartBtn.textContent = "Start counting";
    if (stepsMsg) stepsMsg.textContent = liveSteps ? "Paused at " + liveSteps.toLocaleString() + " steps — log them below." : "Stopped.";
  }
  function beginSteps() {
    stepCounting = true;
    stepBaseline = 0;
    window.addEventListener("devicemotion", onMotion);
    if (stepsStartBtn) stepsStartBtn.textContent = "Stop";
    if (stepsMsg) stepsMsg.textContent = "Counting… keep the app open and your phone with you. 👟";
  }
  if (stepsStartBtn) {
    stepsStartBtn.addEventListener("click", function () {
      if (stepCounting) { stopSteps(); return; }
      if (typeof DeviceMotionEvent === "undefined") {
        stepsMsg.textContent = "This device/browser doesn't share motion data — log steps with Vita instead.";
        return;
      }
      if (typeof DeviceMotionEvent.requestPermission === "function") {
        DeviceMotionEvent.requestPermission().then(function (state) {
          if (state === "granted") beginSteps();
          else stepsMsg.textContent = "Motion access was denied. Enable it in settings, or log steps with Vita.";
        }).catch(function () { stepsMsg.textContent = "Couldn't access the motion sensor."; });
      } else {
        beginSteps();
      }
    });
  }
  if (stepsLogBtn) {
    stepsLogBtn.addEventListener("click", function () {
      if (!liveSteps) return;
      addEntry("steps", "👟", liveSteps.toLocaleString() + " steps", liveSteps, "steps");
      if (stepsMsg) stepsMsg.textContent = "Logged " + liveSteps.toLocaleString() + " steps to your journal. 👟";
      liveSteps = 0;
      if (liveStepsEl) liveStepsEl.textContent = "0";
      stepsLogBtn.disabled = true;
    });
  }

  /* =====================================================================
     Heart-rate device via Web Bluetooth (standard HR profile)
     ===================================================================== */
  var hrConnectBtn = document.getElementById("hr-connect");
  var hrBpmEl = document.getElementById("hr-bpm");
  var hrMsg = document.getElementById("hr-msg");
  if (hrConnectBtn) {
    if (!(navigator.bluetooth && navigator.bluetooth.requestDevice)) {
      hrMsg.textContent = "Web Bluetooth isn't available here — try Chrome or Edge on Android or desktop.";
      hrConnectBtn.disabled = true;
    } else {
      hrConnectBtn.addEventListener("click", function () {
        hrMsg.textContent = "Choose your heart-rate device…";
        navigator.bluetooth.requestDevice({ filters: [{ services: ["heart_rate"] }] })
          .then(function (device) {
            hrMsg.textContent = "Connecting to " + (device.name || "device") + "…";
            device.addEventListener("gattserverdisconnected", function () {
              hrMsg.textContent = "Device disconnected.";
              hrBpmEl.textContent = "—";
            });
            return device.gatt.connect().then(function (server) {
              return server.getPrimaryService("heart_rate");
            }).then(function (service) {
              return service.getCharacteristic("heart_rate_measurement");
            }).then(function (ch) {
              return ch.startNotifications();
            }).then(function (ch) {
              ch.addEventListener("characteristicvaluechanged", function (ev) {
                var dv = ev.target.value;
                var flags = dv.getUint8(0);
                var bpm = (flags & 1) ? dv.getUint16(1, true) : dv.getUint8(1);
                hrBpmEl.textContent = bpm;
              });
              hrMsg.textContent = "Connected " + (device.name ? "to " + device.name + " " : "") + "❤️ live bpm below.";
            });
          })
          .catch(function (err) {
            hrMsg.textContent = (err && err.name === "NotFoundError")
              ? "No device selected."
              : "Couldn't connect — make sure the device is on, unpaired from other apps, and nearby.";
          });
      });
    }
  }

  /* =====================================================================
     Native health sync — active only inside the Capacitor companion app
     (see NATIVE.md). The OS health store (Apple Health / Health Connect)
     counts steps 24/7 from the phone and any paired watch; here we read
     today's total and mirror it into the journal.
     ===================================================================== */
  var isNativeApp = !!(window.Capacitor &&
    typeof window.Capacitor.isNativePlatform === "function" &&
    window.Capacitor.isNativePlatform());
  var healthPlugin = isNativeApp && window.Capacitor.Plugins &&
    window.Capacitor.Plugins.HealthPlugin;
  var healthCard = document.getElementById("health-card");
  var healthStepsEl = document.getElementById("health-steps");
  var healthMsg = document.getElementById("health-msg");
  var healthSyncBtn = document.getElementById("health-sync");

  var healthExtraEl = document.getElementById("health-extra");

  // Replace today's synced entries of one type, then push the fresh ones.
  function replaceSynced(type, entries) {
    journal = journal.filter(function (e) {
      return !(e.type === type && e.synced && isToday(e.ts));
    });
    entries.forEach(function (e) { journal.push(e); });
  }
  // The plugin doesn't document duration units; workouts are < 10 h, so a
  // value that large can only be milliseconds.
  function workoutMinutes(d) {
    if (!d || d < 0) return 0;
    return Math.round(d > 36000 ? d / 60000 : d / 60);
  }
  function prettyWorkoutType(t) {
    var s = String(t || "workout").replace(/[_-]+/g, " ").toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function syncHealth(interactive) {
    if (!healthPlugin) return;
    healthPlugin.isHealthAvailable().then(function (res) {
      if (!res || !res.available) {
        if (healthMsg) healthMsg.textContent = "Health data isn't available — on Android, install the Health Connect app.";
        if (interactive && healthPlugin.showHealthConnectInPlayStore) healthPlugin.showHealthConnectInPlayStore();
        return;
      }
      var start = new Date();
      start.setHours(0, 0, 0, 0);
      var startISO = start.toISOString();
      var endISO = new Date().toISOString();
      return healthPlugin.requestHealthPermissions({
        permissions: ["READ_STEPS", "READ_ACTIVE_CALORIES", "READ_WORKOUTS", "READ_HEART_RATE"],
      }).then(function () {
        return Promise.all([
          healthPlugin.queryAggregated({ startDate: startISO, endDate: endISO, dataType: "steps", bucket: "day" })
            .catch(function () { return null; }),
          healthPlugin.queryAggregated({ startDate: startISO, endDate: endISO, dataType: "active-calories", bucket: "day" })
            .catch(function () { return null; }),
          healthPlugin.queryWorkouts({ startDate: startISO, endDate: endISO, includeHeartRate: true, includeRoute: false, includeSteps: false })
            .catch(function () { return null; }),
        ]);
      }).then(function (results) {
        var now = Date.now();
        var parts = [];

        // Steps
        var steps = 0;
        (((results[0] || {}).aggregatedData) || []).forEach(function (s) { steps += s.value || 0; });
        steps = Math.round(steps);
        if (healthStepsEl) healthStepsEl.textContent = steps.toLocaleString();
        if (steps > 0) {
          replaceSynced("steps", [{
            id: uid(), ts: now, type: "steps", emoji: "⌚",
            text: steps.toLocaleString() + " steps (synced)", value: steps, unit: "steps", synced: true,
          }]);
          parts.push(steps.toLocaleString() + " steps");
        }

        // Active calories
        var kcal = 0;
        (((results[1] || {}).aggregatedData) || []).forEach(function (s) { kcal += s.value || 0; });
        kcal = Math.round(kcal);
        if (kcal > 0) {
          replaceSynced("calories", [{
            id: uid(), ts: now, type: "calories", emoji: "🔥",
            text: kcal.toLocaleString() + " kcal active (synced)", value: kcal, unit: "kcal", synced: true,
          }]);
          parts.push(kcal.toLocaleString() + " kcal");
        }

        // Workouts (+ heart rate riding along on their samples)
        var workouts = ((results[2] || {}).workouts) || [];
        var hrSamples = [];
        if (workouts.length) {
          var wEntries = workouts.map(function (w) {
            var mins = workoutMinutes(w.duration);
            var wkcal = Math.round(w.calories || 0);
            var avg = null;
            if (w.heartRate && w.heartRate.length) {
              var sum = 0;
              w.heartRate.forEach(function (h) { sum += h.bpm || 0; hrSamples.push(h); });
              avg = Math.round(sum / w.heartRate.length);
            }
            var label = prettyWorkoutType(w.workoutType) +
              (mins ? " " + mins + " min" : "") +
              (wkcal ? ", " + wkcal + " kcal" : "") +
              (avg ? ", ~" + avg + " bpm" : "") + " (synced)";
            return {
              id: uid(), ts: now, type: "workout", emoji: "⌚",
              text: label, value: mins || null, unit: "min", synced: true,
            };
          });
          replaceSynced("workout", wEntries);
          parts.push(workouts.length + " workout" + (workouts.length === 1 ? "" : "s"));
        }

        // Heart rate summary across today's workouts
        if (hrSamples.length) {
          var hsum = 0;
          hrSamples.forEach(function (h) { hsum += h.bpm || 0; });
          var havg = Math.round(hsum / hrSamples.length);
          replaceSynced("hr", [{
            id: uid(), ts: now, type: "hr", emoji: "❤️",
            text: "Avg " + havg + " bpm across workouts (synced)", value: havg, unit: "bpm", synced: true,
          }]);
          parts.push("~" + havg + " bpm");
        }

        if (healthExtraEl) {
          healthExtraEl.textContent = parts.length > 1 ? parts.slice(1).join(" · ") : "";
        }
        if (!parts.length) {
          if (interactive && healthMsg) healthMsg.textContent = "Nothing recorded yet today.";
          return;
        }
        writeStore(J_KEY, journal);
        renderAll();
        document.dispatchEvent(new CustomEvent("vh:journal-changed"));
        if (healthMsg) healthMsg.textContent = "Synced from your phone/watch: " + parts.join(" · ") + " ⌚";
      });
    }).catch(function () {
      if (healthMsg) healthMsg.textContent = "Sync failed — check Health permissions for Vitality in your settings.";
    });
  }
  if (healthPlugin && healthCard) {
    healthCard.hidden = false;
    var webNote = document.getElementById("device-note-web");
    if (webNote) webNote.hidden = true; // browser limits don't apply in the native app
    if (healthSyncBtn) healthSyncBtn.addEventListener("click", function () { syncHealth(true); });
    setTimeout(function () { syncHealth(false); }, 1500); // auto-sync on open
    document.addEventListener("resume", function () { syncHealth(false); }); // Capacitor app resume
  }

  /* =====================================================================
     Personal profile — everything compiled to this exact person, stored
     only in this device's localStorage (no account, no server).
     ===================================================================== */
  var PROFILE_KEY = "vh-profile";
  var profile = {};
  try { profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}") || {}; } catch (e) { profile = {}; }

  function profileName() { return profile.name || ""; }
  function stepGoal() { return profile.stepGoal > 0 ? profile.stepGoal : 8000; }
  function sleepGoal() { return profile.sleepGoal > 0 ? profile.sleepGoal : 8; }

  function saveProfile(patch) {
    for (var k in patch) {
      if (patch[k] === "" || patch[k] == null || (typeof patch[k] === "number" && isNaN(patch[k]))) delete profile[k];
      else profile[k] = patch[k];
    }
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch (e) {}
    applyProfileEverywhere();
  }
  function updateProfileWeight(kg) {
    if (!(kg > 0)) return;
    profile.weightKg = Math.round(kg * 10) / 10;
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch (e) {}
    fillProfileForm();
    prefillCalculators();
  }
  function profileSummary() {
    if (!profile.name && !profile.weightKg && !profile.heightCm) {
      return "I don't know you yet! Fill in Your Profile (👤 in the Explore hub) or tell me \"my name is …\" — everything stays on your device.";
    }
    var bits = [];
    if (profile.name) bits.push("You're " + profile.name);
    if (profile.age) bits.push(profile.age + " years old");
    if (profile.heightCm) bits.push(profile.heightCm + " cm");
    if (profile.weightKg) bits.push(prefWeight(profile.weightKg, "kg") + " " + currentWUnit());
    var line = bits.join(", ") + ".";
    line += "\n🎯 Goals: " + stepGoal().toLocaleString() + " steps/day, " + sleepGoal() + " h sleep.";
    line += "\n🔒 All of this lives only on this device.";
    return line;
  }

  /* ---- profile form ---- */
  var pfForm = document.getElementById("profile-form");
  var pfMsg = document.getElementById("pf-msg");
  function fillProfileForm() {
    if (!pfForm) return;
    document.getElementById("pf-name").value = profile.name || "";
    document.getElementById("pf-age").value = profile.age || "";
    document.getElementById("pf-sex").value = profile.sex || "";
    document.getElementById("pf-height").value = profile.heightCm || "";
    var wl = document.getElementById("pf-weight-label");
    if (wl) wl.textContent = "Weight (" + currentWUnit() + ")";
    document.getElementById("pf-weight").value = profile.weightKg ? prefWeight(profile.weightKg, "kg") : "";
    document.getElementById("pf-steps").value = profile.stepGoal || "";
    document.getElementById("pf-sleep").value = profile.sleepGoal || "";
  }
  function prefillCalculators() {
    var imperial = currentWUnit() === "lb";
    var h = profile.heightCm ? (imperial ? Math.round(profile.heightCm / 2.54) : profile.heightCm) : "";
    var w = profile.weightKg ? prefWeight(profile.weightKg, "kg") : "";
    ["height", "m-height"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el && h && !el.value) el.value = h;
    });
    ["weight", "m-weight"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el && w && !el.value) el.value = w;
    });
    var age = document.getElementById("m-age");
    if (age && profile.age && !age.value) age.value = profile.age;
    var sex = document.getElementById("m-sex");
    if (sex && profile.sex) sex.value = profile.sex;
  }
  function applyProfileEverywhere() {
    var title = document.getElementById("journal-title");
    if (title) title.textContent = profile.name ? profile.name + "'s health journal" : "Your health journal";
    fillProfileForm();
    prefillCalculators();
    renderStreaks();
  }
  if (pfForm) {
    pfForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var wRaw = parseFloat(document.getElementById("pf-weight").value);
      var kg = wRaw > 0 ? (currentWUnit() === "lb" ? wRaw * 0.453592 : wRaw) : null;
      saveProfile({
        name: (document.getElementById("pf-name").value || "").trim(),
        age: parseInt(document.getElementById("pf-age").value, 10) || null,
        sex: document.getElementById("pf-sex").value || "",
        heightCm: parseFloat(document.getElementById("pf-height").value) || null,
        weightKg: kg ? Math.round(kg * 10) / 10 : null,
        stepGoal: parseInt(document.getElementById("pf-steps").value, 10) || null,
        sleepGoal: parseFloat(document.getElementById("pf-sleep").value) || null,
      });
      if (pfMsg) pfMsg.textContent = "Saved" + (profile.name ? ", " + profile.name : "") + " — stored only on this device. 🔒";
      showToast("👤", "Profile saved", "Vita and your tools are now personalized to you.");
    });
  }
  if (wunitBtn) wunitBtn.addEventListener("click", function () {
    setTimeout(fillProfileForm, 0); // relabel + convert the profile weight field
  });

  /* =====================================================================
     Goal streaks — consecutive days meeting your step & water goals
     ===================================================================== */
  var streaksEl = document.getElementById("streaks");

  function dayKeyOffset(n) {
    var d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }
  function dayTotals(dk) {
    var t = { steps: 0, water: 0, workouts: 0, sleep: null };
    journal.forEach(function (e) {
      if (new Date(e.ts).toISOString().slice(0, 10) !== dk) return;
      if (e.type === "steps") t.steps = Math.max(t.steps, e.value || 0);
      else if (e.type === "water") t.water += e.value || 1;
      else if (e.type === "workout") t.workouts++;
      else if (e.type === "sleep") t.sleep = e.value;
    });
    if (dk === todayKey()) t.water = Math.max(t.water, waterCount || 0);
    return t;
  }
  function dayMet(dk, kind) {
    var t = dayTotals(dk);
    if (kind === "steps") return t.steps >= stepGoal();
    if (kind === "water") return t.water >= WATER_GOAL;
    return false;
  }
  function computeStreak(kind) {
    var c = 0;
    var start = dayMet(dayKeyOffset(0), kind) ? 0 : 1; // an unfinished today doesn't break it
    for (var i = start; i < 366; i++) {
      if (dayMet(dayKeyOffset(i), kind)) c++;
      else break;
    }
    return c;
  }
  function workoutsThisWeek() {
    var n = 0;
    for (var i = 0; i < 7; i++) n += dayTotals(dayKeyOffset(i)).workouts;
    return n;
  }
  function renderStreaks() {
    if (!streaksEl) return;
    var ss = computeStreak("steps"), ws = computeStreak("water"), ww = workoutsThisWeek();
    var stepsToday = dayMet(todayKey(), "steps"), waterToday = dayMet(todayKey(), "water");
    function tile(emoji, value, label, hit) {
      return '<div class="stat-tile' + (hit ? " streak-hit" : "") + '"><span class="stat-emoji">' + emoji +
        '</span><span class="stat-value">' + value + '</span><span class="stat-label">' + label + "</span></div>";
    }
    streaksEl.innerHTML =
      tile("🔥", ss + "<small> day" + (ss === 1 ? "" : "s") + "</small>", "Step streak · goal " + stepGoal().toLocaleString(), stepsToday) +
      tile("💧", ws + "<small> day" + (ws === 1 ? "" : "s") + "</small>", "Water streak · goal " + WATER_GOAL, waterToday) +
      tile("🏋️", String(ww), "Workouts this week", ww >= 3);
  }
  function checkCelebrations() {
    [["steps", "🔥", "Step goal hit!", function () { return "You reached " + stepGoal().toLocaleString() + " steps — " + computeStreak("steps") + "-day streak!"; }],
     ["water", "💧", "Water goal hit!", function () { return WATER_GOAL + " glasses today — " + computeStreak("water") + "-day streak!"; }]
    ].forEach(function (g) {
      var kind = g[0], flag = "vh-cele-" + kind + "-" + todayKey();
      var done = false;
      try { done = localStorage.getItem(flag) === "1"; } catch (e) {}
      if (!done && dayMet(todayKey(), kind)) {
        try { localStorage.setItem(flag, "1"); } catch (e) {}
        var body = g[3]();
        showToast(g[1], g[2], body);
        if (assistantOpen) { botSay(g[1] + " " + g[2] + " " + body); speak(g[2] + " " + body); }
      }
    });
  }
  document.addEventListener("vh:journal-changed", function () { renderStreaks(); checkCelebrations(); renderHistory(); });
  document.addEventListener("vh:water-changed", function () { renderStreaks(); checkCelebrations(); });

  /* =====================================================================
     Weekly recap
     ===================================================================== */
  var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  function weeklyRecap() {
    var days = [];
    for (var i = 6; i >= 0; i--) days.push(dayKeyOffset(i));
    var stepVals = [], sleepVals = [], waterVals = [], moodScores = [], workoutTotal = 0;
    var bestSleep = null, weights = [];
    days.forEach(function (dk) {
      var t = dayTotals(dk);
      if (t.steps > 0) stepVals.push(t.steps);
      if (t.water > 0) waterVals.push(t.water);
      if (t.sleep != null) {
        sleepVals.push(t.sleep);
        if (!bestSleep || t.sleep > bestSleep.h) bestSleep = { h: t.sleep, day: WEEKDAYS[new Date(dk + "T12:00:00").getDay()] };
      }
      workoutTotal += t.workouts;
    });
    journal.forEach(function (e) {
      var dk = new Date(e.ts).toISOString().slice(0, 10);
      if (days.indexOf(dk) === -1) return;
      if (e.type === "mood" && e.score != null) moodScores.push(e.score);
      if (e.type === "weight" && e.value != null) weights.push({ ts: e.ts, kg: e.unit === "lb" ? e.value * 0.453592 : e.value });
    });
    var daysLogged = stepVals.length || sleepVals.length || waterVals.length || workoutTotal;
    if (!daysLogged) {
      return "Not much logged this week yet — give me a few days of data and I'll have a proper recap for you. Try \"log water\" or sync your watch! 🌿";
    }
    function avg(a) { return a.length ? a.reduce(function (s, v) { return s + v; }, 0) / a.length : 0; }
    var pname = profileName();
    var lines = ["📅 Your week" + (pname ? ", " + pname : "") + ":"];
    if (stepVals.length) {
      var sAvg = Math.round(avg(stepVals));
      lines.push("👟 Steps: avg " + sAvg.toLocaleString() + "/day across " + stepVals.length + " day" + (stepVals.length === 1 ? "" : "s") +
        (sAvg >= stepGoal() ? " — above your goal! 🔥" : " (goal: " + stepGoal().toLocaleString() + ")"));
    }
    if (workoutTotal) lines.push("🏋️ Workouts: " + workoutTotal + " this week" + (workoutTotal >= 3 ? " — strong! 💪" : ""));
    if (sleepVals.length) {
      lines.push("😴 Sleep: avg " + (Math.round(avg(sleepVals) * 10) / 10) + " h" +
        (bestSleep ? " — best was " + bestSleep.h + " h on " + bestSleep.day : ""));
    }
    if (waterVals.length) lines.push("💧 Water: avg " + (Math.round(avg(waterVals) * 10) / 10) + " glasses/day");
    if (moodScores.length) {
      var m = avg(moodScores);
      lines.push((m >= 4 ? "😄" : m >= 3 ? "🙂" : "😔") + " Mood: " + (m >= 4 ? "mostly great" : m >= 3 ? "steady" : "a rough one — be kind to yourself"));
    }
    if (weights.length >= 2) {
      weights.sort(function (a, b) { return a.ts - b.ts; });
      var dw = weights[weights.length - 1].kg - weights[0].kg;
      var dwPref = Math.abs(Math.round((currentWUnit() === "lb" ? dw / 0.453592 : dw) * 10) / 10);
      lines.push("⚖️ Weight: " + (Math.abs(dw) < 0.05 ? "steady" : (dw < 0 ? "down " : "up ") + dwPref + " " + currentWUnit()) + " this week");
    }
    var streak = computeStreak("steps");
    if (streak >= 2) lines.push("🔥 You're on a " + streak + "-day step streak — keep it rolling!");
    return lines.join("\n");
  }

  /* =====================================================================
     Workout history
     ===================================================================== */
  var historyList = document.getElementById("history-list");
  var historyEmpty = document.getElementById("history-empty");
  function renderHistory() {
    if (!historyList) return;
    var items = journal.filter(function (e) { return e.type === "workout" || e.type === "lift"; })
      .slice().sort(function (a, b) { return b.ts - a.ts; });
    if (historyEmpty) historyEmpty.hidden = items.length > 0;
    var html = "", lastDay = "";
    items.slice(0, 60).forEach(function (e) {
      var d = new Date(e.ts);
      var dayLabel = d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
      if (dayLabel !== lastDay) { html += '<h3 class="topic-letter">' + dayLabel + "</h3>"; lastDay = dayLabel; }
      html += '<div class="history-row"><span class="h-emoji">' + e.emoji +
        '</span><span class="h-text">' + escapeHtml(e.text) +
        '</span><span class="h-time">' + timeLabel(e.ts) + "</span></div>";
    });
    historyList.innerHTML = html;
  }

  // Initial paint for everything personal
  applyProfileEverywhere();
  renderHistory();
  checkCelebrations();

  /* =====================================================================
     Backup & restore — one JSON file with everything personal
     ===================================================================== */
  var BACKUP_KEYS = ["vh-journal", "vh-reminders", "vh-profile", "vh-chat", "vh-habits",
    "vh-water", "vh-theme", "vh-view", "vh-view-explicit", "vh-wunit", "vh-level", "vh-voice"];
  function makeBackup() {
    var data = { app: "vitality-health", version: 1, exportedAt: new Date().toISOString(), store: {} };
    BACKUP_KEYS.forEach(function (k) {
      try {
        var v = localStorage.getItem(k);
        if (v != null) data.store[k] = v;
      } catch (e) {}
    });
    return data;
  }
  function downloadBackup() {
    var blob = new Blob([JSON.stringify(makeBackup(), null, 1)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "vitality-health-backup-" + todayKey() + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
  }
  function restoreBackup(text) {
    var data;
    try { data = JSON.parse(text); } catch (e) { return "That file isn't valid JSON."; }
    if (!data || data.app !== "vitality-health" || !data.store) {
      return "That doesn't look like a Vitality Health backup file.";
    }
    var restored = 0;
    BACKUP_KEYS.forEach(function (k) {
      if (typeof data.store[k] === "string") {
        try { localStorage.setItem(k, data.store[k]); restored++; } catch (e) {}
      }
    });
    if (!restored) return "The backup file was empty.";
    return null; // success
  }
  var backupBtn = document.getElementById("backup-btn");
  var restoreBtn = document.getElementById("restore-btn");
  var restoreFile = document.getElementById("restore-file");
  var backupMsg = document.getElementById("backup-msg");
  if (backupBtn) backupBtn.addEventListener("click", function () {
    downloadBackup();
    if (backupMsg) backupMsg.textContent = "Backup downloaded — keep it somewhere safe. 💾";
  });
  if (restoreBtn && restoreFile) {
    restoreBtn.addEventListener("click", function () { restoreFile.click(); });
    restoreFile.addEventListener("change", function () {
      var f = restoreFile.files && restoreFile.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        var err = restoreBackup(String(reader.result));
        if (err) {
          if (backupMsg) backupMsg.textContent = err;
          return;
        }
        if (backupMsg) backupMsg.textContent = "Restored! Reloading with your data…";
        setTimeout(function () { location.reload(); }, 800);
      };
      reader.readAsText(f);
    });
  }

  /* =====================================================================
     At-home workouts — no-equipment routines with a guided player that
     logs the finished session to the journal (streaks/history/charts).
     ===================================================================== */
  var HOME_CATS = { quick: "Quick", strength: "Strength", cardio: "Cardio & HIIT", recovery: "Stretch & recovery" };
  var HOME_WORKOUTS = [
    { id: "wake", emoji: "🌅", name: "Wake-up mobility", cat: "recovery", mins: 7, level: "All levels",
      desc: "Gentle joints-and-spine flow to start the day.",
      steps: [{ n: "March in place", t: 45 }, { n: "Cat–cow", t: 45 }, { n: "Standing side bends", t: 40 }, { n: "Hip circles", t: 40 }, { n: "Doorway chest stretch", t: 40 }, { n: "Hamstring stretch (left)", t: 40 }, { n: "Hamstring stretch (right)", t: 40 }, { n: "Slow deep squats", r: "6 reps" }, { n: "Shoulder rolls", t: 30 }] },
    { id: "desk", emoji: "🪑", name: "Desk-break reset", cat: "quick", mins: 5, level: "All levels",
      desc: "Undo an hour of sitting in five minutes.",
      steps: [{ n: "Neck rolls", t: 30 }, { n: "Shoulder rolls", t: 30 }, { n: "Doorway chest stretch", t: 40 }, { n: "Standing hip flexor stretch (left)", t: 35 }, { n: "Standing hip flexor stretch (right)", t: 35 }, { n: "Chair sit-to-stands", r: "10 reps" }, { n: "Calf raises", r: "15 reps" }, { n: "March in place", t: 45 }] },
    { id: "full15", emoji: "⚡", name: "15-minute full body", cat: "quick", mins: 15, level: "Beginner+",
      desc: "The classic no-excuses session — every major muscle.",
      steps: [{ n: "Jumping jacks (warm-up)", t: 45 }, { n: "Bodyweight squats", r: "12 reps" }, { n: "Incline or knee push-ups", r: "10 reps" }, { n: "Glute bridges", r: "12 reps" }, { n: "Rest", t: 30, rest: true }, { n: "Walking lunges", r: "8 each side" }, { n: "Plank", t: 30 }, { n: "Rest", t: 30, rest: true }, { n: "Squats (round 2)", r: "12 reps" }, { n: "Push-ups (round 2)", r: "10 reps" }, { n: "Bird-dog", r: "6 each side" }, { n: "Cool-down stretch", t: 60 }] },
    { id: "core10", emoji: "🎯", name: "10-minute core blast", cat: "strength", mins: 10, level: "Beginner+",
      desc: "Deep core, obliques, and lower back — floor only.",
      steps: [{ n: "Dead bug", r: "8 each side" }, { n: "Plank", t: 30 }, { n: "Rest", t: 20, rest: true }, { n: "Bicycle crunches", r: "16 total" }, { n: "Side plank (left)", t: 25 }, { n: "Side plank (right)", t: 25 }, { n: "Rest", t: 20, rest: true }, { n: "Glute bridge hold", t: 30 }, { n: "Bird-dog", r: "6 each side" }, { n: "Plank (final)", t: 30 }, { n: "Child's pose stretch", t: 40 }] },
    { id: "upper", emoji: "💪", name: "No-equipment upper body", cat: "strength", mins: 18, level: "Intermediate",
      desc: "Chest, shoulders, arms, and back with just the floor and a chair.",
      steps: [{ n: "Arm circles (warm-up)", t: 40 }, { n: "Push-ups", r: "10–12 reps" }, { n: "Chair tricep dips", r: "10 reps" }, { n: "Rest", t: 40, rest: true }, { n: "Pike push-ups", r: "8 reps" }, { n: "Doorframe rows or towel rows", r: "10 reps" }, { n: "Rest", t: 40, rest: true }, { n: "Push-ups (round 2)", r: "10 reps" }, { n: "Chair dips (round 2)", r: "10 reps" }, { n: "Plank shoulder taps", r: "12 total" }, { n: "Chest stretch", t: 40 }] },
    { id: "legs", emoji: "🦵", name: "Legs & glutes burner", cat: "strength", mins: 18, level: "Intermediate",
      desc: "Quads, glutes, and hamstrings — expect to feel the stairs tomorrow.",
      steps: [{ n: "March in place (warm-up)", t: 45 }, { n: "Bodyweight squats", r: "15 reps" }, { n: "Walking lunges", r: "10 each side" }, { n: "Rest", t: 40, rest: true }, { n: "Glute bridges", r: "15 reps" }, { n: "Wall sit", t: 40 }, { n: "Rest", t: 40, rest: true }, { n: "Squat pulses", r: "12 reps" }, { n: "Single-leg glute bridge (left)", r: "8 reps" }, { n: "Single-leg glute bridge (right)", r: "8 reps" }, { n: "Calf raises", r: "20 reps" }, { n: "Quad + hamstring stretch", t: 60 }] },
    { id: "hiit12", emoji: "🔥", name: "HIIT starter", cat: "cardio", mins: 12, level: "Beginner+",
      desc: "30 seconds on, 30 off — scale every move to your pace.",
      steps: [{ n: "Jumping jacks", t: 30 }, { n: "Rest", t: 30, rest: true }, { n: "Squat to stand", t: 30 }, { n: "Rest", t: 30, rest: true }, { n: "Mountain climbers", t: 30 }, { n: "Rest", t: 30, rest: true }, { n: "March or jog in place", t: 30 }, { n: "Rest", t: 30, rest: true }, { n: "Jumping jacks (round 2)", t: 30 }, { n: "Rest", t: 30, rest: true }, { n: "Mountain climbers (round 2)", t: 30 }, { n: "Cool-down walk in place", t: 90 }] },
    { id: "sweat20", emoji: "💦", name: "Sweat 20", cat: "cardio", mins: 20, level: "Intermediate",
      desc: "A bigger cardio circuit for when you want to really move.",
      steps: [{ n: "Jumping jacks (warm-up)", t: 60 }, { n: "Burpees (step back to scale)", r: "8 reps" }, { n: "Mountain climbers", t: 40 }, { n: "Rest", t: 30, rest: true }, { n: "Squat jumps or fast squats", r: "10 reps" }, { n: "High knees", t: 40 }, { n: "Rest", t: 30, rest: true }, { n: "Burpees (round 2)", r: "8 reps" }, { n: "Plank jacks", t: 30 }, { n: "Rest", t: 30, rest: true }, { n: "High knees (final)", t: 40 }, { n: "Cool-down walk + stretch", t: 90 }] },
    { id: "lowimpact", emoji: "🤫", name: "Quiet apartment cardio", cat: "cardio", mins: 15, level: "All levels",
      desc: "No jumping, no noise — downstairs neighbours never know.",
      steps: [{ n: "March in place", t: 60 }, { n: "Step-out jacks (no jump)", t: 45 }, { n: "Rest", t: 30, rest: true }, { n: "Fast bodyweight squats", r: "12 reps" }, { n: "Standing knee drives", t: 45 }, { n: "Rest", t: 30, rest: true }, { n: "Side steps with arm swings", t: 45 }, { n: "Wall push-ups", r: "12 reps" }, { n: "Standing march (final push)", t: 60 }, { n: "Cool-down stretch", t: 60 }] },
    { id: "wind", emoji: "🌙", name: "Evening wind-down stretch", cat: "recovery", mins: 10, level: "All levels",
      desc: "Slow stretches to switch your body into sleep mode.",
      steps: [{ n: "Neck rolls", t: 40 }, { n: "Cat–cow", t: 45 }, { n: "Child's pose", t: 60 }, { n: "Hamstring stretch (left)", t: 45 }, { n: "Hamstring stretch (right)", t: 45 }, { n: "Hip flexor stretch (left)", t: 45 }, { n: "Hip flexor stretch (right)", t: 45 }, { n: "Lying spinal twist (left)", t: 45 }, { n: "Lying spinal twist (right)", t: 45 }, { n: "Slow breathing, eyes closed", t: 60 }] },
  ];

  function homeRowHtml(r) {
    var stepsHtml = r.steps.map(function (s) {
      return "<li>" + s.n + " — <strong>" + (s.t ? s.t + "s" : s.r) + "</strong></li>";
    }).join("");
    return '<details class="topic-row"><summary>' +
      '<span class="topic-row-emoji" aria-hidden="true">' + r.emoji + "</span>" +
      '<span class="topic-row-name">' + r.name + "</span>" +
      '<span class="topic-row-cat">' + r.mins + " min · " + HOME_CATS[r.cat] + "</span>" +
      '<span class="topic-chevron" aria-hidden="true">▾</span></summary>' +
      '<div class="topic-body"><p class="routine-meta"><span>⏱ ' + r.mins + " min</span><span>📶 " + r.level + '</span><span>🧰 No equipment</span></p>' +
      "<p>" + r.desc + "</p><ol>" + stepsHtml + "</ol>" +
      '<button class="btn btn-small routine-start" type="button" data-routine="' + r.id + '">▶ Start guided workout</button>' +
      "</div></details>";
  }
  var homeListEl = document.getElementById("home-list");
  if (homeListEl) {
    buildDirectory({
      items: HOME_WORKOUTS,
      listEl: homeListEl,
      emptyEl: document.getElementById("home-empty"),
      searchEl: document.getElementById("home-search"),
      chipsEl: document.getElementById("home-chips"),
      cats: HOME_CATS,
      catOf: function (r) { return r.cat; },
      groupOf: function (r) { return HOME_CATS[r.cat]; },
      textOf: function (r) { return r.name + " " + r.desc + " " + r.level + " " + HOME_CATS[r.cat]; },
      rowHtml: homeRowHtml,
    });
    homeListEl.addEventListener("click", function (e) {
      var btn = e.target.closest(".routine-start");
      if (!btn) return;
      var r = null;
      HOME_WORKOUTS.forEach(function (x) { if (x.id === btn.dataset.routine) r = x; });
      if (r) startWorkout(r);
    });
  }

  /* ---- guided player ---- */
  var playerEl = document.getElementById("player");
  var playerTitle = document.getElementById("player-title");
  var playerProgress = document.getElementById("player-progress");
  var playerMove = document.getElementById("player-move");
  var playerTimer = document.getElementById("player-timer");
  var playerPause = document.getElementById("player-pause");
  var playerNext = document.getElementById("player-next");
  var playerNextup = document.getElementById("player-nextup");
  var playerExit = document.getElementById("player-exit");
  var pw = { routine: null, idx: 0, remaining: 0, interval: null, paused: false };

  function pwStop() {
    if (pw.interval) { clearInterval(pw.interval); pw.interval = null; }
  }
  function startWorkout(r) {
    pw.routine = r; pw.idx = 0; pw.paused = false;
    if (playerTitle) playerTitle.textContent = r.emoji + " " + r.name;
    if (playerEl) playerEl.hidden = false;
    speak("Starting " + r.name + ". First up: " + r.steps[0].n);
    runStep();
  }
  function runStep() {
    pwStop();
    var r = pw.routine;
    if (!r || pw.idx >= r.steps.length) { finishWorkout(); return; }
    var s = r.steps[pw.idx];
    if (playerProgress) playerProgress.textContent = "Move " + (pw.idx + 1) + " of " + r.steps.length;
    if (playerMove) playerMove.textContent = (s.rest ? "😮‍💨 " : "") + s.n;
    if (playerNextup) {
      var nxt = r.steps[pw.idx + 1];
      playerNextup.textContent = nxt ? "Next: " + nxt.n : "Last one — finish strong!";
    }
    if (s.t) {
      pw.remaining = s.t;
      playerTimer.classList.remove("rep-mode");
      playerTimer.textContent = pw.remaining + "s";
      if (playerPause) playerPause.hidden = false;
      if (playerNext) playerNext.textContent = "Skip ›";
      pw.interval = setInterval(function () {
        if (pw.paused) return;
        pw.remaining--;
        playerTimer.textContent = Math.max(0, pw.remaining) + "s";
        if (pw.remaining <= 0) { pw.idx++; announceNext(); runStep(); }
      }, 1000);
    } else {
      playerTimer.classList.add("rep-mode");
      playerTimer.textContent = s.r;
      if (playerPause) playerPause.hidden = true;
      if (playerNext) playerNext.textContent = "Done ✓";
    }
  }
  function announceNext() {
    var r = pw.routine;
    if (r && pw.idx < r.steps.length) speak(r.steps[pw.idx].n);
  }
  function finishWorkout() {
    pwStop();
    var r = pw.routine;
    if (playerEl) playerEl.hidden = true;
    if (!r) return;
    addEntry("workout", "🏠", "At-home: " + r.name + " (" + r.mins + " min)", r.mins, "min");
    showToast("🏠", "Workout complete!", r.name + " — " + r.mins + " min logged to your journal. 💪");
    speak("Workout complete. " + r.name + " logged. Great job!");
    if (assistantOpen) botSay("🏠 " + r.name + " complete — " + r.mins + " min logged to your journal. Great work! 💪");
    pw.routine = null;
  }
  if (playerNext) playerNext.addEventListener("click", function () {
    pw.idx++;
    announceNext();
    runStep();
  });
  if (playerPause) playerPause.addEventListener("click", function () {
    pw.paused = !pw.paused;
    playerPause.textContent = pw.paused ? "Resume" : "Pause";
  });
  if (playerExit) playerExit.addEventListener("click", function () {
    pwStop();
    pw.routine = null;
    if (playerEl) playerEl.hidden = true;
  });

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

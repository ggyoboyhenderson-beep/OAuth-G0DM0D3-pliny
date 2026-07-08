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

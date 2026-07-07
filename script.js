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

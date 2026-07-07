// ===== Vitality — health website interactions =====
(function () {
  "use strict";

  // ---- Footer year ----
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---- Mobile nav ----
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // ---- BMI calculator ----
  var bmiForm = document.getElementById("bmi-form");
  if (bmiForm) {
    bmiForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var h = parseFloat(document.getElementById("bmi-height").value);
      var w = parseFloat(document.getElementById("bmi-weight").value);
      var out = document.getElementById("bmi-result");
      if (!h || !w || h <= 0 || w <= 0) {
        out.className = "tool-result show";
        out.textContent = "Please enter a valid height and weight.";
        return;
      }
      var m = h / 100;
      var bmi = w / (m * m);
      var cat, note;
      if (bmi < 18.5) { cat = "Underweight"; note = "Consider nourishing, calorie-dense whole foods."; }
      else if (bmi < 25) { cat = "Healthy range"; note = "Great — keep up your balanced habits."; }
      else if (bmi < 30) { cat = "Overweight"; note = "Small, steady changes add up over time."; }
      else { cat = "Obese"; note = "A healthcare professional can help you plan."; }
      out.className = "tool-result show";
      out.innerHTML =
        "Your BMI is <strong>" + bmi.toFixed(1) + "</strong><br />" +
        "<span class='cat'>" + cat + "</span> — " + note;
    });
  }

  // ---- Water intake ----
  var waterForm = document.getElementById("water-form");
  if (waterForm) {
    waterForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var w = parseFloat(document.getElementById("water-weight").value);
      var factor = parseFloat(document.getElementById("water-activity").value);
      var out = document.getElementById("water-result");
      if (!w || w <= 0) {
        out.className = "tool-result show";
        out.textContent = "Please enter a valid weight.";
        return;
      }
      // ~35 ml per kg, scaled by activity
      var ml = w * 35 * factor;
      var liters = ml / 1000;
      var glasses = Math.round(ml / 250);
      out.className = "tool-result show";
      out.innerHTML =
        "Aim for about <strong>" + liters.toFixed(1) + " L</strong><br />" +
        "roughly " + glasses + " glasses (250 ml) through the day.";
    });
  }

  // ---- Box breathing ----
  var breatheToggle = document.getElementById("breathe-toggle");
  var circle = document.getElementById("breathe-circle");
  var text = document.getElementById("breathe-text");
  if (breatheToggle && circle && text) {
    var phases = [
      { label: "Inhale", grow: true },
      { label: "Hold", grow: true },
      { label: "Exhale", grow: false },
      { label: "Hold", grow: false }
    ];
    var idx = 0;
    var timer = null;
    var running = false;

    function step() {
      var p = phases[idx];
      text.textContent = p.label;
      circle.classList.toggle("grow", p.grow);
      idx = (idx + 1) % phases.length;
    }

    breatheToggle.addEventListener("click", function () {
      running = !running;
      if (running) {
        breatheToggle.textContent = "Stop";
        idx = 0;
        step();
        timer = setInterval(step, 4000);
      } else {
        breatheToggle.textContent = "Begin";
        clearInterval(timer);
        circle.classList.remove("grow");
        text.textContent = "Ready";
      }
    });
  }

  // ---- Daily tips ----
  var tips = [
    "Drink a glass of water right after you wake up to rehydrate.",
    "Take a 5-minute stretch break for every hour you sit.",
    "Add one extra serving of vegetables to your next meal.",
    "Step outside for a few minutes of natural morning light.",
    "Swap one sugary drink today for water or unsweetened tea.",
    "Try a 10-minute walk after your largest meal.",
    "Put your phone away 30 minutes before bed for better sleep.",
    "Practice three slow, deep breaths before a stressful task.",
    "Stand up and roll your shoulders to release tension.",
    "Choose stairs over the elevator when you can.",
    "Prep a healthy snack now so it's ready when hunger hits.",
    "Write down one thing you're grateful for today.",
    "Aim to finish eating dinner a few hours before bedtime.",
    "Keep a water bottle within arm's reach all day."
  ];
  var tipText = document.getElementById("tip-text");
  var tipNext = document.getElementById("tip-next");
  var lastTip = -1;
  function showTip() {
    if (!tipText) return;
    var i;
    do { i = Math.floor(Math.random() * tips.length); }
    while (i === lastTip && tips.length > 1);
    lastTip = i;
    tipText.textContent = tips[i];
  }
  if (tipText) showTip();
  if (tipNext) tipNext.addEventListener("click", showTip);
})();

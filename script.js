/* ===== Vitalis — interactivity ===== */
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

  /* ===== BMI calculator ===== */
  var bmiForm = document.getElementById("bmi-form");
  var bmiResult = document.getElementById("bmi-result");
  var unitBtns = document.querySelectorAll(".unit-btn");
  var metricRow = document.querySelector("[data-metric]");
  var imperialRow = document.querySelector("[data-imperial]");
  var currentUnits = "metric";

  unitBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      currentUnits = btn.dataset.units;
      unitBtns.forEach(function (b) { b.classList.toggle("is-active", b === btn); });
      metricRow.classList.toggle("is-hidden", currentUnits !== "metric");
      imperialRow.classList.toggle("is-hidden", currentUnits !== "imperial");
      if (bmiResult) bmiResult.innerHTML = "";
    });
  });

  function num(id) {
    var v = parseFloat(document.getElementById(id).value);
    return isNaN(v) ? 0 : v;
  }

  function bmiCategory(bmi) {
    if (bmi < 18.5) return { label: "Underweight", cls: "badge-low" };
    if (bmi < 25) return { label: "Healthy weight", cls: "badge-normal" };
    if (bmi < 30) return { label: "Overweight", cls: "badge-high" };
    return { label: "Obese", cls: "badge-vhigh" };
  }

  if (bmiForm) {
    bmiForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var heightM, weightKg;

      if (currentUnits === "metric") {
        heightM = num("height-cm") / 100;
        weightKg = num("weight-kg");
      } else {
        var totalInches = num("height-ft") * 12 + num("height-in");
        heightM = totalInches * 0.0254;
        weightKg = num("weight-lb") * 0.45359237;
      }

      if (heightM <= 0 || weightKg <= 0) {
        bmiResult.innerHTML = "<span style='color:#b91c1c'>Please enter valid height and weight.</span>";
        return;
      }

      var bmi = weightKg / (heightM * heightM);
      if (!isFinite(bmi) || bmi <= 0 || bmi > 200) {
        bmiResult.innerHTML = "<span style='color:#b91c1c'>Those numbers don't look right — please check them.</span>";
        return;
      }

      var cat = bmiCategory(bmi);
      bmiResult.innerHTML =
        "Your BMI is <strong>" + bmi.toFixed(1) + "</strong><br />" +
        "<span class='badge " + cat.cls + "'>" + cat.label + "</span>";
    });
  }

  /* ===== Water intake ===== */
  var waterForm = document.getElementById("water-form");
  var waterResult = document.getElementById("water-result");
  if (waterForm) {
    waterForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var kg = num("water-weight");
      var activity = parseInt(document.getElementById("water-activity").value, 10) || 0;
      if (kg <= 0) {
        waterResult.innerHTML = "<span style='color:#b91c1c'>Please enter your weight.</span>";
        return;
      }
      // Base: ~35 ml per kg, plus activity bump
      var ml = kg * 35 + activity * 350;
      var litres = ml / 1000;
      var glasses = Math.round(ml / 250);
      waterResult.innerHTML =
        "Aim for <strong>" + litres.toFixed(1) + " L</strong> a day<br />" +
        "<span class='badge badge-normal'>about " + glasses + " glasses</span>";
    });
  }

  /* ===== Box breathing ===== */
  var ring = document.getElementById("breath-ring");
  var text = document.getElementById("breath-text");
  var breathBtn = document.getElementById("breath-toggle");
  var phases = [
    { label: "Breathe in", grow: true, ms: 4000 },
    { label: "Hold", grow: true, ms: 4000 },
    { label: "Breathe out", grow: false, ms: 4000 },
    { label: "Hold", grow: false, ms: 4000 }
  ];
  var breathing = false;
  var phaseIndex = 0;
  var timer = null;

  function runPhase() {
    var p = phases[phaseIndex];
    text.textContent = p.label;
    ring.classList.toggle("grow", p.grow);
    timer = setTimeout(function () {
      phaseIndex = (phaseIndex + 1) % phases.length;
      runPhase();
    }, p.ms);
  }

  function stopBreathing() {
    breathing = false;
    clearTimeout(timer);
    ring.classList.remove("grow");
    text.textContent = "Ready?";
    breathBtn.textContent = "Start";
  }

  if (breathBtn) {
    breathBtn.addEventListener("click", function () {
      if (breathing) {
        stopBreathing();
      } else {
        breathing = true;
        phaseIndex = 0;
        breathBtn.textContent = "Stop";
        runPhase();
      }
    });
  }

  /* ===== Newsletter signup (client-side only) ===== */
  var signup = document.getElementById("signup-form");
  var signupMsg = document.getElementById("signup-msg");
  if (signup) {
    signup.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("email").value.trim();
      var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!valid) {
        signupMsg.style.color = "#b91c1c";
        signupMsg.textContent = "Please enter a valid email address.";
        return;
      }
      signupMsg.style.color = "";
      signupMsg.textContent = "You're in! Check your inbox on Monday. 🌱";
      signup.reset();
    });
  }
})();

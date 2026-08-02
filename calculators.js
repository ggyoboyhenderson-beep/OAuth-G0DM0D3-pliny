/* Vitality Health — pure calculation functions.
   Kept in one place, with no DOM access, so the numbers people trust can
   be unit-tested (see test/calculators.test.js). Loaded before script.js
   and exported for Node so the browser stays buildless. */
(function (root) {
  "use strict";

  var LB_TO_KG = 0.453592;
  var IN_TO_CM = 2.54;

  // Minimum daily calories we will ever suggest. Aligned with the
  // AHA/ACC/TOS obesity guidelines; below this needs medical supervision.
  var CALORIE_FLOOR = { male: 1500, female: 1200 };

  function toKg(value, unit) { return unit === "lb" ? value * LB_TO_KG : value; }
  function toCm(value, unit) { return unit === "in" ? value * IN_TO_CM : value; }

  /* ---- BMI ---- */
  function bmi(height, weight, unit) {
    if (!(height > 0) || !(weight > 0)) return null;
    var v = unit === "imperial"
      ? (703 * weight) / (height * height)          // lb / in²
      : weight / Math.pow(height / 100, 2);         // kg / m²
    return Math.round(v * 10) / 10;
  }

  function bmiCategory(value) {
    if (value == null) return null;
    if (value < 18.5) return "Underweight";
    if (value < 25) return "Normal weight";
    if (value < 30) return "Overweight";
    return "Obese";
  }

  /* ---- Energy: Mifflin-St Jeor ---- */
  function bmr(kg, cm, age, sex) {
    if (!(kg > 0) || !(cm > 0) || !(age > 0)) return null;
    return 10 * kg + 6.25 * cm - 5 * age + (sex === "male" ? 5 : -161);
  }

  function tdee(kg, cm, age, sex, activity) {
    var b = bmr(kg, cm, age, sex);
    return b == null ? null : b * activity;
  }

  // Returns the goal calories AND whether the safety floor was applied,
  // so the UI can always tell the user when it clamped.
  function goalCalories(opts) {
    var t = tdee(opts.kg, opts.cm, opts.age, opts.sex, opts.activity);
    if (t == null) return null;
    var adjusted = opts.goal === "cut" ? t - 400
      : opts.goal === "bulk" ? t + 350
      : t;
    adjusted = Math.round(adjusted / 10) * 10;
    var floor = CALORIE_FLOOR[opts.sex === "male" ? "male" : "female"];
    var floored = adjusted < floor;
    return { calories: floored ? floor : adjusted, floored: floored, floor: floor };
  }

  function macros(calories, kg, goal) {
    if (!(calories > 0) || !(kg > 0)) return null;
    var perKg = goal === "cut" ? 2.2 : goal === "bulk" ? 2.0 : 1.8;
    var protein = Math.round(perKg * kg);
    var fat = Math.round((calories * 0.25) / 9);
    var carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
    return { protein: protein, fat: fat, carbs: carbs };
  }

  /* ---- Strength: Epley ---- */
  function oneRepMax(weight, reps) {
    if (!(weight > 0) || !(reps >= 1)) return null;
    var r = Math.min(12, Math.round(reps));
    var v = r === 1 ? weight : weight * (1 + r / 30);
    return Math.round(v * 10) / 10;
  }

  var API = {
    LB_TO_KG: LB_TO_KG, IN_TO_CM: IN_TO_CM, CALORIE_FLOOR: CALORIE_FLOOR,
    toKg: toKg, toCm: toCm,
    bmi: bmi, bmiCategory: bmiCategory,
    bmr: bmr, tdee: tdee, goalCalories: goalCalories, macros: macros,
    oneRepMax: oneRepMax,
  };

  root.VH_CALC = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof self !== "undefined" ? self : this);

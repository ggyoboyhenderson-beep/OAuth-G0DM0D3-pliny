/* Unit tests for the numbers people trust.
   Run: node --test test/   (Node 18+, no dependencies) */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const C = require("../calculators.js");

const close = (a, b, tol = 0.05) =>
  assert.ok(Math.abs(a - b) <= tol, `expected ${a} to be within ${tol} of ${b}`);

/* ---------- BMI ---------- */
test("BMI metric: 180cm / 80kg = 24.7", () => {
  assert.equal(C.bmi(180, 80, "metric"), 24.7);
});

test("BMI imperial: 71in / 176lb ≈ 24.5", () => {
  close(C.bmi(71, 176, "imperial"), 24.5, 0.1);
});

test("BMI metric and imperial agree for the same body", () => {
  const metric = C.bmi(180, 80, "metric");
  const imperial = C.bmi(180 / C.IN_TO_CM, 80 / C.LB_TO_KG, "imperial");
  close(metric, imperial, 0.1);
});

test("BMI rejects nonsense input", () => {
  assert.equal(C.bmi(0, 80, "metric"), null);
  assert.equal(C.bmi(180, 0, "metric"), null);
  assert.equal(C.bmi(-180, 80, "metric"), null);
});

test("BMI categories sit on the published boundaries", () => {
  assert.equal(C.bmiCategory(18.4), "Underweight");
  assert.equal(C.bmiCategory(18.5), "Normal weight");
  assert.equal(C.bmiCategory(24.9), "Normal weight");
  assert.equal(C.bmiCategory(25), "Overweight");
  assert.equal(C.bmiCategory(29.9), "Overweight");
  assert.equal(C.bmiCategory(30), "Obese");
});

/* ---------- Mifflin-St Jeor ---------- */
test("BMR matches the published worked example (male)", () => {
  // 10(80) + 6.25(180) - 5(30) + 5 = 1780
  close(C.bmr(80, 180, 30, "male"), 1780);
});

test("BMR matches the published worked example (female)", () => {
  // 10(65) + 6.25(165) - 5(30) - 161 = 1370.25
  close(C.bmr(65, 165, 30, "female"), 1370.25);
});

test("BMR is 166 kcal higher for males at identical size", () => {
  close(C.bmr(70, 175, 30, "male") - C.bmr(70, 175, 30, "female"), 166);
});

test("TDEE scales BMR by the activity multiplier", () => {
  close(C.tdee(80, 180, 30, "male", 1.55), 1780 * 1.55);
});

/* ---------- Calorie goals + the safety floor ---------- */
test("maintain returns TDEE, cut subtracts 400, bulk adds 350", () => {
  const base = { kg: 80, cm: 180, age: 30, sex: "male", activity: 1.55 };
  const maintain = C.goalCalories({ ...base, goal: "maintain" }).calories;
  const cut = C.goalCalories({ ...base, goal: "cut" }).calories;
  const bulk = C.goalCalories({ ...base, goal: "bulk" }).calories;
  close(cut, maintain - 400, 10);
  close(bulk, maintain + 350, 10);
});

test("SAFETY: never returns below 1200 kcal for women", () => {
  // Small, elderly, sedentary, cutting — computes far below the floor.
  const r = C.goalCalories({ kg: 45, cm: 150, age: 80, sex: "female", activity: 1.2, goal: "cut" });
  assert.equal(r.calories, 1200);
  assert.equal(r.floored, true);
});

test("SAFETY: never returns below 1500 kcal for men", () => {
  const r = C.goalCalories({ kg: 50, cm: 155, age: 80, sex: "male", activity: 1.2, goal: "cut" });
  assert.equal(r.calories, 1500);
  assert.equal(r.floored, true);
});

test("SAFETY: no combination of plausible inputs breaches the floor", () => {
  for (const sex of ["male", "female"]) {
    const floor = C.CALORIE_FLOOR[sex];
    for (let kg = 35; kg <= 200; kg += 5) {
      for (let cm = 140; cm <= 210; cm += 10) {
        for (let age = 12; age <= 100; age += 8) {
          for (const activity of [1.2, 1.375, 1.55, 1.725, 1.9]) {
            const r = C.goalCalories({ kg, cm, age, sex, activity, goal: "cut" });
            assert.ok(r.calories >= floor,
              `breach: ${sex} ${kg}kg ${cm}cm ${age}y a${activity} -> ${r.calories}`);
          }
        }
      }
    }
  }
});

test("floored flag is false for a normal goal", () => {
  const r = C.goalCalories({ kg: 80, cm: 180, age: 30, sex: "male", activity: 1.55, goal: "cut" });
  assert.equal(r.floored, false);
  assert.ok(r.calories > 2000);
});

/* ---------- Macros ---------- */
test("macros hit the calorie total within rounding", () => {
  const kcal = 2500, kg = 80;
  const m = C.macros(kcal, kg, "maintain");
  close(m.protein * 4 + m.carbs * 4 + m.fat * 9, kcal, 12);
});

test("protein scales with goal: cut > bulk > maintain per kg", () => {
  const kg = 80;
  const cut = C.macros(2500, kg, "cut").protein;
  const bulk = C.macros(2500, kg, "bulk").protein;
  const maintain = C.macros(2500, kg, "maintain").protein;
  assert.ok(cut > bulk && bulk > maintain);
});

test("macros never go negative on a low-calorie, high-bodyweight case", () => {
  const m = C.macros(1200, 120, "cut");
  assert.ok(m.carbs >= 0 && m.protein > 0 && m.fat > 0);
});

/* ---------- Epley 1RM ---------- */
test("1RM at 1 rep is the weight itself", () => {
  assert.equal(C.oneRepMax(100, 1), 100);
});

test("1RM 100kg x 5 = 116.7 (Epley)", () => {
  assert.equal(C.oneRepMax(100, 5), 116.7);
});

test("1RM 80kg x 5 = 93.3 (matches Vita's reply)", () => {
  assert.equal(C.oneRepMax(80, 5), 93.3);
});

test("1RM increases monotonically with reps", () => {
  let prev = 0;
  for (let r = 1; r <= 12; r++) {
    const v = C.oneRepMax(100, r);
    assert.ok(v >= prev, `reps ${r} produced ${v} after ${prev}`);
    prev = v;
  }
});

test("1RM caps reps at 12 so the estimate stays in a sane range", () => {
  assert.equal(C.oneRepMax(100, 20), C.oneRepMax(100, 12));
});

test("1RM rejects nonsense input", () => {
  assert.equal(C.oneRepMax(0, 5), null);
  assert.equal(C.oneRepMax(100, 0), null);
});

/* ---------- Unit conversion ---------- */
test("weight and height conversions round-trip", () => {
  close(C.toKg(C.toKg(80, "kg") / C.LB_TO_KG, "lb"), 80, 0.01);
  close(C.toCm(C.toCm(180, "cm") / C.IN_TO_CM, "in"), 180, 0.01);
});

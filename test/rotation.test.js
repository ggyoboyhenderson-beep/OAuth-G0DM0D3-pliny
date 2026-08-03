/* Weekly featured rotation — determinism and no-repeat guarantees.
   Run: node --test test/rotation.test.js */
const test = require("node:test");
const assert = require("node:assert");
const R = require("../rotation.js");

const pool = (n) => Array.from({ length: n }, (_, i) => "item-" + i);
const d = (y, m, day) => new Date(y, m - 1, day);

/* ---------------- week identity ---------------- */

test("weekId matches known ISO-8601 weeks", () => {
  // 4 Jan 2026 is a Sunday -> still ISO week 1 of 2026.
  assert.equal(R.weekId(d(2026, 1, 4)), "2026-W01");
  assert.equal(R.weekId(d(2026, 1, 5)), "2026-W02");
  // 1 Jan 2027 is a Friday -> ISO week 53 of 2026.
  assert.equal(R.weekId(d(2027, 1, 1)), "2026-W53");
});

test("weekIndex is constant Mon..Sun and increments exactly once per week", () => {
  const mon = d(2026, 8, 3); // Monday
  const base = R.weekIndex(mon);
  for (let i = 0; i < 7; i++) {
    const day = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + i);
    assert.equal(R.weekIndex(day), base, "day +" + i + " should stay in the same week");
  }
  const nextMon = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 7);
  assert.equal(R.weekIndex(nextMon), base + 1);
});

test("weekIndex stays monotonic across the year boundary", () => {
  // ISO week numbers restart at 1; the counter must not.
  let prev = R.weekIndex(d(2026, 12, 7));
  for (let i = 1; i <= 8; i++) {
    const cur = R.weekIndex(new Date(2026, 11, 7 + i * 7));
    assert.equal(cur, prev + 1, "week " + i + " past 7 Dec 2026");
    prev = cur;
  }
});

/* ---------------- determinism ---------------- */

test("same week + same salt => identical picks (every device agrees)", () => {
  const p = pool(49);
  const a = R.weeklyPicks(p, 2, "topics", d(2026, 8, 3)); // Monday
  const b = R.weeklyPicks(p, 2, "topics", d(2026, 8, 6)); // Thursday, same week
  const c = R.weeklyPicks(p, 2, "topics", d(2026, 8, 9)); // Sunday, same week
  assert.deepEqual(a, b);
  assert.deepEqual(a, c);
});

test("different weeks => different picks", () => {
  const p = pool(49);
  const wk1 = R.weeklyPicks(p, 2, "topics", d(2026, 8, 3));
  const wk2 = R.weeklyPicks(p, 2, "topics", d(2026, 8, 10));
  assert.notDeepEqual(wk1, wk2);
});

test("different salts pick independently in the same week", () => {
  const p = pool(49);
  const a = R.weeklyPicks(p, 2, "topics", d(2026, 8, 3));
  const b = R.weeklyPicks(p, 2, "faqs", d(2026, 8, 3));
  assert.notDeepEqual(a, b);
});

test("picks within a week are distinct", () => {
  const p = pool(49);
  for (let w = 0; w < 60; w++) {
    const got = R.weeklyPicks(p, 3, "topics", new Date(2026, 0, 5 + w * 7));
    assert.equal(new Set(got).size, got.length, "week " + w + " repeated an item within itself");
  }
});

/* ---------------- the no-repeat window ---------------- */

test("window >= floor(N/k) weeks starting from ANY week, not just a boundary", () => {
  const cases = [
    { N: 49, k: 2 }, // Health A-Z  -> 24 weeks
    { N: 29, k: 1 }, // Q&A         -> 29 weeks
    { N: 6, k: 1 },  // blog        ->  6 weeks
    { N: 33, k: 4 }, //             ->  8 weeks
  ];
  for (const { N, k } of cases) {
    const p = pool(N);
    const window = Math.floor(N / k);
    // Slide the window across two full passes; a boundary-only guarantee fails here.
    for (let offset = 0; offset < 2 * N; offset++) {
      const seen = [];
      for (let w = 0; w < window; w++) {
        seen.push(...R.weeklyPicks(p, k, "s" + N, new Date(2026, 0, 5 + (offset + w) * 7)));
      }
      assert.equal(
        new Set(seen).size, seen.length,
        `N=${N} k=${k}: an item reappeared inside the ${window}-week window starting at +${offset}`
      );
    }
  }
});

test("a full pass covers the whole pool", () => {
  const N = 12, k = 3;
  const p = pool(N);
  const seen = new Set();
  for (let w = 0; w < N / k; w++) {
    R.weeklyPicks(p, k, "cover", new Date(2026, 0, 5 + w * 7)).forEach((x) => seen.add(x));
  }
  assert.equal(seen.size, N, "one pass should surface every item exactly once");
});

test("groupings shift between passes when N is not a multiple of k", () => {
  const N = 49, k = 2; // the shipped Health A-Z config
  const p = pool(N);
  const read = (start) =>
    Array.from({ length: 5 }, (_, w) =>
      R.weeklyPicks(p, k, "topics", new Date(2026, 0, 5 + (start + w) * 7)).join("+"));
  // N/k is not an integer, so the same week-of-pass yields different pairings.
  assert.notDeepEqual(read(0), read(Math.ceil(N / k)));
});

test("an item recurs on an exact N/k-week period", () => {
  const N = 12, k = 3; // 4-week period
  const p = pool(N);
  const at = (w) => R.weeklyPicks(p, k, "period", new Date(2026, 0, 5 + w * 7));
  for (let w = 0; w < 20; w++) {
    assert.deepEqual(at(w), at(w + N / k), "week " + w + " should recur " + N / k + " weeks later");
  }
});

/* ---------------- safeCount ---------------- */

test("safeCount caps k so the no-repeat window stays >= 6 weeks", () => {
  assert.equal(R.safeCount(49, 2), 2);   // 49/2 = 24 weeks, well clear
  assert.equal(R.safeCount(49, 99), 8);  // capped at floor(49/6)
  assert.equal(R.safeCount(29, 1), 1);
  assert.equal(R.safeCount(29, 99), 4);
  assert.equal(R.safeCount(6, 1), 1);
  assert.equal(R.safeCount(6, 3), 1);    // floor(6/6) = 1
});

test("safeCount never returns more than the pool holds, and 0 for an empty pool", () => {
  assert.equal(R.safeCount(0, 3), 0);
  assert.equal(R.safeCount(1, 3), 1);
  assert.equal(R.safeCount(3, 3), 1);    // tiny pool: 1 rather than exhausting it weekly
});

test("safeCount honours a custom minimum window", () => {
  assert.equal(R.safeCount(49, 99, 12), 4);
  assert.equal(R.safeCount(49, 99, 49), 1);
});

/* ---------------- edges ---------------- */

test("degenerate inputs return empty rather than throwing", () => {
  assert.deepEqual(R.weeklyPicks([], 3, "x", d(2026, 8, 3)), []);
  assert.deepEqual(R.weeklyPicks(pool(5), 0, "x", d(2026, 8, 3)), []);
  assert.deepEqual(R.weeklyPicks(pool(5), -1, "x", d(2026, 8, 3)), []);
});

test("k larger than the pool returns the whole pool, no duplicates", () => {
  const got = R.weeklyPicks(pool(3), 10, "x", d(2026, 8, 3));
  assert.equal(got.length, 3);
  assert.equal(new Set(got).size, 3);
});

test("seededShuffle is a permutation and is reproducible", () => {
  const p = pool(20);
  const a = R.seededShuffle(p, R.mulberry32(R.hashSeed("seed")));
  const b = R.seededShuffle(p, R.mulberry32(R.hashSeed("seed")));
  assert.deepEqual(a, b);
  assert.deepEqual(a.slice().sort(), p.slice().sort());
  assert.deepEqual(p, pool(20), "input array must not be mutated");
});

test("hashSeed is stable and spreads salts apart", () => {
  assert.equal(R.hashSeed("topics:0"), R.hashSeed("topics:0"));
  assert.notEqual(R.hashSeed("topics:0"), R.hashSeed("topics:1"));
  assert.notEqual(R.hashSeed("topics:0"), R.hashSeed("faqs:0"));
});

test("mulberry32 stays within [0,1)", () => {
  const rng = R.mulberry32(R.hashSeed("range"));
  for (let i = 0; i < 5000; i++) {
    const v = rng();
    assert.ok(v >= 0 && v < 1, "out of range: " + v);
  }
});

/* ---------------- the real pools, for 5 years ---------------- */

test("LIVE CONFIG: no repeat inside 6 weeks for the shipped pools, 2026-2031", () => {
  const config = [
    { name: "topics", N: 49, k: 2 },
    { name: "faqs", N: 29, k: 1 },
    { name: "posts", N: 6, k: 1 },
  ];
  for (const { name, N, k } of config) {
    const p = pool(N);
    const recent = [];
    for (let w = 0; w < 52 * 5; w++) {
      const got = R.weeklyPicks(p, k, name, new Date(2026, 0, 5 + w * 7));
      assert.equal(got.length, k, name + " week " + w + " returned " + got.length);
      for (const item of got) {
        assert.ok(!recent.includes(item), `${name}: ${item} repeated within 6 weeks at week ${w}`);
      }
      recent.push(...got);
      while (recent.length > 5 * k) recent.shift(); // keep the previous 5 weeks
    }
  }
});

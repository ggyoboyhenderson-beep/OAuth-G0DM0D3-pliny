/* Vitality Health — weekly featured rotation (pure).

   Every device computes the same picks for the same calendar week with no
   server: salt -> hash -> seeded PRNG -> one shuffled bag, then walk that bag
   k items per week, forever, wrapping at the end. Because the walk never
   restarts, an item is drawn exactly once every N positions, i.e. every N/k
   weeks — so the no-repeat window is floor(N / k) weeks measured from *any*
   week, not just from the start of a pass.

   (An earlier draft reshuffled the bag each pass. Tests caught the hole: a
   window straddling two passes could repeat, because the new shuffle knows
   nothing about what the old one just showed.)

   Deliberately NOT a carousel: nothing here animates or advances on a timer.
   The rotation only ever *highlights* items; the full lists stay rendered and
   searchable, so nothing is ever hidden behind this week's selection.

   Pure and date-injectable so determinism is unit-testable
   (see test/rotation.test.js). */
(function (root) {
  "use strict";

  var WEEK_MS = 604800000; // 7 * 24 * 60 * 60 * 1000

  /* ---- ISO-8601 week identity (for the human-readable label) ---- */
  function isoWeek(date) {
    var d = new Date(date.getTime());
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7)); // Thursday decides the year
    var week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    );
  }
  function isoWeekYear(date) {
    var d = new Date(date.getTime());
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    return d.getFullYear();
  }
  function weekId(date) {
    date = date || new Date();
    var w = String(isoWeek(date));
    return isoWeekYear(date) + "-W" + (w.length < 2 ? "0" + w : w);
  }

  /* ---- Monotonic week counter ----
     ISO week numbers restart at 1 each year, which would make the schedule
     jump at the year boundary. Counting whole weeks since a fixed Monday
     keeps the sequence continuous forever. */
  var EPOCH_MONDAY = Date.UTC(1970, 0, 5); // 5 Jan 1970 was a Monday
  function weekIndex(date) {
    date = date || new Date();
    // Use the local date's midnight so the week flips at local midnight.
    var local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.floor((local.getTime() - EPOCH_MONDAY) / WEEK_MS);
  }

  /* ---- xmur3 string hash -> 32-bit seed ---- */
  function hashSeed(str) {
    var h = 1779033703 ^ str.length;
    for (var i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  }

  /* ---- mulberry32: tiny deterministic PRNG (not cryptographic) ---- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function seededShuffle(arr, rng) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ---- How many items may we feature and still not repeat for 6 weeks? ----
     Self-adjusting: as a library grows, the cap rises on its own. */
  function safeCount(poolSize, desired, minWindow) {
    minWindow = minWindow || 6;
    var cap = Math.floor(poolSize / minWindow);
    return Math.max(poolSize > 0 ? 1 : 0, Math.min(desired, cap || 1, poolSize));
  }

  /* ---- The pick ----
     One bag per salt, walked k items per week. When N is not a multiple of k
     the groupings shift on each pass, so the combinations stay fresh even
     though the underlying order is fixed. */
  function weeklyPicks(pool, k, salt, date) {
    var N = pool.length;
    if (!N || k <= 0) return [];
    k = Math.min(k, N);
    var bag = seededShuffle(
      pool.map(function (_, i) { return i; }),
      mulberry32(hashSeed(salt))
    );
    var start = weekIndex(date) * k;
    var out = [];
    for (var i = 0; i < k; i++) {
      out.push(pool[bag[(((start + i) % N) + N) % N]]); // guard pre-1970 dates
    }
    return out;
  }

  var API = {
    WEEK_MS: WEEK_MS,
    isoWeek: isoWeek, isoWeekYear: isoWeekYear, weekId: weekId,
    weekIndex: weekIndex, hashSeed: hashSeed, mulberry32: mulberry32,
    seededShuffle: seededShuffle, safeCount: safeCount, weeklyPicks: weeklyPicks,
  };
  root.VH_ROTATE = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof self !== "undefined" ? self : this);

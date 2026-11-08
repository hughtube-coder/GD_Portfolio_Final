/* Home page: interactive sorting visualizer (bubble, selection, insertion, quick). */
(function () {
  "use strict";

  var host = document.querySelector("[data-sorter]");
  if (!host) return;

  var N = 36;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ALGOS = { bubble: "bubble sort", selection: "selection sort", insertion: "insertion sort", quick: "quick sort" };
  // Step pacing per speed level 1..10: ms between frames, and steps done per frame.
  var DELAY = [220, 130, 80, 50, 32, 16, 16, 16, 16, 16];
  var STEPS = [1, 1, 1, 1, 1, 1, 2, 4, 8, 16];

  /* ---------- build the widget ---------- */
  host.innerHTML =
    '<p class="sorter-title"><strong>sort.visualizer()</strong><span data-algo>quick sort</span></p>' +
    '<canvas role="img" aria-label="Bars being sorted from shortest to tallest"></canvas>' +
    '<div class="sorter-controls">' +
      '<fieldset class="sorter-algos"><legend class="sr-only">Sorting algorithm</legend>' +
        Object.keys(ALGOS).map(function (k) {
          return '<label><input type="radio" name="algo" value="' + k + '"' + (k === "quick" ? " checked" : "") + "><span>" + k[0].toUpperCase() + k.slice(1) + "</span></label>";
        }).join("") +
      "</fieldset>" +
      '<button type="button" data-run>Sort</button>' +
      '<button type="button" class="ghost" data-shuffle>Shuffle</button>' +
      '<label class="sorter-speed">Speed <input type="range" min="1" max="10" value="6" aria-label="Speed"></label>' +
    "</div>" +
    '<p class="sorter-stats"><span>compares: <b data-cmp>0</b></span><span>swaps: <b data-swp>0</b></span><span data-status aria-live="polite"></span></p>';

  var canvas = host.querySelector("canvas");
  var ctx = canvas.getContext("2d");
  var runBtn = host.querySelector("[data-run]");
  var shuffleBtn = host.querySelector("[data-shuffle]");
  var speedInput = host.querySelector('input[type="range"]');
  var algoLabel = host.querySelector("[data-algo]");
  var cmpEl = host.querySelector("[data-cmp]");
  var swpEl = host.querySelector("[data-swp]");
  var statusEl = host.querySelector("[data-status]");

  var arr = [];
  var hl = null;            // {i, j, t} last highlighted pair
  var cmp = 0, swp = 0;
  var token = 0;            // bumping this cancels a running sort
  var running = false;
  var interacted = false;

  /* ---------- helpers ---------- */
  function currentAlgo() { return host.querySelector('input[name="algo"]:checked').value; }
  function isSorted() { for (var i = 1; i < arr.length; i++) if (arr[i - 1] > arr[i]) return false; return true; }
  function shuffle() {
    arr = [];
    for (var i = 1; i <= N; i++) arr.push(i);
    for (var k = arr.length - 1; k > 0; k--) {
      var r = Math.floor(Math.random() * (k + 1));
      var t = arr[k]; arr[k] = arr[r]; arr[r] = t;
    }
    hl = null; cmp = 0; swp = 0;
    stats();
  }
  function stats() { cmpEl.textContent = cmp; swpEl.textContent = swp; }
  function setStatus(text) { statusEl.textContent = text; }
  function mix(a, b, t) { return Math.round(a + (b - a) * t); }
  function rampColor(v) {              // teal (short) -> coral (tall)
    var t = (v - 1) / (N - 1);
    return "rgb(" + mix(31, 240, t) + "," + mix(192, 89, t) + "," + mix(196, 46, t) + ")";
  }

  /* ---------- drawing ---------- */
  function resize() {
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.clientWidth;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(w * 0.625 * dpr);
    draw();
  }
  function draw() {
    var W = canvas.width, H = canvas.height;
    var dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, W, H);
    var ink = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#1a1d41";
    var gap = Math.max(1, 2 * dpr);
    var bw = (W - gap * (N + 1)) / N;
    var pad = 8 * dpr;
    for (var i = 0; i < arr.length; i++) {
      var h = (arr[i] / N) * (H - pad * 2);
      var x = gap + i * (bw + gap), y = H - pad - h;
      var active = hl && (hl.i === i || hl.j === i);
      ctx.fillStyle = active ? (hl.t === "s" ? "#ae3631" : ink) : rampColor(arr[i]);
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, bw, h, Math.min(4 * dpr, bw / 2)); else ctx.rect(x, y, bw, h);
      ctx.fill();
    }
  }

  /* ---------- algorithms (generators yield one visible step at a time) ---------- */
  function swap(i, j) { var t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
  var ALGO_FN = {
    bubble: function* () {
      for (var i = 0; i < arr.length - 1; i++) {
        for (var j = 0; j < arr.length - i - 1; j++) {
          yield { t: "c", i: j, j: j + 1 };
          if (arr[j] > arr[j + 1]) { swap(j, j + 1); yield { t: "s", i: j, j: j + 1 }; }
        }
      }
    },
    selection: function* () {
      for (var i = 0; i < arr.length - 1; i++) {
        var min = i;
        for (var j = i + 1; j < arr.length; j++) {
          yield { t: "c", i: min, j: j };
          if (arr[j] < arr[min]) min = j;
        }
        if (min !== i) { swap(i, min); yield { t: "s", i: i, j: min }; }
      }
    },
    insertion: function* () {
      for (var i = 1; i < arr.length; i++) {
        for (var j = i; j > 0; j--) {
          yield { t: "c", i: j - 1, j: j };
          if (arr[j - 1] > arr[j]) { swap(j - 1, j); yield { t: "s", i: j - 1, j: j }; } else break;
        }
      }
    },
    quick: function* () {
      function* qs(lo, hi) {
        if (lo >= hi) return;
        var pivot = arr[hi], p = lo;
        for (var j = lo; j < hi; j++) {
          yield { t: "c", i: j, j: hi };
          if (arr[j] < pivot) { if (p !== j) { swap(p, j); yield { t: "s", i: p, j: j }; } p++; }
        }
        if (p !== hi) { swap(p, hi); yield { t: "s", i: p, j: hi }; }
        yield* qs(lo, p - 1);
        yield* qs(p + 1, hi);
      }
      yield* qs(0, arr.length - 1);
    }
  };

  /* ---------- run / stop ---------- */
  function finish(myToken, text) {
    if (myToken !== token) return;
    running = false;
    hl = null;
    runBtn.textContent = "Sort";
    setStatus(text);
    draw();
  }
  function run() {
    if (running) { token++; finish(token, "stopped"); return; }
    if (isSorted()) shuffle();
    var myToken = ++token;
    var gen = ALGO_FN[currentAlgo()]();
    running = true; cmp = 0; swp = 0; stats();
    runBtn.textContent = "Stop";
    setStatus("sorting…");

    function account(step) { if (step.t === "c") cmp++; else swp++; hl = step; }

    if (reduceMotion) {                     // no animation: jump to the result
      var s;
      while (!(s = gen.next()).done) account(s.value);
      stats(); finish(myToken, "sorted");
      return;
    }
    var last = 0;
    function frame(now) {
      if (myToken !== token) return;
      var level = Number(speedInput.value) - 1;
      if (now - last >= DELAY[level]) {
        last = now;
        for (var k = 0; k < STEPS[level]; k++) {
          var r = gen.next();
          if (r.done) { stats(); finish(myToken, "sorted"); return; }
          account(r.value);
        }
        stats(); draw();
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- wiring ---------- */
  runBtn.addEventListener("click", function () { interacted = true; run(); });
  shuffleBtn.addEventListener("click", function () { interacted = true; token++; running = false; runBtn.textContent = "Sort"; shuffle(); setStatus("shuffled"); draw(); });
  host.addEventListener("change", function (e) {
    if (e.target.name !== "algo") return;
    interacted = true;
    token++; running = false; runBtn.textContent = "Sort";
    algoLabel.textContent = ALGOS[currentAlgo()];
    shuffle(); setStatus(""); draw();
  });
  window.addEventListener("themechange", draw);
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas); else window.addEventListener("resize", resize);

  shuffle();
  resize();

  // One automatic demo the first time it scrolls into view, so people notice it moves.
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      setTimeout(function () {
        if (!interacted && !document.documentElement.classList.contains("motion-off")) run();
      }, 700);
    }, { threshold: 0.6 });
    io.observe(canvas);
  }
})();

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var root = document.documentElement;

  function qsa(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function motionOff() { return root.classList.contains("motion-off"); }

  /* ---------- site settings: theme and effects (remembered in the browser) ---------- */
  function store(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* storage blocked */ } }
  function stored(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function paintThemeColor() {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", root.getAttribute("data-theme") === "dark" ? "#161a38" : "#ffffff");
  }
  window.SITE = {
    getTheme: function () { return root.getAttribute("data-theme") === "dark" ? "dark" : "light"; },
    setTheme: function (mode) {
      root.classList.add("theme-anim");
      setTimeout(function () { root.classList.remove("theme-anim"); }, 450);
      if (mode === "dark") root.setAttribute("data-theme", "dark"); else root.removeAttribute("data-theme");
      store("theme", mode);
      paintThemeColor();
      window.dispatchEvent(new Event("themechange"));
    },
    getFlag: function (name) { return name === "lava" ? !root.classList.contains("no-lava") : stored(name) === "on"; },
    setFlag: function (name, on) {
      if (name === "lava") { root.classList.toggle("no-lava", !on); store("lava", on ? "on" : "off"); }
      else { store(name, on ? "on" : "off"); window.dispatchEvent(new Event("flagchange")); }
    }
  };

  /* ---------- icons: one 24px, 2px-stroke set ---------- */
  var ICONS = {
    prev: '<path d="M15 18l-6-6 6-6"/>',
    next: '<path d="M9 6l6 6-6 6"/>',
    up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    pause: '<path d="M9 5v14M15 5v14"/>',
    play: '<path d="M8 5l11 7-11 7z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    mail: '<path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M22 6l-10 7L2 6"/>',
    github: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>',
    send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    check: '<path d="M20 6L9 17l-5-5"/>'
  };
  function icon(name) {
    return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + ICONS[name] + "</svg>";
  }
  function fillIcons() {
    qsa("[data-icon]").forEach(function (el) { el.innerHTML = icon(el.getAttribute("data-icon")); });
  }

  /* ---------- run something once the loading screen is gone ---------- */
  function afterLoader(fn) {
    if (!root.classList.contains("preload")) fn();
    else window.addEventListener("loaderdone", fn, { once: true });
  }

  /* ---------- loading screen (first visit of each browser session) ---------- */
  function initLoader() {
    if (!root.classList.contains("preload")) return;
    var NAME = "Hugh Daniel J. Raymundo";
    var LOG = [[0, "> booting hugh.portfolio..."], [16, "> mounting brand: teal, navy, coral"], [36, "> compiling lava lamp..."], [56, "> loading Taglish models..."], [74, "> shuffling 36 bars..."], [91, "> hello, world."]];
    var MIN = 3300, MAX = 5600;
    var holder = document.createElement("div");
    holder.className = "loader";
    holder.setAttribute("role", "status");
    holder.setAttribute("aria-label", "Loading portfolio");
    holder.innerHTML =
      '<div class="loader-grid"></div><div class="loader-blob loader-blob--a"></div><div class="loader-blob loader-blob--b"></div>' +
      '<span class="loader-tag loader-tag--l" aria-hidden="true">hugh.portfolio / 2026</span><span class="loader-tag loader-tag--r" aria-hidden="true">[ loading ]</span>' +
      '<div class="loader-center"><div class="loader-ring" aria-hidden="true">' +
        '<svg viewBox="0 0 270 270"><defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1fc0c4"/><stop offset="1" stop-color="#f0592e"/></linearGradient></defs>' +
        '<circle class="ring-track" cx="135" cy="135" r="125"/><circle class="ring-bar" cx="135" cy="135" r="125"/></svg>' +
        '<div class="loader-orbit"></div><div class="loader-orbit loader-orbit--b"></div>' +
        '<div class="loader-mark"><div class="mark-ghost"></div><div class="mark-fill"><div class="liquid"></div></div></div></div>' +
      '<p class="loader-name" aria-hidden="true"></p><p class="loader-log" aria-hidden="true"></p></div>' +
      '<div class="loader-count" aria-hidden="true"><span>0</span><small>%</small></div>' +
      '<button class="loader-skip" type="button">Skip intro</button>';
    document.body.appendChild(holder);

    var inertEls = qsa(".site-header, main, .site-footer, .skip-link");
    inertEls.forEach(function (n) { n.setAttribute("inert", ""); });

    var bar = holder.querySelector(".ring-bar"), count = holder.querySelector(".loader-count span");
    var nameEl = holder.querySelector(".loader-name"), logEl = holder.querySelector(".loader-log"), skipBtn = holder.querySelector(".loader-skip");
    var letters = NAME.split("").map(function (ch) {
      var s = document.createElement("span");
      s.textContent = ch === " " ? "\u00a0" : ch;
      nameEl.appendChild(s);
      return s;
    });
    var start = performance.now(), loaded = document.readyState === "complete";
    var pct = 0, logIdx = -1, ended = false, leaving = false;
    window.addEventListener("load", function () { loaded = true; });

    function paint() {
      holder.style.setProperty("--p", pct.toFixed(1));
      bar.style.strokeDashoffset = (785.4 * (1 - pct / 100)).toFixed(1);
      count.textContent = Math.floor(pct);
      var idx = 0;
      for (var i = 0; i < LOG.length; i++) if (pct >= LOG[i][0]) idx = i;
      if (idx !== logIdx) {
        logIdx = idx;
        logEl.textContent = "";
        var line = document.createElement("span");
        line.className = "log-line";
        line.textContent = LOG[idx][1];
        logEl.appendChild(line);
        logEl.appendChild(document.createElement("span")).className = "caret";
      }
      var on = pct < 52 ? 0 : Math.ceil(((pct - 52) / 44) * letters.length);
      letters.forEach(function (l, k) { l.classList.toggle("on", k < on); });
    }
    function leave() {
      if (leaving) return;
      leaving = true; ended = true;
      pct = 100; paint();
      try { sessionStorage.setItem("seen", "1"); } catch (e) { /* storage blocked */ }
      holder.classList.add("is-done", "is-leaving");
      setTimeout(function () {
        holder.remove();
        inertEls.forEach(function (n) { n.removeAttribute("inert"); });
        root.classList.remove("preload");
        window.dispatchEvent(new Event("loaderdone"));
      }, 950);
    }
    function frame(now) {
      if (ended) return;
      var t = now - start;
      var x = Math.min(1, t / MIN), eased = 1 - Math.pow(1 - x, 2.2);
      var cap = (loaded || t > MAX) ? 100 : 92;
      pct = Math.min(cap, eased * 100);
      paint();
      if (pct >= 99.6) { ended = true; holder.classList.add("is-done"); setTimeout(leave, 650); return; }
      requestAnimationFrame(frame);
    }
    skipBtn.addEventListener("click", leave);
    document.addEventListener("keydown", function onKey(e) {
      if (e.key !== "Escape") return;
      document.removeEventListener("keydown", onKey);
      leave();
    });
    setTimeout(leave, 9200);              // never trap a visitor behind the intro
    paint();
    requestAnimationFrame(frame);
  }

  /* ---------- nav ---------- */
  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("site-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      toggle.setAttribute("aria-expanded", String(nav.classList.toggle("is-open")));
    });
  }

  /* ---------- lava-lamp side columns ---------- */
  var TEAL = "radial-gradient(circle at 32% 30%, #6df0f3, #00a3ad 45%, #007d86 78%)";
  var CORAL = "radial-gradient(circle at 32% 30%, #ffb08a, #f0592e 55%, #ae3631)";
  var BLOBS = {
    left: [
      { size: 112, left: 42, dur: 19, delay: -4, wob: 16, s0: 0.85, s1: 1.25, fill: TEAL, stat: 72 },
      { size: 70, left: 64, dur: 14, delay: -9, wob: -22, s0: 0.9, s1: 1.4, fill: CORAL, stat: 18 },
      { size: 140, left: 30, dur: 27, delay: -15, wob: 12, s0: 0.8, s1: 1.2, fill: TEAL, stat: 44 },
      { size: 56, left: 72, dur: 12, delay: -2, wob: -14, s0: 1, s1: 1.5, fill: CORAL, stat: 88 },
      { size: 96, left: 50, dur: 22, delay: -11, wob: 20, s0: 0.85, s1: 1.3, fill: TEAL, stat: 8 },
      { size: 82, left: 36, dur: 17, delay: -7, wob: -18, s0: 0.9, s1: 1.35, fill: CORAL, stat: 58 },
      { size: 124, left: 58, dur: 24, delay: -18, wob: 14, s0: 0.8, s1: 1.2, fill: TEAL, stat: 30 }
    ],
    right: [
      { size: 126, left: 55, dur: 23, delay: -12, wob: -16, s0: 0.8, s1: 1.25, fill: CORAL, stat: 60 },
      { size: 64, left: 34, dur: 13, delay: -5, wob: 20, s0: 0.95, s1: 1.45, fill: TEAL, stat: 14 },
      { size: 104, left: 46, dur: 20, delay: -16, wob: -12, s0: 0.85, s1: 1.3, fill: TEAL, stat: 80 },
      { size: 60, left: 68, dur: 11, delay: -3, wob: 16, s0: 1, s1: 1.5, fill: CORAL, stat: 36 },
      { size: 138, left: 40, dur: 28, delay: -9, wob: -14, s0: 0.8, s1: 1.2, fill: TEAL, stat: 4 },
      { size: 78, left: 60, dur: 16, delay: -13, wob: 18, s0: 0.9, s1: 1.35, fill: CORAL, stat: 70 },
      { size: 92, left: 38, dur: 21, delay: -1, wob: -20, s0: 0.85, s1: 1.3, fill: TEAL, stat: 48 }
    ]
  };
  function initLava() {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", "0"); svg.setAttribute("height", "0");
    svg.setAttribute("aria-hidden", "true"); svg.setAttribute("focusable", "false");
    svg.style.position = "absolute";
    // blur + alpha threshold = blobs that stretch and merge like lava
    svg.innerHTML = '<defs><filter id="goo" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceGraphic" stdDeviation="9" result="b"/><feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10"/></filter></defs>';
    document.body.appendChild(svg);

    ["left", "right"].forEach(function (side) {
      var col = document.createElement("div");
      col.className = "lava lava--" + side;
      col.setAttribute("aria-hidden", "true");
      var goo = document.createElement("div");
      goo.className = "lava-goo";
      BLOBS[side].forEach(function (b) {
        var i = document.createElement("i");
        i.style.cssText = "--size:" + b.size + "px;--left:" + b.left + "%;--dur:" + b.dur + "s;--delay:" + b.delay + "s;--wob:" + b.wob +
          "px;--s0:" + b.s0 + ";--s1:" + b.s1 + ";--static:" + b.stat + "vh;--fill:" + b.fill;
        goo.appendChild(i);
      });
      col.appendChild(goo);
      document.body.appendChild(col);
    });
  }

  /* ---------- footer lava pool ---------- */
  var FOOT_BLOBS = [
    { size: 96, fx: 6, dur: 14, delay: -3, dx: 9, rise: 70, s0: 0.9, s1: 1.25, fill: TEAL },
    { size: 70, fx: 16, dur: 11, delay: -8, dx: -7, rise: 90, s0: 1, s1: 1.4, fill: CORAL },
    { size: 120, fx: 28, dur: 18, delay: -5, dx: 8, rise: 60, s0: 0.85, s1: 1.2, fill: TEAL },
    { size: 60, fx: 40, dur: 10, delay: -1, dx: -9, rise: 95, s0: 1, s1: 1.5, fill: CORAL },
    { size: 104, fx: 52, dur: 16, delay: -11, dx: 7, rise: 75, s0: 0.9, s1: 1.3, fill: TEAL },
    { size: 66, fx: 64, dur: 12, delay: -6, dx: -8, rise: 88, s0: 1, s1: 1.45, fill: CORAL },
    { size: 114, fx: 76, dur: 19, delay: -13, dx: 9, rise: 64, s0: 0.85, s1: 1.2, fill: TEAL },
    { size: 74, fx: 88, dur: 13, delay: -2, dx: -7, rise: 85, s0: 1, s1: 1.4, fill: CORAL },
    { size: 90, fx: 95, dur: 15, delay: -9, dx: -6, rise: 72, s0: 0.9, s1: 1.3, fill: TEAL }
  ];
  function initFooterLava() {
    var box = document.querySelector(".foot-lava");
    if (!box) return;
    var goo = document.createElement("div");
    goo.className = "lava-goo";
    FOOT_BLOBS.forEach(function (b) {
      var i = document.createElement("i");
      i.style.cssText = "--size:" + b.size + "px;--fx:" + b.fx + "%;--dur:" + b.dur + "s;--delay:" + b.delay + "s;--dx:" + b.dx +
        ";--rise:" + b.rise + ";--s0:" + b.s0 + ";--s1:" + b.s1 + ";--fill:" + b.fill;
      goo.appendChild(i);
    });
    box.appendChild(goo);
  }

  /* ---------- optional cursor trail (switch lives in the About page console) ---------- */
  function initTrail() {
    if (reduceMotion) return;
    var cv = null, ctx = null, parts = [], running = false, lastX = null, lastY = null;
    var COLORS = ["#1fc0c4", "#00a3ad", "#f0592e", "#ff9a6b", "#ffd479"];
    function resize() {
      if (!cv) return;
      var dpr = window.devicePixelRatio || 1;
      cv.width = Math.round(window.innerWidth * dpr);
      cv.height = Math.round(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function ensure() {
      if (cv) return;
      cv = document.createElement("canvas");
      cv.setAttribute("aria-hidden", "true");
      cv.style.cssText = "position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:9000";
      document.body.appendChild(cv);
      ctx = cv.getContext("2d");
      resize();
    }
    function clear() { if (ctx) ctx.clearRect(0, 0, window.innerWidth, window.innerHeight); }
    function frame() {
      running = false;
      try {
        clear();
        var alive = [];
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          p.x += p.vx; p.y += p.vy; p.vy += 0.03; p.life -= 0.02;
          if (p.life <= 0) continue;
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.c;
          ctx.beginPath();
          // Math.max guards a tiny negative radius from rounding, which used to throw and kill the loop for good.
          ctx.arc(p.x, p.y, Math.max(0.2, p.r * p.life), 0, 6.2832);
          ctx.fill();
          alive.push(p);
        }
        parts = alive;
      } catch (err) { parts = []; }
      ctx.globalAlpha = 1;
      if (parts.length) { running = true; requestAnimationFrame(frame); }
    }
    function spawn(x, y) {
      parts.push({ x: x + (Math.random() - 0.5) * 6, y: y + (Math.random() - 0.5) * 6, vx: (Math.random() - 0.5) * 1.4, vy: (Math.random() - 0.5) * 1.4 - 0.4,
        r: 4 + Math.random() * 6, life: 1, c: COLORS[Math.floor(Math.random() * COLORS.length)] });
      if (parts.length > 260) parts.shift();
    }
    window.addEventListener("resize", resize);
    window.addEventListener("flagchange", function () { if (!window.SITE.getFlag("trail")) { parts = []; clear(); } });
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch" || !window.SITE.getFlag("trail")) { lastX = null; return; }
      ensure();
      // fill the gap between events so fast movement still leaves a continuous trail
      var dx = lastX === null ? 0 : e.clientX - lastX, dy = lastX === null ? 0 : e.clientY - lastY;
      var steps = Math.min(8, Math.max(1, Math.round(Math.sqrt(dx * dx + dy * dy) / 12)));
      for (var k = 1; k <= steps; k++) spawn(e.clientX - dx * (1 - k / steps), e.clientY - dy * (1 - k / steps));
      lastX = e.clientX; lastY = e.clientY;
      if (!running) { running = true; requestAnimationFrame(frame); }
    }, { passive: true });
  }

  /* ---------- global pause for decorative motion ---------- */
  function initMotionToggle() {
    if (reduceMotion) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "motion-toggle";
    btn.setAttribute("aria-pressed", "false");
    function paint() {
      var off = motionOff();
      btn.setAttribute("aria-pressed", String(off));
      btn.innerHTML = icon(off ? "play" : "pause") + "<span>" + (off ? "Play motion" : "Pause motion") + "</span>";
    }
    try { if (sessionStorage.getItem("motionOff") === "1") root.classList.add("motion-off"); } catch (e) { /* storage blocked */ }
    btn.addEventListener("click", function () {
      var off = root.classList.toggle("motion-off");
      try { sessionStorage.setItem("motionOff", off ? "1" : "0"); } catch (e) { /* storage blocked */ }
      paint();
      window.dispatchEvent(new Event("motionchange"));
    });
    paint();
    document.body.appendChild(btn);
  }

  /* ---------- hero: title letters, cycling intro line ---------- */
  function initHeroTitle() {
    var h1 = document.querySelector(".hero h1");
    if (!h1 || reduceMotion) return;
    var text = h1.textContent.trim();
    h1.setAttribute("aria-label", text);
    h1.textContent = "";
    var n = 0;
    text.split(" ").forEach(function (word, wi, all) {
      var w = document.createElement("span");
      w.style.display = "inline-block";
      w.setAttribute("aria-hidden", "true");
      word.split("").forEach(function (ch) {
        var s = document.createElement("span");
        s.className = "ch";
        s.style.setProperty("--i", n++);
        s.textContent = ch;
        w.appendChild(s);
      });
      h1.appendChild(w);
      if (wi < all.length - 1) h1.appendChild(document.createTextNode(" "));
    });
  }
  function initTyped() {
    var el = document.querySelector("[data-typed]");
    if (!el || reduceMotion) return;
    var words = (el.getAttribute("data-words") || "").split("|").filter(Boolean);
    if (words.length < 2) return;
    var w = 0, c = words[0].length, deleting = true;
    function tick() {
      if (motionOff()) { setTimeout(tick, 300); return; }
      c += deleting ? -1 : 1;
      el.textContent = words[w].slice(0, c);
      var delay = deleting ? 40 : 85;
      if (!deleting && c === words[w].length) { deleting = true; delay = 1600; }
      else if (deleting && c === 0) { deleting = false; w = (w + 1) % words.length; delay = 300; }
      setTimeout(tick, delay);
    }
    afterLoader(function () { setTimeout(tick, 2600); });
  }

  function initMarquee() {
    var list = document.querySelector("[data-marquee]");
    if (!list) return;
    Array.prototype.slice.call(list.children).forEach(function (li) {
      var copy = li.cloneNode(true);
      copy.setAttribute("aria-hidden", "true");
      list.appendChild(copy);
    });
  }

  /* ---------- slow scroll reveals ---------- */
  function initReveal() {
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    var sel = ".tile, .work, .term-head, .term-nav, .gallery figure, .skills > div, .cert-entry, .contact-list li, main h2, main .lede, .profile > *, .end-note";
    var pending = [];

    function reveal(el) {
      if (!el.classList.contains("reveal") || el.classList.contains("is-in")) return;
      el.classList.add("is-in");
      var delay = parseInt(el.style.getPropertyValue("--d"), 10) || 0;
      // hand control back to normal hover styles once the reveal has played
      setTimeout(function () { el.classList.remove("reveal", "is-in"); el.removeAttribute("data-dir"); el.style.removeProperty("--d"); }, 1300 + delay);
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        reveal(e.target);
        io.unobserve(e.target);
        pending = pending.filter(function (el) { return el !== e.target; });
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });

    // Jumping down the page (anchor links, End key) can skip items entirely; show anything we scrolled past.
    function sweep() {
      pending = pending.filter(function (el) {
        if (el.getBoundingClientRect().bottom < 0) { reveal(el); io.unobserve(el); return false; }
        return true;
      });
    }
    var sweeping = false;
    window.addEventListener("scroll", function () {
      if (!sweeping) { sweeping = true; requestAnimationFrame(function () { sweep(); sweeping = false; }); }
    }, { passive: true });
    window.addEventListener("load", sweep);

    qsa(sel).forEach(function (el) {
      var parent = el.parentElement;
      var idx = parent ? Array.prototype.indexOf.call(parent.children, el) : 0;
      var dir = "up";
      if (el.classList.contains("work")) dir = el.matches(":nth-of-type(even)") ? "right" : "left";
      else if (parent && parent.classList.contains("profile")) dir = idx === 0 ? "left" : "right";
      else if (el.matches(".gallery figure, .tile")) dir = "zoom";
      if (dir !== "up") el.setAttribute("data-dir", dir);
      if (!el.classList.contains("work")) el.style.setProperty("--d", Math.min(idx, 6) * 120 + "ms");
      el.classList.add("reveal");
      pending.push(el);
      io.observe(el);
    });
    sweep();
  }

  /* ---------- 3D tilt on cards and images (mouse only) ---------- */
  function initTilt() {
    if (reduceMotion || !canHover) return;
    qsa(".gallery figure, .cert-media, .work-media").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        if (motionOff()) return;
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transition = "transform 80ms linear";
        el.style.transform = "perspective(900px) rotateX(" + (-y * 8).toFixed(2) + "deg) rotateY(" + (x * 8).toFixed(2) + "deg) scale(1.02)";
      });
      el.addEventListener("pointerleave", function () {
        el.style.transition = "transform 500ms cubic-bezier(0.22, 1, 0.36, 1)";
        el.style.transform = "";
      });
    });
  }

  /* ---------- scroll progress + back to top ---------- */
  function initScrollUi() {
    var bar = document.querySelector(".progress");
    var top = document.querySelector(".to-top");
    var ticking = false;
    function update() {
      var y = window.scrollY || root.scrollTop;
      var h = root.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = "scaleX(" + (h > 0 ? y / h : 0) + ")";
      if (top) top.classList.toggle("is-visible", y > 500);
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    if (top) top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); });
    update();
  }

  /* ---------- About: paged gallery kept in the URL (?page=2) ---------- */
  function initPager() {
    var gallery = document.querySelector("[data-gallery]");
    var pager = document.querySelector("[data-pager]");
    if (!gallery || !pager) return;
    var items = Array.prototype.slice.call(gallery.children);
    var perPage = Number(gallery.getAttribute("data-per-page")) || 6;
    var pages = Math.max(1, Math.ceil(items.length / perPage));

    function pageFromUrl() {
      var n = parseInt(new URLSearchParams(window.location.search).get("page"), 10);
      return n >= 1 && n <= pages ? n : 1;
    }
    function btn(content, label, onClick, state) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", label);
      b.innerHTML = content;
      if (state === "disabled") b.disabled = true;
      if (state === "current") b.setAttribute("aria-current", "page");
      b.addEventListener("click", onClick);
      return b;
    }
    function render(current) {
      items.forEach(function (el, i) { el.hidden = Math.ceil((i + 1) / perPage) !== current; });
      pager.textContent = "";
      pager.appendChild(btn(icon("prev"), "Previous page", function () { go(current - 1); }, current === 1 ? "disabled" : ""));
      for (var p = 1; p <= pages; p++) {
        (function (page) {
          pager.appendChild(btn(String(page), "Page " + page, function () { go(page); }, page === current ? "current" : ""));
        })(p);
      }
      pager.appendChild(btn(icon("next"), "Next page", function () { go(current + 1); }, current === pages ? "disabled" : ""));
    }
    function go(page) {
      var next = Math.min(Math.max(page, 1), pages);
      render(next);
      try { history.replaceState(null, "", "?page=" + next + window.location.hash); } catch (e) { /* file:// or sandboxed */ }
    }
    render(pageFromUrl());
  }

  /* ---------- lightbox (images wrapped in real buttons) ---------- */
  function initLightbox() {
    var imgs = qsa(".gallery img, .work-media img, .cert-media img");
    if (imgs.length === 0) return;
    var box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Image preview");
    var big = document.createElement("img");
    var cap = document.createElement("p");
    var close = document.createElement("button");
    close.type = "button";
    close.setAttribute("aria-label", "Close preview");
    close.innerHTML = icon("close");
    box.appendChild(big); box.appendChild(cap); box.appendChild(close);
    document.body.appendChild(box);
    var opener = null;

    function open(img, trigger) {
      opener = trigger;
      big.src = img.currentSrc || img.src;
      big.alt = img.alt;
      cap.textContent = img.alt;
      box.classList.add("is-open");
      close.focus();
    }
    function shut() {
      box.classList.remove("is-open");
      if (opener) opener.focus();
    }
    imgs.forEach(function (img) {
      var trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "zoom";
      img.parentNode.insertBefore(trigger, img);
      trigger.appendChild(img);
      trigger.addEventListener("click", function () { open(img, trigger); });
    });
    box.addEventListener("click", function (e) { if (e.target !== big) shut(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && box.classList.contains("is-open")) shut();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initLoader();
    fillIcons();
    initNav();
    initLava();
    initFooterLava();
    paintThemeColor();
    initTrail();
    initMotionToggle();
    initHeroTitle();
    initTyped();
    initMarquee();
    initPager();
    initLightbox();   // before reveal/tilt so they act on the wrapped images' containers
    initReveal();
    initTilt();
    initScrollUi();
  });
})();

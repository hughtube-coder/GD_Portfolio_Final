/* About page: click the photo for a code effect, then a hidden side console opens.
   Tabs: Theme (dark mode + effects), Invaders (game), Terminal, Code (whoami.py). */
(function () {
  "use strict";

  var photoBtn = document.querySelector(".photo-btn");
  if (!photoBtn) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SITE = window.SITE;
  var PAGES = { home: "index.html", about: "about.html", skills: "skills.html", certifications: "certifications.html", works: "works.html", contact: "contact.html" };

  function el(tag, props, kids) {
    var n = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      if (k === "text") n.textContent = props[k];
      else if (k === "class") n.className = props[k];
      else n.setAttribute(k, props[k]);
    });
    (kids || []).forEach(function (c) { n.appendChild(c); });
    return n;
  }

  /* ================= code rain (photo effect + `matrix` command) ================= */
  var RAIN_CHARS = "01{}<>/=;()[]$#&*+_if for def".split("");
  function codeRain(cv, ms, label) {
    return new Promise(function (resolve) {
      var ctx = cv.getContext("2d");
      var dpr = window.devicePixelRatio || 1;
      var r = cv.getBoundingClientRect();
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
      var fs = Math.round(15 * dpr), cols = Math.ceil(cv.width / fs);
      var drops = []; for (var i = 0; i < cols; i++) drops.push(-Math.random() * 20);
      var start = null;
      ctx.fillStyle = "#070918"; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.font = fs + "px ui-monospace, Consolas, monospace";
      function frame(t) {
        if (start === null) start = t;
        var elapsed = t - start;
        ctx.fillStyle = "rgba(7, 9, 24, 0.16)"; ctx.fillRect(0, 0, cv.width, cv.height);
        for (var c = 0; c < cols; c++) {
          var y = drops[c] * fs, ch = RAIN_CHARS[Math.floor(Math.random() * RAIN_CHARS.length)];
          var roll = Math.random();
          ctx.fillStyle = roll > 0.96 ? "#ffffff" : roll > 0.9 ? "#ff8f80" : "#5fd9e0";
          ctx.fillText(ch, c * fs, y);
          if (y > cv.height && Math.random() > 0.95) drops[c] = 0;
          drops[c] += 0.9;
        }
        if (label && elapsed > ms * 0.35) {
          var w = ctx.measureText(label).width + fs * 2;
          ctx.fillStyle = "rgba(7, 9, 24, 0.9)"; ctx.fillRect((cv.width - w) / 2, cv.height / 2 - fs * 1.4, w, fs * 2.4);
          ctx.fillStyle = "#8be3e8"; ctx.fillText(label, (cv.width - w) / 2 + fs, cv.height / 2 + fs * 0.35);
        }
        if (elapsed < ms) requestAnimationFrame(frame);
        else { ctx.clearRect(0, 0, cv.width, cv.height); resolve(); }
      }
      requestAnimationFrame(frame);
    });
  }
  function fullScreenRain(ms) {
    if (reduceMotion) return Promise.resolve();
    var cv = el("canvas", { "aria-hidden": "true", style: "position:fixed;inset:0;width:100%;height:100%;z-index:130;pointer-events:none" });
    document.body.appendChild(cv);
    return codeRain(cv, ms, "wake up, Hugh...").then(function () { cv.remove(); });
  }

  /* ================= confetti ================= */
  function confetti() {
    if (reduceMotion) return;
    var cv = el("canvas", { "aria-hidden": "true", style: "position:fixed;inset:0;width:100%;height:100%;z-index:130;pointer-events:none" });
    document.body.appendChild(cv);
    cv.width = window.innerWidth; cv.height = window.innerHeight;
    var ctx = cv.getContext("2d"), colors = ["#1fc0c4", "#007d86", "#f0592e", "#ae3631", "#ffffff", "#ffd479"];
    var bits = [];
    for (var i = 0; i < 110; i++) bits.push({ x: cv.width * 0.5, y: cv.height * 0.55, vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 15 - 4, w: 6 + Math.random() * 6, h: 4 + Math.random() * 5, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: colors[i % colors.length] });
    var t0 = null;
    (function frame(t) {
      if (t0 === null) t0 = t;
      ctx.clearRect(0, 0, cv.width, cv.height);
      bits.forEach(function (b) {
        b.vy += 0.38; b.x += b.vx; b.y += b.vy; b.vx *= 0.99; b.rot += b.vr;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot); ctx.fillStyle = b.c; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); ctx.restore();
      });
      if (t - t0 < 2600) requestAnimationFrame(frame); else cv.remove();
    })(performance.now());
  }

  /* ================= build the drawer ================= */
  var TABS = [["theme", "Theme"], ["invaders", "Invaders"], ["terminal", "Terminal"], ["code", "Code"]];
  var closeSvg = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var closeBtn = el("button", { class: "console-close", type: "button", "aria-label": "Close console" });
  closeBtn.innerHTML = closeSvg;
  var tablist = el("div", { class: "console-tabs", role: "tablist", "aria-label": "Console sections" });
  var panels = {};
  var tabs = {};
  TABS.forEach(function (t, i) {
    tabs[t[0]] = el("button", { class: "console-tab", type: "button", role: "tab", id: "ctab-" + t[0], "aria-controls": "cpanel-" + t[0], "aria-selected": "false", tabindex: "-1", text: t[1] });
    tablist.appendChild(tabs[t[0]]);
    panels[t[0]] = el("div", { class: "console-panel", role: "tabpanel", id: "cpanel-" + t[0], "aria-labelledby": "ctab-" + t[0], hidden: "" });
  });
  var drawer = el("aside", { class: "console", id: "console", role: "dialog", "aria-label": "Hidden console" }, [
    el("div", { class: "console-head" }, [
      el("span", { class: "console-dots", "aria-hidden": "true" }, [el("i"), el("i"), el("i")]),
      el("h2", { class: "console-title", text: "~/hugh/console" }),
      closeBtn
    ]),
    tablist
  ].concat(TABS.map(function (t) { return panels[t[0]]; })));
  var scrim = el("div", { class: "console-scrim", "aria-hidden": "true" });
  document.body.appendChild(scrim);
  document.body.appendChild(drawer);

  /* ================= theme panel ================= */
  var switches = [];
  function switchRow(label, note, get, set) {
    var input = el("input", { type: "checkbox", role: "switch" });
    var row = el("label", { class: "switch" }, [input, el("span", { class: "track", "aria-hidden": "true" }), el("span", { class: "sw-label" }, [document.createTextNode(label), el("small", { text: note })])]);
    input.addEventListener("change", function () { set(input.checked); });
    switches.push(function () { input.checked = get(); });
    return row;
  }
  function syncSwitches() { switches.forEach(function (f) { f(); }); }
  var confettiBtn = el("button", { class: "console-btn", type: "button", text: "Throw confetti" });
  confettiBtn.addEventListener("click", confetti);
  [el("p", { class: "console-note", text: "// tweak how this site looks and feels. Your choices are remembered on this device." }),
   switchRow("Dark mode", "Easier on the eyes at night.", function () { return SITE.getTheme() === "dark"; }, function (on) { SITE.setTheme(on ? "dark" : "light"); }),
   switchRow("Lava blobs", "The moving sides and footer.", function () { return SITE.getFlag("lava"); }, function (on) { SITE.setFlag("lava", on); }),
   switchRow("Cursor trail", "Sparkles that follow your mouse.", function () { return SITE.getFlag("trail"); }, function (on) { SITE.setFlag("trail", on); }),
   confettiBtn].forEach(function (n) { panels.theme.appendChild(n); });
  window.addEventListener("themechange", syncSwitches);

  /* ================= invaders ================= */
  var BUG = [["..#.....#..", "...#...#...", "..#######..", ".##.###.##.", "###########", "#.#######.#", "#.#.....#.#", "...##.##..."],
             ["..#.....#..", "#..#...#..#", "#.#######.#", "###.###.###", "###########", ".#########.", "..#.....#..", ".#.......#."]];
  var SQUID = [["...##...", "..####..", ".######.", "##.##.##", "########", "..#..#..", ".#.##.#.", "#.#..#.#"],
               ["...##...", "..####..", ".######.", "##.##.##", "########", ".#.##.#.", "#......#", ".#....#."]];
  var gameCanvas = el("canvas", { class: "game-canvas", width: "400", height: "440", role: "application", tabindex: "0", "aria-label": "Bug invaders game. Arrow keys or A and D move, space fires.", style: "image-rendering: pixelated" });
  var scoreEl = el("b", { text: "0" }), livesEl = el("b", { text: "3" }), levelEl = el("b", { text: "1" }), hiEl = el("b", { text: "0" });
  var bar = el("div", { class: "game-bar" }, [el("span", {}, [document.createTextNode("score "), scoreEl]), el("span", {}, [document.createTextNode("lives "), livesEl]), el("span", {}, [document.createTextNode("level "), levelEl]), el("span", {}, [document.createTextNode("best "), hiEl])]);
  var padL = el("button", { type: "button", "aria-label": "Move left", text: "<" });
  var padF = el("button", { type: "button", "aria-label": "Fire", text: "FIRE" });
  var padR = el("button", { type: "button", "aria-label": "Move right", text: ">" });
  [bar, gameCanvas, el("div", { class: "game-pad" }, [padL, padF, padR]),
   el("p", { class: "console-note", style: "margin-top:.8rem", text: "// arrow keys or A/D to move, space to fire. Squash the bugs before they land." })].forEach(function (n) { panels.invaders.appendChild(n); });

  var game = (function () {
    var cv = gameCanvas, g = cv.getContext("2d"), W = cv.width, H = cv.height;
    var keys = { left: false, right: false, fire: false };
    var mode = "ready", score = 0, lives = 3, level = 1, hi = 0, running = false, last = 0;
    var aliens, dir, moveClock, frameToggle, player, bullets, bombs, invuln, fireCool;
    try { hi = parseInt(localStorage.getItem("invaders-hi"), 10) || 0; } catch (e) { hi = 0; }
    hiEl.textContent = hi;

    function spawn() {
      aliens = []; dir = 1; moveClock = 0; frameToggle = 0; bullets = []; bombs = [];
      for (var r = 0; r < 5; r++) for (var c = 0; c < 8; c++) aliens.push({ x: 40 + c * 38, y: 50 + r * 30, row: r, alive: true });
    }
    function reset() { score = 0; lives = 3; level = 1; player = { x: W / 2 - 12, y: H - 34, w: 26, h: 14 }; invuln = 0; fireCool = 0; spawn(); hud(); }
    function hud() { scoreEl.textContent = score; livesEl.textContent = lives; levelEl.textContent = level; hiEl.textContent = hi; }
    function sprite(frames, f, x, y, color, s) {
      g.fillStyle = color; var rows = frames[f];
      for (var r = 0; r < rows.length; r++) for (var c = 0; c < rows[r].length; c++) if (rows[r][c] === "#") g.fillRect(x + c * s, y + r * s, s, s);
    }
    function alive() { return aliens.filter(function (a) { return a.alive; }); }
    function fire() {
      if (mode !== "play") { reset(); mode = "play"; return; }
      if (fireCool <= 0 && bullets.length < 2) { bullets.push({ x: player.x + player.w / 2 - 1.5, y: player.y - 4 }); fireCool = 16; }
    }
    function end() { mode = "over"; if (score > hi) { hi = score; try { localStorage.setItem("invaders-hi", String(hi)); } catch (e) { /* storage blocked */ } } hud(); }

    function update(dt) {
      if (mode !== "play") return;
      if (keys.left) player.x -= 3.4 * dt;
      if (keys.right) player.x += 3.4 * dt;
      player.x = Math.max(4, Math.min(W - player.w - 4, player.x));
      if (keys.fire) fire();
      fireCool -= dt; if (invuln > 0) invuln -= dt;
      var live = alive();
      if (live.length === 0) { level++; score += 100; spawn(); hud(); return; }
      var interval = Math.max(3, 30 - (40 - live.length) * 0.65 - level * 2);
      moveClock += dt;
      if (moveClock >= interval) {
        moveClock = 0; frameToggle ^= 1;
        var edge = live.some(function (a) { return (dir > 0 && a.x + 24 + 8 > W - 6) || (dir < 0 && a.x - 8 < 6); });
        if (edge) { dir = -dir; live.forEach(function (a) { a.y += 12; }); }
        else live.forEach(function (a) { a.x += dir * 8; });
        if (live.some(function (a) { return a.y + 18 >= player.y; })) { end(); return; }
      }
      if (Math.random() < (0.012 + level * 0.003) * dt && live.length) {
        var shooter = live[Math.floor(Math.random() * live.length)];
        bombs.push({ x: shooter.x + 10, y: shooter.y + 18 });
      }
      bullets.forEach(function (b) { b.y -= 6.2 * dt; });
      bullets = bullets.filter(function (b) {
        if (b.y < -6) return false;
        for (var i = 0; i < aliens.length; i++) {
          var a = aliens[i];
          if (a.alive && b.x > a.x - 2 && b.x < a.x + 24 && b.y > a.y && b.y < a.y + 18) { a.alive = false; score += a.row === 0 ? 30 : a.row < 3 ? 20 : 10; hud(); return false; }
        }
        return true;
      });
      bombs.forEach(function (b) { b.y += (2.2 + level * 0.25) * dt; });
      bombs = bombs.filter(function (b) {
        if (b.y > H) return false;
        if (invuln <= 0 && b.x > player.x && b.x < player.x + player.w && b.y > player.y && b.y < player.y + player.h) {
          lives--; invuln = 80; hud(); if (lives <= 0) end(); return false;
        }
        return true;
      });
    }
    function center(text, y, color, size) {
      g.fillStyle = color; g.font = "bold " + size + "px ui-monospace, Consolas, monospace"; g.textAlign = "center"; g.fillText(text, W / 2, y); g.textAlign = "left";
    }
    function draw() {
      g.fillStyle = "#070918"; g.fillRect(0, 0, W, H);
      g.fillStyle = "rgba(95,217,224,0.5)"; for (var s = 0; s < 40; s++) g.fillRect((s * 97) % W, (s * 53) % (H - 60), 1, 1);
      if (aliens) aliens.forEach(function (a) {
        if (!a.alive) return;
        if (a.row === 0) sprite(SQUID, frameToggle, a.x + 4, a.y, "#ff8f80", 2);
        else sprite(BUG, frameToggle, a.x, a.y + 1, a.row < 3 ? "#5fd9e0" : "#a6f0f3", 2);
      });
      if (player && !(invuln > 0 && Math.floor(invuln / 6) % 2)) {
        g.fillStyle = "#1fc0c4"; g.fillRect(player.x, player.y + 6, player.w, 8); g.fillRect(player.x + 9, player.y + 2, 8, 6); g.fillRect(player.x + 11, player.y - 3, 4, 6);
      }
      g.fillStyle = "#fff"; (bullets || []).forEach(function (b) { g.fillRect(b.x, b.y, 3, 10); });
      g.fillStyle = "#ff8f80"; (bombs || []).forEach(function (b) { g.fillRect(b.x, b.y, 3, 9); });
      g.fillStyle = "#007d86"; g.fillRect(0, H - 14, W, 2);
      if (mode === "ready") { center("BUG INVADERS", H / 2 - 12, "#5fd9e0", 26); center("press space or tap FIRE", H / 2 + 18, "#d7dbff", 14); }
      if (mode === "over") { center("GAME OVER", H / 2 - 12, "#ff8f80", 28); center("score " + score + "  |  press space to retry", H / 2 + 20, "#d7dbff", 14); }
    }
    function loop(now) {
      if (!running) return;
      var dt = Math.min(2.5, (now - last) / 16.67); last = now;
      update(dt); draw();
      requestAnimationFrame(loop);
    }
    function bindHold(btn, key) {
      function on(e) { e.preventDefault(); keys[key] = true; }
      function off() { keys[key] = false; }
      btn.addEventListener("pointerdown", on); btn.addEventListener("pointerup", off); btn.addEventListener("pointerleave", off); btn.addEventListener("pointercancel", off);
    }
    bindHold(padL, "left"); bindHold(padR, "right");
    padF.addEventListener("pointerdown", function (e) { e.preventDefault(); fire(); keys.fire = mode === "play"; });
    ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) { padF.addEventListener(ev, function () { keys.fire = false; }); });
    padF.addEventListener("keydown", function (e) { if (e.key === "Enter") e.stopPropagation(); });

    reset(); mode = "ready"; draw();
    return {
      start: function () { if (running) return; running = true; last = performance.now(); requestAnimationFrame(loop); },
      stop: function () { running = false; keys.left = keys.right = keys.fire = false; },
      key: function (e, down) {
        var k = e.key;
        var map = { ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right", " ": "fire" };
        if (!map[k]) return false;
        e.preventDefault();
        if (map[k] === "fire") { if (down && !e.repeat) fire(); keys.fire = down && mode === "play"; }
        else keys[map[k]] = down;
        return true;
      }
    };
  })();

  /* ================= terminal ================= */
  var termOut = el("div", { class: "term-out", role: "log", "aria-live": "polite" });
  var termIn = el("input", { type: "text", autocomplete: "off", autocapitalize: "off", spellcheck: "false", "aria-label": "Terminal command" });
  var termWrap = el("div", { class: "term" }, [termOut, el("label", { class: "term-row" }, [el("span", { class: "prompt", text: "hugh@portfolio:~$" }), termIn])]);
  panels.terminal.appendChild(termWrap);
  panels.terminal.style.display = "";
  var history = [], hIdx = 0;

  function say(text, cls) { termOut.appendChild(el("p", cls ? { class: cls, text: text } : { text: text })); termOut.scrollTop = termOut.scrollHeight; }
  function sayLink(label, href) { var p = el("p"); p.appendChild(el("a", { href: href, target: href.indexOf("http") === 0 ? "_blank" : "_self", rel: "noopener", text: label })); termOut.appendChild(p); termOut.scrollTop = termOut.scrollHeight; }
  var COMMANDS = {
    help: function () { ["help          show this list", "whoami        who is this?", "skills        what I work with", "projects      my repositories", "cert          my TESDA certificate", "contact       how to reach me", "open <page>   home, about, skills, certifications, works, contact", "theme <mode>  dark | light", "lava <on|off> toggle the lava blobs", "trail <on|off> toggle the cursor trail", "matrix        you know what this does", "intro         replay the loading screen", "clear         clear the screen"].forEach(function (l) { say(l); }); },
    whoami: function () { say("Hugh Daniel J. Raymundo"); say("Computer Science student, City College of Calamba (3CS4)."); say("Builds web apps and language tools for Filipino users."); },
    skills: function () { say("web      HTML, CSS, JavaScript, Flask"); say("code     Python, Java, C, C++, Dart"); say("data     PostgreSQL, MySQL"); say("ai       sentiment analysis, Taglish NLP, XLM-RoBERTa"); say("design   Figma, branding, promo video"); say("systems  install, network, servers, repair"); },
    projects: function () { say("Mochi: The Chubby Cat"); sayLink("  github.com/knmontano/Mochi", "https://github.com/knmontano/Mochi"); say("CCC Campus Services"); sayLink("  github.com/hughtube-coder/CCC-Campus-Services", "https://github.com/hughtube-coder/CCC-Campus-Services"); say("Vanguard Logistics Yard"); sayLink("  github.com/hughtube-coder/vanguard-logistics-yard", "https://github.com/hughtube-coder/vanguard-logistics-yard"); },
    cert: function () { say("TESDA National Certificate II"); say("Computer Systems Servicing"); say("Issued May 4, 2024, valid until May 3, 2029."); },
    contact: function () { sayLink("hughraymundo@gmail.com", "mailto:hughraymundo@gmail.com"); sayLink("github.com/hughtube-coder", "https://github.com/hughtube-coder"); },
    ls: function () { say("index.html  about.html  skills.html  certifications.html  works.html  contact.html"); },
    open: function (a) { var p = PAGES[(a[0] || "").toLowerCase()]; if (!p) { say("usage: open <home|about|skills|certifications|works|contact>", "err"); return; } say("opening " + p + "..."); window.location.href = p; },
    theme: function (a) { if (a[0] !== "dark" && a[0] !== "light") { say("usage: theme <dark|light>", "err"); return; } SITE.setTheme(a[0]); say("theme set to " + a[0] + "."); },
    lava: function (a) { if (a[0] !== "on" && a[0] !== "off") { say("usage: lava <on|off>", "err"); return; } SITE.setFlag("lava", a[0] === "on"); say("lava blobs " + a[0] + "."); syncSwitches(); },
    trail: function (a) { if (a[0] !== "on" && a[0] !== "off") { say("usage: trail <on|off>", "err"); return; } SITE.setFlag("trail", a[0] === "on"); say("cursor trail " + a[0] + "."); syncSwitches(); },
    matrix: function () { say("following the white rabbit..."); closeConsole(true); fullScreenRain(3600); },
    intro: function () { try { sessionStorage.removeItem("seen"); } catch (e) { /* storage blocked */ } say("replaying the intro..."); setTimeout(function () { window.location.reload(); }, 500); },
    clear: function () { termOut.textContent = ""; },
    sudo: function (a) { if (a.join(" ") === "hire-me" || a.join(" ") === "hire me") { say("[sudo] permission granted. Send the offer to hughraymundo@gmail.com"); } else say("hugh is not in the sudoers file. This incident will be reported.", "err"); }
  };
  function runCommand(line) {
    var text = line.trim(); if (!text) return;
    say("hugh@portfolio:~$ " + text, "cmd");
    history.push(text); hIdx = history.length;
    var parts = text.split(/\s+/), name = parts.shift().toLowerCase();
    if (COMMANDS[name]) COMMANDS[name](parts); else say("command not found: " + name + ". Type help.", "err");
  }
  termIn.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { runCommand(termIn.value); termIn.value = ""; }
    else if (e.key === "ArrowUp") { e.preventDefault(); if (hIdx > 0) termIn.value = history[--hIdx]; }
    else if (e.key === "ArrowDown") { e.preventDefault(); hIdx = Math.min(hIdx + 1, history.length); termIn.value = history[hIdx] || ""; }
    else if (e.key === "Tab" && termIn.value) {
      // complete only when there is exactly one match; otherwise Tab moves focus as usual
      var m = Object.keys(COMMANDS).filter(function (c) { return c.indexOf(termIn.value.toLowerCase()) === 0; });
      if (m.length === 1) { e.preventDefault(); termIn.value = m[0] + " "; }
    }
  });
  say("hugh-shell 1.0. Type help to see what I can do.");

  /* ================= code tab ================= */
  var CODE = [
    ["c", "# whoami.py"], ["c", "# psst: you found the console."], ["n", "\n\n"],
    ["k", "class "], ["f", "Developer"], ["n", ":\n    "],
    ["n", "name = "], ["s", '"Hugh Daniel J. Raymundo"'], ["n", "\n    "],
    ["n", "school = "], ["s", '"City College of Calamba"'], ["n", "\n    "],
    ["n", "section = "], ["s", '"3CS4"'], ["n", "\n    "],
    ["n", "focus = ["], ["s", '"web apps"'], ["n", ", "], ["s", '"Taglish NLP"'], ["n", ", "], ["s", '"UI design"'], ["n", "]\n    "],
    ["n", "languages = ["], ["s", '"Python"'], ["n", ", "], ["s", '"Java"'], ["n", ", "], ["s", '"C"'], ["n", ", "], ["s", '"C++"'], ["n", ", "], ["s", '"Dart"'], ["n", ", "], ["s", '"JavaScript"'], ["n", "]\n    "],
    ["n", "databases = ["], ["s", '"PostgreSQL"'], ["n", ", "], ["s", '"MySQL"'], ["n", "]\n    "],
    ["n", "certified = "], ["s", '"TESDA NC II, Computer Systems Servicing"'], ["n", "\n    "],
    ["n", "thesis = "], ["s", '"LexiMetrix"'], ["n", "\n\n    "],
    ["k", "def "], ["f", "hire"], ["n", "(self):\n        "], ["k", "return "], ["s", '"hughraymundo@gmail.com"'], ["n", "\n\n\n"],
    ["f", "Developer"], ["n", "()."], ["f", "hire"], ["n", "()  "], ["c", "# let's build something."]
  ];
  var codePre = el("pre", { class: "code", "aria-label": "whoami.py, a short Python class describing Hugh" });
  var replay = el("button", { class: "console-btn", type: "button", text: "Replay" });
  panels.code.appendChild(codePre); panels.code.appendChild(replay);
  var typing = 0;
  var CLS = { k: "k", s: "s", c: "c", f: "f", n: "n" };
  function typeCode() {
    var token = ++typing;
    codePre.textContent = "";
    if (reduceMotion) { CODE.forEach(function (seg) { codePre.appendChild(el("span", { class: CLS[seg[0]], text: seg[1] })); }); return; }
    var caret = el("span", { class: "code-caret", "aria-hidden": "true" });
    codePre.appendChild(caret);
    var si = 0, ci = 0, span = null;
    (function step() {
      if (token !== typing) return;
      for (var k = 0; k < 4 && si < CODE.length; k++) {      // a few characters per tick keeps it snappy
        var seg = CODE[si];
        if (!span) { span = el("span", { class: CLS[seg[0]] }); codePre.insertBefore(span, caret); }
        span.textContent += seg[1][ci++];
        if (ci >= seg[1].length) { si++; ci = 0; span = null; }
      }
      if (si >= CODE.length) { caret.remove(); return; }
      setTimeout(step, 12);
    })();
  }
  replay.addEventListener("click", typeCode);

  /* ================= tabs, open, close ================= */
  var current = "theme", typedOnce = false;
  function selectTab(name, focus) {
    current = name;
    TABS.forEach(function (t) {
      var on = t[0] === name;
      tabs[t[0]].setAttribute("aria-selected", String(on)); tabs[t[0]].tabIndex = on ? 0 : -1;
      if (on) panels[t[0]].removeAttribute("hidden"); else panels[t[0]].setAttribute("hidden", "");
    });
    if (focus) tabs[name].focus();
    if (name === "invaders" && isOpen()) { game.start(); if (!focus) gameCanvas.focus({ preventScroll: true }); } else game.stop();
    if (name === "terminal") setTimeout(function () { termIn.focus(); }, 60);
    if (name === "code" && !typedOnce) { typedOnce = true; typeCode(); }
  }
  TABS.forEach(function (t, i) {
    tabs[t[0]].addEventListener("click", function () { selectTab(t[0], false); });
    tabs[t[0]].addEventListener("keydown", function (e) {
      var n = null;
      if (e.key === "ArrowRight") n = TABS[(i + 1) % TABS.length][0];
      else if (e.key === "ArrowLeft") n = TABS[(i + TABS.length - 1) % TABS.length][0];
      else if (e.key === "Home") n = TABS[0][0];
      else if (e.key === "End") n = TABS[TABS.length - 1][0];
      if (n) { e.preventDefault(); selectTab(n, true); }
    });
  });
  function isOpen() { return drawer.classList.contains("is-open"); }
  function openConsole() {
    syncSwitches();
    drawer.classList.add("is-open"); scrim.classList.add("is-open");
    selectTab(current, false);
    if (current !== "terminal") tabs[current].focus();
  }
  function closeConsole(skipFocus) {
    drawer.classList.remove("is-open"); scrim.classList.remove("is-open");
    game.stop();
    if (!skipFocus) photoBtn.focus();
  }
  closeBtn.addEventListener("click", function () { closeConsole(); });
  scrim.addEventListener("click", function () { closeConsole(); });
  document.addEventListener("keydown", function (e) {
    if (!isOpen()) return;
    if (e.key === "Escape") { closeConsole(); return; }
  });
  panels.invaders.addEventListener("keydown", function (e) { if (isOpen()) game.key(e, true); });
  panels.invaders.addEventListener("keyup", function (e) { game.key(e, false); });
  document.addEventListener("visibilitychange", function () { if (document.hidden) game.stop(); else if (isOpen() && current === "invaders") game.start(); });

  /* ================= the photo click ================= */
  var busy = false;
  photoBtn.addEventListener("click", function () {
    if (busy) return;
    if (reduceMotion) { openConsole(); return; }
    busy = true;
    var cv = photoBtn.querySelector(".photo-code");
    photoBtn.classList.add("is-coding");
    setTimeout(openConsole, 850);
    codeRain(cv, 1400, "> console.open()").then(function () { photoBtn.classList.remove("is-coding"); busy = false; });
  });
})();

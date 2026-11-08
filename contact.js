(function () {
  "use strict";

  var EMAIL = "hughraymundo@gmail.com";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function wait(ms) { return new Promise(function (r) { setTimeout(r, reduceMotion ? 0 : ms); }); }

  /* ---------- wave headline ---------- */
  var title = document.querySelector(".wave-title");
  if (title && !reduceMotion) {
    var text = title.textContent;
    title.setAttribute("aria-label", text);
    title.textContent = "";
    text.split("").forEach(function (ch, i) {
      var s = document.createElement("span");
      s.className = "wl"; s.setAttribute("aria-hidden", "true");
      s.style.setProperty("--i", i);
      s.textContent = ch === " " ? "\u00a0" : ch;
      title.appendChild(s);
    });
  }

  /* ---------- cursor spotlight on the contact cards ---------- */
  Array.prototype.forEach.call(document.querySelectorAll(".dcard"), function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
      card.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
    });
  });

  /* ---------- toast + copy ---------- */
  var toast = document.createElement("div");
  toast.className = "toast"; toast.setAttribute("role", "status");
  document.body.appendChild(toast);
  var toastTimer = null;
  function say(msg) {
    toast.textContent = msg; toast.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 2200);
  }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy") ? resolve() : reject(); } catch (e) { reject(e); } finally { ta.remove(); }
    });
  }
  var copyBtn = document.querySelector("[data-copy]");
  if (copyBtn) {
    var label = copyBtn.querySelector(".copy-label");
    copyBtn.addEventListener("click", function () {
      copyText(copyBtn.getAttribute("data-copy")).then(function () {
        copyBtn.classList.add("is-done"); label.textContent = "Copied";
        say("Email address copied");
        setTimeout(function () { copyBtn.classList.remove("is-done"); label.textContent = "Copy"; }, 2000);
      }).catch(function () { say("Copy failed. Select the address and copy it by hand."); });
    });
  }

  /* ---------- the chat ---------- */
  var chat = document.querySelector("[data-chat]");
  if (!chat) return;
  var log = chat.querySelector(".chat-log"), quick = chat.querySelector(".chat-quick"), form = chat.querySelector(".composer");
  var nameIn = form.elements.name, msgIn = form.elements.message, sendBtn = form.querySelector(".send");
  var topic = "", started = false;

  function toBottom() { log.scrollTop = log.scrollHeight; }
  function bubble(text, who) {
    var b = document.createElement("div");
    b.className = "bubble bubble--" + who; b.textContent = text;
    log.appendChild(b); toBottom();
    return b;
  }
  function typing(ms) {
    var t = document.createElement("div");
    t.className = "typing"; t.setAttribute("aria-hidden", "true");
    t.innerHTML = "<span></span><span></span><span></span>";
    log.appendChild(t); toBottom();
    return wait(ms).then(function () { t.remove(); });
  }
  function hugh(text, ms) { return typing(ms).then(function () { bubble(text, "them"); }); }

  var CHOICES = [
    ["A website", "Nice. What should it do, and who is it for?"],
    ["An app", "Great. What problem should it solve?"],
    ["A collaboration", "I\u2019m in. What are you working on?"],
    ["Just saying hi", "Hi there! Leave me a note below if you like."]
  ];
  function showChoices() {
    quick.hidden = false;
    CHOICES.forEach(function (c, i) {
      var b = document.createElement("button");
      b.type = "button"; b.textContent = c[0]; b.style.setProperty("--i", i);
      b.addEventListener("click", function () {
        Array.prototype.forEach.call(quick.children, function (x) { x.disabled = true; });
        topic = c[0];
        bubble(c[0], "me");
        hugh(c[1], 800).then(function () { msgIn.focus({ preventScroll: true }); });
      });
      quick.appendChild(b);
    });
  }
  function begin() {
    if (started) return;
    started = true;
    hugh("Hi, I\u2019m Hugh.", 700).then(function () { return hugh("What would you like to talk about?", 900); }).then(showChoices);
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) { if (entries[0].isIntersecting) { io.disconnect(); begin(); } }, { threshold: 0.35 });
    io.observe(chat);
  } else begin();

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var msg = msgIn.value.trim();
    if (msg.length < 3) {
      msgIn.classList.remove("shake"); void msgIn.offsetWidth; msgIn.classList.add("shake");
      hugh("Write a short message first, then hit send.", 500);
      msgIn.focus();
      return;
    }
    var name = nameIn.value.trim();
    bubble(msg, "me");
    sendBtn.classList.add("is-sending");
    setTimeout(function () { sendBtn.classList.remove("is-sending"); }, 1000);
    var subject = "Portfolio message" + (topic ? ": " + topic : "");
    var body = msg + (name ? "\n\n" + name : "");
    var href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    msgIn.value = "";
    hugh("Opening your email app. If nothing opens, use the Copy button and send it from your own email.", 900).then(function () { window.location.href = href; });
  });
})();

(() => {
  "use strict";

  const STORAGE_KEY = "auyel-answers-draft";
  const STEPS = ["welcome", "q1", "q2", "q3", "q4", "final", "pct", "letter", "dance"];

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const blank = () => ({ step: "welcome", q1: "", food: "", why: "", picks: [], more: "", q4: "", like: null, pct: 70, copied: false });
  let state = blank();

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved && typeof saved === "object") state = { ...state, ...saved };
  } catch { }
  if (!Array.isArray(state.picks)) state.picks = [];

  const save = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { } };

  const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const buzz = () => { try { navigator.vibrate?.(12); } catch { } };

  function heart({ left, top, x, y, size, char = "♡" }) {
    const h = document.createElement("span");
    h.className = "burst";
    h.setAttribute("aria-hidden", "true");
    h.textContent = char;
    if (left != null) { h.style.left = left + "px"; h.style.top = top + "px"; }
    h.style.setProperty("--x", x + "px");
    h.style.setProperty("--y", y + "px");
    h.style.setProperty("--r", (Math.random() * 100 - 50) + "deg");
    h.style.setProperty("--s", size + "px");
    document.body.append(h);
    setTimeout(() => h.remove(), 1600);
  }

  function puff(mascot) {
    if (calm() || !mascot) return;
    const r = mascot.getBoundingClientRect();
    const chars = ["♡", "♥", "✦", "✧"];
    heart({ left: r.left + r.width / 2 - 8, top: r.top + 16, x: Math.random() * 70 - 35, y: -90, size: 22, char: chars[Math.floor(Math.random() * chars.length)] });
  }

  function burst() {
    if (calm()) return;
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2, d = 120 + Math.random() * 220;
      heart({ x: Math.cos(a) * d, y: Math.sin(a) * d, size: 16 + Math.random() * 26, char: i % 5 === 0 ? "✦" : i % 2 ? "♥" : "♡" });
    }
  }
  function replay(node, cls) { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); }

  const mascotTemplate = $("#mascot-template");
  $$(".mascot").forEach((fig) => {
    fig.prepend(mascotTemplate.content.cloneNode(true));
    fig.style.setProperty("--blush", fig.dataset.blush || ".45");
    fig.addEventListener("click", () => { replay(fig, "hop"); puff(fig); buzz(); });
  });
  const mascotOf = (node) => $(".mascot", node.closest(".screen") || document);
  const setBlush = (mascot, v) => mascot?.style.setProperty("--blush", Math.max(.2, Math.min(1, v)));

  const TRACK_ID = "3iBgrkexCzVuPy4O9vx7Mf";
  const dock = $("#dock"), eq = $("#eq"), playBtn = $("#dock-play"), dockToggle = $("#dock-toggle");
  let spotify = null, dockStarted = false, dockFresh = false, everPlayed = false, loopPending = false;

  function setDockOpen(open) {
    dock.classList.toggle("collapsed", !open);
    document.body.classList.toggle("dock-open", open);
    dockToggle.setAttribute("aria-expanded", String(open));
  }
  function paintPlaying(playing) {
    eq.classList.toggle("on", playing);
    playBtn.textContent = playing ? "❚❚" : "▶";
    playBtn.setAttribute("aria-label", playing ? "pause" : "play");
    if (playing && !everPlayed) {
      everPlayed = true;
      $("#dock-hint").hidden = true;
      setTimeout(() => setDockOpen(false), 1800);
    }
  }
  function plainEmbed() {
    const slot = $("#spotify-embed");
    if (!slot) return;
    const frame = document.createElement("iframe");
    frame.src = `https://open.spotify.com/embed/track/${TRACK_ID}`;
    frame.title = "Glue Song by beabadoobee on Spotify";
    frame.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
    slot.replaceWith(frame);
    playBtn.hidden = true;
  }
  function onPlayback(e) {
    const d = e.data || {};
    paintPlaying(d.isPaused === false);
    if (d.duration > 0 && d.position >= d.duration - 700 && !loopPending) {
      loopPending = true;
      setTimeout(() => { loopPending = false; spotify?.restart?.(); }, 1200);
    }
  }
  function introduceMusic(keepOpenOnce = false) {
    if (dockStarted) return;
    dockStarted = true;
    dockFresh = keepOpenOnce;
    dock.hidden = false;
    document.body.classList.add("has-dock");
    setDockOpen(true);

    const fallback = setTimeout(plainEmbed, 6000);
    window.onSpotifyIframeApiReady = (api) => {
      const slot = $("#spotify-embed");
      if (!slot) return;
      clearTimeout(fallback);
      api.createController(slot, { uri: `spotify:track:${TRACK_ID}`, width: "100%", height: 80 }, (controller) => {
        spotify = controller;
        controller.addListener("playback_update", onPlayback);
      });
    };
    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    script.onerror = () => { clearTimeout(fallback); plainEmbed(); };
    document.head.append(script);
  }
  playBtn.addEventListener("click", () => {
    if (spotify) spotify.togglePlay();
    else setDockOpen(true);
  });
  dockToggle.addEventListener("click", () => setDockOpen(dock.classList.contains("collapsed")));

  let rainTimer = null;
  function rain(on, every = 320) {
    clearInterval(rainTimer);
    rainTimer = null;
    if (!on || calm()) return;
    rainTimer = setInterval(() => {
      const h = document.createElement("span");
      h.className = "rain";
      h.setAttribute("aria-hidden", "true");
      h.textContent = Math.random() < .5 ? "♡" : "♥";
      h.style.left = Math.random() * 96 + "vw";
      h.style.setProperty("--s", (14 + Math.random() * 22) + "px");
      h.style.setProperty("--t", (3.5 + Math.random() * 3) + "s");
      h.style.setProperty("--r", (Math.random() * 240 - 120) + "deg");
      document.body.append(h);
      setTimeout(() => h.remove(), 7000);
    }, every);
  }

  const screens = $$(".screen");

  let navToken = 0;
  function show(step, moveFocus = true) {
    if (!STEPS.includes(step)) step = "welcome";
    if (step === "pct" && state.like !== true) step = "final";
    if (step === "letter" && state.like === null) step = "final";
    if (step === "dance" && state.like !== true) step = state.like === null ? "final" : "letter";
    state.step = step;
    save();

    const current = screens.find((s) => !s.hidden);
    const next = $("#" + step);
    const token = ++navToken;

    const swap = () => {
      if (token !== navToken) return;
      if (step === "letter") prepareLetter();
      if (step === "final") $("#final .mascot").dataset.mood = "normal";
      screens.forEach((s) => { s.hidden = s !== next; s.classList.remove("leaving"); });
      if (dockFresh) dockFresh = false;
      else if (dockStarted) setDockOpen(false);
      rain(step === "dance" || (step === "letter" && state.like === true), step === "dance" ? 320 : 900);
      const form = $("form", next);
      if (form) refreshButton(form);
      if (moveFocus) {
        $("[tabindex='-1']", next)?.focus({ preventScroll: true });
        window.scrollTo(0, 0);
      }
    };

    if (!moveFocus || calm() || !current || current === next) { swap(); return; }
    current.classList.add("leaving");
    setTimeout(swap, 220);
  }

  function problem(form) {
    const need = form.dataset.require;
    if (!need) return "";
    const filled = need === "picks" ? state.picks.length > 0 : String(state[need] || "").trim() !== "";
    return filled ? "" : form.dataset.msg;
  }
  function refreshButton(form) {
    $("button[type='submit']", form)?.classList.toggle("wait", problem(form) !== "");
  }

  const foodEcho = (v) => { v = (v || "").trim(); return v ? `nava = ${v}?! 😭 okay, explain...` : ""; };
  function reaction(p) {
    if (p >= 100) return "NAVA.EXE HAS MELTED ♡♡♡";
    if (p >= 85) return "nava is blushing so hard rn ♡";
    if (p >= 60) return "awww, nava is smiling rn ♡";
    if (p >= 30) return "okay okay, a good start :3";
    return "hmm... nava will work harder :p";
  }
  function paintPct() {
    const input = $("#pct-input");
    input.value = state.pct;
    input.style.setProperty("--fill", state.pct + "%");
    $("#pct-value").textContent = state.pct + "% ♡";
    $("#pct-react").textContent = reaction(state.pct);
    setBlush(mascotOf(input), state.pct / 100);
    const meter = $("#meter");
    meter.style.setProperty("--p", state.pct);
    meter.style.setProperty("--beat", (1.3 - state.pct * 0.009).toFixed(2) + "s");
  }

  function summary() {
    const s = state, t = (v) => String(v || "").trim();
    return [
      "auyel's answers for nava ♡",
      "",
      "1. first impression: " + (t(s.q1) || "-"),
      "2. nava as a food: " + (t(s.food) || "-") + (t(s.why) ? ` (because ${t(s.why)})` : ""),
      "3. what caught my attention: " + (s.picks.join(", ") || "-") + (t(s.more) ? " | " + t(s.more) : ""),
      "4. the moment: " + (t(s.q4) || "(skipped)"),
      "",
      "do you like nava? " + (s.like ? `YES!! ♡ (${s.pct}%)` : "no... (but honest!)"),
    ].join("\n");
  }
  function prepareLetter() {
    const which = state.like ? "yes" : "no";
    $$("#letter [data-when]").forEach((n) => { n.hidden = n.dataset.when !== which; });
    setBlush($("#letter .mascot"), state.like ? 1 : .5);
    const box = $("#summary");
    box.value = summary();
    box.hidden = true;
    $("#copy-status").textContent = "";
    $("#continue-btn").hidden = !(state.like && state.copied);
  }
  function copyAnswers() {
    const box = $("#summary"), status = $("#copy-status");
    const unlock = () => {
      state.copied = true; save();
      const next = $("#continue-btn");
      if (state.like && next.hidden) { next.hidden = false; puff(mascotOf(next)); }
    };
    const done = () => { status.textContent = "copied! now paste it in your chat with nava :3"; unlock(); };
    const manual = () => {
      box.hidden = false; box.focus(); box.select();
      status.textContent = "select all of this, copy it, and send it to nava :3";
      unlock();
    };
    try { navigator.clipboard.writeText(box.value).then(done, manual); } catch { manual(); }
  }

  function fillFields() {
    for (const name of ["q1", "food", "why", "more", "q4"]) {
      const field = $(`[name="${name}"]`);
      if (field) field.value = state[name] || "";
    }
    $$("input[name='picks']").forEach((c) => { c.checked = state.picks.includes(c.value); });
    $("#food-echo").textContent = foodEcho(state.food);
    paintPct();
  }

  document.addEventListener("input", (e) => {
    const t = e.target;
    if (!t.name) return;
    const mascot = mascotOf(t);

    if (t.name === "picks") {
      state.picks = $$("input[name='picks']:checked").map((c) => c.value);
      setBlush(mascot, .5 + state.picks.length * .08);
      if (t.checked) puff(mascot);
      buzz();
    } else if (t.name === "pct") {
      state.pct = Number(t.value);
      paintPct();
      replay($("#pct-value"), "tick");
      if (state.pct % 10 === 0) puff(mascot);
    } else {
      state[t.name] = t.value;
      setBlush(mascot, .45 + t.value.length / 90);
      if (t.name === "food") $("#food-echo").textContent = foodEcho(t.value);
    }
    save();
    if (t.form) { refreshButton(t.form); if (!problem(t.form)) $(".hint[role='status']", t.form).textContent = ""; }
  });

  document.addEventListener("submit", (e) => {
    const form = e.target;
    if (!form.dataset.next) return;
    e.preventDefault();
    const msg = problem(form);
    if (msg) {
      $(".hint[role='status']", form).textContent = msg;
      replay($("button[type='submit']", form), "nope");
      return;
    }
    buzz();
    show(form.dataset.next);
  });

  const dialog = $("#no-dialog");
  const actions = {
    yes() {
      state.like = true;
      const m = $("#final .mascot");
      m.dataset.mood = "happy";
      setBlush(m, 1);
      replay(m, "hop");
      buzz();
      burst();
      setTimeout(() => show("pct"), calm() ? 0 : 700);
    },
    no() { dialog.showModal(); },
    "no-continue"() { dialog.close(); state.like = false; show("letter"); },
    "no-back"() { dialog.close(); },
    copy: copyAnswers,
    restart() { state = blank(); fillFields(); show("welcome"); },
  };
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    if (btn.dataset.go) {
      if (btn.dataset.go === "q1") introduceMusic(true);
      show(btn.dataset.go);
    }
    else if (actions[btn.dataset.action]) actions[btn.dataset.action]();
  });

  fillFields();
  show(state.step, false);
  if (state.step !== "welcome") introduceMusic();
})();
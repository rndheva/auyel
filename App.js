/* for auyel, from nava — all the behaviour.
   The HTML holds every screen as a <section>; this file only decides which one is
   visible, keeps her answers, and makes things react. */
(() => {
  "use strict";

  const STORAGE_KEY = "auyel-answers-draft";
  const STEPS = ["welcome", "q1", "q2", "q3", "q4", "final", "pct", "letter"];

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ---------- state ---------- */
  const blank = () => ({ step: "welcome", q1: "", food: "", why: "", picks: [], more: "", q4: "", like: null, pct: 70 });
  let state = blank();

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved && typeof saved === "object") state = { ...state, ...saved };
  } catch { /* private mode etc. — just start fresh */ }
  if (!Array.isArray(state.picks)) state.picks = [];

  const save = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ } };

  /* ---------- little effects ---------- */
  const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const buzz = () => { try { navigator.vibrate?.(12); } catch { /* ignore */ } };

  function heart({ left, top, x, y, size }) {
    const h = document.createElement("span");
    h.className = "burst";
    h.setAttribute("aria-hidden", "true");
    h.textContent = "♡";
    if (left != null) { h.style.left = left + "px"; h.style.top = top + "px"; }
    h.style.setProperty("--x", x + "px");
    h.style.setProperty("--y", y + "px");
    h.style.setProperty("--r", (Math.random() * 100 - 50) + "deg");
    h.style.setProperty("--s", size + "px");
    document.body.append(h);
    setTimeout(() => h.remove(), 1600);
  }
  /* one heart floating up from a mascot */
  function puff(mascot) {
    if (calm() || !mascot) return;
    const r = mascot.getBoundingClientRect();
    heart({ left: r.left + r.width / 2 - 8, top: r.top + 16, x: Math.random() * 70 - 35, y: -90, size: 22 });
  }
  /* lots of hearts from the middle of the screen (after YES) */
  function burst() {
    if (calm()) return;
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2, d = 120 + Math.random() * 220;
      heart({ x: Math.cos(a) * d, y: Math.sin(a) * d, size: 16 + Math.random() * 26 });
    }
  }
  function replay(node, cls) { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); }

  /* ---------- mascots: clone the <template> into every figure ---------- */
  const mascotTemplate = $("#mascot-template");
  $$(".mascot").forEach((fig) => {
    fig.append(mascotTemplate.content.cloneNode(true));
    fig.style.setProperty("--blush", fig.dataset.blush || ".45");
    fig.addEventListener("click", () => { replay(fig, "hop"); puff(fig); buzz(); });
  });
  const mascotOf = (node) => $(".mascot", node.closest(".screen") || document);
  const setBlush = (mascot, v) => mascot?.style.setProperty("--blush", Math.max(.2, Math.min(1, v)));

  /* ---------- navigation ---------- */
  const screens = $$(".screen");

  function show(step, moveFocus = true) {
    if (!STEPS.includes(step)) step = "welcome";
    if (step === "pct" && state.like !== true) step = "final";
    if (step === "letter" && state.like === null) step = "final";
    state.step = step;
    save();

    screens.forEach((s) => { s.hidden = s.id !== step; });
    const current = $("#" + step);
    if (step === "letter") prepareLetter();
    const form = $("form", current);
    if (form) refreshButton(form);

    if (moveFocus) {
      $("[tabindex='-1']", current)?.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
  }

  /* ---------- validation: forms say what they need via data-require / data-msg ---------- */
  function problem(form) {
    const need = form.dataset.require;
    if (!need) return "";
    const filled = need === "picks" ? state.picks.length > 0 : String(state[need] || "").trim() !== "";
    return filled ? "" : form.dataset.msg;
  }
  function refreshButton(form) {
    $("button[type='submit']", form)?.classList.toggle("wait", problem(form) !== "");
  }

  /* ---------- copy that reacts ---------- */
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
  }

  /* ---------- the letter screen ---------- */
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
  }
  function copyAnswers() {
    const box = $("#summary"), status = $("#copy-status");
    const done = () => { status.textContent = "copied! now paste it in your chat with nava :3"; };
    const manual = () => {
      box.hidden = false; box.focus(); box.select();
      status.textContent = "select all of this, copy it, and send it to nava :3";
    };
    try { navigator.clipboard.writeText(box.value).then(done, manual); } catch { manual(); }
  }

  /* ---------- put saved answers back into the fields ---------- */
  function fillFields() {
    for (const name of ["q1", "food", "why", "more", "q4"]) {
      const field = $(`[name="${name}"]`);
      if (field) field.value = state[name] || "";
    }
    $$("input[name='picks']").forEach((c) => { c.checked = state.picks.includes(c.value); });
    $("#food-echo").textContent = foodEcho(state.food);
    paintPct();
  }

  /* ---------- events ---------- */
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
    yes() { state.like = true; buzz(); burst(); show("pct"); },
    no() { dialog.showModal(); },
    "no-continue"() { dialog.close(); state.like = false; show("letter"); },
    "no-back"() { dialog.close(); },
    copy: copyAnswers,
    restart() { state = blank(); fillFields(); show("welcome"); },
  };
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    if (btn.dataset.go) show(btn.dataset.go);
    else if (actions[btn.dataset.action]) actions[btn.dataset.action]();
  });

  /* ---------- start ---------- */
  fillFields();
  show(state.step, false);
})();
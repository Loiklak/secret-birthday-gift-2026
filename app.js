"use strict";

/* ============================================================
   CONFIG  — passwords route identity (frontend only, no security)
   Hotspots are normalized (0..1) coords of the target head in the
   montage, derived by diffing the montages (see scripts/process_assets.py)
   ============================================================ */
const IMG_W = 1651, IMG_H = 1114;

const FRIENDS = {
  "michelle": {
    name: "Gilou",
    base: "assets/montage-4.jpg",      // 4 runners (anonymous head where Gilou will appear)
    landing: "assets/montage-5.jpg",   // Gilou now in the pack
    face: "assets/face-gilou.jpg",
    hotspot: { x: 0.3907, y: 0.1777, w: 0.1224, h: 0.1948 },
  },
  "bacon hart": {
    name: "Matth",
    base: "assets/montage-5.jpg",      // 5 runners (anonymous head where Matth will appear)
    landing: "assets/montage-6.jpg",   // all 6
    face: "assets/face-matth.jpg",
    hotspot: { x: 0.2998, y: 0.1795, w: 0.1108, h: 0.2029 },
  },
};

// Tailored hints for specific near-miss attempts (shown no matter when).
// Keys are normalized (lowercased, trimmed, collapsed spaces).
const NEAR_MISS = {
  "michel": "t'as oublié un petit détail 😏",
  "baconhart": "il manque un peu d'espace je crois 😏",
};

const TAUNTS = [
  "CODE INCORRECT.",
  "Toujours faux. Tu tapes avec les coudes ?",
  "Non. Même mon grille-pain aurait trouvé.",
  "Tu fais exprès, avoue.",
  "Indice : c'est PAS '1234'.",
  "On va y passer la nuit on dirait.",
  "Respire. Réfléchis. Recommence.",
  "Je commence sérieusement à avoir pitié.",
];

/* ============================================================
   ELEMENTS
   ============================================================ */
const $ = (id) => document.getElementById(id);
const loginScreen = $("login");
const expScreen = $("experience");
const termOutput = $("term-output");
const termForm = $("term-form");
const termInput = $("term-input");

const stage = $("stage");
const montageWrap = $("montageWrap");
const montage = $("montage");
const hotspot = $("hotspot");
const glitchHead = $("glitchHead");
const face = $("face");
const glitchBurst = $("glitchBurst");
const flash = $("flash");
const photoHint = $("photoHint");
const rotateOverlay = $("rotate");
const rotateSkip = $("rotate-skip");
const ending = $("ending");
const calReadout = $("calibrate-readout");

const CALIBRATE = new URLSearchParams(location.search).has("calibrate");

let cfg = null;            // current friend config
let phase = "login";       // login | rotate | photo | revealing | done
let skipRotate = false;
let photoReady = false;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Request fullscreen to hide the mobile browser chrome (URL bar / menu).
// Must be called from within a user gesture. No-op / silently ignored where
// unsupported (notably iOS Safari, which doesn't allow fullscreen on elements).
function goFullscreen() {
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!req) return;
  try {
    const p = req.call(el, { navigationUI: "hide" });
    if (p && p.catch) p.catch(() => {});
  } catch (e) { /* ignore */ }
}

/* ============================================================
   TERMINAL
   ============================================================ */
const terminal = document.querySelector(".terminal");
function scrollTerminal() {
  terminal.scrollTop = terminal.scrollHeight;
}

function appendLine(text, cls) {
  const div = document.createElement("div");
  div.className = "line" + (cls ? " " + cls : "");
  div.textContent = text;
  termOutput.appendChild(div);
  scrollTerminal();
  return div;
}

async function typeLine(text, cls, speed = 22) {
  const div = appendLine("", cls);
  for (let i = 0; i < text.length; i++) {
    div.textContent += text[i];
    scrollTerminal();
    await sleep(speed);
  }
  return div;
}

async function bootSequence() {
  await typeLine("SYSTÈME SÉCURISÉ — v1.27", null, 14);
  await typeLine("INITIALISATION DU NOYAU...", null, 14);
  await sleep(180);
  await typeLine("██████████████████  100%", null, 8);
  await sleep(120);
  await typeLine("ACCÈS RESTREINT.", "err", 18);
  await typeLine("ENTREZ LE CODE :", null, 18);
  termForm.hidden = false;
  termInput.focus();
}

function shakeAndReset() {
  termInput.value = "";
  loginScreen.classList.add("shake");
  setTimeout(() => loginScreen.classList.remove("shake"), 360);
  scrollTerminal();
}

// Tailored response for a recognised near-miss attempt.
function nearMiss(hint) {
  appendLine("ACCÈS REFUSÉ.", "err");
  appendLine("💡 " + hint, "hint");
  shakeAndReset();
}

let attempts = 0;
function wrongCode() {
  appendLine("ACCÈS REFUSÉ.", "err");
  // progressive hints toward the high-school codename
  if (attempts === 0) {
    appendLine("💡 Indice : quel est ton nom de code ?", "hint");
  } else if (attempts === 1) {
    appendLine("💡 Indice : au lycée 🎓", "hint");
  } else {
    appendLine(TAUNTS[Math.min(attempts - 1, TAUNTS.length - 1)], "err");
  }
  attempts++;
  shakeAndReset();
}

async function rightCode(friend) {
  termForm.hidden = true;
  cfg = friend;
  await sleep(150);
  await typeLine("ACCÈS AUTORISÉ", "ok", 26);
  await typeLine("IDENTIFICATION EN COURS...", null, 16);
  await sleep(350);
  await typeLine("IDENTITÉ CONFIRMÉE : " + friend.name.toUpperCase(), "ok", 26);
  await sleep(400);
  await typeLine("🎉 JOYEUX ANNIVERSAIRE " + friend.name.toUpperCase() + " !! 🎂", "ok", 40);
  await sleep(900);
  await typeLine("Tout ça a été préparé rien que pour toi...", null, 30);
  await sleep(700);
  await typeLine("⚠ ALERTE — INTRUSION DÉTECTÉE", "err", 22);
  await sleep(250);
  await typeLine("Quelqu'un est en train de forcer le système 😱", "err", 22);
  await typeLine("On n'a pas beaucoup de temps. Il faut faire VITE.", "err", 24);
  await sleep(500);
  await typeLine("Vite — regarde la photo avant qu'il soit trop tard.", null, 26);
  await typeLine("Quelque chose cloche 👀", null, 30);
  await sleep(500);
  const go = await typeLine("> [ appuie pour continuer ]", "ok", 22);
  go.style.cursor = "pointer";
  preload(friend);
  const launch = () => { loginScreen.removeEventListener("click", launch); goFullscreen(); launchExperience(); };
  loginScreen.addEventListener("click", launch);
}

function normalize(s) {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

termForm.addEventListener("submit", (e) => {
  e.preventDefault();
  goFullscreen(); // early gesture: go immersive on Android (hides URL bar)
  const raw = termInput.value.trim();
  const code = normalize(termInput.value);
  if (!code) return;
  appendLine("> " + raw); // echo the attempt, like a real terminal
  const friend = FRIENDS[code];
  if (friend) { rightCode(friend); return; }
  if (NEAR_MISS[code]) { nearMiss(NEAR_MISS[code]); return; }
  wrongCode();
});

/* ============================================================
   PRELOAD
   ============================================================ */
function preload(friend) {
  [friend.base, friend.landing, friend.face].forEach((src) => {
    const im = new Image();
    im.src = src;
  });
}

/* ============================================================
   LAYOUT  (object-fit: contain math)
   ============================================================ */
function containRect() {
  const cw = window.innerWidth, ch = window.innerHeight;
  const scale = Math.min(cw / IMG_W, ch / IMG_H);
  const w = IMG_W * scale, h = IMG_H * scale;
  return { x: (cw - w) / 2, y: (ch - h) / 2, w, h };
}

function hotspotRect() {
  const r = containRect();
  const hs = cfg.hotspot;
  let x = r.x + hs.x * r.w;
  let y = r.y + hs.y * r.h;
  let w = hs.w * r.w;
  let h = hs.h * r.h;
  // ensure a comfortable minimum tap target
  const MIN = 64;
  if (w < MIN) { x -= (MIN - w) / 2; w = MIN; }
  if (h < MIN) { y -= (MIN - h) / 2; h = MIN; }
  return { x, y, w, h };
}

function positionHotspot() {
  // enlarged invisible tap target
  const r = hotspotRect();
  hotspot.style.left = r.x + "px";
  hotspot.style.top = r.y + "px";
  hotspot.style.width = r.w + "px";
  hotspot.style.height = r.h + "px";

  // glitch head sits exactly on the real head, showing a live copy of it
  const full = containRect();
  const hs = cfg.hotspot;
  const hx = full.x + hs.x * full.w;
  const hy = full.y + hs.y * full.h;
  const hw = hs.w * full.w;
  const hh = hs.h * full.h;
  glitchHead.style.left = hx + "px";
  glitchHead.style.top = hy + "px";
  glitchHead.style.width = hw + "px";
  glitchHead.style.height = hh + "px";
  glitchHead.style.setProperty("--img", `url("${cfg.base}")`);
  glitchHead.style.setProperty("--bsize", `${full.w}px ${full.h}px`);
  glitchHead.style.setProperty("--bpos", `${-hs.x * full.w}px ${-hs.y * full.h}px`);
}

function showTarget(visible) {
  hotspot.hidden = !visible;
  glitchHead.hidden = !visible;
}

// Permanently dismantle the glitch head. On mobile Chrome/Brave, an element
// with mix-blend-mode + will-change + a running animation can leave a stale
// GPU layer behind when simply hidden — so we stop the animation, drop
// will-change, clear its paint, and detach it from the DOM entirely.
function killGlitchHead() {
  gsap.killTweensOf(glitchHead);
  glitchHead.style.animation = "none";
  glitchHead.style.willChange = "auto";
  glitchHead.style.backgroundImage = "none";
  glitchHead.hidden = true;
  if (glitchHead.parentNode) glitchHead.parentNode.removeChild(glitchHead);
}

function computeZoom() {
  const r = hotspotRect();
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const vw = window.innerWidth, vh = window.innerHeight;
  const s = Math.max(vw / r.w, vh / r.h); // fill screen with the head
  return { s, x: vw / 2 - cx * s, y: vh / 2 - cy * s };
}

/* ============================================================
   ORIENTATION
   ============================================================ */
function isPortrait() {
  return window.innerHeight > window.innerWidth;
}

function handleOrientation() {
  if (phase === "login" || phase === "done") return;
  if (phase === "revealing") return;
  if (isPortrait() && !skipRotate) {
    rotateOverlay.hidden = false;
    showTarget(false);
  } else {
    rotateOverlay.hidden = true;
    if (!photoReady) initPhoto();
    else { positionHotspot(); showTarget(true); }
  }
}

window.addEventListener("resize", handleOrientation);
window.addEventListener("orientationchange", () => setTimeout(handleOrientation, 200));

rotateSkip.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  goFullscreen();
  skipRotate = true;
  rotateOverlay.hidden = true;
  if (!photoReady) initPhoto();
  else { positionHotspot(); showTarget(true); }
});

/* ============================================================
   EXPERIENCE
   ============================================================ */
function launchExperience() {
  loginScreen.classList.remove("active");
  expScreen.classList.add("active");
  phase = "rotate";
  if (CALIBRATE) { startCalibrate(); return; }
  handleOrientation();
}

function initPhoto() {
  const onReady = () => {
    if (photoReady) return; // guard against onload + complete double-fire
    positionHotspot();
    showTarget(true);
    photoReady = true;
    phase = "photo";
    // glitch ramps in: 1s calm, then builds over 4s
    gsap.fromTo(glitchHead, { opacity: 0 },
      { opacity: 1, duration: 4, delay: 1, ease: "power2.in" });
    // hint appears once the glitch is noticeable
    gsap.to(photoHint, { opacity: 1, duration: 0.8, delay: 3, ease: "power1.out" });
  };
  gsap.set(montageWrap, { scale: 1, x: 0, y: 0, transformOrigin: "0 0" });
  gsap.set(face, { opacity: 0 });
  face.src = cfg.face; // load the real face now so it's decoded before the reveal
  montage.onload = onReady;
  montage.onerror = () => console.error("montage failed to load:", cfg.base);
  montage.src = cfg.base;
  // cached images may already be complete -> onload won't re-fire
  if (montage.complete && montage.naturalWidth) onReady();
}

// wrong taps near the photo: subtle nudge
stage.addEventListener("click", (e) => {
  if (phase !== "photo") return;
  if (e.target === hotspot) return;
  gsap.to(montageWrap, { duration: 0.3, ease: "power1.out",
    keyframes: { x: [0, -5, 5, -3, 0] } });
});

hotspot.addEventListener("click", (e) => {
  e.stopPropagation();
  if (phase !== "photo") return;
  // NB: don't request fullscreen here — the transition hitch can disrupt the
  // reveal animation. Fullscreen is already requested on submit / continue tap.
  reveal();
});

function reveal() {
  phase = "revealing";
  showTarget(false);
  killGlitchHead(); // fully remove it so no stale GPU layer lingers on mobile
  gsap.killTweensOf(photoHint);
  gsap.to(photoHint, { opacity: 0, duration: 0.2 });
  rotateOverlay.hidden = true;

  glitchBurst.classList.remove("on");
  void glitchBurst.offsetWidth; // restart animation
  glitchBurst.classList.add("on");

  // make sure the real face is loaded (in case initPhoto was skipped)
  if (face.getAttribute("src") !== cfg.face) face.src = cfg.face;

  const z = computeZoom();
  // onComplete (not positioned callbacks) so a frame hitch can't skip the reveal
  const tl = gsap.timeline({ onComplete: pullBack });
  // dive into the head
  tl.to(montageWrap, { scale: z.s, x: z.x, y: z.y, duration: 0.62, ease: "power2.in" }, 0);
  // flash + reveal the real face fullscreen (.set is applied even on big jumps)
  tl.to(flash, { opacity: 1, duration: 0.07 }, 0.5);
  tl.set(face, { opacity: 1 }, 0.5);
  tl.to(flash, { opacity: 0, duration: 0.28 }, 0.6);
  // hold on the BOOM before the pull-back
  tl.to({}, { duration: 0.6 });
}

function pullBack() {
  // swap montage (still zoomed on the head) to the landing version: head is now them
  montage.src = cfg.landing;
  const tl = gsap.timeline({ onComplete: showEnding });
  // crossfade the real face away to reveal the head now living in the pack
  tl.to(face, { opacity: 0, duration: 0.6, ease: "power1.out" }, 0.05);
  // dezoom back to the full montage
  tl.to(montageWrap, { scale: 1, x: 0, y: 0, duration: 1.3, ease: "power2.inOut" }, 0);
}

function showEnding() {
  phase = "done";
  if (cfg.name === "Matth") $("endingKicker").textContent = "ET VOILÀ, ON EST AU COMPLET";
  ending.hidden = false;
  gsap.fromTo(ending, { opacity: 0 }, { opacity: 1, duration: 1.0, ease: "power1.out" });
  gsap.fromTo(".ending-inner", { y: 26, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.9, delay: 0.25, ease: "power2.out" });
}

/* ============================================================
   CALIBRATE MODE  (?calibrate=1) — tap the head to read coords
   ============================================================ */
function startCalibrate() {
  phase = "photo";
  rotateOverlay.hidden = true;
  calReadout.hidden = false;
  calReadout.textContent = "CALIBRATE — tap the head";
  montage.src = cfg.base;
  gsap.set(montageWrap, { scale: 1, x: 0, y: 0 });
  positionHotspot();
  hotspot.hidden = false;
  hotspot.style.outline = "2px solid #0f0";
  stage.addEventListener("click", (e) => {
    const r = containRect();
    const nx = ((e.clientX - r.x) / r.w);
    const ny = ((e.clientY - r.y) / r.h);
    calReadout.textContent =
      "tapped normalized:\n x:" + nx.toFixed(4) + " y:" + ny.toFixed(4) +
      "\ncurrent hotspot:\n " + JSON.stringify(cfg.hotspot);
  });
}

/* ============================================================
   GO
   ============================================================ */
bootSequence();

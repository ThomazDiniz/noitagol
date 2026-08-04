const shared = {
  input:   document.getElementById("input"),
  colOff:  document.getElementById("colOff"),
  evenOff: document.getElementById("evenOff"),
  oddOff:  document.getElementById("oddOff"),
  swapOff: document.getElementById("swapOff"),
  rule:    document.getElementById("rule"),
  baseGap: document.getElementById("baseGap"),
  marginX: document.getElementById("marginX"),
  marginY: document.getElementById("marginY")
};

function boardDom(suffix) {
  return {
    wrap:     document.getElementById("wrap" + suffix),
    canvas:   document.getElementById("cv" + suffix),
    rle:      document.getElementById("rle" + suffix),
    dims:     document.getElementById("dims" + suffix),
    gen:      document.getElementById("gen" + suffix),
    speed:    document.getElementById("speed" + suffix),
    speedVal: document.getElementById("speedVal" + suffix),
    copyBtn:  document.getElementById("copy" + suffix),
    siteBtn:  document.getElementById("site" + suffix),
    playBtn:  document.getElementById("play" + suffix),
    stepBtn:  document.getElementById("step" + suffix),
    resetBtn: document.getElementById("reset" + suffix),
    invertBtn: document.getElementById("invert" + suffix),
    trimBtn:  document.getElementById("trim" + suffix),
    trailBtn: document.getElementById("trail" + suffix)
  };
}

function intVal(el, fallback) {
  const n = parseInt(el.value, 10);
  return isNaN(n) ? fallback : n;
}

let eyeMode = 0; // 0 = normal, 1 = invert inside, 2 = invert inside + contour

function buildEyesPattern() {
  const colOff  = intVal(shared.colOff, 0);
  const evenOff = intVal(shared.evenOff, 0);
  const oddOff  = intVal(shared.oddOff, 0);
  const eyeMap = eyeMode === 1 ? INVERTED_EYES
               : eyeMode === 2 ? INVERTED_EYES_FULL
               : EYES;
  return normalizeCells(buildEyeCells(shared.input.value, colOff, evenOff, oddOff, eyeMap));
}

let triadInvertEach = false;

function buildTriadPattern() {
  const baseGap = intVal(shared.baseGap, 1);
  const marginX = intVal(shared.marginX, 32);
  const marginY = intVal(shared.marginY, 32);
  return buildTriadTriangles(shared.input.value, baseGap, marginX, marginY, triadInvertEach);
}

function getRule() {
  return parseRule(shared.rule.value);
}

const eyesView  = createBoardView(boardDom("Eyes"), buildEyesPattern, getRule);
const triadView = createBoardView(boardDom("Triad"), buildTriadPattern, getRule);

const toggleEyes = document.getElementById("toggleEyes");
const eyesBody = document.getElementById("eyesBody");
let eyesOpen = true;

const toggleTriad = document.getElementById("toggleTriad");
const triadBody = document.getElementById("triadBody");
let triadOpen = false;

function refresh() {
  if (eyesOpen) eyesView.regenerate();
  if (triadOpen) triadView.regenerate();
}

toggleEyes.addEventListener("click", () => {
  eyesOpen = !eyesOpen;
  eyesBody.hidden = !eyesOpen;
  toggleEyes.innerHTML = eyesOpen ? "&#9662; Eyes" : "&#9656; Eyes";
  if (eyesOpen) eyesView.regenerate();
});

toggleTriad.addEventListener("click", () => {
  triadOpen = !triadOpen;
  triadBody.hidden = !triadOpen;
  toggleTriad.innerHTML = triadOpen ? "&#9662; Triads" : "&#9656; Triads";
  if (triadOpen) triadView.regenerate();
});

[shared.input, shared.rule, shared.colOff, shared.evenOff, shared.oddOff,
 shared.baseGap, shared.marginX, shared.marginY].forEach(el =>
  el.addEventListener("input", refresh));

const invertEyeOnly = document.getElementById("invertEyeOnly");
const invertEyeContour = document.getElementById("invertEyeContour");

function setActive(btn, on) {
  btn.style.background = on ? "#000" : "";
  btn.style.color = on ? "#fff" : "";
}

function setEyeMode(mode) {
  eyeMode = mode;
  invertEyeOnly.textContent = eyeMode === 1 ? "Invert eye: ON" : "Invert eye";
  invertEyeContour.textContent = eyeMode === 2 ? "Invert eye + contour: ON" : "Invert eye + contour";
  setActive(invertEyeOnly, eyeMode === 1);
  setActive(invertEyeContour, eyeMode === 2);
  if (eyesOpen) eyesView.regenerate();
}

invertEyeOnly.addEventListener("click", () => setEyeMode(eyeMode === 1 ? 0 : 1));
invertEyeContour.addEventListener("click", () => setEyeMode(eyeMode === 2 ? 0 : 2));

const invertTriadsOnly = document.getElementById("invertTriadsOnly");
invertTriadsOnly.addEventListener("click", () => {
  triadInvertEach = !triadInvertEach;
  invertTriadsOnly.textContent = triadInvertEach ? "Invert triads: ON" : "Invert triads";
  invertTriadsOnly.style.background = triadInvertEach ? "#000" : "";
  invertTriadsOnly.style.color = triadInvertEach ? "#fff" : "";
  if (triadOpen) triadView.regenerate();
});

shared.swapOff.addEventListener("click", () => {
  const even = shared.evenOff.value;
  shared.evenOff.value = shared.oddOff.value;
  shared.oddOff.value = even;
  refresh();
});

const presetSelect = document.getElementById("preset");
MESSAGES.forEach((message, i) => {
  const option = document.createElement("option");
  option.value = String(i);
  option.textContent = message.label;
  presetSelect.appendChild(option);
});
presetSelect.addEventListener("change", () => {
  const i = parseInt(presetSelect.value, 10);
  if (!isNaN(i) && MESSAGES[i]) {
    shared.input.value = MESSAGES[i].text;
    refresh();
  }
});

refresh();

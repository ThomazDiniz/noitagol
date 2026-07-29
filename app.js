const shared = {
  input:   document.getElementById("input"),
  colOff:  document.getElementById("colOff"),
  evenOff: document.getElementById("evenOff"),
  oddOff:  document.getElementById("oddOff"),
  swapOff: document.getElementById("swapOff"),
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

function buildEyesPattern() {
  const colOff  = intVal(shared.colOff, 0);
  const evenOff = intVal(shared.evenOff, 0);
  const oddOff  = intVal(shared.oddOff, 0);
  return normalizeCells(buildEyeCells(shared.input.value, colOff, evenOff, oddOff));
}

let triadInvertEach = false;

function buildTriadPattern() {
  const baseGap = intVal(shared.baseGap, 1);
  const marginX = intVal(shared.marginX, 10);
  const marginY = intVal(shared.marginY, 10);
  return buildTriadTriangles(shared.input.value, baseGap, marginX, marginY, triadInvertEach);
}

const eyesView  = createBoardView(boardDom("Eyes"), buildEyesPattern);
const triadView = createBoardView(boardDom("Triad"), buildTriadPattern);

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

[shared.input, shared.colOff, shared.evenOff, shared.oddOff,
 shared.baseGap, shared.marginX, shared.marginY].forEach(el =>
  el.addEventListener("input", refresh));

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

refresh();

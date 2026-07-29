const els = {
  input:   document.getElementById("input"),
  colOff:  document.getElementById("colOff"),
  evenOff: document.getElementById("evenOff"),
  oddOff:  document.getElementById("oddOff"),
  swapOff: document.getElementById("swapOff"),
  rle:     document.getElementById("rle"),
  dims:    document.getElementById("dims"),
  gen:     document.getElementById("gen"),
  speed:   document.getElementById("speed"),
  speedVal: document.getElementById("speedVal"),
  copyBtn:  document.getElementById("copyBtn"),
  siteBtn:  document.getElementById("siteBtn"),
  playBtn:  document.getElementById("playBtn"),
  stepBtn:  document.getElementById("stepBtn"),
  resetBtn: document.getElementById("resetBtn"),
  invertBtn: document.getElementById("invertBtn"),
  trimBtn:  document.getElementById("trimBtn"),
  wrap:     document.querySelector(".cvwrap"),
  canvas:   document.getElementById("cv")
};

const ctx = els.canvas.getContext("2d");
const camera = createCamera(els.wrap, els.canvas);

let pattern = { set: new Set(), W: 0, H: 0 };
let inverted = false;
let trimOn = false;
let margin = 500;
let cellPx = 1;

let board = new Set();
let generation = 0;
let timer = null;

function regenerate() {
  const colOff  = parseInt(els.colOff.value, 10)  || 0;
  const evenOff = parseInt(els.evenOff.value, 10) || 0;
  const oddOff  = parseInt(els.oddOff.value, 10)  || 0;

  const base = normalizeCells(buildEyeCells(els.input.value, colOff, evenOff, oddOff));
  pattern = inverted ? invertRegion(base) : base;

  els.rle.value = cellsToRLE(pattern.set, pattern.W, pattern.H);
  els.dims.textContent = pattern.W + " x " + pattern.H + " · " + pattern.set.size + " live cells";

  resetSim();
}

function resetSim() {
  stop();
  generation = 0;

  board = new Set();
  for (const key of pattern.set) {
    const [x, y] = key.split(",").map(Number);
    board.add((x + margin) + "," + (y + margin));
  }

  resizeCanvas();
  camera.fitRect(margin * cellPx, margin * cellPx, pattern.W * cellPx, pattern.H * cellPx);
  draw();
}

function resizeCanvas() {
  const gridW = pattern.W + margin * 2;
  const gridH = pattern.H + margin * 2;
  const maxPx = 900;
  cellPx = Math.max(1, Math.min(10, Math.floor(maxPx / Math.max(gridW, gridH, 1))));
  els.canvas.width = gridW * cellPx;
  els.canvas.height = gridH * cellPx;
}

function draw() {
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, els.canvas.width, els.canvas.height);

  ctx.fillStyle = "#000";
  for (const key of board) {
    const [x, y] = key.split(",").map(Number);
    ctx.fillRect(x * cellPx, y * cellPx, cellPx, cellPx);
  }

  if (trimOn) {
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.strokeRect(margin * cellPx + 0.5, margin * cellPx + 0.5,
                   pattern.W * cellPx - 1, pattern.H * cellPx - 1);
  }

  els.gen.textContent = "generation " + generation;
}

function stepOnce() {
  board = nextGeneration(board);
  generation++;
  draw();
}

function currentInterval() {
  const gps = parseInt(els.speed.value, 10) || 10;
  return 1000 / gps;
}

function play() {
  if (timer) return;
  els.playBtn.textContent = "Pause";
  timer = setInterval(stepOnce, currentInterval());
}

function stop() {
  if (timer) { clearInterval(timer); timer = null; }
  els.playBtn.textContent = "Start";
}

function toggle() {
  if (timer) stop(); else play();
}

[els.input, els.colOff, els.evenOff, els.oddOff].forEach(el =>
  el.addEventListener("input", regenerate));

els.swapOff.addEventListener("click", () => {
  const even = els.evenOff.value;
  els.evenOff.value = els.oddOff.value;
  els.oddOff.value = even;
  regenerate();
});

els.speed.addEventListener("input", () => {
  els.speedVal.textContent = els.speed.value;
  if (timer) { clearInterval(timer); timer = setInterval(stepOnce, currentInterval()); }
});

els.copyBtn.addEventListener("click", () => {
  els.rle.select();
  navigator.clipboard.writeText(els.rle.value).then(() => {
    const original = els.copyBtn.textContent;
    els.copyBtn.textContent = "Copied!";
    setTimeout(() => els.copyBtn.textContent = original, 1200);
  }).catch(() => document.execCommand("copy"));
});

els.siteBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(els.rle.value).catch(() => {});
  window.open("https://conwaylife.com/", "_blank");
});

els.playBtn.addEventListener("click", toggle);
els.stepBtn.addEventListener("click", () => { stop(); stepOnce(); });
els.resetBtn.addEventListener("click", resetSim);

els.invertBtn.addEventListener("click", () => {
  inverted = !inverted;
  els.invertBtn.textContent = inverted ? "Invert: ON" : "Invert";
  els.invertBtn.style.background = inverted ? "#000" : "";
  els.invertBtn.style.color = inverted ? "#fff" : "";
  regenerate();
});

els.trimBtn.addEventListener("click", () => {
  trimOn = !trimOn;
  margin = trimOn ? 0 : 500;
  els.trimBtn.textContent = trimOn ? "Trim: ON" : "Trim space";
  els.trimBtn.style.background = trimOn ? "#000" : "";
  els.trimBtn.style.color = trimOn ? "#fff" : "";
  resetSim();
});

regenerate();

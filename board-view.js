function createBoardView(dom, buildPattern) {
  const ctx = dom.canvas.getContext("2d");
  const camera = createCamera(dom.wrap, dom.canvas);

  let pattern = { set: new Set(), W: 0, H: 0 };
  let inverted = false;
  let trimOn = false;
  let margin = 500;
  let cellPx = 1;

  let board = new Set();
  let generation = 0;
  let timer = null;

  function regenerate() {
    const base = buildPattern();
    pattern = inverted ? invertRegion(base) : base;
    dom.rle.value = cellsToRLE(pattern.set, pattern.W, pattern.H);
    dom.dims.textContent = pattern.W + " x " + pattern.H + " · " + pattern.set.size + " live cells";
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
    dom.canvas.width = gridW * cellPx;
    dom.canvas.height = gridH * cellPx;
  }

  function draw() {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, dom.canvas.width, dom.canvas.height);

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

    dom.gen.textContent = "generation " + generation;
  }

  function stepOnce() {
    board = nextGeneration(board);
    generation++;
    draw();
  }

  function currentInterval() {
    const gps = parseInt(dom.speed.value, 10) || 10;
    return 1000 / gps;
  }

  function play() {
    if (timer) return;
    dom.playBtn.textContent = "Pause";
    timer = setInterval(stepOnce, currentInterval());
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    dom.playBtn.textContent = "Start";
  }

  function toggle() {
    if (timer) stop(); else play();
  }

  dom.speed.addEventListener("input", () => {
    dom.speedVal.textContent = dom.speed.value;
    if (timer) { clearInterval(timer); timer = setInterval(stepOnce, currentInterval()); }
  });

  dom.copyBtn.addEventListener("click", () => {
    dom.rle.select();
    navigator.clipboard.writeText(dom.rle.value).then(() => {
      const original = dom.copyBtn.textContent;
      dom.copyBtn.textContent = "Copied!";
      setTimeout(() => dom.copyBtn.textContent = original, 1200);
    }).catch(() => document.execCommand("copy"));
  });

  dom.siteBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(dom.rle.value).catch(() => {});
    window.open("https://conwaylife.com/", "_blank");
  });

  dom.playBtn.addEventListener("click", toggle);
  dom.stepBtn.addEventListener("click", () => { stop(); stepOnce(); });
  dom.resetBtn.addEventListener("click", resetSim);

  dom.invertBtn.addEventListener("click", () => {
    inverted = !inverted;
    dom.invertBtn.textContent = inverted ? "Invert: ON" : "Invert";
    dom.invertBtn.style.background = inverted ? "#000" : "";
    dom.invertBtn.style.color = inverted ? "#fff" : "";
    regenerate();
  });

  dom.trimBtn.addEventListener("click", () => {
    trimOn = !trimOn;
    margin = trimOn ? 0 : 500;
    dom.trimBtn.textContent = trimOn ? "Trim: ON" : "Trim space";
    dom.trimBtn.style.background = trimOn ? "#000" : "";
    dom.trimBtn.style.color = trimOn ? "#fff" : "";
    resetSim();
  });

  return { regenerate };
}

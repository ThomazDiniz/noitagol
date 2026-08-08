const EYES = {
  "0": ["00001110000", "00110001100", "01000100010", "10001110001", "01000100010", "00110001100", "00001110000"],
  "1": ["00001110000", "00110101100", "01001110010", "10000100001", "01000000010", "00110001100", "00001110000"],
  "2": ["00001110000", "00110001100", "01000010010", "10000111001", "01000010010", "00110001100", "00001110000"],
  "3": ["00001110000", "00110001100", "01000000010", "10000100001", "01001110010", "00110101100", "00001110000"],
  "4": ["00001110000", "00110001100", "01001000010", "10011100001", "01001000010", "00110001100", "00001110000"]
};

const EYE_W = 11;
const EYE_H = 7;

function floodExterior(grid, W, H) {
  const exterior = Array.from({ length: H }, () => Array(W).fill(false));
  const stack = [];
  for (let x = 0; x < W; x++) { stack.push([x, 0]); stack.push([x, H - 1]); }
  for (let y = 0; y < H; y++) { stack.push([0, y]); stack.push([W - 1, y]); }

  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    if (exterior[y][x] || grid[y][x] !== 0) continue;
    exterior[y][x] = true;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return exterior;
}

function invertEyeInterior(eye) {
  const H = eye.length;
  const W = eye[0].length;
  const grid = eye.map(row => row.split("").map(c => (c === "1" ? 1 : 0)));
  const exterior = floodExterior(grid, W, H);

  function touchesExterior(x, y) {
    if (x === 0 || y === 0 || x === W - 1 || y === H - 1) return true;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < W && ny < H && exterior[ny][nx]) return true;
      }
    }
    return false;
  }

  const out = [];
  for (let y = 0; y < H; y++) {
    let row = "";
    for (let x = 0; x < W; x++) {
      if (exterior[y][x]) {
        row += "0";                    // outside the eye: untouched
      } else if (grid[y][x] === 1) {
        row += touchesExterior(x, y) ? "1" : "0"; // outline stays, inner fill flips off
      } else {
        row += "1";                    // enclosed empty flips on
      }
    }
    out.push(row);
  }
  return out;
}

function invertEyeAll(eye) {
  const H = eye.length;
  const W = eye[0].length;
  const grid = eye.map(row => row.split("").map(c => (c === "1" ? 1 : 0)));
  const exterior = floodExterior(grid, W, H);

  const out = [];
  for (let y = 0; y < H; y++) {
    let row = "";
    for (let x = 0; x < W; x++) {
      if (exterior[y][x]) row += "0";              // outside stays untouched
      else row += grid[y][x] === 1 ? "0" : "1";    // flip the whole shape (contour + inside)
    }
    out.push(row);
  }
  return out;
}

const INVERTED_EYES = {};
const INVERTED_EYES_FULL = {};
for (const key in EYES) {
  INVERTED_EYES[key] = invertEyeInterior(EYES[key]);
  INVERTED_EYES_FULL[key] = invertEyeAll(EYES[key]);
}

function buildEyeCells(text, colOffset, evenOffset, oddOffset, eyeMap) {
  const eyes = eyeMap || EYES;
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const cells = new Set();

  lines.forEach((line, row) => {
    const xStart = (row % 2 === 0) ? evenOffset : oddOffset;
    const y0 = row * EYE_H;

    for (let col = 0; col < line.length; col++) {
      const eye = eyes[line[col]];
      if (!eye) continue;

      const x0 = xStart + col * (EYE_W + colOffset);
      for (let dy = 0; dy < EYE_H; dy++) {
        for (let dx = 0; dx < EYE_W; dx++) {
          if (eye[dy][dx] === "1") cells.add((x0 + dx) + "," + (y0 + dy));
        }
      }
    }
  });

  return cells;
}

function placeEye(cells, digit, x0, y0, eyeMap) {
  const eye = (eyeMap || EYES)[digit];
  if (!eye) return;
  for (let dy = 0; dy < EYE_H; dy++) {
    for (let dx = 0; dx < EYE_W; dx++) {
      if (eye[dy][dx] === "1") cells.add((x0 + dx) + "," + (y0 + dy));
    }
  }
}

function readTriads(topLine, botLine) {
  const triads = [];
  let pt = 0, pb = 0, down = true;
  while (pt < topLine.length && pb < botLine.length) {
    if (down) {
      if (pt + 1 >= topLine.length) break;
      triads.push({ type: "down", top: [topLine[pt], topLine[pt + 1]], bottom: [botLine[pb]] });
      pt += 2;
      pb += 1;
    } else {
      if (pb + 1 >= botLine.length) break;
      triads.push({ type: "up", top: [topLine[pt]], bottom: [botLine[pb], botLine[pb + 1]] });
      pt += 1;
      pb += 2;
    }
    down = !down;
  }
  return triads;
}

function buildTriadTriangles(text, baseGap, marginX, marginY, invertEach, eyeMap) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const cells = new Set();
  const pitch = EYE_W + baseGap;
  const half = Math.round(pitch / 2);
  const triadWidth = EYE_W + pitch;
  const triadHeight = EYE_H * 2;
  const stepX = triadWidth + marginX;
  const stepY = triadHeight + marginY;

  let stripY = 0;
  for (let s = 0; s < lines.length; s += 2) {
    const topLine = lines[s];
    const botLine = lines[s + 1] !== undefined ? lines[s + 1] : "";
    const triads = readTriads(topLine, botLine);

    triads.forEach((triad, i) => {
      const ox = i * stepX;
      const oy = stripY;

      const local = new Set();
      if (triad.type === "down") {
        placeEye(local, triad.top[0], 0, 0, eyeMap);
        placeEye(local, triad.top[1], pitch, 0, eyeMap);
        placeEye(local, triad.bottom[0], half, EYE_H, eyeMap);
      } else {
        placeEye(local, triad.bottom[0], 0, EYE_H, eyeMap);
        placeEye(local, triad.bottom[1], pitch, EYE_H, eyeMap);
        placeEye(local, triad.top[0], half, 0, eyeMap);
      }

      if (invertEach) {
        for (let y = 0; y < triadHeight; y++) {
          for (let x = 0; x < triadWidth; x++) {
            if (!local.has(x + "," + y)) cells.add((ox + x) + "," + (oy + y));
          }
        }
      } else {
        for (const key of local) {
          const [x, y] = key.split(",").map(Number);
          cells.add((ox + x) + "," + (oy + y));
        }
      }
    });

    stripY += stepY;
  }
  return normalizeCells(cells);
}

function normalizeCells(cells) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const key of cells) {
    const [x, y] = key.split(",").map(Number);
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  if (!isFinite(minX)) return { set: new Set(), W: 0, H: 0 };

  const set = new Set();
  for (const key of cells) {
    const [x, y] = key.split(",").map(Number);
    set.add((x - minX) + "," + (y - minY));
  }
  return { set, W: maxX - minX + 1, H: maxY - minY + 1 };
}

function invertRegion(pattern) {
  if (pattern.W === 0) return pattern;
  const set = new Set();
  for (let y = 0; y < pattern.H; y++) {
    for (let x = 0; x < pattern.W; x++) {
      const key = x + "," + y;
      if (!pattern.set.has(key)) set.add(key);
    }
  }
  return { set, W: pattern.W, H: pattern.H };
}

function cellsToRLE(set, W, H, rule) {
  const ruleStr = rule || "B3/S23";
  if (W === 0) return "x = 0, y = 0, rule = " + ruleStr + "\n!";

  let body = "";
  for (let y = 0; y < H; y++) {
    let lastAlive = -1;
    for (let x = 0; x < W; x++) {
      if (set.has(x + "," + y)) lastAlive = x;
    }

    let rowText = "";
    let runLength = 0;
    let runValue = null;
    const flush = () => {
      if (runLength > 0) rowText += (runLength > 1 ? runLength : "") + (runValue ? "o" : "b");
    };

    for (let x = 0; x <= lastAlive; x++) {
      const alive = set.has(x + "," + y);
      if (runValue === null) { runValue = alive; runLength = 1; }
      else if (alive === runValue) { runLength++; }
      else { flush(); runValue = alive; runLength = 1; }
    }
    flush();

    body += rowText;
    if (y < H - 1) body += "$";
  }
  body += "!";

  body = body.replace(/\$+/g, m => (m.length > 1 ? m.length + "$" : "$"));

  const tokens = body.match(/\d*[bo$]|!/g) || [];
  let out = "x = " + W + ", y = " + H + ", rule = " + ruleStr + "\n";
  let line = "";
  for (const token of tokens) {
    if (line.length + token.length > 70) { out += line + "\n"; line = ""; }
    line += token;
  }
  return out + line;
}

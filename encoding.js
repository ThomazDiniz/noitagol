const EYES = {
  "0": ["00001110000", "00110001100", "01000100010", "10001110001", "01000100010", "00110001100", "00001110000"],
  "1": ["00001110000", "00110101100", "01001110010", "10000100001", "01000000010", "00110001100", "00001110000"],
  "2": ["00001110000", "00110001100", "01000010010", "10000111001", "01000010010", "00110001100", "00001110000"],
  "3": ["00001110000", "00110001100", "01000000010", "10000100001", "01001110010", "00110101100", "00001110000"],
  "4": ["00001110000", "00110001100", "01001000010", "10011100001", "01001000010", "00110001100", "00001110000"]
};

const EYE_W = 11;
const EYE_H = 7;

function buildEyeCells(text, colOffset, evenOffset, oddOffset) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const cells = new Set();

  lines.forEach((line, row) => {
    const xStart = (row % 2 === 0) ? evenOffset : oddOffset;
    const y0 = row * EYE_H;

    for (let col = 0; col < line.length; col++) {
      const eye = EYES[line[col]];
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

function cellsToRLE(set, W, H) {
  if (W === 0) return "x = 0, y = 0, rule = B3/S23\n!";

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
  let out = "x = " + W + ", y = " + H + ", rule = B3/S23\n";
  let line = "";
  for (const token of tokens) {
    if (line.length + token.length > 70) { out += line + "\n"; line = ""; }
    line += token;
  }
  return out + line;
}

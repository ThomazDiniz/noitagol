function parseRule(str) {
  const match = /^\s*[bB]([0-9]*)\/[sS]([0-9]*)\s*$/.exec(str || "");
  if (!match) {
    return { string: "B3/S23", birth: new Set([3]), survive: new Set([2, 3]) };
  }
  const birth = new Set(match[1].split("").map(Number));
  const survive = new Set(match[2].split("").map(Number));
  return { string: "B" + match[1] + "/S" + match[2], birth, survive };
}

function nextGeneration(live, rule) {
  const birth = (rule && rule.birth) || new Set([3]);
  const survive = (rule && rule.survive) || new Set([2, 3]);

  const neighbourCounts = new Map();
  const bump = (x, y) => {
    const key = x + "," + y;
    neighbourCounts.set(key, (neighbourCounts.get(key) || 0) + 1);
  };

  for (const key of live) {
    const [x, y] = key.split(",").map(Number);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx !== 0 || dy !== 0) bump(x + dx, y + dy);
      }
    }
  }

  const next = new Set();
  for (const [key, count] of neighbourCounts) {
    if (live.has(key) ? survive.has(count) : birth.has(count)) next.add(key);
  }
  return next;
}

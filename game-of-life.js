function nextGeneration(live) {
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
    if (count === 3 || (count === 2 && live.has(key))) next.add(key);
  }
  return next;
}

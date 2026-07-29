function createCamera(viewport, target) {
  let zoom = 1;
  let panX = 0;
  let panY = 0;

  function apply() {
    target.style.transform = "translate(" + panX + "px," + panY + "px) scale(" + zoom + ")";
  }

  function fitRect(x, y, w, h, fill = 0.9) {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    if (vw > 0 && vh > 0 && w > 0 && h > 0) {
      zoom = Math.min(vw * fill / w, vh * fill / h);
      panX = vw / 2 - (x + w / 2) * zoom;
      panY = vh / 2 - (y + h / 2) * zoom;
    } else {
      zoom = 1; panX = 0; panY = 0;
    }
    apply();
  }

  viewport.addEventListener("wheel", (e) => {
    e.preventDefault();
    const rect = viewport.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const newZoom = Math.max(0.05, Math.min(60, zoom * factor));

    const worldX = (mx - panX) / zoom;
    const worldY = (my - panY) / zoom;
    panX = mx - worldX * newZoom;
    panY = my - worldY * newZoom;
    zoom = newZoom;
    apply();
  }, { passive: false });

  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  viewport.addEventListener("mousedown", (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    viewport.classList.add("dragging");
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    panX += e.clientX - lastX;
    panY += e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    apply();
  });

  window.addEventListener("mouseup", () => {
    dragging = false;
    viewport.classList.remove("dragging");
  });

  return { fitRect, apply };
}

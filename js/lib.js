// Utilitários compartilhados (scripts clássicos: funcionam até abrindo o index.html direto).
window.PF = window.PF || {};

PF.env = {
  reducedMotion: () => matchMedia('(prefers-reduced-motion: reduce)').matches,
  finePointer: () => matchMedia('(hover: hover) and (pointer: fine)').matches,
};

PF.lerp = (a, b, t) => a + (b - a) * t;
PF.pad = (n) => String(n).padStart(2, '0');
PF.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Mola amortecida 2D avançada via rAF. */
PF.spring = function ({ stiffness = 170, damping = 18, mass = 1 } = {}, onUpdate) {
  const s = { x: 0, y: 0, tx: 0, ty: 0, vx: 0, vy: 0 };
  let raf = 0, last = 0;
  const step = (now) => {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    s.vx += ((-stiffness * (s.x - s.tx) - damping * s.vx) / mass) * dt;
    s.vy += ((-stiffness * (s.y - s.ty) - damping * s.vy) / mass) * dt;
    s.x += s.vx * dt; s.y += s.vy * dt;
    onUpdate(s.x, s.y);
    const rest = Math.abs(s.vx) + Math.abs(s.vy) < 0.01 && Math.abs(s.x - s.tx) + Math.abs(s.y - s.ty) < 0.01;
    if (rest) { s.x = s.tx; s.y = s.ty; onUpdate(s.x, s.y); raf = 0; }
    else raf = requestAnimationFrame(step);
  };
  return {
    set(x, y) { s.tx = x; s.ty = y; if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); } },
    jump(x, y) { s.x = s.tx = x; s.y = s.ty = y; s.vx = s.vy = 0; onUpdate(x, y); },
  };
};

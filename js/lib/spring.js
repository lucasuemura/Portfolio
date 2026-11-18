// Mola amortecida 2D (integração semi-implícita de Euler), avançada via rAF.
export function createSpring({ stiffness = 170, damping = 18, mass = 1 } = {}, onUpdate) {
  const s = { x: 0, y: 0, tx: 0, ty: 0, vx: 0, vy: 0 };
  let raf = 0;
  let last = 0;

  const step = (now) => {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    const ax = (-stiffness * (s.x - s.tx) - damping * s.vx) / mass;
    const ay = (-stiffness * (s.y - s.ty) - damping * s.vy) / mass;
    s.vx += ax * dt; s.vy += ay * dt;
    s.x += s.vx * dt; s.y += s.vy * dt;
    onUpdate(s.x, s.y);
    const resting = Math.abs(s.vx) + Math.abs(s.vy) < 0.01 && Math.abs(s.x - s.tx) + Math.abs(s.y - s.ty) < 0.01;
    if (resting) {
      s.x = s.tx; s.y = s.ty; onUpdate(s.x, s.y); raf = 0;
    } else {
      raf = requestAnimationFrame(step);
    }
  };

  return {
    set(x, y) { s.tx = x; s.ty = y; if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); } },
    jump(x, y) { s.x = s.tx = x; s.y = s.ty = y; s.vx = s.vy = 0; onUpdate(x, y); },
  };
}

// Efeitos ligados ao ponteiro: spotlight do hero e brilho das pills.
import { lerp } from '../lib/env.js';

/** Spotlight radial em cinza que segue o mouse com atraso suave. */
export function initSpotlight(hero) {
  const spot = hero.querySelector('.hero__spot');
  let tx = 0.7, ty = 0.3, x = tx, y = ty, raf = 0;

  const tick = () => {
    x = lerp(x, tx, 0.08); y = lerp(y, ty, 0.08);
    spot.style.setProperty('--sx', `${x * 100}%`);
    spot.style.setProperty('--sy', `${y * 100}%`);
    raf = Math.abs(x - tx) + Math.abs(y - ty) > 0.0005 ? requestAnimationFrame(tick) : 0;
  };

  hero.addEventListener('pointermove', (e) => {
    const r = spot.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width;
    ty = (e.clientY - r.top) / r.height;
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });
}

/** Atualiza --mouse-x/--mouse-y em qualquer .glow sob o ponteiro (inclui toque). */
export function initGlow() {
  const update = (e) => {
    const el = e.target.closest?.('.glow');
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mouse-x', `${e.clientX - r.left}px`);
    el.style.setProperty('--mouse-y', `${e.clientY - r.top}px`);
  };
  document.addEventListener('pointermove', update, { passive: true });
  document.addEventListener('pointerdown', (e) => {
    update(e);
    const el = e.target.closest?.('.glow');
    if (el && e.pointerType !== 'mouse') {
      el.style.setProperty('--glow', '1');
      setTimeout(() => el.style.removeProperty('--glow'), 500);
    }
  });
}

// Ponto branco com física de mola; expande e mostra rótulo sobre [data-cursor].
import { createSpring } from '../lib/spring.js';

export function initCursor(el) {
  const label = el.querySelector('.cursor__label');
  const spring = createSpring({ stiffness: 520, damping: 34 }, (x, y) => {
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  });

  document.documentElement.classList.add('has-cursor');
  let seen = false;
  let current = '';
  let mx = -1, my = -1;

  const resolve = (node) => {
    const target = node?.closest?.('[data-cursor]');
    const text = target ? target.dataset.cursor : '';
    if (text !== current) {
      current = text;
      if (text) label.textContent = text;
      el.classList.toggle('is-label', Boolean(text));
    }
  };
  // Depois de rolar ou clicar, o elemento sob o ponteiro (ou seu rótulo) pode ter mudado
  const refresh = () => { if (seen) resolve(document.elementFromPoint(mx, my)); };

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    mx = e.clientX; my = e.clientY;
    if (!seen) { spring.jump(mx, my); seen = true; }
    spring.set(mx, my);
    el.classList.remove('is-hidden');
    resolve(e.target);
  }, { passive: true });
  window.addEventListener('scroll', refresh, { passive: true });
  window.addEventListener('click', () => requestAnimationFrame(refresh));

  window.addEventListener('pointerdown', () => el.classList.add('is-down'));
  window.addEventListener('pointerup', () => el.classList.remove('is-down'));
  document.addEventListener('pointerleave', () => el.classList.add('is-hidden'));
  document.documentElement.addEventListener('mouseleave', () => el.classList.add('is-hidden'));

  // Permite que outros módulos troquem o rótulo na hora (ex.: "Copiado!")
  return {
    flash(text) { current = text; label.textContent = text; el.classList.add('is-label'); },
  };
}

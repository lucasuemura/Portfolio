// Botões magnéticos (delegação: funciona para elementos renderizados depois).
import { createSpring } from '../lib/spring.js';

const STRENGTH = 0.28;
const LABEL_EXTRA = 0.14;
const springs = new WeakMap();

function springsFor(el) {
  let s = springs.get(el);
  if (!s) {
    const label = el.querySelector('.mag__label');
    s = {
      box: createSpring({ stiffness: 220, damping: 16 }, (x, y) => { el.style.transform = `translate3d(${x}px, ${y}px, 0)`; }),
      label: label && createSpring({ stiffness: 220, damping: 16 }, (x, y) => { label.style.transform = `translate3d(${x}px, ${y}px, 0)`; }),
    };
    springs.set(el, s);
  }
  return s;
}

const setOrigin = (el, e) => {
  const r = el.getBoundingClientRect();
  el.style.setProperty('--x', `${((e.clientX - r.left) / r.width) * 100}%`);
  el.style.setProperty('--y', `${((e.clientY - r.top) / r.height) * 100}%`);
};

/** Origem do preenchimento sempre segue o ponto de entrada/saída (também em toque). */
export function initFillOrigin() {
  document.addEventListener('pointerover', (e) => {
    const el = e.target.closest?.('.mag');
    if (el && !el.contains(e.relatedTarget)) setOrigin(el, e);
  });
  document.addEventListener('pointerout', (e) => {
    const el = e.target.closest?.('.mag');
    if (el && !el.contains(e.relatedTarget)) setOrigin(el, e);
  });
}

export function initMagnetic() {
  let active = null;

  const release = () => {
    if (!active) return;
    const s = springsFor(active);
    s.box.set(0, 0); s.label?.set(0, 0);
    active = null;
  };

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const el = e.target.closest?.('[data-magnetic]');
    if (el !== active) release();
    if (!el) return;
    active = el;

    // Mede sem o deslocamento atual para não "fugir" do cursor
    const r = el.getBoundingClientRect();
    const t = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    const cx = r.left - t.m41 + r.width / 2;
    const cy = r.top - t.m42 + r.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const s = springsFor(el);
    s.box.set(dx * STRENGTH, dy * STRENGTH);
    s.label?.set(dx * LABEL_EXTRA, dy * LABEL_EXTRA);
  }, { passive: true });

  document.documentElement.addEventListener('mouseleave', release);
}

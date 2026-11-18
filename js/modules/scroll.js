// Smooth scroll (Lenis, opcional), barra de progresso e estado da navegação.
const LENIS_URL = 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.mjs';

export async function initScroll({ smooth }) {
  const bar = document.querySelector('.progress__bar');
  const nav = document.querySelector('[data-nav]');
  let lenis = null;

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    nav.classList.toggle('is-scrolled', y > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  if (smooth) {
    try {
      const { default: Lenis } = await import(LENIS_URL);
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    } catch {
      lenis = null; // CDN indisponível: segue com scroll nativo
    }
  }

  // Âncoras internas
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id === '#topo' ? document.body : document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(id === '#topo' ? 0 : target, { offset: -24, duration: 1.4 });
    else target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    history.replaceState(null, '', id);
    if (target !== document.body) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  });

  return lenis;
}

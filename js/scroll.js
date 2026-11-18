// Smooth scroll (Lenis, opcional), barra de progresso e estado da navegação.
(function () {
  const LENIS_URL = 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.mjs';

  PF.initScroll = async function ({ smooth }) {
    const bar = document.querySelector('.progress__bar');
    const nav = document.querySelector('[data-nav]');
    let lenis = null;

    const onScroll = () => {
      const y = scrollY;
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      nav.classList.toggle('is-scrolled', y > 40);
    };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    onScroll();

    document.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      const target = id === '#topo' ? document.body : document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(id === '#topo' ? 0 : target, { offset: -24, duration: 1.4 });
      else target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
      if (location.protocol !== 'file:') history.replaceState(null, '', id);
    });

    if (smooth && /^https?:$/.test(location.protocol)) {
      try {
        const { default: Lenis } = await import(LENIS_URL);
        lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
        const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
      } catch { lenis = null; /* sem CDN: scroll nativo */ }
    }
  };
})();

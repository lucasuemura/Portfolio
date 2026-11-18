// Tudo que reage ao ponteiro, toque e rolagem.
(function () {
  /* ---------- Cursor com mola e rótulos ---------- */
  PF.initCursor = function (el) {
    const label = el.querySelector('.cursor__label');
    const spring = PF.spring({ stiffness: 520, damping: 34 }, (x, y) => {
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
    document.documentElement.classList.add('has-cursor');
    let seen = false, current = '', mx = -1, my = -1;

    const resolve = (node) => {
      const target = node && node.closest && node.closest('[data-cursor]');
      const text = target ? target.dataset.cursor : '';
      if (text === current) return;
      current = text;
      if (text) label.textContent = text;
      el.classList.toggle('is-label', Boolean(text));
    };
    const refresh = () => { if (seen) resolve(document.elementFromPoint(mx, my)); };

    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      if (!seen) { spring.jump(mx, my); seen = true; }
      spring.set(mx, my);
      el.classList.remove('is-hidden');
      resolve(e.target);
    }, { passive: true });
    addEventListener('scroll', refresh, { passive: true });
    addEventListener('click', () => requestAnimationFrame(refresh));
    addEventListener('pointerdown', () => el.classList.add('is-down'));
    addEventListener('pointerup', () => el.classList.remove('is-down'));
    document.documentElement.addEventListener('mouseleave', () => el.classList.add('is-hidden'));
  };

  /* ---------- Botões magnéticos (delegação: vale para itens renderizados depois) ---------- */
  PF.initMagnetic = function () {
    const springs = new WeakMap();
    const get = (el) => {
      let s = springs.get(el);
      if (!s) {
        const label = el.querySelector('.mag__label');
        s = {
          box: PF.spring({ stiffness: 220, damping: 16 }, (x, y) => { el.style.transform = `translate3d(${x}px, ${y}px, 0)`; }),
          label: label && PF.spring({ stiffness: 220, damping: 16 }, (x, y) => { label.style.transform = `translate3d(${x}px, ${y}px, 0)`; }),
        };
        springs.set(el, s);
      }
      return s;
    };
    let active = null;
    const release = () => {
      if (!active) return;
      const s = get(active); s.box.set(0, 0); if (s.label) s.label.set(0, 0);
      active = null;
    };
    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const el = e.target.closest && e.target.closest('[data-magnetic]');
      if (el !== active) release();
      if (!el) return;
      active = el;
      const r = el.getBoundingClientRect();
      const t = new DOMMatrixReadOnly(getComputedStyle(el).transform);
      const dx = e.clientX - (r.left - t.m41 + r.width / 2);
      const dy = e.clientY - (r.top - t.m42 + r.height / 2);
      const s = get(el);
      s.box.set(dx * 0.28, dy * 0.28);
      if (s.label) s.label.set(dx * 0.14, dy * 0.14);
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', release);
  };

  /** O preenchimento dos botões nasce (e sai) pelo ponto onde o ponteiro cruza a borda. */
  PF.initFillOrigin = function () {
    const set = (e) => {
      const el = e.target.closest && e.target.closest('.mag');
      if (!el || el.contains(e.relatedTarget)) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--x', `${((e.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty('--y', `${((e.clientY - r.top) / r.height) * 100}%`);
    };
    document.addEventListener('pointerover', set);
    document.addEventListener('pointerout', set);
  };

  /** --mouse-x/--mouse-y para pills (.glow) e caixas (.lit): brilho que segue o cursor/dedo. */
  PF.initGlow = function () {
    const update = (e) => {
      const el = e.target.closest && e.target.closest('.glow, .lit');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mouse-x', `${e.clientX - r.left}px`);
      el.style.setProperty('--mouse-y', `${e.clientY - r.top}px`);
      return el;
    };
    document.addEventListener('pointermove', update, { passive: true });
    document.addEventListener('pointerdown', (e) => {
      const el = update(e);
      if (el && e.pointerType !== 'mouse') {
        el.classList.add('is-touched');
        setTimeout(() => el.classList.remove('is-touched'), 650);
      }
    });
  };

  /** Spotlight cinza do hero, seguindo o mouse com atraso. */
  PF.initSpotlight = function (hero) {
    const spot = hero.querySelector('.hero__spot');
    let tx = 0.7, ty = 0.3, x = tx, y = ty, raf = 0;
    const tick = () => {
      x = PF.lerp(x, tx, 0.08); y = PF.lerp(y, ty, 0.08);
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
  };

  /** Divide títulos em letras: cada letra reage ao hover e entra em cascata. */
  PF.splitChars = function () {
    document.querySelectorAll('[data-split]').forEach((el) => {
      const text = el.textContent.trim();
      el.setAttribute('aria-label', text);
      el.innerHTML = [...text].map((c, i) => c === ' '
        ? '<span class="char char--space" aria-hidden="true"> </span>'
        : `<span class="char" aria-hidden="true" style="--ci:${i}">${PF.esc(c)}</span>`).join('');
    });
  };

  /** Revela elementos [data-reveal] uma vez, quando entram na tela. */
  PF.initReveal = function () {
    const items = document.querySelectorAll('[data-reveal]');
    if (PF.env.reducedMotion() || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-in'));
      return;
    }
    document.documentElement.classList.add('can-reveal');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    items.forEach((el) => io.observe(el));
  };

  /** Destaca na navegação a seção que está na tela. */
  PF.initNavSpy = function () {
    const links = [...document.querySelectorAll('.nav__links a')];
    const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const a = map.get(en.target.id);
        if (en.isIntersecting) {
          links.forEach((l) => l.removeAttribute('aria-current'));
          a.setAttribute('aria-current', 'true');
        } else if (a.getAttribute('aria-current')) a.removeAttribute('aria-current');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  };
})();

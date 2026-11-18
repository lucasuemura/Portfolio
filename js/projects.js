// Seção de projetos: grupos recolhíveis, filtro por linguagem (FLIP) e linhas com acordeão.
(function () {
  const ALL = 'Todos';
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const SPRINGY = 'cubic-bezier(0.34, 1.3, 0.64, 1)';
  const fmtDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  const { esc, pad } = PF;

  const state = { filter: ALL, open: new Set(PF.groups.filter((g) => g.open).map((g) => g.id)) };
  let els = null;

  PF.initProjects = function (opts) {
    els = opts;
    bindGroups();
    bindFilters();
  };

  /** Renderiza (ou re-renderiza preservando filtro e grupos abertos). */
  PF.renderProjects = function (repos) {
    const { root, filtersEl } = els;
    if (!repos.length) {
      root.innerHTML = '<p class="plist__empty">Não foi possível carregar os repositórios. Veja todos em github.com/lucasuemura.</p>';
      return;
    }

    // Filtros com contagem
    const counts = new Map();
    repos.forEach((r) => counts.set(r.lang, (counts.get(r.lang) || 0) + 1));
    if (state.filter !== ALL && !counts.has(state.filter)) state.filter = ALL;
    const langs = [...counts.entries()].sort((a, b) => (a[0] === 'Outros') - (b[0] === 'Outros') || b[1] - a[1] || a[0].localeCompare(b[0]));
    filtersEl.querySelectorAll('.fpill').forEach((p) => p.remove());
    filtersEl.insertAdjacentHTML('beforeend', [[ALL, repos.length], ...langs].map(([g, n]) => `
      <button class="glow fpill" type="button" data-lang="${esc(g)}" aria-pressed="${g === state.filter}" data-cursor="Filtrar">
        <span>${esc(g)}</span><span class="glow__n">${n}</span>
      </button>`).join(''));
    requestAnimationFrame(() => moveSlab(true));

    // Grupos
    root.innerHTML = PF.groups.map((g) => {
      const list = repos.filter((r) => r.group === g.id);
      if (!list.length) return '';
      const open = state.open.has(g.id);
      return `
      <section class="pgroup${open ? ' is-open' : ''}" data-group="${g.id}">
        <button class="pgroup__head lit" type="button" aria-expanded="${open}" aria-controls="g-${g.id}" data-cursor="${open ? 'Recolher' : 'Expandir'}">
          <span class="pgroup__title">${esc(g.title)}</span>
          <span class="pgroup__note">${esc(g.note)}</span>
          <span class="pgroup__count" data-count>${pad(list.length)}</span>
          <span class="pgroup__icon" aria-hidden="true"></span>
        </button>
        <div class="pgroup__body" id="g-${g.id}"${open ? '' : ' inert'}>
          <div class="pgroup__inner">
            <ol class="plist${g.id === 'projetos' ? '' : ' plist--compact'}">${list.map(rowTemplate).join('')}</ol>
          </div>
        </div>
      </section>`;
    }).join('');

    root.querySelectorAll('.prow').forEach(bindRow);
    applyVisibility();
  };

  /* ---------- Templates ---------- */
  function rowTemplate(r) {
    const id = `p-${r.id}`;
    const desc = r.description
      ? `<p class="prow__desc">${esc(r.description)}</p>`
      : `<p class="prow__desc is-empty">Este repositório ainda não tem descrição no GitHub.</p>`;
    const topics = r.topics.length ? `<ul class="prow__topics">${r.topics.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '';
    const demo = r.homepage
      ? `<a class="mag" href="${esc(r.homepage)}" target="_blank" rel="noopener noreferrer" data-magnetic data-cursor="Abrir ↗"><span class="mag__fill" aria-hidden="true"></span><span class="mag__label">Ver demo ↗</span></a>`
      : '';
    return `
    <li class="prow" data-lang="${esc(r.lang)}">
      <button class="prow__head" type="button" aria-expanded="false" aria-controls="${id}" data-cursor="Detalhes">
        <span class="prow__idx" data-idx></span>
        <span class="prow__name">${esc(r.name)}</span>
        <span class="prow__lang">${esc(r.language || 'Sem linguagem')}</span>
        <span class="prow__year">${r.pushed.getFullYear()}</span>
        <span class="prow__arrow" aria-hidden="true">↗</span>
      </button>
      <div class="prow__body" id="${id}" inert>
        <div class="prow__inner">
          <div class="prow__detail">
            ${desc}
            <dl class="prow__facts">
              <dt>Repositório</dt><dd>${esc(r.raw)}</dd>
              <dt>Último push</dt><dd>${fmtDate.format(r.pushed)}</dd>
              <dt>Criado em</dt><dd>${fmtDate.format(r.created)}</dd>
              <dt>Stars</dt><dd>${r.stars}</dd>
            </dl>
            ${topics}
            <div class="prow__links">
              <a class="mag mag--solid" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" data-magnetic data-cursor="Abrir ↗"><span class="mag__fill" aria-hidden="true"></span><span class="mag__label">Ver código ↗</span></a>
              ${demo}
            </div>
          </div>
        </div>
      </div>
    </li>`;
  }

  /* ---------- Grupos ---------- */
  function bindGroups() {
    els.root.addEventListener('click', (e) => {
      const head = e.target.closest('.pgroup__head');
      if (!head) return;
      const group = head.closest('.pgroup');
      const open = !group.classList.contains('is-open');
      group.classList.toggle('is-open', open);
      head.setAttribute('aria-expanded', open);
      head.dataset.cursor = open ? 'Recolher' : 'Expandir';
      group.querySelector('.pgroup__body').inert = !open;
      open ? state.open.add(group.dataset.group) : state.open.delete(group.dataset.group);
      if (!open) group.querySelectorAll('.prow.is-open').forEach(closeRow);
      else if (!PF.env.reducedMotion()) {
        // Linhas entram em cascata quando o grupo abre
        [...group.querySelectorAll('.prow:not([hidden])')].slice(0, 14).forEach((r, i) => r.animate(
          [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }],
          { duration: 480, delay: 60 + i * 28, easing: EASE, fill: 'backwards' },
        ));
      }
    });
  }

  /* ---------- Filtros ---------- */
  function moveSlab(instant) {
    const pill = els.filtersEl.querySelector('.fpill[aria-pressed="true"]');
    const slab = els.slabEl;
    if (!pill) return;
    if (instant) slab.style.transition = 'none';
    slab.style.width = `${pill.offsetWidth}px`;
    slab.style.height = `${pill.offsetHeight}px`;
    slab.style.transform = `translate(${pill.offsetLeft}px, ${pill.offsetTop}px)`;
    if (instant) { void slab.offsetWidth; slab.style.transition = ''; }
    slab.classList.add('is-ready');
    els.filtersEl.classList.add('has-slab');
  }

  function bindFilters() {
    window.addEventListener('resize', () => moveSlab(true));
    if (document.fonts) document.fonts.ready.then(() => moveSlab(true));
    els.filtersEl.addEventListener('click', (e) => {
      const pill = e.target.closest('.fpill');
      if (!pill || pill.getAttribute('aria-pressed') === 'true') return;
      els.filtersEl.querySelectorAll('.fpill').forEach((p) => p.setAttribute('aria-pressed', String(p === pill)));
      state.filter = pill.dataset.lang;
      moveSlab(PF.env.reducedMotion());
      filterWithFlip();
    });
  }

  const matches = (row) => state.filter === ALL || row.dataset.lang === state.filter;

  /** Aplica filtro: esconde linhas, atualiza contagens e numeração, some com grupos vazios. */
  function applyVisibility() {
    els.root.querySelectorAll('.pgroup').forEach((g) => {
      let n = 0;
      g.querySelectorAll('.prow').forEach((r) => {
        const show = matches(r);
        r.hidden = !show;
        if (!show) closeRow(r);
        else r.querySelector('[data-idx]').textContent = pad(++n);
      });
      g.querySelector('[data-count]').textContent = pad(n);
      g.hidden = n === 0;
    });
  }

  /* FLIP em dois níveis: grupos se movem; linhas se movem relativas ao próprio grupo. */
  let busy = false, queued = false;
  async function filterWithFlip() {
    if (busy) { queued = true; return; }
    busy = true;
    const motion = !PF.env.reducedMotion();
    const groups = [...els.root.querySelectorAll('.pgroup')];
    const rows = [...els.root.querySelectorAll('.pgroup.is-open .prow')];
    const top = (el) => el.getBoundingClientRect().top;

    const leaving = rows.filter((r) => !r.hidden && !matches(r) && inView(r));
    if (motion && leaving.length) {
      await Promise.all(leaving.map((r) => r.animate(
        [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-16px)' }],
        { duration: 180, easing: EASE, fill: 'forwards' },
      ).finished));
    }

    const firstG = new Map(groups.filter((g) => !g.hidden).map((g) => [g, top(g)]));
    const firstR = new Map(rows.filter((r) => !r.hidden).map((r) => [r, top(r) - top(r.closest('.pgroup'))]));

    rows.forEach((r) => r.getAnimations().forEach((a) => a.cancel()));
    applyVisibility();

    if (motion) {
      groups.filter((g) => !g.hidden).forEach((g) => {
        if (firstG.has(g)) {
          const dy = firstG.get(g) - top(g);
          if (Math.abs(dy) > 0.5) g.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 650, easing: SPRINGY });
        } else {
          g.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: EASE });
        }
      });
      let k = 0;
      rows.filter((r) => !r.hidden).forEach((r) => {
        const rel = top(r) - top(r.closest('.pgroup'));
        if (firstR.has(r)) {
          const dy = firstR.get(r) - rel;
          if (Math.abs(dy) > 0.5) r.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 650, easing: SPRINGY });
        } else if (inView(r)) {
          r.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }],
            { duration: 500, delay: Math.min(k++, 12) * 30, easing: EASE, fill: 'backwards' });
        }
      });
    }

    busy = false;
    if (queued) { queued = false; filterWithFlip(); }
  }

  const inView = (el) => { const r = el.getBoundingClientRect(); return r.bottom > -100 && r.top < innerHeight + 100; };

  /* ---------- Linhas ---------- */
  function bindRow(row) {
    const head = row.querySelector('.prow__head');
    const list = row.parentElement;
    row.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      row.classList.add('is-hot');
      list.classList.add('is-hovering');
    });
    row.addEventListener('pointerleave', () => {
      row.classList.remove('is-hot');
      list.classList.remove('is-hovering');
    });
    head.addEventListener('focus', () => row.classList.add('is-hot'));
    head.addEventListener('blur', () => row.classList.remove('is-hot'));
    head.addEventListener('click', () => {
      const opening = !row.classList.contains('is-open');
      els.root.querySelectorAll('.prow.is-open').forEach((r) => r !== row && closeRow(r));
      opening ? openRow(row) : closeRow(row);
    });
  }

  function openRow(row) {
    row.classList.add('is-open');
    const head = row.querySelector('.prow__head');
    head.setAttribute('aria-expanded', 'true');
    head.dataset.cursor = 'Fechar';
    row.querySelector('.prow__body').inert = false;
  }
  function closeRow(row) {
    if (!row.classList.contains('is-open')) return;
    row.classList.remove('is-open');
    const head = row.querySelector('.prow__head');
    head.setAttribute('aria-expanded', 'false');
    head.dataset.cursor = 'Detalhes';
    row.querySelector('.prow__body').inert = true;
  }
})();

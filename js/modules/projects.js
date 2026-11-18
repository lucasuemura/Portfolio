// Lista editorial de projetos: render, filtro com FLIP e acordeão.
import { reducedMotion } from '../lib/env.js';

const ALL = 'Todos';
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const SPRINGY = 'cubic-bezier(0.34, 1.3, 0.64, 1)';

const fmtDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
const pad = (n) => String(n).padStart(2, '0');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function initProjects({ repos, listEl, filtersEl, slabEl }) {
  if (!repos.length) {
    listEl.innerHTML = '<li class="plist__empty">Não foi possível carregar os repositórios agora. Veja todos em github.com/lucasuemura.</li>';
    return;
  }

  listEl.innerHTML = repos.map(rowTemplate).join('');
  const rows = [...listEl.querySelectorAll('.prow')];
  renumber(rows);

  buildFilters(repos, filtersEl, slabEl, (group) => applyFilter(group, rows, listEl));
  bindRows(rows, listEl);
}

/* ---------- Templates ---------- */
function rowTemplate(r) {
  const bodyId = `p-${r.id}`;
  const desc = r.description
    ? `<p class="prow__desc">${esc(r.description)}</p>`
    : `<p class="prow__desc is-empty">Este repositório ainda não tem descrição no GitHub.</p>`;
  const topics = r.topics.length
    ? `<ul class="prow__topics" aria-label="Tópicos">${r.topics.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`
    : '';
  const demo = r.homepage
    ? `<a class="mag" href="${esc(r.homepage)}" target="_blank" rel="noopener noreferrer" data-magnetic data-cursor="Abrir ↗"><span class="mag__fill" aria-hidden="true"></span><span class="mag__label">Ver demo ↗</span></a>`
    : '';

  return `
  <li class="prow" data-group="${esc(r.group)}">
    <button class="prow__head" type="button" aria-expanded="false" aria-controls="${bodyId}" data-cursor="Expandir">
      <span class="prow__idx" data-idx></span>
      <span class="prow__name">${esc(r.name)}</span>
      <span class="prow__lang">${esc(r.language || 'Sem linguagem')}</span>
      <span class="prow__year">${r.pushed.getFullYear()}</span>
      <span class="prow__arrow" aria-hidden="true">↗</span>
    </button>
    <div class="prow__body" id="${bodyId}" inert>
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

function renumber(rows) {
  let i = 0;
  rows.forEach((r) => { if (!r.hidden) r.querySelector('[data-idx]').textContent = pad(++i); });
}

/* ---------- Filtros ---------- */
function buildFilters(repos, filtersEl, slabEl, onChange) {
  const counts = new Map();
  repos.forEach((r) => counts.set(r.group, (counts.get(r.group) || 0) + 1));
  const groups = [...counts.entries()]
    .sort((a, b) => (a[0] === 'Outros') - (b[0] === 'Outros') || b[1] - a[1] || a[0].localeCompare(b[0]));

  const items = [[ALL, repos.length], ...groups];
  filtersEl.insertAdjacentHTML('beforeend', items.map(([g, n], i) => `
    <button class="glow fpill" type="button" data-group="${esc(g)}" aria-pressed="${i === 0}" data-cursor="Filtrar">
      <span>${esc(g)}</span><span class="glow__n">${n}</span>
    </button>`).join(''));

  const pills = [...filtersEl.querySelectorAll('.fpill')];

  const moveSlab = (pill, instant) => {
    if (instant) slabEl.style.transition = 'none';
    slabEl.style.width = `${pill.offsetWidth}px`;
    slabEl.style.height = `${pill.offsetHeight}px`;
    slabEl.style.transform = `translate(${pill.offsetLeft}px, ${pill.offsetTop}px)`;
    if (instant) { slabEl.offsetWidth; slabEl.style.transition = ''; }
    slabEl.classList.add('is-ready');
    filtersEl.classList.add('has-slab');
  };

  const active = () => pills.find((p) => p.getAttribute('aria-pressed') === 'true');
  requestAnimationFrame(() => moveSlab(active(), true));
  window.addEventListener('resize', () => moveSlab(active(), true));
  document.fonts?.ready.then(() => moveSlab(active(), true));

  filtersEl.addEventListener('click', (e) => {
    const pill = e.target.closest('.fpill');
    if (!pill || pill.getAttribute('aria-pressed') === 'true') return;
    pills.forEach((p) => p.setAttribute('aria-pressed', String(p === pill)));
    moveSlab(pill, reducedMotion());
    onChange(pill.dataset.group);
  });
}

/* FLIP: First (mede) → saída dos que somem → Last (mede) → Invert → Play */
let running = null;
let queued = null;

async function applyFilter(group, rows, listEl) {
  if (running) { queued = group; return; }
  running = group;

  const match = (r) => group === ALL || r.dataset.group === group;
  const before = rows.filter((r) => !r.hidden);
  const leaving = before.filter((r) => !match(r));
  const motion = !reducedMotion();

  if (motion && leaving.length) {
    await Promise.all(leaving.map((r) => r.animate(
      [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-16px)' }],
      { duration: 200, easing: EASE, fill: 'forwards' },
    ).finished));
  }

  const first = new Map(before.map((r) => [r, r.getBoundingClientRect().top]));
  rows.forEach((r) => {
    r.getAnimations().forEach((a) => a.cancel());
    const show = match(r);
    r.hidden = !show;
    if (!show) close(r);
  });
  renumber(rows);
  listEl.classList.remove('is-hovering');

  if (motion) {
    let k = 0;
    rows.filter((r) => !r.hidden).forEach((r) => {
      const top = r.getBoundingClientRect().top;
      if (first.has(r)) {
        const dy = first.get(r) - top;
        if (Math.abs(dy) > 0.5) {
          r.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 650, easing: SPRINGY });
        }
      } else if (top < window.innerHeight + 200) {
        r.animate(
          [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }],
          { duration: 520, delay: Math.min(k++, 12) * 32, easing: EASE, fill: 'backwards' },
        );
      }
    });
  }

  running = null;
  if (queued && queued !== group) { const g = queued; queued = null; applyFilter(g, rows, listEl); }
  else queued = null;
}

/* ---------- Hover + acordeão ---------- */
function bindRows(rows, listEl) {
  rows.forEach((row) => {
    const head = row.querySelector('.prow__head');

    row.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      row.classList.add('is-hot');
      listEl.classList.add('is-hovering');
    });
    row.addEventListener('pointerleave', () => {
      row.classList.remove('is-hot');
      listEl.classList.remove('is-hovering');
    });
    head.addEventListener('focus', () => row.classList.add('is-hot'));
    head.addEventListener('blur', () => row.classList.remove('is-hot'));

    head.addEventListener('click', () => {
      const opening = !row.classList.contains('is-open');
      rows.forEach((r) => r !== row && close(r));
      opening ? open(row) : close(row);
    });
  });
}

function open(row) {
  row.classList.add('is-open');
  const head = row.querySelector('.prow__head');
  head.setAttribute('aria-expanded', 'true');
  head.dataset.cursor = 'Fechar';
  row.querySelector('.prow__body').inert = false;
}
function close(row) {
  if (!row.classList.contains('is-open')) return;
  row.classList.remove('is-open');
  const head = row.querySelector('.prow__head');
  head.setAttribute('aria-expanded', 'false');
  head.dataset.cursor = 'Expandir';
  row.querySelector('.prow__body').inert = true;
}

// Bento "Sobre", hora local e redes sociais.
(function () {
  const TONES = ['#FFFFFF', '#D4D4D8', '#A1A1AA', '#71717A', '#52525B', '#3F3F46', '#2E2E33'];
  const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
  const { esc } = PF;

  const relative = (date) => {
    const s = (date - Date.now()) / 1000;
    const steps = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
    for (const [unit, sec] of steps) if (Math.abs(s) >= sec) return rtf.format(Math.round(s / sec), unit);
    return 'agora mesmo';
  };

  PF.renderAbout = function (repos) {
    const counts = new Map();
    repos.forEach((r) => counts.set(r.lang, (counts.get(r.lang) || 0) + 1));
    const langs = [...counts.entries()].sort((a, b) => (a[0] === 'Outros') - (b[0] === 'Outros') || b[1] - a[1]);
    const tone = (i, g) => (g === 'Outros' ? TONES[TONES.length - 1] : TONES[Math.min(i, TONES.length - 2)]);

    const bar = document.querySelector('[data-langbar]');
    bar.innerHTML = langs.map(([g, n], i) => `<span style="--w:${n};--i:${i};--tone:${tone(i, g)}" title="${esc(g)}: ${n}"></span>`).join('');
    bar.setAttribute('aria-label', langs.map(([g, n]) => `${g}: ${n} repositórios`).join(', '));
    document.querySelector('[data-pills]').innerHTML = langs.map(([g, n], i) => `
      <li class="glow" style="--tone:${tone(i, g)}"><span class="swatch" aria-hidden="true"></span><span>${esc(g)}</span><span class="glow__n">${n}</span></li>`).join('');

    const latest = repos[0];
    if (latest) {
      document.querySelector('[data-latest-name]').textContent = latest.name;
      document.querySelector('[data-latest-when]').textContent = `${relative(latest.pushed)}, em ${latest.language || 'repositório sem linguagem'}`;
    }

    const byGroup = (id) => repos.filter((r) => r.group === id).length;
    document.querySelectorAll('[data-repo-count]').forEach((el) => { el.textContent = `${repos.length} públicos`; });
    const split = document.querySelector('[data-split-count]');
    if (split) split.textContent = `${byGroup('projetos')} projetos, ${byGroup('atividades') + byGroup('provas')} atividades`;
  };

  PF.initClock = function () {
    const el = document.querySelector('[data-clock]');
    const fmt = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
    const tick = () => { el.textContent = `${fmt.format(new Date())} no horário de Brasília`; };
    tick();
    setInterval(tick, 30000);
  };

  PF.renderSocial = function (listEl, links) {
    listEl.innerHTML = links.map((l, i) => `
      <li data-reveal style="--d:${i}">
        <a class="slink" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer" data-cursor="Abrir ↗">
          <span class="slink__label">${esc(l.label)}</span>
          <span class="slink__handle">${esc(l.handle)}</span>
          <span class="slink__arrow" aria-hidden="true">↗</span>
        </a>
      </li>`).join('');
  };
})();

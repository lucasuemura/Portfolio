// Bento "Sobre": linguagens derivadas dos repos, último commit e hora local.
const TONES = ['#FFFFFF', '#D4D4D8', '#A1A1AA', '#71717A', '#52525B', '#3F3F46', '#2E2E33'];
const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

function relative(date) {
  const s = (date - Date.now()) / 1000;
  const steps = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [unit, sec] of steps) if (Math.abs(s) >= sec) return rtf.format(Math.round(s / sec), unit);
  return 'agora mesmo';
}

export function initAbout(repos) {
  // Linguagens
  const counts = new Map();
  repos.forEach((r) => counts.set(r.group, (counts.get(r.group) || 0) + 1));
  const groups = [...counts.entries()].sort((a, b) => (a[0] === 'Outros') - (b[0] === 'Outros') || b[1] - a[1]);
  const tone = (i, g) => (g === 'Outros' ? TONES[TONES.length - 1] : TONES[Math.min(i, TONES.length - 2)]);

  const bar = document.querySelector('[data-langbar]');
  bar.innerHTML = groups.map(([g, n], i) => `<span style="--w:${n};--i:${i};--tone:${tone(i, g)}" title="${g}: ${n}"></span>`).join('');
  bar.setAttribute('aria-label', groups.map(([g, n]) => `${g}: ${n} repositórios`).join(', '));

  document.querySelector('[data-pills]').innerHTML = groups.map(([g, n], i) => `
    <li class="glow" style="--tone:${tone(i, g)}"><span class="swatch" aria-hidden="true"></span><span>${g}</span><span class="glow__n">${n}</span></li>`).join('');

  const stack = document.querySelector('.cell--stack');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { stack.classList.add('in-view'); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(stack);
  } else stack.classList.add('in-view');

  // Último commit
  const latest = repos[0];
  if (latest) {
    document.querySelector('[data-latest-name]').textContent = latest.name;
    document.querySelector('[data-latest-when]').textContent = `${relative(latest.pushed)}, em ${latest.language || "repositório sem linguagem"}`;
  }

  document.querySelectorAll('[data-repo-count]').forEach((el) => { el.textContent = `${repos.length} públicos`; });
}

export function initClock() {
  const el = document.querySelector('[data-clock]');
  const fmt = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
  const tick = () => { el.textContent = `${fmt.format(new Date())} no horário de Brasília`; };
  tick();
  setInterval(tick, 30_000);
}

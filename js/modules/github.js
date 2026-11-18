// Integração com a API pública do GitHub, com cache e fallback local.
const CACHE_KEY = 'gh-repos-v1';
const CACHE_TTL = 60 * 60 * 1000; // 1h
const TIMEOUT = 6000;
const FALLBACK_URL = 'data/repos-fallback.json';

const readCache = () => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { at, repos } = JSON.parse(raw);
    return Date.now() - at < CACHE_TTL ? repos : null;
  } catch { return null; }
};
const writeCache = (repos) => {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), repos })); } catch { /* storage indisponível */ }
};

async function fetchJSON(url, timeout) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Retorna { repos, source: 'api' | 'cache' | 'fallback' } — nunca lança. */
export async function loadRepos(user) {
  const cached = readCache();
  if (cached) return { repos: normalize(cached, user), source: 'cache' };

  try {
    const data = await fetchJSON(`https://api.github.com/users/${user}/repos?sort=updated&per_page=100`, TIMEOUT);
    if (!Array.isArray(data)) throw new Error('Resposta inesperada');
    writeCache(data);
    return { repos: normalize(data, user), source: 'api' };
  } catch {
    try {
      const data = await fetchJSON(FALLBACK_URL, TIMEOUT);
      return { repos: normalize(data, user), source: 'fallback' };
    } catch {
      return { repos: [], source: 'fallback' };
    }
  }
}

const EXCLUDE = (user) => new Set(['portfolio', user.toLowerCase()]);

function normalize(list, user) {
  const skip = EXCLUDE(user);
  return list
    .filter((r) => !skip.has(r.name.toLowerCase()) && !r.fork)
    .map((r) => ({
      id: r.name,
      name: prettyName(r.name),
      raw: r.name,
      description: r.description || '',
      language: r.language || null,
      group: groupOf(r.language),
      topics: r.topics || [],
      homepage: r.homepage ? (r.homepage.startsWith('http') ? r.homepage : `https://${r.homepage}`) : null,
      url: r.html_url,
      stars: r.stargazers_count || 0,
      created: new Date(r.created_at),
      pushed: new Date(r.pushed_at || r.updated_at),
    }))
    .sort((a, b) => b.pushed - a.pushed);
}

/** HTML e CSS viram um só grupo; sem linguagem detectada → "Outros". */
export function groupOf(lang) {
  if (!lang) return 'Outros';
  if (lang === 'HTML' || lang === 'CSS' || lang === 'SCSS') return 'HTML/CSS';
  return lang;
}

const ACRONYMS = new Set(['poo', 'aep', 'api', 'ui', 'ux', 'css', 'html', 'js', 'ts', 'sql', 'p1', 'p2', '3d', 'crud', 'ads']);
const LOWER = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'para', 'com', 'em']);

/** "AEP-ENTREGA-2-Sistema-Web" → "AEP Entrega 2 Sistema Web"; "Aula23Kit" → "Aula 23 Kit". */
export function prettyName(slug) {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .replace(/(\d)([a-zA-Z]{2,})/g, '$1 $2')
    .trim()
    .split(/\s+/)
    .map((w, i) => {
      const lw = w.toLowerCase();
      if (ACRONYMS.has(lw)) return lw.toUpperCase();
      if (i > 0 && LOWER.has(lw)) return lw;
      if (w === w.toUpperCase() && /[A-Z]/.test(w)) return w[0] + w.slice(1).toLowerCase();
      if (/[a-z][A-Z]/.test(w)) return w; // CamelCase intencional (AgroFab, NexusCloud)
      return w[0].toUpperCase() + w.slice(1);
    })
    .join(' ');
}

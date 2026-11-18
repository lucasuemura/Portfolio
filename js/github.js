// Dados dos repositórios: cópia local imediata + atualização pela API do GitHub.
(function () {
  const CACHE_KEY = 'gh-repos-v2';
  const CACHE_TTL = 60 * 60 * 1000;

  const readCache = () => {
    try {
      const { at, repos } = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null') || {};
      return repos && Date.now() - at < CACHE_TTL ? repos : null;
    } catch { return null; }
  };
  const writeCache = (repos) => {
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), repos })); } catch { /* sem storage */ }
  };

  /** Dados disponíveis agora, sem rede: cache da API (se houver) ou a cópia embutida. */
  PF.initialRepos = function (user) {
    const cached = readCache();
    if (cached) return { repos: normalize(cached, user), source: 'cache' };
    return { repos: normalize(PF.snapshot.repos, user), source: 'snapshot' };
  };

  /** Busca a versão mais recente. Resolve null se a API falhar (rate-limit, offline, file://). */
  PF.fetchRepos = async function (user) {
    if (!/^https?:$/.test(location.protocol)) return null;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    try {
      const res = await fetch(`https://api.github.com/users/${user}/repos?sort=updated&per_page=100`, {
        signal: ctrl.signal, headers: { Accept: 'application/vnd.github+json' },
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!Array.isArray(data)) return null;
      writeCache(data);
      return normalize(data, user);
    } catch { return null; }
    finally { clearTimeout(timer); }
  };

  function normalize(list, user) {
    const skip = new Set(['portfolio', user.toLowerCase()]);
    return list
      .filter((r) => !skip.has(r.name.toLowerCase()) && !r.fork)
      .map((r) => ({
        id: r.name,
        raw: r.name,
        name: prettyName(r.name),
        description: r.description || '',
        language: r.language || null,
        lang: langGroup(r.language),
        group: groupOf(r.name),
        topics: r.topics || [],
        homepage: r.homepage ? (/^https?:/.test(r.homepage) ? r.homepage : `https://${r.homepage}`) : null,
        url: r.html_url,
        stars: r.stargazers_count || 0,
        created: new Date(r.created_at),
        pushed: new Date(r.pushed_at || r.updated_at),
      }))
      .sort((a, b) => b.pushed - a.pushed);
  }

  function groupOf(name) {
    const g = PF.groups.find((g) => g.repos && g.repos.includes(name))
      || PF.groups.find((g) => g.match && g.match.test(name))
      || PF.groups.find((g) => g.fallback);
    return g.id;
  }

  /** HTML e CSS viram um só filtro; sem linguagem detectada → "Outros". */
  function langGroup(lang) {
    if (!lang) return 'Outros';
    if (lang === 'HTML' || lang === 'CSS' || lang === 'SCSS') return 'HTML/CSS';
    return lang;
  }

  const ACRONYMS = new Set(['poo', 'aep', 'api', 'ui', 'ux', 'css', 'html', 'js', 'ts', 'sql', 'p1', 'p2', '3d', 'crud', 'ads']);
  const LOWER = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'para', 'com', 'em']);

  /** "AEP-ENTREGA-2-Sistema-Web" → "AEP Entrega 2 Sistema Web"; "Aula23Kit" → "Aula 23 Kit". */
  function prettyName(slug) {
    return slug
      .replace(/[-_]+/g, ' ')
      .replace(/([a-zA-Z])(\d)/g, '$1 $2')
      .replace(/(\d)([a-zA-Z]{2,})/g, '$1 $2')
      .trim().split(/\s+/)
      .map((w, i) => {
        const lw = w.toLowerCase();
        if (ACRONYMS.has(lw)) return lw.toUpperCase();
        if (i > 0 && LOWER.has(lw)) return lw;
        if (w === w.toUpperCase() && /[A-Z]/.test(w)) return w[0] + w.slice(1).toLowerCase();
        if (/[a-z][A-Z]/.test(w)) return w;
        return w[0].toUpperCase() + w.slice(1);
      })
      .join(' ');
  }
})();

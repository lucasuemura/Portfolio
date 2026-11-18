// Orquestra o site. Ordem de carregamento no index.html:
// data/repos.js → data/profile.js → js/lib.js → js/github.js → js/projects.js → js/interactions.js → js/scroll.js → js/about.js → js/main.js
(function () {
  const motion = !PF.env.reducedMotion();
  const desktop = PF.env.finePointer();
  const $ = (s) => document.querySelector(s);

  PF.splitChars();
  if (desktop) PF.initCursor($('[data-cursor-el]'));
  if (desktop && motion) {
    PF.initMagnetic();
    PF.initSpotlight($('[data-spotlight]'));
  }
  PF.initFillOrigin();
  PF.initGlow();
  PF.initScroll({ smooth: motion });
  PF.initNavSpy();
  PF.initClock();
  PF.renderSocial($('[data-social]'), PF.profile.links);

  // Projetos: renderiza na hora com dados locais e atualiza quando a API responder
  const fmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  const source = $('[data-source]');
  const user = PF.profile.githubUser;

  PF.initProjects({ root: $('[data-groups]'), filtersEl: $('[data-filters]'), slabEl: $('[data-slab]') });

  const first = PF.initialRepos(user);
  PF.renderProjects(first.repos);
  PF.renderAbout(first.repos);
  source.textContent = first.source === 'cache'
    ? 'Dados da API do GitHub (última hora).'
    : `Cópia salva em ${fmt.format(new Date(PF.snapshot.date + 'T12:00:00'))}.`;

  PF.initReveal();

  if (first.source !== 'cache') {
    PF.fetchRepos(user).then((fresh) => {
      if (!fresh) return;
      const sig = (list) => list.map((r) => r.id + r.pushed.getTime() + r.description + r.homepage).join('|');
      source.textContent = 'Atualizado agora pela API do GitHub.';
      if (sig(fresh) === sig(first.repos)) return;
      PF.renderProjects(fresh);
      PF.renderAbout(fresh);
    });
  }
})();

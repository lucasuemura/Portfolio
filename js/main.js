import { profile } from '../data/profile.js';
import { reducedMotion, finePointer } from './lib/env.js';
import { loadRepos } from './modules/github.js';
import { initProjects } from './modules/projects.js';
import { initCursor } from './modules/cursor.js';
import { initMagnetic, initFillOrigin } from './modules/magnetic.js';
import { initSpotlight, initGlow } from './modules/effects.js';
import { initScroll } from './modules/scroll.js';
import { initAbout, initClock } from './modules/about.js';
import { renderSocial, initCopy } from './modules/social.js';

const motion = !reducedMotion();
const desktop = finePointer();

// Interações (não dependem dos dados)
let cursor = null;
if (desktop) cursor = initCursor(document.querySelector('[data-cursor-el]'));
if (desktop && motion) {
  initMagnetic();
  initSpotlight(document.querySelector('[data-spotlight]'));
}
initFillOrigin();
initGlow();
initScroll({ smooth: motion });
initClock();

renderSocial(document.querySelector('[data-social]'), profile.links);
initCopy(cursor);

// Dados do GitHub
const SOURCE_TEXT = {
  api: 'Atualizado agora pela API do GitHub.',
  cache: 'Dados da API do GitHub (cache da última hora).',
  fallback: 'API indisponível no momento: exibindo a cópia local mais recente.',
};

loadRepos(profile.githubUser).then(({ repos, source }) => {
  document.querySelector('[data-source]').textContent = SOURCE_TEXT[source];
  initProjects({
    repos,
    listEl: document.querySelector('[data-plist]'),
    filtersEl: document.querySelector('[data-filters]'),
    slabEl: document.querySelector('[data-slab]'),
  });
  if (repos.length) initAbout(repos);
});

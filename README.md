# Lucas Uemura · Portfólio

Site pessoal em HTML, CSS e JavaScript puros (ES modules, sem etapa de build), pronto para GitHub Pages.

## Estrutura

```
index.html
css/   tokens · base · hero · projects · bento · social · cursor
js/main.js
js/lib/      env.js (reduced-motion, ponteiro) · spring.js (física de mola)
js/modules/  github.js · projects.js · cursor.js · magnetic.js · effects.js · scroll.js · about.js · social.js
data/profile.js            dados pessoais e links
data/repos-fallback.json   cópia local dos repositórios (usada se a API falhar)
```

## Projetos vindos do GitHub

A seção de projetos lê `api.github.com/users/lucasuemura/repos` (cache de 1h no navegador).
Se a API falhar ou atingir o rate-limit, o site usa `data/repos-fallback.json`.
Os repositórios `Portfolio`, `lucasuemura` (perfil) e forks ficam de fora.

Descrição, tópicos e link de demo aparecem automaticamente quando preenchidos no GitHub
(campos *About → Description, Topics e Website* de cada repositório).

Para atualizar o fallback:

```bash
curl -s "https://api.github.com/users/lucasuemura/repos?sort=updated&per_page=100" > data/repos-fallback.json
```

## Rodar localmente

ES modules não carregam via `file://`; use um servidor estático:

```bash
python3 -m http.server 8080
```

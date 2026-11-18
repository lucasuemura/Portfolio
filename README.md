# Lucas Uemura · Portfólio

Site pessoal em HTML, CSS e JavaScript puros (ES modules, sem etapa de build), pronto para GitHub Pages.

## Abrir o site

Basta abrir o `index.html` no navegador (duplo clique). Não precisa de servidor:
os scripts são clássicos e os dados dos repositórios ficam embutidos em `data/repos.js`.

## Estrutura

```
index.html
css/   tokens · base · hero · projects · bento · social · cursor
data/repos.js      cópia dos repositórios (aparece na hora, sem rede)
data/profile.js    links das redes e grupos da seção de projetos
js/lib.js · github.js · projects.js · interactions.js · scroll.js · about.js · main.js
```

## Projetos vindos do GitHub

Com o site online, ele consulta `api.github.com/users/lucasuemura/repos` e atualiza a lista
sozinho (cache de 1h). Se a API falhar, continua mostrando a cópia de `data/repos.js`.
Os repositórios `Portfolio`, `lucasuemura` (perfil) e forks ficam de fora.

**Grupos:** cada repo entra em *Projetos autorais*, *Atividades de aula* ou *Provas e simulados*.
Para mover um repositório, edite `PF.groups` em `data/profile.js` (lista `repos` ou regra `match`).

Descrição, tópicos e link de demo aparecem automaticamente quando preenchidos no GitHub
(*About → Description, Topics e Website* de cada repositório).

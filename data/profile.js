// Dados pessoais e organização dos repositórios. Edite aqui para atualizar o site.
window.PF = window.PF || {};

PF.profile = {
  githubUser: 'lucasuemura',
  links: [
    { label: 'Currículo Digital', handle: 'canva.link', url: 'https://canva.link/jzajc6dibftkzam' },
    { label: 'LinkedIn', handle: '/in/lucasuemura', url: 'https://br.linkedin.com/in/lucasuemura' },
    { label: 'GitHub', handle: '@lucasuemura', url: 'https://github.com/lucasuemura' },
    { label: 'Instagram', handle: '@_lucasuemura', url: 'https://www.instagram.com/_lucasuemura/' },
  ],
};

// Grupos da seção de projetos, na ordem em que aparecem.
// Um repositório entra no primeiro grupo cuja regra bater; o que sobrar vai para o grupo `fallback`.
// Para mover um repo, basta adicionar o nome exato dele em `repos` do grupo desejado.
PF.groups = [
  {
    id: 'projetos',
    title: 'Projetos autorais',
    note: 'Sistemas, sites e interfaces que construí do zero.',
    open: true,
    repos: [
      'AgroFab_3D-Front-End',
      'Sistema-de-Almoxarifado-StarLog',
      'Catalogo-BookStore-Enterprise',
      'AEP-ENTREGA-2-Sistema-Web-Para-Monitoramento-de-Energia-Eletrica',
      'Termo-Clone',
      'Landing-Page-Kpop',
      'Bichinho-Virtual',
    ],
  },
  {
    id: 'atividades',
    title: 'Atividades de aula',
    note: 'Exercícios e entregas das disciplinas da faculdade.',
    fallback: true,
  },
  {
    id: 'provas',
    title: 'Provas e simulados',
    note: 'Avaliações práticas, principalmente de POO em Java.',
    match: /simulado|prova|avaliac/i,
  },
];

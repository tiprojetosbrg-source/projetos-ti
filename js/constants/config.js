// js/constants/config.js
const NOME_ABA_PADRAO = 'tb_Atividades';
const NOME_ABA_DETALHES = 'tb_Detalhes_ID';
const NOME_ABA_CONFIG = 'tb_Configuracoes';
const SCHEMA_VERSION = 2;

const configuracoesPadrao = {
  schemaVersion: SCHEMA_VERSION,
  organizacao: 'Prioridades dos Projetos BRG',
  ciclo: 'Ciclo Q4 2026',
  statusList: ['Não iniciado', 'Em Andamento', 'Em Revisão', 'Bloqueado', 'Concluído', 'Cancelado'],
  prioridades: ['P0 - Crítica', 'P1 - Alta', 'P2 - Média', 'P3 - Baixa'],
  etapas: [
    { nome: 'Planejamento', peso: 0 },
    { nome: 'Não iniciado', peso: 0 },
    { nome: 'Dev', peso: 20 },
    { nome: 'QA', peso: 50 },
    { nome: 'UAT', peso: 75 },
    { nome: 'Ag Produção', peso: 90 },
    { nome: 'Em produção', peso: 100 },
    { nome: 'Nenhuma / Concluído', peso: 100 }
  ],
  listaCadeiaValor: [
    'Operações', 'Comercial', 'Financeiro', 'Tecnologia', 'Suprimentos'
  ],
  cadeiasValor: [
    'Engenharia', 'Design', 'Operações', 'Tecnologia',
    'Supply Chain', 'Qualidade', 'Produto', 'Marketing',
    'Financeiro', 'Release', 'O2C'
  ],
  equipes: [
    'Desenvolvimento', 'Design System', 'Infraestrutura', 'Planejamento',
    'Go-to-Market', 'Processos', 'Integração', 'Automação',
    'Auditoria', 'Protheus'
  ],
  anosRoadmap: [2025, 2026, 2027]
};

const dadosIniciaisMock = [
  {
    id: '101',
    titulo: 'Implementar autenticação JWT & OAuth2 com MFA',
    macroCadeiaValor: 'Tecnologia',
    cadeiaValor: 'Engenharia',
    equipe: 'Desenvolvimento',
    prioridade: 'P0 - Crítica',
    status: 'Em Andamento',
    etapa: 'Dev',
    etapaDataInicio: '2026-09-01',
    etapaInicio: '2026-09-10',
    etapaFim: '2026-09-24',
    etapaObs: 'Fluxo de rotação de refresh tokens em fase final de validação.',
    etapasCiclo: null,
    liderTechProtheus: 'Marcos Silva',
    liderTechWebtrade: 'Juliana Prado',
    desenvolvedor: 'Carlos Rocha',
    responsavel: 'Carlos Rocha',
    prazoInicio: '2026-08-31',
    prazo: '2026-09-30',
    conclusao: '',
    progresso: 20,
    impacto: 'Alto',
    _updatedAt: 1735689600000
  },
  {
    id: '107',
    titulo: 'Release Protheus',
    macroCadeiaValor: 'Operações',
    cadeiaValor: 'Release',
    equipe: 'Protheus',
    prioridade: 'P1 - Alta',
    status: 'Concluído',
    etapa: 'Em produção',
    etapaDataInicio: '2026-08-01',
    etapaInicio: '2026-08-03',
    etapaFim: '2026-09-07',
    etapaObs: 'Deploy concluído com testes de regressão executados com sucesso.',
    etapasCiclo: null,
    liderTechProtheus: 'Douglas Idalgo',
    liderTechWebtrade: 'Geydson Santos',
    desenvolvedor: 'Roberto',
    responsavel: 'Eduardo Antunes',
    prazoInicio: '2026-06-30',
    prazo: '2026-07-31',
    conclusao: '2026-09-30',
    progresso: 100,
    impacto: 'Alto',
    _updatedAt: 1735689600000
  }
];

window.NOME_ABA_PADRAO = NOME_ABA_PADRAO;
window.NOME_ABA_DETALHES = NOME_ABA_DETALHES;
window.NOME_ABA_CONFIG = NOME_ABA_CONFIG;
window.SCHEMA_VERSION = SCHEMA_VERSION;
window.configuracoesPadrao = configuracoesPadrao;
window.dadosIniciaisMock = dadosIniciaisMock;
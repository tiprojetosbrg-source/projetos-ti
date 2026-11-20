// js/utils/dataUtils.js
const DataUtils = {
  _parseExcelSerial(serialStr) {
    const serial = Number(serialStr);
    if (!isNaN(serial) && serial > 30000 && serial < 90000) {
      const utcDays = Math.floor(serial - 25569);
      const d = new Date(utcDays * 86400 * 1000);
      if (!isNaN(d.getTime())) {
        return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      }
    }
    return null;
  },

  /**
   * Corrige strings com acentuação corrompida por leitura ANSI/ASCII legado (ex: "N o iniciado", "Cr tica").
   */
  sanitizarTextoLegado(texto) {
    if (texto === null || texto === undefined) return '';
    return String(texto)
      .replace(/\bN\s+o\b/gi, 'Não')
      .replace(/\bProdu\s+o\b/gi, 'Produção')
      .replace(/\bprodu\s+o\b/gi, 'produção')
      .replace(/\bConclu\s+do\b/gi, 'Concluído')
      .replace(/\bconclu\s+do\b/gi, 'concluído')
      .replace(/\bOpera\s+es\b/gi, 'Operações')
      .replace(/\bCr\s+tica\b/gi, 'Crítica')
      .replace(/\bM\s+dia\b/gi, 'Média')
      .replace(/\bautentica\s+o\b/gi, 'autenticação')
      .replace(/\uFFFD/g, '')
      .trim();
  },

  normalizarId(id) {
    if (id === null || id === undefined) return '';
    return String(id).trim();
  },

  normalizarPrioridade(prioridade, fallbackPadrao = 'P2 - Média') {
    if (!prioridade || String(prioridade).trim() === '') return fallbackPadrao;
    const s = this.sanitizarTextoLegado(prioridade);
    const upper = s.toUpperCase();
    if (upper.startsWith('P0')) return 'P0 - Crítica';
    if (upper.startsWith('P1')) return 'P1 - Alta';
    if (upper.startsWith('P2')) return 'P2 - Média';
    if (upper.startsWith('P3')) return 'P3 - Baixa';
    return s;
  },

  normalizarStatus(status, fallbackPadrao = 'Não iniciado') {
    if (!status || String(status).trim() === '') return fallbackPadrao;
    const s = this.sanitizarTextoLegado(status);
    if (s.toLowerCase() === 'a fazer') return 'Não iniciado';
    const limpo = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (limpo.includes('iniicia') || limpo.includes('inicia') || limpo === 'nao iniciado' || limpo === 'no iniciado') return 'Não iniciado';
    if (limpo.includes('andamento') || limpo.includes('curso')) return 'Em Andamento';
    if (limpo.includes('revis')) return 'Em Revisão';
    if (limpo.includes('bloque')) return 'Bloqueado';
    if (limpo.includes('conclu') || limpo.includes('finaliz')) return 'Concluído';
    if (limpo.includes('cancel')) return 'Cancelado';
    return s;
  },

  normalizarEtapa(etapa, fallbackPadrao = 'Planejamento') {
    if (!etapa || String(etapa).trim() === '') return fallbackPadrao;
    const s = this.sanitizarTextoLegado(etapa);
    const lower = s.toLowerCase();
    if (lower === 'a fazer') return 'Planejamento';
    if (lower === 'nao iniciado' || lower === 'não iniciado' || lower === 'no iniciado') return 'Não iniciado';
    if (lower === 'ag producao' || lower === 'ag produção' || lower === 'ag produ o') return 'Ag Produção';
    if (lower === 'em producao' || lower === 'em produção' || lower === 'em produ o') return 'Em produção';
    if (lower.includes('nenhuma') && lower.includes('conclu')) return 'Nenhuma / Concluído';
    return s;
  },

  /**
   * Fonte única da verdade para cálculo de progresso e etapa ativa de uma atividade.
   */
  calcularProgressoEEtapa(item, etapasConfig = []) {
    const statusNorm = this.normalizarStatus(item.status);
    if (statusNorm === 'Concluído') {
      return { progresso: 100, etapa: this.normalizarEtapa(item.etapa || 'Em produção') };
    }

    if (Array.isArray(item.etapasCiclo) && item.etapasCiclo.length > 0) {
      const total = item.etapasCiclo.length;
      const concluidas = item.etapasCiclo.filter(e =>
        Boolean(e.concluida || (e.dataEntrega && String(e.dataEntrega).trim() !== ''))
      ).length;
      const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0;

      const etapaEmExecucao = item.etapasCiclo.find(e =>
        !e.concluida && !(e.dataEntrega && String(e.dataEntrega).trim() !== '')
      );
      const etapaAtiva = etapaEmExecucao
        ? this.normalizarEtapa(etapaEmExecucao.nome)
        : this.normalizarEtapa(item.etapasCiclo[item.etapasCiclo.length - 1].nome);

      return { progresso, etapa: etapaAtiva };
    }

    const etapaNorm = this.normalizarEtapa(item.etapa || 'Dev');
    const listaEtapas = Array.isArray(etapasConfig) && etapasConfig.length > 0
      ? etapasConfig
      : (window.configuracoesPadrao?.etapas || []);
    const encontrada = listaEtapas.find(e =>
      String(e.nome || '').trim().toLowerCase() === etapaNorm.toLowerCase()
    );
    const progresso = encontrada ? Math.min(100, Math.max(0, Number(encontrada.peso) || 0)) : (Number(item.progresso) || 0);

    return { progresso, etapa: etapaNorm };
  },

  /**
   * Sanitiza e padroniza o schema completo de uma atividade antes de persistir ou renderizar.
   */
  sanitizarAtividade(raw, etapasConfig = []) {
    const base = { ...raw };
    base.id = this.normalizarId(base.id);
    base.titulo = this.sanitizarTextoLegado(base.titulo || 'Atividade sem título');
    base.macroCadeiaValor = this.sanitizarTextoLegado(base.macroCadeiaValor || '');
    base.cadeiaValor = this.sanitizarTextoLegado(base.cadeiaValor || 'Engenharia');
    base.equipe = this.sanitizarTextoLegado(base.equipe || 'Desenvolvimento');
    base.prioridade = this.normalizarPrioridade(base.prioridade);
    base.status = this.normalizarStatus(base.status);
    base.etapaObs = this.sanitizarTextoLegado(base.etapaObs || '').slice(0, 500);
    base.liderTechProtheus = this.sanitizarTextoLegado(base.liderTechProtheus || '');
    base.liderTechWebtrade = this.sanitizarTextoLegado(base.liderTechWebtrade || '');
    base.desenvolvedor = this.sanitizarTextoLegado(base.desenvolvedor || '');
    base.responsavel = this.sanitizarTextoLegado(base.responsavel || 'Não Atribuído');
    base.impacto = this.sanitizarTextoLegado(base.impacto || 'Médio');

    if (Array.isArray(base.etapasCiclo)) {
      base.etapasCiclo = base.etapasCiclo.map(et => ({
        ...et,
        nome: this.normalizarEtapa(et.nome),
        titulo: this.sanitizarTextoLegado(et.titulo || ''),
        prioridade: et.prioridade ? this.normalizarPrioridade(et.prioridade, '') : '',
        responsavel: this.sanitizarTextoLegado(et.responsavel || ''),
        obs: this.sanitizarTextoLegado(et.obs || '').slice(0, 500),
        concluida: Boolean(et.concluida || (et.dataEntrega && String(et.dataEntrega).trim() !== ''))
      }));
    } else {
      base.etapasCiclo = null;
    }

    const { progresso, etapa } = this.calcularProgressoEEtapa(base, etapasConfig);
    base.progresso = progresso;
    base.etapa = etapa;
    base._updatedAt = Number(base._updatedAt) || Date.now();

    return base;
  },

  normalizarMesAno(val, fallback = '') {
    if (!val && val !== 0) return fallback;
    if (val instanceof Date && !isNaN(val.getTime())) {
      return `${val.getFullYear()}-${String(val.getMonth() + 1).padStart(2, '0')}`;
    }
    const s = String(val).trim();
    if (!s) return fallback;

    if (!isNaN(Number(s)) && !s.includes('-') && !s.includes('/')) {
      const d = this._parseExcelSerial(s);
      if (d) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }

    if (/^\d{4}-\d{1,2}/.test(s)) {
      const partes = s.split('-');
      return `${partes[0]}-${String(partes[1]).padStart(2, '0')}`;
    }

    if (/^\d{1,2}\/\d{4}$/.test(s)) {
      const [m, a] = s.split('/');
      return `${a}-${m.padStart(2, '0')}`;
    }

    if (/^\d{1,2}\/\d{2}$/.test(s)) {
      const [m, yy] = s.split('/');
      const anoCompleto = Number(yy) < 70 ? `20${yy}` : `19${yy}`;
      return `${anoCompleto}-${m.padStart(2, '0')}`;
    }

    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
      const [, m, a] = s.split('/');
      return `${a}-${m.padStart(2, '0')}`;
    }

    const parsed = this.parseData(s);
    if (parsed && !isNaN(parsed.getTime())) {
      return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
    }
    return fallback || s;
  },

  parseData(str) {
    if (!str && str !== 0) return null;
    if (typeof str === 'number' || (!isNaN(Number(str)) && !String(str).includes('-') && !String(str).includes('/'))) {
      const d = this._parseExcelSerial(str);
      if (d) return d;
    }
    const s = String(str).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      const partes = s.split('T')[0].split('-').map(Number);
      return new Date(partes[0], partes[1] - 1, partes[2]);
    }
    if (/^\d{4}-\d{2}$/.test(s)) {
      const [ano, mes] = s.split('-').map(Number);
      return new Date(ano, mes, 0, 23, 59, 59);
    }
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
      const partes = s.split('/').map(Number);
      return new Date(partes[2], partes[1] - 1, partes[0]);
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
  },

  obterUltimoDiaMes(ano, mes) {
    const d = new Date(ano, mes, 0);
    return d.getDate();
  },

  normalizarDataFimMes(val, fallback = '') {
    if (!val && val !== 0) return fallback;
    if (val instanceof Date && !isNaN(val.getTime())) {
      const a = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, '0');
      const d = String(val.getDate()).padStart(2, '0');
      return `${a}-${m}-${d}`;
    }
    const s = String(val).trim();
    if (!s) return fallback;

    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      return s.slice(0, 10);
    }

    if (/^\d{4}-\d{1,2}$/.test(s)) {
      const [anoStr, mesStr] = s.split('-');
      const ano = parseInt(anoStr, 10);
      const mes = parseInt(mesStr, 10);
      const ultDia = this.obterUltimoDiaMes(ano, mes);
      return `${ano}-${String(mes).padStart(2, '0')}-${String(ultDia).padStart(2, '0')}`;
    }

    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
      const [dia, mes, ano] = s.split('/');
      return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }

    if (/^\d{1,2}\/\d{4}$/.test(s)) {
      const [mesStr, anoStr] = s.split('/');
      const ano = parseInt(anoStr, 10);
      const mes = parseInt(mesStr, 10);
      const ultDia = this.obterUltimoDiaMes(ano, mes);
      return `${ano}-${String(mes).padStart(2, '0')}-${String(ultDia).padStart(2, '0')}`;
    }

    const parsed = this.parseData(s);
    if (parsed && !isNaN(parsed.getTime())) {
      const a = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${a}-${m}-${d}`;
    }
    return fallback || s;
  },

  obterDataHojeISO() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  },

  obterMesAnoHojeISO() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
  }
};

window.DataUtils = DataUtils;
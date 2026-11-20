// js/controllers/components/reportComponent.js
class ReportComponent {
  constructor(controller) {
    this.ctrl = controller;
    this.atividadesExpandidas = new Set();
    this.itensFiltradosReport = [];
    this.statusReportSelecionados = [];
    this.statusEtapaReportSelecionados = [];
    this.prioridadesReportSelecionadas = [];
    this.itensPorPagina = 10;
    this.paginaAtual = 1;

    this.catalogoMaster = [
      { id: 'id', rotulo: 'ID da Demanda', padrao: true },
      { id: 'titulo', rotulo: 'Título / Atividade', padrao: true },
      { id: 'macroCadeiaValor', rotulo: 'Cadeia de Valor (Pai)', padrao: false },
      { id: 'cadeiaValor', rotulo: 'Projetos / Frentes', padrao: true },
      { id: 'equipe', rotulo: 'Equipe', padrao: true },
      { id: 'responsavel', rotulo: 'Responsável', padrao: true },
      { id: 'liderTechProtheus', rotulo: 'Líder Tech Protheus', padrao: false },
      { id: 'liderTechWebtrade', rotulo: 'Líder Tech Webtrade', padrao: false },
      { id: 'desenvolvedor', rotulo: 'Desenvolvedor', padrao: false },
      { id: 'prioridade', rotulo: 'Prioridade', padrao: true },
      { id: 'status', rotulo: 'Status Geral', padrao: true },
      { id: 'progresso', rotulo: 'Progresso (%)', padrao: true },
      { id: 'prazoInicio', rotulo: 'Prazo Início', padrao: false },
      { id: 'prazo', rotulo: 'Prazo Programado', padrao: true },
      { id: 'conclusao', rotulo: 'Conclusão Efetiva', padrao: false }
    ];
    this.catalogoEtapas = [
      { id: 'ordem', rotulo: 'Ordem (#)', padrao: true },
      { id: 'fase', rotulo: 'Fase / Nome', padrao: true },
      { id: 'titulo', rotulo: 'Título da Etapa', padrao: true },
      { id: 'responsavel', rotulo: 'Responsável', padrao: true },
      { id: 'dataInicio', rotulo: 'Data Início', padrao: false },
      { id: 'dataProgramada', rotulo: 'Data Programada', padrao: true },
      { id: 'dataEntrega', rotulo: 'Data de Entrega', padrao: true },
      { id: 'status', rotulo: 'Situação', padrao: true },
      { id: 'obs', rotulo: 'Observações', padrao: true }
    ];
    this.colunasMasterAtivas = this.carregarColunasSalvas('brg_report_cols_master', this.catalogoMaster);
    this.colunasEtapasAtivas = this.carregarColunasSalvas('brg_report_cols_etapas', this.catalogoEtapas);
  }

  carregarColunasSalvas(chaveStorage, catalogo) {
    try {
      const salvo = localStorage.getItem(chaveStorage);
      if (salvo) {
        const arr = JSON.parse(salvo);
        if (Array.isArray(arr) && arr.length > 0) return arr;
      }
    } catch (e) {}
    return catalogo.filter(c => c.padrao).map(c => c.id);
  }

  salvarColunasNoStorage() {
    try {
      localStorage.setItem('brg_report_cols_master', JSON.stringify(this.colunasMasterAtivas));
      localStorage.setItem('brg_report_cols_etapas', JSON.stringify(this.colunasEtapasAtivas));
    } catch (e) {}
  }

  // ================= CONTROLES DE PAGINAÇÃO =================
  mudarItensPorPagina(novoValor) {
    this.itensPorPagina = novoValor === 'todos' ? 'todos' : (parseInt(novoValor, 10) || 10);
    this.paginaAtual = 1;
    this.renderizar();
  }

  mudarPagina(novaPagina) {
    const total = this.itensFiltradosReport ? this.itensFiltradosReport.length : 0;
    const totalPaginas = this.itensPorPagina === 'todos' ? 1 : Math.max(1, Math.ceil(total / this.itensPorPagina));
    if (novaPagina < 1 || novaPagina > totalPaginas) return;
    this.paginaAtual = novaPagina;
    this.renderizar();
  }

  renderizarControlesPaginacao(inicio, fim, total, totalPaginas) {
    const lblContador = document.getElementById('lblContadorReport');
    if (lblContador) {
      const totalBanco = this.ctrl.bancoDados ? this.ctrl.bancoDados.length : total;
      lblContador.innerText = total === 0
        ? 'Exibindo 0 de 0 atividades'
        : `Exibindo ${inicio} a ${fim} de ${total} atividades (${totalBanco} no total)`;
    }
    const containerBotoes = document.getElementById('containerPaginacaoReportBotoes');
    if (!containerBotoes) return;
    if (this.itensPorPagina === 'todos' || totalPaginas <= 1) {
      containerBotoes.innerHTML = `<span class="text-[11px] text-slate-400 font-medium px-2 py-1">Página única</span>`;
      return;
    }
    let htmlBotoes = `
      <button
        type="button"
        onclick="app.mudarPaginaReport(${this.paginaAtual - 1})"
        ${this.paginaAtual <= 1 ? 'disabled' : ''}
        class="px-2 py-1 rounded-lg border border-slate-200 text-xs font-medium ${this.paginaAtual <= 1 ? 'text-slate-300 cursor-not-allowed bg-slate-50' : 'text-slate-600 hover:bg-slate-100 active:scale-95 transition bg-white shadow-2xs'}"
      >
        <i class="fa-solid fa-chevron-left text-[10px]"></i>
      </button>
    `;
    for (let i = 1; i <= totalPaginas; i++) {
      const ativa = i === this.paginaAtual;
      htmlBotoes += `
        <button
          type="button"
          onclick="app.mudarPaginaReport(${i})"
          class="min-w-[28px] h-7 px-2 text-xs font-mono font-semibold rounded-lg transition active:scale-95 ${ativa ? 'bg-slate-900 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'}"
        >
          ${i}
        </button>
      `;
    }
    htmlBotoes += `
      <button
        type="button"
        onclick="app.mudarPaginaReport(${this.paginaAtual + 1})"
        ${this.paginaAtual >= totalPaginas ? 'disabled' : ''}
        class="px-2 py-1 rounded-lg border border-slate-200 text-xs font-medium ${this.paginaAtual >= totalPaginas ? 'text-slate-300 cursor-not-allowed bg-slate-50' : 'text-slate-600 hover:bg-slate-100 active:scale-95 transition bg-white shadow-2xs'}"
      >
        <i class="fa-solid fa-chevron-right text-[10px]"></i>
      </button>
    `;
    containerBotoes.innerHTML = htmlBotoes;
  }

  // ================= EXPANSÃO DAS LINHAS SANFONADAS =================
  toggleExpandirLinha(id, event) {
    if (event) event.stopPropagation();
    const idStr = String(id);
    if (this.atividadesExpandidas.has(idStr)) {
      this.atividadesExpandidas.delete(idStr);
    } else {
      this.atividadesExpandidas.add(idStr);
    }
    this.renderizar();
  }

  toggleExpandirTodas(expandir) {
    if (expandir) {
      (this.itensFiltradosReport || []).forEach(item => this.atividadesExpandidas.add(String(item.id)));
    } else {
      this.atividadesExpandidas.clear();
    }
    this.renderizar();
  }

  // ================= CONFIGURAÇÃO DE COLUNAS =================
  abrirModalConfigColunas() {
    const modal = document.getElementById('modalColunasReport');
    if (!modal) return;
    const gradeMaster = document.getElementById('gradeCheckboxesColunasMaster');
    const gradeEtapas = document.getElementById('gradeCheckboxesColunasEtapas');
    if (gradeMaster) {
      gradeMaster.innerHTML = this.catalogoMaster.map(col => `
        <label class="flex items-center gap-2 p-2 rounded-lg border border-slate-200/80 hover:bg-slate-50 cursor-pointer select-none transition">
          <input
            type="checkbox"
            data-grupo="master"
            value="${col.id}"
            ${this.colunasMasterAtivas.includes(col.id) ? 'checked' : ''}
            class="rounded text-emerald-600 focus:ring-0 cursor-pointer h-3.5 w-3.5"
          >
          <span class="text-slate-800 font-medium">${this.ctrl.escapeHtml(col.rotulo)}</span>
        </label>
      `).join('');
    }
    if (gradeEtapas) {
      gradeEtapas.innerHTML = this.catalogoEtapas.map(col => `
        <label class="flex items-center gap-2 p-2 rounded-lg border border-slate-200/80 hover:bg-slate-50 cursor-pointer select-none transition">
          <input
            type="checkbox"
            data-grupo="etapas"
            value="${col.id}"
            ${this.colunasEtapasAtivas.includes(col.id) ? 'checked' : ''}
            class="rounded text-emerald-600 focus:ring-0 cursor-pointer h-3.5 w-3.5"
          >
          <span class="text-slate-800 font-medium">${this.ctrl.escapeHtml(col.rotulo)}</span>
        </label>
      `).join('');
    }
    modal.classList.remove('hidden');
  }

  fecharModalConfigColunas() {
    document.getElementById('modalColunasReport')?.classList.add('hidden');
  }

  marcarTodasColunas(grupo, marcar) {
    const checks = document.querySelectorAll(`#modalColunasReport input[data-grupo="${grupo}"]`);
    checks.forEach(chk => { chk.checked = marcar; });
  }

  restaurarColunasPadrao() {
    this.colunasMasterAtivas = this.catalogoMaster.filter(c => c.padrao).map(c => c.id);
    this.colunasEtapasAtivas = this.catalogoEtapas.filter(c => c.padrao).map(c => c.id);
    this.salvarColunasNoStorage();
    this.abrirModalConfigColunas();
    this.ctrl.exibirToast('Padrão de colunas restaurado.', 'info');
  }

  salvarConfigColunas() {
    const checksMaster = document.querySelectorAll('#modalColunasReport input[data-grupo="master"]:checked');
    const checksEtapas = document.querySelectorAll('#modalColunasReport input[data-grupo="etapas"]:checked');
    const selecionadasMaster = Array.from(checksMaster).map(chk => chk.value);
    const selecionadasEtapas = Array.from(checksEtapas).map(chk => chk.value);
    if (selecionadasMaster.length === 0) {
      this.ctrl.exibirToast('Selecione pelo menos uma coluna para a linha da atividade.', 'erro');
      return;
    }
    this.colunasMasterAtivas = selecionadasMaster;
    this.colunasEtapasAtivas = selecionadasEtapas;
    this.salvarColunasNoStorage();
    this.fecharModalConfigColunas();
    this.renderizar();
    this.ctrl.exibirToast('Layout de colunas salvo!', 'sucesso');
  }

  // ================= PRIORIDADES MULTISSELEÇÃO REPORT =================
  obterEstiloDotPrioridade(prio) {
    const p = String(prio || '').toUpperCase();
    if (p.includes('P0') || p.includes('CRÍT') || p.includes('CRIT')) return { texto: 'text-rose-700', dot: 'bg-rose-500' };
    if (p.includes('P1') || p.includes('ALT')) return { texto: 'text-amber-700', dot: 'bg-amber-500' };
    if (p.includes('P2') || p.includes('MÉD') || p.includes('MED')) return { texto: 'text-sky-700', dot: 'bg-sky-500' };
    if (p.includes('P3') || p.includes('BAIX')) return { texto: 'text-slate-600', dot: 'bg-slate-400' };
    return { texto: 'text-indigo-700', dot: 'bg-indigo-500' };
  }

  obterListaPrioridadesConfiguradas() {
    if (this.ctrl.configuracoes && Array.isArray(this.ctrl.configuracoes.prioridades) && this.ctrl.configuracoes.prioridades.length > 0) {
      return this.ctrl.configuracoes.prioridades;
    }
    return window.configuracoesPadrao?.prioridades || ['P0 - Crítica', 'P1 - Alta', 'P2 - Média', 'P3 - Baixa'];
  }

  popularDropdownPrioridades() {
    const container = document.getElementById('listaCheckboxesPrioridadeReport');
    if (!container) return;
    const lista = this.obterListaPrioridadesConfiguradas();
    if (this.prioridadesReportSelecionadas.length > 0 && !this.prioridadesReportSelecionadas.includes('NENHUMA')) {
      this.prioridadesReportSelecionadas = this.prioridadesReportSelecionadas.filter(p => lista.includes(p));
    }
    container.innerHTML = lista.map(prio => {
      const estilo = this.obterEstiloDotPrioridade(prio);
      const isChecado = this.prioridadesReportSelecionadas.length === 0 || this.prioridadesReportSelecionadas.includes(prio);
      return `
        <label class="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition select-none">
          <span class="flex items-center gap-2 text-slate-800 font-medium truncate">
            <input
              type="checkbox"
              value="${this.ctrl.escapeAttrJs(prio)}"
              ${isChecado ? 'checked' : ''}
              onchange="app.aoAlternarPrioridadeReport('${this.ctrl.escapeAttrJs(prio)}', this.checked)"
              class="chk-prioridade-report rounded text-emerald-600 focus:ring-0 cursor-pointer h-3.5 w-3.5 shrink-0"
            >
            <span class="font-semibold ${estilo.texto} text-[11px] truncate">${this.ctrl.escapeHtml(prio)}</span>
          </span>
          <span class="w-2 h-2 rounded-full ${estilo.dot} shrink-0 ml-1"></span>
        </label>
      `;
    }).join('');
    this.atualizarRotuloPrioridade();
  }

  togglePrioridadeDropdown(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('dropdownPrioridadeReport');
    if (!dropdown) return;
    const vaiAbrir = dropdown.classList.contains('hidden');
    if (vaiAbrir) {
      this.popularDropdownPrioridades();
    }
    dropdown.classList.toggle('hidden');
  }

  fecharPrioridadeDropdown() {
    document.getElementById('dropdownPrioridadeReport')?.classList.add('hidden');
  }

  sincronizarCheckboxesPrioridades() {
    const checkboxes = document.querySelectorAll('.chk-prioridade-report');
    checkboxes.forEach(chk => {
      if (this.prioridadesReportSelecionadas.length === 0) {
        chk.checked = true;
      } else if (this.prioridadesReportSelecionadas.includes('NENHUMA')) {
        chk.checked = false;
      } else {
        chk.checked = this.prioridadesReportSelecionadas.includes(chk.value);
      }
    });
    this.atualizarRotuloPrioridade();
  }

  aoAlternarPrioridade(prioNome, checado) {
    const todas = this.obterListaPrioridadesConfiguradas();
    if (this.prioridadesReportSelecionadas.length === 0) {
      if (!checado) {
        this.prioridadesReportSelecionadas = todas.filter(p => p !== prioNome);
      }
    } else {
      if (checado) {
        this.prioridadesReportSelecionadas = this.prioridadesReportSelecionadas.filter(p => p !== 'NENHUMA');
        if (!this.prioridadesReportSelecionadas.includes(prioNome)) {
          this.prioridadesReportSelecionadas.push(prioNome);
        }
        if (this.prioridadesReportSelecionadas.length === todas.length) {
          this.prioridadesReportSelecionadas = [];
        }
      } else {
        this.prioridadesReportSelecionadas = this.prioridadesReportSelecionadas.filter(p => p !== prioNome);
        if (this.prioridadesReportSelecionadas.length === 0) {
          this.prioridadesReportSelecionadas = ['NENHUMA'];
        }
      }
    }
    this.atualizarRotuloPrioridade();
    this.aplicarFiltros();
  }

  selecionarTodasPrioridades(todas) {
    this.prioridadesReportSelecionadas = todas ? [] : ['NENHUMA'];
    this.sincronizarCheckboxesPrioridades();
    this.aplicarFiltros();
  }

  atualizarRotuloPrioridade() {
    const lbl = document.getElementById('lblPrioridadeReportSelecionada');
    const badgeQtd = document.getElementById('lblQtdPrioridadesReport');
    const btn = document.getElementById('btnTogglePrioridadeReportDropdown');
    const todas = this.obterListaPrioridadesConfiguradas();
    const sel = this.prioridadesReportSelecionadas;
    let texto = 'Todas';
    let qtdTexto = `Todas ativas (${todas.length})`;
    if (sel.length === 0 || sel.length === todas.length) {
      texto = 'Todas';
      qtdTexto = `Todas ativas (${todas.length})`;
    } else if (sel.includes('NENHUMA')) {
      texto = 'Nenhuma';
      qtdTexto = '0 ativas';
    } else if (sel.length === 1) {
      texto = sel[0].split(' ')[0] || sel[0];
      qtdTexto = '1 selecionada';
    } else if (sel.length === 2) {
      texto = sel.map(s => s.split(' ')[0] || s).join(', ');
      qtdTexto = '2 selecionadas';
    } else {
      texto = `${sel.length} sel.`;
      qtdTexto = `${sel.length} selecionadas`;
    }
    if (lbl) lbl.innerText = texto;
    if (badgeQtd) badgeQtd.innerText = qtdTexto;
    if (btn) {
      const tooltip = (sel.length === 0 || sel.length === todas.length)
        ? 'Todas as prioridades ativas'
        : (sel.includes('NENHUMA') ? 'Nenhuma prioridade' : sel.join(', '));
      btn.title = `Prioridades: ${tooltip}`;
    }
  }

  // ================= STATUS GERAL MULTISSELEÇÃO =================
  obterEstiloDotStatus(status) {
    const norm = this.ctrl.normalizarStatus(status);
    if (norm === 'Concluído') return { texto: 'text-emerald-700', dot: 'bg-emerald-500' };
    if (norm === 'Em Andamento') return { texto: 'text-blue-700', dot: 'bg-blue-500' };
    if (norm === 'Bloqueado') return { texto: 'text-rose-700', dot: 'bg-rose-500' };
    if (norm === 'Em Revisão') return { texto: 'text-purple-700', dot: 'bg-purple-500' };
    if (norm === 'Não iniciado') return { texto: 'text-slate-600', dot: 'bg-slate-400' };
    return { texto: 'text-indigo-700', dot: 'bg-indigo-500' };
  }

  obterListaStatusConfigurados() {
    if (this.ctrl.configuracoes && Array.isArray(this.ctrl.configuracoes.statusList) && this.ctrl.configuracoes.statusList.length > 0) {
      return this.ctrl.configuracoes.statusList;
    }
    return ['Não iniciado', 'Em Andamento', 'Em Revisão', 'Bloqueado', 'Concluído'];
  }

  popularDropdownStatus() {
    const container = document.getElementById('listaCheckboxesStatusReport');
    if (!container) return;
    const lista = this.obterListaStatusConfigurados();
    if (this.statusReportSelecionados.length > 0 && !this.statusReportSelecionados.includes('NENHUM')) {
      this.statusReportSelecionados = this.statusReportSelecionados.filter(s => lista.includes(s));
    }
    container.innerHTML = lista.map(st => {
      const estilo = this.obterEstiloDotStatus(st);
      const isChecado = this.statusReportSelecionados.length === 0 || this.statusReportSelecionados.includes(st);
      return `
        <label class="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition select-none">
          <span class="flex items-center gap-2 text-slate-800 font-medium truncate">
            <input
              type="checkbox"
              value="${this.ctrl.escapeAttrJs(st)}"
              ${isChecado ? 'checked' : ''}
              onchange="app.aoAlternarStatusReport('${this.ctrl.escapeAttrJs(st)}', this.checked)"
              class="chk-status-report rounded text-emerald-600 focus:ring-0 cursor-pointer h-3.5 w-3.5 shrink-0"
            >
            <span class="font-semibold ${estilo.texto} text-[11px] truncate">${this.ctrl.escapeHtml(st)}</span>
          </span>
          <span class="w-2 h-2 rounded-full ${estilo.dot} shrink-0 ml-1"></span>
        </label>
      `;
    }).join('');
    this.atualizarRotuloStatus();
  }

  toggleStatusDropdown(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('dropdownStatusReport');
    if (!dropdown) return;
    const vaiAbrir = dropdown.classList.contains('hidden');
    if (vaiAbrir) {
      this.popularDropdownStatus();
    }
    dropdown.classList.toggle('hidden');
  }

  fecharStatusDropdown() {
    document.getElementById('dropdownStatusReport')?.classList.add('hidden');
  }

  sincronizarCheckboxesStatus() {
    const checkboxes = document.querySelectorAll('.chk-status-report');
    checkboxes.forEach(chk => {
      if (this.statusReportSelecionados.length === 0) {
        chk.checked = true;
      } else if (this.statusReportSelecionados.includes('NENHUM')) {
        chk.checked = false;
      } else {
        chk.checked = this.statusReportSelecionados.includes(chk.value);
      }
    });
    this.atualizarRotuloStatus();
  }

  aoAlternarStatus(statusNome, checado) {
    const todos = this.obterListaStatusConfigurados();
    if (this.statusReportSelecionados.length === 0) {
      if (!checado) {
        this.statusReportSelecionados = todos.filter(s => s !== statusNome);
      }
    } else {
      if (checado) {
        this.statusReportSelecionados = this.statusReportSelecionados.filter(s => s !== 'NENHUM');
        if (!this.statusReportSelecionados.includes(statusNome)) {
          this.statusReportSelecionados.push(statusNome);
        }
        if (this.statusReportSelecionados.length === todos.length) {
          this.statusReportSelecionados = [];
        }
      } else {
        this.statusReportSelecionados = this.statusReportSelecionados.filter(s => s !== statusNome);
        if (this.statusReportSelecionados.length === 0) {
          this.statusReportSelecionados = ['NENHUM'];
        }
      }
    }
    this.atualizarRotuloStatus();
    this.aplicarFiltros();
  }

  selecionarTodosStatus(todos) {
    this.statusReportSelecionados = todos ? [] : ['NENHUM'];
    this.sincronizarCheckboxesStatus();
    this.aplicarFiltros();
  }

  atualizarRotuloStatus() {
    const lbl = document.getElementById('lblStatusReportSelecionado');
    const badgeQtd = document.getElementById('lblQtdStatusReport');
    const btn = document.getElementById('btnToggleStatusReportDropdown');
    const todos = this.obterListaStatusConfigurados();
    const sel = this.statusReportSelecionados;
    let texto = 'Todos';
    let qtdTexto = `Todos ativos (${todos.length})`;
    if (sel.length === 0 || sel.length === todos.length) {
      texto = 'Todos';
      qtdTexto = `Todos ativos (${todos.length})`;
    } else if (sel.includes('NENHUM')) {
      texto = 'Nenhum';
      qtdTexto = '0 ativos';
    } else if (sel.length === 1) {
      texto = sel[0];
      qtdTexto = '1 selecionado';
    } else {
      texto = `${sel.length} sel.`;
      qtdTexto = `${sel.length} selecionados`;
    }
    if (lbl) lbl.innerText = texto;
    if (badgeQtd) badgeQtd.innerText = qtdTexto;
    if (btn) {
      const tooltip = (sel.length === 0 || sel.length === todos.length)
        ? 'Todos os status ativos'
        : (sel.includes('NENHUM') ? 'Nenhum status' : sel.join(', '));
      btn.title = `Status: ${tooltip}`;
    }
  }

  // ================= STATUS DA ETAPA MULTISSELEÇÃO =================
  obterListaOpcoesStatusEtapa() {
    const etapasCfg = this.ctrl.configuracoes?.etapas || [];
    const nomes = etapasCfg.map(e => (typeof e === 'string' ? e : e.nome)).filter(Boolean);
    return [...new Set(nomes)];
  }

  popularDropdownStatusEtapa() {
    const container = document.getElementById('listaCheckboxesStatusEtapaReport');
    if (!container) return;
    const opcoes = this.obterListaOpcoesStatusEtapa();
    if (this.statusEtapaReportSelecionados.length > 0 && !this.statusEtapaReportSelecionados.includes('NENHUM')) {
      this.statusEtapaReportSelecionados = this.statusEtapaReportSelecionados.filter(s => opcoes.includes(s));
    }
    container.innerHTML = opcoes.map(faseNome => {
      const estiloBadge = this.ctrl.obterEstiloEtapa(faseNome);
      const isChecado = this.statusEtapaReportSelecionados.length === 0 || this.statusEtapaReportSelecionados.includes(faseNome);
      return `
        <label class="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition select-none">
          <span class="flex items-center gap-2 text-slate-800 font-medium truncate">
            <input
              type="checkbox"
              value="${this.ctrl.escapeAttrJs(faseNome)}"
              ${isChecado ? 'checked' : ''}
              onchange="app.aoAlternarStatusEtapaReport('${this.ctrl.escapeAttrJs(faseNome)}', this.checked)"
              class="chk-status-etapa-report rounded text-emerald-600 focus:ring-0 cursor-pointer h-3.5 w-3.5 shrink-0"
            >
            <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold border ${estiloBadge} truncate">${this.ctrl.escapeHtml(faseNome)}</span>
          </span>
        </label>
      `;
    }).join('');
    this.atualizarRotuloStatusEtapa();
  }

  toggleStatusEtapaDropdown(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('dropdownStatusEtapaReport');
    if (!dropdown) return;
    const vaiAbrir = dropdown.classList.contains('hidden');
    if (vaiAbrir) {
      this.popularDropdownStatusEtapa();
    }
    dropdown.classList.toggle('hidden');
  }

  fecharStatusEtapaReportDropdown() {
    document.getElementById('dropdownStatusEtapaReport')?.classList.add('hidden');
  }

  sincronizarCheckboxesStatusEtapa() {
    const checkboxes = document.querySelectorAll('.chk-status-etapa-report');
    checkboxes.forEach(chk => {
      if (this.statusEtapaReportSelecionados.length === 0) {
        chk.checked = true;
      } else if (this.statusEtapaReportSelecionados.includes('NENHUM')) {
        chk.checked = false;
      } else {
        chk.checked = this.statusEtapaReportSelecionados.includes(chk.value);
      }
    });
    this.atualizarRotuloStatusEtapa();
  }

  aoAlternarStatusEtapa(opcao, checado) {
    const todas = this.obterListaOpcoesStatusEtapa();
    if (this.statusEtapaReportSelecionados.length === 0) {
      if (!checado) {
        this.statusEtapaReportSelecionados = todas.filter(s => s !== opcao);
      }
    } else {
      if (checado) {
        this.statusEtapaReportSelecionados = this.statusEtapaReportSelecionados.filter(s => s !== 'NENHUM');
        if (!this.statusEtapaReportSelecionados.includes(opcao)) {
          this.statusEtapaReportSelecionados.push(opcao);
        }
        if (this.statusEtapaReportSelecionados.length === todas.length) {
          this.statusEtapaReportSelecionados = [];
        }
      } else {
        this.statusEtapaReportSelecionados = this.statusEtapaReportSelecionados.filter(s => s !== opcao);
        if (this.statusEtapaReportSelecionados.length === 0) {
          this.statusEtapaReportSelecionados = ['NENHUM'];
        }
      }
    }
    this.atualizarRotuloStatusEtapa();
    this.aplicarFiltros();
  }

  selecionarTodosStatusEtapa(todos) {
    this.statusEtapaReportSelecionados = todos ? [] : ['NENHUM'];
    this.sincronizarCheckboxesStatusEtapa();
    this.aplicarFiltros();
  }

  atualizarRotuloStatusEtapa() {
    const lbl = document.getElementById('lblStatusEtapaReportSelecionado');
    const badgeQtd = document.getElementById('lblQtdStatusEtapaReport');
    const btn = document.getElementById('btnToggleStatusEtapaReportDropdown');
    const todas = this.obterListaOpcoesStatusEtapa();
    const sel = this.statusEtapaReportSelecionados;
    let texto = 'Todas';
    let qtdTexto = `Todas ativas (${todas.length})`;
    if (sel.length === 0 || sel.length === todas.length) {
      texto = 'Todas';
      qtdTexto = `Todas ativas (${todas.length})`;
    } else if (sel.includes('NENHUM')) {
      texto = 'Nenhuma';
      qtdTexto = '0 ativas';
    } else if (sel.length === 1) {
      texto = sel[0];
      qtdTexto = '1 selecionada';
    } else {
      texto = `${sel.length} sel.`;
      qtdTexto = `${sel.length} selecionadas`;
    }
    if (lbl) lbl.innerText = texto;
    if (badgeQtd) badgeQtd.innerText = qtdTexto;
    if (btn) {
      btn.title = `Fases: ${sel.length === 0 ? 'Todas as fases ativas' : (sel.includes('NENHUM') ? 'Nenhuma' : sel.join(', '))}`;
    }
  }

  // ================= LIMPEZA DE DATAS =================
  limparFiltroDatas() {
    const inputIni = document.getElementById('filtroDataInicioReport');
    const inputFim = document.getElementById('filtroDataFimReport');
    if (inputIni) inputIni.value = '';
    if (inputFim) inputFim.value = '';
    this.aplicarFiltros(true);
  }

  // ================= FILTRAGEM & RENDERIZAÇÃO =================
  popularFiltrosDropdown() {
    const selMacro = document.getElementById('filtroMacroCadeiaReport');
    const selCadeia = document.getElementById('filtroCadeiaReport');
    if (selMacro) {
      const macros = [...new Set([
        ...(this.ctrl.configuracoes.listaCadeiaValor || []),
        ...this.ctrl.bancoDados.map(x => x.macroCadeiaValor)
      ])].filter(Boolean);
      const valAtual = selMacro.value;
      selMacro.innerHTML = '<option value="">Todas as Cadeias de Valor</option>' +
        macros.map(m => `<option value="${this.ctrl.escapeHtml(m)}" ${m === valAtual ? 'selected' : ''}>${this.ctrl.escapeHtml(m)}</option>`).join('');
    }
    if (selCadeia) {
      const cadeias = [...new Set([
        ...(this.ctrl.configuracoes.cadeiasValor || []),
        ...this.ctrl.bancoDados.map(x => x.cadeiaValor)
      ])].filter(Boolean);
      const valAtual = selCadeia.value;
      selCadeia.innerHTML = '<option value="">Todas as Frentes</option>' +
        cadeias.map(c => `<option value="${this.ctrl.escapeHtml(c)}" ${c === valAtual ? 'selected' : ''}>${this.ctrl.escapeHtml(c)}</option>`).join('');
    }
    this.popularDropdownStatus();
    this.popularDropdownStatusEtapa();
  }

  aplicarFiltros(resetarPagina = true) {
    if (resetarPagina) this.paginaAtual = 1;
    const macroCadeia = (document.getElementById('filtroMacroCadeiaReport')?.value || '').trim().toLowerCase();
    const cadeia = (document.getElementById('filtroCadeiaReport')?.value || '').trim().toLowerCase();
    const prioridade = (document.getElementById('filtroPrioridadeReport')?.value || '').trim();
    const dtInicioFiltroStr = document.getElementById('filtroDataInicioReport')?.value || '';
    const dtFimFiltroStr = document.getElementById('filtroDataFimReport')?.value || '';
    const btnLimparDatas = document.getElementById('btnLimparDatasReport');
    if (btnLimparDatas) {
      btnLimparDatas.classList.toggle('hidden', !dtInicioFiltroStr && !dtFimFiltroStr);
    }
    const dFiltroInicio = dtInicioFiltroStr ? new Date(`${dtInicioFiltroStr}T00:00:00`) : null;
    const dFiltroFim = dtFimFiltroStr ? new Date(`${dtFimFiltroStr}T23:59:59`) : null;

    this.itensFiltradosReport = (this.ctrl.bancoDados || []).filter(item => {
      if (macroCadeia) {
        const itemMacro = String(item.macroCadeiaValor || '').trim().toLowerCase();
        if (itemMacro !== macroCadeia) return false;
      }
      if (cadeia) {
        const itemCadeia = String(item.cadeiaValor || '').trim().toLowerCase();
        if (itemCadeia !== cadeia) return false;
      }
      if (prioridade) {
        const itemPrio = String(item.prioridade || '').trim();
        const codigoPrio = prioridade.split(' ')[0];
        if (!itemPrio.includes(codigoPrio) && itemPrio.toLowerCase() !== prioridade.toLowerCase()) {
          return false;
        }
      }
      if (this.statusReportSelecionados.length > 0) {
        if (this.statusReportSelecionados.includes('NENHUM')) return false;
        const statusItemNorm = this.ctrl.normalizarStatus(item.status);
        const selecionadosNorm = this.statusReportSelecionados.map(s => this.ctrl.normalizarStatus(s));
        if (!selecionadosNorm.includes(statusItemNorm)) {
          return false;
        }
      }
      if (this.statusEtapaReportSelecionados.length > 0) {
        if (this.statusEtapaReportSelecionados.includes('NENHUM')) return false;
        const etapas = (item.etapasCiclo && Array.isArray(item.etapasCiclo) && item.etapasCiclo.length > 0)
          ? item.etapasCiclo
          : [{ nome: item.etapa || 'Dev' }];
        const possuiFase = etapas.some(et => {
          const nomeEtapa = String(et.nome || '').trim().toLowerCase();
          return this.statusEtapaReportSelecionados.some(sel => sel.trim().toLowerCase() === nomeEtapa);
        });
        if (!possuiFase) return false;
      }
      if (dFiltroInicio || dFiltroFim) {
        const extrairData = (valor, fallbackFimMes = false) => {
          if (!valor) return null;
          const s = String(valor).trim();
          if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
            const [ano, mes, dia] = s.slice(0, 10).split('-').map(Number);
            return new Date(ano, mes - 1, dia, fallbackFimMes ? 23 : 0, fallbackFimMes ? 59 : 0, fallbackFimMes ? 59 : 0);
          }
          if (/^\d{4}-\d{1,2}$/.test(s)) {
            const [ano, mes] = s.split('-').map(Number);
            const dia = fallbackFimMes ? new Date(ano, mes, 0).getDate() : 1;
            return new Date(ano, mes - 1, dia, fallbackFimMes ? 23 : 0, fallbackFimMes ? 59 : 0, fallbackFimMes ? 59 : 0);
          }
          const d = this.ctrl.parseData(s);
          return (d && !isNaN(d.getTime())) ? d : null;
        };
        const dIniIniciativa = extrairData(item.prazoInicio, false) || extrairData(item.prazo, false);
        const dFimIniciativa = extrairData(item.prazo, true) || extrairData(item.conclusao, true) || dIniIniciativa;
        if (!dIniIniciativa && !dFimIniciativa) return false;
        const inicioAtividade = dIniIniciativa || dFimIniciativa;
        const fimAtividade = dFimIniciativa || dIniIniciativa;
        if (dFiltroInicio && inicioAtividade < dFiltroInicio) return false;
        if (dFiltroFim && fimAtividade > dFiltroFim) return false;
      }
      return true;
    });
    this.renderizar();
  }

  obterValorCelulaMaster(item, colId) {
    switch (colId) {
      case 'id':
        return `<span class="font-mono font-bold text-slate-900">${this.ctrl.escapeHtml(item.id)}</span>`;
      case 'titulo':
        return `<span class="font-semibold text-slate-900 truncate block" title="${this.ctrl.escapeHtml(item.titulo)}">${this.ctrl.escapeHtml(item.titulo)}</span>`;
      case 'macroCadeiaValor':
        return `<span class="text-slate-600">${this.ctrl.escapeHtml(item.macroCadeiaValor || '--')}</span>`;
      case 'cadeiaValor':
        return `<span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium border border-slate-200 text-[10px]">${this.ctrl.escapeHtml(item.cadeiaValor)}</span>`;
      case 'equipe':
        return `<span class="text-slate-700 font-medium">${this.ctrl.escapeHtml(item.equipe)}</span>`;
      case 'responsavel':
        return `<span class="text-slate-700 font-medium">${this.ctrl.escapeHtml(item.responsavel)}</span>`;
      case 'liderTechProtheus':
        return `<span class="text-slate-600">${this.ctrl.escapeHtml(item.liderTechProtheus || '--')}</span>`;
      case 'liderTechWebtrade':
        return `<span class="text-slate-600">${this.ctrl.escapeHtml(item.liderTechWebtrade || '--')}</span>`;
      case 'desenvolvedor':
        return `<span class="text-slate-600">${this.ctrl.escapeHtml(item.desenvolvedor || '--')}</span>`;
      case 'prioridade':
        return this.ctrl.gerarBadgePrioridade(item.prioridade);
      case 'status':
        return this.ctrl.gerarBadgeStatus(item.status);
      case 'progresso':
        return `
          <div class="flex items-center gap-1.5">
            <div class="w-10 bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div class="bg-emerald-500 h-1.5 rounded-full" style="width: ${item.progresso}%;"></div>
            </div>
            <span class="font-mono text-[10px] text-slate-600 font-bold">${item.progresso}%</span>
          </div>
        `;
      case 'prazoInicio':
        return `<span class="font-mono text-slate-600 text-[11px]">${this.ctrl.formatarMesAno(item.prazoInicio)}</span>`;
      case 'prazo':
        return `<span class="font-mono text-slate-700 text-[11px] font-semibold">${this.ctrl.formatarMesAno(item.prazo)}</span>`;
      case 'conclusao':
        return `<span class="font-mono text-slate-600 text-[11px]">${item.conclusao ? this.ctrl.formatarMesAno(item.conclusao) : '--'}</span>`;
      default:
        return item[colId] ? this.ctrl.escapeHtml(item[colId]) : '--';
    }
  }

  obterValorCelulaEtapa(etapa, idx, colId) {
    const isConcluida = Boolean(etapa.concluida || (etapa.dataEntrega && String(etapa.dataEntrega).trim() !== ''));
    switch (colId) {
      case 'ordem':
        return `<span class="font-mono font-bold text-slate-700">#${idx + 1}</span>`;
      case 'fase':
        return `<span class="px-1.5 py-0.5 rounded text-[10px] font-semibold border ${this.ctrl.obterEstiloEtapa(etapa.nome)}">${this.ctrl.escapeHtml(etapa.nome)}</span>`;
      case 'titulo':
        return `<span class="font-medium text-slate-800">${this.ctrl.escapeHtml(etapa.titulo || '--')}</span>`;
      case 'responsavel':
        return `<span class="text-slate-700 font-medium">${this.ctrl.escapeHtml(etapa.responsavel || '--')}</span>`;
      case 'dataInicio':
        return `<span class="font-mono text-slate-600 text-[11px]">${etapa.dataInicio ? this.ctrl.formatarDataBR(etapa.dataInicio) : '--'}</span>`;
      case 'dataProgramada':
        return `<span class="font-mono text-slate-700 text-[11px] font-medium">${etapa.dataProgramada ? this.ctrl.formatarDataBR(etapa.dataProgramada) : '--'}</span>`;
      case 'dataEntrega':
        return `<span class="font-mono ${isConcluida ? 'text-emerald-700 font-semibold' : 'text-slate-400'} text-[11px]">${etapa.dataEntrega ? this.ctrl.formatarDataBR(etapa.dataEntrega) : '--'}</span>`;
      case 'status':
        return isConcluida
          ? '<span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1"><i class="fa-solid fa-check text-[8px]"></i> Pronta</span>'
          : '<span class="text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">Pendente</span>';
      case 'obs':
        return `<span class="text-slate-600 text-[11px] italic truncate max-w-xs block" title="${this.ctrl.escapeHtml(etapa.obs || '')}">${this.ctrl.escapeHtml(etapa.obs || '--')}</span>`;
      default:
        return etapa[colId] ? this.ctrl.escapeHtml(etapa[colId]) : '--';
    }
  }

  // ================= RENDERIZAÇÃO DA TABELA =================
  renderizar() {
    const thead = document.getElementById('theadReport');
    const tbody = document.getElementById('tbodyReport');
    const empty = document.getElementById('emptyReport');
    const badgeTab = document.getElementById('badgeTabReport');
    if (!thead || !tbody) return;
    if (badgeTab) badgeTab.innerText = this.ctrl.bancoDados ? this.ctrl.bancoDados.length : 0;

    if (!this.itensFiltradosReport || this.itensFiltradosReport.length === 0) {
      const temFiltroAtivo = Boolean(
        document.getElementById('filtroMacroCadeiaReport')?.value ||
        document.getElementById('filtroCadeiaReport')?.value ||
        (this.prioridadesReportSelecionadas && this.prioridadesReportSelecionadas.length > 0) ||
        (this.statusReportSelecionados && this.statusReportSelecionados.length > 0) ||
        document.getElementById('filtroDataInicioReport')?.value ||
        document.getElementById('filtroDataFimReport')?.value
      );
      if (!temFiltroAtivo) {
        this.itensFiltradosReport = [...(this.ctrl.bancoDados || [])];
      }
    }
    const total = this.itensFiltradosReport.length;
    const totalPaginas = this.itensPorPagina === 'todos' ? 1 : Math.max(1, Math.ceil(total / this.itensPorPagina));
    if (this.paginaAtual > totalPaginas) this.paginaAtual = totalPaginas;
    let itensParaExibir = [];
    let inicioIndex = 0;
    let fimIndex = total;
    if (this.itensPorPagina === 'todos' || total === 0) {
      itensParaExibir = this.itensFiltradosReport;
      inicioIndex = total === 0 ? 0 : 1;
      fimIndex = total;
    } else {
      const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
      const fim = Math.min(inicio + this.itensPorPagina, total);
      itensParaExibir = this.itensFiltradosReport.slice(inicio, fim);
      inicioIndex = inicio + 1;
      fimIndex = fim;
    }
    this.renderizarControlesPaginacao(inicioIndex, fimIndex, total, totalPaginas);
    if (total === 0) {
      thead.innerHTML = '';
      tbody.innerHTML = '';
      empty?.classList.remove('hidden');
      return;
    }
    empty?.classList.add('hidden');
    const colsMaster = this.catalogoMaster.filter(c => this.colunasMasterAtivas.includes(c.id));
    thead.innerHTML = `
      <tr>
        <th class="w-10 py-2.5 px-2 text-center whitespace-nowrap"></th>
        ${colsMaster.map(col => `<th class="py-2.5 px-3 text-slate-700 whitespace-nowrap">${this.ctrl.escapeHtml(col.rotulo)}</th>`).join('')}
      </tr>
    `;
    const colsEtapas = this.catalogoEtapas.filter(c => this.colunasEtapasAtivas.includes(c.id));
    const totalColsMasterComChevron = colsMaster.length + 1;
    let htmlLinhas = '';
    itensParaExibir.forEach(item => {
      const isExpandido = this.atividadesExpandidas.has(String(item.id));
      let etapas = (item.etapasCiclo && Array.isArray(item.etapasCiclo) && item.etapasCiclo.length > 0)
        ? item.etapasCiclo
        : [];
      if (this.statusEtapaReportSelecionados.length > 0 && !this.statusEtapaReportSelecionados.includes('NENHUM')) {
        etapas = etapas.filter(et => {
          const nomeEtapa = String(et.nome || '').trim().toLowerCase();
          return this.statusEtapaReportSelecionados.some(sel => sel.trim().toLowerCase() === nomeEtapa);
        });
      }
      const temEtapas = etapas.length > 0;
      htmlLinhas += `
        <tr class="hover:bg-slate-50 transition cursor-pointer select-none ${isExpandido ? 'bg-slate-50/70 border-b border-emerald-200' : 'border-b border-slate-100'}" onclick="app.toggleExpandirReport('${this.ctrl.escapeAttrJs(item.id)}', event)">
          <td class="py-2.5 px-2 text-center text-slate-400 whitespace-nowrap">
            ${temEtapas ? `
              <button type="button" class="w-5 h-5 rounded hover:bg-slate-200 text-slate-500 transition inline-flex items-center justify-center">
                <i class="fa-solid ${isExpandido ? 'fa-chevron-down text-emerald-600' : 'fa-chevron-right text-[10px]'}"></i>
              </button>
            ` : '<span class="text-slate-300 text-[10px]"></span>'}
          </td>
          ${colsMaster.map(col => `<td class="py-2.5 px-3 whitespace-nowrap">${this.obterValorCelulaMaster(item, col.id)}</td>`).join('')}
        </tr>
      `;
      if (isExpandido && temEtapas && colsEtapas.length > 0) {
        htmlLinhas += `
          <tr class="bg-slate-100/60 border-b border-slate-200">
            <td colspan="${totalColsMasterComChevron}" class="p-3 pl-6 sm:pl-10">
              <div class="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
                <div class="px-3.5 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] font-semibold text-slate-700">
                  <span class="flex items-center gap-1.5">
                    <i class="fa-solid fa-code-branch text-emerald-600 text-[10px]"></i>
                    <span>Etapas da Demanda #${this.ctrl.escapeHtml(item.id)} (${etapas.length})</span>
                  </span>
                  <span class="text-[10px] text-slate-400 font-mono">Fases do ciclo</span>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full text-left text-xs border-collapse min-w-max">
                    <thead class="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 select-none">
                      <tr>
                        ${colsEtapas.map(c => `<th class="py-2 px-3 whitespace-nowrap">${this.ctrl.escapeHtml(c.rotulo)}</th>`).join('')}
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      ${etapas.map((etapa, idx) => `
                        <tr class="hover:bg-slate-50/70 transition">
                          ${colsEtapas.map(c => `<td class="py-2 px-3 whitespace-nowrap">${this.obterValorCelulaEtapa(etapa, idx, c.id)}</td>`).join('')}
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </td>
          </tr>
        `;
      }
    });
    tbody.innerHTML = htmlLinhas;
  }

  // ================= EXPORTAÇÃO EXCEL =================
  exportarExcel() {
    if (!this.itensFiltradosReport || this.itensFiltradosReport.length === 0) {
      this.ctrl.exibirToast('Não há dados visíveis para exportar.', 'info');
      return;
    }
    this.ctrl.excelService.verificarSheetJsDisponivel();
    const colsMaster = this.catalogoMaster.filter(c => this.colunasMasterAtivas.includes(c.id));
    const colsEtapas = this.catalogoEtapas.filter(c => this.colunasEtapasAtivas.includes(c.id));
    const linhasPlanilha = [];

    this.itensFiltradosReport.forEach(item => {
      if (colsEtapas.length === 0) {
        const linhaObj = {};
        colsMaster.forEach(col => {
          let val = item[col.id];
          if (col.id === 'prioridade') val = String(val || '').split(' ')[0];
          if (col.id === 'status') val = this.ctrl.normalizarStatus(val);
          linhaObj[col.rotulo] = val !== undefined && val !== null ? val : '';
        });
        linhasPlanilha.push(linhaObj);
        return;
      }
      let etapas = (item.etapasCiclo && Array.isArray(item.etapasCiclo) && item.etapasCiclo.length > 0)
        ? item.etapasCiclo
        : [{ nome: item.etapa || 'Dev', titulo: '', dataProgramada: item.etapaInicio, dataEntrega: item.etapaFim, obs: item.etapaObs }];
      if (this.statusEtapaReportSelecionados.length > 0 && !this.statusEtapaReportSelecionados.includes('NENHUM')) {
        etapas = etapas.filter(et => {
          const nomeEtapa = String(et.nome || '').trim().toLowerCase();
          return this.statusEtapaReportSelecionados.some(sel => sel.trim().toLowerCase() === nomeEtapa);
        });
      }
      etapas.forEach((etapa, idx) => {
        const linhaObj = {};
        colsMaster.forEach(col => {
          let val = item[col.id];
          if (col.id === 'prioridade') val = String(val || '').split(' ')[0];
          if (col.id === 'status') val = this.ctrl.normalizarStatus(val);
          linhaObj[col.rotulo] = val !== undefined && val !== null ? val : '';
        });
        colsEtapas.forEach(col => {
          let valEtapa = '';
          if (col.id === 'ordem') valEtapa = idx + 1;
          else if (col.id === 'fase') valEtapa = etapa.nome || '';
          else if (col.id === 'titulo') valEtapa = etapa.titulo || '';
          else if (col.id === 'responsavel') valEtapa = etapa.responsavel || '';
          else if (col.id === 'dataInicio') valEtapa = etapa.dataInicio || '';
          else if (col.id === 'dataProgramada') valEtapa = etapa.dataProgramada || '';
          else if (col.id === 'dataEntrega') valEtapa = etapa.dataEntrega || '';
          else if (col.id === 'status') valEtapa = (etapa.concluida || etapa.dataEntrega) ? 'Concluída' : 'Pendente';
          else if (col.id === 'obs') valEtapa = etapa.obs || '';

          linhaObj[`[Etapa] ${col.rotulo}`] = valEtapa;
        });
        linhasPlanilha.push(linhaObj);
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(linhasPlanilha);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatorio_Personalizado');
    const dataHoje = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Report_Demandas_BRG_${dataHoje}.xlsx`);
    this.ctrl.exibirToast('Relatório Excel exportado com sucesso!', 'sucesso');
  }
}

window.ReportComponent = ReportComponent;
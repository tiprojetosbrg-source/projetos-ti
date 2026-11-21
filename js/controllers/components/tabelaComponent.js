// js/controllers/components/tabelaComponent.js
class TabelaComponent {
  constructor(controller) {
    this.ctrl = controller;
    this.debounceTimer = null;
    this.atividadesExpandidasTabela = new Set();
    this.statusSelecionados = [];

    // Catálogo de colunas para personalização e exportação Excel
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

  get itensPorPagina() { return this.ctrl.itensPorPagina; }
  set itensPorPagina(v) { this.ctrl.itensPorPagina = v; }
  get paginaAtual() { return this.ctrl.paginaAtual; }
  set paginaAtual(v) { this.ctrl.paginaAtual = v; }
  get itensFiltradosAtuais() { return this.ctrl.itensFiltradosAtuais; }
  set itensFiltradosAtuais(v) { this.ctrl.itensFiltradosAtuais = v; }

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
    this.ctrl.exibirToast('Configuração de colunas para exportação salva!', 'sucesso');
  }

  // ================= STATUS MULTISSELEÇÃO =================
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
    const container = document.getElementById('listaCheckboxesStatusTabela');
    if (!container) return;
    const lista = this.obterListaStatusConfigurados();
    if (this.statusSelecionados.length > 0 && !this.statusSelecionados.includes('NENHUM')) {
      this.statusSelecionados = this.statusSelecionados.filter(s => lista.includes(s));
    }
    container.innerHTML = lista.map(st => {
      const estilo = this.obterEstiloDotStatus(st);
      const isChecado = this.statusSelecionados.length === 0 || this.statusSelecionados.includes(st);
      return `
        <label class="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition select-none">
          <span class="flex items-center gap-2 text-slate-800 font-medium truncate">
            <input
              type="checkbox"
              value="${this.ctrl.escapeAttrJs(st)}"
              ${isChecado ? 'checked' : ''}
              onchange="app.aoAlternarStatusTabela('${this.ctrl.escapeAttrJs(st)}', this.checked)"
              class="chk-status-tabela rounded text-emerald-600 focus:ring-0 cursor-pointer h-3.5 w-3.5 shrink-0"
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
    const dropdown = document.getElementById('dropdownStatusTabela');
    if (!dropdown) return;
    if (dropdown.classList.contains('hidden')) {
      this.popularDropdownStatus();
    }
    dropdown.classList.toggle('hidden');
  }

  fecharStatusDropdown() {
    document.getElementById('dropdownStatusTabela')?.classList.add('hidden');
  }

  sincronizarCheckboxesStatus() {
    const checkboxes = document.querySelectorAll('.chk-status-tabela');
    checkboxes.forEach(chk => {
      if (this.statusSelecionados.length === 0) {
        chk.checked = true;
      } else if (this.statusSelecionados.includes('NENHUM')) {
        chk.checked = false;
      } else {
        chk.checked = this.statusSelecionados.includes(chk.value);
      }
    });
    this.atualizarRotuloStatus();
  }

  aoAlternarStatus(statusNome, checado) {
    const todos = this.obterListaStatusConfigurados();
    if (this.statusSelecionados.length === 0) {
      if (!checado) {
        this.statusSelecionados = todos.filter(s => s !== statusNome);
      }
    } else {
      if (checado) {
        this.statusSelecionados = this.statusSelecionados.filter(s => s !== 'NENHUM');
        if (!this.statusSelecionados.includes(statusNome)) {
          this.statusSelecionados.push(statusNome);
        }
        if (this.statusSelecionados.length === todos.length) {
          this.statusSelecionados = [];
        }
      } else {
        this.statusSelecionados = this.statusSelecionados.filter(s => s !== statusNome);
        if (this.statusSelecionados.length === 0) {
          this.statusSelecionados = ['NENHUM'];
        }
      }
    }
    this.ctrl._setValue('filtroStatus', '');
    this.atualizarRotuloStatus();
    this.aplicarFiltros(true);
  }

  selecionarTodosStatus(todos) {
    this.statusSelecionados = todos ? [] : ['NENHUM'];
    this.ctrl._setValue('filtroStatus', '');
    this.sincronizarCheckboxesStatus();
    this.aplicarFiltros(true);
  }

  atualizarRotuloStatus() {
    const lbl = document.getElementById('lblStatusTabelaSelecionado');
    const badgeQtd = document.getElementById('lblQtdStatusTabela');
    const btn = document.getElementById('btnToggleStatusTabelaDropdown');
    const todos = this.obterListaStatusConfigurados();
    const sel = this.statusSelecionados;
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

  // ================= LIMPEZA DE DATAS =================
  limparFiltroDatas() {
    this.ctrl._setValue('filtroDataInicioTabela', '');
    this.ctrl._setValue('filtroDataFimTabela', '');
    this.aplicarFiltros(true);
  }

  // ================= EXPORTAÇÃO EXCEL FILTRADA =================
  exportarExcel() {
    if (!this.itensFiltradosAtuais || this.itensFiltradosAtuais.length === 0) {
      this.ctrl.exibirToast('Não há atividades filtradas para exportar.', 'info');
      return;
    }
    this.ctrl.excelService.verificarSheetJsDisponivel();
    const colsMaster = this.catalogoMaster.filter(c => this.colunasMasterAtivas.includes(c.id));
    const colsEtapas = this.catalogoEtapas.filter(c => this.colunasEtapasAtivas.includes(c.id));
    const linhasPlanilha = [];

    this.itensFiltradosAtuais.forEach(item => {
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

      const etapas = (item.etapasCiclo && Array.isArray(item.etapasCiclo) && item.etapasCiclo.length > 0)
        ? item.etapasCiclo
        : [{ nome: item.etapa || 'Dev', titulo: '', responsavel: item.responsavel || '', dataInicio: item.etapaDataInicio || '', dataProgramada: item.etapaInicio, dataEntrega: item.etapaFim, obs: item.etapaObs }];

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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Atividades_Filtradas');
    const dataHoje = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Atividades_BRG_${dataHoje}.xlsx`);
    this.ctrl.exibirToast('Relatório Excel exportado respeitando filtros e colunas!', 'sucesso');
  }

  // ================= EXPANSÃO SANFONADA DAS ETAPAS =================
  toggleExpandirLinhaTabela(id, event) {
    if (event) event.stopPropagation();
    const idStr = String(id).trim();
    if (this.atividadesExpandidasTabela.has(idStr)) {
      this.atividadesExpandidasTabela.delete(idStr);
    } else {
      this.atividadesExpandidasTabela.add(idStr);
    }
    this.atualizarTabelaPaginada();
  }

  // ================= REDIMENSIONAMENTO DE COLUNAS =================
  configurarRedimensionamentoTabela() {
    const tbody = document.getElementById('corpoTabela');
    if (!tbody) return;
    const table = tbody.closest('table');
    if (!table) return;
    const ths = table.querySelectorAll('thead th.resizable');
    if (!ths || ths.length === 0) return;
    ths.forEach((th) => {
      let resizer = th.querySelector('.resizer, .col-resizer, .resize-handle, [data-resize]');
      if (!resizer) {
        resizer = document.createElement('div');
        resizer.className = 'resizer';
        th.appendChild(resizer);
      }
      if (resizer.dataset.resizerBound) return;
      resizer.dataset.resizerBound = 'true';
      resizer.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.pageX;
        const startWidth = th.offsetWidth;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        resizer.classList.add('resizing');
        const onMouseMove = (moveEvent) => {
          const diffX = moveEvent.pageX - startX;
          const newWidth = Math.max(45, startWidth + diffX);
          th.style.width = `${newWidth}px`;
          th.style.minWidth = `${newWidth}px`;
        };
        const onMouseUp = () => {
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
          resizer.classList.remove('resizing');
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
          this.salvarLargurasColunasTabela();
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });
    });
    this.restaurarLargurasColunasTabela();
  }

  salvarLargurasColunasTabela() {
    const tbody = document.getElementById('corpoTabela');
    const table = tbody?.closest('table');
    if (!table) return;
    const ths = table.querySelectorAll('thead th');
    const larguras = Array.from(ths).map(th => th.style.width || `${th.offsetWidth}px`);
    try {
      localStorage.setItem('brg_tabela_colunas_larguras_v2', JSON.stringify(larguras));
    } catch (e) {}
  }

  restaurarLargurasColunasTabela() {
    try {
      const salvo = localStorage.getItem('brg_tabela_colunas_larguras_v2');
      if (!salvo) return;
      const larguras = JSON.parse(salvo);
      const tbody = document.getElementById('corpoTabela');
      const table = tbody?.closest('table');
      if (!table) return;
      const ths = table.querySelectorAll('thead th');
      if (larguras.length === ths.length) {
        ths.forEach((th, idx) => {
          if (larguras[idx]) {
            th.style.width = larguras[idx];
            th.style.minWidth = larguras[idx];
          }
        });
      }
    } catch (e) {}
  }

  // ================= FILTROS E BUSCA =================
  aplicarFiltrosComDebounce() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.aplicarFiltros(true), 180);
  }

  limparFiltros(chamarAplicar = true) {
    this.ctrl.filtroApenasForaDoPrazo = false;
    this.ctrl._setValue('filtroBusca', '');
    this.ctrl._setValue('filtroMacroCadeiaValor', '');
    this.ctrl._setValue('filtroCadeiaValor', '');
    this.ctrl._setValue('filtroEquipe', '');
    this.ctrl._setValue('filtroPrioridade', '');
    this.ctrl._setValue('filtroStatus', '');
    this.ctrl._setValue('filtroDataInicioTabela', '');
    this.ctrl._setValue('filtroDataFimTabela', '');
    this.statusSelecionados = [];
    this.sincronizarCheckboxesStatus();
    if (chamarAplicar) this.aplicarFiltros(true);
  }

  aplicarFiltros(resetarPagina = false) {
    if (resetarPagina) this.paginaAtual = 1;
    const termo = (document.getElementById('filtroBusca')?.value || '').toLowerCase().trim();
    const macroCadeia = (document.getElementById('filtroMacroCadeiaValor')?.value || '').trim();
    const cadeia = (document.getElementById('filtroCadeiaValor')?.value || '').trim();
    const equipe = (document.getElementById('filtroEquipe')?.value || '').trim();
    const prioridade = (document.getElementById('filtroPrioridade')?.value || '').trim();
    const dtInicioFiltroStr = (document.getElementById('filtroDataInicioTabela')?.value || '').trim();
    const dtFimFiltroStr = (document.getElementById('filtroDataFimTabela')?.value || '').trim();

    const btnLimparDatas = document.getElementById('btnLimparDatasTabela');
    if (btnLimparDatas) {
      btnLimparDatas.classList.toggle('hidden', !dtInicioFiltroStr && !dtFimFiltroStr);
    }

    const dFiltroInicio = dtInicioFiltroStr ? new Date(`${dtInicioFiltroStr}T00:00:00`) : null;
    const dFiltroFim = dtFimFiltroStr ? new Date(`${dtFimFiltroStr}T23:59:59`) : null;

    // Retrocompatibilidade: se o Painel Executivo definiu um status único no input hidden #filtroStatus
    const statusHidden = (document.getElementById('filtroStatus')?.value || '').trim();
    if (statusHidden) {
      this.statusSelecionados = [statusHidden];
      this.ctrl._setValue('filtroStatus', '');
      this.sincronizarCheckboxesStatus();
    }

    const temFiltroAtivo = Boolean(
      termo ||
      macroCadeia ||
      cadeia ||
      equipe ||
      prioridade ||
      this.statusSelecionados.length > 0 ||
      dtInicioFiltroStr ||
      dtFimFiltroStr ||
      this.ctrl.filtroApenasForaDoPrazo
    );
    const btnLimpar = document.getElementById('btnLimparFiltros');
    if (btnLimpar) {
      btnLimpar.classList.toggle('hidden', !temFiltroAtivo);
      btnLimpar.classList.toggle('inline-flex', temFiltroAtivo);
    }

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
      const d = this.ctrl.parseData ? this.ctrl.parseData(s) : null;
      return (d && !isNaN(d.getTime())) ? d : null;
    };

    const banco = this.ctrl.bancoDados || [];
    this.itensFiltradosAtuais = banco.filter(item => {
      if (this.ctrl.filtroApenasForaDoPrazo && !this.ctrl.verificarAtividadeForaDoPrazo(item)) {
        return false;
      }
      if (termo) {
        const idStr = String(item.id || '').toLowerCase();
        const tituloStr = String(item.titulo || '').toLowerCase();
        const respStr = String(item.responsavel || '').toLowerCase();
        const devStr = String(item.desenvolvedor || '').toLowerCase();
        const frenteStr = String(item.cadeiaValor || '').toLowerCase();
        const equipeStr = String(item.equipe || '').toLowerCase();
        const bateuBusca = idStr.includes(termo) ||
          tituloStr.includes(termo) ||
          respStr.includes(termo) ||
          devStr.includes(termo) ||
          frenteStr.includes(termo) ||
          equipeStr.includes(termo);
        if (!bateuBusca) return false;
      }
      if (macroCadeia && !macroCadeia.toLowerCase().includes('todas')) {
        const itemMacro = String(item.macroCadeiaValor || '').trim().toLowerCase();
        if (itemMacro !== macroCadeia.toLowerCase()) return false;
      }
      if (cadeia && !cadeia.toLowerCase().includes('todos')) {
        const itemCadeia = String(item.cadeiaValor || '').trim().toLowerCase();
        if (itemCadeia !== cadeia.toLowerCase()) return false;
      }
      if (equipe && !equipe.toLowerCase().includes('todas')) {
        const itemEq = String(item.equipe || '').trim().toLowerCase();
        if (itemEq !== equipe.toLowerCase()) return false;
      }
      if (prioridade && !prioridade.toLowerCase().includes('todas')) {
        const itemPrio = String(item.prioridade || '').trim();
        if (prioridade === 'P0_P1') {
          if (!itemPrio.includes('P0') && !itemPrio.includes('P1')) return false;
        } else {
          const codigoPrio = prioridade.split(' ')[0];
          if (!itemPrio.includes(codigoPrio) && itemPrio.toLowerCase() !== prioridade.toLowerCase()) {
            return false;
          }
        }
      }
      if (this.statusSelecionados.length > 0) {
        if (this.statusSelecionados.includes('NENHUM')) return false;
        const stItemNorm = this.ctrl.normalizarStatus(item.status);
        const selecionadosNorm = this.statusSelecionados.map(s => this.ctrl.normalizarStatus(s));
        if (!selecionadosNorm.includes(stItemNorm)) return false;
      }
      if (dFiltroInicio || dFiltroFim) {
        const dIni = extrairData(item.prazoInicio, false) || extrairData(item.prazo, false) || extrairData(item.conclusao, false);
        const dFim = extrairData(item.prazo, true) || extrairData(item.conclusao, true) || dIni;
        if (!dIni && !dFim) return false;

        const inicioAtividade = dIni <= dFim ? dIni : dFim;
        const fimAtividade = dFim >= dIni ? dFim : dIni;

        // Sobreposição de intervalos: atividade em andamento dentro da range selecionada
        if (dFiltroInicio && fimAtividade < dFiltroInicio) return false;
        if (dFiltroFim && inicioAtividade > dFiltroFim) return false;
      }
      return true;
    });

    this.atualizarTabelaPaginada();
    this.ctrl.calcularKpis();
    this.ctrl.atualizarPainelExecutivo();
  }

  // ================= PAGINAÇÃO =================
  mudarItensPorPagina(novoValor) {
    this.itensPorPagina = novoValor === 'todos' ? 'todos' : (parseInt(novoValor, 10) || 10);
    this.paginaAtual = 1;
    this.atualizarTabelaPaginada();
  }

  mudarPagina(novaPagina) {
    const total = this.itensFiltradosAtuais.length;
    const totalPaginas = this.itensPorPagina === 'todos' ? 1 : Math.ceil(total / this.itensPorPagina);
    if (novaPagina < 1 || novaPagina > totalPaginas) return;
    this.paginaAtual = novaPagina;
    this.atualizarTabelaPaginada();
  }

  atualizarTabelaPaginada() {
    const total = this.itensFiltradosAtuais.length;
    const totalPaginas = this.itensPorPagina === 'todos' ? 1 : Math.max(1, Math.ceil(total / this.itensPorPagina));
    if (this.paginaAtual > totalPaginas) this.paginaAtual = totalPaginas;
    let itensParaExibir = [];
    let inicioIndex = 0;
    let fimIndex = total;
    if (this.itensPorPagina === 'todos' || total === 0) {
      itensParaExibir = this.itensFiltradosAtuais;
      inicioIndex = total === 0 ? 0 : 1;
      fimIndex = total;
    } else {
      const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
      const fim = Math.min(inicio + this.itensPorPagina, total);
      itensParaExibir = this.itensFiltradosAtuais.slice(inicio, fim);
      inicioIndex = inicio + 1;
      fimIndex = fim;
    }
    this.renderizarTabela(itensParaExibir);
    this.renderizarControlesPaginacao(inicioIndex, fimIndex, total, totalPaginas);
  }

  renderizarControlesPaginacao(inicio, fim, total, totalPaginas) {
    const lblContador = document.getElementById('contadorExibidos');
    if (lblContador) {
      const totalBanco = this.ctrl.bancoDados ? this.ctrl.bancoDados.length : total;
      lblContador.innerText = total === 0
        ? 'Exibindo 0 de 0 atividades'
        : `Exibindo ${inicio} a ${fim} de ${total} atividades (${totalBanco} no total)`;
    }
    const containerBotoes = document.getElementById('containerPaginacaoBotoes');
    if (!containerBotoes) return;
    if (this.itensPorPagina === 'todos' || totalPaginas <= 1) {
      containerBotoes.innerHTML = `<span class="text-[11px] text-slate-400 font-medium px-2 py-1">Página única</span>`;
      return;
    }
    let htmlBotoes = `
      <button
        type="button"
        onclick="app.mudarPagina(${this.paginaAtual - 1})"
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
          onclick="app.mudarPagina(${i})"
          class="min-w-[28px] h-7 px-2 text-xs font-mono font-semibold rounded-lg transition active:scale-95 ${ativa ? 'bg-slate-900 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'}"
        >
          ${i}
        </button>
      `;
    }
    htmlBotoes += `
      <button
        type="button"
        onclick="app.mudarPagina(${this.paginaAtual + 1})"
        ${this.paginaAtual >= totalPaginas ? 'disabled' : ''}
        class="px-2 py-1 rounded-lg border border-slate-200 text-xs font-medium ${this.paginaAtual >= totalPaginas ? 'text-slate-300 cursor-not-allowed bg-slate-50' : 'text-slate-600 hover:bg-slate-100 active:scale-95 transition bg-white shadow-2xs'}"
      >
        <i class="fa-solid fa-chevron-right text-[10px]"></i>
      </button>
    `;
    containerBotoes.innerHTML = htmlBotoes;
  }

  // ================= RENDERIZAÇÃO DAS LINHAS =================
  renderizarTabela(itens) {
    const tbody = document.getElementById('corpoTabela');
    const emptyState = document.getElementById('tabelaVazia');
    if (!tbody) return;
    if (itens.length === 0) {
      tbody.innerHTML = '';
      emptyState?.classList.remove('hidden');
      return;
    }
    emptyState?.classList.add('hidden');

    let htmlLinhas = '';

    itens.forEach(item => {
      const idStr = String(item.id).trim();
      const isExpandido = this.atividadesExpandidasTabela.has(idStr);

      const etapas = (item.etapasCiclo && Array.isArray(item.etapasCiclo) && item.etapasCiclo.length > 0)
        ? item.etapasCiclo
        : [];
      const temEtapas = etapas.length > 0;

      const prioridadeBadge = this.ctrl.gerarBadgePrioridade(item.prioridade);
      const statusBadge = this.ctrl.gerarBadgeStatus(item.status);
      const inicioFormatado = item.prazoInicio ? this.ctrl.formatarMesAno(item.prazoInicio) : '<span class="text-slate-300 font-normal">--</span>';
      const prazoFormatado = item.prazo ? this.ctrl.formatarMesAno(item.prazo) : '<span class="text-slate-300 font-normal">--</span>';
      const conclusaoFormatada = item.conclusao ? this.ctrl.formatarMesAno(item.conclusao) : '<span class="text-slate-300 font-normal">--</span>';

      htmlLinhas += `
        <tr class="hover:bg-slate-50/90 transition-colors border-b border-slate-100/90 group ${isExpandido ? 'bg-slate-50/70' : ''}">
          <td class="py-2 px-1.5 text-center whitespace-nowrap">
            <div class="flex items-center justify-center gap-1">
              ${temEtapas ? `
                <button
                  type="button"
                  onclick="app.tabelaComponent.toggleExpandirLinhaTabela('${this.ctrl.escapeAttrJs(item.id)}', event)"
                  class="w-5 h-5 rounded hover:bg-slate-200 text-slate-500 transition inline-flex items-center justify-center shrink-0 cursor-pointer"
                  title="${isExpandido ? 'Recolher etapas' : 'Expandir etapas'}"
                >
                  <i class="fa-solid ${isExpandido ? 'fa-chevron-down text-emerald-600' : 'fa-chevron-right text-[10px]'}"></i>
                </button>
              ` : '<span class="w-5 inline-block"></span>'}
              <button
                type="button"
                onclick="app.abrirModalDetalhesId('${this.ctrl.escapeAttrJs(item.id)}')"
                class="font-mono font-bold text-slate-800 hover:text-emerald-700 hover:underline text-xs inline-flex items-center gap-1 group/btn"
              >
                <span>${this.ctrl.escapeHtml(item.id)}</span>
                <i class="fa-solid fa-arrow-up-right-from-square text-[8px] text-slate-300 group-hover/btn:text-emerald-600 transition"></i>
              </button>
            </div>
          </td>
          <td class="py-2 px-2 min-w-0">
            <div class="font-medium text-slate-900 truncate text-xs" title="${this.ctrl.escapeHtml(item.titulo)}">
              ${this.ctrl.escapeHtml(item.titulo)}
            </div>
          </td>
          <td class="py-2 px-1.5 truncate">
            <span class="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-slate-200">
              ${this.ctrl.escapeHtml(item.cadeiaValor)}
            </span>
          </td>
          <td class="py-2 px-1.5 text-slate-600 text-[11px] font-medium truncate">${this.ctrl.escapeHtml(item.equipe)}</td>
          <td class="py-2 px-1 text-center whitespace-nowrap">${prioridadeBadge}</td>
          <td class="py-2 px-2 text-center whitespace-nowrap">${statusBadge}</td>
          <td class="py-2 pl-3 pr-2 text-slate-700 font-medium truncate text-xs">${this.ctrl.escapeHtml(item.responsavel)}</td>
          <td class="py-2 px-1.5 text-center whitespace-nowrap">
            <div class="flex items-center justify-center gap-1.5">
              <div class="w-9 bg-slate-200/80 rounded-full h-1.5 overflow-hidden shrink-0 border border-slate-300/40">
                <div class="bg-emerald-500 h-1.5 rounded-full transition-all duration-300" style="width: ${item.progresso}%;"></div>
              </div>
              <span class="font-mono text-[10px] text-slate-600 font-semibold min-w-[24px]">${item.progresso}%</span>
            </div>
          </td>
          <td class="py-2 px-1 text-center font-mono text-slate-600 text-[11px] font-medium whitespace-nowrap">${inicioFormatado}</td>
          <td class="py-2 px-1 text-center font-mono text-slate-600 text-[11px] font-medium whitespace-nowrap">${prazoFormatado}</td>
          <td class="py-2 px-1 text-center font-mono text-slate-600 text-[11px] font-medium whitespace-nowrap">${conclusaoFormatada}</td>
          <td class="py-2 px-1 text-center whitespace-nowrap">
            <div class="flex items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onclick="app.abrirModalDetalhesId('${this.ctrl.escapeAttrJs(item.id)}')"
                class="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition text-[11px]"
                title="Ver detalhes"
              >
                <i class="fa-regular fa-eye"></i>
              </button>
              <button
                type="button"
                onclick="app.abrirModalEdicao('${this.ctrl.escapeAttrJs(item.id)}')"
                class="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition text-[11px]"
                title="Editar atividade completa"
              >
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button
                type="button"
                onclick="app.confirmarExclusao('${this.ctrl.escapeAttrJs(item.id)}')"
                class="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition text-[11px]"
                title="Excluir"
              >
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;

      if (isExpandido && temEtapas) {
        htmlLinhas += `
          <tr class="bg-slate-100/60 border-b border-slate-200">
            <td colspan="12" class="p-3 pl-8 sm:pl-12">
              <div class="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
                <div class="px-3.5 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] font-semibold text-slate-700">
                  <span class="flex items-center gap-1.5">
                    <i class="fa-solid fa-code-branch text-emerald-600 text-[10px]"></i>
                    <span>Etapas da Atividade #${this.ctrl.escapeHtml(item.id)} (${etapas.length} etapas)</span>
                  </span>
                  <span class="text-[10px] text-slate-400 font-mono">Clique no lápis para editar uma etapa diretamente</span>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full text-left text-xs border-collapse min-w-max">
                    <thead class="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 select-none">
                      <tr>
                        <th class="py-2 px-2.5 text-center w-12">#</th>
                        <th class="py-2 px-3">Fase / Nome</th>
                        <th class="py-2 px-3">Título da Etapa</th>
                        <th class="py-2 px-3">Responsável</th>
                        <th class="py-2 px-2 text-center">Prioridade</th>
                        <th class="py-2 px-2 text-center">Início</th>
                        <th class="py-2 px-2 text-center">Programada</th>
                        <th class="py-2 px-2 text-center">Entrega</th>
                        <th class="py-2 px-2 text-center">Situação</th>
                        <th class="py-2 px-3">Observações</th>
                        <th class="py-2 px-2 text-center w-16">Ações</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      ${etapas.map((etapa, idxEtapa) => {
                        const isConcluida = Boolean(etapa.concluida || (etapa.dataEntrega && String(etapa.dataEntrega).trim() !== ''));
                        const estiloFase = this.ctrl.obterEstiloEtapa(etapa.nome);
                        const prioBadge = etapa.prioridade 
                          ? this.ctrl.gerarBadgePrioridade(etapa.prioridade) 
                          : '<span class="text-slate-400 font-normal text-[10px]">--</span>';
                        const dtIni = etapa.dataInicio ? this.ctrl.formatarDataBR(etapa.dataInicio) : '--';
                        const dtProg = etapa.dataProgramada ? this.ctrl.formatarDataBR(etapa.dataProgramada) : '--';
                        const dtFim = etapa.dataEntrega ? this.ctrl.formatarDataBR(etapa.dataEntrega) : (isConcluida ? 'Concluída' : '--');

                        return `
                          <tr class="hover:bg-slate-50/70 transition">
                            <td class="py-2 px-2.5 text-center font-mono font-bold text-slate-500">${idxEtapa + 1}</td>
                            <td class="py-2 px-3">
                              <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold border ${estiloFase} whitespace-nowrap">
                                ${this.ctrl.escapeHtml(etapa.nome)}
                              </span>
                            </td>
                            <td class="py-2 px-3 font-medium text-slate-800">
                              ${this.ctrl.escapeHtml(etapa.titulo || '--')}
                            </td>
                            <td class="py-2 px-3 text-slate-700 font-medium">
                              ${this.ctrl.escapeHtml(etapa.responsavel || '--')}
                            </td>
                            <td class="py-2 px-2 text-center whitespace-nowrap">
                              ${prioBadge}
                            </td>
                            <td class="py-2 px-2 text-center font-mono text-[11px] text-slate-600">
                              ${dtIni}
                            </td>
                            <td class="py-2 px-2 text-center font-mono text-[11px] text-slate-700 font-medium">
                              ${dtProg}
                            </td>
                            <td class="py-2 px-2 text-center font-mono text-[11px] ${isConcluida ? 'text-emerald-700 font-semibold' : 'text-slate-400'}">
                              ${dtFim}
                            </td>
                            <td class="py-2 px-2 text-center whitespace-nowrap">
                              ${isConcluida 
                                ? '<span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1"><i class="fa-solid fa-check text-[8px]"></i> Concluída</span>' 
                                : '<span class="text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">Pendente</span>'}
                            </td>
                            <td class="py-2 px-3 text-slate-600 text-[11px] italic truncate max-w-xs" title="${this.ctrl.escapeHtml(etapa.obs || '')}">
                              ${this.ctrl.escapeHtml(etapa.obs || '--')}
                            </td>
                            <td class="py-2 px-2 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onclick="app.abrirModalEdicaoEtapaIndividual('${this.ctrl.escapeAttrJs(item.id)}', ${idxEtapa})"
                                class="w-6 h-6 inline-flex items-center justify-center rounded hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                                title="Editar esta etapa individualmente"
                              >
                                <i class="fa-solid fa-pen-to-square text-xs"></i>
                              </button>
                            </td>
                          </tr>
                        `;
                      }).join('')}
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
}

window.TabelaComponent = TabelaComponent;
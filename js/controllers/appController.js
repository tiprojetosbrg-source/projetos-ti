// js/controllers/appController.js
class AppController {
  constructor() {
    this.bancoDados = [];
    this.configuracoes = { ...window.configuracoesPadrao };
    this.excelService = new window.ExcelService();
    this.firebaseService = typeof window.FirebaseService === 'function'
      ? new window.FirebaseService()
      : null;

    // 1. Submódulos Modularizados
    this.atrasosComponent = typeof window.AtrasosComponent === 'function'
      ? new window.AtrasosComponent(this)
      : null;
    this.tabelaComponent = typeof window.TabelaComponent === 'function'
      ? new window.TabelaComponent(this)
      : null;
    this.roadmapComponent = typeof window.RoadmapComponent === 'function'
      ? new window.RoadmapComponent(this)
      : null;
    this.executivoComponent = typeof window.ExecutivoComponent === 'function'
      ? new window.ExecutivoComponent(this)
      : null;
    this.modaisComponent = typeof window.ModaisComponent === 'function'
      ? new window.ModaisComponent(this)
      : null;
    this.reportComponent = typeof window.ReportComponent === 'function'
      ? new window.ReportComponent(this)
      : null;
    this.visaoExecutivaComponent = typeof window.VisaoExecutivaComponent === 'function'
      ? new window.VisaoExecutivaComponent(this)
      : null;

    this.visaoAtiva = 'executivo';
    this.filtroApenasForaDoPrazo = false;

    // Paginação delegada
    this.itensPorPagina = 10;
    this.paginaAtual = 1;
    this.itensFiltradosAtuais = [];

    this.pendenciaSincronizacaoExterna = false;
    this.isSaving = false;
    this.primeiraCargaFirebaseConcluida = false;
  }

  // --- Pontes de Sincronização (Getters & Setters) ---
  get editandoId() { return this.modaisComponent ? this.modaisComponent.editandoId : null; }
  set editandoId(v) { if (this.modaisComponent) this.modaisComponent.editandoId = v; }

  get itemParaExcluir() { return this.modaisComponent ? this.modaisComponent.itemParaExcluir : null; }
  set itemParaExcluir(v) { if (this.modaisComponent) this.modaisComponent.itemParaExcluir = v; }

  get etapasFormAtual() { return this.modaisComponent ? this.modaisComponent.etapasFormAtual : []; }
  set etapasFormAtual(v) { if (this.modaisComponent) this.modaisComponent.etapasFormAtual = v; }

  get statusFiltroPainelAtivo() { return this.executivoComponent ? this.executivoComponent.statusFiltroPainelAtivo : 'Não iniciado'; }
  set statusFiltroPainelAtivo(v) { if (this.executivoComponent) this.executivoComponent.statusFiltroPainelAtivo = v; }

  get ordemRadarCriticos() { return this.executivoComponent ? this.executivoComponent.ordemRadarCriticos : []; }
  set ordemRadarCriticos(v) { if (this.executivoComponent) this.executivoComponent.ordemRadarCriticos = v; }

  get roadmapAnosSelecionados() { return this.roadmapComponent ? this.roadmapComponent.roadmapAnosSelecionados : [2026]; }
  set roadmapAnosSelecionados(v) { if (this.roadmapComponent) this.roadmapComponent.roadmapAnosSelecionados = v; }

  get roadmapMesesGrade() { return this.roadmapComponent ? this.roadmapComponent.roadmapMesesGrade : []; }
  set roadmapMesesGrade(v) { if (this.roadmapComponent) this.roadmapComponent.roadmapMesesGrade = v; }

  get roadmapAgrupamento() { return this.roadmapComponent ? this.roadmapComponent.roadmapAgrupamento : 'cadeiaValor'; }
  set roadmapAgrupamento(v) { if (this.roadmapComponent) this.roadmapComponent.roadmapAgrupamento = v; }

  // --- Helpers de UI e Formatação ---
  _setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
  }

  _setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }

  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  escapeAttrJs(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '&quot;')
      .replace(/\r/g, '')
      .replace(/\n/g, '\\n');
  }

  formatarMesAno(dataStr) {
    if (!dataStr) return '--';
    const s = String(dataStr).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      const [ano, mes, dia] = s.slice(0, 10).split('-');
      return `${dia}/${mes}/${ano}`;
    }
    const partes = s.split('-');
    if (partes.length >= 2) {
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const mesNum = parseInt(partes[1], 10) - 1;
      const ano = partes[0];
      if (mesNum >= 0 && mesNum < 12) return `${meses[mesNum]}/${ano}`;
    }
    return dataStr;
  }

  formatarDataBR(dataStr) {
    if (!dataStr) return '--';
    const d = this.parseData(dataStr);
    if (!d) return dataStr;
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }

  parseData(str) {
    return window.DataUtils ? window.DataUtils.parseData(str) : null;
  }

  normalizarEtapa(etapa, fallbackPadrao = 'Planejamento') {
    return window.DataUtils ? window.DataUtils.normalizarEtapa(etapa, fallbackPadrao) : etapa;
  }

  normalizarStatus(status, fallbackPadrao = 'Não iniciado') {
    return window.DataUtils ? window.DataUtils.normalizarStatus(status, fallbackPadrao) : status;
  }

  gerarBadgePrioridade(p) {
    if (!p) return '--';
    if (p.includes('P0')) return '<span class="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200/90 px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>P0 - Crítica</span>';
    if (p.includes('P1')) return '<span class="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200/90 px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>P1 - Alta</span>';
    if (p.includes('P2')) return '<span class="inline-flex items-center gap-1 bg-sky-50 text-sky-700 border border-sky-200/90 px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-sky-500"></span>P2 - Média</span>';
    return '<span class="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[10px] whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>P3 - Baixa</span>';
  }

  gerarBadgeStatus(s) {
    const norm = this.normalizarStatus(s);
    if (norm === 'Concluído') return '<span class="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap"><i class="fa-solid fa-check text-[9px]"></i>Concluído</span>';
    if (norm === 'Em Andamento') return '<span class="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>Em Andamento</span>';
    if (norm === 'Bloqueado') return '<span class="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap"><i class="fa-solid fa-ban text-[9px]"></i>Bloqueado</span>';
    if (norm === 'Em Revisão') return '<span class="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[10px] whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-purple-500"></span>Em Revisão</span>';
    if (norm === 'Cancelado') {
      return '<span class="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-300 px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap"><i class="fa-solid fa-xmark text-[9px] text-slate-500"></i>Cancelado</span>';
    }
    return `<span class="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[10px] whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>${this.escapeHtml(norm)}</span>`;
  }

  obterEstiloEtapa(etapa) {
    const estilos = {
      'Planejamento': 'bg-sky-50 text-sky-700 border-sky-200',
      'Dev': 'bg-blue-50 text-blue-700 border-blue-200',
      'QA': 'bg-amber-50 text-amber-700 border-amber-200',
      'UAT': 'bg-purple-50 text-purple-700 border-purple-200',
      'Ag Produção': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Em produção': 'bg-emerald-100 text-emerald-800 border-emerald-300'
    };
    return estilos[etapa] || 'bg-slate-100 text-slate-700 border-slate-200';
  }

  obterPesoDaEtapa(nomeEtapa) {
    if (!nomeEtapa) return 0;
    const encontrada = this.configuracoes.etapas.find(e => e.nome.toLowerCase() === String(nomeEtapa).trim().toLowerCase());
    return encontrada ? encontrada.peso : 0;
  }

  gerarProximoId() {
    const idsNumericos = this.bancoDados
      .map(item => parseInt(String(item.id).replace(/\D/g, ''), 10))
      .filter(n => !isNaN(n));
    return idsNumericos.length === 0 ? '101' : String(Math.max(...idsNumericos) + 1);
  }

  // Mantém retrocompatibilidade caso algum componente chame salvarNoLocalStorage()
  salvarNoLocalStorage() {
    try {
      localStorage.setItem('brg_configuracoes_cache', JSON.stringify(this.configuracoes));
    } catch (e) {
      // Ignora erro de quota
    }
  }

  // --- Autenticação Firebase ---
  async realizarLoginFirebase(event) {
    if (event) event.preventDefault();
    const email = document.getElementById('loginEmail')?.value.trim();
    const senha = document.getElementById('loginSenha')?.value;
    const erroBox = document.getElementById('loginErroMsg');
    const btn = document.getElementById('btnSubmitLogin');

    if (!email || !senha) return;

    if (erroBox) {
      erroBox.classList.add('hidden');
      erroBox.innerText = '';
    }
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-xs"></i><span>Autenticando...</span>';
    }

    try {
      await this.firebaseService.loginComEmailSenha(email, senha);
      document.getElementById('modalLoginFirebase')?.classList.add('hidden');
      this.exibirToast('Sessão iniciada com sucesso!', 'sucesso');
    } catch (err) {
      console.error('Erro de login Firebase:', err);
      let msg = 'Não foi possível entrar. Verifique e-mail e senha.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        msg = 'E-mail ou senha inválidos.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Muitas tentativas. Aguarde alguns instantes e tente novamente.';
      }
      if (erroBox) {
        erroBox.innerText = msg;
        erroBox.classList.remove('hidden');
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-right-to-bracket text-xs"></i><span>Acessar Painel</span>';
      }
    }
  }

  async realizarLogoutFirebase() {
    if (!this.firebaseService) return;
    try {
      await this.firebaseService.logout();
      this.bancoDados = [];
      this.primeiraCargaFirebaseConcluida = false;
      this.atualizarBadgeConexaoFirebase(null);
      document.getElementById('modalLoginFirebase')?.classList.remove('hidden');
      this.exibirToast('Você saiu da conta.', 'info');
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  }

  atualizarBadgeConexaoFirebase(user, sincronizando = false) {
    const dot = document.getElementById('statusIndicatorDot');
    const text = document.getElementById('statusIndicatorText');
    const badge = document.getElementById('fileStatusBadge');
    const lblFooter = document.getElementById('lblNomeArquivo');
    const btnLogout = document.getElementById('btnLogoutFirebase');

    if (user) {
      const emailCurto = user.email || 'Conectado';
      if (dot) dot.className = sincronizando ? 'w-2 h-2 rounded-full bg-amber-500 animate-ping' : 'w-2 h-2 rounded-full bg-emerald-500';
      if (badge) badge.className = 'flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium';
      if (text) {
        text.innerText = emailCurto;
        text.title = `Conectado ao Firebase: ${emailCurto}`;
      }
      if (lblFooter) lblFooter.innerText = `Firebase Cloud (${emailCurto})`;
      btnLogout?.classList.remove('hidden');
    } else {
      if (dot) dot.className = 'w-2 h-2 rounded-full bg-rose-500';
      if (badge) badge.className = 'flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600';
      if (text) text.innerText = 'Desconectado';
      if (lblFooter) lblFooter.innerText = 'Aguardando autenticação...';
      btnLogout?.classList.add('hidden');
    }
  }

  // --- Normalização e Regras de Negócio ---
  migrarStatusLegado() {
    let alterou = false;
    if (this.configuracoes.statusList) {
      this.configuracoes.statusList = this.configuracoes.statusList.map(s => {
        const normalizado = this.normalizarStatus(s, 'Não iniciado');
        if (normalizado !== s) alterou = true;
        return normalizado;
      });
      this.configuracoes.statusList = [...new Set(this.configuracoes.statusList)];
    }
    if (this.bancoDados && this.bancoDados.length > 0) {
      this.bancoDados.forEach(item => {
        const normalizado = this.normalizarStatus(item.status, 'Não iniciado');
        if (normalizado !== item.status) {
          item.status = normalizado;
          alterou = true;
        }
      });
    }
    this.statusFiltroPainelAtivo = this.normalizarStatus(this.statusFiltroPainelAtivo, 'Não iniciado');
    return alterou;
  }

  normalizarEtapasConfiguracao() {
    this.configuracoes.etapas = (this.configuracoes.etapas || []).map(etapa => {
      let nome = typeof etapa === 'string' ? etapa : etapa.nome;
      nome = window.DataUtils ? window.DataUtils.normalizarEtapa(nome) : String(nome).trim();
      let peso = typeof etapa === 'object' ? parseInt(etapa.peso, 10) : NaN;
      if (isNaN(peso)) {
        let pesoPadrao = 50;
        const eLower = nome.toLowerCase();
        if (eLower.includes('não') || eLower.includes('nao') || eLower.includes('planej')) pesoPadrao = 0;
        else if (eLower.includes('dev')) pesoPadrao = 20;
        else if (eLower.includes('qa')) pesoPadrao = 50;
        else if (eLower.includes('uat')) pesoPadrao = 75;
        else if (eLower.includes('ag')) pesoPadrao = 90;
        else if (eLower.includes('produ') || eLower.includes('conclu')) pesoPadrao = 100;
        peso = pesoPadrao;
      }
      return { nome, peso: Math.min(100, Math.max(0, peso)) };
    }).filter(e => e.nome.toLowerCase() !== 'a fazer');
  }

  recalcularProgressoItem(item) {
    if (window.DataUtils) {
      const { progresso, etapa } = window.DataUtils.calcularProgressoEEtapa(item, this.configuracoes.etapas);
      item.progresso = progresso;
      item.etapa = etapa;
      return;
    }
    const statusNorm = this.normalizarStatus(item.status);
    if (statusNorm === 'Concluído') {
      item.progresso = 100;
      return;
    }
    item.progresso = this.obterPesoDaEtapa(item.etapa || 'Dev');
  }

  recalcularProgressoTodasAtividades(notificar = false) {
    if (!this.bancoDados || this.bancoDados.length === 0) return;
    this.bancoDados.forEach(item => this.recalcularProgressoItem(item));
    this.aplicarFiltros(false);
    this.atualizarPainelExecutivo();
    this.renderizarRoadmap();
    if (notificar) this.exibirToast('Progresso das atividades recalculado!', 'sucesso');
  }

  // --- Persistência Unificada (Firebase Firestore) ---
  async salvarNoExcel(manual = false, idModificado = null, acao = 'upsert') {
    if (this.isSaving) return;
    this.isSaving = true;

    const btn = document.getElementById('btnSalvarManual');
    btn?.classList.add('pulse-save');

    this.migrarStatusLegado();
    this.normalizarEtapasConfiguracao();

    try {
      if (!this.firebaseService || !this.firebaseService.usuarioAtual) {
        this.exibirToast('Faça login para salvar alterações na nuvem.', 'erro');
        return;
      }

      this.atualizarBadgeConexaoFirebase(this.firebaseService.usuarioAtual, true);
      const normalizar = id => (window.DataUtils ? window.DataUtils.normalizarId(id) : String(id || '').trim());

      if (idModificado !== null && idModificado !== undefined) {
        const idBusca = normalizar(idModificado);
        if (acao === 'delete') {
          await this.firebaseService.excluirAtividade(idBusca);
        } else {
          const item = this.bancoDados.find(x => normalizar(x.id) === idBusca);
          if (item) {
            await this.firebaseService.salvarAtividade(item, this.configuracoes.etapas);
          }
        }
      } else {
        // Grava configurações e eventuais alterações em lote
        await this.firebaseService.salvarConfiguracoes(this.configuracoes);
        if (this.bancoDados.length > 0) {
          await this.firebaseService.importarEmLote(this.bancoDados, null);
        }
      }

      this.atualizarHorarioSincronizacao();
      this.atualizarBadgeConexaoFirebase(this.firebaseService.usuarioAtual, false);
      if (manual) this.exibirToast('Dados sincronizados com o Firebase!', 'sucesso');
    } catch (err) {
      console.error('Erro ao salvar no Firebase:', err);
      this.atualizarBadgeConexaoFirebase(this.firebaseService?.usuarioAtual, false);
      this.exibirToast('Erro ao salvar no Firebase. Verifique sua conexão ou permissões.', 'erro');
    } finally {
      this.isSaving = false;
      if (btn) setTimeout(() => btn.classList.remove('pulse-save'), 300);
    }
  }

  // --- Importação e Exportação Excel (.xlsx) ---
  async vincularArquivo() {
    try {
      const resultado = await this.excelService.abrirArquivoDoDisco();
      if (!resultado) return;
      await this._processarImportacaoExcelParaFirebase(resultado.dados, resultado.configs, resultado.nome);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(err);
        this.exibirToast('Não foi possível ler o arquivo Excel selecionado.', 'erro');
      }
    }
  }

  processarArquivoFallback(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        this.excelService.verificarSheetJsDisponivel();
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const dados = this.excelService.extrairRegistros(workbook);
        const configs = this.excelService.extrairConfiguracoes(workbook);
        await this._processarImportacaoExcelParaFirebase(dados, configs, file.name);
      } catch (err) {
        console.error(err);
        this.exibirToast('Erro ao importar planilha Excel.', 'erro');
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async _processarImportacaoExcelParaFirebase(dadosImportados, configsImportadas, nomeArquivo) {
    if (!this.firebaseService || !this.firebaseService.usuarioAtual) {
      this.exibirToast('Autentique-se antes de importar uma planilha.', 'erro');
      return;
    }

    const total = Array.isArray(dadosImportados) ? dadosImportados.length : 0;
    if (total === 0 && !configsImportadas) {
      this.exibirToast('A planilha selecionada não possui registros válidos.', 'info');
      return;
    }

    this.exibirToast(`Importando ${total} registros de "${nomeArquivo}" para o Firebase...`, 'info');
    this.atualizarBadgeConexaoFirebase(this.firebaseService.usuarioAtual, true);

    try {
      await this.firebaseService.importarEmLote(dadosImportados || [], configsImportadas || null);
      this.atualizarHorarioSincronizacao();
      this.exibirToast(`Importação concluída: ${total} atividades enviadas para o banco!`, 'sucesso');
    } catch (err) {
      console.error('Erro na importação em lote:', err);
      this.exibirToast('Falha ao enviar os dados do Excel para o Firebase.', 'erro');
    } finally {
      this.atualizarBadgeConexaoFirebase(this.firebaseService.usuarioAtual, false);
    }
  }

  baixarCopiaXlsx() {
    this.migrarStatusLegado();
    this.excelService.baixarCopiaLocal(this.bancoDados, this.configuracoes, 'Projetos_BRG_Backup.xlsx');
    this.exibirToast('Exportação Excel (.xlsx) concluída!', 'sucesso');
  }

  // --- Listeners em Tempo Real e Atualização da UI ---
  iniciarSincronizacaoTempoReal() {
    if (!this.firebaseService) return;

    this.firebaseService.iniciarListeners({
      onAtividadesChange: async (listaAtividades, hasPendingWrites) => {
        // Se o banco estiver 100% vazio na primeira carga, popula com o mock inicial para facilitar o start
        if (!this.primeiraCargaFirebaseConcluida && listaAtividades.length === 0 && !hasPendingWrites) {
          this.primeiraCargaFirebaseConcluida = true;
          const iniciais = (window.dadosIniciaisMock || []).map(item =>
            window.DataUtils ? window.DataUtils.sanitizarAtividade(item, this.configuracoes.etapas) : item
          );
          if (iniciais.length > 0) {
            await this.firebaseService.importarEmLote(iniciais, this.configuracoes);
            return;
          }
        }

        this.primeiraCargaFirebaseConcluida = true;
        this.bancoDados = listaAtividades.map(item =>
          window.DataUtils ? window.DataUtils.sanitizarAtividade(item, this.configuracoes.etapas) : item
        );

        this.migrarStatusLegado();
        this.bancoDados.forEach(item => this.recalcularProgressoItem(item));

        this.atualizarListasDeFiltro();
        this.aplicarFiltros(false);
        this.atualizarPainelExecutivo();
        this.renderizarRoadmap();
        this.atualizarHorarioSincronizacao();
        this.atualizarBadgeConexaoFirebase(this.firebaseService.usuarioAtual, hasPendingWrites);

        if (this.reportComponent && this.visaoAtiva === 'report') {
          this.reportComponent.popularFiltrosDropdown();
          this.reportComponent.aplicarFiltros(false);
        }
      },
      onConfiguracoesChange: (cfgRemota) => {
        if (!cfgRemota) return;
        this.configuracoes = {
          ...window.configuracoesPadrao,
          ...cfgRemota
        };
        this.migrarStatusLegado();
        this.normalizarEtapasConfiguracao();
        this.bancoDados.forEach(item => this.recalcularProgressoItem(item));
        this.atualizarListasDeFiltro();
        this.atualizarPainelExecutivo();
        this.renderizarRoadmap();
      },
      onErro: () => {
        this.exibirToast('Oscilação na conexão com o Firebase. Operando em cache offline.', 'info');
      }
    });
  }

  atualizarHorarioSincronizacao() {
    this._setText('kpiUltimoSync', new Date().toLocaleTimeString('pt-BR'));
  }

  atualizarListasDeFiltro() {
    this.migrarStatusLegado();

    // 1. Listas oficiais ativas nas Configurações (fonte da verdade para cadastro/edição)
    const macroConfig = Array.isArray(this.configuracoes.listaCadeiaValor)
      ? [...this.configuracoes.listaCadeiaValor].filter(Boolean)
      : ['Operações', 'Comercial', 'Financeiro', 'Tecnologia', 'Suprimentos'];
    const cadeiasConfig = [...(this.configuracoes.cadeiasValor || [])].filter(Boolean);
    const equipesConfig = [...(this.configuracoes.equipes || [])].filter(Boolean);

    // 2. Listas completas para Filtros de Consulta (inclui valores legados ainda presentes em atividades)
    const macroFiltros = [...new Set([...macroConfig, ...this.bancoDados.map(x => x.macroCadeiaValor)])].filter(Boolean);
    const cadeiasFiltros = [...new Set([...cadeiasConfig, ...this.bancoDados.map(x => x.cadeiaValor)])].filter(Boolean);
    const equipesFiltros = [...new Set([...equipesConfig, ...this.bancoDados.map(x => x.equipe)])].filter(Boolean);

    const statusOpcoes = this.configuracoes.statusList || ['Não iniciado', 'Em Andamento', 'Em Revisão', 'Bloqueado', 'Concluído'];
    const prioridadesOpcoes = (this.configuracoes && Array.isArray(this.configuracoes.prioridades) && this.configuracoes.prioridades.length > 0)
      ? this.configuracoes.prioridades
      : (window.configuracoesPadrao?.prioridades || ['P0 - Crítica', 'P1 - Alta', 'P2 - Média', 'P3 - Baixa']);

    const setDropdownOptions = (id, optionsList, defaultText, selectedValue, preservarLegado = false) => {
      const el = document.getElementById(id);
      if (!el) return;

      const listaFinal = [...optionsList];
      // Se estiver editando uma atividade antiga cujo valor foi removido das configurações, mantém visível apenas para ela
      if (preservarLegado && selectedValue && !listaFinal.includes(selectedValue)) {
        listaFinal.push(selectedValue);
      }

      let html = defaultText ? `<option value="">${defaultText}</option>` : '';
      html += listaFinal.map(opt => {
        const isLegado = preservarLegado && !optionsList.includes(opt);
        const label = isLegado ? `${opt} (Descontinuado)` : opt;
        return `<option value="${this.escapeHtml(opt)}">${this.escapeHtml(label)}</option>`;
      }).join('');

      el.innerHTML = html;
      if (selectedValue && listaFinal.includes(selectedValue)) {
        el.value = selectedValue;
      }
    };

    const elFiltroPrio = document.getElementById('filtroPrioridade');
    if (elFiltroPrio) {
      const valAtual = elFiltroPrio.value;
      let html = '<option value="">Todas Prioridades</option><option value="P0_P1">P0 e P1 (Críticas)</option>';
      html += prioridadesOpcoes.map(p => `<option value="${this.escapeHtml(p)}">${this.escapeHtml(p)}</option>`).join('');
      elFiltroPrio.innerHTML = html;
      if (valAtual) elFiltroPrio.value = valAtual;
    }

    if (this.reportComponent) {
      this.reportComponent.popularDropdownPrioridades();
      this.reportComponent.popularDropdownStatus();
    }
    if (this.roadmapComponent) {
      this.roadmapComponent.popularDropdownPrioridadesRoadmap();
    }

    if (this.tabelaComponent) {
      this.tabelaComponent.popularDropdownStatus();
    }

    // Dropdowns de Filtro (mantêm valores legados para consulta e reclassificação)
    setDropdownOptions('filtroMacroCadeiaValor', macroFiltros, 'Todas Cadeias de Valor', document.getElementById('filtroMacroCadeiaValor')?.value);
    setDropdownOptions('filtroCadeiaValor', cadeiasFiltros, 'Todos Projetos / Frentes', document.getElementById('filtroCadeiaValor')?.value);
    setDropdownOptions('filtroEquipe', equipesFiltros, 'Todas as Equipes', document.getElementById('filtroEquipe')?.value);
    setDropdownOptions('filtroStatus', statusOpcoes, 'Todos Status', document.getElementById('filtroStatus')?.value);

    setDropdownOptions('filtroMacroCadeiaRoadmap', macroFiltros, 'Todas Cadeias de Valor', document.getElementById('filtroMacroCadeiaRoadmap')?.value);
    setDropdownOptions('filtroFrenteRoadmap', cadeiasFiltros, 'Todas as Frentes', document.getElementById('filtroFrenteRoadmap')?.value);
    setDropdownOptions('filtroStatusRoadmap', statusOpcoes, 'Todos Status', document.getElementById('filtroStatusRoadmap')?.value);

    // Dropdowns do Formulário (exibem APENAS as opções ativas nas Configurações)
    setDropdownOptions('inputPrioridade', prioridadesOpcoes, '', document.getElementById('inputPrioridade')?.value || prioridadesOpcoes[0], true);
    setDropdownOptions('inputMacroCadeiaValor', macroConfig, '', document.getElementById('inputMacroCadeiaValor')?.value, true);
    setDropdownOptions('inputCadeiaValor', cadeiasConfig, '', document.getElementById('inputCadeiaValor')?.value, true);
    setDropdownOptions('inputEquipe', equipesConfig, '', document.getElementById('inputEquipe')?.value, true);
    setDropdownOptions('inputStatus', statusOpcoes, '', document.getElementById('inputStatus')?.value || 'Não iniciado', true);
  }

  exibirToast(mensagem, tipo = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const cores = {
      sucesso: 'bg-white border-emerald-200 text-emerald-900 shadow-md',
      erro: 'bg-white border-rose-200 text-rose-900 shadow-md',
      info: 'bg-white border-slate-200 text-slate-800 shadow-md'
    };
    const icones = {
      sucesso: 'fa-circle-check text-emerald-600',
      erro: 'fa-triangle-exclamation text-rose-600',
      info: 'fa-circle-info text-slate-500'
    };

    toast.className = `${cores[tipo] || cores.info} border px-4 py-2 rounded-lg text-xs flex items-center gap-2.5 pointer-events-auto max-w-sm transition-all duration-300 transform`;
    toast.innerHTML = `
      <i class="fa-solid ${icones[tipo] || icones.info} text-sm"></i>
      <span class="flex-1 font-medium">${mensagem}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-8px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  alternarVisaoPrincipal(visao) {
    this.visaoAtiva = visao;

    const btnExec = document.getElementById('tabNavExecutivo');
    const btnAtiv = document.getElementById('tabNavAtividades');
    const btnRoad = document.getElementById('tabNavRoadmap');
    const btnRepo = document.getElementById('tabNavReport');

    [
      { btn: btnExec, icon: 'fa-chart-pie' },
      { btn: btnAtiv, icon: 'fa-table-list' },
      { btn: btnRoad, icon: 'fa-timeline' },
      { btn: btnRepo, icon: 'fa-table-columns' }
    ].forEach(item => {
      if (item.btn) {
        item.btn.className = 'group relative py-2.5 px-3.5 text-xs font-medium flex items-center gap-2 border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition';
        const icon = item.btn.querySelector('i');
        if (icon) icon.className = `fa-solid ${item.icon} text-slate-400 group-hover:text-slate-600`;
      }
    });

    document.getElementById('visaoPainelExecutivo')?.classList.add('hidden');
    document.getElementById('visaoDetalheAtividades')?.classList.add('hidden');
    document.getElementById('visaoRoadmap')?.classList.add('hidden');
    document.getElementById('visaoReport')?.classList.add('hidden');

    if (visao === 'executivo') {
      if (btnExec) {
        btnExec.className = 'group relative py-2.5 px-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 border-emerald-600 text-emerald-700 transition';
        const icon = btnExec.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-chart-pie text-emerald-600';
      }
      document.getElementById('visaoPainelExecutivo')?.classList.remove('hidden');
      this.atualizarPainelExecutivo();
    } else if (visao === 'atividades') {
      if (btnAtiv) {
        btnAtiv.className = 'group relative py-2.5 px-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 border-emerald-600 text-emerald-700 transition';
        const icon = btnAtiv.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-table-list text-emerald-600';
      }
      document.getElementById('visaoDetalheAtividades')?.classList.remove('hidden');
      this.aplicarFiltros(false);
      this.configurarRedimensionamentoTabela();
    } else if (visao === 'roadmap') {
      if (btnRoad) {
        btnRoad.className = 'group relative py-2.5 px-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 border-emerald-600 text-emerald-700 transition';
        const icon = btnRoad.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-timeline text-emerald-600';
      }
      document.getElementById('visaoRoadmap')?.classList.remove('hidden');
      this.popularDropdownHorizonteAnos();
      this.atualizarGradeTemporalRoadmap();
      this.renderizarRoadmap();
      setTimeout(() => this.recentralizarHojeRoadmap(), 120);
    } else if (visao === 'report') {
      if (btnRepo) {
        btnRepo.className = 'group relative py-2.5 px-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 border-emerald-600 text-emerald-700 transition';
        const icon = btnRepo.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-table-columns text-emerald-600';
      }
      document.getElementById('visaoReport')?.classList.remove('hidden');
      if (this.reportComponent) {
        this.reportComponent.popularFiltrosDropdown();
        this.reportComponent.aplicarFiltros();
        this.reportComponent.renderizar();
      }
    }
  }

  // --- Inicialização Geral do Sistema ---
  async init() {
    this.migrarStatusLegado();
    this.normalizarEtapasConfiguracao();
    this.atualizarListasDeFiltro();
    this._setValue('filtroStatus', '');
    this.configurarRedimensionamentoTabela();
    this.configurarRedimensionamentoRoadmap();
    this.atualizarGradeTemporalRoadmap();

    const formEl = document.getElementById('formRegistro');
    if (formEl && !formEl.dataset.draftBound) {
      formEl.dataset.draftBound = 'true';
      formEl.addEventListener('input', () => this.salvarRascunhoForm());
      formEl.addEventListener('change', () => this.salvarRascunhoForm());
    }

    const gridBody = document.getElementById('colunaDireitaGrade');
    const gridHeader = document.getElementById('timelineHeaderContainer');
    const topScrollbar = document.getElementById('timelineTopScrollbar');

    if (gridBody && gridHeader) {
      let sincronizandoScroll = false;
      gridBody.addEventListener('scroll', () => {
        if (gridBody.scrollTop !== 0) gridBody.scrollTop = 0;
        if (sincronizandoScroll) return;
        sincronizandoScroll = true;
        requestAnimationFrame(() => {
          gridHeader.scrollLeft = gridBody.scrollLeft;
          if (topScrollbar) topScrollbar.scrollLeft = gridBody.scrollLeft;
          sincronizandoScroll = false;
        });
      });

      const scrollContainer = document.getElementById('roadmapBodyScroll');
      if (scrollContainer) {
        gridBody.addEventListener('wheel', (e) => {
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            scrollContainer.scrollTop += e.deltaY;
          }
        }, { passive: true });
      }

      if (topScrollbar) {
        topScrollbar.addEventListener('scroll', () => {
          if (sincronizandoScroll) return;
          sincronizandoScroll = true;
          requestAnimationFrame(() => {
            gridBody.scrollLeft = topScrollbar.scrollLeft;
            gridHeader.scrollLeft = topScrollbar.scrollLeft;
            sincronizandoScroll = false;
          });
        });
      }
    }

    // Observa estado de autenticação do Firebase
    if (this.firebaseService && this.firebaseService.estaDisponivel()) {
      this.firebaseService.observarAutenticacao((user) => {
        if (user) {
          document.getElementById('modalLoginFirebase')?.classList.add('hidden');
          this.atualizarBadgeConexaoFirebase(user, true);
          this.iniciarSincronizacaoTempoReal();
        } else {
          this.atualizarBadgeConexaoFirebase(null);
          document.getElementById('modalLoginFirebase')?.classList.remove('hidden');
        }
      });
    } else {
      this.exibirToast('Configuração do Firebase ausente. Verifique firebaseConfig.js.', 'erro');
    }

    this.restaurarRascunhoForm();
  }

  // --- Delegações para Submódulos ---
  obterDadosAtividadesForaDoPrazo() { return this.atrasosComponent ? this.atrasosComponent.obterDadosAtividadesForaDoPrazo() : []; }
  abrirModalRelatorioAtrasos() { if (this.atrasosComponent) this.atrasosComponent.abrirModalRelatorioAtrasos(); }
  verificarAtividadeForaDoPrazo(item) { return this.atrasosComponent ? this.atrasosComponent.verificarAtividadeForaDoPrazo(item) : false; }
  fecharModalRelatorioAtrasos() { if (this.atrasosComponent) this.atrasosComponent.fecharModalRelatorioAtrasos(); }
  irParaAtividadesForaDoPrazoAPartirDoModal() { if (this.atrasosComponent) this.atrasosComponent.irParaAtividadesForaDoPrazoAPartirDoModal(); }
  baixarRelatorioAtrasosExcel() { if (this.atrasosComponent) this.atrasosComponent.baixarRelatorioAtrasosExcel(); }

  configurarRedimensionamentoTabela() { if (this.tabelaComponent) this.tabelaComponent.configurarRedimensionamentoTabela(); }
  salvarLargurasColunasTabela() { if (this.tabelaComponent) this.tabelaComponent.salvarLargurasColunasTabela(); }
  restaurarLargurasColunasTabela() { if (this.tabelaComponent) this.tabelaComponent.restaurarLargurasColunasTabela(); }
  aplicarFiltrosComDebounce() { if (this.tabelaComponent) this.tabelaComponent.aplicarFiltrosComDebounce(); }
  limparFiltros(chamarAplicar = true) { if (this.tabelaComponent) this.tabelaComponent.limparFiltros(chamarAplicar); }
  mudarItensPorPagina(novoValor) { if (this.tabelaComponent) this.tabelaComponent.mudarItensPorPagina(novoValor); }
  mudarPagina(novaPagina) { if (this.tabelaComponent) this.tabelaComponent.mudarPagina(novaPagina); }
  aplicarFiltros(resetarPagina = false) { if (this.tabelaComponent) this.tabelaComponent.aplicarFiltros(resetarPagina); }
  atualizarTabelaPaginada() { if (this.tabelaComponent) this.tabelaComponent.atualizarTabelaPaginada(); }
  renderizarControlesPaginacao(i, f, t, p) { if (this.tabelaComponent) this.tabelaComponent.renderizarControlesPaginacao(i, f, t, p); }
  renderizarTabela(itens) { if (this.tabelaComponent) this.tabelaComponent.renderizarTabela(itens); }

  configurarRedimensionamentoRoadmap() { if (this.roadmapComponent) this.roadmapComponent.configurarRedimensionamentoRoadmap(); }
  popularDropdownHorizonteAnos() { if (this.roadmapComponent) this.roadmapComponent.popularDropdownHorizonteAnos(); }
  toggleHorizonteDropdown(event) { if (this.roadmapComponent) this.roadmapComponent.toggleHorizonteDropdown(event); }
  fecharHorizonteDropdown() { if (this.roadmapComponent) this.roadmapComponent.fecharHorizonteDropdown(); }
  aoAlternarAnoHorizonte(ano, checado) { if (this.roadmapComponent) this.roadmapComponent.aoAlternarAnoHorizonte(ano, checado); }
  selecionarTodosAnosHorizonte(todos) { if (this.roadmapComponent) this.roadmapComponent.selecionarTodosAnosHorizonte(todos); }
  alterarAgrupamentoRoadmap(tipo) { if (this.roadmapComponent) this.roadmapComponent.alterarAgrupamentoRoadmap(tipo); }
  atualizarGradeTemporalRoadmap() { if (this.roadmapComponent) this.roadmapComponent.atualizarGradeTemporalRoadmap(); }
  renderizarRoadmap() { if (this.roadmapComponent) this.roadmapComponent.renderizarRoadmap(); }
  recentralizarHojeRoadmap() { if (this.roadmapComponent) this.roadmapComponent.recentralizarHojeRoadmap(); }
  toggleExpandirEtapasRoadmap(id, event) { if (this.roadmapComponent) this.roadmapComponent.toggleExpandirEtapasRoadmap(id, event); }
  obterListaAnosDisponiveis() { return this.roadmapComponent ? this.roadmapComponent.obterListaAnosDisponiveis() : [2025, 2026, 2027]; }
  togglePrioridadeRoadmapDropdown(event) { if (this.roadmapComponent) this.roadmapComponent.togglePrioridadeRoadmapDropdown(event); }
  fecharPrioridadeRoadmapDropdown() { if (this.roadmapComponent) this.roadmapComponent.fecharPrioridadeRoadmapDropdown(); }
  aoAlternarPrioridadeRoadmap(codigo, checado) { if (this.roadmapComponent) this.roadmapComponent.aoAlternarPrioridadeRoadmap(codigo, checado); }
  selecionarTodasPrioridadesRoadmap(todas) { if (this.roadmapComponent) this.roadmapComponent.selecionarTodasPrioridadesRoadmap(todas); }

  calcularKpis() { if (this.executivoComponent) this.executivoComponent.calcularKpis(); }
  atualizarPainelExecutivo() { if (this.executivoComponent) this.executivoComponent.atualizarPainelExecutivo(); }
  irParaAtividadesFiltradasP0P1() { if (this.executivoComponent) this.executivoComponent.irParaAtividadesFiltradasP0P1(); }
  irParaAtividadesForaDoPrazo() { if (this.executivoComponent) this.executivoComponent.irParaAtividadesForaDoPrazo(); }
  selecionarStatusPainelInterativo(st) { if (this.executivoComponent) this.executivoComponent.selecionarStatusPainelInterativo(st); }
  irParaAtividadesFiltradasStatusAtual() { if (this.executivoComponent) this.executivoComponent.irParaAtividadesFiltradasStatusAtual(); }
  aoArrastarRadar(e, i) { if (this.executivoComponent) this.executivoComponent.aoArrastarRadar(e, i); }
  aoSobreporArrasto(e) { if (this.executivoComponent) this.executivoComponent.aoSobreporArrasto(e); }
  aoEntrarArrasto(e) { if (this.executivoComponent) this.executivoComponent.aoEntrarArrasto(e); }
  aoSairArrasto(e) { if (this.executivoComponent) this.executivoComponent.aoSairArrasto(e); }
  aoFinalizarArrastoRadar(e) { if (this.executivoComponent) this.executivoComponent.aoFinalizarArrastoRadar(e); }
  aoSoltarRadar(e, i) { if (this.executivoComponent) this.executivoComponent.aoSoltarRadar(e, i); }
  moverItemRadar(i, d) { if (this.executivoComponent) this.executivoComponent.moverItemRadar(i, d); }
  obterCorDotEtapa(e) { return this.executivoComponent ? this.executivoComponent.obterCorDotEtapa(e) : 'bg-slate-400'; }
  obterCorBarraEtapa(e) { return this.executivoComponent ? this.executivoComponent.obterCorBarraEtapa(e) : 'bg-emerald-500'; }

  salvarRascunhoForm() { if (this.modaisComponent) this.modaisComponent.salvarRascunhoForm(); }
  limparRascunhoForm() { if (this.modaisComponent) this.modaisComponent.limparRascunhoForm(); }
  restaurarRascunhoForm() { if (this.modaisComponent) this.modaisComponent.restaurarRascunhoForm(); }
  abrirPopupMesAno(e, id) { if (this.modaisComponent) this.modaisComponent.abrirPopupMesAno(e, id); }
  fecharPopupMesAno() { if (this.modaisComponent) this.modaisComponent.fecharPopupMesAno(); }
  popularSelectAnoPicker() { if (this.modaisComponent) this.modaisComponent.popularSelectAnoPicker(); }
  selecionarAnoPicker(a) { if (this.modaisComponent) this.modaisComponent.selecionarAnoPicker(a); }
  alterarAnoPicker(d) { if (this.modaisComponent) this.modaisComponent.alterarAnoPicker(d); }
  atualizarGradeMesesPicker() { if (this.modaisComponent) this.modaisComponent.atualizarGradeMesesPicker(); }
  selecionarMesNoPicker(m) { if (this.modaisComponent) this.modaisComponent.selecionarMesNoPicker(m); }
  limparMesAnoPicker() { if (this.modaisComponent) this.modaisComponent.limparMesAnoPicker(); }
  selecionarEsteMesPicker() { if (this.modaisComponent) this.modaisComponent.selecionarEsteMesPicker(); }

  abrirModalConfiguracoes() { if (this.modaisComponent) this.modaisComponent.abrirModalConfiguracoes(); }
  fecharModalConfiguracoes() { if (this.modaisComponent) this.modaisComponent.fecharModalConfiguracoes(); }
  renderizarTagsConfiguracao() { if (this.modaisComponent) this.modaisComponent.renderizarTagsConfiguracao(); }
  adicionarAnoConfig() { if (this.modaisComponent) this.modaisComponent.adicionarAnoConfig(); }
  removerAnoConfig(a) { if (this.modaisComponent) this.modaisComponent.removerAnoConfig(a); }
  renomearStatusConfig(i, n) { if (this.modaisComponent) this.modaisComponent.renomearStatusConfig(i, n); }
  moverStatus(i, d) { if (this.modaisComponent) this.modaisComponent.moverStatus(i, d); }
  adicionarStatusConfig() { if (this.modaisComponent) this.modaisComponent.adicionarStatusConfig(); }
  removerStatusConfig(s) { if (this.modaisComponent) this.modaisComponent.removerStatusConfig(s); }
  moverEtapa(i, d) { if (this.modaisComponent) this.modaisComponent.moverEtapa(i, d); }
  removerEtapaConfig(e) { if (this.modaisComponent) this.modaisComponent.removerEtapaConfig(e); }
  adicionarEtapaConfig() { if (this.modaisComponent) this.modaisComponent.adicionarEtapaConfig(); }
  atualizarPesoEtapa(e, p) { if (this.modaisComponent) this.modaisComponent.atualizarPesoEtapa(e, p); }
  distribuirPesosEtapas(n) { if (this.modaisComponent) this.modaisComponent.distribuirPesosEtapas(n); }
  adicionarCadeiaValorConfig() { if (this.modaisComponent) this.modaisComponent.adicionarCadeiaValorConfig(); }
  removerCadeiaValorConfig(id) { if (this.modaisComponent) this.modaisComponent.removerCadeiaValorConfig(id); }
  adicionarCadeiaConfig() { if (this.modaisComponent) this.modaisComponent.adicionarCadeiaConfig(); }
  removerCadeiaConfig(c) { if (this.modaisComponent) this.modaisComponent.removerCadeiaConfig(c); }
  adicionarEquipeConfig() { if (this.modaisComponent) this.modaisComponent.adicionarEquipeConfig(); }
  removerEquipeConfig(eq) { if (this.modaisComponent) this.modaisComponent.removerEquipeConfig(eq); }
  salvarConfiguracoesForm() { if (this.modaisComponent) return this.modaisComponent.salvarConfiguracoesForm(); }

  abrirModalDetalhesId(id) { if (this.modaisComponent) this.modaisComponent.abrirModalDetalhesId(id); }
  fecharModalDetalhesId() { if (this.modaisComponent) this.modaisComponent.fecharModalDetalhesId(); }
  atualizarEstadoBotaoProximaEtapa() { if (this.modaisComponent) this.modaisComponent.atualizarEstadoBotaoProximaEtapa(); }
  renderizarEtapasForm() { if (this.modaisComponent) this.modaisComponent.renderizarEtapasForm(); }
  aoAlterarDataInicioEtapa(i, v) { if (this.modaisComponent) this.modaisComponent.aoAlterarDataInicioEtapa(i, v); }
  aoAlterarTituloEtapa(i, v) { if (this.modaisComponent) this.modaisComponent.aoAlterarTituloEtapa(i, v); }
  aoAlternarConclusaoEtapa(i, c) { if (this.modaisComponent) this.modaisComponent.aoAlternarConclusaoEtapa(i, c); }
  aoAlterarNomeEtapa(i, n) { if (this.modaisComponent) this.modaisComponent.aoAlterarNomeEtapa(i, n); }
  aoAlterarDataProgramadaEtapa(i, v) { if (this.modaisComponent) this.modaisComponent.aoAlterarDataProgramadaEtapa(i, v); }
  aoAlterarDataEntregaEtapa(i, v) { if (this.modaisComponent) this.modaisComponent.aoAlterarDataEntregaEtapa(i, v); }
  aoAlterarObsEtapa(i, v) { if (this.modaisComponent) this.modaisComponent.aoAlterarObsEtapa(i, v); }
  adicionarNovaEtapaSequencial() { if (this.modaisComponent) this.modaisComponent.adicionarNovaEtapaSequencial(); }

  async abrirModalForm() {
    if (this.modaisComponent) {
      this.modaisComponent.abrirModalForm();
      if (this.firebaseService && this.firebaseService.usuarioAtual) {
        try {
          const idsAtuais = this.bancoDados.map(x => x.id);
          const idAtomico = await this.firebaseService.gerarProximoIdAtomico(idsAtuais);
          this._setValue('inputId', idAtomico);
        } catch (e) {
          console.warn('Usando fallback de ID sequencial:', e);
        }
      }
    }
  }
  abrirModalEdicao(id) { if (this.modaisComponent) this.modaisComponent.abrirModalEdicao(id); }
  removerEtapaSequencial(i) { if (this.modaisComponent) this.modaisComponent.removerEtapaSequencial(i); }
  moverEtapaSequencial(i, d) { if (this.modaisComponent) this.modaisComponent.moverEtapaSequencial(i, d); }
  recalcularProgressoPelasEtapas() { if (this.modaisComponent) this.modaisComponent.recalcularProgressoPelasEtapas(); }
  aplicarPesoEtapaAtual() { if (this.modaisComponent) this.modaisComponent.aplicarPesoEtapaAtual(); }
  fecharModalForm() { if (this.modaisComponent) this.modaisComponent.fecharModalForm(); }
  salvarItemForm(e) { if (this.modaisComponent) return this.modaisComponent.salvarItemForm(e); }

  confirmarExclusao(id) { if (this.modaisComponent) this.modaisComponent.confirmarExclusao(id); }
  fecharModalExclusao() { if (this.modaisComponent) this.modaisComponent.fecharModalExclusao(); }
  executarExclusao() { if (this.modaisComponent) return this.modaisComponent.executarExclusao(); }

  alternarAbaPreview(n) { if (this.modaisComponent) this.modaisComponent.alternarAbaPreview(n); }
  abrirModalPreviewExcel() { if (this.modaisComponent) this.modaisComponent.abrirModalPreviewExcel(); }
  renderizarConteudoPreviewExcel() { if (this.modaisComponent) this.modaisComponent.renderizarConteudoPreviewExcel(); }
  fecharModalPreviewExcel() { if (this.modaisComponent) this.modaisComponent.fecharModalPreviewExcel(); }

  aoAlterarPrioridadeEtapa(i, v) { if (this.modaisComponent) this.modaisComponent.aoAlterarPrioridadeEtapa(i, v); }
  aoAlterarResponsavelEtapa(i, v) { if (this.modaisComponent) this.modaisComponent.aoAlterarResponsavelEtapa(i, v); }
  filtrarEtapasDetalheModal() { if (this.modaisComponent) this.modaisComponent.filtrarEtapasDetalheModal(); }
  limparFiltrosEtapasDetalhe() { if (this.modaisComponent) this.modaisComponent.limparFiltrosEtapasDetalhe(); }
  adicionarPrioridadeConfig() { if (this.modaisComponent) this.modaisComponent.adicionarPrioridadeConfig(); }
  removerPrioridadeConfig(p) { if (this.modaisComponent) this.modaisComponent.removerPrioridadeConfig(p); }

  abrirModalEdicaoEtapaIndividual(id, idx) { if (this.modaisComponent) this.modaisComponent.abrirModalEdicaoEtapaIndividual(id, idx); }
  fecharModalEdicaoEtapaIndividual() { if (this.modaisComponent) this.modaisComponent.fecharModalEdicaoEtapaIndividual(); }
  aoAlternarConclusaoModalEtapaRapida(c) { if (this.modaisComponent) this.modaisComponent.aoAlternarConclusaoModalEtapaRapida(c); }
  salvarEdicaoEtapaIndividual(e) { if (this.modaisComponent) return this.modaisComponent.salvarEdicaoEtapaIndividual(e); }
  aoMudarTipoDependenciaModalRapida(t) { if (this.modaisComponent) this.modaisComponent.aoMudarTipoDependenciaModalRapida(t); }
  aoMudarAtividadeDependenciaModalRapida(id) { if (this.modaisComponent) this.modaisComponent.aoMudarAtividadeDependenciaModalRapida(id); }

  aoAlterarTipoDependenciaEtapaForm(i, t) { if (this.modaisComponent) this.modaisComponent.aoAlterarTipoDependenciaEtapaForm(i, t); }
  aoAlterarAtividadeDependenciaEtapaForm(i, id) { if (this.modaisComponent) this.modaisComponent.aoAlterarAtividadeDependenciaEtapaForm(i, id); }
  aoAlterarEtapaDependenciaEtapaForm(i, n) { if (this.modaisComponent) this.modaisComponent.aoAlterarEtapaDependenciaEtapaForm(i, n); }

  // Multisseleção de Status, Colunas e Exportação Excel (unificados na Aba Atividades)
  toggleStatusTabelaDropdown(e) { if (this.tabelaComponent) this.tabelaComponent.toggleStatusDropdown(e); }
  fecharStatusTabelaDropdown() { if (this.tabelaComponent) this.tabelaComponent.fecharStatusDropdown(); }
  aoAlternarStatusTabela(s, c) { if (this.tabelaComponent) this.tabelaComponent.aoAlternarStatus(s, c); }
  selecionarTodosStatusTabela(t) { if (this.tabelaComponent) this.tabelaComponent.selecionarTodosStatus(t); }

  abrirModalConfigColunasReport() { if (this.tabelaComponent) this.tabelaComponent.abrirModalConfigColunas(); }
  fecharModalConfigColunasReport() { if (this.tabelaComponent) this.tabelaComponent.fecharModalConfigColunas(); }
  salvarConfigColunasReport() { if (this.tabelaComponent) this.tabelaComponent.salvarConfigColunas(); }
  marcarTodasColunasReport(g, m) { if (this.tabelaComponent) this.tabelaComponent.marcarTodasColunas(g, m); }
  restaurarColunasPadraoReport() { if (this.tabelaComponent) this.tabelaComponent.restaurarColunasPadrao(); }
  exportarExcelReport() { if (this.tabelaComponent) this.tabelaComponent.exportarExcel(); }

  abrirModalVisaoExecutiva() {
    if (!this.visaoExecutivaComponent && typeof window.VisaoExecutivaComponent === 'function') {
      this.visaoExecutivaComponent = new window.VisaoExecutivaComponent(this);
    }
    if (this.visaoExecutivaComponent) {
      this.visaoExecutivaComponent.abrirModal();
    } else {
      console.error('Classe VisaoExecutivaComponent não encontrada em window.');
    }
  }

  aoMudarDataInicioVisaoExecutiva(val) { if (this.visaoExecutivaComponent) this.visaoExecutivaComponent.aoMudarDataInicio(val); }
  aoMudarDataFimVisaoExecutiva(val) { if (this.visaoExecutivaComponent) this.visaoExecutivaComponent.aoMudarDataFim(val); }
  limparFiltroDatasVisaoExecutiva() { if (this.visaoExecutivaComponent) this.visaoExecutivaComponent.limparFiltroDatasExec(); }
  fecharModalVisaoExecutiva() { if (this.visaoExecutivaComponent) this.visaoExecutivaComponent.fecharModal(); }
  voltarParaSelecaoVisaoExecutiva() { if (this.visaoExecutivaComponent) this.visaoExecutivaComponent.voltarParaSelecao(); }
  aoAlternarCadeiaVisaoExecutiva(c, chk) { if (this.visaoExecutivaComponent) this.visaoExecutivaComponent.aoAlternarCadeia(c, chk); }
  selecionarTodasCadeiasVisaoExecutiva(marcar) { if (this.visaoExecutivaComponent) this.visaoExecutivaComponent.selecionarTodasCadeias(marcar); }
  selecionarModeloVisaoExecutiva(m) { if (this.visaoExecutivaComponent) this.visaoExecutivaComponent.selecionarModelo(m); }

  gerarVisaoExecutiva() {
    if (!this.visaoExecutivaComponent && typeof window.VisaoExecutivaComponent === 'function') {
      this.visaoExecutivaComponent = new window.VisaoExecutivaComponent(this);
    }
    if (this.visaoExecutivaComponent) {
      this.visaoExecutivaComponent.gerar();
    }
  }

  mudarSlideVisaoExecutiva(delta) { if (this.visaoExecutivaComponent) this.visaoExecutivaComponent.mudarSlide(delta); }
  mudarModeloDiretoVisaoExecutiva(m) { if (this.visaoExecutivaComponent) this.visaoExecutivaComponent.mudarModeloDireto(m); }
  aoMudarFiltroMacroVisaoExecutiva(val) { if (this.visaoExecutivaComponent) this.visaoExecutivaComponent.aoMudarFiltroMacro(val); }
  aoFiltrarBuscaFrentesVisaoExecutiva(val) { if (this.visaoExecutivaComponent) this.visaoExecutivaComponent.aoFiltrarBuscaFrentes(val); }
  selecionarFrentesVisiveisVisaoExecutiva(marcar) { if (this.visaoExecutivaComponent) this.visaoExecutivaComponent.selecionarFrentesVisiveis(marcar); }
  baixarApresentacaoVisaoExecutiva() {
    if (this.visaoExecutivaComponent) this.visaoExecutivaComponent.baixarApresentacao();
  }
}

window.AppController = AppController;
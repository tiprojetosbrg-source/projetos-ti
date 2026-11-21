// js/controllers/components/modaisComponent.js
class ModaisComponent {
  constructor(controller) {
    this.ctrl = controller;
    this.editandoId = null;
    this.itemParaExcluir = null;
    this.abaPreviewAtual = 'tb_Atividades';
    this.etapasFormAtual = [];
    /* Controle da Modal de Detalhes e Filtros de Etapas */
    this.detalheItemAtual = null;
    this.etapasDetalhesOriginais = [];
    /* Controle do Seletor Popup de Mês/Ano */
    this.pickerAtivoInputId = null;
    this.pickerAnoAtual = new Date().getFullYear();
    this.pickerMesAtual = String(new Date().getMonth() + 1).padStart(2, '0');
    this.mesesAbrev = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  }

  // ================= CONTROLE DE SESSÃO / RASCUNHO =================
  salvarRascunhoForm() {
    const modal = document.getElementById('modalFormulario');
    if (!modal || modal.classList.contains('hidden')) return;
    try {
      const rascunho = {
        editandoId: this.editandoId,
        modalAberto: true,
        timestamp: Date.now(),
        dados: {
          id: document.getElementById('inputId')?.value || '',
          titulo: document.getElementById('inputTitulo')?.value || '',
          macroCadeiaValor: document.getElementById('inputMacroCadeiaValor')?.value || '',
          cadeiaValor: document.getElementById('inputCadeiaValor')?.value || '',
          equipe: document.getElementById('inputEquipe')?.value || '',
          status: document.getElementById('inputStatus')?.value || '',
          responsavel: document.getElementById('inputResponsavel')?.value || '',
          prioridade: document.getElementById('inputPrioridade')?.value || '',
          prazoInicio: document.getElementById('inputPrazoInicio')?.value || '',
          prazo: document.getElementById('inputPrazo')?.value || '',
          conclusao: document.getElementById('inputConclusao')?.value || '',
          progresso: document.getElementById('inputProgresso')?.value || '0',
          liderTechProtheus: document.getElementById('inputLiderProtheus')?.value || '',
          liderTechWebtrade: document.getElementById('inputLiderWebtrade')?.value || '',
          desenvolvedor: document.getElementById('inputDesenvolvedor')?.value || '',
          etapasFormAtual: this.etapasFormAtual
        }
      };
      sessionStorage.setItem('brg_formulario_rascunho', JSON.stringify(rascunho));
    } catch (e) {
      console.warn('Erro ao salvar rascunho:', e);
    }
  }

  limparRascunhoForm() {
    try {
      sessionStorage.removeItem('brg_formulario_rascunho');
    } catch (e) {}
  }

  restaurarRascunhoForm() {
    try {
      const salvo = sessionStorage.getItem('brg_formulario_rascunho');
      if (!salvo) return;
      const rascunho = JSON.parse(salvo);
      if (!rascunho || !rascunho.modalAberto || !rascunho.dados) return;
      this.editandoId = rascunho.editandoId ? String(rascunho.editandoId).trim() : null;
      this.ctrl.atualizarListasDeFiltro();
      this.ctrl._setValue('inputId', rascunho.dados.id);
      this.ctrl._setValue('inputTitulo', rascunho.dados.titulo);
      this.ctrl._setValue('inputMacroCadeiaValor', rascunho.dados.macroCadeiaValor);
      this.ctrl._setValue('inputCadeiaValor', rascunho.dados.cadeiaValor);
      this.ctrl._setValue('inputEquipe', rascunho.dados.equipe);
      this.ctrl._setValue('inputStatus', rascunho.dados.status);
      this.ctrl._setValue('inputResponsavel', rascunho.dados.responsavel);
      this.ctrl._setValue('inputPrioridade', rascunho.dados.prioridade);
      this.ctrl._setValue('inputPrazoInicio', rascunho.dados.prazoInicio);
      this.ctrl._setValue('inputPrazo', rascunho.dados.prazo);
      this.ctrl._setValue('inputConclusao', rascunho.dados.conclusao);
      this.ctrl._setValue('inputProgresso', rascunho.dados.progresso);
      this.ctrl._setValue('inputLiderProtheus', rascunho.dados.liderTechProtheus);
      this.ctrl._setValue('inputLiderWebtrade', rascunho.dados.liderTechWebtrade);
      this.ctrl._setValue('inputDesenvolvedor', rascunho.dados.desenvolvedor);
      this.etapasFormAtual = Array.isArray(rascunho.dados.etapasFormAtual) && rascunho.dados.etapasFormAtual.length > 0
        ? rascunho.dados.etapasFormAtual
        : [];
      this.renderizarEtapasForm();
      const tituloModal = this.editandoId
        ? `Editar Atividade (${this.editandoId}) no Excel (Rascunho Restaurado)`
        : `Cadastrar Atividade (${rascunho.dados.id || 'Nova'}) no Excel (Rascunho Restaurado)`;
      this.ctrl._setText('modalTitulo', tituloModal);
      document.getElementById('modalFormulario')?.classList.remove('hidden');
      this.ctrl.exibirToast('Rascunho em edição restaurado após atualização da página.', 'info');
    } catch (e) {
      console.warn('Erro ao restaurar rascunho:', e);
    }
  }

  // ================= POPUP SELETOR DE MÊS/ANO =================
  abrirPopupMesAno(event, inputId) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const inputEl = document.getElementById(inputId);
    const popup = document.getElementById('popupSeletorMesAno');
    if (!inputEl || !popup) return;
    this.pickerAtivoInputId = inputId;
    const anosDisponiveis = this.ctrl.obterListaAnosDisponiveis();
    const val = inputEl.value;
    let anoAlvo, mesAlvo;
    if (val && val.includes('-')) {
      const [ano, mes] = val.split('-');
      anoAlvo = parseInt(ano, 10);
      mesAlvo = mes.padStart(2, '0');
    } else {
      const hoje = new Date();
      anoAlvo = hoje.getFullYear();
      mesAlvo = String(hoje.getMonth() + 1).padStart(2, '0');
    }
    if (!anosDisponiveis.includes(anoAlvo)) {
      anoAlvo = anosDisponiveis.reduce((maisProximo, atual) =>
        Math.abs(atual - anoAlvo) < Math.abs(maisProximo - anoAlvo) ? atual : maisProximo
      , anosDisponiveis[0]);
    }
    this.pickerAnoAtual = anoAlvo;
    this.pickerMesAtual = mesAlvo;
    this.popularSelectAnoPicker();
    this.atualizarGradeMesesPicker();
    const rect = inputEl.getBoundingClientRect();
    let top = rect.bottom + 4;
    let left = rect.left;
    if (left + 240 > window.innerWidth) left = Math.max(8, window.innerWidth - 245);
    if (top + 250 > window.innerHeight) top = Math.max(8, rect.top - 250);
    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;
    popup.classList.remove('hidden');
  }

  fecharPopupMesAno() {
    document.getElementById('popupSeletorMesAno')?.classList.add('hidden');
    this.pickerAtivoInputId = null;
  }

  popularSelectAnoPicker() {
    const anosDisponiveis = this.ctrl.obterListaAnosDisponiveis();
    const select = document.getElementById('pickerAnoSelect');
    if (select) {
      select.innerHTML = anosDisponiveis.map(ano =>
        `<option value="${ano}" ${ano === this.pickerAnoAtual ? 'selected' : ''}>${ano}</option>`
      ).join('');
    }
    const idxAtual = anosDisponiveis.indexOf(this.pickerAnoAtual);
    const btnPrev = document.getElementById('pickerAnoPrevBtn');
    const btnNext = document.getElementById('pickerAnoNextBtn');
    if (btnPrev) btnPrev.disabled = (idxAtual <= 0);
    if (btnNext) btnNext.disabled = (idxAtual === -1 || idxAtual >= anosDisponiveis.length - 1);
  }

  selecionarAnoPicker(anoStr) {
    this.pickerAnoAtual = parseInt(anoStr, 10);
    this.popularSelectAnoPicker();
    this.atualizarGradeMesesPicker();
  }

  alterarAnoPicker(delta) {
    const anosDisponiveis = this.ctrl.obterListaAnosDisponiveis();
    const idxAtual = anosDisponiveis.indexOf(this.pickerAnoAtual);
    const novoIdx = (idxAtual === -1 ? 0 : idxAtual) + delta;
    if (novoIdx < 0 || novoIdx >= anosDisponiveis.length) return;
    this.pickerAnoAtual = anosDisponiveis[novoIdx];
    this.popularSelectAnoPicker();
    this.atualizarGradeMesesPicker();
  }

  atualizarGradeMesesPicker() {
    const grade = document.getElementById('pickerGradeMeses');
    if (!grade) return;
    const inputEl = this.pickerAtivoInputId ? document.getElementById(this.pickerAtivoInputId) : null;
    let mesSelecionado = null;
    let anoSelecionado = null;
    if (inputEl && inputEl.value && inputEl.value.includes('-')) {
      const [ano, mes] = inputEl.value.split('-');
      anoSelecionado = parseInt(ano, 10);
      mesSelecionado = mes.padStart(2, '0');
    }
    grade.innerHTML = this.mesesAbrev.map((mesAbrev, idx) => {
      const numMesStr = String(idx + 1).padStart(2, '0');
      const isAtivo = (anoSelecionado === this.pickerAnoAtual && mesSelecionado === numMesStr);
      const classeBotao = isAtivo
        ? 'bg-[#0066ff] text-white font-medium border-2 border-black rounded shadow-xs py-1.5'
        : 'text-slate-800 hover:bg-slate-100 rounded py-1.5 font-normal transition';
      return `
        <button
          type="button"
          onclick="app.selecionarMesNoPicker('${numMesStr}')"
          class="${classeBotao} text-xs tracking-tight capitalize"
        >
          ${mesAbrev}
        </button>
      `;
    }).join('');
  }

  selecionarMesNoPicker(numMesStr) {
    if (!this.pickerAtivoInputId) return;
    const inputEl = document.getElementById(this.pickerAtivoInputId);
    if (inputEl) {
      inputEl.value = `${this.pickerAnoAtual}-${numMesStr}`;
      inputEl.dispatchEvent(new Event('change'));
    }
    this.fecharPopupMesAno();
  }

  limparMesAnoPicker() {
    if (!this.pickerAtivoInputId) return;
    const inputEl = document.getElementById(this.pickerAtivoInputId);
    if (inputEl) {
      inputEl.value = '';
      inputEl.dispatchEvent(new Event('change'));
    }
    this.fecharPopupMesAno();
  }

  selecionarEsteMesPicker() {
    const hoje = new Date();
    const anosDisponiveis = this.ctrl.obterListaAnosDisponiveis();
    let anoHoje = hoje.getFullYear();
    if (!anosDisponiveis.includes(anoHoje)) {
      anoHoje = anosDisponiveis.reduce((maisProximo, atual) =>
        Math.abs(atual - anoHoje) < Math.abs(maisProximo - anoHoje) ? atual : maisProximo
      , anosDisponiveis[0]);
    }
    this.pickerAnoAtual = anoHoje;
    const mesStr = String(hoje.getMonth() + 1).padStart(2, '0');
    this.selecionarMesNoPicker(mesStr);
  }

  // ================= MODAL DE CONFIGURAÇÕES =================
  abrirModalConfiguracoes() {
    this.ctrl.migrarStatusLegado();
    this.ctrl._setValue('cfgOrganizacao', this.ctrl.configuracoes.organizacao || '');
    this.ctrl._setValue('cfgCiclo', this.ctrl.configuracoes.ciclo || '');
    this.renderizarTagsConfiguracao();
    document.getElementById('modalConfiguracoes')?.classList.remove('hidden');
  }

  fecharModalConfiguracoes() {
    document.getElementById('modalConfiguracoes')?.classList.add('hidden');
  }

  renderizarTagsConfiguracao() {
    const containerEtapas = document.getElementById('containerTagsEtapas');
    const containerCadeiaValor = document.getElementById('containerTagsCadeiaValor');
    const containerCadeias = document.getElementById('containerTagsCadeias');
    const containerEquipes = document.getElementById('containerTagsEquipes');
    const containerStatus = document.getElementById('containerTagsStatus');
    const containerAnos = document.getElementById('containerTagsAnosConfig');

    if (!this.ctrl.configuracoes.listaCadeiaValor) {
      this.ctrl.configuracoes.listaCadeiaValor = [...(window.configuracoesPadrao?.listaCadeiaValor || ['Operações', 'Comercial', 'Financeiro', 'Tecnologia', 'Suprimentos'])];
    }
    this.ctrl._setText('badgeTotalEtapas', `${this.ctrl.configuracoes.etapas.length} etapas`);
    this.ctrl._setText('badgeTotalCadeiaValor', `${this.ctrl.configuracoes.listaCadeiaValor.length} cadastrados`);
    this.ctrl._setText('badgeTotalCadeias', `${this.ctrl.configuracoes.cadeiasValor.length} cadastrados`);
    this.ctrl._setText('badgeTotalEquipes', `${this.ctrl.configuracoes.equipes.length} equipes`);
    this.ctrl._setText('badgeTotalStatus', `${(this.ctrl.configuracoes.statusList || []).length} status`);
    if (!this.ctrl.configuracoes.anosRoadmap) this.ctrl.configuracoes.anosRoadmap = [2025, 2026, 2027];
    this.ctrl._setText('badgeTotalAnosConfig', `${this.ctrl.configuracoes.anosRoadmap.length} anos`);

    if (containerEtapas) {
      containerEtapas.innerHTML = this.ctrl.configuracoes.etapas.map((etapa, idx) => `
        <div class="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg text-xs shadow-2xs hover:border-slate-300 transition">
          <span class="font-medium text-slate-800 truncate pr-1">${this.ctrl.escapeHtml(etapa.nome)}</span>
          <div class="flex items-center gap-1 shrink-0">
            <div class="flex items-center bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
              <input
                type="number" min="0" max="100" value="${etapa.peso}"
                onchange="app.atualizarPesoEtapa('${this.ctrl.escapeAttrJs(etapa.nome)}', this.value)"
                class="w-10 bg-transparent font-mono font-bold text-emerald-700 text-xs text-right outline-none"
                title="Edite diretamente para valor manual"
              >
              <span class="text-slate-400 font-mono text-[10px]">%</span>
            </div>
            <button type="button" onclick="app.moverEtapa(${idx}, -1)" ${idx === 0 ? 'disabled' : ''} class="text-slate-300 hover:text-slate-700 disabled:opacity-20 p-1">
              <i class="fa-solid fa-arrow-up text-[10px]"></i>
            </button>
            <button type="button" onclick="app.moverEtapa(${idx}, 1)" ${idx === this.ctrl.configuracoes.etapas.length - 1 ? 'disabled' : ''} class="text-slate-300 hover:text-slate-700 disabled:opacity-20 p-1">
              <i class="fa-solid fa-arrow-down text-[10px]"></i>
            </button>
            <button type="button" onclick="app.removerEtapaConfig('${this.ctrl.escapeAttrJs(etapa.nome)}')" class="text-slate-300 hover:text-rose-600 p-1">
              <i class="fa-solid fa-xmark text-xs"></i>
            </button>
          </div>
        </div>
      `).join('');
    }

    const list = this.ctrl.configuracoes.statusList || [];
    if (containerStatus) {
      containerStatus.innerHTML = list.map((st, idx) => `
        <div class="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg text-xs shadow-2xs hover:border-slate-300 transition gap-2">
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <span class="font-mono text-[10px] text-slate-400 w-4">${idx + 1}.</span>
            <input
              type="text" value="${this.ctrl.escapeHtml(st)}"
              onchange="app.renomearStatusConfig(${idx}, this.value)"
              class="flex-1 px-2 py-0.5 border border-slate-200 rounded text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
            >
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <button type="button" onclick="app.moverStatus(${idx}, -1)" ${idx === 0 ? 'disabled' : ''} class="text-slate-300 hover:text-slate-700 disabled:opacity-20 p-1">
              <i class="fa-solid fa-arrow-up text-[10px]"></i>
            </button>
            <button type="button" onclick="app.moverStatus(${idx}, 1)" ${idx === list.length - 1 ? 'disabled' : ''} class="text-slate-300 hover:text-slate-700 disabled:opacity-20 p-1">
              <i class="fa-solid fa-arrow-down text-[10px]"></i>
            </button>
            <button type="button" onclick="app.removerStatusConfig('${this.ctrl.escapeAttrJs(st)}')" class="text-slate-300 hover:text-rose-600 p-1 ml-1">
              <i class="fa-solid fa-xmark text-xs"></i>
            </button>
          </div>
        </div>
      `).join('');
    }

    if (containerCadeiaValor) {
      containerCadeiaValor.innerHTML = (this.ctrl.configuracoes.listaCadeiaValor || []).map((cv, idx) => `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs shadow-2xs font-medium">
          <span>${this.ctrl.escapeHtml(cv)}</span>
          <button type="button" onclick="app.removerCadeiaValorConfig(${idx})" class="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer transition" title="Remover ${this.ctrl.escapeAttrJs(cv)}">
            <i class="fa-solid fa-xmark text-[10px]"></i>
          </button>
        </span>
      `).join('');
    }

    if (containerCadeias) {
      containerCadeias.innerHTML = this.ctrl.configuracoes.cadeiasValor.map(c => `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs shadow-2xs font-medium">
          <span>${this.ctrl.escapeHtml(c)}</span>
          <button type="button" onclick="app.removerCadeiaConfig('${this.ctrl.escapeAttrJs(c)}')" class="text-slate-400 hover:text-rose-600">
            <i class="fa-solid fa-xmark text-[10px]"></i>
          </button>
        </span>
      `).join('');
    }

    if (containerEquipes) {
      containerEquipes.innerHTML = this.ctrl.configuracoes.equipes.map(eq => `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs shadow-2xs font-medium">
          <span>${this.ctrl.escapeHtml(eq)}</span>
          <button type="button" onclick="app.removerEquipeConfig('${this.ctrl.escapeAttrJs(eq)}')" class="text-slate-400 hover:text-rose-600">
            <i class="fa-solid fa-xmark text-[10px]"></i>
          </button>
        </span>
      `).join('');
    }

    if (containerAnos) {
      const anosOrd = [...this.ctrl.configuracoes.anosRoadmap].sort((a, b) => a - b);
      containerAnos.innerHTML = anosOrd.map(ano => `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs shadow-2xs font-mono font-semibold">
          <i class="fa-regular fa-calendar text-[10px] text-emerald-600"></i>
          <span>${ano}</span>
          <button type="button" onclick="app.removerAnoConfig(${ano})" class="text-slate-400 hover:text-rose-600">
            <i class="fa-solid fa-xmark text-[10px]"></i>
          </button>
        </span>
      `).join('');
    }

    if (!this.ctrl.configuracoes.prioridades) {
      this.ctrl.configuracoes.prioridades = [...(window.configuracoesPadrao?.prioridades || ['P0 - Crítica', 'P1 - Alta', 'P2 - Média', 'P3 - Baixa'])];
    }
    this.ctrl._setText('badgeTotalPrioridades', `${this.ctrl.configuracoes.prioridades.length} cadastradas`);

    const containerPrioridades = document.getElementById('containerTagsPrioridades');
    if (containerPrioridades) {
      containerPrioridades.innerHTML = this.ctrl.configuracoes.prioridades.map(p => `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs shadow-2xs font-medium">
          <span>${this.ctrl.escapeHtml(p)}</span>
          <button type="button" onclick="app.removerPrioridadeConfig('${this.ctrl.escapeAttrJs(p)}')" class="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer transition" title="Remover ${this.ctrl.escapeAttrJs(p)}">
            <i class="fa-solid fa-xmark text-[10px]"></i>
          </button>
        </span>
      `).join('');
    }
  }

  adicionarAnoConfig() {
    const input = document.getElementById('inputNovoAnoConfig');
    if (!input) return;
    const valor = parseInt(input.value, 10);
    if (isNaN(valor) || valor < 2000 || valor > 2099) {
      this.ctrl.exibirToast('Informe um ano válido (ex: 2027).', 'erro');
      return;
    }
    if (!this.ctrl.configuracoes.anosRoadmap) this.ctrl.configuracoes.anosRoadmap = [];
    if (this.ctrl.configuracoes.anosRoadmap.includes(valor)) {
      this.ctrl.exibirToast('Este ano já está cadastrado.', 'info');
      return;
    }
    this.ctrl.configuracoes.anosRoadmap.push(valor);
    this.ctrl.configuracoes.anosRoadmap.sort((a, b) => a - b);
    input.value = '';
    this.renderizarTagsConfiguracao();
    this.ctrl.popularDropdownHorizonteAnos();
  }

  removerAnoConfig(ano) {
    ano = Number(ano);
    if (!this.ctrl.configuracoes.anosRoadmap || this.ctrl.configuracoes.anosRoadmap.length <= 1) {
      this.ctrl.exibirToast('Mantenha pelo menos um ano configurado para o Roadmap.', 'erro');
      return;
    }
    this.ctrl.configuracoes.anosRoadmap = this.ctrl.configuracoes.anosRoadmap.filter(a => a !== ano);
    if (this.ctrl.roadmapComponent) {
      this.ctrl.roadmapComponent.roadmapAnosSelecionados = this.ctrl.roadmapComponent.roadmapAnosSelecionados.filter(a => a !== ano);
      if (this.ctrl.roadmapComponent.roadmapAnosSelecionados.length === 0) {
        this.ctrl.roadmapComponent.roadmapAnosSelecionados = [this.ctrl.configuracoes.anosRoadmap[0]];
      }
    }
    this.renderizarTagsConfiguracao();
    this.ctrl.popularDropdownHorizonteAnos();
    this.ctrl.atualizarGradeTemporalRoadmap();
    this.ctrl.renderizarRoadmap();
  }

  renomearStatusConfig(idx, novoNome) {
    novoNome = this.ctrl.normalizarStatus(novoNome.trim());
    if (!novoNome) return this.renderizarTagsConfiguracao();
    const nomeAntigo = this.ctrl.configuracoes.statusList[idx];
    if (nomeAntigo === novoNome) return;
    this.ctrl.configuracoes.statusList[idx] = novoNome;
    this.ctrl.bancoDados.forEach(item => {
      if (this.ctrl.normalizarStatus(item.status) === this.ctrl.normalizarStatus(nomeAntigo)) {
        item.status = novoNome;
      }
    });
    if (this.ctrl.statusFiltroPainelAtivo === nomeAntigo) this.ctrl.statusFiltroPainelAtivo = novoNome;
    this.renderizarTagsConfiguracao();
    this.ctrl.atualizarListasDeFiltro();
    this.ctrl.aplicarFiltros(false);
    this.ctrl.atualizarPainelExecutivo();
  }

  moverStatus(index, direcao) {
    const novoIndex = index + direcao;
    if (novoIndex < 0 || novoIndex >= this.ctrl.configuracoes.statusList.length) return;
    const item = this.ctrl.configuracoes.statusList.splice(index, 1)[0];
    this.ctrl.configuracoes.statusList.splice(novoIndex, 0, item);
    this.renderizarTagsConfiguracao();
  }

  adicionarStatusConfig() {
    const input = document.getElementById('inputNovoStatus');
    if (!input) return;
    const valor = this.ctrl.normalizarStatus(input.value.trim());
    if (!valor) return;
    if (!this.ctrl.configuracoes.statusList) this.ctrl.configuracoes.statusList = [];
    if (this.ctrl.configuracoes.statusList.includes(valor)) {
      this.ctrl.exibirToast('Este status já está cadastrado.', 'info');
      return;
    }
    this.ctrl.configuracoes.statusList.push(valor);
    input.value = '';
    this.renderizarTagsConfiguracao();
  }

  removerStatusConfig(nomeStatus) {
    if (this.ctrl.configuracoes.statusList.length <= 1) {
      this.ctrl.exibirToast('A planilha precisa de pelo menos um status.', 'erro');
      return;
    }
    this.ctrl.configuracoes.statusList = this.ctrl.configuracoes.statusList.filter(s => s !== nomeStatus);
    this.renderizarTagsConfiguracao();
  }

  adicionarPrioridadeConfig() {
    const input = document.getElementById('inputNovaPrioridade');
    if (!input) return;
    const valor = input.value.trim();
    if (!valor) return;
    if (!this.ctrl.configuracoes.prioridades) this.ctrl.configuracoes.prioridades = [];
    if (this.ctrl.configuracoes.prioridades.some(p => p.toLowerCase() === valor.toLowerCase())) {
      this.ctrl.exibirToast('Esta prioridade já está cadastrada.', 'info');
      return;
    }
    this.ctrl.configuracoes.prioridades.push(valor);
    input.value = '';
    this.renderizarTagsConfiguracao();
    this.ctrl.atualizarListasDeFiltro();
    this.ctrl.renderizarRoadmap();
    this.ctrl.salvarNoLocalStorage();
    this.ctrl.exibirToast(`Prioridade "${valor}" adicionada!`, 'sucesso');
  }

  removerPrioridadeConfig(nomePrioridade) {
    if (this.ctrl.configuracoes.prioridades.length <= 1) {
      this.ctrl.exibirToast('Mantenha pelo menos uma prioridade cadastrada.', 'erro');
      return;
    }
    this.ctrl.configuracoes.prioridades = this.ctrl.configuracoes.prioridades.filter(p => p !== nomePrioridade);
    this.renderizarTagsConfiguracao();
    this.ctrl.atualizarListasDeFiltro();
    this.ctrl.renderizarRoadmap();
    this.ctrl.salvarNoLocalStorage();
    this.ctrl.exibirToast('Prioridade removida!', 'info');
  }

  moverEtapa(index, direcao) {
    const novoIndex = index + direcao;
    if (novoIndex < 0 || novoIndex >= this.ctrl.configuracoes.etapas.length) return;
    const item = this.ctrl.configuracoes.etapas.splice(index, 1)[0];
    this.ctrl.configuracoes.etapas.splice(novoIndex, 0, item);
    const chkAuto = document.getElementById('chkPesosAutomaticos');
    if (chkAuto && chkAuto.checked) {
      this.distribuirPesosEtapas(false);
    } else {
      this.renderizarTagsConfiguracao();
    }
  }

  removerEtapaConfig(nomeEtapa) {
    if (this.ctrl.configuracoes.etapas.length <= 1) {
      this.ctrl.exibirToast('A planilha precisa de pelo menos uma etapa.', 'erro');
      return;
    }
    this.ctrl.configuracoes.etapas = this.ctrl.configuracoes.etapas.filter(e => e.nome !== nomeEtapa);
    const chkAuto = document.getElementById('chkPesosAutomaticos');
    if (chkAuto && chkAuto.checked) {
      this.distribuirPesosEtapas(false);
    } else {
      this.renderizarTagsConfiguracao();
    }
  }

  adicionarEtapaConfig() {
    const input = document.getElementById('inputNovaEtapa');
    const inputPeso = document.getElementById('inputNovoPesoEtapa');
    const chkAuto = document.getElementById('chkPesosAutomaticos');
    if (!input) return;
    const valor = input.value.trim();
    if (!valor) return;
    if (this.ctrl.configuracoes.etapas.some(e => e.nome.toLowerCase() === valor.toLowerCase())) {
      this.ctrl.exibirToast('Esta etapa já está cadastrada.', 'info');
      return;
    }
    const isAuto = chkAuto ? chkAuto.checked : (inputPeso && inputPeso.value.trim() === '');
    let pesoManual = Math.min(100, Math.max(0, parseInt(inputPeso?.value, 10) || 0));
    this.ctrl.configuracoes.etapas.push({ nome: valor, peso: isAuto ? 0 : pesoManual });
    input.value = '';
    if (inputPeso) inputPeso.value = '50';
    if (isAuto) {
      this.distribuirPesosEtapas(false);
      this.ctrl.exibirToast(`Etapa "${valor}" adicionada e pesos recalculados!`, 'sucesso');
    } else {
      this.renderizarTagsConfiguracao();
      this.ctrl.exibirToast(`Etapa "${valor}" adicionada com peso manual (${pesoManual}%)!`, 'sucesso');
    }
  }

  atualizarPesoEtapa(nomeEtapa, novoPeso) {
    const item = this.ctrl.configuracoes.etapas.find(e => e.nome === nomeEtapa);
    if (item) {
      item.peso = Math.min(100, Math.max(0, parseInt(novoPeso, 10) || 0));
      const chkAuto = document.getElementById('chkPesosAutomaticos');
      if (chkAuto) chkAuto.checked = false;
    }
  }

  distribuirPesosEtapas(notificar = true) {
    const etapas = this.ctrl.configuracoes.etapas;
    const total = etapas.length;
    if (total === 0) return;
    if (total === 1) {
      etapas[0].peso = 100;
    } else {
      etapas.forEach((etapa, idx) => {
        etapa.peso = Math.round((idx / (total - 1)) * 100);
      });
    }
    this.renderizarTagsConfiguracao();
    if (notificar) {
      this.ctrl.exibirToast('Pesos das etapas recalculados automaticamente (0% a 100%)!', 'sucesso');
    }
  }

  adicionarCadeiaValorConfig() {
    const input = document.getElementById('inputNovaCadeiaValor');
    if (!input) return;
    const valor = input.value.trim();
    if (!this.ctrl.configuracoes.listaCadeiaValor) this.ctrl.configuracoes.listaCadeiaValor = [];
    if (!valor) return;
    if (this.ctrl.configuracoes.listaCadeiaValor.some(item => item.toLowerCase() === valor.toLowerCase())) {
      this.ctrl.exibirToast('Esta cadeia de valor já está cadastrada.', 'info');
      return;
    }
    this.ctrl.configuracoes.listaCadeiaValor.push(valor);
    input.value = '';
    this.renderizarTagsConfiguracao();
    this.ctrl.atualizarListasDeFiltro();
    this.ctrl.salvarNoLocalStorage();
  }

  removerCadeiaValorConfig(identificador) {
    if (!this.ctrl.configuracoes.listaCadeiaValor || this.ctrl.configuracoes.listaCadeiaValor.length <= 1) {
      this.ctrl.exibirToast('Mantenha pelo menos uma cadeia de valor cadastrada.', 'info');
      return;
    }
    if (typeof identificador === 'number') {
      this.ctrl.configuracoes.listaCadeiaValor.splice(identificador, 1);
    } else {
      const termo = String(identificador).trim().toLowerCase();
      this.ctrl.configuracoes.listaCadeiaValor = this.ctrl.configuracoes.listaCadeiaValor.filter(
        item => String(item).trim().toLowerCase() !== termo
      );
    }
    this.renderizarTagsConfiguracao();
    this.ctrl.atualizarListasDeFiltro();
    this.ctrl.salvarNoLocalStorage();
  }

  adicionarCadeiaConfig() {
    const input = document.getElementById('inputNovaCadeia');
    if (!input) return;
    const valor = input.value.trim();
    if (!valor || this.ctrl.configuracoes.cadeiasValor.includes(valor)) return;
    this.ctrl.configuracoes.cadeiasValor.push(valor);
    input.value = '';
    this.renderizarTagsConfiguracao();
  }

  removerCadeiaConfig(c) {
    if (this.ctrl.configuracoes.cadeiasValor.length <= 1) return;
    this.ctrl.configuracoes.cadeiasValor = this.ctrl.configuracoes.cadeiasValor.filter(item => item !== c);
    this.renderizarTagsConfiguracao();
  }

  adicionarEquipeConfig() {
    const input = document.getElementById('inputNovaEquipe');
    if (!input) return;
    const valor = input.value.trim();
    if (!valor || this.ctrl.configuracoes.equipes.includes(valor)) return;
    this.ctrl.configuracoes.equipes.push(valor);
    input.value = '';
    this.renderizarTagsConfiguracao();
  }

  removerEquipeConfig(eq) {
    if (this.ctrl.configuracoes.equipes.length <= 1) return;
    this.ctrl.configuracoes.equipes = this.ctrl.configuracoes.equipes.filter(item => item !== eq);
    this.renderizarTagsConfiguracao();
  }

  async salvarConfiguracoesForm() {
    const elOrg = document.getElementById('cfgOrganizacao');
    const elCiclo = document.getElementById('cfgCiclo');
    this.ctrl.configuracoes.organizacao = elOrg ? elOrg.value.trim() || 'Prioridades dos Projetos BRG' : 'Prioridades dos Projetos BRG';
    this.ctrl.configuracoes.ciclo = elCiclo ? elCiclo.value.trim() || 'Ciclo Q4 2026' : 'Ciclo Q4 2026';

  
    this.ctrl.normalizarEtapasConfiguracao();
    this.ctrl.atualizarListasDeFiltro();

    const chkSincronizar = document.getElementById('chkSincronizarAtividades');
    const deveSincronizar = chkSincronizar ? chkSincronizar.checked : true;
    if (deveSincronizar) {
      this.ctrl.recalcularProgressoTodasAtividades(false);
    }

    // Atualiza textos de cabeçalho imediatamente na UI
    this.ctrl._setText('lblHeaderTitulo', this.ctrl.configuracoes.organizacao);
    this.ctrl._setText('lblSubheaderCiclo', this.ctrl.configuracoes.ciclo);

    this.fecharModalConfiguracoes();
    this.ctrl.atualizarPainelExecutivo();

    // Grava diretamente no Firebase (sem depender de autoSaveToggle e sem chamar salvarNoLocalStorage)
    await this.ctrl.salvarNoExcel(false, null, 'config');
    this.ctrl.exibirToast('Configurações salvas e sincronizadas com o Firebase!', 'sucesso');
  }

  // ================= MODAL DETALHES & FILTROS DE ETAPAS =================
  abrirModalDetalhesId(id) {
    const idNormalizado = window.DataUtils ? window.DataUtils.normalizarId(id) : String(id).trim();
    const item = this.ctrl.bancoDados.find(x => (window.DataUtils ? window.DataUtils.normalizarId(x.id) : String(x.id).trim()) === idNormalizado);
    if (!item) return;
    this.ctrl.recalcularProgressoItem(item);
    this.detalheItemAtual = item;
    this.ctrl._setText('detalheBadgeIdHeader', item.id);
    this.ctrl._setText('detalheTitulo', item.titulo);
    this.ctrl._setText('detalheMacroCadeiaValor', item.macroCadeiaValor || '--');
    this.ctrl._setText('detalheCadeiaValor', item.cadeiaValor);
    this.ctrl._setText('detalheEquipe', item.equipe);
    this.ctrl._setText('detalheStatus', this.ctrl.normalizarStatus(item.status));
    this.ctrl._setText('detalheResponsavel', item.responsavel);
    this.ctrl._setText('detalhePrazoInicio', this.ctrl.formatarMesAno(item.prazoInicio || (item.etapaInicio ? item.etapaInicio.substring(0, 7) : '')));
    this.ctrl._setText('detalhePrazo', this.ctrl.formatarMesAno(item.prazo));
    this.ctrl._setText('detalheConclusao', item.conclusao ? this.ctrl.formatarMesAno(item.conclusao) : 'Não concluído');
    this.ctrl._setText('detalheLiderProtheus', item.liderTechProtheus || 'Não informado');
    this.ctrl._setText('detalheLiderWebtrade', item.liderTechWebtrade || 'Não informado');
    this.ctrl._setText('detalheDesenvolvedor', item.desenvolvedor || 'Não informado');
    const badgePrioHeader = document.getElementById('detalhePrioridadeBadgeHeader');
    if (badgePrioHeader) badgePrioHeader.innerHTML = this.ctrl.gerarBadgePrioridade(item.prioridade);

    const etapas = (item.etapasCiclo && Array.isArray(item.etapasCiclo) && item.etapasCiclo.length > 0)
      ? JSON.parse(JSON.stringify(item.etapasCiclo))
      : [{
          id: 1,
          titulo: '',
          nome: item.etapa || 'Dev',
          prioridade: '',
          dataInicio: item.dataInicio || item.etapaInicio || '',
          dataProgramada: item.etapaInicio,
          dataEntrega: item.etapaFim,
          concluida: Boolean(item.etapaFim || item.status === 'Concluído'),
          obs: item.etapaObs
        }];
    this.etapasDetalhesOriginais = etapas;

    const inputBusca = document.getElementById('filtroBuscaEtapaDetalhes');
    const selPrio = document.getElementById('filtroPrioridadeEtapaDetalhes');
    const selFase = document.getElementById('filtroFaseEtapaDetalhes') || document.getElementById('filtroStatusEtapaDetalhes');
    if (inputBusca) inputBusca.value = '';
    if (selPrio) selPrio.value = '';

    if (selFase) {
      const fasesConfig = (this.ctrl.configuracoes.etapas || []).map(e => typeof e === 'string' ? e : e.nome);
      const fasesDaAtividade = etapas.map(e => e.nome).filter(Boolean);
      const todasFases = [...new Set([...fasesConfig, ...fasesDaAtividade])];
      selFase.innerHTML = '<option value="">Todas as Fases</option>' +
        todasFases.map(fase => `<option value="${this.ctrl.escapeHtml(fase)}">${this.ctrl.escapeHtml(fase)}</option>`).join('');
      selFase.value = '';
    }
    this.renderizarEtapasDetalheModal();
    const prog = Math.min(100, Math.max(0, parseInt(item.progresso, 10) || 0));
    this.ctrl._setText('detalheProgressoPct', `${prog}%`);
    const barraProg = document.getElementById('detalheProgressoBarra');
    if (barraProg) barraProg.style.width = `${prog}%`;
    const btnEditar = document.getElementById('btnEditarPeloDetalhe');
    if (btnEditar) {
      btnEditar.onclick = () => {
        this.fecharModalDetalhesId();
        this.abrirModalEdicao(item.id);
      };
    }
    document.getElementById('modalDetalhesId')?.classList.remove('hidden');
  }

  fecharModalDetalhesId() {
    this.detalheItemAtual = null;
    this.etapasDetalhesOriginais = [];
    document.getElementById('modalDetalhesId')?.classList.add('hidden');
  }

  // ================= MODAL DE EDIÇÃO RÁPIDA DE ETAPA INDIVIDUAL =================
  fecharModalEdicaoEtapaIndividual() {
    const modal = document.getElementById('modalEdicaoEtapaIndividual');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  aoAlternarConclusaoModalEtapaRapida(checado) {
    const inputEntrega = document.getElementById('editEtapaDataEntrega');
    if (inputEntrega) {
      if (checado && !inputEntrega.value) {
        inputEntrega.value = window.DataUtils ? window.DataUtils.obterDataHojeISO() : new Date().toISOString().slice(0, 10);
      } else if (!checado && inputEntrega.value) {
        inputEntrega.value = '';
      }
    }
  }

  // ================= MODAL DE EDIÇÃO RÁPIDA DE ETAPA INDIVIDUAL =================
  popularSelectAtividadesDependencia(selectEl, atividadeIdAtual, idSelecionado) {
    if (!selectEl) return;
    const banco = this.ctrl.bancoDados || [];
    let html = '<option value="">Selecione a atividade...</option>';
    const idSelNorm = String(idSelecionado || '').trim();
    banco.forEach(it => {
      const itIdNorm = String(it.id).trim();
      const eMesma = itIdNorm === String(atividadeIdAtual).trim();
      const rotulo = `#${it.id} - ${it.titulo}${eMesma ? ' (Esta atividade)' : ''}`;
      const selected = itIdNorm === idSelNorm ? 'selected' : '';
      html += `<option value="${this.ctrl.escapeAttrJs(it.id)}" ${selected}>${this.ctrl.escapeHtml(rotulo)}</option>`;
    });
    selectEl.innerHTML = html;
    if (idSelNorm) {
      selectEl.value = idSelNorm;
    }
  }

  popularSelectEtapasDependencia(selectEl, atividadeAlvoId, etapaIndexAtual, nomeSelecionado = '') {
    if (!selectEl) return;
    const idLimpo = String(atividadeAlvoId || '').trim();
    if (!idLimpo) {
      selectEl.innerHTML = '<option value="">Selecione uma atividade antes...</option>';
      return;
    }
    const itemAlvo = (this.ctrl.bancoDados || []).find(x => String(x.id).trim() === idLimpo);
    if (!itemAlvo) {
      selectEl.innerHTML = '<option value="">Atividade não localizada</option>';
      return;
    }
    const ativIdModalAtual = String(document.getElementById('editEtapaAtividadeId')?.value || '').trim();
    const idxAtualNum = parseInt(etapaIndexAtual !== undefined && etapaIndexAtual !== null ? etapaIndexAtual : document.getElementById('editEtapaIndex')?.value, 10);
    const etapas = (itemAlvo.etapasCiclo && Array.isArray(itemAlvo.etapasCiclo) && itemAlvo.etapasCiclo.length > 0)
      ? itemAlvo.etapasCiclo
      : [{ nome: itemAlvo.etapa || 'Dev', titulo: itemAlvo.titulo || 'Etapa Principal' }];

    let html = '<option value="">Selecione a etapa...</option>';
    let etapasValidasCount = 0;
    const selNorm = String(nomeSelecionado || '').trim().toLowerCase();

    etapas.forEach((et, idx) => {
      const isMesmaEtapa = (idLimpo === ativIdModalAtual) && (idx === idxAtualNum);
      if (isMesmaEtapa) return;
      etapasValidasCount++;
      const nomeEtapa = et.nome || `Etapa ${idx + 1}`;
      const rotulo = `${idx + 1}. ${nomeEtapa}${et.titulo ? ' — ' + et.titulo : ''}`;
      
      // Valor padronizado: usa o nome da fase ou fallback do índice/título
      const valorOpcao = String(et.nome || et.titulo || idx + 1).trim();
      const isSelected = selNorm !== '' && (
        String(et.nome || '').trim().toLowerCase() === selNorm ||
        String(et.titulo || '').trim().toLowerCase() === selNorm ||
        valorOpcao.toLowerCase() === selNorm
      );

      html += `<option value="${this.ctrl.escapeAttrJs(valorOpcao)}" ${isSelected ? 'selected' : ''}>${this.ctrl.escapeHtml(rotulo)}</option>`;
    });

    if (etapasValidasCount === 0) {
      selectEl.innerHTML = '<option value="">Nenhuma outra etapa disponível nesta demanda</option>';
    } else {
      selectEl.innerHTML = html;
      if (nomeSelecionado) {
        selectEl.value = nomeSelecionado;
      }
    }
  }

  aoMudarTipoDependenciaModalRapida(tipo) {
    const box = document.getElementById('boxCamposVinculoDependencia');
    if (!box) return;
    const tipoLimpo = String(tipo || '').trim();
    if (tipoLimpo !== '') {
      box.classList.remove('hidden');
      box.classList.add('flex');
      const selAtiv = document.getElementById('editEtapaDepAtividadeId');
      const selEtapa = document.getElementById('editEtapaDepEtapaNome');
      const ativId = document.getElementById('editEtapaAtividadeId')?.value || '';
      
      if (selAtiv) {
        const valAtual = selAtiv.value || ativId;
        this.popularSelectAtividadesDependencia(selAtiv, ativId, valAtual);
        this.popularSelectEtapasDependencia(selEtapa, selAtiv.value || valAtual, document.getElementById('editEtapaIndex')?.value, '');
      }
    } else {
      box.classList.add('hidden');
      box.classList.remove('flex');
      const selAtiv = document.getElementById('editEtapaDepAtividadeId');
      const selEtapa = document.getElementById('editEtapaDepEtapaNome');
      if (selAtiv) selAtiv.value = '';
      if (selEtapa) selEtapa.innerHTML = '';
    }
  }

  aoMudarAtividadeDependenciaModalRapida(atividadeAlvoId) {
    const selEtapa = document.getElementById('editEtapaDepEtapaNome');
    const idxCampo = document.getElementById('editEtapaIndex')?.value;
    const etapaIndex = parseInt(idxCampo, 10);
    this.popularSelectEtapasDependencia(selEtapa, atividadeAlvoId, isNaN(etapaIndex) ? -1 : etapaIndex, '');
  }

  // ================= ABERTURA E SALVAMENTO DA ETAPA INDIVIDUAL =================

  abrirModalEdicaoEtapaIndividual(atividadeId, etapaIndex) {
    const idBusca = String(atividadeId || '').trim();
    const item = (this.ctrl.bancoDados || []).find(x => String(x.id).trim() === idBusca);
    if (!item) {
      console.error(`Atividade #${idBusca} não encontrada.`);
      return;
    }

    const etapas = (item.etapasCiclo && Array.isArray(item.etapasCiclo)) ? item.etapasCiclo : [];
    const idx = parseInt(etapaIndex, 10);
    const etapa = etapas[idx];
    if (!etapa) {
      console.error(`Etapa índice ${idx} não encontrada na atividade #${idBusca}.`);
      return;
    }

    // Preenche IDs de controle
    this.ctrl._setValue('editEtapaAtividadeId', idBusca);
    this.ctrl._setValue('editEtapaIndex', String(idx));
    
    // Título e Subtítulo
    const lblSub = document.getElementById('subtituloEdicaoEtapaModal');
    if (lblSub) lblSub.innerText = `Demanda #${item.id} — ${item.titulo || ''}`;
    this.ctrl._setValue('editEtapaTitulo', etapa.titulo || '');
    this.ctrl._setValue('editEtapaResponsavel', etapa.responsavel || item.responsavel || '');

    // Popular opções de fases/nomes
    const selNome = document.getElementById('editEtapaNome');
    if (selNome) {
      const fasesConfig = (this.ctrl.configuracoes.etapas || []).map(e => typeof e === 'string' ? e : e.nome);
      const todasFases = [...new Set([...fasesConfig, etapa.nome].filter(Boolean))];
      selNome.innerHTML = todasFases.map(fase =>
        `<option value="${this.ctrl.escapeHtml(fase)}" ${String(fase).toLowerCase() === String(etapa.nome || '').toLowerCase() ? 'selected' : ''}>${this.ctrl.escapeHtml(fase)}</option>`
      ).join('');
    }

    // Prioridade da Etapa
    const selPrio = document.getElementById('editEtapaPrioridade');
    if (selPrio) selPrio.value = etapa.prioridade || '';

    // Dependências (Predecessora / Antecessora)
    const depTipo = etapa.dependenciaTipo || '';
    const depAtivId = etapa.dependenciaAtividadeId || '';
    const depEtapaNome = etapa.dependenciaEtapaNome || '';
    
    this.ctrl._setValue('editEtapaDependenciaTipo', depTipo);
    const boxDep = document.getElementById('boxCamposVinculoDependencia');
    const selDepAtiv = document.getElementById('editEtapaDepAtividadeId');
    const selDepEtapa = document.getElementById('editEtapaDepEtapaNome');
    if (depTipo) {
      boxDep?.classList.remove('hidden');
      boxDep?.classList.add('flex');
      const ativAlvoFinal = depAtivId || idBusca;
      if (selDepAtiv) {
        this.popularSelectAtividadesDependencia(selDepAtiv, idBusca, ativAlvoFinal);
      }
      if (selDepEtapa) {
        this.popularSelectEtapasDependencia(selDepEtapa, ativAlvoFinal, idx, depEtapaNome);
      }
    } else {
      boxDep?.classList.add('hidden');
      boxDep?.classList.remove('flex');
      if (selDepAtiv) selDepAtiv.innerHTML = '';
      if (selDepEtapa) selDepEtapa.innerHTML = '';
    }

    // Datas
    const normalizarData = (val) => window.DataUtils ? window.DataUtils.normalizarDataFimMes(val, '') : val;
    this.ctrl._setValue('editEtapaDataInicio', normalizarData(etapa.dataInicio || ''));
    this.ctrl._setValue('editEtapaDataProgramada', normalizarData(etapa.dataProgramada || ''));
    this.ctrl._setValue('editEtapaDataEntrega', normalizarData(etapa.dataEntrega || ''));

    // Checkbox de Conclusão
    const chkConcluida = document.getElementById('editEtapaConcluida');
    const isConcluida = Boolean(etapa.concluida || (etapa.dataEntrega && String(etapa.dataEntrega).trim() !== ''));
    if (chkConcluida) chkConcluida.checked = isConcluida;

    this.ctrl._setValue('editEtapaObs', etapa.obs || '');

    // Exibe a modal (garante remoção da classe hidden)
    const modal = document.getElementById('modalEdicaoEtapaIndividual');
    if (modal) {
      modal.classList.remove('hidden');
    } else {
      console.error('Elemento #modalEdicaoEtapaIndividual não foi localizado no HTML.');
    }
    
    document.getElementById('editEtapaTitulo')?.focus();
  }

  async salvarEdicaoEtapaIndividual(event) {
    event.preventDefault();
    const atividadeId = document.getElementById('editEtapaAtividadeId')?.value.trim();
    const etapaIndex = parseInt(document.getElementById('editEtapaIndex')?.value, 10);

    const idBusca = window.DataUtils ? window.DataUtils.normalizarId(atividadeId) : atividadeId;
    const item = this.ctrl.bancoDados.find(x => (window.DataUtils ? window.DataUtils.normalizarId(x.id) : String(x.id).trim()) === idBusca);
    if (!item || isNaN(etapaIndex) || !item.etapasCiclo || !item.etapasCiclo[etapaIndex]) {
      this.ctrl.exibirToast('Não foi possível identificar a etapa para atualização.', 'erro');
      return;
    }

    const titulo = document.getElementById('editEtapaTitulo')?.value.trim();
    const nome = document.getElementById('editEtapaNome')?.value.trim();
    const prioridade = document.getElementById('editEtapaPrioridade')?.value;
    const responsavel = document.getElementById('editEtapaResponsavel')?.value.trim();

    // Captura dos dados de dependência
    const dependenciaTipo = document.getElementById('editEtapaDependenciaTipo')?.value || '';
    const dependenciaAtividadeId = dependenciaTipo ? (document.getElementById('editEtapaDepAtividadeId')?.value || '').trim() : '';
    const dependenciaEtapaNome = dependenciaTipo ? (document.getElementById('editEtapaDepEtapaNome')?.value || '').trim() : '';

    const normalizarData = (val) => window.DataUtils ? window.DataUtils.normalizarDataFimMes(val, '') : val;
    const dataInicio = normalizarData(document.getElementById('editEtapaDataInicio')?.value || '');
    const dataProgramada = normalizarData(document.getElementById('editEtapaDataProgramada')?.value || '');
    const dataEntrega = normalizarData(document.getElementById('editEtapaDataEntrega')?.value || '');
    const concluida = Boolean(document.getElementById('editEtapaConcluida')?.checked || dataEntrega);
    const obs = document.getElementById('editEtapaObs')?.value.trim() || '';

    // Atualiza a etapa com as dependências
    item.etapasCiclo[etapaIndex] = {
      ...item.etapasCiclo[etapaIndex],
      titulo,
      nome,
      prioridade,
      responsavel,
      dependenciaTipo,
      dependenciaAtividadeId,
      dependenciaEtapaNome,
      dataInicio,
      dataProgramada,
      dataEntrega,
      concluida,
      obs
    };

    // Recalcula o progresso e etapa ativa da atividade principal
    this.ctrl.recalcularProgressoItem(item);

    const todasConcluidas = item.etapasCiclo.every(e => Boolean(e.concluida || (e.dataEntrega && String(e.dataEntrega).trim() !== '')));
    if (todasConcluidas && this.ctrl.normalizarStatus(item.status) !== 'Concluído') {
      item.status = 'Concluído';
      item.progresso = 100;
    } else if (!todasConcluidas && this.ctrl.normalizarStatus(item.status) === 'Concluído') {
      item.status = 'Em Andamento';
    }

    this.fecharModalEdicaoEtapaIndividual();
    this.ctrl.aplicarFiltros(false);
    this.ctrl.atualizarPainelExecutivo();
    this.ctrl.renderizarRoadmap();
    this.ctrl.exibirToast(`Etapa "${nome}" atualizada com sucesso!`, 'sucesso');

    if (this.detalheItemAtual && String(this.detalheItemAtual.id).trim() === String(item.id).trim()) {
      this.etapasDetalhesOriginais = JSON.parse(JSON.stringify(item.etapasCiclo));
      this.renderizarEtapasDetalheModal();
    }

    await this.ctrl.salvarNoExcel(false, item.id, 'upsert');
    }

  filtrarEtapasDetalheModal() {
    this.renderizarEtapasDetalheModal();
  }

  // ================= SUPORTE A DEPENDÊNCIAS NO MODAL GERAL =================
  aoAlterarTipoDependenciaEtapaForm(index, tipo) {
    if (!this.etapasFormAtual[index]) return;
    this.etapasFormAtual[index].dependenciaTipo = tipo;
    if (!tipo) {
      this.etapasFormAtual[index].dependenciaAtividadeId = '';
      this.etapasFormAtual[index].dependenciaEtapaNome = '';
    } else if (!this.etapasFormAtual[index].dependenciaAtividadeId) {
      const ativIdAtual = document.getElementById('inputId')?.value || '';
      this.etapasFormAtual[index].dependenciaAtividadeId = ativIdAtual;
    }
    this.renderizarEtapasForm();
    this.salvarRascunhoForm();
  }

  aoAlterarAtividadeDependenciaEtapaForm(index, atividadeId) {
    if (!this.etapasFormAtual[index]) return;
    this.etapasFormAtual[index].dependenciaAtividadeId = atividadeId;
    this.etapasFormAtual[index].dependenciaEtapaNome = '';
    this.renderizarEtapasForm();
    this.salvarRascunhoForm();
  }

  aoAlterarEtapaDependenciaEtapaForm(index, etapaNome) {
    if (!this.etapasFormAtual[index]) return;
    this.etapasFormAtual[index].dependenciaEtapaNome = etapaNome;
    this.salvarRascunhoForm();
  }

  limparFiltrosEtapasDetalhe() {
    const inputBusca = document.getElementById('filtroBuscaEtapaDetalhes');
    const selPrio = document.getElementById('filtroPrioridadeEtapaDetalhes');
    const selFase = document.getElementById('filtroFaseEtapaDetalhes') || document.getElementById('filtroStatusEtapaDetalhes');
    if (inputBusca) inputBusca.value = '';
    if (selPrio) selPrio.value = '';
    if (selFase) selFase.value = '';
    this.renderizarEtapasDetalheModal();
  }

  renderizarEtapasDetalheModal() {
    if (!this.etapasDetalhesOriginais || !this.detalheItemAtual) return;
    const termo = (document.getElementById('filtroBuscaEtapaDetalhes')?.value || '').toLowerCase().trim();
    const filtroPrio = (document.getElementById('filtroPrioridadeEtapaDetalhes')?.value || '').trim();
    const filtroFase = (document.getElementById('filtroFaseEtapaDetalhes')?.value || document.getElementById('filtroStatusEtapaDetalhes')?.value || '').trim().toLowerCase();
    const temFiltroAtivo = Boolean(termo || filtroPrio || filtroFase);
    const btnLimpar = document.getElementById('btnLimparFiltrosEtapaDetalhes');
    if (btnLimpar) {
      btnLimpar.classList.toggle('hidden', !temFiltroAtivo);
      btnLimpar.classList.toggle('inline-flex', temFiltroAtivo);
    }

    const etapasFiltradas = this.etapasDetalhesOriginais.filter((etapa) => {
      const prioridadeEtapa = String(etapa.prioridade || '').trim();
      const nomeEtapa = String(etapa.nome || '').trim().toLowerCase();
      if (filtroFase && nomeEtapa !== filtroFase) return false;
      if (filtroPrio) {
        if (filtroPrio === 'CRITICAS') {
          const isCritica = prioridadeEtapa.includes('P0') || prioridadeEtapa.includes('P1');
          if (!isCritica) return false;
        } else if (filtroPrio === 'SEM_PRIORIDADE') {
          if (prioridadeEtapa !== '') return false;
        } else {
          const codigoPrio = filtroPrio.split(' ')[0];
          if (!prioridadeEtapa.includes(codigoPrio) && prioridadeEtapa.toLowerCase() !== filtroPrio.toLowerCase()) {
            return false;
          }
        }
      }
      if (termo) {
        const nomeStr = String(etapa.nome || '').toLowerCase();
        const tituloStr = String(etapa.titulo || '').toLowerCase();
        const obsStr = String(etapa.obs || '').toLowerCase();
        const prioStr = prioridadeEtapa.toLowerCase();
        const bateu = nomeStr.includes(termo) || tituloStr.includes(termo) || obsStr.includes(termo) || prioStr.includes(termo);
        if (!bateu) return false;
      }
      return true;
    });

    const totalOriginais = this.etapasDetalhesOriginais.length;
    const criticasOriginais = this.etapasDetalhesOriginais.filter(e => e.prioridade && (e.prioridade.includes('P0') || e.prioridade.includes('P1'))).length;
    const badgeEl = document.getElementById('detalheTotalEtapasBadge');
    if (badgeEl) {
      if (temFiltroAtivo) {
        const criticasFiltradas = etapasFiltradas.filter(e => e.prioridade && (e.prioridade.includes('P0') || e.prioridade.includes('P1'))).length;
        badgeEl.innerHTML = `${etapasFiltradas.length} de ${totalOriginais} etapas` + (criticasFiltradas > 0 ? ` <span class="text-rose-600 font-bold">(${criticasFiltradas} críticas)</span>` : '');
      } else {
        badgeEl.innerHTML = `${totalOriginais} ${totalOriginais === 1 ? 'etapa' : 'etapas'}` + (criticasOriginais > 0 ? ` <span class="text-rose-600 font-bold">(${criticasOriginais} críticas)</span>` : '');
      }
    }

    const containerLista = document.getElementById('detalhesEtapasListaContainer')
      || document.getElementById('containerDetalhesEtapas')
      || document.getElementById('detalheEtapasLista');
    if (!containerLista) return;

    if (etapasFiltradas.length === 0) {
      containerLista.innerHTML = `
        <div class="py-8 flex flex-col items-center justify-center text-center space-y-2 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
          <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center text-sm shadow-2xs">
            <i class="fa-solid fa-filter-circle-xmark"></i>
          </div>
          <div>
            <h5 class="text-xs font-semibold text-slate-800">Nenhuma etapa encontrada</h5>
            <p class="text-[11px] text-slate-500 max-w-xs mt-0.5">Nenhuma etapa corresponde à fase e prioridade selecionadas.</p>
          </div>
          <button
            type="button"
            onclick="app.limparFiltrosEtapasDetalhe()"
            class="px-2.5 py-1 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-semibold transition active:scale-95 shadow-2xs"
          >
            <i class="fa-solid fa-rotate-left text-[10px] mr-1"></i> Limpar filtros das etapas
          </button>
        </div>
      `;
      return;
    }

    const htmlEtapas = etapasFiltradas.map((etapa) => {
      const idxReal = this.etapasDetalhesOriginais.indexOf(etapa);
      const numeroExibicao = idxReal !== -1 ? idxReal + 1 : 1;
      const peso = this.ctrl.obterPesoDaEtapa(etapa.nome);
      const estiloEtapa = this.ctrl.obterEstiloEtapa(etapa.nome);
      const isConcluida = Boolean(etapa.concluida || (etapa.dataEntrega && String(etapa.dataEntrega).trim() !== ''));
      const temTitulo = Boolean(etapa.titulo && String(etapa.titulo).trim() !== '');
      const prioridadeEtapa = etapa.prioridade || '';
      const isCritica = prioridadeEtapa.includes('P0') || prioridadeEtapa.includes('P1');
      const prioridadeBadgeEtapa = prioridadeEtapa
        ? this.ctrl.gerarBadgePrioridade(prioridadeEtapa)
        : '<span class="inline-flex items-center gap-1 bg-slate-100 text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-normal whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span>Sem prioridade</span>';
      const statusBadge = isConcluida
        ? '<span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0"><i class="fa-solid fa-check text-[8px]"></i> Concluída</span>'
        : '<span class="text-[10px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0"><span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Pendente</span>';
      const tagCritica = isCritica
        ? '<span class="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0"><span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>Etapa Crítica</span>'
        : '';
      const obsFormatada = (etapa.obs && etapa.obs.trim())
        ? `<div class="bg-white/90 border border-slate-200/70 rounded-lg p-2.5 text-[11px] mt-2">
             <span class="font-semibold text-slate-500 text-[10px] uppercase tracking-wider block mb-1">Observações da etapa:</span>
             <div class="text-slate-700 leading-relaxed whitespace-pre-line break-words">${this.ctrl.escapeHtml(etapa.obs.trim())}</div>
           </div>`
        : '';
      const dataInicioStr = etapa.dataInicio ? this.ctrl.formatarDataBR(etapa.dataInicio) : '--';
      const dataProgStr = etapa.dataProgramada ? this.ctrl.formatarDataBR(etapa.dataProgramada) : '--';
      const dataEntregaStr = etapa.dataEntrega ? this.ctrl.formatarDataBR(etapa.dataEntrega) : (isConcluida ? 'Concluída' : '--');
      const cardClasses = isCritica
        ? 'border-rose-300/80 bg-rose-50/20 ring-1 ring-rose-200/60'
        : (isConcluida ? 'border-emerald-200/90 bg-emerald-50/20' : 'border-slate-200 bg-slate-50/60');
      const numeroClasses = isCritica
        ? 'bg-rose-600 text-white'
        : (isConcluida ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white');

      return `
        <div class="border ${cardClasses} rounded-xl p-3 space-y-2 transition shadow-2xs">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100/80 pb-2">
            <div class="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
              <span class="w-5 h-5 rounded-md ${numeroClasses} text-[10px] font-bold flex items-center justify-center shrink-0">
                ${numeroExibicao}
              </span>
              <span class="px-2 py-0.5 rounded font-semibold text-[10px] border ${estiloEtapa} whitespace-nowrap shrink-0">
                ${this.ctrl.escapeHtml(etapa.nome)} (${peso}%)
              </span>
              ${prioridadeBadgeEtapa}
              ${tagCritica}
              ${temTitulo ? `<span class="font-semibold text-slate-900 text-xs truncate max-w-xs" title="${this.ctrl.escapeHtml(etapa.titulo)}">${this.ctrl.escapeHtml(etapa.titulo)}</span>` : ''}
            </div>
            <div class="shrink-0 flex items-center gap-1.5">
              ${statusBadge}
            </div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5 text-xs">
            <div class="bg-white/80 p-2 rounded-lg border border-slate-200/60">
              <div class="text-[10px] text-slate-400 font-medium mb-0.5">Responsável</div>
              <div class="text-xs font-semibold text-slate-800 truncate">${this.ctrl.escapeHtml(etapa.responsavel || '--')}</div>
            </div>
            <div class="bg-white/80 p-2 rounded-lg border border-slate-200/60">
              <div class="text-[10px] text-slate-400 font-medium mb-0.5">Data Início</div>
              <div class="font-mono text-xs font-semibold text-slate-800">${dataInicioStr}</div>
            </div>
            <div class="bg-white/80 p-2 rounded-lg border border-slate-200/60">
              <div class="text-[10px] text-slate-400 font-medium mb-0.5">Data Programada</div>
              <div class="font-mono text-xs font-semibold text-slate-800">${dataProgStr}</div>
            </div>
            <div class="bg-white/80 p-2 rounded-lg border border-slate-200/60">
              <div class="text-[10px] text-slate-400 font-medium mb-0.5">Data de Entrega</div>
              <div class="font-mono text-xs font-semibold ${isConcluida ? 'text-emerald-700' : 'text-slate-800'}">${dataEntregaStr}</div>
            </div>
          </div>
          ${obsFormatada}
        </div>
      `;
    }).join('');
    containerLista.innerHTML = htmlEtapas;
  }

  // ================= FORMULÁRIO DE ATIVIDADES =================
  atualizarEstadoBotaoProximaEtapa() {
    const btnTopo = document.getElementById('btnAdicionarProximaEtapa');
    const btnFixo = document.getElementById('btnAdicionarProximaEtapaFixo');
    const alerta = document.getElementById('alertaBloqueioProximaEtapa');

    const totalEtapas = this.etapasFormAtual.length;
    const ultimaEtapa = this.etapasFormAtual[totalEtapas - 1];
    const temTitulo = Boolean(ultimaEtapa && ultimaEtapa.titulo && String(ultimaEtapa.titulo).trim() !== '');
    const podeAdicionarProxima = Boolean(ultimaEtapa && (ultimaEtapa.concluida || temTitulo));
    if (btnTopo) {
      btnTopo.disabled = !podeAdicionarProxima;
      btnTopo.className = podeAdicionarProxima
        ? 'px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer'
        : 'px-3 py-1.5 rounded-lg bg-slate-200 text-slate-400 font-medium text-[11px] transition flex items-center gap-1.5 cursor-not-allowed';
    }
    if (btnFixo) {
      btnFixo.disabled = !podeAdicionarProxima;
      btnFixo.className = podeAdicionarProxima
        ? 'px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-semibold text-xs transition flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer'
        : 'px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-medium text-xs transition flex items-center gap-1.5 cursor-not-allowed';
    }
    alerta?.classList.toggle('hidden', podeAdicionarProxima || totalEtapas === 0);
  }

  renderizarEtapasForm() {
    const container = document.getElementById('containerEtapasSequenciais');
    if (!container) return;
    if (this.etapasFormAtual.length === 0) {
      const primeiraEtapaNome = this.ctrl.configuracoes.etapas[0] ? this.ctrl.configuracoes.etapas[0].nome : 'Dev';
      const hojeISO = window.DataUtils ? window.DataUtils.obterDataHojeISO() : new Date().toISOString().slice(0, 10);
      this.etapasFormAtual.push({
        id: Date.now(),
        titulo: '',
        nome: primeiraEtapaNome,
        prioridade: '',
        responsavel: '',
        dependenciaTipo: '',
        dependenciaAtividadeId: '',
        dependenciaEtapaNome: '',
        dataInicio: hojeISO,
        dataProgramada: hojeISO,
        dataEntrega: '',
        concluida: false,
        obs: ''
      });
    }
    const totalEtapas = this.etapasFormAtual.length;
    this.atualizarEstadoBotaoProximaEtapa();
    container.innerHTML = this.etapasFormAtual.map((et, index) => {
      const prioridadeEtapa = et.prioridade || '';
      const isCritica = prioridadeEtapa.includes('P0') || prioridadeEtapa.includes('P1');
      const optionsHtml = this.ctrl.configuracoes.etapas.map(cfgEt => `
        <option value="${this.ctrl.escapeHtml(cfgEt.nome)}" ${cfgEt.nome === et.nome ? 'selected' : ''}>
          ${this.ctrl.escapeHtml(cfgEt.nome)} (${cfgEt.peso}%)
        </option>
      `).join('');

      const depTipo = et.dependenciaTipo || '';
      const depAtivId = et.dependenciaAtividadeId || '';
      const depEtapaNome = et.dependenciaEtapaNome || '';
      const ativAtualId = document.getElementById('inputId')?.value || '';

      const optionsAtividadesDep = (this.ctrl.bancoDados || []).map(b => `
        <option value="${this.ctrl.escapeAttrJs(b.id)}" ${String(b.id).trim() === String(depAtivId || ativAtualId).trim() ? 'selected' : ''}>
          #${this.ctrl.escapeHtml(b.id)} - ${this.ctrl.escapeHtml(b.titulo)}
        </option>
      `).join('');

      let optionsEtapasDep = '';
      const idAlvo = depAtivId || ativAtualId;
      if (idAlvo) {
        const itemDep = (this.ctrl.bancoDados || []).find(b => String(b.id).trim() === String(idAlvo).trim());
        const etsDep = itemDep?.etapasCiclo && Array.isArray(itemDep.etapasCiclo) ? itemDep.etapasCiclo : [];
        optionsEtapasDep = etsDep.map(eDep => `
          <option value="${this.ctrl.escapeAttrJs(eDep.nome)}" ${eDep.nome === depEtapaNome ? 'selected' : ''}>
            ${this.ctrl.escapeHtml(eDep.nome)}${eDep.titulo ? ' — ' + this.ctrl.escapeHtml(eDep.titulo) : ''}
          </option>
        `).join('');
      }

      return `
        <div class="bg-white border ${isCritica ? 'border-rose-200 ring-1 ring-rose-100' : (et.concluida ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200')} rounded-xl p-3 sm:p-3.5 space-y-3 shadow-2xs transition text-left">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg ${et.concluida ? 'bg-emerald-600 text-white' : (isCritica ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white')} text-[11px] font-bold flex items-center justify-center shadow-2xs">
                ${index + 1}
              </span>
              <span class="font-semibold text-slate-800 text-xs">Etapa ${index + 1}</span>
              ${isCritica ? '<span class="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>Etapa Crítica</span>' : ''}
              ${et.concluida ? '<span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Concluída</span>' : ''}
            </div>
            <div class="flex items-center gap-2">
              <div class="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                <button
                  type="button"
                  onclick="app.moverEtapaSequencial(${index}, -1)"
                  ${index === 0 ? 'disabled' : ''}
                  class="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded transition disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                  title="Mover etapa para cima (priorizar)"
                >
                  <i class="fa-solid fa-arrow-up text-[10px]"></i>
                </button>
                <button
                  type="button"
                  onclick="app.moverEtapaSequencial(${index}, 1)"
                  ${index === totalEtapas - 1 ? 'disabled' : ''}
                  class="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded transition disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                  title="Mover etapa para baixo"
                >
                  <i class="fa-solid fa-arrow-down text-[10px]"></i>
                </button>
              </div>
              <label class="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg cursor-pointer transition select-none">
                <input
                  type="checkbox"
                  ${et.concluida ? 'checked' : ''}
                  onchange="app.aoAlternarConclusaoEtapa(${index}, this.checked)"
                  class="rounded text-emerald-600 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                >
                <span class="text-[11px] font-semibold ${et.concluida ? 'text-emerald-800' : 'text-slate-600'}">
                  ${et.concluida ? 'Etapa Concluída' : 'Marcar Concluída'}
                </span>
              </label>
              ${totalEtapas > 1 ? `
                <button
                  type="button"
                  onclick="app.removerEtapaSequencial(${index})"
                  class="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition text-xs"
                  title="Remover etapa"
                >
                  <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
              ` : ''}
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div class="sm:col-span-4">
              <label class="block text-slate-600 font-medium text-[11px] mb-1 flex items-center justify-between">
                <span>Título da Etapa</span>
                <span class="text-slate-400 text-[10px] font-normal">Opcional</span>
              </label>
              <input
                type="text"
                value="${this.ctrl.escapeHtml(et.titulo || '')}"
                oninput="app.aoAlterarTituloEtapa(${index}, this.value)"
                placeholder="Ex: Levantamento de requisitos..."
                class="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white text-slate-800 text-xs shadow-2xs font-medium"
              >
            </div>
            <div class="sm:col-span-3">
              <label class="block text-slate-600 font-medium text-[11px] mb-1">Fase / Nome da Etapa</label>
              <select
                onchange="app.aoAlterarNomeEtapa(${index}, this.value)"
                class="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white text-slate-800 font-medium text-xs cursor-pointer shadow-2xs"
              >
                ${optionsHtml}
              </select>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-slate-600 font-medium text-[11px] mb-1 flex items-center justify-between">
                <span>Prioridade</span>
                ${isCritica ? '<span class="text-rose-600 text-[10px] font-bold">!</span>' : ''}
              </label>
              <select
                onchange="app.aoAlterarPrioridadeEtapa(${index}, this.value)"
                class="w-full px-2 py-1.5 border ${isCritica ? 'border-rose-300 bg-rose-50/40 text-rose-900 font-bold' : 'border-slate-200 bg-white text-slate-800 font-medium'} rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs cursor-pointer shadow-2xs transition"
              >
                <option value="" ${!prioridadeEtapa ? 'selected' : ''}>Sel...</option>
                ${(this.ctrl.configuracoes.prioridades || ['P0 - Crítica', 'P1 - Alta', 'P2 - Média', 'P3 - Baixa']).map(pr => {
                  const cod = pr.split(' ')[0];
                  const sel = prioridadeEtapa.toLowerCase() === pr.toLowerCase() || (prioridadeEtapa && prioridadeEtapa.includes(cod));
                  return `<option value="${this.ctrl.escapeHtml(pr)}" ${sel ? 'selected' : ''}>${this.ctrl.escapeHtml(cod)}</option>`;
                }).join('')}
              </select>
            </div>
            <div class="sm:col-span-3">
              <label class="block text-slate-600 font-medium text-[11px] mb-1">Responsável da Etapa</label>
              <input
                type="text"
                value="${this.ctrl.escapeHtml(et.responsavel || '')}"
                oninput="app.aoAlterarResponsavelEtapa(${index}, this.value)"
                placeholder="Ex: Carlos / Dev"
                class="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white text-slate-800 text-xs shadow-2xs font-medium"
              >
            </div>
          </div>

          <!-- BLOCO DE DEPENDÊNCIAS -->
          <div class="bg-slate-50 border border-slate-200/70 p-2.5 rounded-lg space-y-2">
            <div class="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div class="sm:col-span-4">
                <label class="block text-slate-500 font-medium text-[10px] mb-0.5">Vínculo de Dependência</label>
                <select 
                  onchange="app.aoAlterarTipoDependenciaEtapaForm(${index}, this.value)"
                  class="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-white text-slate-800 cursor-pointer"
                >
                  <option value="" ${!depTipo ? 'selected' : ''}>Nenhuma (Independente)</option>
                  <option value="PREDECESSORA" ${depTipo === 'PREDECESSORA' ? 'selected' : ''}>Predecessora (Depende de)</option>
                  <option value="ANTECESSORA" ${depTipo === 'ANTECESSORA' ? 'selected' : ''}>Antecessora (Libera)</option>
                </select>
              </div>
              ${depTipo ? `
                <div class="sm:col-span-4">
                  <label class="block text-slate-500 font-medium text-[10px] mb-0.5">Demanda Relacionada</label>
                  <select 
                    onchange="app.aoAlterarAtividadeDependenciaEtapaForm(${index}, this.value)"
                    class="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-white text-slate-800 cursor-pointer"
                  >
                    <option value="">Selecione...</option>
                    ${optionsAtividadesDep}
                  </select>
                </div>
                <div class="sm:col-span-4">
                  <label class="block text-slate-500 font-medium text-[10px] mb-0.5">Etapa Relacionada</label>
                  <select 
                    onchange="app.aoAlterarEtapaDependenciaEtapaForm(${index}, this.value)"
                    class="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-white text-slate-800 cursor-pointer"
                  >
                    <option value="">Selecione a etapa...</option>
                    ${optionsEtapasDep}
                  </select>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- LINHA DE DATAS -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5">
            <div>
              <label class="block text-slate-600 font-medium text-[11px] mb-1">Data Início</label>
              <input
                type="date"
                value="${et.dataInicio || ''}"
                onchange="app.aoAlterarDataInicioEtapa(${index}, this.value)"
                class="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white text-slate-800 font-mono text-[11px] shadow-2xs"
              >
            </div>
            <div>
              <label class="block text-slate-600 font-medium text-[11px] mb-1">Data Programada</label>
              <input
                type="date"
                value="${et.dataProgramada || ''}"
                onchange="app.aoAlterarDataProgramadaEtapa(${index}, this.value)"
                class="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white text-slate-800 font-mono text-[11px] shadow-2xs"
              >
            </div>
            <div>
              <label class="block text-slate-600 font-medium text-[11px] mb-1 flex items-center justify-between">
                <span>Data Entrega</span>
                ${et.concluida && !et.dataEntrega ? '<span class="text-rose-600 text-[10px] font-bold">Obrigatória</span>' : ''}
              </label>
              <input
                type="date"
                value="${et.dataEntrega || ''}"
                onchange="app.aoAlterarDataEntregaEtapa(${index}, this.value)"
                class="w-full px-2.5 py-1.5 border ${et.concluida && !et.dataEntrega ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'} rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white text-slate-800 font-mono text-[11px] shadow-2xs"
              >
            </div>
          </div>
          <div>
            <label class="block text-slate-600 font-medium text-[11px] mb-1">Observações da etapa</label>
            <textarea
              rows="2"
              maxlength="500"
              oninput="app.aoAlterarObsEtapa(${index}, this.value)"
              placeholder="Observações / dependências desta etapa..."
              class="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white text-slate-800 text-xs shadow-2xs resize-y leading-relaxed"
            >${this.ctrl.escapeHtml(et.obs || '')}</textarea>
          </div>
        </div>
      `;
    }).join('');
  }

  aoAlterarPrioridadeEtapa(index, valor) {
    if (!this.etapasFormAtual[index]) return;
    this.etapasFormAtual[index].prioridade = valor;
    this.renderizarEtapasForm();
    this.salvarRascunhoForm();
  }

  aoAlterarResponsavelEtapa(index, valor) {
    if (!this.etapasFormAtual[index]) return;
    this.etapasFormAtual[index].responsavel = valor;
    this.salvarRascunhoForm();
  }

  aoAlterarDataInicioEtapa(index, valor) {
    if (!this.etapasFormAtual[index]) return;
    this.etapasFormAtual[index].dataInicio = valor;
    this.salvarRascunhoForm();
  }

  aoAlterarTituloEtapa(index, valor) {
    if (!this.etapasFormAtual[index]) return;
    this.etapasFormAtual[index].titulo = valor;
    if (index === this.etapasFormAtual.length - 1) {
      this.atualizarEstadoBotaoProximaEtapa();
    }
    this.salvarRascunhoForm();
  }

  aoAlternarConclusaoEtapa(index, estaConcluida) {
    if (!this.etapasFormAtual[index]) return;
    this.etapasFormAtual[index].concluida = estaConcluida;
    if (estaConcluida && !this.etapasFormAtual[index].dataEntrega) {
      this.etapasFormAtual[index].dataEntrega = window.DataUtils ? window.DataUtils.obterDataHojeISO() : new Date().toISOString().slice(0, 10);
    }
    this.recalcularProgressoPelasEtapas();
    this.renderizarEtapasForm();
    this.salvarRascunhoForm();
  }

  aoAlterarNomeEtapa(index, novoNome) {
    if (!this.etapasFormAtual[index]) return;
    this.etapasFormAtual[index].nome = novoNome;
    this.recalcularProgressoPelasEtapas();
    this.salvarRascunhoForm();
  }

  aoAlterarDataProgramadaEtapa(index, valor) {
    if (!this.etapasFormAtual[index]) return;
    this.etapasFormAtual[index].dataProgramada = valor;
    this.salvarRascunhoForm();
  }

  aoAlterarDataEntregaEtapa(index, valor) {
    if (!this.etapasFormAtual[index]) return;
    this.etapasFormAtual[index].dataEntrega = valor;
    if (valor && !this.etapasFormAtual[index].concluida) {
      this.etapasFormAtual[index].concluida = true;
      this.recalcularProgressoPelasEtapas();
      this.renderizarEtapasForm();
    }
    this.salvarRascunhoForm();
  }

  aoAlterarObsEtapa(index, valor) {
    if (!this.etapasFormAtual[index]) return;
    this.etapasFormAtual[index].obs = valor.slice(0, 500);
    this.salvarRascunhoForm();
  }

  adicionarNovaEtapaSequencial() {
    const total = this.etapasFormAtual.length;
    const ultima = this.etapasFormAtual[total - 1];
    const temTitulo = Boolean(ultima && ultima.titulo && String(ultima.titulo).trim() !== '');
    if (ultima && !ultima.concluida && !temTitulo) {
      this.ctrl.exibirToast('Informe o título da etapa ou conclua a fase anterior para prosseguir.', 'info');
      return;
    }
    let proximaEtapaNome = this.ctrl.configuracoes.etapas[0]?.nome || 'Dev';
    if (ultima) {
      const idxAtualConfig = this.ctrl.configuracoes.etapas.findIndex(e => e.nome.toLowerCase() === ultima.nome.toLowerCase());
      if (idxAtualConfig !== -1 && idxAtualConfig + 1 < this.ctrl.configuracoes.etapas.length) {
        proximaEtapaNome = this.ctrl.configuracoes.etapas[idxAtualConfig + 1].nome;
      }
    }
    const dataHoje = window.DataUtils ? window.DataUtils.obterDataHojeISO() : new Date().toISOString().slice(0, 10);
    const dataInicioSugerida = (ultima && ultima.dataEntrega) ? ultima.dataEntrega : dataHoje;
    this.etapasFormAtual.push({
      id: Date.now(),
      titulo: '',
      nome: proximaEtapaNome,
      prioridade: '',
      responsavel: '',
      dataInicio: dataInicioSugerida,
      dataProgramada: dataInicioSugerida,
      dataEntrega: '',
      concluida: false,
      obs: ''
    });
    this.renderizarEtapasForm();
    this.recalcularProgressoPelasEtapas();
    this.salvarRascunhoForm();
    this.ctrl.exibirToast(`Etapa "${proximaEtapaNome}" adicionada!`, 'sucesso');
  }

  abrirModalForm() {
    this.editandoId = null;
    this.ctrl.atualizarListasDeFiltro();
    const proximoId = this.ctrl.gerarProximoId();

    this.ctrl._setText('modalTitulo', `Cadastrar Atividade (${proximoId}) no Excel`);
    this.ctrl._setValue('inputId', proximoId);
    this.ctrl._setValue('inputTitulo', '');
    const macroPadrao = (this.ctrl.configuracoes.listaCadeiaValor && this.ctrl.configuracoes.listaCadeiaValor[0]) || 'Operações';
    const frentePadrao = (this.ctrl.configuracoes.cadeiasValor && this.ctrl.configuracoes.cadeiasValor[0]) || '';
    const equipePadrao = (this.ctrl.configuracoes.equipes && this.ctrl.configuracoes.equipes[0]) || '';
    this.ctrl._setValue('inputMacroCadeiaValor', macroPadrao);
    this.ctrl._setValue('inputCadeiaValor', frentePadrao);
    this.ctrl._setValue('inputEquipe', equipePadrao);
    this.ctrl._setValue('inputPrioridade', 'P1 - Alta');
    this.ctrl._setValue('inputStatus', 'Não iniciado');
    this.ctrl._setValue('inputResponsavel', '');
    this.ctrl._setValue('inputLiderProtheus', '');
    this.ctrl._setValue('inputLiderWebtrade', '');
    this.ctrl._setValue('inputDesenvolvedor', '');

    const hojeISO = window.DataUtils ? window.DataUtils.obterDataHojeISO() : new Date().toISOString().slice(0, 10);
    this.ctrl._setValue('inputPrazoInicio', hojeISO);
    this.ctrl._setValue('inputPrazo', hojeISO);
    this.ctrl._setValue('inputConclusao', '');
    const primeiraEtapaNome = (this.ctrl.configuracoes.etapas && this.ctrl.configuracoes.etapas[0]) ? this.ctrl.configuracoes.etapas[0].nome : 'Dev';

    this.etapasFormAtual = [{
      id: Date.now(),
      titulo: '',
      nome: primeiraEtapaNome,
      prioridade: '',
      responsavel: '',
      dataInicio: hojeISO,
      dataProgramada: hojeISO,
      dataEntrega: '',
      concluida: false,
      obs: ''
    }];
    this.renderizarEtapasForm();
    this.ctrl._setValue('inputProgresso', 0);

    const modal = document.getElementById('modalFormulario');
    if (modal) modal.classList.remove('hidden');

    document.getElementById('inputTitulo')?.focus();
    this.salvarRascunhoForm();
  }

  abrirModalEdicao(id) {
    const idBusca = window.DataUtils ? window.DataUtils.normalizarId(id) : String(id).trim();
    const item = this.ctrl.bancoDados.find(x => (window.DataUtils ? window.DataUtils.normalizarId(x.id) : String(x.id).trim()) === idBusca);
    if (!item) return;
    this.ctrl.recalcularProgressoItem(item);
    this.editandoId = idBusca;
    this.ctrl.atualizarListasDeFiltro();

    this.ctrl._setText('modalTitulo', `Editar Atividade (${item.id}) no Excel`);
    this.ctrl._setValue('inputId', item.id);
    this.ctrl._setValue('inputTitulo', item.titulo);
    const selMacroCadeia = document.getElementById('inputMacroCadeiaValor');
    if (selMacroCadeia) {
      if (item.macroCadeiaValor && !Array.from(selMacroCadeia.options).some(o => o.value === item.macroCadeiaValor)) {
        selMacroCadeia.add(new Option(item.macroCadeiaValor, item.macroCadeiaValor));
      }
      selMacroCadeia.value = item.macroCadeiaValor || (this.ctrl.configuracoes.listaCadeiaValor && this.ctrl.configuracoes.listaCadeiaValor[0]) || '';
    }
    const selCadeia = document.getElementById('inputCadeiaValor');
    const selEquipe = document.getElementById('inputEquipe');
    if (selCadeia) {
      if (item.cadeiaValor && !Array.from(selCadeia.options).some(o => o.value === item.cadeiaValor)) {
        selCadeia.add(new Option(item.cadeiaValor, item.cadeiaValor));
      }
      selCadeia.value = item.cadeiaValor;
    }
    if (selEquipe) {
      if (item.equipe && !Array.from(selEquipe.options).some(o => o.value === item.equipe)) {
        selEquipe.add(new Option(item.equipe, item.equipe));
      }
      selEquipe.value = item.equipe;
    }
    this.ctrl._setValue('inputPrioridade', item.prioridade);
    this.ctrl._setValue('inputStatus', this.ctrl.normalizarStatus(item.status));
    this.ctrl._setValue('inputResponsavel', item.responsavel);
    this.ctrl._setValue('inputLiderProtheus', item.liderTechProtheus || '');
    this.ctrl._setValue('inputLiderWebtrade', item.liderTechWebtrade || '');
    this.ctrl._setValue('inputDesenvolvedor', item.desenvolvedor || '');

    const normalizarData = (val) => window.DataUtils ? window.DataUtils.normalizarDataFimMes(val, '') : val;
    this.ctrl._setValue('inputPrazoInicio', normalizarData(item.prazoInicio || item.etapaInicio || ''));
    this.ctrl._setValue('inputPrazo', normalizarData(item.prazo || ''));
    this.ctrl._setValue('inputConclusao', normalizarData(item.conclusao || ''));
    this.ctrl._setValue('inputProgresso', item.progresso);

    if (item.etapasCiclo && Array.isArray(item.etapasCiclo) && item.etapasCiclo.length > 0) {
      this.etapasFormAtual = JSON.parse(JSON.stringify(item.etapasCiclo)).map(et => ({
        ...et,
        titulo: et.titulo || '',
        prioridade: et.prioridade || '',
        responsavel: et.responsavel || '',
        dataInicio: et.dataInicio || et.dataProgramada || ''
      }));
    } else {
      this.etapasFormAtual = [{
        id: Date.now(),
        titulo: '',
        nome: item.etapa || 'Dev',
        prioridade: '',
        responsavel: item.responsavel || '',
        dataInicio: item.dataInicio || item.etapaInicio || '',
        dataProgramada: item.etapaInicio || '',
        dataEntrega: item.etapaFim || '',
        concluida: Boolean(item.etapaFim || this.ctrl.normalizarStatus(item.status) === 'Concluído'),
        obs: item.etapaObs || ''
      }];
    }
    this.renderizarEtapasForm();
    document.getElementById('modalFormulario')?.classList.remove('hidden');
    document.getElementById('inputTitulo')?.focus();
    this.salvarRascunhoForm();
  }

  removerEtapaSequencial(index) {
    if (this.etapasFormAtual.length <= 1) return;
    this.etapasFormAtual.splice(index, 1);
    this.renderizarEtapasForm();
    this.recalcularProgressoPelasEtapas();
    this.salvarRascunhoForm();
  }

  moverEtapaSequencial(index, direcao) {
    const novoIndex = index + direcao;
    if (novoIndex < 0 || novoIndex >= this.etapasFormAtual.length) return;
    const item = this.etapasFormAtual.splice(index, 1)[0];
    this.etapasFormAtual.splice(novoIndex, 0, item);
    this.renderizarEtapasForm();
    this.recalcularProgressoPelasEtapas();
    this.atualizarEstadoBotaoProximaEtapa();
    this.salvarRascunhoForm();
  }

  recalcularProgressoPelasEtapas() {
    const inputProg = document.getElementById('inputProgresso');
    const selStatus = document.getElementById('inputStatus');
    if (!inputProg || this.etapasFormAtual.length === 0) return;
    const total = this.etapasFormAtual.length;
    const concluidas = this.etapasFormAtual.filter(e => Boolean(e.concluida || (e.dataEntrega && String(e.dataEntrega).trim() !== ''))).length;
    const novoProgresso = total > 0 ? Math.round((concluidas / total) * 100) : 0;
    if (novoProgresso === 100) {
      if (selStatus && selStatus.value !== 'Concluído') selStatus.value = 'Concluído';
    } else if (concluidas > 0) {
      if (selStatus && (this.ctrl.normalizarStatus(selStatus.value) === 'Não iniciado' || this.ctrl.normalizarStatus(selStatus.value) === 'Concluído')) {
        selStatus.value = 'Em Andamento';
      }
    }
    inputProg.value = novoProgresso;
  }

  aplicarPesoEtapaAtual() {
    this.recalcularProgressoPelasEtapas();
    const inputProg = document.getElementById('inputProgresso');
    if (inputProg) {
      this.ctrl.exibirToast(`Progresso recalculado proporcionalmente para ${inputProg.value}%`, 'info');
    }
  }

  fecharModalForm() {
    document.getElementById('modalFormulario')?.classList.add('hidden');
    this.fecharPopupMesAno();
    this.limparRascunhoForm();
    if (this.ctrl.pendenciaSincronizacaoExterna) {
      this.ctrl.aplicarSincronizacaoExterna();
    }
  }

  async salvarItemForm(event) {
    event.preventDefault();
    const id = document.getElementById('inputId')?.value.trim();
    const titulo = document.getElementById('inputTitulo')?.value.trim();
    const macroCadeiaValor = (document.getElementById('inputMacroCadeiaValor')?.value || '').trim();
    const cadeiaValor = document.getElementById('inputCadeiaValor')?.value.trim();
    const equipe = document.getElementById('inputEquipe')?.value.trim();
    const prioridade = document.getElementById('inputPrioridade')?.value;
    const status = this.ctrl.normalizarStatus(document.getElementById('inputStatus')?.value);
    const responsavel = document.getElementById('inputResponsavel')?.value.trim();
    const liderTechProtheus = (document.getElementById('inputLiderProtheus')?.value || '').trim();
    const liderTechWebtrade = (document.getElementById('inputLiderWebtrade')?.value || '').trim();
    const desenvolvedor = (document.getElementById('inputDesenvolvedor')?.value || '').trim();

    const normalizarData = (val) => window.DataUtils ? window.DataUtils.normalizarDataFimMes(val, '') : val;
    const prazoInicio = normalizarData(document.getElementById('inputPrazoInicio')?.value);
    const prazo = normalizarData(document.getElementById('inputPrazo')?.value);
    const conclusao = normalizarData(document.getElementById('inputConclusao')?.value || '');

    if (!id || !titulo || !responsavel || !prazoInicio || !prazo) {
      this.ctrl.exibirToast('Preencha os campos obrigatórios (incluindo Data de Início e Prazo Programado).', 'erro');
      return;
    }

    const etapasSalvar = this.etapasFormAtual.map(e => ({
      id: e.id,
      titulo: e.titulo || '',
      nome: e.nome,
      prioridade: e.prioridade || '',
      responsavel: e.responsavel || '',
      dataInicio: e.dataInicio || '',
      dataProgramada: e.dataProgramada || '',
      dataEntrega: e.dataEntrega || '',
      concluida: Boolean(e.concluida),
      obs: e.obs || ''
    }));

    const etapaAtiva = etapasSalvar.find(e => !e.concluida) || etapasSalvar[etapasSalvar.length - 1] || { nome: 'Dev', dataInicio: '', dataProgramada: '', dataEntrega: '', obs: '', prioridade: '' };
    const etapa = etapaAtiva.nome;
    const etapaDataInicio = etapaAtiva.dataInicio || '';
    const etapaInicio = etapaAtiva.dataProgramada || '';
    const etapaFim = etapaAtiva.dataEntrega || '';
    const etapaObs = etapaAtiva.obs || (etapasSalvar.find(e => e.obs && e.obs.trim())?.obs || '');

    let progresso = Math.min(100, Math.max(0, parseInt(document.getElementById('inputProgresso')?.value, 10) || 0));
    if (status === 'Concluído') {
      progresso = 100;
    } else if (etapasSalvar.length > 0) {
      const concluidas = etapasSalvar.filter(e => Boolean(e.concluida || (e.dataEntrega && String(e.dataEntrega).trim() !== ''))).length;
      progresso = Math.round((concluidas / etapasSalvar.length) * 100);
    }

    if (macroCadeiaValor && !this.ctrl.configuracoes.listaCadeiaValor.includes(macroCadeiaValor)) {
      this.ctrl.configuracoes.listaCadeiaValor.push(macroCadeiaValor);
    }
    if (cadeiaValor && !this.ctrl.configuracoes.cadeiasValor.includes(cadeiaValor)) {
      this.ctrl.configuracoes.cadeiasValor.push(cadeiaValor);
    }
    if (equipe && !this.ctrl.configuracoes.equipes.includes(equipe)) {
      this.ctrl.configuracoes.equipes.push(equipe);
    }

    const registro = {
      id, titulo, macroCadeiaValor, cadeiaValor, equipe, prioridade, status,
      responsavel, liderTechProtheus, liderTechWebtrade, desenvolvedor,
      prazoInicio, prazo, conclusao, progresso, etapa,
      etapaDataInicio, etapaInicio, etapaFim, etapaObs,
      etapasCiclo: etapasSalvar
    };

    const idBusca = window.DataUtils ? window.DataUtils.normalizarId(id) : id;
    if (this.editandoId) {
      const index = this.ctrl.bancoDados.findIndex(x => (window.DataUtils ? window.DataUtils.normalizarId(x.id) : String(x.id).trim()) === String(this.editandoId).trim());
      if (index !== -1) {
        this.ctrl.bancoDados[index] = { ...this.ctrl.bancoDados[index], ...registro };
        this.ctrl.exibirToast(`Atividade ${this.editandoId} atualizada!`, 'sucesso');
      }
    } else {
      if (this.ctrl.bancoDados.some(x => (window.DataUtils ? window.DataUtils.normalizarId(x.id) : String(x.id).trim()) === idBusca)) {
        this.ctrl.exibirToast('Já existe uma atividade com este ID!', 'erro');
        return;
      }
      this.ctrl.bancoDados.push(registro);
      this.ctrl.exibirToast(`Nova atividade ${id} adicionada!`, 'sucesso');
    }

    this.ctrl.migrarStatusLegado();
    this.ctrl.atualizarListasDeFiltro();
    this.ctrl.aplicarFiltros(false);
    this.ctrl.configurarRedimensionamentoTabela();
    this.ctrl.atualizarPainelExecutivo();
    this.ctrl.renderizarRoadmap();
    this.fecharModalForm();
    this.limparRascunhoForm();

    await this.ctrl.salvarNoExcel(false, id, 'upsert');
  }

  // ================= MODAL DE EXCLUSÃO =================
  confirmarExclusao(id) {
    this.itemParaExcluir = window.DataUtils ? window.DataUtils.normalizarId(id) : String(id).trim();
    const item = this.ctrl.bancoDados.find(x => (window.DataUtils ? window.DataUtils.normalizarId(x.id) : String(x.id).trim()) === this.itemParaExcluir);
    this.ctrl._setText('exclusaoIdBadge', this.itemParaExcluir);
    this.ctrl._setText('exclusaoCadeiaBadge', item?.cadeiaValor || 'Projetos / Frentes');
    this.ctrl._setText('exclusaoTitulo', item?.titulo || this.itemParaExcluir);
    document.getElementById('modalConfirmacaoExclusao')?.classList.remove('hidden');
    const btnConf = document.getElementById('btnConfirmarExclusao');
    if (btnConf) btnConf.onclick = () => this.executarExclusao();
  }

  fecharModalExclusao() {
    this.itemParaExcluir = null;
    document.getElementById('modalConfirmacaoExclusao')?.classList.add('hidden');
  }

  async executarExclusao() {
    if (!this.itemParaExcluir) return;
    const idExcluido = this.itemParaExcluir;
    const idNormalizado = window.DataUtils ? window.DataUtils.normalizarId(idExcluido) : String(idExcluido).trim();
    this.ctrl.bancoDados = this.ctrl.bancoDados.filter(x => (window.DataUtils ? window.DataUtils.normalizarId(x.id) : String(x.id).trim()) !== idNormalizado);
    this.ctrl.exibirToast(`Registro ${idExcluido} removido com sucesso!`, 'info');
    this.fecharModalExclusao();
    this.ctrl.atualizarListasDeFiltro();
    this.ctrl.aplicarFiltros(false);
    this.ctrl.configurarRedimensionamentoTabela();
    this.ctrl.atualizarPainelExecutivo();

    await this.ctrl.salvarNoExcel(false, idExcluido, 'delete');
  }

  // ================= MODAL PREVIEW CÉLULAS EXCEL =================
  alternarAbaPreview(nomeAba) {
    this.abaPreviewAtual = nomeAba;
    const btns = {
      'tb_Atividades': document.getElementById('btnAbaPreviewAtividades'),
      'tb_Detalhes_ID': document.getElementById('btnAbaPreviewDetalhes'),
      'tb_Configuracoes': document.getElementById('btnAbaPreviewConfig')
    };
    Object.values(btns).forEach(b => {
      if (b) b.className = 'text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white transition';
    });
    if (btns[nomeAba]) {
      btns[nomeAba].className = 'text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-600 text-white font-semibold transition';
    }
    try {
      this.renderizarConteudoPreviewExcel();
    } catch (err) {
      console.error('Erro ao renderizar conteúdo do Excel:', err);
    }
  }

  abrirModalPreviewExcel() {
    const modal = document.getElementById('modalPreviewExcel');
    if (!modal) {
      this.ctrl.exibirToast('Elemento modalPreviewExcel não encontrado no HTML!', 'erro');
      return;
    }
    modal.classList.remove('hidden');
    this.alternarAbaPreview('tb_Atividades');
  }

  renderizarConteudoPreviewExcel() {
    const thead = document.getElementById('previewExcelGridHead');
    const tbody = document.getElementById('previewExcelGridBody');
    const formulaBar = document.getElementById('previewFormulaBar');
    if (!thead || !tbody || !formulaBar) return;

    if (this.abaPreviewAtual === 'tb_Atividades') {
      formulaBar.innerText = '=TABLE[tb_Atividades] (ID, Titulo, Projetos_Frentes, Equipe, Prioridade, Status, Etapa, Data_Inicio, Data_Programada, Prazo_Mes, Progresso)';
      thead.innerHTML = `
        <tr>
          <th class="w-10 py-1 bg-slate-200 text-center border-r border-slate-200">#</th>
          <th class="w-16 py-1 px-2 border-r border-slate-200 text-left">A (ID)</th>
          <th class="w-44 py-1 px-2 border-r border-slate-200 text-left">B (Titulo)</th>
          <th class="w-24 py-1 px-2 border-r border-slate-200 text-left">C (Projetos_Frentes)</th>
          <th class="w-24 py-1 px-2 border-r border-slate-200 text-left">D (Equipe)</th>
          <th class="w-20 py-1 px-2 border-r border-slate-200 text-center">E (Prioridade)</th>
          <th class="w-20 py-1 px-2 border-r border-slate-200 text-center">F (Status)</th>
          <th class="w-20 py-1 px-2 border-r border-slate-200 text-center">G (Etapa)</th>
          <th class="w-24 py-1 px-2 border-r border-slate-200 text-center">H (Data Inicio)</th>
          <th class="w-24 py-1 px-2 border-r border-slate-200 text-center">I (Data Prog.)</th>
          <th class="w-20 py-1 px-2 border-r border-slate-200 text-center">J (Prazo Mês)</th>
          <th class="w-16 py-1 px-2 text-right">K (%)</th>
        </tr>
      `;
      tbody.innerHTML = (this.ctrl.bancoDados || []).map((item, index) => {
        const prioTexto = String(item.prioridade || '').trim();
        const prioCurta = prioTexto ? prioTexto.split(' ')[0] : '--';
        return `
          <tr class="hover:bg-slate-50">
            <td class="py-1 bg-slate-100 text-center text-slate-500 border-r border-slate-200 font-mono text-[10px]">${index + 2}</td>
            <td class="py-1 px-2 border-r border-slate-200 text-slate-900 font-semibold">${item.id}</td>
            <td class="py-1 px-2 border-r border-slate-200 text-slate-800 truncate">${this.ctrl.escapeHtml(item.titulo)}</td>
            <td class="py-1 px-2 border-r border-slate-200 text-slate-700">${this.ctrl.escapeHtml(item.cadeiaValor)}</td>
            <td class="py-1 px-2 border-r border-slate-200 text-slate-700">${this.ctrl.escapeHtml(item.equipe)}</td>
            <td class="py-1 px-2 border-r border-slate-200 text-center">${prioCurta}</td>
            <td class="py-1 px-2 border-r border-slate-200 text-center">${item.status}</td>
            <td class="py-1 px-2 border-r border-slate-200 text-center font-semibold text-emerald-700">${this.ctrl.escapeHtml(item.etapa || 'Dev')}</td>
            <td class="py-1 px-2 border-r border-slate-200 text-center font-mono text-[10px]">${item.etapaDataInicio || '-'}</td>
            <td class="py-1 px-2 border-r border-slate-200 text-center font-mono text-[10px]">${item.etapaInicio || '-'}</td>
            <td class="py-1 px-2 border-r border-slate-200 text-center font-mono">${item.prazo || '-'}</td>
            <td class="py-1 px-2 text-right font-mono text-emerald-700 font-medium">${item.progresso}%</td>
          </tr>
        `;
      }).join('');
    } else if (this.abaPreviewAtual === 'tb_Detalhes_ID') {
      formulaBar.innerText = '=TABLE[tb_Detalhes_ID] (ID, Atividade, Etapa_Atual, Dt_Inicio, Dt_Programada, Dt_Conclusao, Obs, Progresso_Pct)';
      thead.innerHTML = `
        <tr>
          <th class="w-10 py-1 bg-slate-200 text-center border-r border-slate-200">#</th>
          <th class="w-16 py-1 px-2 border-r border-slate-200 text-left">A (ID)</th>
          <th class="w-40 py-1 px-2 border-r border-slate-200 text-left">B (Atividade)</th>
          <th class="w-20 py-1 px-2 border-r border-slate-200 text-center">C (Etapa)</th>
          <th class="w-24 py-1 px-2 border-r border-slate-200 text-center">D (Dt Inicio)</th>
          <th class="w-24 py-1 px-2 border-r border-slate-200 text-center">E (Dt Programada)</th>
          <th class="w-24 py-1 px-2 border-r border-slate-200 text-center">F (Dt Conclusão)</th>
          <th class="w-48 py-1 px-2 border-r border-slate-200 text-left">G (Observações)</th>
          <th class="w-16 py-1 px-2 text-right">H (%)</th>
        </tr>
      `;
      tbody.innerHTML = (this.ctrl.bancoDados || []).map((item, index) => `
        <tr class="hover:bg-slate-50">
          <td class="py-1 bg-slate-100 text-center text-slate-500 border-r border-slate-200 font-mono text-[10px]">${index + 2}</td>
          <td class="py-1 px-2 border-r border-slate-200 text-slate-900 font-bold">${item.id}</td>
          <td class="py-1 px-2 border-r border-slate-200 text-slate-800 truncate">${this.ctrl.escapeHtml(item.titulo)}</td>
          <td class="py-1 px-2 border-r border-slate-200 text-center font-semibold text-emerald-800">${this.ctrl.escapeHtml(item.etapa || 'Dev')}</td>
          <td class="py-1 px-2 border-r border-slate-200 text-center font-mono text-[10px]">${item.etapaDataInicio || '-'}</td>
          <td class="py-1 px-2 border-r border-slate-200 text-center font-mono text-[10px]">${item.etapaInicio || '-'}</td>
          <td class="py-1 px-2 border-r border-slate-200 text-center font-mono text-[10px]">${item.etapaFim || '-'}</td>
          <td class="py-1 px-2 border-r border-slate-200 text-slate-600 truncate" title="${this.ctrl.escapeHtml(item.etapaObs || '')}">${this.ctrl.escapeHtml(item.etapaObs || '-')}</td>
          <td class="py-1 px-2 text-right font-mono text-emerald-700">${item.progresso}%</td>
        </tr>
      `).join('');
    } else {
      formulaBar.innerText = '=TABLE[tb_Configuracoes] (Tipo, Chave, Valor)';
      thead.innerHTML = `
        <tr>
          <th class="w-10 py-1 bg-slate-200 text-center border-r border-slate-200">#</th>
          <th class="w-32 py-1 px-2 border-r border-slate-200 text-left">A (Tipo)</th>
          <th class="w-56 py-1 px-2 border-r border-slate-200 text-left">B (Chave)</th>
          <th class="py-1 px-2 text-left">C (Valor / Peso)</th>
        </tr>
      `;
      const linhasConfig = [
        { tipo: 'PARAMETRO', chave: 'Organizacao', valor: this.ctrl.configuracoes.organizacao },
        { tipo: 'PARAMETRO', chave: 'Ciclo', valor: this.ctrl.configuracoes.ciclo },
        ...(this.ctrl.configuracoes.statusList || []).map((st, i) => ({ tipo: 'STATUS', chave: st, valor: String(i + 1) })),
        ...(this.ctrl.configuracoes.prioridades || ['P0 - Crítica', 'P1 - Alta', 'P2 - Média', 'P3 - Baixa']).map((pr, i) => ({ tipo: 'PRIORIDADE', chave: pr, valor: String(i + 1) })),
        ...(this.ctrl.configuracoes.etapas || []).map(e => ({ tipo: 'ETAPA', chave: typeof e === 'string' ? e : e.nome, valor: `${typeof e === 'string' ? 50 : e.peso}%` })),
        ...(this.ctrl.configuracoes.listaCadeiaValor || []).map(cv => ({ tipo: 'CADEIA_VALOR', chave: cv, valor: 'Ativo' })),
        ...(this.ctrl.configuracoes.cadeiasValor || []).map(c => ({ tipo: 'PROJETO_FRENTE', chave: c, valor: 'Ativo' })),
        ...(this.ctrl.configuracoes.equipes || []).map(eq => ({ tipo: 'EQUIPE', chave: eq, valor: 'Ativo' })),
        ...(this.ctrl.configuracoes.anosRoadmap || []).map(ano => ({ tipo: 'ANO_ROADMAP', chave: String(ano), valor: 'Ativo' }))
      ];
      tbody.innerHTML = linhasConfig.map((item, index) => `
        <tr class="hover:bg-slate-50">
          <td class="py-1 bg-slate-100 text-center text-slate-500 border-r border-slate-200 font-mono text-[10px]">${index + 2}</td>
          <td class="py-1 px-2 border-r border-slate-200 font-bold text-slate-700">${item.tipo}</td>
          <td class="py-1 px-2 border-r border-slate-200 text-slate-900">${this.ctrl.escapeHtml(item.chave)}</td>
          <td class="py-1 px-2 font-mono font-semibold text-emerald-800">${this.ctrl.escapeHtml(item.valor)}</td>
        </tr>
      `).join('');
    }
  }

  fecharModalPreviewExcel() {
    document.getElementById('modalPreviewExcel')?.classList.add('hidden');
  }
}

window.ModaisComponent = ModaisComponent;
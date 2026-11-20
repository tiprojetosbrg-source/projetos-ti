// js/controllers/components/visaoExecutivaComponent.js
class VisaoExecutivaComponent {
  constructor(controller) {
    this.ctrl = controller;
    this.modeloSelecionado = 'modeloB';
    this.cadeiasSelecionadas = new Set();
    this.filtroMacroCadeia = '';
    this.filtroBuscaFrente = '';
    this.filtroStatusExec = '';
    this.atividadesGanttSelecionadas = new Set();
    this.emModoApresentacao = false;
    this.abaSlideB = 1; // 1: Status Report (RAG), 2: Cronograma Gantt
    this.slideAtual = 0;
    this.incluirRiscosAtraso = false;
    this.riscosCustomizados = [];
    this.idRiscoEmEdicao = null;
    this.filtroDataInicioExec = '';
    this.filtroDataFimExec = '';
    this.etapasExpandidasGantt = new Set();

    // Chaves de armazenamento
    this.CHAVE_STORAGE_ENTREGA = 'brg_visao_executiva_entrega_customizada';
    this.CHAVE_STORAGE_PROXIMOS = 'brg_visao_executiva_proximos_passos_customizados';
    this.CHAVE_STORAGE_ENTREGA_BULLETS = 'brg_visao_executiva_entrega_bullets_customizados';
    this.CHAVE_STORAGE_PROXIMOS_BULLETS = 'brg_visao_executiva_proximos_bullets_customizados';
    this.CHAVE_STORAGE_OVERVIEW = 'brg_visao_executiva_overview_customizado';
    this.overviewCustomizado = this.carregarOverviewSalvo();
    this.editandoOverview = false;
    this.entregaConsolidadaCustomizada = this.carregarEntregaSalva();
    this.proximosPassosCustomizados = this.carregarProximosPassosSalvos();
    this.entregaBulletsCustomizados = this.carregarEntregaBulletsSalvos();
    this.proximosBulletsCustomizados = this.carregarProximosBulletsSalvos();
    this.editandoEntregaConsolidada = false;
    this.editandoProximosPassos = false;
  }

  carregarEntregaSalva() {
    try {
      const salvo = localStorage.getItem(this.CHAVE_STORAGE_ENTREGA);
      return salvo && salvo.trim() !== '' ? salvo : null;
    } catch (e) {
      return null;
    }
  }

  salvarEntregaNoStorage(texto) {
    try {
      if (texto !== null && texto !== undefined) {
        localStorage.setItem(this.CHAVE_STORAGE_ENTREGA, texto);
      } else {
        localStorage.removeItem(this.CHAVE_STORAGE_ENTREGA);
      }
    } catch (e) {}
  }

  carregarEntregaBulletsSalvos() {
    try {
      const salvo = localStorage.getItem(this.CHAVE_STORAGE_ENTREGA_BULLETS);
      return salvo ? JSON.parse(salvo) : null;
    } catch (e) {
      return null;
    }
  }


  salvarEntregaBulletsNoStorage(bulletsArray) {
    try {
      if (bulletsArray !== null && bulletsArray !== undefined) {
        localStorage.setItem(this.CHAVE_STORAGE_ENTREGA_BULLETS, JSON.stringify(bulletsArray));
      } else {
        localStorage.removeItem(this.CHAVE_STORAGE_ENTREGA_BULLETS);
      }
    } catch (e) {}
  }

  carregarProximosPassosSalvos() {
    try {
      const salvo = localStorage.getItem(this.CHAVE_STORAGE_PROXIMOS);
      return salvo && salvo.trim() !== '' ? salvo : null;
    } catch (e) {
      return null;
    }
  }

  salvarProximosPassosNoStorage(texto) {
    try {
      if (texto !== null && texto !== undefined) {
        localStorage.setItem(this.CHAVE_STORAGE_PROXIMOS, texto);
      } else {
        localStorage.removeItem(this.CHAVE_STORAGE_PROXIMOS);
      }
    } catch (e) {}
  }

  carregarProximosBulletsSalvos() {
    try {
      const salvo = localStorage.getItem(this.CHAVE_STORAGE_PROXIMOS_BULLETS);
      return salvo ? JSON.parse(salvo) : null;
    } catch (e) {
      return null;
    }
  }

  salvarProximosBulletsNoStorage(bulletsArray) {
    try {
      if (bulletsArray !== null && bulletsArray !== undefined) {
        localStorage.setItem(this.CHAVE_STORAGE_PROXIMOS_BULLETS, JSON.stringify(bulletsArray));
      } else {
        localStorage.removeItem(this.CHAVE_STORAGE_PROXIMOS_BULLETS);
      }
    } catch (e) {}
  }

  abrirModal() {
    const modalEl = document.getElementById('modalVisaoExecutiva');
    if (!modalEl) {
      console.error('Elemento #modalVisaoExecutiva não encontrado no DOM.');
      return;
    }
    modalEl.classList.remove('hidden');
    this.emModoApresentacao = false;
    this.abaSlideB = 1;
    this.slideAtual = 0;
    this.filtroMacroCadeia = '';
    this.filtroBuscaFrente = '';
    this.filtroStatusExec = '';
    this.incluirRiscosAtraso = false;
    this.riscosCustomizados = [];
    this.idRiscoEmEdicao = null;
    this.editandoEntregaConsolidada = false;
    this.editandoProximosPassos = false;
    this.filtroDataInicioExec = '';
    this.filtroDataFimExec = '';
    this.editandoOverview = false;
    this.overviewCustomizado = this.carregarOverviewSalvo();

    // Esconde o botão de baixar no topo enquanto estiver na tela de seleção
    const btnTopo = document.getElementById('btnBaixarApresentacaoTopo');
    if (btnTopo) {
      btnTopo.classList.add('hidden');
      btnTopo.classList.remove('inline-flex');
    }

    try {
      this.entregaConsolidadaCustomizada = this.carregarEntregaSalva();
      this.proximosPassosCustomizados = this.carregarProximosPassosSalvos();
      const todasFrentes = this.obterListaTodasFrentes() || [];
      this.cadeiasSelecionadas = new Set(todasFrentes);
      this.atividadesGanttSelecionadas = new Set((this.ctrl?.bancoDados || []).map(x => String(x.id)));
      this.renderizarTelaSelecao();
    } catch (err) {
      console.error('Erro ao renderizar a seleção da Visão Executiva:', err);
    }
  }

  fecharModal() {
    document.getElementById('modalVisaoExecutiva')?.classList.add('hidden');
  }

  voltarParaSelecao() {
    this.emModoApresentacao = false;
    const btnTopo = document.getElementById('btnBaixarApresentacaoTopo');
    if (btnTopo) {
      btnTopo.classList.add('hidden');
      btnTopo.classList.remove('inline-flex');
    }
    this.renderizarTelaSelecao();
  }

  obterListaCadeiasDeValor() {
    const listaConfig = Array.isArray(this.ctrl?.configuracoes?.listaCadeiaValor)
      ? this.ctrl.configuracoes.listaCadeiaValor
      : ['Operações', 'Comercial', 'Financeiro', 'Tecnologia', 'Suprimentos'];
    const listaDados = (this.ctrl?.bancoDados || []).map(x => x.macroCadeiaValor).filter(Boolean);
    return [...new Set([...listaConfig, ...listaDados])].sort();
  }

  obterListaStatusConfigurados() {
    return (this.ctrl?.configuracoes?.statusList && this.ctrl.configuracoes.statusList.length > 0)
      ? this.ctrl.configuracoes.statusList
      : ['Não iniciado', 'Em Andamento', 'Em Revisão', 'Bloqueado', 'Concluído'];
  }

  obterListaTodasFrentes() {
    const frentesValidas = new Set(
      (this.ctrl?.bancoDados || [])
        .filter(item => {
          const s = String(this.ctrl.normalizarStatus(item.status) || '').toLowerCase();
          return !s.includes('backlog');
        })
        .map(x => x.cadeiaValor)
        .filter(Boolean)
    );
    return [...frentesValidas].sort();
  }

  obterFrentesPorMacro(macroNome) {
    const macroLimpa = String(macroNome || '').trim().toLowerCase();
    const frentesValidas = new Set(
      (this.ctrl?.bancoDados || [])
        .filter(item => {
          const s = String(this.ctrl.normalizarStatus(item.status) || '').toLowerCase();
          if (s.includes('backlog')) return false;
          if (macroLimpa) {
            const itemMacro = String(item.macroCadeiaValor || '').trim().toLowerCase();
            if (itemMacro !== macroLimpa) return false;
          }
          return true;
        })
        .map(x => x.cadeiaValor)
        .filter(Boolean)
    );
    return [...frentesValidas].sort();
  }

  obterFrentesFiltradas() {
    return this.obterFrentesPorMacro(this.filtroMacroCadeia);
  }

  obterFrentesAtivasNaApresentacao() {
    const frentesDaMacro = this.obterFrentesPorMacro(this.filtroMacroCadeia);
    if (!this.cadeiasSelecionadas || this.cadeiasSelecionadas.size === 0) {
      return frentesDaMacro;
    }
    const filtradas = frentesDaMacro.filter(f => this.cadeiasSelecionadas.has(f));
    return filtradas.length > 0 ? filtradas.sort() : frentesDaMacro;
  }

  obterMacroDaFrente(frenteNome) {
    const item = (this.ctrl?.bancoDados || []).find(x => x.cadeiaValor === frenteNome && x.macroCadeiaValor);
    return item ? item.macroCadeiaValor : '';
  }

  obterItensCadeia(cadeiaNome, ignorarStatus = false) {
    const macroFiltro = (this.filtroMacroCadeia || '').trim().toLowerCase();
    const statusFiltro = (this.filtroStatusExec || '').trim().toLowerCase();
    return (this.ctrl?.bancoDados || []).filter(item => {
      const statusNorm = String(this.ctrl.normalizarStatus(item.status) || '').toLowerCase();
      if (statusNorm.includes('backlog')) return false;
      if (!ignorarStatus && statusFiltro && statusNorm !== statusFiltro) return false;
      if (macroFiltro) {
        const itemMacro = String(item.macroCadeiaValor || '').trim().toLowerCase();
        if (itemMacro !== macroFiltro) return false;
      }
      return item.cadeiaValor === cadeiaNome;
    });
  }

  // Se ignorarStatus for true, não filtra por status (utilizado no Slide 1)
  obterItensSelecionados(ignorarStatus = false) {
    const frentesAtivas = new Set(this.obterFrentesAtivasNaApresentacao());
    const macroFiltro = (this.filtroMacroCadeia || '').trim().toLowerCase();
    const statusFiltro = (this.filtroStatusExec || '').trim().toLowerCase();
    
    const dFiltroInicio = this.filtroDataInicioExec ? new Date(`${this.filtroDataInicioExec}T00:00:00`) : null;
    const dFiltroFim = this.filtroDataFimExec ? new Date(`${this.filtroDataFimExec}T23:59:59`) : null;

    return (this.ctrl?.bancoDados || []).filter(item => {
      const statusNorm = String(this.ctrl.normalizarStatus(item.status) || '').toLowerCase();
      if (statusNorm.includes('backlog')) return false;
      if (!ignorarStatus && statusFiltro && statusNorm !== statusFiltro) return false;
      if (macroFiltro) {
        const itemMacro = String(item.macroCadeiaValor || '').trim().toLowerCase();
        if (itemMacro !== macroFiltro) return false;
      }
      if (!frentesAtivas.has(item.cadeiaValor)) return false;

      // Filtro de Período por Intersecção (considera tarefas ativas no intervalo)
      if (dFiltroInicio || dFiltroFim) {
        const extrairData = (valor, fimMes = false) => {
          if (!valor) return null;
          const s = String(valor).trim();
          if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
            const [a, m, d] = s.slice(0, 10).split('-').map(Number);
            return new Date(a, m - 1, d, fimMes ? 23 : 0, fimMes ? 59 : 0, fimMes ? 59 : 0);
          }
          if (/^\d{4}-\d{1,2}$/.test(s)) {
            const [a, m] = s.split('-').map(Number);
            const d = fimMes ? new Date(a, m, 0).getDate() : 1;
            return new Date(a, m - 1, d, fimMes ? 23 : 0, fimMes ? 59 : 0, fimMes ? 59 : 0);
          }
          const d = this.ctrl.parseData(s);
          return (d && !isNaN(d.getTime())) ? d : null;
        };

        const dIni = extrairData(item.prazoInicio, false) || extrairData(item.etapaDataInicio, false) || extrairData(item.prazo, false);
        const dFim = extrairData(item.prazo, true) || extrairData(item.conclusao, true) || dIni;

        if (!dIni && !dFim) return false;
        const inicioAtividade = dIni || dFim;
        const fimAtividade = dFim || dIni;

        // Regra de vigência ativa: o término da tarefa não pode ser anterior ao início do filtro,
        // nem seu início pode ser posterior ao fim do filtro.
        if (dFiltroInicio && fimAtividade < dFiltroInicio) return false;
        if (dFiltroFim && inicioAtividade > dFiltroFim) return false;
      }

      return true;
    });
  }

  alternarAtividadeGantt(idAtividade, checado) {
    const idStr = String(idAtividade);
    if (checado) {
      this.atividadesGanttSelecionadas.add(idStr);
    } else {
      this.atividadesGanttSelecionadas.delete(idStr);
    }

    const itens = this.obterItensSelecionados(false);

    // Atualiza o Slide 2
    const containerGantt = document.getElementById('slide2CronogramaGantt');
    if (containerGantt) {
      containerGantt.innerHTML = this.gerarHtmlGantt(itens);
    }

    // Sincroniza e reflete imediatamente no Slide 3
    const containerGanttDet = document.getElementById('slide3CronogramaGanttDetalhado');
    if (containerGanttDet) {
      containerGanttDet.innerHTML = this.gerarHtmlGanttDetalhado(itens);
    }
  }

  selecionarTodasAtividadesGantt(marcar) {
    const itens = this.obterItensSelecionados(false);
    if (marcar) {
      itens.forEach(it => this.atividadesGanttSelecionadas.add(String(it.id)));
    } else {
      itens.forEach(it => this.atividadesGanttSelecionadas.delete(String(it.id)));
    }

    // Atualiza o Slide 2
    const containerGantt = document.getElementById('slide2CronogramaGantt');
    if (containerGantt) {
      containerGantt.innerHTML = this.gerarHtmlGantt(itens);
    }

    // Sincroniza e reflete imediatamente no Slide 3
    const containerGanttDet = document.getElementById('slide3CronogramaGanttDetalhado');
    if (containerGanttDet) {
      containerGanttDet.innerHTML = this.gerarHtmlGanttDetalhado(itens);
    }
  }

    toggleExpandirEtapasGantt(idAtividade, event) {
      if (event) event.stopPropagation();
      const idStr = String(idAtividade);
      if (this.etapasExpandidasGantt.has(idStr)) {
        this.etapasExpandidasGantt.delete(idStr);
      } else {
        this.etapasExpandidasGantt.add(idStr);
      }
      const containerGanttDet = document.getElementById('slide3CronogramaGanttDetalhado');
      if (containerGanttDet) {
        containerGanttDet.innerHTML = this.gerarHtmlGanttDetalhado(this.obterItensSelecionados(false));
      }
    }

    toggleExpandirTodasEtapasGantt(expandir) {
      const itens = this.obterItensSelecionados(false);
      if (expandir) {
        itens.forEach(it => this.etapasExpandidasGantt.add(String(it.id)));
      } else {
        this.etapasExpandidasGantt.clear();
      }
      const containerGanttDet = document.getElementById('slide3CronogramaGanttDetalhado');
      if (containerGanttDet) {
        containerGanttDet.innerHTML = this.gerarHtmlGanttDetalhado(itens);
      }
    }

    gerarHtmlGanttDetalhado(itens) {
      try {
        if (!itens || itens.length === 0) {
          return `
            <div class="py-16 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl p-6">
              <i class="fa-regular fa-calendar-xmark text-2xl text-slate-300 mb-2"></i>
              <p class="text-xs">Nenhuma atividade localizada com os filtros selecionados para o cronograma detalhado.</p>
            </div>
          `;
        }

        const parseISO = (val, padraoFim = false) => {
          if (!val) return null;
          const s = String(val).trim();
          if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
            const [a, m, d] = s.slice(0, 10).split('-').map(Number);
            const dt = new Date(a, m - 1, d);
            return isNaN(dt.getTime()) ? null : dt;
          }
          if (/^\d{4}-\d{1,2}$/.test(s)) {
            const [a, m] = s.split('-').map(Number);
            const d = padraoFim ? new Date(a, m, 0).getDate() : 1;
            const dt = new Date(a, m - 1, d);
            return isNaN(dt.getTime()) ? null : dt;
          }
          if (this.ctrl && typeof this.ctrl.parseData === 'function') {
            const parsed = this.ctrl.parseData(s);
            return (parsed && !isNaN(parsed.getTime())) ? parsed : null;
          }
          const dObj = new Date(s);
          return isNaN(dObj.getTime()) ? null : dObj;
        };

        const hoje = new Date();
        let minTime = Infinity;
        let maxTime = -Infinity;
        const todasProcessadas = [];

        itens.forEach(item => {
          const dIni = parseISO(item.prazoInicio, false) || parseISO(item.etapaDataInicio, false) || parseISO(item.prazo, false) || hoje;
          const dFim = parseISO(item.prazo, true) || parseISO(item.conclusao, true) || dIni || hoje;
          const tIni = dIni.getTime();
          const tFim = dFim.getTime() >= tIni ? dFim.getTime() : tIni + 86400000;

          todasProcessadas.push({
            item,
            dIni,
            dFim,
            tIni,
            tFim,
            checado: this.atividadesGanttSelecionadas.has(String(item.id))
          });
        });

        const itensAtivos = todasProcessadas.filter(x => x.checado);
        const baseParaEscala = itensAtivos.length > 0 ? itensAtivos : todasProcessadas;
        baseParaEscala.forEach(obj => {
          if (obj.tIni < minTime) minTime = obj.tIni;
          if (obj.tFim > maxTime) maxTime = obj.tFim;
        });

        if (minTime === Infinity || maxTime === -Infinity) {
          minTime = hoje.getTime();
          maxTime = minTime + 30 * 86400 * 1000;
        }
        if (maxTime - minTime < 1000 * 60 * 60 * 24 * 30) {
          maxTime = minTime + 1000 * 60 * 60 * 24 * 30;
        }

        const dStart = new Date(minTime);
        dStart.setDate(1);
        const dEnd = new Date(maxTime);
        dEnd.setMonth(dEnd.getMonth() + 1);
        dEnd.setDate(0);
        const rangeTotal = Math.max(86400000, dEnd.getTime() - dStart.getTime());

        const mesesCabecalho = [];
        const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        let cursor = new Date(dStart.getFullYear(), dStart.getMonth(), 1);
        let iteracoesSeguranca = 0;
        while (cursor <= dEnd && iteracoesSeguranca < 48) {
          iteracoesSeguranca++;
          const mesIdx = cursor.getMonth();
          const anoNum = cursor.getFullYear();
          const inicioMes = new Date(anoNum, mesIdx, 1).getTime();
          const fimMes = new Date(anoNum, mesIdx + 1, 0, 23, 59, 59).getTime();
          const leftPct = Math.max(0, ((inicioMes - dStart.getTime()) / rangeTotal) * 100);
          const widthPct = Math.min(100 - leftPct, ((fimMes - inicioMes) / rangeTotal) * 100);
          mesesCabecalho.push({
            rotulo: `${nomesMeses[mesIdx]}/${String(anoNum).slice(2)}`,
            leftPct: leftPct.toFixed(2),
            widthPct: widthPct.toFixed(2)
          });
          cursor.setMonth(cursor.getMonth() + 1);
        }

        return `
          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-card space-y-4">
            <div class="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-indigo-700 text-white flex items-center justify-center text-xs shadow-xs">
                  <i class="fa-solid fa-code-branch"></i>
                </div>
                <div>
                  <h4 class="font-bold text-sm text-slate-900 leading-tight">Gantt com Detalhamento de Etapas</h4>
                  <p class="text-[11px] text-slate-500">
                    Exibindo <strong>${itensAtivos.length} de ${todasProcessadas.length} iniciativas</strong> (Sincronizado com o Slide 2)
                  </p>
                </div>
              </div>
              <div class="flex items-center flex-wrap gap-2">
                <button 
                  type="button" 
                  onclick="app.visaoExecutivaComponent.toggleExpandirTodasEtapasGantt(true)" 
                  class="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-2xs transition active:scale-95"
                >
                  <i class="fa-solid fa-angles-down text-[10px] text-slate-400 mr-1"></i> Expandir Todas
                </button>
                <button 
                  type="button" 
                  onclick="app.visaoExecutivaComponent.toggleExpandirTodasEtapasGantt(false)" 
                  class="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-2xs transition active:scale-95"
                >
                  <i class="fa-solid fa-angles-up text-[10px] text-slate-400 mr-1"></i> Recolher Todas
                </button>
              </div>
            </div>

            <div class="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
              <div class="flex border-b border-slate-200 bg-slate-100/90 text-[11px] font-semibold text-slate-700 select-none">
                <div class="w-64 sm:w-88 p-2.5 border-r border-slate-200 shrink-0">Iniciativa / Etapa</div>
                <div class="w-24 p-2.5 text-center border-r border-slate-200 shrink-0 hidden sm:block">Período</div>
                <div class="w-16 p-2.5 text-center border-r border-slate-200 shrink-0">Progresso</div>
                <div class="flex-1 relative h-9">
                  ${mesesCabecalho.map(m => `
                    <div 
                      style="left: ${m.leftPct}%; width: ${m.widthPct}%;" 
                      class="absolute top-0 bottom-0 border-r border-slate-200/80 flex items-center justify-center font-mono text-[10px] text-slate-600 truncate px-0.5"
                    >
                      ${m.rotulo}
                    </div>
                  `).join('')}
                </div>
              </div>

              <div class="divide-y divide-slate-200/80 bg-white">
                ${todasProcessadas.map(obj => {
                  const it = obj.item;
                  const isSelecionado = obj.checado;
                  if (!isSelecionado) return '';

                  const leftPct = Math.max(0, Math.min(97, ((obj.tIni - dStart.getTime()) / rangeTotal) * 100));
                  const rightPct = Math.max(leftPct + 3, Math.min(100, ((obj.tFim - dStart.getTime()) / rangeTotal) * 100));
                  const widthPct = Math.max(3, rightPct - leftPct);
                  const progresso = Math.min(100, Math.max(0, parseInt(it.progresso, 10) || 0));
                  const isConcluido = this.ctrl.normalizarStatus(it.status) === 'Concluído';

                  let corBarra = 'bg-blue-600';
                  if (isConcluido) corBarra = 'bg-emerald-600';
                  else if (it.status === 'Bloqueado') corBarra = 'bg-rose-500';
                  else if (it.prioridade && it.prioridade.includes('P0')) corBarra = 'bg-rose-600';

                  const dtIniStr = this.ctrl.formatarDataBR(it.prazoInicio || '');
                  const dtFimStr = this.ctrl.formatarDataBR(it.prazo || '');

                  const etapas = (it.etapasCiclo && Array.isArray(it.etapasCiclo) && it.etapasCiclo.length > 0)
                    ? it.etapasCiclo
                    : [];
                  const temEtapas = etapas.length > 0;
                  const isExpandido = this.etapasExpandidasGantt.has(String(it.id));

                  return `
                    <!-- Linha Mestre da Iniciativa -->
                    <div class="gantt-row flex items-center text-xs hover:bg-slate-50 transition border-b border-slate-100 ${isExpandido ? 'bg-slate-50/70' : ''}">
                      <div class="w-64 sm:w-88 p-2.5 border-r border-slate-200 shrink-0 flex items-center gap-2 min-w-0">
                        ${temEtapas ? `
                          <button 
                            type="button" 
                            onclick="app.visaoExecutivaComponent.toggleExpandirEtapasGantt('${this.ctrl.escapeAttrJs(it.id)}', event)"
                            class="w-5 h-5 rounded hover:bg-slate-200 text-slate-500 transition inline-flex items-center justify-center shrink-0"
                          >
                            <i class="fa-solid ${isExpandido ? 'fa-chevron-down text-indigo-600' : 'fa-chevron-right text-[10px]'}"></i>
                          </button>
                        ` : '<span class="w-5"></span>'}
                        <span class="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 shrink-0">
                          #${this.ctrl.escapeHtml(it.id)}
                        </span>
                        <span class="font-medium text-slate-900 truncate block text-[11px]" title="${this.ctrl.escapeHtml(it.titulo)}">
                          ${this.ctrl.escapeHtml(it.titulo)}
                        </span>
                        ${temEtapas ? `<span class="text-[9px] font-mono bg-slate-200/70 text-slate-600 px-1.5 py-0.2 rounded-full shrink-0">${etapas.length}</span>` : ''}
                      </div>
                      <div class="w-24 p-2 text-center font-mono text-[10px] text-slate-500 border-r border-slate-200 shrink-0 hidden sm:block">
                        <div>${dtIniStr}</div>
                        <div class="text-slate-400">até ${dtFimStr}</div>
                      </div>
                      <div class="w-16 p-2 text-center font-mono text-[11px] font-semibold border-r border-slate-200 shrink-0 ${isConcluido ? 'text-emerald-700' : 'text-slate-700'}">
                        ${progresso}%
                      </div>
                      <div class="flex-1 relative h-10 flex items-center bg-slate-50/30">
                        ${mesesCabecalho.map(m => `
                          <div style="left: ${m.leftPct}%;" class="absolute top-0 bottom-0 border-r border-slate-100 pointer-events-none"></div>
                        `).join('')}
                        <div 
                          style="left: ${leftPct.toFixed(2)}%; width: ${widthPct.toFixed(2)}%;" 
                          class="absolute z-10 h-6 rounded-md ${corBarra} text-white shadow-2xs flex items-center justify-between px-2 overflow-hidden select-none"
                        >
                          <div class="absolute inset-y-0 left-0 bg-white/20 pointer-events-none" style="width: ${progresso}%"></div>
                          <span class="text-[10px] font-medium truncate relative z-10 hidden sm:inline">${this.ctrl.escapeHtml(it.titulo)}</span>
                          <span class="text-[9px] font-mono font-bold relative z-10 ml-auto pl-1">${progresso}%</span>
                        </div>
                      </div>
                    </div>

                    <!-- Sub-linhas das Etapas (quando expandido) -->
                    ${(isExpandido && temEtapas) ? etapas.map((etapa, idxEt) => {
                      const subIni = parseISO(etapa.dataInicio || etapa.dataProgramada || it.prazoInicio, false) || obj.dIni;
                      const subFim = parseISO(etapa.dataEntrega || etapa.dataProgramada || it.prazo, true) || subIni;
                      const subTIni = subIni.getTime();
                      const subTFim = subFim.getTime() >= subTIni ? subFim.getTime() : subTIni + 86400000;

                      const sLeft = Math.max(0, Math.min(97, ((subTIni - dStart.getTime()) / rangeTotal) * 100));
                      const sRight = Math.max(sLeft + 2.5, Math.min(100, ((subTFim - dStart.getTime()) / rangeTotal) * 100));
                      const sWidth = Math.max(2.5, sRight - sLeft);

                      const isEtConcluida = Boolean(etapa.concluida || (etapa.dataEntrega && String(etapa.dataEntrega).trim() !== ''));
                      const corBarraSub = isEtConcluida ? 'bg-emerald-600' : 'bg-slate-400';
                      const dtSubIni = this.ctrl.formatarDataBR(etapa.dataInicio || etapa.dataProgramada || '');
                      const dtSubFim = this.ctrl.formatarDataBR(etapa.dataEntrega || etapa.dataProgramada || '');

                      return `
                        <div class="flex items-center text-xs bg-slate-50/60 border-b border-slate-100 hover:bg-slate-100/60 transition">
                          <div class="w-64 sm:w-88 py-1.5 pl-8 pr-2.5 border-r border-slate-200 shrink-0 flex items-center gap-1.5 min-w-0">
                            <i class="fa-solid fa-turn-down -rotate-90 text-slate-300 text-[10px] shrink-0"></i>
                            <span class="px-1.5 py-0.2 rounded text-[9px] font-semibold border ${this.ctrl.obterEstiloEtapa(etapa.nome)} shrink-0">
                              ${this.ctrl.escapeHtml(etapa.nome)}
                            </span>
                            <span class="text-[11px] text-slate-700 truncate" title="${this.ctrl.escapeHtml(etapa.titulo || etapa.nome)}">
                              ${this.ctrl.escapeHtml(etapa.titulo || etapa.nome)}
                            </span>
                          </div>
                          <div class="w-24 py-1.5 text-center font-mono text-[9px] text-slate-500 border-r border-slate-200 shrink-0 hidden sm:block">
                            ${dtSubIni} - ${dtSubFim}
                          </div>
                          <div class="w-16 py-1.5 text-center font-mono text-[10px] border-r border-slate-200 shrink-0">
                            ${isEtConcluida ? '<span class="text-emerald-700 font-bold"><i class="fa-solid fa-check text-[9px]"></i></span>' : '<span class="text-slate-400">--</span>'}
                          </div>
                          <div class="flex-1 relative h-7 flex items-center bg-slate-50/10">
                            ${mesesCabecalho.map(m => `
                              <div style="left: ${m.leftPct}%;" class="absolute top-0 bottom-0 border-r border-slate-100 pointer-events-none"></div>
                            `).join('')}
                            <div 
                              style="left: ${sLeft.toFixed(2)}%; width: ${sWidth.toFixed(2)}%;" 
                              class="absolute z-10 h-4 rounded ${corBarraSub} text-white shadow-2xs flex items-center px-1.5 text-[9px] truncate"
                              title="${this.ctrl.escapeHtml(etapa.nome)}: ${dtSubIni} até ${dtSubFim}"
                            >
                              <span class="truncate">${this.ctrl.escapeHtml(etapa.titulo || etapa.nome)}</span>
                            </div>
                          </div>
                        </div>
                      `;
                    }).join('') : ''}
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        `;
      } catch (e) {
        console.error('Erro na renderização do Gantt Detalhado:', e);
        return `<div class="p-6 text-center text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl">Ocorreu um erro ao carregar o gráfico detalhado.</div>`;
      }
    }

  calcularSpiItem(item, dataCorte = new Date()) {
    const extrairData = (valor, fimMes = false) => {
      if (!valor) return null;
      const s = String(valor).trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        const [a, m, d] = s.slice(0, 10).split('-').map(Number);
        return new Date(a, m - 1, d, 0, 0, 0); // Normalizado para 00:00:00
      }
      if (/^\d{4}-\d{1,2}$/.test(s)) {
        const [a, m] = s.split('-').map(Number);
        const d = fimMes ? new Date(a, m, 0).getDate() : 1;
        return new Date(a, m - 1, d, 0, 0, 0);
      }
      const parsed = this.ctrl.parseData(s);
      return (parsed && !isNaN(parsed.getTime())) 
        ? new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0) 
        : null;
    };

    const dIni = extrairData(item.prazoInicio, false) || extrairData(item.etapaDataInicio, false) || extrairData(item.prazo, false);
    const dFim = extrairData(item.prazo, true) || extrairData(item.conclusao, true) || dIni;
    
    // Real executado (EV)
    const ev = Math.min(100, Math.max(0, parseInt(item.progresso, 10) || 0));

    if (!dIni || !dFim) {
      return { pv: ev, ev, spi: 1.0, dIni: null, dFim: null };
    }

    // Normalização da data de corte para meia-noite (elimina variação de horário do dia)
    const dHoje = new Date(dataCorte.getFullYear(), dataCorte.getMonth(), dataCorte.getDate(), 0, 0, 0);
    
    const msPorDia = 86400000;
    const tIni = dIni.getTime();
    const tFim = dFim.getTime() >= tIni ? dFim.getTime() : tIni;
    const tHoje = dHoje.getTime();

    // Duração total em dias (inclusivo: início e fim contam)
    const diasTotais = Math.max(1, Math.round((tFim - tIni) / msPorDia) + 1);

    let pv = 0;

    if (tHoje < tIni) {
      // Ainda não começou
      pv = 0;
    } else if (tHoje >= tFim) {
      // Prazo expirado ou encerrado hoje
      pv = 100;
    } else {
      // Dias decorridos desde o início até hoje (inclusivo)
      const diasDecorridos = Math.max(1, Math.round((tHoje - tIni) / msPorDia) + 1);
      pv = Math.min(100, Math.max(0, Math.round((diasDecorridos / diasTotais) * 100)));
    }

    // Cálculo do SPI (Índice de Desempenho de Prazo = EV / PV)
    let spi = 1.0;
    if (pv === 0) {
      spi = ev > 0 ? 1.2 : 1.0;
    } else {
      spi = parseFloat((ev / pv).toFixed(2));
    }

    return { pv, ev, spi, dIni, dFim };
  }

  calcularMetricas(itens) {
    const total = itens.length;
    const concluidas = itens.filter(x => this.ctrl.normalizarStatus(x.status) === 'Concluído').length;
    const emAndamento = itens.filter(x => this.ctrl.normalizarStatus(x.status) === 'Em Andamento').length;
    const revisao = itens.filter(x => this.ctrl.normalizarStatus(x.status) === 'Em Revisão').length;
    const naoIniciadas = itens.filter(x => this.ctrl.normalizarStatus(x.status) === 'Não iniciado').length;
    const criticasP0P1 = itens.filter(x => {
      const p = String(x.prioridade || '');
      const s = this.ctrl.normalizarStatus(x.status);
      return (p.includes('P0') || p.includes('P1')) && s !== 'Concluído';
    });
    const hoje = new Date();
    const dataHojeBR = this.ctrl.formatarDataBR(window.DataUtils ? window.DataUtils.obterDataHojeISO() : hoje.toISOString().slice(0, 10));
    let somaEV = 0;
    let somaPV = 0;
    itens.forEach(item => {
      const { pv, ev } = this.calcularSpiItem(item, hoje);
      somaPV += pv;
      somaEV += ev;
    });
    const progressoMedioReal = total > 0 ? Math.round(somaEV / total) : 0;
    const progressoPlanejadoMedio = total > 0 ? Math.round(somaPV / total) : 0;
    let spiGeral = 1.0;
    if (progressoPlanejadoMedio > 0) {
      spiGeral = parseFloat((progressoMedioReal / progressoPlanejadoMedio).toFixed(2));
    } else if (progressoMedioReal > 0) {
      spiGeral = 1.1;
    }
    const idsItens = new Set(itens.map(x => String(x.id)));
    const todosAtrasos = typeof this.ctrl?.obterDadosAtividadesForaDoPrazo === 'function'
      ? this.ctrl.obterDadosAtividadesForaDoPrazo()
      : [];
    const atrasosDesteGrupo = todosAtrasos.filter(a => idsItens.has(String(a.atividadeId)));
    let totalEtapasConcluidasAteHoje = 0;
    itens.forEach(item => {
      const isItemConcluido = this.ctrl.normalizarStatus(item.status) === 'Concluído' || parseInt(item.progresso, 10) === 100;
      const etapas = item.etapasCiclo && Array.isArray(item.etapasCiclo) ? item.etapasCiclo : [];
      if (etapas.length > 0) {
        etapas.forEach(et => {
          const concluida = Boolean(et.concluida || (et.dataEntrega && String(et.dataEntrega).trim() !== ''));
          if (concluida) totalEtapasConcluidasAteHoje++;
        });
      } else if (isItemConcluido) {
        totalEtapasConcluidasAteHoje++;
      }
    });
    

    // --- REALIZAÇÕES ---
    const realizacoes = [];
    const dFiltroInicio = this.filtroDataInicioExec ? new Date(`${this.filtroDataInicioExec}T00:00:00`) : null;
    const dFiltroFim = this.filtroDataFimExec ? new Date(`${this.filtroDataFimExec}T23:59:59`) : null;

    // Helper para converter qualquer formato de data (ISO, YYYY-MM, DD/MM/AAAA)
    const extrairDataConclusao = (valor) => {
      if (!valor) return null;
      const s = String(valor).trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        const [a, m, d] = s.slice(0, 10).split('-').map(Number);
        return new Date(a, m - 1, d, 23, 59, 59);
      }
      if (/^\d{4}-\d{1,2}$/.test(s)) {
        const [a, m] = s.split('-').map(Number);
        const d = new Date(a, m, 0).getDate();
        return new Date(a, m - 1, d, 23, 59, 59);
      }
      const d = this.ctrl.parseData(s);
      return (d && !isNaN(d.getTime())) ? d : null;
    };

    // Filtra APENAS atividades que foram concluídas DENTRO do período selecionado
    const concluidasNoPeriodo = itens.filter(x => {
      const isConcluido = this.ctrl.normalizarStatus(x.status) === 'Concluído' || parseInt(x.progresso, 10) === 100;
      if (!isConcluido) return false;

      // Se houver filtro de datas, valida rigorosamente se a conclusão ocorreu no período
      if (dFiltroInicio || dFiltroFim) {
        // Busca a data real em que a atividade terminou (conclusão geral ou última etapa finalizada)
        let dtRaw = x.conclusao || x.etapaFim || '';
        if (!dtRaw && x.etapasCiclo && Array.isArray(x.etapasCiclo)) {
          const etapasComData = x.etapasCiclo.filter(e => e.dataEntrega);
          if (etapasComData.length > 0) {
            dtRaw = etapasComData[etapasComData.length - 1].dataEntrega;
          }
        }
        if (!dtRaw) dtRaw = x.prazo; // fallback

        const dConc = extrairDataConclusao(dtRaw);
        if (dConc) {
          if (dFiltroInicio && dConc < dFiltroInicio) return false;
          if (dFiltroFim && dConc > dFiltroFim) return false;
        }
      }
      return true;
    });

    // Ordena as concluídas mais recentes primeiro
    concluidasNoPeriodo.sort((a, b) => {
      const dtA = a.conclusao || a.etapaFim || a.prazo || '';
      const dtB = b.conclusao || b.etapaFim || b.prazo || '';
      return dtB.localeCompare(dtA);
    });

    if (total > 0 && concluidasNoPeriodo.length > 0) {
      const taxaConclusaoGeral = Math.round((concluidasNoPeriodo.length / total) * 100);
      
      // Bullets de destaques continuam existindo
      let bulletsRealizacoes = [];
      const temFiltroDataAtivo = Boolean(this.filtroDataInicioExec || this.filtroDataFimExec);
      
      if (!temFiltroDataAtivo && this.entregaBulletsCustomizados !== null && Array.isArray(this.entregaBulletsCustomizados)) {
        bulletsRealizacoes = this.entregaBulletsCustomizados;
      } else {
        bulletsRealizacoes = concluidasNoPeriodo.slice(0, 4).map(it => {
          let dtConclusaoRaw = it.conclusao || it.etapaFim || '';
          if (!dtConclusaoRaw && it.etapasCiclo && Array.isArray(it.etapasCiclo)) {
            const ets = it.etapasCiclo.filter(e => e.dataEntrega);
            if (ets.length > 0) dtConclusaoRaw = ets[ets.length - 1].dataEntrega;
          }
          const dtConclusao = dtConclusaoRaw ? this.ctrl.formatarDataBR(dtConclusaoRaw) : 'Data não informada';
          return {
            id: it.id,
            titulo: it.titulo,
            dataConclusao: dtConclusao
          };
        });
      }

      const rotuloPeriodo = (this.filtroDataInicioExec && this.filtroDataFimExec)
        ? `${this.ctrl.formatarDataBR(this.filtroDataInicioExec)} a ${this.ctrl.formatarDataBR(this.filtroDataFimExec)}`
        : `Até ${dataHojeBR}`;

      realizacoes.push({
        subtitulo: 'Entregas no período', 
        prazoFormatado: rotuloPeriodo,
        itensDestaque: bulletsRealizacoes,
        badgeTexto: `${concluidasNoPeriodo.length} Concluída(s) (${taxaConclusaoGeral}%)`
      });
    }

    // --- PRÓXIMOS PASSOS ---
    const pendentes = itens.filter(x => {
      const isConcluido = this.ctrl.normalizarStatus(x.status) === 'Concluído' || parseInt(x.progresso, 10) === 100;
      return !isConcluido;
    });

    let totalEtapasFuturas = 0;
    let prazosFuturos = [];
    pendentes.forEach(item => {
      const etapas = item.etapasCiclo && Array.isArray(item.etapasCiclo) ? item.etapasCiclo : [];
      const pendentesEt = etapas.filter(e => !e.concluida && !(e.dataEntrega && String(e.dataEntrega).trim() !== ''));
      if (pendentesEt.length > 0) {
        totalEtapasFuturas += pendentesEt.length;
        pendentesEt.forEach(e => {
          if (e.dataProgramada) prazosFuturos.push(e.dataProgramada);
        });
      } else {
        totalEtapasFuturas += 1;
        if (item.prazo) prazosFuturos.push(item.prazo);
      }
    });

    let proximaDataLimiteFormatada = 'A definir';
    if (prazosFuturos.length > 0) {
      prazosFuturos.sort();
      proximaDataLimiteFormatada = this.ctrl.formatarDataBR(prazosFuturos[0]);
    }

    const proximosPassos = [];
    if (pendentes.length > 0) {
      const textoPadraoProximos = `A partir da presente data (${dataHojeBR}), o portfólio contempla ${pendentes.length} iniciativa(s) ativas com ${totalEtapasFuturas} marco(s) e etapa(s) de homologação, desenvolvimento e deploy planejados, tendo a próxima entrega prevista para ${proximaDataLimiteFormatada}.`;
      const resumoProximosFinal = this.proximosPassosCustomizados !== null
        ? this.proximosPassosCustomizados
        : textoPadraoProximos;

      let bulletsProximos = [];
      if (this.proximosBulletsCustomizados !== null && Array.isArray(this.proximosBulletsCustomizados)) {
        bulletsProximos = this.proximosBulletsCustomizados;
      } else {
        // DATA DE CORTE PARA AVALIAÇÃO DE ATRASO:
        // Usa a data final do filtro se estiver preenchida; senão usa hoje (zerando as horas)
        let dataLimiteComparacao = new Date();
        dataLimiteComparacao.setHours(0, 0, 0, 0);

        if (this.filtroDataFimExec) {
          const [aFim, mFim, dFim] = this.filtroDataFimExec.split('-').map(Number);
          dataLimiteComparacao = new Date(aFim, mFim - 1, dFim, 0, 0, 0);
        }

        const parseDataPrazo = (valor) => {
          if (!valor) return null;
          const s = String(valor).trim();
          if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
            const [a, m, d] = s.slice(0, 10).split('-').map(Number);
            return new Date(a, m - 1, d, 0, 0, 0);
          }
          if (/^\d{4}-\d{1,2}$/.test(s)) {
            const [a, m] = s.split('-').map(Number);
            const d = new Date(a, m, 0).getDate();
            return new Date(a, m - 1, d, 0, 0, 0);
          }
          const d = this.ctrl.parseData(s);
          return (d && !isNaN(d.getTime())) ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0) : null;
        };

        const itensComAtraso = [];
        const itensRegulares = [];

        pendentes.forEach(it => {
          // Obtém a data programada da etapa em aberto ou da atividade geral
          let dtProgRaw = '';
          if (it.etapasCiclo && Array.isArray(it.etapasCiclo)) {
            const etapaPendente = it.etapasCiclo.find(e => !e.concluida && !(e.dataEntrega && String(e.dataEntrega).trim() !== ''));
            if (etapaPendente && etapaPendente.dataProgramada) {
              dtProgRaw = etapaPendente.dataProgramada;
            }
          }
          if (!dtProgRaw) {
            dtProgRaw = it.prazo || it.etapaInicio || '';
          }

          const dPrazo = parseDataPrazo(dtProgRaw);

          // REGRA DE ATRASO:
          // Atrasada APENAS se a data programada for menor que a data de corte do período
          const estaRealmenteAtrasada = Boolean(dPrazo && dPrazo < dataLimiteComparacao);

          if (estaRealmenteAtrasada) {
            itensComAtraso.push({ item: it, dtPrazo: dPrazo, atrasada: true });
          } else {
            itensRegulares.push({ item: it, dtPrazo: dPrazo, atrasada: false });
          }
        });

        // Ordena as atrasadas da mais antiga para a mais recente
        itensComAtraso.sort((a, b) => {
          const tA = a.dtPrazo ? a.dtPrazo.getTime() : 0;
          const tB = b.dtPrazo ? b.dtPrazo.getTime() : 0;
          return tA - tB;
        });

        // Ordena as regulares pelas mais próximas de vencer
        itensRegulares.sort((a, b) => {
          const tA = a.dtPrazo ? a.dtPrazo.getTime() : Infinity;
          const tB = b.dtPrazo ? b.dtPrazo.getTime() : Infinity;
          return tA - tB;
        });

        // Seleciona as 4 principais combinando atrasadas + regulares mais próximas
        const selecionadas = [...itensComAtraso, ...itensRegulares].slice(0, 4);

        bulletsProximos = selecionadas.map(obj => {
          const it = obj.item || obj;

          // 1. Busca o responsável: primeiro na etapa ativa pendente, depois no mestre da atividade
          let respEncontrado = '';
          if (it.etapasCiclo && Array.isArray(it.etapasCiclo)) {
            const etapaPendente = it.etapasCiclo.find(e => !e.concluida && !(e.dataEntrega && String(e.dataEntrega).trim() !== ''));
            if (etapaPendente && etapaPendente.responsavel && String(etapaPendente.responsavel).trim() !== '') {
              respEncontrado = etapaPendente.responsavel;
            }
          }
          if (!respEncontrado && it.responsavel && String(it.responsavel).trim() !== '' && it.responsavel !== 'Não Atribuído') {
            respEncontrado = it.responsavel;
          }
          if (!respEncontrado && it.desenvolvedor) {
            respEncontrado = it.desenvolvedor;
          }

          // 2. Busca a data programada: da etapa pendente ou do prazo geral
          let dtProgRaw = '';
          if (it.etapasCiclo && Array.isArray(it.etapasCiclo)) {
            const etapaPendente = it.etapasCiclo.find(e => !e.concluida && !(e.dataEntrega && String(e.dataEntrega).trim() !== ''));
            if (etapaPendente && etapaPendente.dataProgramada) {
              dtProgRaw = etapaPendente.dataProgramada;
            }
          }
          if (!dtProgRaw) {
            dtProgRaw = it.prazo || it.etapaInicio || '';
          }
          const dtProgramada = dtProgRaw ? this.ctrl.formatarDataBR(dtProgRaw) : 'A definir';

          return {
            id: it.id,
            titulo: it.titulo,
            responsavel: respEncontrado || 'Não informado',
            dataProgramada: dtProgramada,
            atrasado: Boolean(obj.atrasada)
          };
        });
      }

      proximosPassos.push({
        subtitulo: `Planejamento a partir de ${dataHojeBR}`,
        prazoFormatado: `Início em ${proximaDataLimiteFormatada}`,
        resumo: resumoProximosFinal,
        itensDestaque: bulletsProximos,
        badgeTexto: `${pendentes.length} Pendentes (${totalEtapasFuturas} Etapas)`
      });
    }

    const riscos = [];
    if (this.incluirRiscosAtraso) {
      atrasosDesteGrupo.forEach(at => {
        if (!riscos.some(r => r.iniciativa === at.atividadeTitulo)) {
          riscos.push({
            id: `atraso_${at.atividadeId}_${at.etapaIndex}`,
            categoria: 'Risco',
            impacto: at.prioridade?.includes('P0') ? 'Alto' : 'Médio',
            iniciativa: at.atividadeTitulo,
            motivo: `Etapa "${at.etapaNome}" com ${at.diasAtraso} dias de atraso. ${at.obsEtapa || ''}`,
            responsavel: at.responsavel,
            prazo: at.dataProgramadaFormatada || '--',
            tipo: 'ATRASO DE PRAZO'
          });
        }
      });
    }
    this.riscosCustomizados.forEach(rc => riscos.push(rc));
    let statusGeral = { 
      texto: 'No Prazo', 
      cor: 'text-emerald-600', 
      bg: 'bg-emerald-600', 
      classeBox: 'border-emerald-300 bg-emerald-50/20' 
    };
    let cardCronogramaBg = 'bg-emerald-600 text-white';

    const temRiscoAlto = riscos.some(r => String(r.impacto || '').toLowerCase() === 'alto');

    if (spiGeral < 0.85 || temRiscoAlto) {
      statusGeral = { 
        texto: 'Em Risco', 
        cor: 'text-rose-600', 
        bg: 'bg-rose-600', 
        classeBox: 'border-rose-300 bg-rose-50/20' 
      };
      cardCronogramaBg = 'bg-rose-600 text-white';
    } else if (spiGeral < 0.95) {
      statusGeral = { 
        texto: 'Em Atenção', 
        cor: 'text-amber-600', 
        bg: 'bg-amber-500', 
        classeBox: 'border-amber-300 bg-amber-50/20' 
      };
      cardCronogramaBg = 'bg-amber-500 text-white';
    } else if (spiGeral >= 1.08 && progressoMedioReal > progressoPlanejadoMedio) {
      // NOVO: Detecta que o Real está acima do Planejado (Ex: 56% vs 46%)
      statusGeral = { 
        texto: 'Adiantado', 
        cor: 'text-indigo-600', 
        bg: 'bg-indigo-600', 
        classeBox: 'border-indigo-300 bg-indigo-50/20' 
      };
      cardCronogramaBg = 'bg-indigo-600 text-white';
    } else {
      statusGeral = { 
        texto: 'No Prazo', 
        cor: 'text-emerald-600', 
        bg: 'bg-emerald-600', 
        classeBox: 'border-emerald-300 bg-emerald-50/20' 
      };
      cardCronogramaBg = 'bg-emerald-600 text-white';
    }
    return {
      total,
      concluidas,
      emAndamento,
      revisao,
      naoIniciadas,
      progressoMedio: progressoMedioReal,
      progressoPlanejadoMedio,
      spiGeral,
      criticasP0P1,
      atrasos: atrasosDesteGrupo,
      statusGeral,
      cardCronogramaBg,
      realizacoes: realizacoes.slice(0, 1),
      proximosPassos: proximosPassos.slice(0, 1),
      riscos
    };
  }

  alternarEdicaoEntregaConsolidada(abrir) {
    this.editandoEntregaConsolidada = abrir;
    this.renderizarApresentacao();
  }

  salvarEdicaoEntregaConsolidada(novoBulletsTexto) {
    const bulletsLimpos = String(novoBulletsTexto || '')
    .split('\n')
    .map(linha => linha.replace(/^[-*•]\s*/, '').trim())
    .filter(Boolean)
    .map(linha => {
      // Suporta formato "Titulo | Data" ou apenas texto direto
      if (linha.includes('|')) {
        const [titulo, data] = linha.split('|').map(p => p.trim());
        return { titulo, dataConclusao: data };
      }
      return { titulo: linha, dataConclusao: '' };
    });

    this.entregaBulletsCustomizados = bulletsLimpos;
    this.salvarEntregaBulletsNoStorage(bulletsLimpos);
    this.editandoEntregaConsolidada = false;
    this.renderizarApresentacao();
    this.ctrl.exibirToast('Entregas do período atualizadas!', 'sucesso');
  }

  salvarEdicaoProximosPassos(novoBulletsTexto) {
    const bulletsLimpos = String(novoBulletsTexto || '')
    .split('\n')
    .map(linha => linha.replace(/^[-*•]\s*/, '').trim())
    .filter(Boolean)
    .map(linha => {
      // Suporta formato "Titulo | Responsável / Data" ou apenas texto direto
      if (linha.includes('|')) {
        const [titulo, info] = linha.split('|').map(p => p.trim());
        return { titulo, responsavel: info, dataProgramada: '' };
      }
      return { titulo: linha, responsavel: '', dataProgramada: '' };
    });

    this.proximosBulletsCustomizados = bulletsLimpos;
    this.salvarProximosBulletsNoStorage(bulletsLimpos);
    this.editandoProximosPassos = false;
    this.renderizarApresentacao();
    this.ctrl.exibirToast('Próximos passos atualizados!', 'sucesso');
  }

  restaurarEntregaConsolidadaPadrao() {
    this.entregaConsolidadaCustomizada = null;
    this.entregaBulletsCustomizados = null;
    this.salvarEntregaNoStorage(null);
    this.salvarEntregaBulletsNoStorage(null);
    this.editandoEntregaConsolidada = false;
    this.renderizarApresentacao();
    this.ctrl.exibirToast('Entregas e bullets recalculados pelo sistema!', 'info');
  }

  alternarEdicaoProximosPassos(abrir) {
    this.editandoProximosPassos = abrir;
    this.renderizarApresentacao();
  }

  salvarEdicaoProximosPassos(novoTexto, novoBulletsTexto) {
    const textoLimpo = String(novoTexto || '').trim();
    if (!textoLimpo) {
      this.ctrl.exibirToast('O texto dos próximos passos não pode ser vazio.', 'erro');
      return;
    }
    const bulletsLimpos = String(novoBulletsTexto || '')
      .split('\n')
      .map(linha => linha.replace(/^[-*•]\s*/, '').trim())
      .filter(Boolean);

    this.proximosPassosCustomizados = textoLimpo;
    this.proximosBulletsCustomizados = bulletsLimpos;

    this.salvarProximosPassosNoStorage(textoLimpo);
    this.salvarProximosBulletsNoStorage(bulletsLimpos);

    this.editandoProximosPassos = false;
    this.renderizarApresentacao();
    this.ctrl.exibirToast('Próximos passos e bullets salvos com sucesso!', 'sucesso');
  }

  restaurarProximosPassosPadrao() {
    this.proximosPassosCustomizados = null;
    this.proximosBulletsCustomizados = null;
    this.salvarProximosPassosNoStorage(null);
    this.salvarProximosBulletsNoStorage(null);
    this.editandoProximosPassos = false;
    this.renderizarApresentacao();
    this.ctrl.exibirToast('Próximos passos recalculados pelo sistema!', 'info');
  }

  carregarOverviewSalvo() {
    try {
      const salvo = localStorage.getItem(this.CHAVE_STORAGE_OVERVIEW);
      return salvo && salvo.trim() !== '' ? salvo : null;
    } catch (e) {
      return null;
    }
  }

  salvarOverviewNoStorage(texto) {
    try {
      if (texto !== null && texto !== undefined) {
        localStorage.setItem(this.CHAVE_STORAGE_OVERVIEW, texto);
      } else {
        localStorage.removeItem(this.CHAVE_STORAGE_OVERVIEW);
      }
    } catch (e) {}
  }

  alternarEdicaoOverview(abrir) {
    this.editandoOverview = abrir;
    this.renderizarApresentacao();
  }

  salvarEdicaoOverview(novoTexto) {
    const textoLimpo = String(novoTexto || '').trim();
    if (!textoLimpo) {
      this.ctrl.exibirToast('O resumo executivo não pode ser vazio.', 'erro');
      return;
    }
    this.overviewCustomizado = textoLimpo;
    this.salvarOverviewNoStorage(textoLimpo);
    this.editandoOverview = false;
    this.renderizarApresentacao();
    this.ctrl.exibirToast('Resumo executivo atualizado com sucesso!', 'sucesso');
  }

  restaurarOverviewPadrao() {
    this.overviewCustomizado = null;
    this.salvarOverviewNoStorage(null);
    this.editandoOverview = false;
    this.renderizarApresentacao();
    this.ctrl.exibirToast('Resumo executivo restaurado para o cálculo automático!', 'info');
  }

  alternarInclusaoAtrasos(checado) {
    this.incluirRiscosAtraso = checado;
    if (this.emModoApresentacao) {
      this.renderizarApresentacao();
    }
  }

  iniciarEdicaoRisco(riscoId) {
    const item = this.riscosCustomizados.find(r => String(r.id) === String(riscoId));
    if (!item) return;
    this.idRiscoEmEdicao = riscoId;
    const form = document.getElementById('formNovoRiscoExec');
    if (form) form.classList.remove('hidden');
    const selCat = document.getElementById('inputRiscoCategoria');
    const inputIni = document.getElementById('inputRiscoIniciativa');
    const inputMot = document.getElementById('inputRiscoMotivo');
    const selImp = document.getElementById('inputRiscoImpacto');
    const inputDataFinal = document.getElementById('inputRiscoDataFinal');
    const btnSalvar = document.getElementById('btnSalvarRiscoExec');
    const btnCancelar = document.getElementById('btnCancelarEdicaoRisco');
    if (selCat) selCat.value = item.categoria || 'Ponto de Atenção';
    if (inputIni) inputIni.value = item.iniciativa || '';
    if (inputMot) inputMot.value = item.motivo || '';
    if (selImp) selImp.value = item.impacto || 'Médio';
    if (inputDataFinal) {
      if (item.dataFinalOriginal) {
        inputDataFinal.value = item.dataFinalOriginal;
      } else if (item.prazo && /^\d{4}-\d{2}-\d{2}/.test(item.prazo)) {
        inputDataFinal.value = item.prazo;
      } else {
        const d = this.ctrl.parseData(item.prazo);
        if (d && !isNaN(d.getTime())) {
          const ano = d.getFullYear();
          const mes = String(d.getMonth() + 1).padStart(2, '0');
          const dia = String(d.getDate()).padStart(2, '0');
          inputDataFinal.value = `${ano}-${mes}-${dia}`;
        } else {
          inputDataFinal.value = '';
        }
      }
    }
    if (btnSalvar) {
      btnSalvar.innerText = 'Atualizar';
      btnSalvar.className = 'sm:col-span-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition';
    }
    if (btnCancelar) btnCancelar.classList.remove('hidden');
    inputIni?.focus();
  }

  cancelarEdicaoRisco() {
    this.idRiscoEmEdicao = null;
    this.limparFormularioRisco();
    const btnCancelar = document.getElementById('btnCancelarEdicaoRisco');
    if (btnCancelar) btnCancelar.classList.add('hidden');
    document.getElementById('formNovoRiscoExec')?.classList.add('hidden');
  }

  limparFormularioRisco() {
    const selCat = document.getElementById('inputRiscoCategoria');
    const inputIni = document.getElementById('inputRiscoIniciativa');
    const inputMot = document.getElementById('inputRiscoMotivo');
    const selImp = document.getElementById('inputRiscoImpacto');
    const inputDataFinal = document.getElementById('inputRiscoDataFinal');
    const btnSalvar = document.getElementById('btnSalvarRiscoExec');
    if (selCat) selCat.value = 'Ponto de Atenção';
    if (inputIni) inputIni.value = '';
    if (inputMot) inputMot.value = '';
    if (selImp) selImp.value = 'Médio';
    if (inputDataFinal) inputDataFinal.value = '';
    if (btnSalvar) {
      btnSalvar.innerText = 'Salvar';
      btnSalvar.className = 'sm:col-span-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs transition';
    }
  }

  salvarRiscoManual(categoria, iniciativa, motivo, impacto, dataFinal) {
    if (!motivo || !iniciativa) {
      this.ctrl.exibirToast('Informe ao menos o título e a descrição.', 'erro');
      return;
    }
    let prazoExibicao = '--';
    if (dataFinal) {
      prazoExibicao = this.ctrl.formatarDataBR(dataFinal);
    }
    const catFormatada = categoria || 'Ponto de Atenção';
    if (this.idRiscoEmEdicao) {
      const index = this.riscosCustomizados.findIndex(r => String(r.id) === String(this.idRiscoEmEdicao));
      if (index !== -1) {
        this.riscosCustomizados[index] = {
          ...this.riscosCustomizados[index],
          categoria: catFormatada,
          iniciativa,
          motivo,
          impacto: impacto || 'Médio',
          prazo: prazoExibicao,
          dataFinalOriginal: dataFinal || ''
        };
        this.ctrl.exibirToast(`${catFormatada} atualizado com sucesso!`, 'sucesso');
      }
      this.idRiscoEmEdicao = null;
    } else {
      const novoRisco = {
        id: `custom_${Date.now()}`,
        categoria: catFormatada,
        iniciativa,
        motivo,
        impacto: impacto || 'Médio',
        tipo: catFormatada.toUpperCase(),
        prazo: prazoExibicao,
        dataFinalOriginal: dataFinal || '',
        responsavel: 'Equipe'
      };
      this.riscosCustomizados.push(novoRisco);
      this.ctrl.exibirToast(`${catFormatada} adicionado!`, 'sucesso');
    }
    this.renderizarApresentacao();
  }

  removerRisco(identificador) {
    const idStr = String(identificador);
    this.riscosCustomizados = this.riscosCustomizados.filter(r => String(r.id) !== idStr);
    if (String(this.idRiscoEmEdicao) === idStr) {
      this.idRiscoEmEdicao = null;
    }
    this.renderizarApresentacao();
    this.ctrl.exibirToast('Item removido.', 'info');
  }

  renderizarTelaSelecao() {
    const container = document.getElementById('conteudoCorpoVisaoExecutiva');
    const headerSub = document.getElementById('subtituloModalVisaoExecutiva');
    if (!container) return;
    if (headerSub) {
      headerSub.innerText = 'Selecione a Cadeia de Valor, as frentes, o status do Gantt e o modelo visual de apresentação';
    }
    const listaMacros = this.obterListaCadeiasDeValor();
    const listaStatus = this.obterListaStatusConfigurados();
    const frentesExibidas = this.obterFrentesFiltradas();
    const frentesAtivas = this.obterFrentesAtivasNaApresentacao();
    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-5 py-2">
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h4 class="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs shadow-2xs">1</span>
                <span>Cadeia de Valor, Frentes & Filtros</span>
              </h4>
              <p class="text-[11px] text-slate-500 mt-0.5">O filtro de status reflete no Slide 2 (Gantt) sem alterar os indicadores globais do Slide 1</p>
            </div>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 font-mono">
              ${frentesAtivas.length} frente(s) ativa(s)
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
            <!-- 1. Cadeia de Valor (4 Colunas) -->
            <div class="sm:col-span-4">
              <label class="block text-[11px] font-semibold text-slate-600 mb-1">
                <i class="fa-solid fa-diagram-project text-indigo-600 mr-1"></i> Cadeia de Valor:
              </label>
              <select 
                id="selFiltroMacroVisaoExecutiva" 
                onchange="app.visaoExecutivaComponent.aoMudarFiltroMacro(this.value)"
                class="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer shadow-2xs transition"
              >
                <option value="">Todas as Cadeias de Valor</option>
                ${listaMacros.map(m => `
                  <option value="${this.ctrl.escapeHtml(m)}" ${m.toLowerCase() === this.filtroMacroCadeia.toLowerCase() ? 'selected' : ''}>
                    ${this.ctrl.escapeHtml(m)}
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- 2. Filtro de Status (4 Colunas) -->
            <div class="sm:col-span-4">
              <label class="block text-[11px] font-semibold text-slate-600 mb-1">
                <i class="fa-solid fa-layer-group text-emerald-600 mr-1"></i> Status (Slide 2 Gantt):
              </label>
              <select 
                id="selFiltroStatusVisaoExecutiva" 
                onchange="app.visaoExecutivaComponent.aoMudarFiltroStatus(this.value)"
                class="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer shadow-2xs transition"
              >
                <option value="">Todos os Status</option>
                ${listaStatus.map(st => `
                  <option value="${this.ctrl.escapeHtml(st)}" ${st.toLowerCase() === this.filtroStatusExec.toLowerCase() ? 'selected' : ''}>
                    ${this.ctrl.escapeHtml(st)}
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- 3. Filtro de Período com Datas Folgadas (4 Colunas) -->
            <div class="sm:col-span-4">
              <label class="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
                <span><i class="fa-regular fa-calendar text-slate-500 mr-1"></i> Período:</span>
                ${(this.filtroDataInicioExec || this.filtroDataFimExec) ? `
                  <button type="button" onclick="app.visaoExecutivaComponent.limparFiltroDatasExec()" class="text-[10px] text-rose-600 hover:underline cursor-pointer">Limpar</button>
                ` : ''}
              </label>
              <div class="flex items-center gap-1.5">
                <input 
                  type="date" 
                  id="filtroDataInicioExec" 
                  value="${this.filtroDataInicioExec}" 
                  onchange="app.visaoExecutivaComponent.aoMudarDataInicio(this.value)"
                  class="w-1/2 px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none font-mono text-slate-700 shadow-2xs focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  title="Data Início"
                >
                <span class="text-slate-400 text-[11px] select-none">até</span>
                <input 
                  type="date" 
                  id="filtroDataFimExec" 
                  value="${this.filtroDataFimExec}" 
                  onchange="app.visaoExecutivaComponent.aoMudarDataFim(this.value)"
                  class="w-1/2 px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none font-mono text-slate-700 shadow-2xs focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  title="Data Fim"
                >
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between pt-1">
            <span class="text-xs text-slate-500 font-medium">Frentes do portfólio:</span>
            <div class="flex items-center gap-1.5">
              <button 
                type="button" 
                onclick="app.visaoExecutivaComponent.selecionarFrentesVisiveis(true)" 
                class="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold text-indigo-700 transition active:scale-95 shadow-2xs cursor-pointer"
              >
                Marcar Todas
              </button>
              <button 
                type="button" 
                onclick="app.visaoExecutivaComponent.selecionarFrentesVisiveis(false)" 
                class="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-600 transition active:scale-95 shadow-2xs cursor-pointer"
              >
                Limpar
              </button>
            </div>
          </div>

          ${frentesExibidas.length === 0 ? `
            <div class="py-8 text-center text-slate-400 space-y-1 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <i class="fa-solid fa-filter-circle-xmark text-xl text-slate-300"></i>
              <div class="text-xs font-semibold text-slate-700">Nenhuma frente com iniciativas ativas</div>
              <p class="text-[11px] text-slate-500">Tente selecionar outra Cadeia de Valor ou ajustar a busca.</p>
            </div>
          ` : `
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
              ${frentesExibidas.map(frente => {
                const checado = this.cadeiasSelecionadas.has(frente);
                const itensFrente = this.obterItensCadeia(frente, true);
                const macroPai = this.obterMacroDaFrente(frente);
                return `
                  <label class="flex items-center justify-between p-2.5 rounded-xl border ${checado ? 'border-indigo-300 bg-indigo-50/30 ring-1 ring-indigo-200' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer select-none transition">
                    <span class="flex items-center gap-2 min-w-0 flex-1">
                      <input 
                        type="checkbox" 
                        value="${this.ctrl.escapeAttrJs(frente)}" 
                        ${checado ? 'checked' : ''} 
                        onchange="app.visaoExecutivaComponent.aoAlternarCadeia('${this.ctrl.escapeAttrJs(frente)}', this.checked)"
                        class="rounded text-indigo-600 focus:ring-0 cursor-pointer h-4 w-4 shrink-0"
                      >
                      <span class="min-w-0">
                        <span class="text-xs font-semibold text-slate-800 truncate block">${this.ctrl.escapeHtml(frente)}</span>
                        ${macroPai ? `<span class="text-[10px] text-slate-400 truncate block">${this.ctrl.escapeHtml(macroPai)}</span>` : ''}
                      </span>
                    </span>
                    <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0 ml-1.5">
                      ${itensFrente.length}
                    </span>
                  </label>
                `;
              }).join('')}
            </div>
          `}
        </div>

        <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-slate-800 text-xs flex items-center gap-2">
              <i class="fa-solid fa-triangle-exclamation text-amber-500"></i> Riscos e Pontos de Atenção
            </span>
          </div>
          <div class="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            <input 
              type="checkbox" 
              id="chkIncluirAtrasosExec" 
              ${this.incluirRiscosAtraso ? 'checked' : ''} 
              onchange="app.visaoExecutivaComponent.alternarInclusaoAtrasos(this.checked)"
              class="rounded text-amber-600 focus:ring-0 cursor-pointer h-4 w-4"
            >
            <label for="chkIncluirAtrasosExec" class="text-xs text-slate-700 cursor-pointer font-medium select-none">
              Incluir automaticamente iniciativas com atraso de prazo como Riscos / Pontos de Atenção
            </label>
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div>
            <h4 class="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs shadow-2xs">2</span>
              <span>Escolha o Formato da Apresentação</span>
            </h4>
            <p class="text-[11px] text-slate-500 mt-0.5">Selecione o formato para a reunião ou diretoria</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div 
              onclick="app.visaoExecutivaComponent.selecionarModelo('modeloA')"
              class="border-2 rounded-2xl p-4 cursor-pointer transition select-none flex flex-col justify-between ${this.modeloSelecionado === 'modeloA' ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-500/10' : 'border-slate-200 hover:border-slate-300 bg-white'}"
            >
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-xs">
                    <i class="fa-solid fa-film"></i> Modelo A
                  </span>
                  <span class="w-4 h-4 rounded-full border-2 ${this.modeloSelecionado === 'modeloA' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'} flex items-center justify-center">
                    ${this.modeloSelecionado === 'modeloA' ? '<span class="w-1.5 h-1.5 rounded-full bg-white"></span>' : ''}
                  </span>
                </div>
                <h5 class="font-bold text-slate-900 text-sm">Apresentação de Slides (Slide-by-Slide)</h5>
                <p class="text-xs text-slate-500 leading-relaxed">
                  Ideal para <strong>projeção e reuniões</strong>. Apresenta o consolidado e permite navegar individualmente por cada frente selecionada.
                </p>
              </div>
            </div>

            <div 
              onclick="app.visaoExecutivaComponent.selecionarModelo('modeloB')"
              class="border-2 rounded-2xl p-4 cursor-pointer transition select-none flex flex-col justify-between ${this.modeloSelecionado === 'modeloB' ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-500/10' : 'border-slate-200 hover:border-slate-300 bg-white'}"
            >
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
                    <i class="fa-solid fa-file-invoice"></i> Modelo B (Executivo RAG + Gantt)
                  </span>
                  <span class="w-4 h-4 rounded-full border-2 ${this.modeloSelecionado === 'modeloB' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'} flex items-center justify-center">
                    ${this.modeloSelecionado === 'modeloB' ? '<span class="w-1.5 h-1.5 rounded-full bg-white"></span>' : ''}
                  </span>
                </div>
                <h5 class="font-bold text-slate-900 text-sm">Status Report com 2 Slides (RAG & Gantt)</h5>
                <p class="text-xs text-slate-500 leading-relaxed">
                  Slide 1 com síntese RAG e realizações + Slide 2 com cronograma de Gantt das atividades. Exportação em PDF de 2 páginas.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2">
          <span class="text-xs text-slate-500">
            <strong class="text-slate-800 font-mono">${frentesAtivas.length}</strong> frente(s) selecionada(s)
          </span>
          <button 
            type="button" 
            onclick="app.gerarVisaoExecutiva()" 
            class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md active:scale-95 transition flex items-center gap-2 cursor-pointer"
          >
            <i class="fa-solid fa-wand-magic-sparkles text-xs"></i>
            <span>Gerar Visão Executiva</span>
          </button>
        </div>
      </div>
    `;
  }

  aoMudarFiltroMacro(novoValor) {
    this.filtroMacroCadeia = novoValor;
    const frentesDaMacro = this.obterFrentesPorMacro(novoValor);
    this.cadeiasSelecionadas = new Set(frentesDaMacro);
    this.renderizarTelaSelecao();
  }

  aoMudarFiltroStatus(novoStatus) {
    this.filtroStatusExec = novoStatus;
    if (this.emModoApresentacao) {
      if (this.modeloSelecionado === 'modeloB') {
        const containerGantt = document.getElementById('slide2CronogramaGantt');
        if (containerGantt) {
          containerGantt.innerHTML = this.gerarHtmlGantt(this.obterItensSelecionados(false));
        }
        const containerGanttDet = document.getElementById('slide3CronogramaGanttDetalhado');
        if (containerGanttDet) {
          containerGanttDet.innerHTML = this.gerarHtmlGanttDetalhado(this.obterItensSelecionados(false));
        }
      } else {
        this.renderizarApresentacao();
      }
    } else {
      this.renderizarTelaSelecao();
    }
  }

  aoMudarDataInicio(valor) {
    this.filtroDataInicioExec = valor || '';
    this.renderizarTelaSelecao();
  }

  aoMudarDataFim(valor) {
    this.filtroDataFimExec = valor || '';
    this.renderizarTelaSelecao();
  }

  limparFiltroDatasExec() {
    this.filtroDataInicioExec = '';
    this.filtroDataFimExec = '';
    this.renderizarTelaSelecao();
  }

  aoFiltrarBuscaFrentes(termo) {
    this.filtroBuscaFrente = termo;
    this.renderizarTelaSelecao();
    const input = document.getElementById('inputBuscaFrenteVisaoExecutiva');
    if (input) {
      input.focus();
      input.selectionStart = input.selectionEnd = input.value.length;
    }
  }

  aoAlternarCadeia(cadeiaNome, checado) {
    if (checado) {
      this.cadeiasSelecionadas.add(cadeiaNome);
    } else {
      this.cadeiasSelecionadas.delete(cadeiaNome);
    }
    this.renderizarTelaSelecao();
  }

  selecionarFrentesVisiveis(marcar) {
    const visiveis = this.obterFrentesFiltradas();
    visiveis.forEach(f => {
      if (marcar) {
        this.cadeiasSelecionadas.add(f);
      } else {
        this.cadeiasSelecionadas.delete(f);
      }
    });
    this.renderizarTelaSelecao();
  }

  selecionarTodasCadeias(marcar) {
    if (marcar) {
      this.cadeiasSelecionadas = new Set(this.obterFrentesPorMacro(this.filtroMacroCadeia));
    } else {
      this.cadeiasSelecionadas.clear();
    }
    this.renderizarTelaSelecao();
  }

  selecionarModelo(modelo) {
    this.modeloSelecionado = modelo;
    this.renderizarTelaSelecao();
  }

  gerar() {
    try {
      let frentesAtivas = this.obterFrentesAtivasNaApresentacao();
      if (!frentesAtivas || frentesAtivas.length === 0) {
        const todas = this.obterListaTodasFrentes();
        this.cadeiasSelecionadas = new Set(todas);
        frentesAtivas = todas;
      }
      if (!frentesAtivas || frentesAtivas.length === 0) {
        if (this.ctrl && typeof this.ctrl.exibirToast === 'function') {
          this.ctrl.exibirToast('Nenhuma frente com atividades encontrada para gerar a visão.', 'info');
        }
        return;
      }

      const itensIniciais = this.obterItensSelecionados(false);
      if (this.atividadesGanttSelecionadas.size === 0) {
        this.atividadesGanttSelecionadas = new Set(itensIniciais.map(x => String(x.id)));
      }

      this.emModoApresentacao = true;
      this.abaSlideB = 1;
      this.slideAtual = 0;

      // Exibe o botão de download no topo do modal
      const btnTopo = document.getElementById('btnBaixarApresentacaoTopo');
      if (btnTopo) {
        btnTopo.classList.remove('hidden');
        btnTopo.classList.add('inline-flex');
      }

      this.renderizarApresentacao();
    } catch (err) {
      console.error('Erro crítico ao gerar a Visão Executiva:', err);
      if (this.ctrl && typeof this.ctrl.exibirToast === 'function') {
        this.ctrl.exibirToast('Erro ao processar dados da apresentação.', 'erro');
      }
    }
  }

  alternarAbaSlideB(numAba) {
    this.abaSlideB = numAba;
    const slide1 = document.getElementById('slide1StatusReport');
    const slide2 = document.getElementById('slide2CronogramaGantt');
    const slide3 = document.getElementById('slide3CronogramaGanttDetalhado');
    
    const btnAba1 = document.getElementById('btnAbaSlideB1');
    const btnAba2 = document.getElementById('btnAbaSlideB2');
    const btnAba3 = document.getElementById('btnAbaSlideB3');

    // Oculta todos os slides
    slide1?.classList.add('hidden');
    slide2?.classList.add('hidden');
    slide3?.classList.add('hidden');

    // Reseta classes dos botões
    const btnClassInativo = 'px-3 py-1 rounded-md font-semibold transition cursor-pointer text-slate-600 hover:text-slate-900';
    const btnClassAtivo = 'px-3 py-1 rounded-md font-semibold transition cursor-pointer bg-slate-900 text-white shadow-xs';

    if (btnAba1) btnAba1.className = btnClassInativo;
    if (btnAba2) btnAba2.className = btnClassInativo;
    if (btnAba3) btnAba3.className = btnClassInativo;

    // Ativa o slide correspondente
    if (numAba === 1) {
      slide1?.classList.remove('hidden');
      if (btnAba1) btnAba1.className = btnClassAtivo;
    } else if (numAba === 2) {
      slide2?.classList.remove('hidden');
      if (btnAba2) btnAba2.className = btnClassAtivo;
    } else if (numAba === 3) {
      slide3?.classList.remove('hidden');
      if (btnAba3) btnAba3.className = btnClassAtivo;
      // Garante que o Slide 3 seja renderizado
      if (slide3 && (!slide3.innerHTML || slide3.innerHTML.trim() === '')) {
        slide3.innerHTML = this.gerarHtmlGanttDetalhado(this.obterItensSelecionados(false));
      }
    }
  }

  renderizarApresentacao() {
    const container = document.getElementById('conteudoCorpoVisaoExecutiva');
    const headerSub = document.getElementById('subtituloModalVisaoExecutiva');
    if (!container) return;
    if (this.modeloSelecionado === 'modeloA') {
      this.renderizarModeloSlides(container, headerSub);
    } else {
      this.renderizarModeloStatusReport(container, headerSub);
    }
  }

  gerarHtmlGantt(itens) {
    try {
      if (!itens || itens.length === 0) {
        return `
          <div class="py-16 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl p-6">
            <i class="fa-regular fa-calendar-xmark text-2xl text-slate-300 mb-2"></i>
            <p class="text-xs">Nenhuma atividade localizada com os filtros selecionados para o cronograma de Gantt.</p>
          </div>
        `;
      }

      const parseISO = (val, padraoFim = false) => {
        if (!val) return null;
        const s = String(val).trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
          const [a, m, d] = s.slice(0, 10).split('-').map(Number);
          const dt = new Date(a, m - 1, d);
          return isNaN(dt.getTime()) ? null : dt;
        }
        if (/^\d{4}-\d{1,2}$/.test(s)) {
          const [a, m] = s.split('-').map(Number);
          const d = padraoFim ? new Date(a, m, 0).getDate() : 1;
          const dt = new Date(a, m - 1, d);
          return isNaN(dt.getTime()) ? null : dt;
        }
        if (this.ctrl && typeof this.ctrl.parseData === 'function') {
          const parsed = this.ctrl.parseData(s);
          return (parsed && !isNaN(parsed.getTime())) ? parsed : null;
        }
        const dObj = new Date(s);
        return isNaN(dObj.getTime()) ? null : dObj;
      };

      const hoje = new Date();
      let minTime = Infinity;
      let maxTime = -Infinity;

      const todasProcessadas = [];
      itens.forEach(item => {
        const dIni = parseISO(item.prazoInicio, false) || parseISO(item.etapaDataInicio, false) || parseISO(item.prazo, false) || hoje;
        const dFim = parseISO(item.prazo, true) || parseISO(item.conclusao, true) || dIni || hoje;
        const tIni = dIni.getTime();
        const tFim = dFim.getTime() >= tIni ? dFim.getTime() : tIni + 86400000;
        todasProcessadas.push({
          item,
          dIni,
          dFim,
          tIni,
          tFim,
          checado: this.atividadesGanttSelecionadas.has(String(item.id))
        });
      });

      const itensAtivos = todasProcessadas.filter(x => x.checado);
      const baseParaEscala = itensAtivos.length > 0 ? itensAtivos : todasProcessadas;
      baseParaEscala.forEach(obj => {
        if (obj.tIni < minTime) minTime = obj.tIni;
        if (obj.tFim > maxTime) maxTime = obj.tFim;
      });

      if (minTime === Infinity || maxTime === -Infinity) {
        minTime = hoje.getTime();
        maxTime = minTime + 30 * 86400 * 1000;
      }
      if (maxTime - minTime < 1000 * 60 * 60 * 24 * 30) {
        maxTime = minTime + 1000 * 60 * 60 * 24 * 30;
      }

      const dStart = new Date(minTime);
      dStart.setDate(1);
      const dEnd = new Date(maxTime);
      dEnd.setMonth(dEnd.getMonth() + 1);
      dEnd.setDate(0);
      const rangeTotal = Math.max(86400000, dEnd.getTime() - dStart.getTime());
      const mesesCabecalho = [];
      const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      let cursor = new Date(dStart.getFullYear(), dStart.getMonth(), 1);
      let iteracoesSeguranca = 0;

      while (cursor <= dEnd && iteracoesSeguranca < 48) {
        iteracoesSeguranca++;
        const mesIdx = cursor.getMonth();
        const anoNum = cursor.getFullYear();
        const inicioMes = new Date(anoNum, mesIdx, 1).getTime();
        const fimMes = new Date(anoNum, mesIdx + 1, 0, 23, 59, 59).getTime();
        const leftPct = Math.max(0, ((inicioMes - dStart.getTime()) / rangeTotal) * 100);
        const widthPct = Math.min(100 - leftPct, ((fimMes - inicioMes) / rangeTotal) * 100);
        mesesCabecalho.push({
          rotulo: `${nomesMeses[mesIdx]}/${String(anoNum).slice(2)}`,
          leftPct: leftPct.toFixed(2),
          widthPct: widthPct.toFixed(2)
        });
        cursor.setMonth(cursor.getMonth() + 1);
      }

      return `
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-card space-y-4">
          <div class="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs shadow-xs">
                <i class="fa-solid fa-timeline"></i>
              </div>
              <div>
                <h4 class="font-bold text-sm text-slate-900 leading-tight">Cronograma Executivo (Gráfico de Gantt)</h4>
                <p class="text-[11px] text-slate-500">
                  Exibindo <strong>${itensAtivos.length} de ${todasProcessadas.length} iniciativas</strong> selecionadas
                </p>
              </div>
            </div>
            <div class="flex items-center flex-wrap gap-2.5">
              <div class="gantt-selection-controls flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-2 py-1 rounded-xl text-[11px]">
                <span class="text-slate-500 font-semibold mr-1">Exibir no Gantt:</span>
                <button 
                  type="button" 
                  onclick="app.visaoExecutivaComponent.selecionarTodasAtividadesGantt(true)" 
                  class="px-2 py-0.5 bg-white hover:bg-slate-50 border border-slate-200 rounded text-indigo-700 font-semibold transition active:scale-95 shadow-2xs"
                >
                  Todas
                </button>
                <button 
                  type="button" 
                  onclick="app.visaoExecutivaComponent.selecionarTodasAtividadesGantt(false)" 
                  class="px-2 py-0.5 bg-white hover:bg-slate-50 border border-slate-200 rounded text-slate-600 font-medium transition active:scale-95 shadow-2xs"
                >
                  Limpar
                </button>
              </div>
              <div class="flex items-center flex-wrap gap-2 text-[10px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl">
                <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-sm bg-emerald-600"></span> Concluído</span>
                <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-sm bg-blue-600"></span> Em Andamento</span>
                <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-sm bg-rose-600"></span> P0 Crítica</span>
              </div>
            </div>
          </div>

          <div class="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
            <div class="flex border-b border-slate-200 bg-slate-100/90 text-[11px] font-semibold text-slate-700 select-none">
              <div class="w-56 sm:w-80 p-2.5 border-r border-slate-200 shrink-0 flex items-center gap-2">
                <span class="gantt-checkbox-col w-4"></span>
                <span>Iniciativa / Atividade</span>
              </div>
              <div class="w-24 p-2.5 text-center border-r border-slate-200 shrink-0 hidden sm:block">Período</div>
              <div class="w-16 p-2.5 text-center border-r border-slate-200 shrink-0">Progresso</div>
              <div class="flex-1 relative h-9">
                ${mesesCabecalho.map(m => `
                  <div 
                    style="left: ${m.leftPct}%; width: ${m.widthPct}%;" 
                    class="absolute top-0 bottom-0 border-r border-slate-200/80 flex items-center justify-center font-mono text-[10px] text-slate-600 truncate px-0.5"
                  >
                    ${m.rotulo}
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="divide-y divide-slate-200/80 bg-white">
              ${todasProcessadas.map(obj => {
                const it = obj.item;
                const isSelecionado = obj.checado;
                const leftPct = Math.max(0, Math.min(97, ((obj.tIni - dStart.getTime()) / rangeTotal) * 100));
                const rightPct = Math.max(leftPct + 3, Math.min(100, ((obj.tFim - dStart.getTime()) / rangeTotal) * 100));
                const widthPct = Math.max(3, rightPct - leftPct);
                const progresso = Math.min(100, Math.max(0, parseInt(it.progresso, 10) || 0));
                const isConcluido = this.ctrl.normalizarStatus(it.status) === 'Concluído';
                let corBarra = 'bg-blue-600';
                if (isConcluido) corBarra = 'bg-emerald-600';
                else if (it.status === 'Bloqueado') corBarra = 'bg-rose-500';
                else if (it.prioridade && it.prioridade.includes('P0')) corBarra = 'bg-rose-600';
                const dtIniStr = this.ctrl.formatarDataBR(it.prazoInicio || '');
                const dtFimStr = this.ctrl.formatarDataBR(it.prazo || '');
                return `
                  <div class="gantt-row flex items-center text-xs hover:bg-slate-50/80 transition ${!isSelecionado ? 'opacity-40 bg-slate-50/30' : ''}" data-id="${this.ctrl.escapeAttrJs(it.id)}">
                    <!-- Checkbox de Seleção + Identificação (Apenas Atividade) -->
                    <div class="w-56 sm:w-80 p-2.5 border-r border-slate-200 shrink-0 flex items-center gap-2 min-w-0">
                      <input 
                        type="checkbox" 
                        ${isSelecionado ? 'checked' : ''} 
                        onchange="app.visaoExecutivaComponent.alternarAtividadeGantt('${this.ctrl.escapeAttrJs(it.id)}', this.checked)"
                        class="gantt-checkbox rounded text-indigo-600 focus:ring-0 cursor-pointer h-3.5 w-3.5 shrink-0"
                        title="Marcar/desmarcar para exibição no Gantt"
                      >
                      <span class="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 shrink-0">
                        #${this.ctrl.escapeHtml(it.id)}
                      </span>
                      <div class="min-w-0 flex-1">
                        <span class="font-medium text-slate-900 truncate block text-[11px]" title="${this.ctrl.escapeHtml(it.titulo)}">
                          ${this.ctrl.escapeHtml(it.titulo)}
                        </span>
                      </div>
                    </div>
                    <!-- Período -->
                    <div class="w-24 p-2 text-center font-mono text-[10px] text-slate-500 border-r border-slate-200 shrink-0 hidden sm:block">
                      <div>${dtIniStr}</div>
                      <div class="text-slate-400">até ${dtFimStr}</div>
                    </div>
                    <!-- Progresso -->
                    <div class="w-16 p-2 text-center font-mono text-[11px] font-semibold border-r border-slate-200 shrink-0 ${isConcluido ? 'text-emerald-700' : 'text-slate-700'}">
                      ${progresso}%
                    </div>
                    <!-- Linha Temporal / Barra de Gantt -->
                    <div class="flex-1 relative h-10 flex items-center bg-slate-50/30">
                      ${mesesCabecalho.map(m => `
                        <div style="left: ${m.leftPct}%;" class="absolute top-0 bottom-0 border-r border-slate-100 pointer-events-none"></div>
                      `).join('')}
                      ${isSelecionado ? `
                        <div 
                          style="left: ${leftPct.toFixed(2)}%; width: ${widthPct.toFixed(2)}%;" 
                          class="absolute z-10 h-6 rounded-md ${corBarra} text-white shadow-2xs flex items-center justify-between px-2 overflow-hidden select-none"
                          title="${this.ctrl.escapeHtml(it.titulo)}: ${dtIniStr} até ${dtFimStr} (${progresso}%)"
                        >
                          <div class="absolute inset-y-0 left-0 bg-white/20 pointer-events-none" style="width: ${progresso}%"></div>
                          <span class="text-[10px] font-medium truncate relative z-10 hidden sm:inline">
                            ${this.ctrl.escapeHtml(it.titulo)}
                          </span>
                          <span class="text-[9px] font-mono font-bold relative z-10 ml-auto pl-1">
                            ${progresso}%
                          </span>
                        </div>
                      ` : `
                        <span class="text-[10px] text-slate-400 italic px-3 select-none">Ocultada da apresentação executiva</span>
                      `}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;
    } catch (e) {
      console.error('Erro na renderização do Gantt:', e);
      return `<div class="p-6 text-center text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl">Ocorreu um erro ao carregar o gráfico de Gantt. Verifique as datas das atividades.</div>`;
    }
  }

  renderizarModeloStatusReport(container, headerSub) {
    const frentesAtivas = this.obterFrentesAtivasNaApresentacao();
    const itensGlobais = this.obterItensSelecionados(true);
    const m = this.calcularMetricas(itensGlobais);
    const listaStatus = this.obterListaStatusConfigurados();
    const tituloMacro = this.filtroMacroCadeia 
      ? `Cadeia de Valor: ${this.filtroMacroCadeia}` 
      : 'Portfólio Consolidado';

    if (headerSub) {
      headerSub.innerText = `Status Report Executivo – ${tituloMacro} (${frentesAtivas.length} Frente(s) Ativa(s))`;
    }

    const textoOverviewPadrao = `Portfólio estruturado em ${frentesAtivas.length} frente(s) ativa(s): ${frentesAtivas.slice(0, 4).join(', ')}${frentesAtivas.length > 4 ? '...' : ''}. Evolução média de ${m.progressoMedio}% realizada (Planejado: ${m.progressoPlanejadoMedio}%). ${m.concluidas} iniciativa(s) 100% concluída(s) e ${m.emAndamento} em execução. ${m.riscos.length > 0 ? `Itens sob acompanhamento focados em ${m.riscos.length} risco(s) / ponto(s) de atenção.` : 'Cronograma alinhado e em conformidade com os marcos planejados.'}`;

    const textoOverviewFinal = this.overviewCustomizado !== null
      ? this.overviewCustomizado
      : textoOverviewPadrao;

    container.innerHTML = `
      <div class="space-y-4">
        <!-- Barra de Ações Superior -->
        <div class="barra-acoes-modal flex flex-wrap items-center justify-between gap-3 bg-slate-100 p-2.5 rounded-xl border border-slate-200">
          <div class="flex items-center flex-wrap gap-2">
            <button 
              type="button" 
              onclick="app.visaoExecutivaComponent.voltarParaSelecao()" 
              class="px-2.5 py-1 text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <i class="fa-solid fa-arrow-left text-[10px]"></i>
              <span>Editar Filtros</span>
            </button>
            <div class="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-2xs" title="Filtra somente as atividades exibidas no Slide 2 (Gantt)">
              <i class="fa-solid fa-filter text-emerald-600 text-[10px]"></i>
              <label for="selStatusRapidoExec" class="text-[11px] font-semibold text-slate-600">Status (Slide 2):</label>
              <select 
                id="selStatusRapidoExec" 
                onchange="app.visaoExecutivaComponent.aoMudarFiltroStatus(this.value)" 
                class="bg-transparent border-0 text-xs font-semibold text-slate-800 outline-none cursor-pointer"
              >
                <option value="">Todos os Status</option>
                ${listaStatus.map(st => `
                  <option value="${this.ctrl.escapeHtml(st)}" ${st.toLowerCase() === this.filtroStatusExec.toLowerCase() ? 'selected' : ''}>
                    ${this.ctrl.escapeHtml(st)}
                  </option>
                `).join('')}
              </select>
            </div>
            <span class="text-slate-300">|</span>
            <div class="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 text-xs shadow-2xs">
              <button 
                type="button" 
                id="btnAbaSlideB1" 
                onclick="app.visaoExecutivaComponent.alternarAbaSlideB(1)" 
                class="${this.abaSlideB === 1 ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'} px-3 py-1 rounded-md font-semibold transition cursor-pointer"
              >
                1. Status Report (RAG)
              </button>
              <button 
                type="button" 
                id="btnAbaSlideB2" 
                onclick="app.visaoExecutivaComponent.alternarAbaSlideB(2)" 
                class="${this.abaSlideB === 2 ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'} px-3 py-1 rounded-md font-semibold transition cursor-pointer"
              >
                2. Cronograma Gantt
              </button>
              <button 
                type="button" 
                id="btnAbaSlideB3" 
                onclick="app.visaoExecutivaComponent.alternarAbaSlideB(3)" 
                class="${this.abaSlideB === 3 ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'} px-3 py-1 rounded-md font-semibold transition cursor-pointer"
              >
                3. Gantt com Etapas
              </button>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-xs font-mono font-bold text-slate-700 hidden sm:inline">
              ${tituloMacro}
            </span>
          </div>
        </div>

        <!-- CONTAINER GERAL DOS SLIDES -->
        <div id="containerApresentacaoSlides" class="space-y-4">
          
          <!-- SLIDE 1: STATUS REPORT EXECUTIVO -->
          <div id="slide1StatusReport" class="slide-executivo ${this.abaSlideB === 1 ? '' : 'hidden'}">
            <div id="gridCorpoRelatorioExecutivo" class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              
              <!-- Coluna Esquerda: Status Geral, Evolução, Frentes e Cards -->
              <div class="lg:col-span-4 space-y-4">
                <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-card space-y-4">
                  <!-- STATUS GERAL -->
                  <div class="border-b border-slate-100 pb-3">
                    <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Status Geral</span>
                    <div class="text-3xl font-extrabold ${m.statusGeral.cor} tracking-tight mt-1 flex items-center gap-2">
                      <span>${m.statusGeral.texto}</span>
                      <span class="w-3 h-3 rounded-full ${m.statusGeral.bg} animate-pulse"></span>
                    </div>
                  </div>

                  <!-- EVOLUÇÃO DE PROJETO (BARRA AZUL + PLAN/REAL) -->
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between text-xs font-semibold">
                      <span class="text-slate-700">Evolução de Projeto</span>
                      <span class="font-mono text-slate-500 text-[11px] flex items-center gap-1.5">
                        <span>Plan = <strong class="text-indigo-700">${m.progressoPlanejadoMedio}%</strong></span>
                        <span class="text-slate-300">/</span>
                        <span>Real = <strong class="text-emerald-700">${m.progressoMedio}%</strong></span>
                      </span>
                    </div>
                    <div class="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/80 shadow-inner">
                      <div class="bg-blue-600 h-3 rounded-full transition-all duration-500" style="width: ${m.progressoMedio}%;"></div>
                    </div>
                  </div>

                  <!-- IMPLEMENTAÇÕES / FRENTES -->
                  <div class="space-y-2 pt-2 border-t border-slate-100">
                    <span class="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Implementações / Frentes
                    </span>
                    <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
                      ${frentesAtivas.map(frente => {
                        const itensF = this.obterItensCadeia(frente, true);
                        const mf = this.calcularMetricas(itensF);
                        let maiorTimestamp = -Infinity;
                        let maiorPrazoRaw = '';
                        itensF.forEach(it => {
                          const candidatos = [it.prazo, it.conclusao].filter(Boolean);
                          candidatos.forEach(p => {
                            const d = this.ctrl.parseData(p);
                            if (d && !isNaN(d.getTime())) {
                              if (d.getTime() > maiorTimestamp) {
                                maiorTimestamp = d.getTime();
                                maiorPrazoRaw = p;
                              }
                            } else if (maiorTimestamp === -Infinity && p > maiorPrazoRaw) {
                              maiorPrazoRaw = p;
                            }
                          });
                        });
                        const prazoF = maiorPrazoRaw ? this.ctrl.formatarMesAno(maiorPrazoRaw) : 'TBD';
                        let corBarraFrente = 'bg-sky-600';
                        if (mf.spiGeral < 0.80) corBarraFrente = 'bg-rose-500';
                        else if (mf.spiGeral < 0.95) corBarraFrente = 'bg-amber-500';

                        return `
                          <div class="space-y-1 text-xs">
                            <div class="flex items-center justify-between gap-2">
                              <span class="font-semibold text-slate-800 truncate" title="${this.ctrl.escapeHtml(frente)}">${this.ctrl.escapeHtml(frente)}</span>
                              <span class="font-mono text-[11px] text-slate-600 font-semibold shrink-0">
                                ${prazoF}
                              </span>
                            </div>
                            <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                              <div class="${corBarraFrente} h-2 rounded-full transition-all duration-300" style="width: ${mf.progressoMedio}%;"></div>
                            </div>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  </div>
                </div>

                <!-- CARDS DE DIMENSÃO DE CONTROLE -->
                <div class="grid grid-cols-3 gap-2 text-center select-none">
                  <div class="${m.cardCronogramaBg} rounded-xl p-2.5 shadow-2xs flex flex-col justify-center items-center text-center h-24">
                    <span class="text-sm font-bold tracking-tight">${m.statusGeral.texto}</span>
                    <span class="text-[10px] font-bold uppercase tracking-wider opacity-90 mt-1">CRONOGRAMA</span>
                  </div>
                  <div class="bg-emerald-600 text-white rounded-xl p-2.5 shadow-2xs flex flex-col justify-between h-24">
                    <span class="text-xl font-bold font-mono">${m.progressoMedio}%</span>
                    <div>
                      <span class="text-[10px] font-bold uppercase tracking-wider">Entregas</span>
                    </div>
                  </div>
                  <div class="${m.riscos.length > 0 ? 'bg-amber-400 text-slate-950' : 'bg-emerald-600 text-white'} rounded-xl p-2.5 shadow-2xs flex flex-col justify-between h-24">
                    <span class="text-2xl font-black font-mono leading-none">${m.riscos.length}</span>
                    <div>
                      <span class="text-[10px] font-bold uppercase tracking-wider">Riscos & Atenção</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Coluna Direita: Resumo, Realizações, Próximos Passos e Riscos -->
              <div class="lg:col-span-8 space-y-4">
                
                <!-- Overview com Edição de Texto -->
                <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-card space-y-2.5">
                  <div class="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <h5 class="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <i class="fa-solid fa-align-left text-indigo-600"></i>
                      <span>Resumo Executivo (Overview)</span>
                    </h5>
                    <div class="flex items-center gap-1.5">
                      ${!this.editandoOverview ? `
                        <button 
                          type="button" 
                          onclick="app.visaoExecutivaComponent.alternarEdicaoOverview(true)" 
                          class="btn-editar-bloco text-slate-400 hover:text-indigo-700 p-1 rounded transition text-xs flex items-center gap-1 font-sans cursor-pointer" 
                          title="Editar resumo executivo"
                        >
                          <i class="fa-solid fa-pen-to-square text-[11px]"></i>
                          <span class="text-[10px] font-medium hidden sm:inline">Editar</span>
                        </button>
                      ` : ''}
                      <span class="text-[10px] text-slate-400 font-mono">Síntese de Portfólio</span>
                    </div>
                  </div>

                  ${this.editandoOverview ? `
                    <div class="space-y-2 pt-1">
                      <textarea 
                        id="textareaOverview" 
                        rows="4" 
                        class="w-full px-3 py-2 border border-indigo-300 rounded-xl text-xs bg-white text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none leading-relaxed shadow-2xs font-sans" 
                        placeholder="Escreva o resumo executivo geral..."
                      >${this.ctrl.escapeHtml(textoOverviewFinal)}</textarea>

                      <div class="flex items-center justify-between gap-2 pt-0.5">
                        <button 
                          type="button" 
                          onclick="app.visaoExecutivaComponent.restaurarOverviewPadrao()" 
                          class="text-[10px] text-slate-500 hover:text-slate-800 font-medium underline cursor-pointer"
                        >
                          Restaurar Padrão
                        </button>

                        <div class="flex items-center gap-1.5">
                          <button 
                            type="button" 
                            onclick="app.visaoExecutivaComponent.alternarEdicaoOverview(false)" 
                            class="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-[11px] font-medium transition cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button 
                            type="button" 
                            onclick="
                              const txt = document.getElementById('textareaOverview').value;
                              app.visaoExecutivaComponent.salvarEdicaoOverview(txt);
                            " 
                            class="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-semibold transition shadow-2xs cursor-pointer active:scale-95"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    </div>
                  ` : `
                    <p class="text-xs text-slate-700 leading-relaxed font-sans bg-slate-50/70 p-3 rounded-xl border border-slate-200/60">
                      ${this.ctrl.escapeHtml(textoOverviewFinal)}
                    </p>
                  `}
                </div>

                <!-- Realizações & Próximos Passos -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <!-- Realizações com Edição de Texto e Bullets -->
                  <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-card space-y-2.5">
                    <div class="border-b border-slate-100 pb-1.5 flex items-center justify-between">
                      <h5 class="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <i class="fa-solid fa-circle-check text-emerald-600"></i>
                        <span>Realizações (Principais Entregas)</span>
                      </h5>
                      <div class="flex items-center gap-1.5">
                        ${!this.editandoEntregaConsolidada ? `
                          <button 
                            type="button" 
                            onclick="app.visaoExecutivaComponent.alternarEdicaoEntregaConsolidada(true)" 
                            class="btn-editar-bloco text-slate-400 hover:text-emerald-700 p-1 rounded transition text-xs flex items-center gap-1 font-sans cursor-pointer" 
                            title="Editar texto e bullets das entregas"
                          >
                            <i class="fa-solid fa-pen-to-square text-[11px]"></i>
                            <span class="text-[10px] font-medium hidden sm:inline">Editar</span>
                          </button>
                        ` : ''}
                        <span class="text-[10px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Consolidado
                        </span>
                      </div>
                    </div>
                    ${m.realizacoes.length === 0 ? `
                      <div class="py-6 text-center text-slate-400 text-xs">
                        Nenhuma entrega concluída até a data da geração do report.
                      </div>
                    ` : `
                      <div class="space-y-2.5 text-xs">
                        ${m.realizacoes.map(item => {
                        const bulletsParaEdicao = (item.itensDestaque || []).map(b => {
                          if (typeof b === 'object') {
                            const idStr = b.id ? `#${b.id} ` : '';
                            const dataStr = b.dataConclusao ? ` | ${b.dataConclusao}` : '';
                            return `${idStr}${b.titulo}${dataStr}`;
                          }
                          return String(b);
                        }).join('\n');

                        return `
                          <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-card space-y-3">
                            <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
                              <div class="flex items-center gap-2">
                                <span class="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-bold border border-emerald-200">
                                  <i class="fa-solid fa-circle-check"></i>
                                </span>
                                <h5 class="font-bold text-xs text-slate-900">${this.ctrl.escapeHtml(item.subtitulo)}</h5>
                              </div>
                              <div class="flex items-center gap-2">
                                <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                                  ${item.badgeTexto}
                                </span>
                                ${!this.editandoEntregaConsolidada ? `
                                  <button 
                                    type="button" 
                                    onclick="app.visaoExecutivaComponent.alternarEdicaoEntregaConsolidada(true)" 
                                    class="text-slate-400 hover:text-emerald-700 p-1 rounded-md hover:bg-slate-100 transition cursor-pointer" 
                                    title="Editar itens entregues"
                                  >
                                    <i class="fa-solid fa-pen-to-square text-xs"></i>
                                  </button>
                                ` : ''}
                              </div>
                            </div>

                            ${this.editandoEntregaConsolidada ? `
                              <div class="space-y-2 bg-emerald-50/30 p-3 rounded-xl border border-emerald-200 animate-modal">
                                <div class="flex items-center justify-between">
                                  <label class="text-[11px] font-semibold text-emerald-900">Editar Entregas (1 item por linha):</label>
                                  <span class="text-[10px] text-slate-400 font-mono">Dica: use "Título | Data"</span>
                                </div>
                                <textarea 
                                  id="txtEdicaoEntregaBullets" 
                                  rows="4" 
                                  class="w-full p-2.5 text-xs bg-white border border-emerald-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-sans leading-relaxed shadow-2xs"
                                  placeholder="Ex: #101 Nova feature de integração | 15/10/2026"
                                >${this.ctrl.escapeHtml(bulletsParaEdicao)}</textarea>
                                <div class="flex items-center justify-between pt-1">
                                  <button 
                                    type="button" 
                                    onclick="app.visaoExecutivaComponent.restaurarEntregaConsolidadaPadrao()" 
                                    class="text-[11px] text-slate-500 hover:text-rose-600 underline cursor-pointer"
                                  >
                                    Restaurar Automático
                                  </button>
                                  <div class="flex items-center gap-1.5">
                                    <button 
                                      type="button" 
                                      onclick="app.visaoExecutivaComponent.alternarEdicaoEntregaConsolidada(false)" 
                                      class="px-2.5 py-1 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-md text-xs font-medium cursor-pointer"
                                    >
                                      Cancelar
                                    </button>
                                    <button 
                                      type="button" 
                                      onclick="app.visaoExecutivaComponent.salvarEdicaoEntregaConsolidada(document.getElementById('txtEdicaoEntregaBullets').value)" 
                                      class="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-2xs cursor-pointer"
                                    >
                                      Salvar Itens
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ` : `
                              <ul class="space-y-1.5 text-xs text-slate-700">
                                ${item.itensDestaque && item.itensDestaque.length > 0 ? item.itensDestaque.map(b => `
                                  <li class="flex items-start gap-2">
                                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                                    <div class="flex-1 min-w-0">
                                      ${typeof b === 'object' && b.id ? `<span class="font-semibold text-slate-900">#${this.ctrl.escapeHtml(b.id)} </span>` : ''}
                                      <span>${typeof b === 'object' ? this.ctrl.escapeHtml(b.titulo) : this.ctrl.escapeHtml(b)}</span>
                                      ${typeof b === 'object' && b.dataConclusao ? `<span class="text-[10px] font-mono text-slate-400 ml-1">(${this.ctrl.escapeHtml(b.dataConclusao)})</span>` : ''}
                                    </div>
                                  </li>
                                `).join('') : '<li class="text-slate-400 italic text-[11px]">Nenhuma entrega concluída no período.</li>'}
                              </ul>
                            `}
                          </div>
                        `;
                      }).join('')}
                      </div>
                    `}
                  </div>

                  <!-- Próximos Passos com Edição de Texto e Bullets -->
                  <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-card space-y-2.5">
                    <div class="border-b border-slate-100 pb-1.5 flex items-center justify-between">
                      <h5 class="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <i class="fa-solid fa-forward text-indigo-600"></i>
                        <span>Próximos Passos (Próximas Fases)</span>
                      </h5>
                      <div class="flex items-center gap-1.5">
                        ${!this.editandoProximosPassos ? `
                          <button 
                            type="button" 
                            onclick="app.visaoExecutivaComponent.alternarEdicaoProximosPassos(true)" 
                            class="btn-editar-bloco text-slate-400 hover:text-indigo-700 p-1 rounded transition text-xs flex items-center gap-1 font-sans cursor-pointer" 
                            title="Editar texto e bullets dos próximos passos"
                          >
                            <i class="fa-solid fa-pen-to-square text-[11px]"></i>
                            <span class="text-[10px] font-medium hidden sm:inline">Editar</span>
                          </button>
                        ` : ''}
                        <span class="text-[10px] font-mono text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                          Planejamento
                        </span>
                      </div>
                    </div>
                    ${m.proximosPassos.length === 0 ? `
                      <div class="py-6 text-center text-slate-400 text-xs">
                        Não há demandas pendentes registradas no portfólio.
                      </div>
                    ` : `
                      <div class="space-y-2.5 text-xs">
                        ${m.proximosPassos.map(item => {
                        const bulletsParaEdicao = (item.itensDestaque || []).map(b => {
                          if (typeof b === 'object') {
                            const idStr = b.id ? `#${b.id} ` : '';
                            const infoStr = b.responsavel ? ` | ${b.responsavel}${b.dataProgramada ? ' - ' + b.dataProgramada : ''}` : '';
                            return `${idStr}${b.titulo}${infoStr}`;
                          }
                          return String(b);
                        }).join('\n');

                        return `
                          <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-card space-y-3">
                            <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
                              <div class="flex items-center gap-2">
                                <span class="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-bold border border-blue-200">
                                  <i class="fa-solid fa-forward"></i>
                                </span>
                                <h5 class="font-bold text-xs text-slate-900">${this.ctrl.escapeHtml(item.subtitulo)}</h5>
                              </div>
                              <div class="flex items-center gap-2">
                                <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                                  ${item.badgeTexto}
                                </span>
                                ${!this.editandoProximosPassos ? `
                                  <button 
                                    type="button" 
                                    onclick="app.visaoExecutivaComponent.alternarEdicaoProximosPassos(true)" 
                                    class="text-slate-400 hover:text-blue-700 p-1 rounded-md hover:bg-slate-100 transition cursor-pointer" 
                                    title="Editar próximos passos"
                                  >
                                    <i class="fa-solid fa-pen-to-square text-xs"></i>
                                  </button>
                                ` : ''}
                              </div>
                            </div>

                            ${this.editandoProximosPassos ? `
                              <div class="space-y-2 bg-blue-50/30 p-3 rounded-xl border border-blue-200 animate-modal">
                                <div class="flex items-center justify-between">
                                  <label class="text-[11px] font-semibold text-blue-900">Editar Próximos Passos (1 item por linha):</label>
                                  <span class="text-[10px] text-slate-400 font-mono">Dica: use "Título | Responsável / Data"</span>
                                </div>
                                <textarea 
                                  id="txtEdicaoProximosBullets" 
                                  rows="4" 
                                  class="w-full p-2.5 text-xs bg-white border border-blue-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-sans leading-relaxed shadow-2xs"
                                  placeholder="Ex: #102 Homologação em UAT | Carlos - 20/11/2026"
                                >${this.ctrl.escapeHtml(bulletsParaEdicao)}</textarea>
                                <div class="flex items-center justify-between pt-1">
                                  <button 
                                    type="button" 
                                    onclick="app.visaoExecutivaComponent.restaurarProximosPassosPadrao()" 
                                    class="text-[11px] text-slate-500 hover:text-rose-600 underline cursor-pointer"
                                  >
                                    Restaurar Automático
                                  </button>
                                  <div class="flex items-center gap-1.5">
                                    <button 
                                      type="button" 
                                      onclick="app.visaoExecutivaComponent.alternarEdicaoProximosPassos(false)" 
                                      class="px-2.5 py-1 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-md text-xs font-medium cursor-pointer"
                                    >
                                      Cancelar
                                    </button>
                                    <button 
                                      type="button" 
                                      onclick="app.visaoExecutivaComponent.salvarEdicaoProximosPassos(document.getElementById('txtEdicaoProximosBullets').value)" 
                                      class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-2xs cursor-pointer"
                                    >
                                      Salvar Itens
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ` : `
                              <ul class="space-y-1.5 text-xs text-slate-700">
                                ${item.itensDestaque && item.itensDestaque.length > 0 ? item.itensDestaque.map(b => `
                                  <li class="flex items-start gap-2">
                                    <span class="w-1.5 h-1.5 rounded-full ${b.atrasado ? 'bg-rose-500' : 'bg-blue-500'} mt-1.5 shrink-0"></span>
                                    <div class="flex-1 min-w-0">
                                      ${typeof b === 'object' && b.id ? `<span class="font-semibold text-slate-900">#${this.ctrl.escapeHtml(b.id)} </span>` : ''}
                                      <span>${typeof b === 'object' ? this.ctrl.escapeHtml(b.titulo) : this.ctrl.escapeHtml(b)}</span>
                                      ${typeof b === 'object' ? `
                                        <span class="text-[10px] font-mono text-slate-500 ml-1">
                                          (${this.ctrl.escapeHtml(b.responsavel)}${b.dataProgramada ? ' • Prog: ' + this.ctrl.escapeHtml(b.dataProgramada) : ''}${b.atrasado ? ' <strong class="text-rose-600 font-bold">!</strong>' : ''})
                                        </span>
                                      ` : ''}
                                    </div>
                                  </li>
                                `).join('') : '<li class="text-slate-400 italic text-[11px]">Nenhum próximo passo pendente.</li>'}
                              </ul>
                            `}
                          </div>
                        `;
                      }).join('')}
                      </div>
                    `}
                  </div>
                </div>

                <!-- Riscos & Pontos de Atenção -->
                <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-card space-y-3">
                  <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h5 class="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <i class="fa-solid fa-triangle-exclamation text-amber-500"></i>
                      <span>Riscos e Pontos de Atenção (${m.riscos.length})</span>
                    </h5>
                    <button 
                      type="button" 
                      onclick="document.getElementById('formNovoRiscoExec')?.classList.toggle('hidden')" 
                      class="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-semibold text-[11px] transition flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                    >
                      <i class="fa-solid fa-plus text-[10px]"></i>
                      <span>Adicionar Item</span>
                    </button>
                  </div>

                  <div id="formNovoRiscoExec" class="hidden bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div class="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <select id="inputRiscoCategoria" class="sm:col-span-3 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none">
                        <option value="Ponto de Atenção">Ponto de Atenção</option>
                        <option value="Risco">Risco</option>
                        <option value="Impedimento">Impedimento</option>
                      </select>
                      <input type="text" id="inputRiscoIniciativa" placeholder="Iniciativa / Frente..." class="sm:col-span-5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none">
                      <select id="inputRiscoImpacto" class="sm:col-span-2 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none">
                        <option value="Médio">Médio</option>
                        <option value="Alto">Alto</option>
                        <option value="Baixo">Baixo</option>
                      </select>
                      <input type="date" id="inputRiscoDataFinal" class="sm:col-span-2 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono outline-none cursor-pointer">
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <input type="text" id="inputRiscoMotivo" placeholder="Descrição do risco, dependência ou gargalo..." class="sm:col-span-10 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none">
                      <button 
                        type="button" 
                        id="btnSalvarRiscoExec" 
                        onclick="
                          const cat = document.getElementById('inputRiscoCategoria').value;
                          const ini = document.getElementById('inputRiscoIniciativa').value;
                          const mot = document.getElementById('inputRiscoMotivo').value;
                          const imp = document.getElementById('inputRiscoImpacto').value;
                          const dt = document.getElementById('inputRiscoDataFinal').value;
                          app.visaoExecutivaComponent.salvarRiscoManual(cat, ini, mot, imp, dt);
                        " 
                        class="sm:col-span-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs transition active:scale-95 cursor-pointer"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>

                  ${m.riscos.length === 0 ? `
                    <div class="py-6 text-center text-slate-400 text-xs">
                      Nenhum risco ou ponto de atenção registrado para esta visão.
                    </div>
                  ` : `
                    <div class="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
                      ${m.riscos.map(r => `
                        <div class="py-2.5 flex items-start justify-between gap-3 text-xs hover:bg-slate-50/80 px-2 rounded-lg transition group">
                          <div class="space-y-0.5 min-w-0 flex-1">
                            <div class="flex items-center gap-2">
                              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${r.impacto === 'Alto' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}">
                                ${this.ctrl.escapeHtml(r.categoria || 'Atenção')} (${r.impacto || 'Médio'})
                              </span>
                              <strong class="text-slate-800 truncate">${this.ctrl.escapeHtml(r.iniciativa)}</strong>
                            </div>
                            <p class="text-slate-600 leading-snug">${this.ctrl.escapeHtml(r.motivo)}</p>
                          </div>
                          ${r.id && String(r.id).startsWith('custom_') ? `
                            <button 
                              type="button" 
                              onclick="app.visaoExecutivaComponent.removerRisco('${this.ctrl.escapeAttrJs(r.id)}')" 
                              class="text-slate-300 hover:text-rose-600 p-1 rounded transition text-xs shrink-0 cursor-pointer"
                              title="Remover"
                            >
                              <i class="fa-solid fa-trash-can"></i>
                            </button>
                          ` : ''}
                        </div>
                      `).join('')}
                    </div>
                  `}
                </div>
              </div>
            </div>
          </div>

          <!-- SLIDE 2: CRONOGRAMA GANTT -->
          <div id="slide2CronogramaGantt" class="slide-executivo ${this.abaSlideB === 2 ? '' : 'hidden'}">
            ${this.gerarHtmlGantt(this.obterItensSelecionados(false))}
          </div>
          <div id="slide3CronogramaGanttDetalhado" class="${this.abaSlideB === 3 ? '' : 'hidden'}">
            ${this.gerarHtmlGanttDetalhado(this.obterItensSelecionados(false))}
          </div>
        </div>
      </div>
    `;
  }

  // ================= VISUALIZAÇÃO E DOWNLOAD DA APRESENTAÇÃO =================
  baixarApresentacao() {
    this.abrirPreviaApresentacao();
  }

  abrirPreviaApresentacao() {
    const frentesAtivas = this.obterFrentesAtivasNaApresentacao();
    if (!frentesAtivas || frentesAtivas.length === 0) {
      this.ctrl.exibirToast('Selecione ao menos uma frente para exportar.', 'erro');
      return;
    }

    // Slide 1: Dados globais (sem filtro de status)
    // Slide 2: Respeita o filtro de status ativo
    const itensGlobais = this.obterItensSelecionados(true);
    const itensGantt = this.obterItensSelecionados(false);

    const tituloMacro = this.filtroMacroCadeia 
      ? `Cadeia de Valor: ${this.filtroMacroCadeia}` 
      : 'Portfólio Consolidado';

    const cicloAtual = this.ctrl?.configuracoes?.ciclo || 'Ciclo Ativo';

    // 1. Extração limpa do Slide 1
    const elSlide1Original = document.getElementById('slide1StatusReport');
    let slide1Html = '';
    if (elSlide1Original) {
      const clone1 = elSlide1Original.cloneNode(true);
      clone1.classList.remove('hidden');
      clone1.querySelectorAll('button, #formNovoRiscoExec, .btn-editar-bloco, .btn-incluir-risco').forEach(el => el.remove());
      clone1.querySelectorAll('.overflow-y-auto, .max-h-56, .max-h-64').forEach(el => {
        el.classList.remove('overflow-y-auto', 'max-h-56', 'max-h-64');
        el.style.maxHeight = 'none';
        el.style.overflow = 'visible';
      });
      slide1Html = clone1.innerHTML;
    }

    // 2. Extração limpa do Slide 2 (Gantt)
    const ganttHtml = this.gerarHtmlGantt(itensGantt);
    const tempGantt = document.createElement('div');
    tempGantt.innerHTML = ganttHtml;
    tempGantt.querySelectorAll('.gantt-selection-controls, .gantt-checkbox, .gantt-checkbox-col').forEach(el => el.remove());
    tempGantt.querySelectorAll('.gantt-row').forEach(row => {
      const id = row.getAttribute('data-id');
      if (id && !this.atividadesGanttSelecionadas.has(String(id))) {
        row.remove();
      }
    });

    // Remove prévia anterior se existir
    const modalExistente = document.getElementById('modalPreviaPdfFullscreen');
    if (modalExistente) modalExistente.remove();

    // 3. Cria a Modal de Pré-visualização com Controles
    const modalPrevia = document.createElement('div');
    modalPrevia.id = 'modalPreviaPdfFullscreen';
    modalPrevia.className = 'fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[99999] flex flex-col items-center justify-start overflow-y-auto p-4 sm:p-6';
    
    modalPrevia.innerHTML = `
      <!-- BARRA DE FERRAMENTAS FIXA NO TOPO DA PRÉVIA -->
      <div class="sticky top-0 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 w-full max-w-6xl mb-6 select-none">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs shadow-sm">
            <i class="fa-solid fa-file-pdf"></i>
          </div>
          <div>
            <h4 class="font-bold text-sm text-white flex items-center gap-2">
              <span>Prévia da Apresentação (2 Slides em Paisagem)</span>
              <span class="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">Pronto para PDF</span>
            </h4>
            <p class="text-[11px] text-slate-400">Verifique a diagramação abaixo antes de exportar</p>
          </div>
        </div>

        <div class="flex items-center gap-2.5">
          <!-- Opção 1: Salvar PDF do Navegador (100% Vetorial e Fiel) -->
          <button 
            type="button" 
            onclick="app.visaoExecutivaComponent.imprimirPrevia()"
            class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center gap-2 shadow-md active:scale-95 cursor-pointer"
            title="Abre o assistente do navegador para Salvar em PDF com qualidade máxima"
          >
            <i class="fa-solid fa-print text-xs"></i>
            <span>Salvar como PDF / Imprimir</span>
          </button>

          <!-- Opção 2: Download Direto Automático -->
          <button 
            type="button" 
            onclick="app.visaoExecutivaComponent.executarDownloadDiretoPdf()"
            class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center gap-2 shadow-md active:scale-95 cursor-pointer"
            title="Download direto do arquivo .pdf"
          >
            <i class="fa-solid fa-download text-xs"></i>
            <span>Baixar Arquivo (.pdf)</span>
          </button>

          <!-- Botão Fechar Prévia -->
          <button 
            type="button" 
            onclick="document.getElementById('modalPreviaPdfFullscreen')?.remove()"
            class="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            title="Fechar pré-visualização"
          >
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>
      </div>

      <!-- FOLHAS DOS SLIDES (ÁREA DE CAPTURA) -->
      <div id="areaCapturaPdfReal" class="w-full max-w-6xl space-y-8 pb-12">
        
        <!-- PÁGINA 1: SLIDE 1 -->
        <div class="pagina-slide-impressao bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8" style="min-height: 680px; box-sizing: border-box;">
          <div class="flex items-center justify-between border-b-2 border-slate-200 pb-3 mb-4">
            <div>
              <h2 class="text-lg font-bold text-slate-900">${this.ctrl.escapeHtml(tituloMacro)}</h2>
              <p class="text-xs text-slate-500">Slide 1: Síntese Executiva de Desempenho e Indicadores RAG</p>
            </div>
            <div class="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              Ciclo: ${this.ctrl.escapeHtml(cicloAtual)}
            </div>
          </div>
          <div>${slide1Html}</div>
        </div>

        <!-- PÁGINA 2: SLIDE 2 -->
        <div class="pagina-slide-impressao bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8" style="min-height: 680px; box-sizing: border-box;">
          <div class="flex items-center justify-between border-b-2 border-slate-200 pb-3 mb-4">
            <div>
              <h2 class="text-lg font-bold text-slate-900">${this.ctrl.escapeHtml(tituloMacro)}</h2>
              <p class="text-xs text-slate-500">Slide 2: Cronograma Executivo de Entregas (Gantt)</p>
            </div>
            <div class="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              Filtro Status: ${this.ctrl.escapeHtml(this.filtroStatusExec || 'Todos')}
            </div>
          </div>
          <div>${tempGantt.innerHTML}</div>
        </div>

      </div>
    `;

    document.body.appendChild(modalPrevia);
    this.ctrl.exibirToast('Pré-visualização gerada! Escolha "Salvar como PDF" ou "Baixar".', 'sucesso');
  }

  // ================= SALVAR PDF VIA DIÁLOGO NATIVO DO NAVEGADOR =================
  imprimirPrevia() {
    const area = document.getElementById('areaCapturaPdfReal');
    if (!area) return;

    const printWin = window.open('', '_blank');
    if (!printWin) {
      this.ctrl.exibirToast('Permita pop-ups no navegador para emitir o PDF.', 'erro');
      return;
    }

    const titulo = this.filtroMacroCadeia || 'Apresentacao_Executiva';

    printWin.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${titulo}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <style>
    @page { 
      size: landscape; 
      margin: 8mm; 
    }
    body { 
      background-color: #ffffff; 
      color: #0f172a; 
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 0;
    }
    .pagina-slide-impressao {
      page-break-after: always;
      break-after: page;
      margin-bottom: 24px;
      box-shadow: none !important;
      border: 1px solid #e2e8f0 !important;
    }
    .pagina-slide-impressao:last-child {
      page-break-after: auto;
      break-after: auto;
    }
  </style>
</head>
<body class="p-2">
  <div style="max-width: 1120px; margin: 0 auto;">
    ${area.innerHTML}
  </div>
  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 350);
    });
  </script>
</body>
</html>`);
    printWin.document.close();
  }

  // ================= DOWNLOAD DIRETO VIA HTML2PDF SOBRE ELEMENTO VISÍVEL =================
  async executarDownloadDiretoPdf() {
    const area = document.getElementById('areaCapturaPdfReal');
    if (!area) return;

    this.ctrl.exibirToast('Compilando arquivo PDF direto...', 'info');

    const tituloMacro = (this.filtroMacroCadeia || 'Consolidado').replace(/[^a-zA-Z0-9]/g, '_');
    const dataHoje = window.DataUtils ? window.DataUtils.obterDataHojeISO() : new Date().toISOString().slice(0, 10);
    const nomeArquivo = `Apresentacao_Executiva_${tituloMacro}_${dataHoje}.pdf`;

    const opt = {
      margin: [6, 6, 6, 6],
      filename: nomeArquivo,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'landscape'
      },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    try {
      await html2pdf().set(opt).from(area).save();
      this.ctrl.exibirToast('Arquivo PDF baixado com sucesso!', 'sucesso');
    } catch (e) {
      console.error('Erro no html2pdf direto:', e);
      this.ctrl.exibirToast('Utilize o botão "Salvar como PDF / Imprimir" caso seu navegador bloqueie a renderização.', 'info');
      this.imprimirPrevia();
    }
  }

  renderizarModeloSlides(container, headerSub) {
    const frentesAtivas = this.obterFrentesAtivasNaApresentacao();
    const frenteAtual = frentesAtivas[this.slideAtual] || frentesAtivas[0];
    const itens = this.obterItensCadeia(frenteAtual, true);
    const m = this.calcularMetricas(itens);

    if (headerSub) {
      headerSub.innerText = `Apresentação Slide-by-Slide: Frente ${this.slideAtual + 1} de ${frentesAtivas.length}`;
    }

    container.innerHTML = `
      <div class="space-y-4 max-w-4xl mx-auto">
        <div class="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <button 
            type="button" 
            onclick="app.visaoExecutivaComponent.voltarParaSelecao()" 
            class="px-2.5 py-1 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
          >
            <i class="fa-solid fa-arrow-left text-[10px]"></i>
            <span>Voltar</span>
          </button>
          <div class="flex items-center gap-2">
            <button 
              type="button" 
              onclick="app.visaoExecutivaComponent.mudarSlide(-1)" 
              ${this.slideAtual === 0 ? 'disabled' : ''} 
              class="px-3 py-1 rounded-lg border border-slate-200 text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition"
            >
              <i class="fa-solid fa-chevron-left"></i>
            </button>
            <span class="text-xs font-mono font-bold text-slate-700">${this.slideAtual + 1} / ${frentesAtivas.length}</span>
            <button 
              type="button" 
              onclick="app.visaoExecutivaComponent.mudarSlide(1)" 
              ${this.slideAtual >= frentesAtivas.length - 1 ? 'disabled' : ''} 
              class="px-3 py-1 rounded-lg border border-slate-200 text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition"
            >
              <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-card space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span class="text-[10px] font-mono text-indigo-600 font-bold uppercase tracking-wider block">Frente de Entrega</span>
              <h3 class="text-xl font-extrabold text-slate-900 tracking-tight">${this.ctrl.escapeHtml(frenteAtual)}</h3>
            </div>
            <div class="text-right">
              <span class="text-[10px] text-slate-400 uppercase font-semibold block">Progresso Real</span>
              <span class="text-2xl font-black text-emerald-700 font-mono">${m.progressoMedio}%</span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span class="text-xs text-slate-500 block">Total de Atividades</span>
              <strong class="text-base text-slate-900 font-mono">${m.total}</strong>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span class="text-xs text-slate-500 block">Concluídas</span>
              <strong class="text-base text-emerald-700 font-mono">${m.concluidas}</strong>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span class="text-xs text-slate-500 block">Em Andamento</span>
              <strong class="text-base text-blue-700 font-mono">${m.emAndamento}</strong>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  mudarSlide(delta) {
    const frentes = this.obterFrentesAtivasNaApresentacao();
    const novo = this.slideAtual + delta;
    if (novo >= 0 && novo < frentes.length) {
      this.slideAtual = novo;
      this.renderizarApresentacao();
    }
  }
}

window.VisaoExecutivaComponent = VisaoExecutivaComponent;
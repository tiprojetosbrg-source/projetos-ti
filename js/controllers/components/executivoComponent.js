// js/controllers/components/executivoComponent.js

class ExecutivoComponent {
  constructor(controller) {
    this.ctrl = controller;
    this.statusArrastadoIndex = null;
    this.etapaArrastadaIndex = null;
    this.radarArrastadoIndex = null;
    this.statusFiltroPainelAtivo = 'Não iniciado';
    this.ordemRadarCriticos = this.carregarOrdemRadarSalva();
  }

  // ================= PERSISTÊNCIA DA ORDEM DO RADAR =================

  carregarOrdemRadarSalva() {
    try {
      const salvo = localStorage.getItem('brg_radar_ordem_personalizada');
      return salvo ? JSON.parse(salvo) : [];
    } catch (e) {
      return [];
    }
  }

  salvarOrdemRadar() {
    try {
      localStorage.setItem('brg_radar_ordem_personalizada', JSON.stringify(this.ordemRadarCriticos));
    } catch (e) {}
  }

  // ================= CÁLCULO DE KPIS =================

  calcularKpis() {
    const total = this.ctrl.bancoDados.length;
    const concluidas = this.ctrl.bancoDados.filter(x => this.ctrl.normalizarStatus(x.status) === 'Concluído').length;
    const criticas = this.ctrl.bancoDados.filter(x => {
      const isCritica = x.prioridade && (x.prioridade.includes('P0') || x.prioridade.includes('P1'));
      const s = this.ctrl.normalizarStatus(x.status);
      return isCritica && (s === 'Em Andamento' || s === 'Não iniciado');
    }).length;
    const andamento = this.ctrl.bancoDados.filter(x => this.ctrl.normalizarStatus(x.status) === 'Em Andamento').length;
    const bloqueadas = this.ctrl.bancoDados.filter(x => this.ctrl.normalizarStatus(x.status) === 'Bloqueado').length;
    const taxa = total > 0 ? Math.round((concluidas / total) * 100) : 0;
    
    const foraDoPrazo = this.ctrl.obterDadosAtividadesForaDoPrazo().length;

    this.ctrl._setText('kpiTotalAtividades', total);
    this.ctrl._setText('kpiTaxaConclusao', `${taxa}%`);
    this.ctrl._setText('kpiPrioridadeCritica', criticas);
    this.ctrl._setText('kpiEmAndamentoBloqueadas', `${andamento} / ${bloqueadas}`);
    this.ctrl._setText('kpiForaDoPrazo', foraDoPrazo);
  }

  // ================= NAVEGAÇÃO E FILTROS A PARTIR DO PAINEL =================

  irParaAtividadesFiltradasP0P1() {
    this.ctrl.filtroApenasForaDoPrazo = false;
    this.ctrl.alternarVisaoPrincipal('atividades');
    this.ctrl.limparFiltros(false);
    this.ctrl._setValue('filtroPrioridade', 'P0_P1');
    this.ctrl.aplicarFiltros(true);
    this.ctrl.exibirToast('Filtro aplicado: Prioridades P0 e P1 (Críticas)', 'info');
  }

  irParaAtividadesForaDoPrazo() {
    this.ctrl.alternarVisaoPrincipal('atividades');
    this.ctrl.limparFiltros(false);
    this.ctrl.filtroApenasForaDoPrazo = true;
    this.ctrl.aplicarFiltros(true);
    this.ctrl.exibirToast(`Filtradas ${this.ctrl.itensFiltradosAtuais.length} demanda(s) fora do prazo da etapa.`, 'erro');
  }

  selecionarStatusPainelInterativo(statusNome) {
    this.statusFiltroPainelAtivo = this.ctrl.normalizarStatus(statusNome);
    this.atualizarPainelExecutivo();
  }

  irParaAtividadesFiltradasStatusAtual() {
    const st = this.statusFiltroPainelAtivo || 'Não iniciado';
    this.ctrl.alternarVisaoPrincipal('atividades');
    this.ctrl.limparFiltros(false);
    this.ctrl._setValue('filtroStatus', st);
    this.ctrl.aplicarFiltros(true);
    this.ctrl.exibirToast(`Filtro aplicado para status: ${st}`, 'info');
  }

  // ================= DRAG AND DROP DO RADAR CRÍTICO =================

  aoArrastarRadar(e, index) {
    this.radarArrastadoIndex = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    e.currentTarget.classList.add('opacity-40', 'border-rose-400');
  }

  aoSobreporArrasto(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  aoEntrarArrasto(e) {
    e.currentTarget?.classList.add('drop-target-active');
  }

  aoSairArrasto(e) {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    e.currentTarget?.classList.remove('drop-target-active');
  }

  aoFinalizarArrastoRadar(e) {
    e.currentTarget?.classList.remove('opacity-40', 'border-rose-400');
    document.querySelectorAll('.drop-target-active').forEach(el => el.classList.remove('drop-target-active'));
    this.radarArrastadoIndex = null;
  }

  aoSoltarRadar(e, indexDestino) {
    e.preventDefault();
    e.currentTarget?.classList.remove('drop-target-active');
    if (this.radarArrastadoIndex === null || this.radarArrastadoIndex === undefined) return;
    if (this.radarArrastadoIndex === indexDestino) return;

    const item = this.ordemRadarCriticos.splice(this.radarArrastadoIndex, 1)[0];
    this.ordemRadarCriticos.splice(indexDestino, 0, item);
    this.radarArrastadoIndex = null;
    this.salvarOrdemRadar();
    this.atualizarPainelExecutivo();
    this.ctrl.exibirToast(`Demanda #${item} priorizada para a posição #${indexDestino + 1}!`, 'sucesso');
  }

  moverItemRadar(index, direcao) {
    const novoIndex = index + direcao;
    if (novoIndex < 0 || novoIndex >= this.ordemRadarCriticos.length) return;
    const item = this.ordemRadarCriticos.splice(index, 1)[0];
    this.ordemRadarCriticos.splice(novoIndex, 0, item);
    this.salvarOrdemRadar();
    this.atualizarPainelExecutivo();
    this.ctrl.exibirToast(`Prioridade executiva da demanda #${item} atualizada!`, 'sucesso');
  }

  // ================= CORES DE ETAPAS DO FUNIL =================

  obterCorDotEtapa(etapa) {
    if (!etapa) return 'bg-slate-400';
    const e = etapa.toLowerCase();
    if (e.includes('planej')) return 'bg-sky-500';
    if (e.includes('não') || e.includes('nao')) return 'bg-slate-400';
    if (e.includes('dev')) return 'bg-blue-500';
    if (e.includes('qa')) return 'bg-amber-500';
    if (e.includes('uat')) return 'bg-purple-500';
    if (e.includes('ag')) return 'bg-emerald-500';
    if (e.includes('produ') || e.includes('conclu')) return 'bg-emerald-600';
    return 'bg-slate-400';
  }

  obterCorBarraEtapa(etapa) {
    if (!etapa) return 'bg-slate-400';
    const e = etapa.toLowerCase();
    if (e.includes('planej')) return 'bg-sky-500';
    if (e.includes('não') || e.includes('nao')) return 'bg-slate-400';
    if (e.includes('dev')) return 'bg-blue-500';
    if (e.includes('qa')) return 'bg-amber-500';
    if (e.includes('uat')) return 'bg-purple-500';
    if (e.includes('ag')) return 'bg-emerald-500';
    if (e.includes('produ') || e.includes('conclu')) return 'bg-emerald-600';
    return 'bg-emerald-500';
  }

  // ================= RENDERIZAÇÃO DO PAINEL EXECUTIVO =================

  atualizarPainelExecutivo() {
    this.ctrl.migrarStatusLegado();
    this.calcularKpis(); // <-- ADICIONAR ESTA LINHA
    this.ctrl._setText('lblSubheaderCiclo', this.ctrl.configuracoes.ciclo || 'Ciclo Q4 2026');
    this.ctrl._setText('lblHeaderTitulo', this.ctrl.configuracoes.organizacao || 'Prioridades dos Projetos BRG');
    this.ctrl._setText('badgeTabAtividades', this.ctrl.bancoDados.length);

    // 1. Radar P0/P1
    const containerRadar = document.getElementById('execRadarCriticosContainer');
    if (containerRadar) {
      const criticasAtivas = this.ctrl.bancoDados.filter(x => {
        const isCritica = x.prioridade && (x.prioridade.includes('P0') || x.prioridade.includes('P1'));
        const s = this.ctrl.normalizarStatus(x.status);
        return isCritica && (s === 'Em Andamento' || s === 'Não iniciado');
      });

      const ordenados = [];
      this.ordemRadarCriticos.forEach(idSalvo => {
        const achado = criticasAtivas.find(x => String(x.id) === String(idSalvo));
        if (achado) ordenados.push(achado);
      });
      criticasAtivas.forEach(item => {
        if (!ordenados.some(x => String(x.id) === String(item.id))) {
          ordenados.push(item);
        }
      });

      this.ordemRadarCriticos = ordenados.map(x => String(x.id));
      this.salvarOrdemRadar();

      if (ordenados.length === 0) {
        containerRadar.innerHTML = `
          <div class="py-8 text-center text-slate-400 space-y-1">
            <i class="fa-solid fa-circle-check text-emerald-500 text-xl"></i>
            <div class="text-xs font-medium text-slate-700">Nenhum gargalo crítico P0/P1 em aberto!</div>
            <p class="text-[10px] text-slate-400">Todas as demandas críticas deste ciclo estão concluídas.</p>
          </div>
        `;
      } else {
        containerRadar.innerHTML = ordenados.map((item, idx) => {
          const isPrimeiro = idx === 0;
          const isUltimo = idx === ordenados.length - 1;
          const badgeCorPosicao = isPrimeiro 
            ? 'bg-rose-600 text-white font-bold' 
            : (idx === 1 ? 'bg-amber-600 text-white font-bold' : 'bg-slate-800 text-slate-100 font-semibold');

          return `
            <div 
              draggable="true"
              ondragstart="app.aoArrastarRadar(event, ${idx})"
              ondragover="app.aoSobreporArrasto(event)"
              ondragenter="app.aoEntrarArrasto(event)"
              ondragleave="app.aoSairArrasto(event)"
              ondrop="app.aoSoltarRadar(event, ${idx})"
              ondragend="app.aoFinalizarArrastoRadar(event)"
              class="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-lg transition select-none cursor-move group border border-transparent hover:border-slate-200/80"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <i class="fa-solid fa-grip-vertical text-slate-300 group-hover:text-slate-600 cursor-grab text-xs shrink-0"></i>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded shadow-2xs shrink-0 ${badgeCorPosicao}">
                  #${idx + 1}
                </span>
                <span class="font-mono font-bold text-slate-900 text-xs px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 shrink-0">
                  ${this.ctrl.escapeHtml(item.id)}
                </span>
                <div class="min-w-0">
                  <div class="font-medium text-slate-900 truncate text-xs" title="${this.ctrl.escapeHtml(item.titulo)}">
                    ${this.ctrl.escapeHtml(item.titulo)}
                  </div>
                  <div class="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                    <span class="text-slate-700 font-medium">${this.ctrl.escapeHtml(item.responsavel)}</span>
                    <span>•</span>
                    <span>${this.ctrl.escapeHtml(item.cadeiaValor)}</span>
                    <span>•</span>
                    <span class="font-mono">Prazo: ${this.ctrl.formatarMesAno(item.prazo)}</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <div class="flex items-center opacity-60 group-hover:opacity-100 transition-opacity">
                  <button 
                    type="button" 
                    onclick="event.stopPropagation(); app.moverItemRadar(${idx}, -1)" 
                    ${isPrimeiro ? 'disabled' : ''}
                    class="p-1 text-slate-300 hover:text-slate-700 disabled:opacity-20 transition rounded"
                  >
                    <i class="fa-solid fa-arrow-up text-[10px]"></i>
                  </button>
                  <button 
                    type="button" 
                    onclick="event.stopPropagation(); app.moverItemRadar(${idx}, 1)" 
                    ${isUltimo ? 'disabled' : ''}
                    class="p-1 text-slate-300 hover:text-slate-700 disabled:opacity-20 transition rounded"
                  >
                    <i class="fa-solid fa-arrow-down text-[10px]"></i>
                  </button>
                </div>
                ${this.ctrl.gerarBadgePrioridade(item.prioridade)}
                <button 
                  type="button" 
                  onclick="app.abrirModalDetalhesId('${this.ctrl.escapeAttrJs(item.id)}')"
                  class="p-1 text-slate-400 hover:text-blue-600 transition text-xs"
                  title="Ver detalhes executivos da demanda"
                >
                  <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </button>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // 2. Pipeline por Status
    const containerPills = document.getElementById('execStatusPillsContainer');
    const containerAtividadesStatus = document.getElementById('execStatusAtividadesContainer');
    const listaStatus = (this.ctrl.configuracoes.statusList && this.ctrl.configuracoes.statusList.length > 0)
      ? this.ctrl.configuracoes.statusList
      : ['Não iniciado', 'Em Andamento', 'Concluído', 'Em Revisão', 'Bloqueado'];

    if (!listaStatus.includes(this.statusFiltroPainelAtivo)) {
      this.statusFiltroPainelAtivo = listaStatus[0] || 'Não iniciado';
    }

    if (containerPills) {
      containerPills.innerHTML = listaStatus.map(st => {
        const count = this.ctrl.bancoDados.filter(x => this.ctrl.normalizarStatus(x.status) === st).length;
        const isAtivo = st === this.statusFiltroPainelAtivo;
        return `
          <button 
            type="button"
            onclick="app.selecionarStatusPainelInterativo('${this.ctrl.escapeAttrJs(st)}')"
            class="px-2.5 py-1 rounded-lg text-xs font-medium transition active:scale-95 flex items-center gap-1.5 shadow-2xs ${isAtivo ? 'bg-slate-900 text-white font-semibold ring-2 ring-blue-500/20' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'}"
          >
            <span>${this.ctrl.escapeHtml(st)}</span>
            <span class="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${isAtivo ? 'bg-blue-500 text-white' : 'bg-slate-200/80 text-slate-600'}">
              ${count}
            </span>
          </button>
        `;
      }).join('');
    }

    if (containerAtividadesStatus) {
      const itensDoStatus = this.ctrl.bancoDados.filter(x => this.ctrl.normalizarStatus(x.status) === this.statusFiltroPainelAtivo);
      if (itensDoStatus.length === 0) {
        containerAtividadesStatus.innerHTML = `
          <div class="py-8 text-center text-slate-400 space-y-1">
            <i class="fa-solid fa-inbox text-slate-300 text-xl"></i>
            <div class="text-xs font-medium text-slate-600">Nenhuma atividade com status "${this.ctrl.escapeHtml(this.statusFiltroPainelAtivo)}"</div>
            <p class="text-[10px] text-slate-400">Selecione outro status acima.</p>
          </div>
        `;
      } else {
        containerAtividadesStatus.innerHTML = itensDoStatus.map(item => `
          <div class="py-2 flex items-center justify-between gap-2.5 hover:bg-slate-50 px-2 rounded-lg transition group">
            <div class="flex items-center gap-2 min-w-0">
              <button 
                type="button"
                onclick="app.abrirModalDetalhesId('${this.ctrl.escapeAttrJs(item.id)}')"
                class="font-mono font-bold text-slate-900 text-xs px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 shrink-0 hover:border-blue-400 hover:text-blue-700 transition"
              >
                ${this.ctrl.escapeHtml(item.id)}
              </button>
              <div class="min-w-0">
                <div class="font-medium text-slate-900 truncate text-xs" title="${this.ctrl.escapeHtml(item.titulo)}">
                  ${this.ctrl.escapeHtml(item.titulo)}
                </div>
                <div class="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                  <span class="text-slate-700 font-medium">${this.ctrl.escapeHtml(item.responsavel)}</span>
                  <span>•</span>
                  <span>${this.ctrl.escapeHtml(item.cadeiaValor)}</span>
                  <span>•</span>
                  <span class="font-mono">${item.progresso}%</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              ${this.ctrl.gerarBadgePrioridade(item.prioridade)}
              <button 
                type="button" 
                onclick="app.abrirModalDetalhesId('${this.ctrl.escapeAttrJs(item.id)}')"
                class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition text-xs"
              >
                <i class="fa-solid fa-arrow-up-right-from-square"></i>
              </button>
            </div>
          </div>
        `).join('');
      }
    }

    // 3. Funil de Etapas
    const containerFunil = document.getElementById('execFunilEtapasContainer');
    this.ctrl._setText('execTotalEtapasBadge', `${this.ctrl.configuracoes.etapas.length} etapas`);
    if (containerFunil) {
      const totalAtividades = this.ctrl.bancoDados.length || 1;
      containerFunil.innerHTML = this.ctrl.configuracoes.etapas.map(etapa => {
        const itensEtapa = this.ctrl.bancoDados.filter(x => (x.etapa || 'Dev') === etapa.nome);
        const pctDoTotal = Math.round((itensEtapa.length / totalAtividades) * 100);
        
        return `
          <div class="bg-slate-50 border border-slate-200/70 p-2.5 rounded-lg space-y-1.5 hover:border-slate-300 transition">
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full ${this.obterCorDotEtapa(etapa.nome)}"></span>
                <span class="font-medium text-slate-800">${this.ctrl.escapeHtml(etapa.nome)}</span>
                <span class="text-[10px] text-slate-400 font-mono bg-white px-1.5 py-0.2 rounded border border-slate-200">${etapa.peso}%</span>
              </div>
              <div class="flex items-center gap-1.5 font-mono text-xs">
                <span class="font-bold text-slate-900">${itensEtapa.length}</span>
                <span class="text-slate-400 text-[11px]">(${pctDoTotal}%)</span>
              </div>
            </div>
            <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div class="${this.obterCorBarraEtapa(etapa.nome)} h-1.5 rounded-full transition-all duration-300" style="width: ${pctDoTotal}%;"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // 4. Progresso por Projetos / Frentes
    const containerCadeias = document.getElementById('execCadeiaValorContainer');
    const cadeiasUnicas = [...new Set([...this.ctrl.configuracoes.cadeiasValor, ...this.ctrl.bancoDados.map(x => x.cadeiaValor)])].filter(Boolean);
    this.ctrl._setText('execTotalCadeiasBadge', `${cadeiasUnicas.length} frentes`);

    if (containerCadeias) {
      containerCadeias.innerHTML = cadeiasUnicas.map(c => {
        const itensCadeia = this.ctrl.bancoDados.filter(x => x.cadeiaValor === c);
        const total = itensCadeia.length;
        const concluidas = itensCadeia.filter(x => this.ctrl.normalizarStatus(x.status) === 'Concluído').length;
        const mediaProgresso = total > 0 
          ? Math.round(itensCadeia.reduce((acc, curr) => acc + (parseInt(curr.progresso, 10) || 0), 0) / total) 
          : 0;

        return `
          <div class="space-y-1 text-xs">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <span class="font-medium text-slate-800">${this.ctrl.escapeHtml(c)}</span>
                <span class="text-[10px] text-slate-400">(${total} atividades)</span>
              </div>
              <div class="flex items-center gap-2 font-mono text-[11px]">
                <span class="text-emerald-700 font-semibold">${concluidas}/${total} prontas</span>
                <span class="font-bold text-slate-900">${mediaProgresso}%</span>
              </div>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
              <div class="bg-indigo-600 h-2 rounded-full transition-all duration-300" style="width: ${mediaProgresso}%;"></div>
            </div>
          </div>
        `;
      }).join('');
    }
  }
}

window.ExecutivoComponent = ExecutivoComponent;
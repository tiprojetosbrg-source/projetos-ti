// js/controllers/components/tabelaComponent.js
class TabelaComponent {
  constructor(controller) {
    this.ctrl = controller;
    this.debounceTimer = null;
    this.atividadesExpandidasTabela = new Set();
  }

  get itensPorPagina() { return this.ctrl.itensPorPagina; }
  set itensPorPagina(v) { this.ctrl.itensPorPagina = v; }
  get paginaAtual() { return this.ctrl.paginaAtual; }
  set paginaAtual(v) { this.ctrl.paginaAtual = v; }
  get itensFiltradosAtuais() { return this.ctrl.itensFiltradosAtuais; }
  set itensFiltradosAtuais(v) { this.ctrl.itensFiltradosAtuais = v; }

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
    if (chamarAplicar) this.aplicarFiltros(true);
  }

  aplicarFiltros(resetarPagina = false) {
    if (resetarPagina) this.paginaAtual = 1;
    const termo = (document.getElementById('filtroBusca')?.value || '').toLowerCase().trim();
    const macroCadeia = (document.getElementById('filtroMacroCadeiaValor')?.value || '').trim();
    const cadeia = (document.getElementById('filtroCadeiaValor')?.value || '').trim();
    const equipe = (document.getElementById('filtroEquipe')?.value || '').trim();
    const prioridade = (document.getElementById('filtroPrioridade')?.value || '').trim();
    const statusFiltro = (document.getElementById('filtroStatus')?.value || '').trim();
    const temFiltroAtivo = Boolean(
      termo || macroCadeia || cadeia || equipe || prioridade || statusFiltro || this.ctrl.filtroApenasForaDoPrazo
    );
    const btnLimpar = document.getElementById('btnLimparFiltros');
    if (btnLimpar) {
      btnLimpar.classList.toggle('hidden', !temFiltroAtivo);
      btnLimpar.classList.toggle('inline-flex', temFiltroAtivo);
    }
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
      if (statusFiltro && !statusFiltro.toLowerCase().includes('todos')) {
        const stItemNorm = this.ctrl.normalizarStatus(item.status);
        const stFiltroNorm = this.ctrl.normalizarStatus(statusFiltro);
        if (stItemNorm !== stFiltroNorm) return false;
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

      // 1. Linha Mestre da Atividade
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

      // 2. Sub-tabela Sanfonada das Etapas (quando expandido)
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
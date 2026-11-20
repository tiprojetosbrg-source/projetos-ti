// js/controllers/components/roadmapComponent.js

class RoadmapComponent {
  constructor(controller) {
    this.ctrl = controller;
    this.etapasExpandidasRoadmap = new Set();
    this.roadmapAgrupamento = 'cadeiaValor';
    this.roadmapAnosSelecionados = [2026];
    this.roadmapPrioridadesSelecionadas = []; // [] significa todas
    this.roadmapMesesGrade = [];
    this.mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  }

  // ================= CONTROLE DE PRIORIDADE MULTISSELEÇÃO =================

  // ================= CONTROLE DE PRIORIDADE MULTISSELEÇÃO DINÂMICA =================
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

  popularDropdownPrioridadesRoadmap() {
    // Busca pelo ID ou diretamente pelo container interno do dropdown no HTML existente
    const container = document.getElementById('listaCheckboxesPrioridadeRoadmap') 
                   || document.querySelector('#dropdownPrioridadeRoadmap .space-y-1');
    if (!container) return;

    const lista = this.obterListaPrioridadesConfiguradas();

    // Limpa prioridades selecionadas que foram eventualmente excluídas nas configurações
    if (this.roadmapPrioridadesSelecionadas.length > 0 && !this.roadmapPrioridadesSelecionadas.includes('NENHUMA')) {
      this.roadmapPrioridadesSelecionadas = this.roadmapPrioridadesSelecionadas.filter(p => lista.includes(p));
    }

    container.innerHTML = lista.map(prio => {
      const estilo = this.obterEstiloDotPrioridade(prio);
      const isChecado = this.roadmapPrioridadesSelecionadas.length === 0 || this.roadmapPrioridadesSelecionadas.includes(prio);
      return `
        <label class="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition select-none">
          <span class="flex items-center gap-2 text-slate-800 font-medium truncate">
            <input 
              type="checkbox" 
              value="${this.ctrl.escapeAttrJs(prio)}" 
              ${isChecado ? 'checked' : ''}
              onchange="app.aoAlternarPrioridadeRoadmap('${this.ctrl.escapeAttrJs(prio)}', this.checked)" 
              class="chk-prioridade-roadmap rounded text-emerald-600 focus:ring-0 cursor-pointer h-3.5 w-3.5 shrink-0"
            >
            <span class="font-semibold ${estilo.texto} text-[11px] truncate">${this.ctrl.escapeHtml(prio)}</span>
          </span>
          <span class="w-2 h-2 rounded-full ${estilo.dot} shrink-0 ml-1"></span>
        </label>
      `;
    }).join('');

    this.atualizarRotuloPrioridadeRoadmap();
  }

  togglePrioridadeRoadmapDropdown(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('dropdownPrioridadeRoadmap');
    if (!dropdown) return;
    const vaiAbrir = dropdown.classList.contains('hidden');
    if (vaiAbrir) {
      // Reconstrói sempre a lista com base nas prioridades ativas da configuração antes de exibir
      this.popularDropdownPrioridadesRoadmap();
    }
    dropdown.classList.toggle('hidden');
  }fecharPrioridadeRoadmapDropdown() {
    document.getElementById('dropdownPrioridadeRoadmap')?.classList.add('hidden');
  }

  sincronizarCheckboxesPrioridade() {
    const checkboxes = document.querySelectorAll('.chk-prioridade-roadmap');
    checkboxes.forEach(chk => {
      if (this.roadmapPrioridadesSelecionadas.length === 0) {
        chk.checked = true;
      } else if (this.roadmapPrioridadesSelecionadas.includes('NENHUMA')) {
        chk.checked = false;
      } else {
        chk.checked = this.roadmapPrioridadesSelecionadas.includes(chk.value);
      }
    });
    this.atualizarRotuloPrioridadeRoadmap();
  }

  aoAlternarPrioridadeRoadmap(prio, checado) {
    const todas = this.obterListaPrioridadesConfiguradas();
    if (this.roadmapPrioridadesSelecionadas.length === 0) {
      if (!checado) {
        this.roadmapPrioridadesSelecionadas = todas.filter(p => p !== prio);
      }
    } else {
      if (checado) {
        this.roadmapPrioridadesSelecionadas = this.roadmapPrioridadesSelecionadas.filter(p => p !== 'NENHUMA');
        if (!this.roadmapPrioridadesSelecionadas.includes(prio)) {
          this.roadmapPrioridadesSelecionadas.push(prio);
        }
        if (this.roadmapPrioridadesSelecionadas.length === todas.length) {
          this.roadmapPrioridadesSelecionadas = [];
        }
      } else {
        this.roadmapPrioridadesSelecionadas = this.roadmapPrioridadesSelecionadas.filter(p => p !== prio);
        if (this.roadmapPrioridadesSelecionadas.length === 0) {
          this.roadmapPrioridadesSelecionadas = ['NENHUMA'];
        }
      }
    }
    this.atualizarRotuloPrioridadeRoadmap();
    this.renderizarRoadmap();
  }

  selecionarTodasPrioridadesRoadmap(todas) {
    this.roadmapPrioridadesSelecionadas = todas ? [] : ['NENHUMA'];
    this.sincronizarCheckboxesPrioridade();
    this.renderizarRoadmap();
  }

  atualizarRotuloPrioridadeRoadmap() {
    const lbl = document.getElementById('lblPrioridadeRoadmapSelecionada');
    const badgeQtd = document.getElementById('lblQtdPrioridadesRoadmap');
    const btn = document.getElementById('btnTogglePrioridadeRoadmapDropdown');
    const todas = this.obterListaPrioridadesConfiguradas();
    const sel = this.roadmapPrioridadesSelecionadas;
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

  atualizarRotuloPrioridadeRoadmap() {
    const lbl = document.getElementById('lblPrioridadeRoadmapSelecionada');
    const badgeQtd = document.getElementById('lblQtdPrioridadesRoadmap');
    const sel = this.roadmapPrioridadesSelecionadas;
    let texto = 'Todas';
    let qtdTexto = 'Todas ativas';

    if (sel.length === 0) {
      texto = 'Todas';
      qtdTexto = 'Todas ativas (4)';
    } else if (sel.includes('NENHUMA')) {
      texto = 'Nenhuma';
      qtdTexto = '0 ativas';
    } else if (sel.length === 1) {
      texto = sel[0];
      qtdTexto = '1 selecionada';
    } else {
      texto = [...sel].sort().join(', ');
      qtdTexto = `${sel.length} selecionadas`;
    }

    if (lbl) lbl.innerText = texto;
    if (badgeQtd) badgeQtd.innerText = qtdTexto;
  }

  // ================= REDIMENSIONAMENTO DA COLUNA LATERAL =================

  configurarRedimensionamentoRoadmap() {
    const header = document.getElementById('roadmapHeaderColunaEsq');
    if (!header) return;

    let resizer = header.querySelector('.resizer');
    if (!resizer) {
      resizer = document.createElement('div');
      resizer.className = 'resizer';
      header.appendChild(resizer);
    }

    if (resizer.dataset.resizerBound) return;
    resizer.dataset.resizerBound = 'true';

    resizer.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.pageX;
      const startWidth = header.offsetWidth;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      resizer.classList.add('resizing');

      const onMouseMove = (moveEvent) => {
        const diffX = moveEvent.pageX - startX;
        const newWidth = Math.max(180, Math.min(800, startWidth + diffX));
        this.aplicarLarguraColunaRoadmap(newWidth);
      };

      const onMouseUp = () => {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        resizer.classList.remove('resizing');
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        try {
          localStorage.setItem('brg_roadmap_coluna_largura', String(header.offsetWidth));
        } catch (err) {}
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    this.restaurarLarguraColunaRoadmap();
  }

  aplicarLarguraColunaRoadmap(larguraPx) {
    const header = document.getElementById('roadmapHeaderColunaEsq');
    const spacer = document.getElementById('roadmapScrollbarSpacer');
    const bodyCol = document.getElementById('colunaEsquerdaDemandas');
    const larguraStr = typeof larguraPx === 'number' ? `${larguraPx}px` : larguraPx;

    [header, spacer, bodyCol].forEach(el => {
      if (el) {
        el.style.width = larguraStr;
        el.style.minWidth = larguraStr;
        el.style.maxWidth = larguraStr;
      }
    });
  }

  restaurarLarguraColunaRoadmap() {
    try {
      const salvo = localStorage.getItem('brg_roadmap_coluna_largura');
      if (salvo) {
        this.aplicarLarguraColunaRoadmap(parseInt(salvo, 10));
      }
    } catch (e) {}
  }

  // ================= HORIZONTE TEMPORAL (ANOS E EXPANSÃO) =================

  obterListaAnosDisponiveis() {
    if (!this.ctrl.configuracoes.anosRoadmap || this.ctrl.configuracoes.anosRoadmap.length === 0) {
      this.ctrl.configuracoes.anosRoadmap = [2025, 2026, 2027];
    }
    return [...new Set(this.ctrl.configuracoes.anosRoadmap)].map(Number).sort((a, b) => a - b);
  }

  popularDropdownHorizonteAnos() {
    const containerCheckboxes = document.getElementById('listaCheckboxesAnosRoadmap');
    if (!containerCheckboxes) return;

    const anosDisponiveis = this.obterListaAnosDisponiveis();
    this.roadmapAnosSelecionados = this.roadmapAnosSelecionados.map(Number).filter(ano => anosDisponiveis.includes(ano));
    if (this.roadmapAnosSelecionados.length === 0) {
      const anoAtual = new Date().getFullYear();
      this.roadmapAnosSelecionados = anosDisponiveis.includes(anoAtual) ? [anoAtual] : [anosDisponiveis[0]];
    }

    containerCheckboxes.innerHTML = anosDisponiveis.map(ano => {
      const isChecado = this.roadmapAnosSelecionados.includes(ano);
      return `
        <label class="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition select-none border border-transparent hover:border-slate-200">
          <span class="flex items-center gap-2 text-slate-800 font-medium">
            <input 
              type="checkbox" 
              value="${ano}" 
              ${isChecado ? 'checked' : ''} 
              onchange="app.aoAlternarAnoHorizonte(${ano}, this.checked)"
              class="rounded text-emerald-600 focus:ring-0 cursor-pointer h-3.5 w-3.5"
            >
            <span class="font-mono text-xs font-semibold">${ano}</span>
          </span>
          <span class="text-[10px] text-slate-400 font-mono">12 meses</span>
        </label>
      `;
    }).join('');

    this.atualizarRotuloHorizonteSelecionado();
  }

  toggleHorizonteDropdown(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('dropdownHorizonteAnos');
    if (!dropdown) return;
    const vaiAbrir = dropdown.classList.contains('hidden');
    if (vaiAbrir) {
      this.popularDropdownHorizonteAnos();
    }
    dropdown.classList.toggle('hidden');
  }

  fecharHorizonteDropdown() {
    document.getElementById('dropdownHorizonteAnos')?.classList.add('hidden');
  }

  aoAlternarAnoHorizonte(ano, checado) {
    ano = parseInt(ano, 10);
    if (checado) {
      if (!this.roadmapAnosSelecionados.includes(ano)) {
        this.roadmapAnosSelecionados.push(ano);
      }
    } else {
      if (this.roadmapAnosSelecionados.length === 1) {
        this.ctrl.exibirToast('Selecione pelo menos um ano para a linha do tempo.', 'info');
        this.popularDropdownHorizonteAnos();
        return;
      }
      this.roadmapAnosSelecionados = this.roadmapAnosSelecionados.filter(a => a !== ano);
    }

    this.roadmapAnosSelecionados.sort((a, b) => a - b);
    this.atualizarRotuloHorizonteSelecionado();
    this.atualizarGradeTemporalRoadmap();
    this.renderizarRoadmap();
  }

  selecionarTodosAnosHorizonte(todos) {
    if (todos) {
      this.roadmapAnosSelecionados = this.obterListaAnosDisponiveis();
    }
    this.popularDropdownHorizonteAnos();
    this.atualizarGradeTemporalRoadmap();
    this.renderizarRoadmap();
  }

  atualizarRotuloHorizonteSelecionado() {
    const total = this.roadmapAnosSelecionados.length;
    let txt = '';
    if (total === 1) {
      txt = `${this.roadmapAnosSelecionados[0]}`;
    } else if (total === 2 && this.roadmapAnosSelecionados[1] - this.roadmapAnosSelecionados[0] === 1) {
      txt = `${this.roadmapAnosSelecionados[0]} - ${this.roadmapAnosSelecionados[1]} (${total * 12}M)`;
    } else {
      txt = `${this.roadmapAnosSelecionados.join(', ')} (${total * 12}M)`;
    }
    
    this.ctrl._setText('lblHorizonteSelecionado', txt);
    this.ctrl._setText('lblQtdAnosSelecionados', `${total} ${total === 1 ? 'ano ativo' : 'anos ativos'}`);
  }

  alterarAgrupamentoRoadmap(tipo) {
    this.roadmapAgrupamento = tipo;
    const bFrente = document.getElementById('btnAgruparFrentes');
    const bEquipe = document.getElementById('btnAgruparEquipe');
    const bPlano = document.getElementById('btnAgruparPlano');

    [bFrente, bEquipe, bPlano].forEach(b => {
      if (b) b.className = 'px-2.5 py-1 rounded-md font-medium text-slate-500 hover:text-slate-800 transition';
    });

    if (tipo === 'cadeiaValor' && bFrente) bFrente.className = 'px-2.5 py-1 rounded-md font-semibold text-slate-800 bg-white shadow-2xs transition';
    if (tipo === 'equipe' && bEquipe) bEquipe.className = 'px-2.5 py-1 rounded-md font-semibold text-slate-800 bg-white shadow-2xs transition';
    if (tipo === 'plano' && bPlano) bPlano.className = 'px-2.5 py-1 rounded-md font-semibold text-slate-800 bg-white shadow-2xs transition';

    this.renderizarRoadmap();
  }

  // ================= CÁLCULO E EXPANSÃO DA TIMELINE =================

  atualizarGradeTemporalRoadmap() {
    const topHeader = document.getElementById('timelineTopHeaderRow');
    const quartersHeader = document.getElementById('timelineQuartersHeader');
    const monthsHeader = document.getElementById('timelineMonthsHeader');
    if (!topHeader || !monthsHeader) return;

    this.roadmapMesesGrade = [];
    const hoje = new Date();
    const anoAtualHoje = hoje.getFullYear();
    const mesAtualHoje = hoje.getMonth();

    const anos = [...this.roadmapAnosSelecionados].sort((a, b) => a - b);
    const totalAnos = anos.length || 1;

    let htmlTop = '';
    anos.forEach((ano, idx) => {
      const isUltimo = idx === totalAnos - 1;
      htmlTop += `
        <div style="flex: 1 1 0%;" class="py-1.5 ${!isUltimo ? 'border-r border-slate-300' : ''} font-bold bg-slate-100 text-slate-700 text-xs tracking-wider text-center">
          ANO ${ano}
        </div>
      `;
    });
    topHeader.innerHTML = htmlTop;

    if (quartersHeader) {
      let htmlQuartos = '';
      anos.forEach((ano, anoIdx) => {
        const isUltimoAno = anoIdx === totalAnos - 1;
        [1, 2, 3, 4].forEach((trimestre, qIdx) => {
          const isUltimoTrimestreDoAno = qIdx === 3;
          const mesInicioTrimestre = (trimestre - 1) * 3;
          const trimestreContemHoje = (ano === anoAtualHoje && mesAtualHoje >= mesInicioTrimestre && mesAtualHoje <= mesInicioTrimestre + 2);

          htmlQuartos += `
            <div 
              style="flex: 3 1 0%; min-width: 150px" 
              class="py-1 text-center ${!isUltimoTrimestreDoAno ? 'border-r border-slate-200/80' : (!isUltimoAno ? 'border-r border-slate-300' : '')} ${trimestreContemHoje ? 'bg-emerald-50/70 text-emerald-700 font-semibold' : 'bg-slate-50/60 text-slate-500'}"
              title="Trimestre Q${trimestre} de ${ano}"
            >
              Q${trimestre}
            </div>
          `;
        });
      });
      quartersHeader.innerHTML = htmlQuartos;
    }

    let htmlMeses = '';
    anos.forEach(ano => {
      this.mesesNomes.forEach((mes, idx) => {
        const isHoje = (ano === anoAtualHoje && idx === mesAtualHoje);
        this.roadmapMesesGrade.push({ ano, mesIndex: idx, nome: mes, isHoje });

        htmlMeses += `
          <div class="flex-1 py-1.5 text-center border-r border-slate-200/80 min-w-[50px] ${isHoje ? 'bg-emerald-50 text-emerald-800 font-bold border-emerald-300' : ''}">
            <span class="block text-[11px]">${mes}</span>
            <span class="block text-[9px] font-mono text-slate-400 opacity-70">${String(ano).slice(2)}</span>
          </div>
        `;
      });
    });
    monthsHeader.innerHTML = htmlMeses;

    const larguraMinima = Math.max(840, totalAnos * 600);
    [monthsHeader, topHeader, quartersHeader].forEach(el => {
      if (el) {
        el.style.minWidth = `${larguraMinima}px`;
        el.style.width = '100%';
      }
    });

    const topScrollbarInner = document.getElementById('timelineTopScrollbarInner');
    if (topScrollbarInner) {
      topScrollbarInner.style.width = '100%';
      topScrollbarInner.style.minWidth = `${larguraMinima}px`;
    }
  }
  
  obterDatasEfetivasRoadmap(item) {
    const statusNorm = (this.ctrl.normalizarStatus(item.status) || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    const isConcluido = statusNorm.includes('conclu') || statusNorm.includes('finaliz');
    const utils = window.DataUtils;

    let inicioBruto = item.prazoInicio || (item.etapaInicio ? String(item.etapaInicio).substring(0, 10) : '') || item.prazo || '';
    let inicio = utils ? utils.normalizarDataFimMes(inicioBruto, '') : inicioBruto;

    let fimBruto = '';
    if (isConcluido && item.conclusao) {
      fimBruto = item.conclusao;
    } else {
      fimBruto = item.prazo || item.conclusao || inicio;
    }
    let fim = utils ? utils.normalizarDataFimMes(fimBruto, inicio) : fimBruto;

    if (!inicio && fim) inicio = fim;
    if (!fim && inicio) fim = inicio;

    let anoIni = parseInt(String(inicio).split('-')[0], 10) || new Date().getFullYear();
    let anoFim = parseInt(String(fim).split('-')[0], 10) || anoIni;

    if (inicio > fim) {
      const temp = inicio;
      inicio = fim;
      fim = temp;
      const tempAno = anoIni;
      anoIni = anoFim;
      anoFim = tempAno;
    }

    return { inicio, fim, anoIni, anoFim };
  }

  calcularPosicionamentoRoadmap(dataInicioStr, dataFimStr) {
    const totalMeses = this.roadmapMesesGrade.length;
    if (totalMeses === 0) return { visivel: false };

    const primeiroSlot = this.roadmapMesesGrade[0];
    const ultimoSlot = this.roadmapMesesGrade[totalMeses - 1];

    let anoIni = primeiroSlot.ano;
    let mesIni = primeiroSlot.mesIndex;
    let diaFracIni = 0;

    if (dataInicioStr) {
      const partes = dataInicioStr.split('-').map(Number);
      if (!isNaN(partes[0])) anoIni = partes[0];
      if (partes.length >= 2 && !isNaN(partes[1])) {
        mesIni = Math.max(0, Math.min(11, partes[1] - 1));
      }
      if (partes.length >= 3 && !isNaN(partes[2])) {
        diaFracIni = Math.max(0, Math.min(29, partes[2] - 1)) / 30;
      }
    }

    let anoFim = ultimoSlot.ano;
    let mesFim = ultimoSlot.mesIndex;

    if (dataFimStr) {
      const partes = dataFimStr.split('-').map(Number);
      if (!isNaN(partes[0])) anoFim = partes[0];
      if (partes.length >= 2 && !isNaN(partes[1])) {
        mesFim = Math.max(0, Math.min(11, partes[1] - 1));
      }
    }

    const valIni = anoIni * 12 + mesIni;
    const valFim = anoFim * 12 + mesFim;
    const valPrimeiro = primeiroSlot.ano * 12 + primeiroSlot.mesIndex;
    const valUltimo = ultimoSlot.ano * 12 + ultimoSlot.mesIndex;

    if (valFim < valPrimeiro || valIni > valUltimo) {
      return { visivel: false };
    }

    const vemDoPassado = valIni < valPrimeiro;
    const vaiParaFuturo = valFim > valUltimo;

    let idxIni = this.roadmapMesesGrade.findIndex(s => s.ano === anoIni && s.mesIndex === mesIni);
    if (idxIni === -1) {
      if (vemDoPassado) {
        idxIni = 0;
        diaFracIni = 0;
      } else {
        idxIni = this.roadmapMesesGrade.findIndex(s => (s.ano * 12 + s.mesIndex) > valIni);
        if (idxIni === -1) idxIni = totalMeses - 1;
      }
    }

    let idxFim = this.roadmapMesesGrade.findIndex(s => s.ano === anoFim && s.mesIndex === mesFim);
    if (idxFim === -1) {
      if (vaiParaFuturo) {
        idxFim = totalMeses - 1;
      } else {
        for (let i = totalMeses - 1; i >= 0; i--) {
          if ((this.roadmapMesesGrade[i].ano * 12 + this.roadmapMesesGrade[i].mesIndex) < valFim) {
            idxFim = i;
            break;
          }
        }
        if (idxFim === -1) idxFim = 0;
      }
    }

    if (idxFim < idxIni) idxFim = idxIni;

    const posIniAbs = idxIni + diaFracIni;
    const posFimAbs = idxFim + 1;

    const leftPct = Math.max(0, (posIniAbs / totalMeses) * 100);
    const rightPct = Math.min(100, (posFimAbs / totalMeses) * 100);
    const widthPct = Math.max(2.5, rightPct - leftPct);

    return {
      visivel: true,
      leftPct,
      widthPct,
      vemDoPassado,
      vaiParaFuturo
    };
  }

  toggleExpandirEtapasRoadmap(id, event) {
    if (event) event.stopPropagation();
    const idStr = String(id);
    if (this.etapasExpandidasRoadmap.has(idStr)) {
      this.etapasExpandidasRoadmap.delete(idStr);
    } else {
      this.etapasExpandidasRoadmap.add(idStr);
    }
    this.renderizarRoadmap();
  }

  obterCorBarraRoadmap(item) {
    const statusNorm = this.ctrl.normalizarStatus(item.status);
    if (statusNorm === 'Bloqueado') return 'bg-rose-500 text-white';
    if (statusNorm === 'Concluído') return 'bg-emerald-600 text-white';
    if (statusNorm === 'Em Andamento') return 'bg-blue-600 text-white';
    if (statusNorm === 'Em Revisão') return 'bg-purple-600 text-white';
    if (statusNorm === 'Cancelado') return 'bg-slate-500 text-white line-through opacity-75';
    return 'bg-slate-400 text-white';
  }

  obterCorBarraSubEtapa(etapa) {
    const isConcluida = Boolean(etapa.concluida || (etapa.dataEntrega && String(etapa.dataEntrega).trim() !== ''));
    if (isConcluida) return 'bg-emerald-600 text-white';

    const nome = (etapa.nome || '').toLowerCase();
    if (nome.includes('planej')) return 'bg-sky-500 text-white';
    if (nome.includes('dev')) return 'bg-blue-500 text-white';
    if (nome.includes('qa') || nome.includes('uat')) return 'bg-amber-500 text-white';
    if (nome.includes('ag') || nome.includes('produ')) return 'bg-emerald-500 text-white';
    return 'bg-slate-400 text-white';
  }

  // ================= RENDERIZAÇÃO DA GRADE =================

  renderizarRoadmap() {
    this.popularDropdownPrioridadesRoadmap(); // <-- Garante a reconstrução das prioridades
    if (!this.roadmapMesesGrade || this.roadmapMesesGrade.length === 0) {
      this.atualizarGradeTemporalRoadmap();
      this.restaurarLarguraColunaRoadmap();
    }

    const filtroMacroCadeia = document.getElementById('filtroMacroCadeiaRoadmap')?.value || '';
    const filtroFrente = document.getElementById('filtroFrenteRoadmap')?.value || '';
    const filtroStatus = document.getElementById('filtroStatusRoadmap')?.value || '';
    const prioridadesAtivas = this.roadmapPrioridadesSelecionadas;

    this.ctrl._setText('lblCicloRoadmap', this.ctrl.configuracoes.ciclo || 'Ciclo Ativo');
    this.ctrl._setText('badgeTabRoadmap', this.ctrl.bancoDados.length);

    const anosSelecionados = (this.roadmapAnosSelecionados && this.roadmapAnosSelecionados.length > 0)
      ? this.roadmapAnosSelecionados
      : [new Date().getFullYear()];

    const itensFiltrados = this.ctrl.bancoDados.filter(item => {
      // 1. Filtro da Cadeia de Valor (Pai)
      if (filtroMacroCadeia) {
        const itemMacro = String(item.macroCadeiaValor || '').trim().toLowerCase();
        if (itemMacro !== filtroMacroCadeia.trim().toLowerCase()) return false;
      }

      // 2. Filtro Projetos / Frentes
      if (filtroFrente && item.cadeiaValor !== filtroFrente) return false;

      // 3. Filtro de Prioridade Multisseleção
      if (prioridadesAtivas.length > 0) {
        if (prioridadesAtivas.includes('NENHUMA')) return false;
        const prioItem = String(item.prioridade || '').trim();
        const bateuPrioridade = prioridadesAtivas.some(p => {
          const cod = p.split(' ')[0];
          return prioItem.toLowerCase() === p.toLowerCase() || (cod && prioItem.startsWith(cod));
        });
        if (!bateuPrioridade) return false;
      }

      // 4. Filtro de Status
      if (filtroStatus) {
        if (this.ctrl.normalizarStatus(item.status) !== this.ctrl.normalizarStatus(filtroStatus)) {
          return false;
        }
      }

      // 5. Enquadramento no Horizonte Temporal
      const { anoIni, anoFim } = this.obterDatasEfetivasRoadmap(item);
      const minAnoItem = Math.min(anoIni, anoFim);
      const maxAnoItem = Math.max(anoIni, anoFim);

      return anosSelecionados.some(ano => ano >= minAnoItem && ano <= maxAnoItem);
    });

    this.ctrl._setText('badgeTotalRoadmap', `${itensFiltrados.length} iniciativas`);

    const colEsquerda = document.getElementById('colunaEsquerdaDemandas');
    const colDireita = document.getElementById('colunaDireitaGrade');
    if (!colEsquerda || !colDireita) return;

    colEsquerda.innerHTML = '';
    colDireita.innerHTML = '';

    const totalAnos = this.roadmapAnosSelecionados.length || 1;
    const larguraMinima = Math.max(840, totalAnos * 600);

    colDireita.className = 'flex-1 overflow-x-auto overflow-y-hidden h-fit min-h-full relative bg-slate-50/20 scroll-x-invisible';

    if (itensFiltrados.length === 0) {
      colEsquerda.innerHTML = '<div class="p-8 text-center text-xs text-slate-400">Nenhuma iniciativa encontrada para o período selecionado.</div>';
      colDireita.innerHTML = '<div class="p-8 text-center text-xs text-slate-400">Sem cronograma visível.</div>';
      return;
    }

    const colDireitaInner = document.createElement('div');
    colDireitaInner.id = 'colunaDireitaGradeInner';
    colDireitaInner.className = 'relative';
    colDireitaInner.style.width = '100%';
    colDireitaInner.style.minWidth = `${larguraMinima}px`;
    colDireita.appendChild(colDireitaInner);

    const topScrollbarInner = document.getElementById('timelineTopScrollbarInner');
    if (topScrollbarInner) {
      topScrollbarInner.style.width = '100%';
      topScrollbarInner.style.minWidth = `${larguraMinima}px`;
    }

    const grupos = {};
    if (this.roadmapAgrupamento === 'plano') {
      grupos['Todas as Demandas'] = itensFiltrados;
    } else {
      itensFiltrados.forEach(item => {
        const chave = item[this.roadmapAgrupamento] || 'Geral';
        if (!grupos[chave]) grupos[chave] = [];
        grupos[chave].push(item);
      });
    }

    Object.keys(grupos).forEach(nomeGrupo => {
      const listaDoGrupo = grupos[nomeGrupo];

      if (this.roadmapAgrupamento !== 'plano') {
        const headerEsq = document.createElement('div');
        headerEsq.className = 'h-9 px-3 bg-slate-100/90 font-semibold text-xs text-slate-800 flex items-center justify-between border-b border-slate-200/80 shrink-0 box-border';
        headerEsq.innerHTML = `
          <span class="flex items-center gap-1.5 truncate">
            <i class="fa-solid fa-folder-tree text-emerald-600 text-[11px]"></i>
            <span class="truncate">${this.ctrl.escapeHtml(nomeGrupo)}</span>
          </span>
          <span class="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200 shrink-0">${listaDoGrupo.length}</span>
        `;
        colEsquerda.appendChild(headerEsq);

        const headerDir = document.createElement('div');
        headerDir.className = 'h-9 bg-slate-100/70 border-b border-slate-200/80 shrink-0 box-border';
        colDireitaInner.appendChild(headerDir);
      }

      listaDoGrupo.forEach(item => {
        const { inicio: dtIni, fim: dtFim } = this.obterDatasEfetivasRoadmap(item);
        const pos = this.calcularPosicionamentoRoadmap(dtIni, dtFim);
        
        const etapas = (item.etapasCiclo && Array.isArray(item.etapasCiclo) && item.etapasCiclo.length > 0)
          ? item.etapasCiclo
          : [];
        const temEtapas = etapas.length > 0;
        const isExpandido = this.etapasExpandidasRoadmap.has(String(item.id));

        // Linha Esquerda
        const rowEsq = document.createElement('div');
        rowEsq.className = 'h-14 min-h-[56px] max-h-[56px] p-2.5 flex items-center justify-between gap-2 hover:bg-slate-100/70 transition cursor-pointer group border-b border-slate-100 shrink-0 box-border';
        rowEsq.onclick = () => this.ctrl.abrirModalDetalhesId(item.id);

        const anoIni = dtIni ? dtIni.split('-')[0] : '';
        const anoFim = dtFim ? dtFim.split('-')[0] : '';
        const viraAno = anoIni && anoFim && anoIni !== anoFim;

        const botaoExpandirHtml = temEtapas
          ? `<button 
               type="button" 
               onclick="app.toggleExpandirEtapasRoadmap('${this.ctrl.escapeAttrJs(item.id)}', event)"
               class="ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition inline-flex items-center gap-1 ${isExpandido ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}"
               title="${isExpandido ? 'Recolher etapas' : 'Expandir etapas'}"
             >
               <i class="fa-solid ${isExpandido ? 'fa-chevron-down text-[8px]' : 'fa-chevron-right text-[8px]'}"></i>
               <span>${etapas.length} etapas</span>
             </button>`
          : '';

        rowEsq.innerHTML = `
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 mb-0.5">
              <span class="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-1 py-0.2 rounded border border-slate-200 shrink-0">
                ${this.ctrl.escapeHtml(item.id)}
              </span>
              <span class="text-xs font-medium text-slate-900 truncate group-hover:text-emerald-700 transition" title="${this.ctrl.escapeHtml(item.titulo)}">
                ${this.ctrl.escapeHtml(item.titulo)}
              </span>
              ${botaoExpandirHtml}
            </div>
            <div class="flex items-center gap-1.5 text-[10px] text-slate-400 truncate">
              <span class="text-slate-700 font-medium truncate">${this.ctrl.escapeHtml(item.responsavel)}</span>
              <span>•</span>
              <span>${this.ctrl.formatarMesAno(dtIni)} → ${this.ctrl.formatarMesAno(dtFim)}</span>
              ${viraAno ? '<span class="bg-amber-100 text-amber-800 text-[9px] font-bold px-1 rounded border border-amber-300">Virada de Ano</span>' : ''}
            </div>
          </div>
          <div class="text-right shrink-0">
            <span class="font-mono font-bold text-xs ${item.progresso === 100 ? 'text-emerald-600' : 'text-slate-600'}">
              ${item.progresso}%
            </span>
          </div>
        `;
        colEsquerda.appendChild(rowEsq);

        // Linha Direita (Timeline)
        const rowDir = document.createElement('div');
        rowDir.className = 'h-14 min-h-[56px] max-h-[56px] relative flex items-center border-b border-slate-100 hover:bg-slate-100/50 transition shrink-0 box-border';

        rowEsq.addEventListener('mouseenter', () => rowDir.classList.add('bg-slate-100/50'));
        rowEsq.addEventListener('mouseleave', () => rowDir.classList.remove('bg-slate-100/50'));
        rowDir.addEventListener('mouseenter', () => rowEsq.classList.add('bg-slate-100/70'));
        rowDir.addEventListener('mouseleave', () => rowEsq.classList.remove('bg-slate-100/70'));

        const gridFundo = document.createElement('div');
        gridFundo.className = 'absolute inset-0 flex pointer-events-none';
        this.roadmapMesesGrade.forEach((slot) => {
          const colMes = document.createElement('div');
          colMes.className = `flex-1 border-r border-slate-100 min-w-[50px] ${slot.isHoje ? 'bg-emerald-500/5 border-r-emerald-300' : ''}`;
          gridFundo.appendChild(colMes);
        });
        rowDir.appendChild(gridFundo);

        if (pos.visivel) {
          const barWrapper = document.createElement('div');
          barWrapper.className = 'absolute z-10 px-0.5';
          barWrapper.style.left = `${pos.leftPct}%`;
          barWrapper.style.width = `${pos.widthPct}%`;

          const classeCarryLeft = pos.vemDoPassado ? 'bar-carry-over-left' : '';
          const classeCarryRight = pos.vaiParaFuturo ? 'bar-carry-over-right' : '';
          const corBarra = this.obterCorBarraRoadmap(item);

          barWrapper.innerHTML = `
            <div 
              onclick="app.abrirModalDetalhesId('${this.ctrl.escapeAttrJs(item.id)}')"
              class="roadmap-bar h-8 rounded-lg ${corBarra} ${classeCarryLeft} ${classeCarryRight} shadow-xs flex items-center justify-between px-2 cursor-pointer relative overflow-hidden select-none"
              title="${this.ctrl.escapeHtml(item.id)} - ${this.ctrl.escapeHtml(item.titulo)} (${item.progresso}%)"
            >
              <div class="absolute inset-y-0 left-0 bg-white/20 pointer-events-none" style="width: ${item.progresso}%"></div>
              <span class="text-[11px] font-semibold truncate relative z-10 flex items-center gap-1.5">
                ${pos.vemDoPassado ? '<span class="text-[9px] bg-black/30 px-1 rounded font-mono">◀</span>' : ''}
                <span class="font-mono text-[10px] opacity-90">#${this.ctrl.escapeHtml(item.id)}</span>
                <span class="truncate">${this.ctrl.escapeHtml(item.titulo)}</span>
              </span>
              <span class="text-[10px] font-mono font-bold ml-1 shrink-0 relative z-10 opacity-90 flex items-center gap-1">
                ${pos.vaiParaFuturo ? `<span class="text-[9px] bg-black/30 px-1 rounded font-sans font-normal hidden sm:inline">▶ ${anoFim}</span>` : ''}
                <span>${item.progresso}%</span>
              </span>
            </div>
          `;
          rowDir.appendChild(barWrapper);
        } else {
          const foraJanela = document.createElement('div');
          foraJanela.className = 'absolute inset-x-2 text-[10px] text-slate-400 italic pointer-events-none';
          foraJanela.innerText = `Iniciativa fora da janela do horizonte (${anoIni || '?'} a ${anoFim || '?'})`;
          rowDir.appendChild(foraJanela);
        }

        colDireitaInner.appendChild(rowDir);

        // Sub-linhas das Etapas (quando expandido)
        if (temEtapas && isExpandido) {
          etapas.forEach((etapa, idxEtapa) => {
            const isConcluida = Boolean(etapa.concluida || (etapa.dataEntrega && String(etapa.dataEntrega).trim() !== ''));
            const peso = this.ctrl.obterPesoDaEtapa(etapa.nome);
            const estiloEtapa = this.ctrl.obterEstiloEtapa(etapa.nome);
            const tituloEtapa = etapa.titulo && etapa.titulo.trim() ? etapa.titulo : `Etapa ${idxEtapa + 1}`;

            const utils = window.DataUtils;
            const rawIni = etapa.dataProgramada || etapa.Data_Programada || etapa.etapaInicio || etapa.dataInicio || dtIni;
            const rawFim = etapa.dataEntrega || etapa.Data_Conclusao || etapa.etapaFim || etapa.dataFim || '';

            let subDtIni = utils ? utils.normalizarMesAno(rawIni, dtIni) : rawIni;
            let subDtFim = '';

            if (isConcluida && rawFim) {
              subDtFim = utils ? utils.normalizarMesAno(rawFim, subDtIni) : rawFim;
            } else {
              subDtFim = subDtIni;
            }

            if (subDtIni > subDtFim) {
              const tmp = subDtIni;
              subDtIni = subDtFim;
              subDtFim = tmp;
            }

            const posSub = this.calcularPosicionamentoRoadmap(subDtIni, subDtFim);

            const subRowEsq = document.createElement('div');
            subRowEsq.className = 'h-9 min-h-[36px] max-h-[36px] pl-6 pr-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs hover:bg-slate-100/90 transition cursor-pointer shrink-0 box-border group/sub';
            subRowEsq.onclick = () => this.ctrl.abrirModalDetalhesId(item.id);
            subRowEsq.innerHTML = `
              <div class="flex items-center gap-1.5 min-w-0">
                <i class="fa-solid fa-turn-down -rotate-90 text-slate-300 text-[10px] shrink-0"></i>
                <span class="px-1.5 py-0.2 rounded text-[9px] font-semibold border ${estiloEtapa} whitespace-nowrap shrink-0">
                  ${this.ctrl.escapeHtml(etapa.nome)} (${peso}%)
                </span>
                <span class="text-[11px] text-slate-700 truncate group-hover/sub:text-slate-900" title="${this.ctrl.escapeHtml(tituloEtapa)}">
                  ${this.ctrl.escapeHtml(tituloEtapa)}
                </span>
              </div>
              <div class="shrink-0 text-[10px] font-mono">
                ${isConcluida 
                  ? '<span class="text-emerald-700 font-semibold"><i class="fa-solid fa-check text-[8px]"></i> Pronta</span>' 
                  : '<span class="text-slate-400">Pendente</span>'}
              </div>
            `;
            colEsquerda.appendChild(subRowEsq);

            const subRowDir = document.createElement('div');
            subRowDir.className = 'h-9 min-h-[36px] max-h-[36px] relative flex items-center border-b border-slate-100 bg-slate-50/40 hover:bg-slate-100/50 transition shrink-0 box-border';

            subRowEsq.addEventListener('mouseenter', () => subRowDir.classList.add('bg-slate-100/60'));
            subRowEsq.addEventListener('mouseleave', () => subRowDir.classList.remove('bg-slate-100/60'));
            subRowDir.addEventListener('mouseenter', () => subRowEsq.classList.add('bg-slate-100/90'));
            subRowDir.addEventListener('mouseleave', () => subRowEsq.classList.remove('bg-slate-100/90'));

            const subGridFundo = document.createElement('div');
            subGridFundo.className = 'absolute inset-0 flex pointer-events-none';
            this.roadmapMesesGrade.forEach((slot) => {
              const colMes = document.createElement('div');
              colMes.className = `flex-1 border-r border-slate-100 min-w-[50px] ${slot.isHoje ? 'bg-emerald-500/5 border-r-emerald-300' : ''}`;
              subGridFundo.appendChild(colMes);
            });
            subRowDir.appendChild(subGridFundo);

            if (posSub.visivel) {
              const subBarWrapper = document.createElement('div');
              subBarWrapper.className = 'absolute z-10 px-0.5';
              subBarWrapper.style.left = `${posSub.leftPct}%`;
              subBarWrapper.style.width = `${posSub.widthPct}%`;

              const corBarraEtapa = this.obterCorBarraSubEtapa(etapa);

              subBarWrapper.innerHTML = `
                <div 
                  onclick="app.abrirModalDetalhesId('${this.ctrl.escapeAttrJs(item.id)}')"
                  class="roadmap-bar h-6 rounded-md ${corBarraEtapa} shadow-2xs flex items-center justify-between px-2 cursor-pointer relative overflow-hidden select-none"
                  title="Etapa: ${this.ctrl.escapeHtml(etapa.nome)} - ${this.ctrl.escapeHtml(tituloEtapa)} [${this.ctrl.formatarMesAno(subDtIni)} a ${this.ctrl.formatarMesAno(subDtFim)}] (${isConcluida ? 'Concluída' : 'Pendente'})"
                >
                  <span class="text-[10px] font-medium truncate relative z-10 flex items-center gap-1.5">
                    <span class="font-mono text-[9px] opacity-80">${idxEtapa + 1}.</span>
                    <span class="truncate">${this.ctrl.escapeHtml(etapa.nome)}</span>
                  </span>
                  <span class="text-[9px] font-mono shrink-0 ml-1 relative z-10 opacity-90">
                    ${isConcluida ? '<i class="fa-solid fa-check text-[8px]"></i>' : `${peso}%`}
                  </span>
                </div>
              `;
              subRowDir.appendChild(subBarWrapper);
            } else {
              const foraJanela = document.createElement('div');
              foraJanela.className = 'absolute inset-x-3 text-[10px] text-slate-400 italic pointer-events-none flex items-center gap-1.5 select-none';
              foraJanela.innerHTML = `
                <i class="fa-regular fa-calendar-xmark text-[10px] text-slate-400"></i>
                <span>Etapa em ${this.ctrl.formatarMesAno(subDtIni)} (fora do horizonte visualizado)</span>
              `;
              subRowDir.appendChild(foraJanela);
            }

            colDireitaInner.appendChild(subRowDir);
          });
        }
      });
    });
  }

  recentralizarHojeRoadmap() {
    const gridBody = document.getElementById('colunaDireitaGrade');
    if (!gridBody) return;
    const idxHoje = this.roadmapMesesGrade.findIndex(m => m.isHoje);
    if (idxHoje !== -1) {
      const larguraTotal = gridBody.scrollWidth;
      const posPixel = (larguraTotal / this.roadmapMesesGrade.length) * Math.max(0, idxHoje - 1);
      gridBody.scrollTo({ left: posPixel, behavior: 'smooth' });
    }
  }
}

window.RoadmapComponent = RoadmapComponent;
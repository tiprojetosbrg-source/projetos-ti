// js/controllers/components/atrasosComponent.js
class AtrasosComponent {
  constructor(controller) {
    this.ctrl = controller;
  }

  // ================= REGRAS DE ATRASO (ETAPA >> ATIVIDADE) =================
  obterDadosAtividadesForaDoPrazo() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const resultado = [];

    this.ctrl.bancoDados.forEach(item => {
      const statusAtivNorm = String(this.ctrl.normalizarStatus(item.status) || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

      // REGRA: Atividade Concluída, Bloqueada ou em Backlog -> Não exibe nenhuma etapa
      if (statusAtivNorm.includes('bloque') || statusAtivNorm.includes('conclu') || statusAtivNorm.includes('finaliz') || statusAtivNorm.includes('backlog')) {
        return;
      }

      const etapas = (item.etapasCiclo && Array.isArray(item.etapasCiclo) && item.etapasCiclo.length > 0)
        ? item.etapasCiclo
        : [{
            nome: item.etapa || 'Dev',
            titulo: item.titulo || '',
            responsavel: item.responsavel,
            dataProgramada: item.etapaInicio,
            dataEntrega: item.etapaFim,
            concluida: Boolean(item.etapaFim || statusAtivNorm.includes('conclu')),
            obs: item.etapaObs || '',
            status: item.status
          }];

      etapas.forEach((et, idxEtapa) => {
        const statusEtapaNorm = String(et.status || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();

        // REGRA: Etapa Concluída -> Não exibe
        const isConcluida = Boolean(
          et.concluida || 
          (et.dataEntrega && String(et.dataEntrega).trim() !== '') || 
          statusEtapaNorm.includes('conclu') || 
          statusEtapaNorm.includes('finaliz')
        );
        if (isConcluida) return;

        // REGRA: Etapa em Impedimento ou Backlog -> Não exibe
        const nomeEtNorm = String(et.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const tituloEtNorm = String(et.titulo || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        if (nomeEtNorm.includes('impediment') || tituloEtNorm.includes('impediment') || statusEtapaNorm.includes('impediment') ||
            nomeEtNorm.includes('backlog') || tituloEtNorm.includes('backlog') || statusEtapaNorm.includes('backlog')) {
          return;
        }

        const responsavelEtapa = et.responsavel || item.responsavel || 'Não informado';
        const dtProgStr = String(et.dataProgramada || et.Data_Programada || (!item.etapasCiclo ? item.etapaInicio : '') || '').trim();

        // REGRA 1: Etapa sem data programada -> Exibe no relatório
        if (!dtProgStr) {
          resultado.push({
            etapaIndex: idxEtapa + 1,
            etapaNome: et.nome,
            etapaTitulo: et.titulo || '',
            semData: true,
            diasAtraso: 0,
            dataProgramada: '',
            dataProgramadaFormatada: 'Não informada',
            obsEtapa: et.obs || item.etapaObs || '',
            atividadeId: item.id,
            atividadeTitulo: item.titulo,
            cadeiaValor: item.cadeiaValor,
            equipe: item.equipe,
            prioridade: item.prioridade,
            statusAtividade: item.status,
            responsavel: responsavelEtapa,
            desenvolvedor: item.desenvolvedor || 'Não informado',
            progresso: item.progresso
          });
          return;
        }

        // Validação e conversão da data
        const dataProg = this.ctrl.parseData(dtProgStr);
        if (!dataProg || isNaN(dataProg.getTime())) {
          resultado.push({
            etapaIndex: idxEtapa + 1,
            etapaNome: et.nome,
            etapaTitulo: et.titulo || '',
            semData: true,
            diasAtraso: 0,
            dataProgramada: dtProgStr,
            dataProgramadaFormatada: dtProgStr || 'Não informada',
            obsEtapa: et.obs || item.etapaObs || '',
            atividadeId: item.id,
            atividadeTitulo: item.titulo,
            cadeiaValor: item.cadeiaValor,
            equipe: item.equipe,
            prioridade: item.prioridade,
            statusAtividade: item.status,
            responsavel: responsavelEtapa,
            desenvolvedor: item.desenvolvedor || 'Não informado',
            progresso: item.progresso
          });
          return;
        }

        // REGRA 2: Data programada vencida (D+1 do vencimento)
        const dProgLimpo = new Date(dataProg.getFullYear(), dataProg.getMonth(), dataProg.getDate());
        if (dProgLimpo < hoje) {
          const diffTempo = hoje.getTime() - dProgLimpo.getTime();
          const dias = Math.max(1, Math.floor(diffTempo / (1000 * 60 * 60 * 24)));
          resultado.push({
            etapaIndex: idxEtapa + 1,
            etapaNome: et.nome,
            etapaTitulo: et.titulo || '',
            semData: false,
            diasAtraso: dias,
            dataProgramada: dtProgStr,
            dataProgramadaFormatada: this.ctrl.formatarDataBR(dtProgStr),
            obsEtapa: et.obs || item.etapaObs || '',
            atividadeId: item.id,
            atividadeTitulo: item.titulo,
            cadeiaValor: item.cadeiaValor,
            equipe: item.equipe,
            prioridade: item.prioridade,
            statusAtividade: item.status,
            responsavel: responsavelEtapa,
            desenvolvedor: item.desenvolvedor || 'Não informado',
            progresso: item.progresso
          });
        }
      });
    });

    return resultado.sort((a, b) => {
      if (a.semData && !b.semData) return 1;
      if (!a.semData && b.semData) return -1;
      return b.diasAtraso - a.diasAtraso;
    });
  }

  verificarAtividadeForaDoPrazo(item) {
    if (!item) return false;
    const statusAtivNorm = String(this.ctrl.normalizarStatus(item.status) || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    if (statusAtivNorm.includes('bloque') || statusAtivNorm.includes('conclu') || statusAtivNorm.includes('finaliz') || statusAtivNorm.includes('backlog')) {
      return false;
    }

    const etapas = (item.etapasCiclo && Array.isArray(item.etapasCiclo) && item.etapasCiclo.length > 0)
      ? item.etapasCiclo
      : [{
          nome: item.etapa || 'Dev',
          titulo: item.titulo || '',
          dataProgramada: item.etapaInicio,
          dataEntrega: item.etapaFim,
          concluida: Boolean(item.etapaFim || statusAtivNorm.includes('conclu')),
          obs: item.etapaObs || '',
          status: item.status
        }];

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    for (const et of etapas) {
      const statusEtapaNorm = String(et.status || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const isConcluida = Boolean(
        et.concluida || 
        (et.dataEntrega && String(et.dataEntrega).trim() !== '') || 
        statusEtapaNorm.includes('conclu') || 
        statusEtapaNorm.includes('finaliz')
      );
      if (isConcluida) continue;

      const nomeEtNorm = String(et.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const tituloEtNorm = String(et.titulo || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (nomeEtNorm.includes('impediment') || tituloEtNorm.includes('impediment') || statusEtapaNorm.includes('impediment') ||
          nomeEtNorm.includes('backlog') || tituloEtNorm.includes('backlog') || statusEtapaNorm.includes('backlog')) {
        continue;
      }

      const dtProgStr = String(et.dataProgramada || et.Data_Programada || (!item.etapasCiclo ? item.etapaInicio : '') || '').trim();
      if (!dtProgStr) return true;

      const dataProg = this.ctrl.parseData(dtProgStr);
      if (!dataProg || isNaN(dataProg.getTime())) return true;

      const dProgLimpo = new Date(dataProg.getFullYear(), dataProg.getMonth(), dataProg.getDate());
      if (dProgLimpo < hoje) return true;
    }

    return false;
  }

  // ================= MODAL & EXPORTAÇÃO =================
  abrirModalRelatorioAtrasos() {
    this.ctrl.calcularKpis();
    const itens = this.obterDadosAtividadesForaDoPrazo();
    const container = document.getElementById('corpoRelatorioAtrasos');
    const badgeQtd = document.getElementById('badgeQtdAtrasosModal');
    const lblMedia = document.getElementById('lblResumoMediaAtraso');

    if (badgeQtd) {
      badgeQtd.innerText = `${itens.length} ${itens.length === 1 ? 'etapa' : 'etapas'} com apontamento`;
    }

    if (lblMedia) {
      const itensComAtraso = itens.filter(x => !x.semData && x.diasAtraso > 0);
      const qtdSemData = itens.filter(x => x.semData).length;

      if (itensComAtraso.length > 0) {
        const media = Math.round(itensComAtraso.reduce((acc, curr) => acc + curr.diasAtraso, 0) / itensComAtraso.length);
        const infoSemData = qtdSemData > 0 ? ` <span class="text-slate-400 font-normal">(${qtdSemData} sem data programada)</span>` : '';
        lblMedia.innerHTML = `Média de atraso: <strong class="text-red-700">${media} dias</strong>${infoSemData}`;
      } else if (qtdSemData > 0) {
        lblMedia.innerHTML = `Status: <strong class="text-amber-700">${qtdSemData} etapa(s) sem data programada</strong>`;
      } else {
        lblMedia.innerHTML = `Média de atraso: <strong class="text-emerald-700">0 dias</strong>`;
      }
    }

    if (container) {
      if (itens.length === 0) {
        container.innerHTML = `
          <div class="py-12 flex flex-col items-center justify-center text-center space-y-2">
            <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shadow-2xs border border-emerald-100">
              <i class="fa-solid fa-circle-check"></i>
            </div>
            <h4 class="text-sm font-semibold text-slate-800">Nenhuma etapa fora do prazo!</h4>
            <p class="text-xs text-slate-500 max-w-sm">Todas as etapas ativas estão com prazos regulares ou sob impedimento documentado.</p>
          </div>
        `;
      } else {
        container.innerHTML = itens.map(item => {
          const estiloEtapa = this.ctrl.obterEstiloEtapa(item.etapaNome);
          const badgeAtraso = item.semData
            ? `<span class="bg-amber-50 text-amber-800 border border-amber-300 px-2.5 py-1 rounded-full font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-2xs">
                 <i class="fa-solid fa-calendar-xmark text-amber-600 text-xs"></i>
                 <span>Sem Data Programada</span>
               </span>`
            : `<span class="bg-red-50 text-red-800 border border-red-300 px-2.5 py-1 rounded-full font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-2xs">
                 <i class="fa-solid fa-clock-rotate-left text-red-600 text-xs"></i>
                 <span>+${item.diasAtraso} ${item.diasAtraso === 1 ? 'dia' : 'dias'} de atraso</span>
               </span>`;

          const textoPrazo = item.semData
            ? `<span class="text-amber-800 font-mono text-[11px]">Data Programada: <strong class="text-amber-900 underline">Não preenchida</strong></span>`
            : `<span class="text-red-700 font-mono text-[11px]">Data Programada: <strong>${item.dataProgramadaFormatada}</strong></span>`;

          return `
            <div class="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs hover:border-red-300 transition">
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div class="flex items-center gap-2 min-w-0 flex-1">
                  <span class="px-2.5 py-1 rounded-lg text-xs font-bold border ${estiloEtapa} shadow-2xs whitespace-nowrap">
                    ${this.ctrl.escapeHtml(item.etapaNome)}
                  </span>
                  <div class="min-w-0">
                    <span class="text-sm font-semibold text-slate-900 truncate block">
                      ${this.ctrl.escapeHtml(item.etapaTitulo || item.etapaNome)}
                    </span>
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  ${badgeAtraso}
                </div>
              </div>

              <div class="bg-slate-50 border border-slate-200/90 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0 flex-1">
                  <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider shrink-0">Atividade Vinculada:</span>
                  <button 
                    type="button"
                    onclick="app.fecharModalRelatorioAtrasos(); app.abrirModalDetalhesId('${this.ctrl.escapeAttrJs(item.atividadeId)}')"
                    class="font-mono font-bold text-xs px-2 py-0.5 rounded bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-700 text-slate-800 transition shrink-0 flex items-center gap-1 shadow-2xs"
                    title="Ver detalhes da atividade"
                  >
                    <span>#${this.ctrl.escapeHtml(item.atividadeId)}</span>
                    <i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
                  </button>
                  <span class="font-medium text-slate-800 text-xs truncate" title="${this.ctrl.escapeHtml(item.atividadeTitulo)}">
                    ${this.ctrl.escapeHtml(item.atividadeTitulo)}
                  </span>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  ${this.ctrl.gerarBadgePrioridade(item.prioridade)}
                  <span class="text-[11px] font-mono font-semibold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">${item.progresso}%</span>
                </div>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div class="bg-white/80 p-2 rounded-lg border border-slate-100">
                  <span class="text-slate-400 block text-[10px]">Frente / Equipe</span>
                  <span class="font-medium text-slate-800 truncate block text-[11px]">${this.ctrl.escapeHtml(item.cadeiaValor)} • ${this.ctrl.escapeHtml(item.equipe)}</span>
                </div>
                <div class="bg-white/80 p-2 rounded-lg border border-slate-100">
                  <span class="text-slate-400 block text-[10px]">Resp. da Etapa</span>
                  <span class="font-medium text-slate-800 truncate block text-[11px]">${this.ctrl.escapeHtml(item.responsavel)}</span>
                </div>
                <div class="bg-white/80 p-2 rounded-lg border border-slate-100">
                  <span class="text-slate-400 block text-[10px]">Desenvolvedor</span>
                  <span class="font-medium text-slate-800 truncate block text-[11px]">${this.ctrl.escapeHtml(item.desenvolvedor)}</span>
                </div>
                <div class="bg-white/80 p-2 rounded-lg border border-slate-100">
                  <span class="text-slate-400 block text-[10px]">Situação do Prazo</span>
                  ${textoPrazo}
                </div>
              </div>

              <div class="text-xs bg-slate-50/60 p-2.5 rounded-lg border border-slate-200/70">
                <span class="font-semibold text-slate-500 text-[10px] uppercase block mb-0.5">Observações da Etapa:</span>
                <p class="text-slate-700 italic text-[11px] leading-relaxed whitespace-pre-wrap">${this.ctrl.escapeHtml(item.obsEtapa || 'Nenhuma observação registrada.')}</p>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    document.getElementById('modalRelatorioAtrasos')?.classList.remove('hidden');
  }

  fecharModalRelatorioAtrasos() {
    document.getElementById('modalRelatorioAtrasos')?.classList.add('hidden');
  }

  irParaAtividadesForaDoPrazoAPartirDoModal() {
    this.fecharModalRelatorioAtrasos();
    this.ctrl.irParaAtividadesForaDoPrazo();
  }

  baixarRelatorioAtrasosExcel() {
    const itens = this.obterDadosAtividadesForaDoPrazo();
    if (itens.length === 0) {
      this.ctrl.exibirToast('Não há nenhuma demanda atrasada para exportar.', 'info');
      return;
    }
    this.ctrl.excelService.gerarEBaixarRelatorioAtrasos(itens);
    this.ctrl.exibirToast('Relatório de demandas fora do prazo exportado com sucesso!', 'sucesso');
  }
}

window.AtrasosComponent = AtrasosComponent;
class ExcelService {
  constructor() {
    this.fileHandle = null;
    this.nomeArquivo = null;
    this.ultimoTimestampModificacao = 0;
    this.isSupported = 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
    this.isWriting = false; // Trava contra concorrência e race conditions
  }

  verificarSheetJsDisponivel() {
    if (typeof XLSX === 'undefined') {
      throw new Error('A biblioteca SheetJS (xlsx.full.min.js) não foi carregada no documento.');
    }
  }

  async tentarRestaurarSessaoAposF5() {
    if (!this.isSupported) return null;
    const handleSalvo = await window.idbHelper.recuperarHandle();
    if (!handleSalvo) return null;

    this.fileHandle = handleSalvo;

    try {
      const permStatus = await handleSalvo.queryPermission({ mode: 'read' });
      if (permStatus === 'granted') {
        const file = await handleSalvo.getFile();
        this.nomeArquivo = file.name;
        this.ultimoTimestampModificacao = file.lastModified;

        const buffer = await file.arrayBuffer();
        this.verificarSheetJsDisponivel();
        const workbook = XLSX.read(buffer, { type: 'array' });

        const dados = this.extrairRegistros(workbook);
        const configs = this.extrairConfiguracoes(workbook);

        return { dados, configs, nome: this.nomeArquivo, precisaConfirmarEscrita: false };
      }

      this.nomeArquivo = handleSalvo.name || 'Planilha_Conectada.xlsx';
      return { dados: null, configs: null, nome: this.nomeArquivo, precisaConfirmarEscrita: true };
    } catch (e) {
      console.warn('Erro ao restaurar sessão de arquivo:', e);
      return { dados: null, configs: null, nome: handleSalvo.name, precisaConfirmarEscrita: true };
    }
  }

  async garantirPermissaoEscrita() {
    if (!this.fileHandle) return false;
    try {
      const query = await this.fileHandle.queryPermission({ mode: 'readwrite' });
      if (query === 'granted') return true;

      const request = await this.fileHandle.requestPermission({ mode: 'readwrite' });
      return request === 'granted';
    } catch (e) {
      console.warn('Permissão de escrita negada ou cancelada:', e);
      return false;
    }
  }

  async abrirArquivoDoDisco() {
    if (!this.isSupported) {
      document.getElementById('fallbackFileInput')?.click();
      return null;
    }

    const [handle] = await window.showOpenFilePicker({
      types: [{
        description: 'Planilhas Excel (*.xlsx)',
        accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
      }],
      multiple: false
    });

    this.fileHandle = handle;
    const file = await handle.getFile();
    this.nomeArquivo = file.name;
    this.ultimoTimestampModificacao = file.lastModified;

    await window.idbHelper.salvarHandle(handle);

    const buffer = await file.arrayBuffer();
    this.verificarSheetJsDisponivel();
    const workbook = XLSX.read(buffer, { type: 'array' });

    const dados = this.extrairRegistros(workbook);
    const configs = this.extrairConfiguracoes(workbook);

    return { dados, configs, nome: this.nomeArquivo };
  }

  async relerArquivoDoDisco() {
    if (!this.fileHandle || this.isWriting) return null;
    try {
      const file = await this.fileHandle.getFile();
      this.nomeArquivo = file.name;
      this.ultimoTimestampModificacao = file.lastModified;

      const buffer = await file.arrayBuffer();
      this.verificarSheetJsDisponivel();
      const workbook = XLSX.read(buffer, { type: 'array' });

      const dados = this.extrairRegistros(workbook);
      const configs = this.extrairConfiguracoes(workbook);

      return { dados, configs, nome: this.nomeArquivo };
    } catch (e) {
      console.warn('Erro ao reler arquivo do disco em segundo plano:', e);
      return null;
    }
  }

  async verificarModificacaoExterna() {
    if (!this.fileHandle || this.isWriting) return { modificado: false };
    try {
      const file = await this.fileHandle.getFile();
      if (this.ultimoTimestampModificacao && file.lastModified > this.ultimoTimestampModificacao) {
        return { modificado: true, novoTimestamp: file.lastModified };
      }
      return { modificado: false, novoTimestamp: file.lastModified };
    } catch (e) {
      return { modificado: false };
    }
  }

  async criarNovoArquivo(dadosIniciais, configsIniciais) {
    if (!this.isSupported) {
      this.baixarCopiaLocal(dadosIniciais, configsIniciais, 'Projetos_BRG.xlsx');
      return null;
    }

    const handle = await window.showSaveFilePicker({
      suggestedName: 'Projetos_BRG_Database.xlsx',
      types: [{
        description: 'Planilhas Excel (*.xlsx)',
        accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
      }]
    });

    this.fileHandle = handle;
    this.nomeArquivo = handle.name;
    await window.idbHelper.salvarHandle(handle);
    await this.salvarDadosNoHandle(dadosIniciais, configsIniciais);

    const file = await handle.getFile();
    this.ultimoTimestampModificacao = file.lastModified;
    return { nome: this.nomeArquivo };
  }

  gerarWorkbookCompleto(dados, configs) {
    this.verificarSheetJsDisponivel();
    const cfg = configs || window.configuracoesPadrao;

    // 1. Aba tb_Atividades
    const linhasAtividades = (dados || []).map(item => ({
      'ID': item.id,
      'Titulo': item.titulo,
      'Cadeia_Valor': item.macroCadeiaValor || '',
      'Projetos_Frentes': item.cadeiaValor,
      'Equipe': item.equipe,
      'Prioridade': item.prioridade,
      'Status': item.status,
      'Etapa': item.etapa || 'Dev',
      'Data_Inicio': item.etapaDataInicio || '',
      'Data_Programada': item.etapaInicio || '',
      'Data_Conclusao': item.etapaFim || '',
      'Etapa_Obs': item.etapaObs || '',
      'Lider_Tech_Protheus': item.liderTechProtheus || '',
      'Lider_Tech_Webtrade': item.liderTechWebtrade || '',
      'Desenvolvedor': item.desenvolvedor || '',
      'Responsavel': item.responsavel,
      'Prazo_Inicio_Mes': item.prazoInicio || '',
      'Prazo_Programado_Mes': item.prazo,
      'Conclusao_Mes': item.conclusao || '',
      'Progresso': item.progresso,
      'Impacto': item.impacto || 'Médio',
      'Updated_At': item._updatedAt || Date.now()
    }));

    const wsAtividades = XLSX.utils.json_to_sheet(linhasAtividades);
    wsAtividades['!cols'] = [
      { wch: 8 },  // ID
      { wch: 42 }, // Titulo
      { wch: 20 }, // Cadeia_Valor
      { wch: 18 }, // Projetos_Frentes
      { wch: 18 }, // Equipe
      { wch: 14 }, // Prioridade
      { wch: 14 }, // Status
      { wch: 14 }, // Etapa
      { wch: 16 }, // Data_Inicio
      { wch: 16 }, // Data_Programada
      { wch: 16 }, // Data_Conclusao
      { wch: 35 }, // Etapa_Obs
      { wch: 22 }, // Lider_Tech_Protheus
      { wch: 22 }, // Lider_Tech_Webtrade
      { wch: 18 }, // Desenvolvedor
      { wch: 18 }, // Responsavel
      { wch: 16 }, // Prazo_Inicio_Mes
      { wch: 18 }, // Prazo_Programado_Mes
      { wch: 14 }, // Conclusao_Mes
      { wch: 10 }, // Progresso
      { wch: 10 }, // Impacto
      { wch: 16 }  // Updated_At
    ];

    // 2. Aba tb_Detalhes_ID
    const linhasDetalhes = (dados || []).map(item => ({
      'ID': item.id,
      'Atividade': item.titulo,
      'Cadeia_Valor': item.macroCadeiaValor || '',
      'Etapa_Atual': item.etapa || 'Dev',
      'Data_Inicio': item.etapaDataInicio || '',
      'Data_Programada': item.etapaInicio || '',
      'Data_Conclusao': item.etapaFim || '',
      'Observacoes_Etapa': item.etapaObs || '',
      'Trilha_Etapas_Ciclo': item.etapasCiclo ? JSON.stringify(item.etapasCiclo) : '',
      'Lider_Tech_Protheus': item.liderTechProtheus || '',
      'Lider_Tech_Webtrade': item.liderTechWebtrade || '',
      'Desenvolvedor': item.desenvolvedor || '',
      'Impacto': item.impacto || 'Médio',
      'Progresso_Pct': item.progresso,
      'Responsavel': item.responsavel,
      'Prazo_Inicio_Mes': item.prazoInicio || '',
      'Prazo_Programado_Mes': item.prazo,
      'Conclusao_Mes': item.conclusao || '',
      'Projetos_Frentes': item.cadeiaValor,
      'Equipe': item.equipe,
      'Status': item.status,
      'Prioridade': item.prioridade,
      'Updated_At': item._updatedAt || Date.now()
    }));

    const wsDetalhes = XLSX.utils.json_to_sheet(linhasDetalhes);
    wsDetalhes['!cols'] = [
      { wch: 8 },  // ID
      { wch: 42 }, // Atividade
      { wch: 20 }, // Cadeia_Valor
      { wch: 14 }, // Etapa_Atual
      { wch: 16 }, // Data_Inicio
      { wch: 16 }, // Data_Programada
      { wch: 16 }, // Data_Conclusao
      { wch: 35 }, // Observacoes_Etapa
      { wch: 35 }, // Trilha_Etapas_Ciclo
      { wch: 22 }, // Lider_Tech_Protheus
      { wch: 22 }, // Lider_Tech_Webtrade
      { wch: 18 }, // Desenvolvedor
      { wch: 10 }, // Impacto
      { wch: 12 }, // Progresso_Pct
      { wch: 18 }, // Responsavel
      { wch: 16 }, // Prazo_Inicio_Mes
      { wch: 18 }, // Prazo_Programado_Mes
      { wch: 14 }, // Conclusao_Mes
      { wch: 18 }, // Projetos_Frentes
      { wch: 18 }, // Equipe
      { wch: 14 }, // Status
      { wch: 14 }, // Prioridade
      { wch: 16 }  // Updated_At
    ];

    // 3. Aba tb_Configuracoes
    const linhasConfig = [
      { 'Tipo': 'PARAMETRO', 'Chave': 'Organizacao', 'Valor': cfg.organizacao || 'Prioridades dos Projetos BRG' },
      { 'Tipo': 'PARAMETRO', 'Chave': 'Ciclo', 'Valor': cfg.ciclo || 'Ciclo Q4 2026' },
      ...(cfg.statusList || []).map((st, idx) => ({ 'Tipo': 'STATUS', 'Chave': st, 'Valor': String(idx + 1) })),
      ...(cfg.prioridades || ['P0 - Crítica', 'P1 - Alta', 'P2 - Média', 'P3 - Baixa']).map((pr, idx) => ({ 'Tipo': 'PRIORIDADE', 'Chave': pr, 'Valor': String(idx + 1) })),
      ...(cfg.etapas || []).map(etapa => ({
        'Tipo': 'ETAPA',
        'Chave': typeof etapa === 'string' ? etapa : etapa.nome,
        'Valor': typeof etapa === 'string' ? '50%' : `${etapa.peso}%`
      })),
      ...(cfg.listaCadeiaValor || []).map(cv => ({ 'Tipo': 'CADEIA_VALOR', 'Chave': cv, 'Valor': 'Ativo' })),
      ...(cfg.cadeiasValor || []).map(c => ({ 'Tipo': 'PROJETO_FRENTE', 'Chave': c, 'Valor': 'Ativo' })),
      ...(cfg.equipes || []).map(eq => ({ 'Tipo': 'EQUIPE', 'Chave': eq, 'Valor': 'Ativo' })),
      ...(cfg.anosRoadmap || [2025, 2026, 2027]).map(ano => ({ 'Tipo': 'ANO_ROADMAP', 'Chave': String(ano), 'Valor': 'Ativo' }))
    ];

    const wsConfig = XLSX.utils.json_to_sheet(linhasConfig);
    wsConfig['!cols'] = [{ wch: 20 }, { wch: 28 }, { wch: 32 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsAtividades, window.NOME_ABA_PADRAO || 'tb_Atividades');
    XLSX.utils.book_append_sheet(wb, wsDetalhes, window.NOME_ABA_DETALHES || 'tb_Detalhes_ID');
    XLSX.utils.book_append_sheet(wb, wsConfig, window.NOME_ABA_CONFIG || 'tb_Configuracoes');

    return wb;
  }

  async salvarDadosNoHandle(dados, configs) {
    if (!this.fileHandle) return false;
    this.isWriting = true;

    try {
      const autorizado = await this.garantirPermissaoEscrita();
      if (!autorizado) throw new Error('Permissão de escrita não autorizada.');

      const wb = this.gerarWorkbookCompleto(dados, configs);
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

      const writable = await this.fileHandle.createWritable();
      await writable.write(wbout);
      await writable.close();

      const file = await this.fileHandle.getFile();
      this.ultimoTimestampModificacao = file.lastModified;
      return true;
    } finally {
      this.isWriting = false;
    }
  }

  /**
   * Mesclagem atômica com suporte a Optimistic Locking via _updatedAt.
   * Garante que salvamentos de terceiros no disco não sejam esmagados por dados em memória defasados.
   */
  async salvarDadosComMesclagem(dadosLocais, configsLocais, idModificado = null, acao = 'upsert') {
    if (!this.fileHandle) {
      return { dados: dadosLocais, configs: configsLocais };
    }

    this.isWriting = true;

    try {
      const autorizado = await this.garantirPermissaoEscrita();
      if (!autorizado) throw new Error('Permissão de escrita não autorizada.');

      const versaoDisco = await this.relerArquivoDoDisco();
      let dadosFinais = versaoDisco && Array.isArray(versaoDisco.dados) && versaoDisco.dados.length > 0
        ? [...versaoDisco.dados]
        : [...dadosLocais];

      const normalizar = id => (window.DataUtils ? window.DataUtils.normalizarId(id) : String(id || '').trim());
      const agora = Date.now();

      if (idModificado !== null && idModificado !== undefined) {
        const idBusca = normalizar(idModificado);
        if (acao === 'delete') {
          dadosFinais = dadosFinais.filter(x => normalizar(x.id) !== idBusca);
        } else {
          const itemLocal = dadosLocais.find(x => normalizar(x.id) === idBusca);
          if (itemLocal) {
            const itemAtualizado = { ...itemLocal, _updatedAt: agora };
            const idxNoDisco = dadosFinais.findIndex(x => normalizar(x.id) === idBusca);
            if (idxNoDisco !== -1) {
              dadosFinais[idxNoDisco] = itemAtualizado;
            } else {
              dadosFinais.push(itemAtualizado);
            }
          }
        }
      } else {
        // Mesclagem seletiva baseada em timestamp: só sobrescreve se o dado local for mais novo
        dadosLocais.forEach(itemLocal => {
          const idItem = normalizar(itemLocal.id);
          const idx = dadosFinais.findIndex(x => normalizar(x.id) === idItem);
          if (idx !== -1) {
            const itemDisco = dadosFinais[idx];
            const localTs = itemLocal._updatedAt || 0;
            const discoTs = itemDisco._updatedAt || 0;

            if (localTs >= discoTs) {
              dadosFinais[idx] = { ...itemDisco, ...itemLocal, _updatedAt: agora };
            }
          } else {
            dadosFinais.push({ ...itemLocal, _updatedAt: agora });
          }
        });
      }

      // Mesclagem de configurações (mantém adições feitas no disco e locais)
      const configsFinais = versaoDisco?.configs ? { ...versaoDisco.configs } : { ...configsLocais };
      if (configsLocais) {
        if (configsLocais.organizacao) configsFinais.organizacao = configsLocais.organizacao;
        if (configsLocais.ciclo) configsFinais.ciclo = configsLocais.ciclo;
        if (Array.isArray(configsLocais.listaCadeiaValor)) {
          configsFinais.listaCadeiaValor = [...new Set([...(configsFinais.listaCadeiaValor || []), ...configsLocais.listaCadeiaValor])];
        }
        if (Array.isArray(configsLocais.cadeiasValor)) {
          configsFinais.cadeiasValor = [...new Set([...(configsFinais.cadeiasValor || []), ...configsLocais.cadeiasValor])];
        }
        if (Array.isArray(configsLocais.equipes)) {
          configsFinais.equipes = [...new Set([...(configsFinais.equipes || []), ...configsLocais.equipes])];
        }
        if (Array.isArray(configsLocais.statusList)) {
          configsFinais.statusList = [...new Set([...(configsFinais.statusList || []), ...configsLocais.statusList])];
        }
        if (Array.isArray(configsLocais.prioridades)) {
          configsFinais.prioridades = [...new Set([...(configsFinais.prioridades || []), ...configsLocais.prioridades])];
        }
        if (Array.isArray(configsLocais.anosRoadmap)) {
          configsFinais.anosRoadmap = [...new Set([...(configsFinais.anosRoadmap || []), ...configsLocais.anosRoadmap])].sort((a, b) => a - b);
        }
        if (configsLocais.etapas && configsLocais.etapas.length > 0) {
          configsFinais.etapas = configsLocais.etapas;
        }
      }

      await this.salvarDadosNoHandle(dadosFinais, configsFinais);
      return { dados: dadosFinais, configs: configsFinais };
    } finally {
      this.isWriting = false;
    }
  }

  baixarCopiaLocal(dados, configs, nome = 'Projetos_BRG.xlsx') {
    const wb = this.gerarWorkbookCompleto(dados, configs);
    XLSX.writeFile(wb, nome);
  }

  gerarEBaixarRelatorioAtrasos(itensAtrasados, nomeArquivo = null) {
    this.verificarSheetJsDisponivel();
    const hojeFormatado = window.DataUtils ? window.DataUtils.obterDataHojeISO() : new Date().toISOString().split('T')[0];
    const nome = nomeArquivo || `Relatorio_Etapas_Atrasadas_${hojeFormatado}.xlsx`;

    const linhas = (itensAtrasados || []).map(item => ({
      'Etapa': item.etapaNome,
      'Titulo_Etapa': item.etapaTitulo || item.etapaNome,
      'Situacao_Prazo': item.semData ? 'Sem data programada' : `${item.diasAtraso} dias de atraso`,
      'Data_Programada': item.dataProgramadaFormatada || (item.dataProgramada ? (window.DataUtils ? window.DataUtils.formatarDataBR(item.dataProgramada) : item.dataProgramada) : 'Não informada'),
      'ID_Atividade': item.atividadeId,
      'Atividade_Vinculada': item.atividadeTitulo,
      'Prioridade': item.prioridade,
      'Status_Atividade': item.statusAtividade,
      'Projetos_Frentes': item.cadeiaValor,
      'Equipe': item.equipe,
      'Responsavel_Etapa': item.responsavel,
      'Desenvolvedor': item.desenvolvedor,
      'Progresso_Atividade': `${item.progresso}%`,
      'Observacoes_Etapa': item.obsEtapa || 'Sem observações registradas'
    }));

    const ws = XLSX.utils.json_to_sheet(linhas);
    ws['!cols'] = [
      { wch: 18 }, { wch: 30 }, { wch: 22 }, { wch: 16 },
      { wch: 14 }, { wch: 42 }, { wch: 14 }, { wch: 16 },
      { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
      { wch: 14 }, { wch: 45 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Etapas_Atrasadas');
    XLSX.writeFile(wb, nome);
  }

  extrairRegistros(workbook) {
    if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) return [];

    let nomeAba = window.NOME_ABA_PADRAO || 'tb_Atividades';
    if (!workbook.SheetNames.includes(nomeAba)) {
      nomeAba = workbook.SheetNames.includes('tb_Detalhes_ID') ? 'tb_Detalhes_ID' : workbook.SheetNames[0];
    }

    const worksheet = workbook.Sheets[nomeAba];
    if (!worksheet) return [];

    const json = XLSX.utils.sheet_to_json(worksheet);
    const mapaTrilhas = {};
    const mapaDetalhesExtras = {};

    if (workbook.SheetNames.includes(window.NOME_ABA_DETALHES || 'tb_Detalhes_ID')) {
      const wsDet = workbook.Sheets[window.NOME_ABA_DETALHES || 'tb_Detalhes_ID'];
      if (wsDet) {
        const jsonDet = XLSX.utils.sheet_to_json(wsDet);
        jsonDet.forEach(row => {
          const rawId = String(row.ID ?? row.Id ?? row.Codigo ?? '').trim();
          if (rawId) {
            mapaDetalhesExtras[rawId] = row;
            const trilhaStr = row.Trilha_Etapas_Ciclo || row.Trilha || row.Etapas || '';
            if (trilhaStr) {
              try {
                mapaTrilhas[rawId] = JSON.parse(trilhaStr);
              } catch (e) {
                console.warn(`Trilha inválida para ID ${rawId}:`, e);
              }
            }
          }
        });
      }
    }

    if (!json || json.length === 0) return [];

    return json.map((row, idx) => {
      const parsedId = String(row.ID ?? row.Id ?? row.Codigo ?? (100 + idx + 1)).trim();
      const rowDet = mapaDetalhesExtras[parsedId] || {};

      const normalizar = (val, fb = '') => window.DataUtils ? window.DataUtils.normalizarDataFimMes(val, fb) : val;

      let prazoBruto = row.Prazo_Programado_Mes ?? row.Prazo_Programado ?? row.Prazo_Mes ?? row.Prazo ?? row.Mes ?? rowDet.Prazo_Programado_Mes ?? '';
      let prazo = normalizar(prazoBruto, window.DataUtils ? window.DataUtils.obterDataHojeISO() : '');

      let prazoInicioBruto = row.Prazo_Inicio_Mes ?? row.Prazo_Inicio ?? row.PrazoInicio ?? row.Inicio_Mes ?? rowDet.Prazo_Inicio_Mes ?? '';
      let prazoInicio = normalizar(prazoInicioBruto, '');
      if (!prazoInicio) {
        const dtProg = String(row.Data_Programada || row.Etapa_Inicio || rowDet.Data_Programada || '').trim();
        prazoInicio = dtProg ? normalizar(dtProg, prazo) : prazo;
      }

      let conclusaoBruto = row.Conclusao_Mes ?? row.Conclusao ?? row.Mes_Conclusao ?? rowDet.Conclusao_Mes ?? '';
      let conclusao = normalizar(conclusaoBruto, '');

      const obs = String(row.Etapa_Obs || row.Observacoes_Etapa || row.Observacao || rowDet.Observacoes_Etapa || '').trim().slice(0, 500);

      const projetoFrente = String(
        row.Projetos_Frentes || row['Projetos/Frentes'] || row['Projetos / Frentes'] ||
        row.Projeto || row.Frente || row.Cadeia_Valor || row.CadeiaValor || rowDet.Projetos_Frentes || 'Engenharia'
      ).trim();

      const statusBruto = String(row.Status || rowDet.Status || 'Não iniciado').trim();
      const statusNormalizado = window.DataUtils ? window.DataUtils.normalizarStatus(statusBruto) : statusBruto;

      const etapaBruta = String(row.Etapa || row.Etapa_Atual || row.Fase || rowDet.Etapa_Atual || 'Dev').trim();
      const etapaNormalizada = window.DataUtils ? window.DataUtils.normalizarEtapa(etapaBruta) : etapaBruta;

      const etapasCiclo = mapaTrilhas[parsedId] || null;

      let progresso = Math.min(100, Math.max(0, parseInt(row.Progresso || row.Progresso_Pct || rowDet.Progresso_Pct || 0, 10) || 0));
      if (statusNormalizado === 'Concluído') {
        progresso = 100;
      } else if (etapasCiclo && Array.isArray(etapasCiclo) && etapasCiclo.length > 0) {
        const totalEtapas = etapasCiclo.length;
        const concluidas = etapasCiclo.filter(e => Boolean(e.concluida || (e.dataEntrega && String(e.dataEntrega).trim() !== ''))).length;
        progresso = Math.round((concluidas / totalEtapas) * 100);
      }

      const macroCadeiaValor = String(row.Cadeia_Valor || row['Cadeia de Valor'] || rowDet.Cadeia_Valor || '').trim();
      const updatedAt = Number(row.Updated_At || rowDet.Updated_At) || Date.now();

      return {
        id: parsedId,
        titulo: String(row.Titulo || row.Atividade || row.Nome || row.Descricao || rowDet.Atividade || 'Atividade sem título'),
        macroCadeiaValor: macroCadeiaValor || '',
        cadeiaValor: projetoFrente || 'Engenharia',
        equipe: String(row.Equipe || row.Time || row.Categoria || rowDet.Equipe || 'Desenvolvimento'),
        prioridade: String(row.Prioridade || rowDet.Prioridade || 'P2 - Média'),
        status: statusNormalizado,
        etapa: etapaNormalizada,
        etapaDataInicio: String(row.Data_Inicio || row.DataInicio || rowDet.Data_Inicio || ''),
        etapaInicio: String(row.Data_Programada || row.Etapa_Inicio || rowDet.Data_Programada || ''),
        etapaFim: String(row.Data_Conclusao || row.Etapa_Fim || rowDet.Data_Conclusao || ''),
        etapaObs: obs,
        etapasCiclo,
        liderTechProtheus: String(row.Lider_Tech_Protheus || row.LiderTechProtheus || rowDet.Lider_Tech_Protheus || ''),
        liderTechWebtrade: String(row.Lider_Tech_Webtrade || row.LiderTechWebtrade || rowDet.Lider_Tech_Webtrade || ''),
        desenvolvedor: String(row.Desenvolvedor || row.Dev || rowDet.Desenvolvedor || ''),
        responsavel: String(row.Responsavel || row.Dono || rowDet.Responsavel || 'Não Atribuído'),
        prazoInicio,
        prazo,
        conclusao,
        progresso,
        impacto: String(row.Impacto || rowDet.Impacto || 'Médio'),
        _updatedAt: updatedAt
      };
    });
  }

  extrairConfiguracoes(workbook) {
    const nomeAba = window.NOME_ABA_CONFIG || 'tb_Configuracoes';
    if (!workbook || !workbook.SheetNames || !workbook.SheetNames.includes(nomeAba)) {
      return { ...window.configuracoesPadrao };
    }

    const ws = workbook.Sheets[nomeAba];
    if (!ws) return { ...window.configuracoesPadrao };

    const rows = XLSX.utils.sheet_to_json(ws);
    if (!rows || rows.length === 0) return { ...window.configuracoesPadrao };

    const cfg = {
      organizacao: window.configuracoesPadrao.organizacao,
      ciclo: window.configuracoesPadrao.ciclo,
      statusList: [],
      prioridades: [],
      etapas: [],
      listaCadeiaValor: [],
      cadeiasValor: [],
      equipes: [],
      anosRoadmap: []
    };

    rows.forEach(r => {
      const tipo = String(r.Tipo || '').toUpperCase();
      let chave = String(r.Chave || '').trim();
      const valor = String(r.Valor || '').trim();

      if (tipo === 'PARAMETRO') {
        if (chave === 'Organizacao') cfg.organizacao = valor || cfg.organizacao;
        if (chave === 'Ciclo') cfg.ciclo = valor || cfg.ciclo;
      } else if (tipo === 'STATUS' && chave) {
        chave = window.DataUtils ? window.DataUtils.normalizarStatus(chave) : chave;
        if (!cfg.statusList.includes(chave)) cfg.statusList.push(chave);
      } else if (tipo === 'PRIORIDADE' && chave) {
        if (!cfg.prioridades.includes(chave)) cfg.prioridades.push(chave);
      } else if (tipo === 'ETAPA' && chave) {
        chave = window.DataUtils ? window.DataUtils.normalizarEtapa(chave) : chave;
        let pesoNum = parseInt(valor.replace(/\D/g, ''), 10);
        if (isNaN(pesoNum)) pesoNum = chave.toLowerCase().includes('planej') ? 0 : 50;
        if (!cfg.etapas.some(e => e.nome.toLowerCase() === chave.toLowerCase())) {
          cfg.etapas.push({ nome: chave, peso: Math.min(100, Math.max(0, pesoNum)) });
        }
      } else if (tipo === 'CADEIA_VALOR' && chave) {
        if (!cfg.listaCadeiaValor.includes(chave)) cfg.listaCadeiaValor.push(chave);
      } else if ((tipo.includes('PROJETO') || tipo.includes('CADEIA') || tipo.includes('AREA')) && chave) {
        if (!cfg.cadeiasValor.includes(chave)) cfg.cadeiasValor.push(chave);
      } else if ((tipo.includes('EQUIPE') || tipo.includes('CATEGORIA')) && chave) {
        if (!cfg.equipes.includes(chave)) cfg.equipes.push(chave);
      } else if (tipo === 'ANO_ROADMAP' || tipo === 'ANO') {
        const anoNum = parseInt(chave, 10);
        if (!isNaN(anoNum) && !cfg.anosRoadmap.includes(anoNum)) {
          cfg.anosRoadmap.push(anoNum);
        }
      }
    });

    if (cfg.statusList.length === 0) cfg.statusList = [...window.configuracoesPadrao.statusList];
    if (!cfg.prioridades || cfg.prioridades.length === 0) cfg.prioridades = [...(window.configuracoesPadrao.prioridades || ['P0 - Crítica', 'P1 - Alta', 'P2 - Média', 'P3 - Baixa'])];
    if (cfg.etapas.length === 0) cfg.etapas = [...window.configuracoesPadrao.etapas];
    if (cfg.listaCadeiaValor.length === 0) cfg.listaCadeiaValor = [...(window.configuracoesPadrao.listaCadeiaValor || [])];
    if (cfg.cadeiasValor.length === 0) cfg.cadeiasValor = [...window.configuracoesPadrao.cadeiasValor];
    if (cfg.equipes.length === 0) cfg.equipes = [...window.configuracoesPadrao.equipes];
    if (cfg.anosRoadmap.length === 0) cfg.anosRoadmap = [...window.configuracoesPadrao.anosRoadmap];

    return cfg;
  }
}

window.ExcelService = ExcelService;
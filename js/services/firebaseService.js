// js/services/firebaseService.js
class FirebaseService {
  constructor() {
    this.auth = window.firebaseAuth || null;
    this.db = window.firebaseDb || null;
    this.usuarioAtual = null;
    this.unsubscribeAtividades = null;
    this.unsubscribeConfiguracoes = null;
    this.isWriting = false;
  }

  estaDisponivel() {
    return Boolean(this.auth && this.db);
  }

  // --- Autenticação ---
  observarAutenticacao(callback) {
    if (!this.auth) return () => {};
    return this.auth.onAuthStateChanged((user) => {
      this.usuarioAtual = user || null;
      callback(this.usuarioAtual);
    });
  }

  async loginComEmailSenha(email, senha) {
    if (!this.auth) throw new Error('Firebase Auth não inicializado.');
    const cred = await this.auth.signInWithEmailAndPassword(email, senha);
    this.usuarioAtual = cred.user;
    return cred.user;
  }

  async logout() {
    this.pararListeners();
    if (!this.auth) return;
    await this.auth.signOut();
    this.usuarioAtual = null;
  }

  obterIdentificadorUsuario() {
    if (!this.usuarioAtual) return 'sistema';
    return this.usuarioAtual.email || this.usuarioAtual.uid || 'usuario';
  }

  // --- Listeners em Tempo Real (onSnapshot) ---
  iniciarListeners({ onAtividadesChange, onConfiguracoesChange, onErro }) {
    if (!this.db) return;
    this.pararListeners();

    this.unsubscribeAtividades = this.db.collection('atividades').onSnapshot(
      (snapshot) => {
        const lista = [];
        snapshot.forEach((doc) => {
          const data = doc.data() || {};
          lista.push({
            ...data,
            id: String(doc.id).trim()
          });
        });

        // Ordena numericamente pelo ID para consistência na UI
        lista.sort((a, b) => {
          const numA = parseInt(String(a.id).replace(/\D/g, ''), 10);
          const numB = parseInt(String(b.id).replace(/\D/g, ''), 10);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return String(a.id).localeCompare(String(b.id));
        });

        if (typeof onAtividadesChange === 'function') {
          onAtividadesChange(lista, snapshot.metadata.hasPendingWrites);
        }
      },
      (err) => {
        console.error('Erro no listener de atividades:', err);
        if (typeof onErro === 'function') onErro(err);
      }
    );

    this.unsubscribeConfiguracoes = this.db.collection('configuracoes').doc('geral').onSnapshot(
      (docSnap) => {
        if (docSnap.exists && typeof onConfiguracoesChange === 'function') {
          onConfiguracoesChange(docSnap.data());
        }
      },
      (err) => {
        console.error('Erro no listener de configurações:', err);
        if (typeof onErro === 'function') onErro(err);
      }
    );
  }

  pararListeners() {
    if (this.unsubscribeAtividades) {
      this.unsubscribeAtividades();
      this.unsubscribeAtividades = null;
    }
    if (this.unsubscribeConfiguracoes) {
      this.unsubscribeConfiguracoes();
      this.unsubscribeConfiguracoes = null;
    }
  }

  // --- Geração Atômica de ID Sequencial ---
  async gerarProximoIdAtomico(idsExistentesEmMemoria = []) {
    if (!this.db) {
      const nums = idsExistentesEmMemoria
        .map(id => parseInt(String(id).replace(/\D/g, ''), 10))
        .filter(n => !isNaN(n));
      return nums.length === 0 ? '101' : String(Math.max(...nums) + 1);
    }

    const counterRef = this.db.collection('counters').doc('atividades');
    const maxLocal = idsExistentesEmMemoria
      .map(id => parseInt(String(id).replace(/\D/g, ''), 10))
      .filter(n => !isNaN(n))
      .reduce((acc, cur) => Math.max(acc, cur), 100);

    const proximoId = await this.db.runTransaction(async (transaction) => {
      const snap = await transaction.get(counterRef);
      const ultimoBanco = snap.exists ? (Number(snap.data().ultimoId) || 100) : 100;
      const base = Math.max(ultimoBanco, maxLocal);
      const novo = base + 1;
      transaction.set(counterRef, {
        ultimoId: novo,
        atualizadoEm: Date.now(),
        atualizadoPor: this.obterIdentificadorUsuario()
      }, { merge: true });
      return String(novo);
    });

    return proximoId;
  }

  // --- Operações CRUD Granulares ---
  async salvarAtividade(item, etapasConfig = []) {
    if (!this.db) throw new Error('Firestore não inicializado.');
    this.isWriting = true;

    try {
      const sanitizado = window.DataUtils
        ? window.DataUtils.sanitizarAtividade(item, etapasConfig)
        : { ...item };

      const docId = String(sanitizado.id).trim();
      if (!docId) throw new Error('ID da atividade inválido.');

      const payload = {
        ...sanitizado,
        id: docId,
        _updatedAt: Date.now(),
        atualizadoPor: this.obterIdentificadorUsuario()
      };

      await this.db.collection('atividades').doc(docId).set(payload, { merge: true });

      // Atualiza o contador caso o ID informado manualmente seja maior
      const numId = parseInt(docId.replace(/\D/g, ''), 10);
      if (!isNaN(numId)) {
        const counterRef = this.db.collection('counters').doc('atividades');
        await this.db.runTransaction(async (tx) => {
          const snap = await tx.get(counterRef);
          const atual = snap.exists ? (Number(snap.data().ultimoId) || 100) : 100;
          if (numId > atual) {
            tx.set(counterRef, { ultimoId: numId }, { merge: true });
          }
        });
      }

      return payload;
    } finally {
      this.isWriting = false;
    }
  }

  async excluirAtividade(id) {
    if (!this.db) throw new Error('Firestore não inicializado.');
    this.isWriting = true;
    try {
      const docId = String(id).trim();
      await this.db.collection('atividades').doc(docId).delete();
      return true;
    } finally {
      this.isWriting = false;
    }
  }

  async salvarConfiguracoes(configs) {
    if (!this.db) throw new Error('Firestore não inicializado.');
    this.isWriting = true;
    try {
      const payload = {
        ...configs,
        _updatedAt: Date.now(),
        atualizadoPor: this.obterIdentificadorUsuario()
      };
      await this.db.collection('configuracoes').doc('geral').set(payload);
      return payload;
    } finally {
      this.isWriting = false;
    }
  }

  /**
   * Importação em lote (writeBatch) para migrar uma planilha .xlsx ou carga inicial para o Firestore.
   */
  async importarEmLote(listaAtividades, configs = null) {
    if (!this.db) throw new Error('Firestore não inicializado.');
    this.isWriting = true;

    try {
      const etapasCfg = configs?.etapas || window.configuracoesPadrao?.etapas || [];
      const usuario = this.obterIdentificadorUsuario();
      const agora = Date.now();
      let maiorId = 100;

      // Firestore permite até 500 operações por batch
      const tamanhoLote = 450;
      for (let i = 0; i < listaAtividades.length; i += tamanhoLote) {
        const fatia = listaAtividades.slice(i, i + tamanhoLote);
        const batch = this.db.batch();

        fatia.forEach((raw) => {
          const sanitizado = window.DataUtils
            ? window.DataUtils.sanitizarAtividade(raw, etapasCfg)
            : { ...raw };
          const docId = String(sanitizado.id).trim();
          if (!docId) return;

          const numId = parseInt(docId.replace(/\D/g, ''), 10);
          if (!isNaN(numId) && numId > maiorId) maiorId = numId;

          const ref = this.db.collection('atividades').doc(docId);
          batch.set(ref, {
            ...sanitizado,
            id: docId,
            _updatedAt: agora,
            atualizadoPor: usuario
          }, { merge: true });
        });

        await batch.commit();
      }

      if (configs) {
        await this.salvarConfiguracoes(configs);
      }

      const counterRef = this.db.collection('counters').doc('atividades');
      await this.db.runTransaction(async (tx) => {
        const snap = await tx.get(counterRef);
        const atual = snap.exists ? (Number(snap.data().ultimoId) || 100) : 100;
        if (maiorId > atual) {
          tx.set(counterRef, { ultimoId: maiorId }, { merge: true });
        }
      });

      return true;
    } finally {
      this.isWriting = false;
    }
  }
}

window.FirebaseService = FirebaseService;
const DB_NAME = 'BRG_Excel_Storage';
const STORE_NAME = 'handles';
const KEY_HANDLE = 'current_file_handle';

const idbHelper = {
  abrir() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },
  async salvarHandle(handle) {
    try {
      const db = await this.abrir();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(handle, KEY_HANDLE);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('Erro ao salvar handle no IndexedDB:', e);
      return false;
    }
  },
  async recuperarHandle() {
    try {
      const db = await this.abrir();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(KEY_HANDLE);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Erro ao recuperar handle do IndexedDB:', e);
      return null;
    }
  }
};

window.idbHelper = idbHelper;
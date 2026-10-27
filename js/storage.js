/**
 * StorageManager - Persistencia robusta en IndexedDB para libros personalizados
 * Almacena imágenes binarias (Blobs) de documentos y fotos escaneadas sin límite de cuota,
 * garantizando que las páginas añadidas por el usuario persistan al refrescar o reabrir la web.
 */

const DB_NAME = "MonFlip_DB";
const DB_VERSION = 1;
const STORE_NAME = "custom_book_pages";
const STORAGE_KEY_FLAG = "monflip_has_custom_book";

export class StorageManager {
  constructor() {
    this.db = null;
  }

  async _openDB() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "order" });
        }
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };

      request.onerror = (e) => {
        console.error("Error al inicializar IndexedDB:", e);
        reject(e);
      };
    });
  }

  /**
   * Guarda de forma permanente en IndexedDB todas las páginas del libro
   * @param {Array} pages Lista de páginas de PageManager
   */
  async saveCustomBook(pages) {
    if (!pages || pages.length === 0) {
      await this.clearCustomBook();
      return false;
    }

    const db = await this._openDB();

    const preparedRecords = [];
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      let blob = p.blob;

      if (!blob && p.url) {
        try {
          const resp = await fetch(p.url);
          if (resp.ok) {
            blob = await resp.blob();
          }
        } catch (e) {
          console.warn("No se pudo recuperar blob de URL:", p.url, e);
        }
      }

      preparedRecords.push({
        order: i,
        id: p.id || ("page_" + i),
        name: p.name || ("Página " + (i + 1)),
        blob: blob || null,
        url: p.url && !p.url.startsWith("blob:") ? p.url : null,
        width: p.width || 1200,
        height: p.height || 1600,
        rotation: p.rotation || 0,
        size: p.size || (blob ? blob.size : 0)
      });
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], "readwrite");
      const store = tx.objectStore(STORE_NAME);

      store.clear();

      for (const record of preparedRecords) {
        store.put(record);
      }

      tx.oncomplete = () => {
        try {
          localStorage.setItem(STORAGE_KEY_FLAG, "true");
          localStorage.setItem("monflip_custom_page_count", preparedRecords.length.toString());
        } catch (e) {}
        resolve(true);
      };

      tx.onerror = (e) => {
        console.error("Error en transacción de guardado IndexedDB:", e);
        reject(e);
      };
    });
  }

  /**
   * Recupera el libro personalizado almacenado en IndexedDB
   * @returns {Promise<Array|null>}
   */
  async getCustomBook() {
    try {
      const db = await this._openDB();

      return new Promise((resolve) => {
        const tx = db.transaction([STORE_NAME], "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => {
          const records = req.result;
          if (!records || records.length === 0) {
            resolve(null);
            return;
          }

          records.sort((a, b) => a.order - b.order);

          const reconstructedPages = records.map((rec) => {
            let url = rec.url;
            if (rec.blob) {
              url = URL.createObjectURL(rec.blob);
            }

            return {
              id: rec.id,
              name: rec.name,
              url: url,
              blob: rec.blob,
              width: rec.width,
              height: rec.height,
              rotation: rec.rotation,
              size: rec.size
            };
          });

          resolve(reconstructedPages);
        };

        req.onerror = () => {
          resolve(null);
        };
      });
    } catch (e) {
      console.warn("Error al leer libro de IndexedDB:", e);
      return null;
    }
  }

  /**
   * Limpia los datos guardados en IndexedDB
   */
  async clearCustomBook() {
    try {
      localStorage.removeItem(STORAGE_KEY_FLAG);
      localStorage.removeItem("monflip_custom_page_count");
      const db = await this._openDB();
      return new Promise((resolve) => {
        const tx = db.transaction([STORE_NAME], "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.clear();
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } catch (e) {
      return false;
    }
  }
}

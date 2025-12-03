import OfflineDebugger from "../utils/debugger";

const DB_NAME = "control-caducidades";
const DB_VERSION = 1;

const STORES = {
  PRODUCTS: "products",
  PENDING_CHANGES: "pendingChanges",
  CATALOG: "catalog",
};

class IndexedDBService {
  constructor() {
    this.db = null;
    this.initPromise = null;
  }

  async init() {
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = async () => {
        OfflineDebugger.error("INDEXEDDB_ERROR", request.error);
        
        // Si el error es de versión, intentar eliminar la base de datos y reiniciar
        if (request.error.name === "VersionError") {
          try {
            await this.deleteDatabase();
            // Reintentar la inicialización
            this.initPromise = null;
            await this.init();
            resolve();
          } catch (error) {
            reject(error);
          }
        } else {
          reject(request.error);
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        OfflineDebugger.log("INDEXEDDB_CONNECTED", { database: DB_NAME });
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store para productos y sus estados
        if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
          const productStore = db.createObjectStore(STORES.PRODUCTS, {
            keyPath: "producto._id",
          });
          productStore.createIndex("estado", "estado");
          productStore.createIndex("updatedAt", "updatedAt");
        }

        // Store para cambios pendientes de sincronización
        if (!db.objectStoreNames.contains(STORES.PENDING_CHANGES)) {
          const pendingStore = db.createObjectStore(STORES.PENDING_CHANGES, {
            keyPath: "id",
            autoIncrement: true,
          });
          pendingStore.createIndex("type", "type");
          pendingStore.createIndex("productId", "productId");
          pendingStore.createIndex("timestamp", "timestamp");
        }

        // Store para catálogo de productos
        if (!db.objectStoreNames.contains(STORES.CATALOG)) {
          const catalogStore = db.createObjectStore(STORES.CATALOG, {
            keyPath: "_id",
          });
          catalogStore.createIndex("nombre", "nombre");
          catalogStore.createIndex("updatedAt", "updatedAt");
        }
      };
    });

    return this.initPromise;
  }

  async getStore(storeName, mode = "readonly") {
    await this.init();
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // Métodos para productos y estados
  async getAllProductStatus() {
    const store = await this.getStore(STORES.PRODUCTS);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getProductStatus(productId) {
    const store = await this.getStore(STORES.PRODUCTS);
    return new Promise((resolve, reject) => {
      const request = store.get(productId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveProductStatus(product) {
    // Validar keyPath antes de intentar guardar
    if (!product?.producto?._id) {
      const error = new Error("Invalid product structure: Missing producto._id (KeyPath)");
      OfflineDebugger.error("SAVE_PRODUCT_ERROR", error, { product });
      throw error;
    }

    const store = await this.getStore(STORES.PRODUCTS, "readwrite");
    product.updatedAt = new Date().toISOString();

    return new Promise((resolve, reject) => {
      const request = store.put(product);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteProductStatus(productId) {
    if (!productId) {
      OfflineDebugger.error("DELETE_PRODUCT_ERROR", "No product ID provided");
      throw new Error("No product ID provided");
    }

    const store = await this.getStore(STORES.PRODUCTS, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.delete(productId);
      request.onsuccess = () => {
        OfflineDebugger.log("PRODUCT_DELETED", { productId });
        resolve();
      };
      request.onerror = () => {
        OfflineDebugger.error("DELETE_PRODUCT_ERROR", request.error);
        reject(request.error);
      };
    });
  }

  // Métodos para cambios pendientes
  async addPendingChange(change) {
    const store = await this.getStore(STORES.PENDING_CHANGES, "readwrite");
    change.timestamp = new Date().toISOString();

    return new Promise((resolve, reject) => {
      const request = store.add(change);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingChanges() {
    const store = await this.getStore(STORES.PENDING_CHANGES);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removePendingChange(id) {
    const store = await this.getStore(STORES.PENDING_CHANGES, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Métodos para el catálogo
  async getAllCatalog() {
    const store = await this.getStore(STORES.CATALOG);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveCatalogProduct(product) {
    const store = await this.getStore(STORES.CATALOG, "readwrite");
    product.updatedAt = new Date().toISOString();

    return new Promise((resolve, reject) => {
      const request = store.put(product);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getCatalogProduct(productId) {
    const store = await this.getStore(STORES.CATALOG);
    return new Promise((resolve, reject) => {
      const request = store.get(productId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateCatalogProduct(productId, data) {
    // Primero obtener el producto existente (esto usa su propia transacción)
    const existingProduct = await this.getCatalogProduct(productId);
    
    if (!existingProduct) {
      throw new Error("Producto no encontrado en IndexedDB");
    }

    const updatedProduct = {
      ...existingProduct,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // Ahora abrir la transacción de escritura
    const store = await this.getStore(STORES.CATALOG, "readwrite");

    return new Promise((resolve, reject) => {
      const request = store.put(updatedProduct);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteCatalogProduct(productId) {
    const store = await this.getStore(STORES.CATALOG, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.delete(productId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Método para limpiar todos los datos
  async clearAll() {
    await this.init();
    const transaction = this.db.transaction(Object.values(STORES), "readwrite");

    const promises = Object.values(STORES).map(
      (storeName) =>
        new Promise((resolve, reject) => {
          const request = transaction.objectStore(storeName).clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        })
    );

    await Promise.all(promises);
    OfflineDebugger.log("INDEXEDDB_CLEARED", { stores: Object.values(STORES) });
  }

  async clearPendingChanges() {
    const store = await this.getStore(STORES.PENDING_CHANGES, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => {
        OfflineDebugger.log("PENDING_CHANGES_CLEARED");
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearCatalog() {
    const store = await this.getStore(STORES.CATALOG, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => {
        OfflineDebugger.log("CATALOG_CLEARED");
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearProductStatus() {
    const store = await this.getStore(STORES.PRODUCTS, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => {
        OfflineDebugger.log("PRODUCT_STATUS_CLEARED");
        resolve();
      };
      request.onerror = () => {
        OfflineDebugger.error("CLEAR_PRODUCT_STATUS_ERROR", request.error);
        reject(request.error);
      };
    });
  }

  // Método para eliminar la base de datos
  async deleteDatabase() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      
      request.onerror = () => {
        OfflineDebugger.error("DELETE_DB_ERROR", request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        OfflineDebugger.log("DATABASE_DELETED", { database: DB_NAME });
        this.initPromise = null; // Reset init promise
        resolve();
      };
    });
  }
}

export default new IndexedDBService();

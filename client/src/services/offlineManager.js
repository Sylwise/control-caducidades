import FeatureManager from "../config/features";
import OfflineDebugger from "../utils/debugger";
import IndexedDB from "./indexedDB";
import catalogService from "./offline/catalogService";
import statusService from "./offline/statusService";

class OfflineManager {
  static instance = null;
  syncInProgress = false;

  get isOnline() {
    return navigator.onLine;
  }

  get isOfflineMode() {
    // Solo activar modo offline si:
    // 1. El feature flag está activado Y
    // 2. No hay conexión
    return FeatureManager.isEnabled("OFFLINE_MODE") && !this.isOnline;
  }

  constructor() {
    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener("online", () => {
      OfflineDebugger.log("NETWORK_STATUS", { status: "online" });
      this.syncChanges();
    });

    window.addEventListener("offline", () => {
      OfflineDebugger.log("NETWORK_STATUS", { status: "offline" });
    });
  }

  // ==========================================
  // Métodos Privados de Ayuda (Refactorización)
  // ==========================================

  /**
   * Centraliza el despacho de eventos locales
   */
  _dispatchLocalEvent(eventName, detail) {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  /**
   * Actualiza el mapa de IDs temporales a permanentes
   */
  _updateIdMappings(idMapping, change, permanentId) {
    if (change.tempId) {
      idMapping.set(change.tempId, permanentId);
      // También mapear el productId si existe y es diferente del tempId
      if (change.productId && change.productId !== change.tempId) {
        idMapping.set(change.productId, permanentId);
      }
    } else if (change.productId) {
      // Si no hay tempId pero hay productId, usar ese
      idMapping.set(change.productId, permanentId);
    }
  }

  /**
   * Notifica a la UI tras una sincronización exitosa de creación de catálogo
   * Maneja la eliminación del ID temporal y la creación con el ID final
   */
  _notifySyncSuccess(change, tempIdToRemove, productData, isSimulation = false) {
    // 1. Notificar eliminación del temporal
    if (tempIdToRemove) {
      this._dispatchLocalEvent("localCatalogUpdate", {
        type: "delete",
        productId: tempIdToRemove,
      });
    }

    // 2. Notificar creación del final
    // NOTA: El servicio catalogService ya emite el evento "create" cuando se llama a createCatalogProduct.
    // Sin embargo, si es una simulación (duplicado), el servicio no se llamó, así que debemos emitirlo aquí.
    if (isSimulation) {
      const detail = { type: "create" };
      detail.productStatus = productData;
      this._dispatchLocalEvent("localCatalogUpdate", detail);
    }
  }

  // ==========================================
  // Métodos Públicos (Proxies)
  // ==========================================

  // Métodos para productos y estados
  async getAllProductStatus() {
    return await statusService.getAllProductStatus();
  }

  async updateProductStatus(productId, data) {
    return await statusService.updateProductStatus(productId, data);
  }

  async deleteProductStatus(productId) {
    return await statusService.deleteProductStatus(productId);
  }

  // Métodos para el catálogo
  async getAllCatalogProducts() {
    return await catalogService.getAllCatalogProducts();
  }

  async createCatalogProduct(productData) {
    return await catalogService.createCatalogProduct(productData);
  }

  async updateCatalogProduct(productId, data) {
    return await catalogService.updateCatalogProduct(productId, data);
  }

  async deleteCatalogProduct(productId) {
    return await catalogService.deleteCatalogProduct(productId);
  }

  // Métodos de sincronización
  async syncChanges() {
    if (!this.isOnline || this.syncInProgress) return;

    try {
      this.syncInProgress = true;
      OfflineDebugger.log("SYNC_STARTED", { timestamp: new Date() });
      const changes = await IndexedDB.getPendingChanges();

      if (changes.length === 0) {
        OfflineDebugger.log("SYNC_COMPLETED", { changes: 0 });
        return;
      }

      // Mapa para guardar la relación entre IDs temporales y permanentes
      const idMapping = new Map();

      // 1. Procesar creaciones del catálogo (prioridad alta para resolver IDs)
      const createChanges = changes.filter(
        (change) => change.type === "CREATE_CATALOG"
      );
      await this._syncCreateCatalogChanges(createChanges, idMapping);

      // 2. Procesar el resto de cambios
      const remainingChanges = changes.filter(
        (change) => change.type !== "CREATE_CATALOG"
      );
      await this._syncStandardChanges(remainingChanges, idMapping);

      OfflineDebugger.log("SYNC_COMPLETED", { timestamp: new Date() });
    } catch (error) {
      OfflineDebugger.error("SYNC_ERROR", error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Procesa los cambios de creación de catálogo
   * Maneja duplicados y actualiza el mapeo de IDs
   */
  async _syncCreateCatalogChanges(changes, idMapping) {
    for (const change of changes) {
      try {
        OfflineDebugger.log("PROCESSING_CREATE_CATALOG_CHANGE", {
          change,
          tempId: change.tempId,
          productId: change.productId
        });
        
        // Delegar en el servicio
        const response = await catalogService.createCatalogProduct(change.data);
        
        // La respuesta del servidor es un ProductStatus (con .producto poblado)
        // Pero necesitamos el ID del Producto para el mapeo y el catálogo
        const permanentId = response.producto ? response.producto._id : response._id;
        const productData = response.producto ? response.producto : response;

        if (permanentId) {
          // Usar helper para actualizar mapeos
          this._updateIdMappings(idMapping, change, permanentId);
          
          await IndexedDB.removePendingChange(change.id);

          // Actualizar el producto en IndexedDB con su nuevo ID y datos correctos
          // NOTA: catalogService ya guardó el nuevo producto. Aquí limpiamos el viejo (temp).
          const oldId = change.tempId || change.productId;
          if (oldId && oldId !== permanentId) {
             // Si el ID cambió, eliminamos el temporal antiguo para evitar duplicados en DB local
             // ya que el servicio guardó el nuevo.
             await IndexedDB.deleteCatalogProduct(oldId);
          }

          // Usar helper para notificar a la UI (principalmente para borrar el temp)
          const tempIdToRemove = change.tempId || change.productId;
          this._notifySyncSuccess(change, tempIdToRemove, productData, false);
        }
      } catch (error) {
        // Manejar error de duplicado (E11000)
        if (error.message && error.message.includes("E11000")) {
          OfflineDebugger.log("DUPLICATE_PRODUCT_DETECTED", { change });
          
          try {
            // Si ya existe, intentamos obtenerlo del servidor para hacer el mapping
            // Usamos el servicio para obtener el catálogo
            const serverProducts = await catalogService.getAllCatalogProducts();
            
            // Normalizar el nombre para la búsqueda (trim y case insensitive si es necesario)
            const searchName = change.data.nombre.trim().toLowerCase();
            
            const existingProduct = serverProducts.find(p => 
              p.nombre.trim().toLowerCase() === searchName
            );
            
            if (existingProduct) {
              OfflineDebugger.log("FOUND_EXISTING_PRODUCT", { existingProduct });
              
              // Procedemos como si fuera una creación exitosa
              const response = existingProduct;
              
              // Usar helper para actualizar mapeos
              this._updateIdMappings(idMapping, change, response._id);
              
              await IndexedDB.removePendingChange(change.id);

              const oldId = change.tempId || change.productId;
              if (oldId && oldId !== response._id) {
                 await IndexedDB.deleteCatalogProduct(oldId);
              }

              // Construir un objeto de estado simulado
              const simulatedStatus = { 
                producto: response, 
                estado: "sin-clasificar",
                _id: `simulated_${response._id}` 
              };

              // Usar helper para notificar a la UI (modo simulación)
              const tempIdToRemove = change.tempId || change.productId;
              this._notifySyncSuccess(change, tempIdToRemove, simulatedStatus, true);
              
              continue; // Continuar con el siguiente cambio
            } else {
              OfflineDebugger.error("DUPLICATE_PRODUCT_NOT_FOUND_LOCALLY", { 
                searchName, 
                serverCount: serverProducts.length 
              });
            }
          } catch (recoveryError) {
            OfflineDebugger.error("RECOVERY_FAILED", recoveryError);
          }
        }
        
        OfflineDebugger.error("SYNC_CHANGE_ERROR", { change, error });
      }
    }
  }

  /**
   * Procesa cambios estándar (UPDATE, DELETE)
   * Usa el mapeo de IDs para resolver referencias a productos creados offline
   */
  async _syncStandardChanges(changes, idMapping) {
    for (const change of changes) {
      try {
        // Si es un DELETE de un producto temporal, simplemente limpiarlo localmente
        if (change.type === "DELETE_CATALOG" && change.productId.startsWith("temp_")) {
          // Eliminar el cambio pendiente y el producto de IndexedDB
          await IndexedDB.removePendingChange(change.id);
          await IndexedDB.deleteCatalogProduct(change.productId);
          continue;
        }

        // Para otros cambios, actualizar el ID si es necesario
        if (change.productId && change.productId.startsWith("temp_")) {
          const permanentId = idMapping.get(change.productId);
          if (permanentId) {
            // Actualizar el ID en el cambio
            change.productId = permanentId;
            if (change.data && change.data.producto) {
              change.data.producto = permanentId;
            }

            // Procesar el cambio con el ID permanente delegando en servicios
            let response;
            if (change.type === "UPDATE") {
               response = await statusService.updateProductStatus(change.productId, change.data);
               // statusService no emite eventos, así que lo hacemos aquí
               this._dispatchLocalEvent("localProductStatusUpdate", {
                  type: "update",
                  productStatus: response,
               });
            } else if (change.type === "DELETE") {
               response = await statusService.deleteProductStatus(change.productId);
               // statusService no emite eventos, así que lo hacemos aquí
               
               // Intentar recuperar el producto de la respuesta o de los datos guardados
               const productToRestore = response.product || (change.data && change.data.product);
               
               this._dispatchLocalEvent("localProductStatusUpdate", {
                  detail: {
                    type: "delete",
                    productId: change.productId,
                    product: productToRestore
                  },
               });
            } else if (change.type === "UPDATE_CATALOG") {
               response = await catalogService.updateCatalogProduct(change.productId, change.data);
               // catalogService SÍ emite eventos, no duplicar
            } else if (change.type === "DELETE_CATALOG") {
               response = await catalogService.deleteCatalogProduct(change.productId);
               // catalogService SÍ emite eventos, no duplicar
            }

            await IndexedDB.removePendingChange(change.id);

          } else {
            // Si no encontramos un ID permanente, probablemente el producto ya no existe
            await IndexedDB.removePendingChange(change.id);
            OfflineDebugger.log("SKIPPING_CHANGE", {
              reason: "No permanent ID found",
              change,
            });
          }
        } else {
          // Procesar cambios con IDs permanentes normalmente
          let response;
          if (change.type === "UPDATE") {
              response = await statusService.updateProductStatus(change.productId, change.data);
              this._dispatchLocalEvent("localProductStatusUpdate", {
                type: "update",
                productStatus: response,
              });
          } else if (change.type === "DELETE") {
              response = await statusService.deleteProductStatus(change.productId);
              
              // Intentar recuperar el producto de la respuesta o de los datos guardados
              const productToRestore = response.product || (change.data && change.data.product);

              this._dispatchLocalEvent("localProductStatusUpdate", {
                type: "delete",
                productId: change.productId,
                product: productToRestore
              });
          } else if (change.type === "UPDATE_CATALOG") {
              await catalogService.updateCatalogProduct(change.productId, change.data);
          } else if (change.type === "DELETE_CATALOG") {
              await catalogService.deleteCatalogProduct(change.productId);
          }

          await IndexedDB.removePendingChange(change.id);
        }
      } catch (error) {
        OfflineDebugger.error("SYNC_CHANGE_ERROR", { change, error });
      }
    }
  }
}

export default new OfflineManager();

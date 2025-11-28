import FeatureManager from "../../config/features";
import OfflineDebugger from "../../utils/debugger";
import IndexedDB from "../indexedDB";
import { processProduct, compareClassifications } from "../productClassifier";
import * as api from "../api";

class StatusService {
  get isOnline() {
    return navigator.onLine;
  }

  get isOfflineMode() {
    return FeatureManager.isEnabled("OFFLINE_MODE") && !this.isOnline;
  }

  /**
   * Centraliza el despacho de eventos locales
   */
  _dispatchLocalEvent(eventName, detail) {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  async getAllProductStatus() {
    try {
      OfflineDebugger.log("GET_PRODUCTS_START", {
        isOnline: this.isOnline,
        offlineMode: this.isOfflineMode,
      });

      if (this.isOnline && !this.isOfflineMode) {
        // Si estamos online y no en modo offline forzado, obtener del servidor
        const serverProducts = await api.http.getAllProductStatus();
        await this.saveToLocalStorage(serverProducts);
        return serverProducts;
      }

      // Modo offline - obtener de IndexedDB
      return await IndexedDB.getAllProductStatus();
    } catch (error) {
      OfflineDebugger.error("GET_PRODUCTS_ERROR", error);
      throw error;
    }
  }

  async updateProductStatus(productId, data) {
    try {
      // Procesar y validar datos localmente
      const processedData = processProduct(data);

      if (this.isOnline && !this.isOfflineMode) {
        const serverResult = await api.http.updateProductStatus(
          productId,
          processedData
        );

        // Comparar clasificación local con servidor
        const comparison = compareClassifications(processedData, serverResult);
        if (!comparison.match) {
          OfflineDebugger.log("CLASSIFICATION_MISMATCH", comparison);
        }

        await IndexedDB.saveProductStatus(serverResult);
        return serverResult;
      }

      // Modo offline - Obtener información del producto del catálogo y estado actual
      const [catalogProduct, currentStatus] = await Promise.all([
        IndexedDB.getCatalogProduct(productId),
        IndexedDB.getProductStatus(productId),
      ]);

      if (!catalogProduct) {
        throw new Error("Producto no encontrado en el catálogo local");
      }

      // Si ya existe un estado, verificar si hay cambios reales
      if (currentStatus) {
        const hasChanges = Object.entries(processedData).some(
          ([key, value]) => {
            // Comparar arrays de fechasAlmacen
            if (key === "fechasAlmacen") {
              if (!value)
                return currentStatus[key] && currentStatus[key].length > 0;
              if (!currentStatus[key]) return value.length > 0;
              if (value.length !== currentStatus[key].length) return true;
              return value.some(
                (date, index) => date !== currentStatus[key][index]
              );
            }
            return value !== currentStatus[key];
          }
        );

        if (!hasChanges) {
          OfflineDebugger.log("NO_CHANGES_DETECTED", {
            productId,
            current: currentStatus,
            new: processedData,
          });
          return currentStatus;
        }
      }

      // Modo offline - Combinar datos existentes con nuevos datos
      const productToSave = {
        ...currentStatus,
        producto: catalogProduct,
        ...processedData, // Sobrescribir con nuevos datos
        updatedAt: new Date().toISOString(),
      };

      await IndexedDB.saveProductStatus(productToSave);

      // Registrar cambio pendiente solo si hay cambios reales
      await IndexedDB.addPendingChange({
        type: "UPDATE",
        productId,
        data: processedData,
        timestamp: new Date().toISOString(),
      });

      return productToSave;
    } catch (error) {
      OfflineDebugger.error("UPDATE_PRODUCT_ERROR", error, {
        productId,
        data,
      });
      throw error;
    }
  }

  async deleteProductStatus(productId) {
    try {
      OfflineDebugger.log("DELETE_PRODUCT_STATUS", { productId });

      if (this.isOnline && !this.isOfflineMode) {
        const result = await api.http.deleteProductStatus(productId);
        // Asegurar que se elimine de IndexedDB
        await IndexedDB.deleteProductStatus(productId);
        return result;
      }

      // En modo offline
      // 1. Verificar si el producto existe en IndexedDB
      const existingStatus = await IndexedDB.getProductStatus(productId);
      if (!existingStatus) {
        OfflineDebugger.log("PRODUCT_STATUS_NOT_FOUND", { productId });
        return { success: true };
      }

      // 2. Eliminar el estado
      await IndexedDB.deleteProductStatus(productId);

      // 3. Registrar el cambio pendiente
      await IndexedDB.addPendingChange({
        type: "DELETE",
        productId,
        data: { product: existingStatus.producto },
        timestamp: new Date().toISOString(),
      });

      // 4. Verificar y limpiar estados huérfanos
      const allStates = await IndexedDB.getAllProductStatus();
      OfflineDebugger.log("REMAINING_STATES", { count: allStates.length });

      return { success: true };
    } catch (error) {
      OfflineDebugger.error("DELETE_PRODUCT_ERROR", error, { productId });
      throw error;
    }
  }

  async saveToLocalStorage(products) {
    OfflineDebugger.log("SAVING_TO_LOCAL", { count: products.length });

    // Primero limpiar todos los estados existentes
    await IndexedDB.clearProductStatus();

    // Luego guardar los nuevos estados
    for (const product of products) {
      if (!product._id) {
        OfflineDebugger.error("SAVE_TO_LOCAL_ERROR", "Product without ID", {
          product,
        });
        continue;
      }
      await IndexedDB.saveProductStatus(product);
    }

    // Verificar que el número de productos es correcto
    const finalProducts = await IndexedDB.getAllProductStatus();
    OfflineDebugger.log("FINAL_PRODUCTS", {
      count: finalProducts.length,
    });
  }
}

export default new StatusService();

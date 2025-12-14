import FeatureManager from "../../config/features";
import OfflineDebugger from "../../utils/debugger";
import IndexedDB from "../indexedDB";
import * as api from "../api";

class CatalogService {
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

  async getAllCatalogProducts() {
    try {
      OfflineDebugger.log("GET_CATALOG_START", {
        isOnline: this.isOnline,
        offlineMode: this.isOfflineMode,
      });

      if (this.isOnline && !this.isOfflineMode) {
        const response = await api.http.getAllCatalogProducts();
        // Support both new { data: [...] } and old [...] formats
        const serverData = response.data || response;
        
        await this.saveCatalogToLocalStorage(serverData);
        return serverData;
      }

      const localData = await IndexedDB.getAllCatalog();
      OfflineDebugger.log("CATALOG_LOCAL_RESPONSE", {
        count: localData.length,
      });
      return localData;
    } catch (error) {
      OfflineDebugger.error("GET_CATALOG_ERROR", error);
      // Si hay un error, intentar obtener datos locales como fallback
      return await IndexedDB.getAllCatalog();
    }
  }

  async createCatalogProduct(productData) {
    try {
      OfflineDebugger.log("CREATE_CATALOG_PRODUCT", { data: productData });

      if (this.isOnline && !this.isOfflineMode) {
        const response = await api.http.createCatalogProduct(productData);
        const result = response.data || response;
        
        // Guardar el producto del catálogo, no el estado completo
        await IndexedDB.saveCatalogProduct(result.producto);
        
        // Emitir evento local para actualizar la UI inmediatamente
        this._dispatchLocalEvent("localCatalogUpdate", {
          type: "create",
          productStatus: result,
        });
        
        return result;
      }

      // Generar un ID temporal para modo offline
      const tempId = `temp_${Date.now()}`;
      const productToSave = {
        _id: tempId,
        ...productData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await IndexedDB.saveCatalogProduct(productToSave);
      await IndexedDB.addPendingChange({
        type: "CREATE_CATALOG",
        tempId: tempId,
        productId: tempId, // Adding productId to match what the sync process expects
        data: productData,
        timestamp: new Date().toISOString(),
      });

      // Emitir un evento local para actualizar la UI
      this._dispatchLocalEvent("localCatalogUpdate", {
        type: "create",
        product: productToSave,
      });

      return productToSave;
    } catch (error) {
      OfflineDebugger.error("CREATE_CATALOG_PRODUCT_ERROR", error, {
        productData,
      });
      throw error;
    }
  }

  async updateCatalogProduct(productId, data) {
    try {
      OfflineDebugger.log("UPDATE_CATALOG_PRODUCT", { productId, data });

      if (this.isOnline && !this.isOfflineMode) {
        const response = await api.http.updateCatalogProduct(productId, data);
        const result = response.data || response;
        
        await IndexedDB.saveCatalogProduct(result);

        // Emitir evento local para actualizar la UI inmediatamente
        this._dispatchLocalEvent("localCatalogUpdate", {
          type: "update",
          product: result,
        });

        return result;
      }

      const existingProduct = await IndexedDB.getCatalogProduct(productId);
      if (!existingProduct) {
        throw new Error("Producto no encontrado en el catálogo local");
      }

      const updatedProduct = {
        ...existingProduct,
        ...data,
        updatedAt: new Date().toISOString(),
      };

      await IndexedDB.saveCatalogProduct(updatedProduct);
      await IndexedDB.addPendingChange({
        type: "UPDATE_CATALOG",
        productId,
        data,
        timestamp: new Date().toISOString(),
      });

      // Emitir un evento local para actualizar la UI
      this._dispatchLocalEvent("localCatalogUpdate", {
        type: "update",
        product: updatedProduct,
      });

      return updatedProduct;
    } catch (error) {
      OfflineDebugger.error("UPDATE_CATALOG_PRODUCT_ERROR", error, {
        productId,
        data,
      });
      throw error;
    }
  }

  async deleteCatalogProduct(productId) {
    try {
      OfflineDebugger.log("DELETE_CATALOG_PRODUCT", { productId });

      if (this.isOnline && !this.isOfflineMode) {
        const response = await api.http.deleteCatalogProduct(productId);
        const result = response.data || response;
        
        await IndexedDB.deleteCatalogProduct(productId);

        // Emitir evento local para actualizar la UI inmediatamente
        this._dispatchLocalEvent("localCatalogUpdate", {
          type: "delete",
          productId,
        });

        return result;
      }

      // Primero eliminar el producto de IndexedDB
      await IndexedDB.deleteCatalogProduct(productId);

      // Añadir el cambio pendiente
      await IndexedDB.addPendingChange({
        type: "DELETE_CATALOG",
        productId,
        timestamp: new Date().toISOString(),
      });

      // Emitir un evento local para actualizar la UI
      this._dispatchLocalEvent("localCatalogUpdate", {
        type: "delete",
        productId,
      });

      return { success: true };
    } catch (error) {
      OfflineDebugger.error("DELETE_CATALOG_PRODUCT_ERROR", error, {
        productId,
      });
      throw error;
    }
  }

  async saveCatalogToLocalStorage(products) {
    OfflineDebugger.log("SAVING_CATALOG_TO_LOCAL", { count: products.length });

    // Primero limpiar el catálogo actual
    await IndexedDB.clearCatalog();

    // Luego guardar los nuevos productos
    for (const product of products) {
      await IndexedDB.saveCatalogProduct(product);
    }

    // Verificar que el número de productos es correcto
    const finalProducts = await IndexedDB.getAllCatalog();
    OfflineDebugger.log("FINAL_CATALOG_PRODUCTS", {
      count: finalProducts.length,
    });
  }
}

export default new CatalogService();

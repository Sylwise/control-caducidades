import { useState, useCallback, useEffect, useMemo } from "react";
import Fuse from "fuse.js";
import { useSocket } from "./useSocket";
import { INITIAL_PRODUCTS_STATE } from "../constants/productConstants";
import { useDeletedProducts } from "../contexts/DeletedProductsContext";
import {
  getAllProductStatus,
  getAllCatalogProducts,
  updateProductStatus,
  deleteProductStatus,
} from "../services/api";

export const useProductManagement = (addToast) => {
  const { socket } = useSocket();
  const [products, setProducts] = useState(INITIAL_PRODUCTS_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdatedProductId, setLastUpdatedProductId] = useState(null);
  
  // Usamos el contexto en lugar de window
  const { addToHistory, getFromHistory, removeFromHistory } = useDeletedProducts();

  const loadAllProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [statusData, catalogData] = await Promise.all([
        getAllProductStatus(),
        getAllCatalogProducts(),
      ]);

      // Filtrar estados huérfanos (donde el producto es null) para evitar errores
      const validStatusData = statusData.filter(
        (product) => product.producto && product.producto._id
      );

      const classifiedProductIds = new Set(
        validStatusData.map((product) => product.producto._id)
      );

      const unclassifiedProducts = catalogData
        .filter((product) => !classifiedProductIds.has(product._id))
        .map((product) => ({
          producto: product,
          estado: "sin-clasificar",
        }));

      const combinedUnclassifiedProducts = [
        ...unclassifiedProducts,
        ...validStatusData.filter(
          (product) => product.estado === "sin-clasificar"
        )
      ].sort((a, b) => {
        const nameA = a.producto?.nombre || "";
        const nameB = b.producto?.nombre || "";
        return nameA.localeCompare(nameB);
      });

      const organizedProducts = {
        "sin-clasificar": combinedUnclassifiedProducts.filter(p => !p.producto?.isDirectConsumption),
        
        "frente-cambia": validStatusData
          .filter((product) => product.estado === "frente-cambia" && !product.producto?.isDirectConsumption)
          .sort((a, b) => a.producto.nombre.localeCompare(b.producto.nombre)),
        "frente-agota": validStatusData
          .filter((product) => product.estado === "frente-agota" && !product.producto?.isDirectConsumption)
          .sort((a, b) => a.producto.nombre.localeCompare(b.producto.nombre)),
        "abierto-cambia": validStatusData
          .filter((product) => product.estado === "abierto-cambia" && !product.producto?.isDirectConsumption)
          .sort((a, b) => a.producto.nombre.localeCompare(b.producto.nombre)),
        "abierto-agota": validStatusData
          .filter((product) => product.estado === "abierto-agota" && !product.producto?.isDirectConsumption)
          .sort((a, b) => a.producto.nombre.localeCompare(b.producto.nombre)),
          
        "directos": [
            ...combinedUnclassifiedProducts.filter(p => p.producto?.isDirectConsumption),
            ...validStatusData.filter(p => p.producto?.isDirectConsumption && p.estado !== "sin-clasificar")
        ].sort((a, b) => a.producto.nombre.localeCompare(b.producto.nombre)),
      };

      setProducts(organizedProducts);
    } catch (err) {
      setError(err.message || "Error al cargar los productos");
    } finally {
      setLoading(false);
    }
  }, []);



  const updateProductInState = useCallback((productData) => {
    if (!productData) return;

    const productId = productData.producto?._id || productData._id;
    
    if (!productId) return;

    setProducts((prevProducts) => {
      const newProducts = Object.entries(prevProducts).reduce(
        (acc, [category, productList]) => {
          acc[category] = productList.filter(
            (p) => (p.producto?._id || p.producto) !== productId
          );
          return acc;
        },
        { ...prevProducts }
      );

      const category = productData.estado || "sin-clasificar";
      
      const productToSave = productData.producto ? productData : {
          producto: productData,
          estado: category,
          ...productData
      };

      // Si es consumo directo, forzamos la categoría "directos"
      if (productToSave.producto?.isDirectConsumption) {
        if (!newProducts["directos"]) newProducts["directos"] = [];
        newProducts["directos"] = [...newProducts["directos"], productToSave].sort((a, b) => {
            const nameA = a.producto?.nombre || a.nombre || "";
            const nameB = b.producto?.nombre || b.nombre || "";
            return nameA.localeCompare(nameB);
        });
        return newProducts; 
      }

      newProducts[category] = [...newProducts[category], productToSave].sort((a, b) => {
        const nameA = a.producto?.nombre || a.nombre || "";
        const nameB = b.producto?.nombre || b.nombre || "";
        return nameA.localeCompare(nameB);
      });

      return newProducts;
    });

    setLastUpdatedProductId(productId);
    setTimeout(() => setLastUpdatedProductId(null), 3000);
  }, []);

  const removeProductFromState = useCallback((productId) => {
    setProducts((prevProducts) => {
      return Object.entries(prevProducts).reduce(
        (acc, [category, productList]) => {
          acc[category] = productList.filter((p) => {
            if (p.producto && p.producto._id) {
              return p.producto._id !== productId;
            }
            if (p._id) {
              return p._id !== productId;
            }
            return true;
          });
          return acc;
        },
        { ...prevProducts }
      );
    });
  }, []);

  const addProductToState = useCallback((productData) => {
    setProducts((prevProducts) => {
      if (productData.estado) {
        const category = productData.estado;

        if (productData.producto?.isDirectConsumption) {
             const exists = prevProducts["directos"]?.some(
                (p) => p.producto._id === productData.producto._id
             );
             if (exists) return prevProducts;
             
             const newDirectList = [...(prevProducts["directos"] || []), productData].sort(
                (a, b) => a.producto.nombre.localeCompare(b.producto.nombre)
             );
             return { ...prevProducts, "directos": newDirectList };
        }

        // Logic Standard
        const exists = prevProducts[category].some(
          (p) => p.producto._id === productData.producto._id
        );
        
        if (exists) {
            return prevProducts;
        }

        const newCategoryList = [...prevProducts[category], productData].sort(
          (a, b) => a.producto.nombre.localeCompare(b.producto.nombre)
        );

        return {
          ...prevProducts,
          [category]: newCategoryList,
        };
      }

      const unclassifiedProduct = {
        producto: productData,
        estado: "sin-clasificar",
        fechaFrente: null,
        fechaAlmacen: null,
        fechasAlmacen: [],
        cajaUnica: false,
        hayUnicaCajaActual: false
      };

      const existsById = prevProducts["sin-clasificar"].some(
        (p) => p.producto._id === productData._id
      );
      
      const existsByName = productData.nombre && prevProducts["sin-clasificar"].some(
        (p) => 
          p.producto.nombre === productData.nombre && 
          (p.producto._id.startsWith('temp_') || productData._id.startsWith('temp_'))
      );
      
      if (existsById || existsByName) return prevProducts;

      // Si es directo, va a directos
      if (unclassifiedProduct.producto?.isDirectConsumption) {
         const exists = prevProducts["directos"]?.some(
            (p) => p.producto._id === productData._id
         );
         if (exists) return prevProducts;

         const newDirectList = [...(prevProducts["directos"] || []), unclassifiedProduct].sort(
            (a, b) => a.producto.nombre.localeCompare(b.producto.nombre)
         );
         return {
            ...prevProducts,
            "directos": newDirectList
         };
      }

      // Si no, va a sin-clasificar
      const newUnclassifiedProducts = [...prevProducts["sin-clasificar"], unclassifiedProduct]
        .sort((a, b) => a.producto.nombre.localeCompare(b.producto.nombre));

      return {
        ...prevProducts,
        "sin-clasificar": newUnclassifiedProducts,
      };
    });
  }, []);

  // Escuchar eventos del catálogo en tiempo real
  useEffect(() => {
    if (!socket) return;

    const handleCatalogUpdate = (data) => {
      if (data.type === "delete") {
        removeProductFromState(data.productId);
      } else if (data.type === "create") {
         if (data.productStatus) {
            addProductToState(data.productStatus);
         } else if (data.product) {
            // Offline creation emits 'product', implies 'sin-clasificar'
            const newStatus = {
                producto: data.product,
                estado: "sin-clasificar",
                fechaFrente: null,
                fechaAlmacen: null,
                fechasAlmacen: [],
                cajaUnica: false,
                hayUnicaCajaActual: false,
                _id: data.product._id // Use product ID (temp or perm) as status ID for now
            };
            addProductToState(newStatus);
         }
      } else if (data.type === "update" && data.product) {
        setProducts((prevProducts) => {
          // 1. Find the existing item wrapper (ProductStatus) anywhere
          let existingItem = null;
          for (const list of Object.values(prevProducts)) {
             existingItem = list.find(p => p.producto._id === data.product._id);
             if (existingItem) break;
          }

          if (!existingItem) return prevProducts;

          // 2. Remove from all categories (to handle moves)
          const cleanedProducts = Object.entries(prevProducts).reduce((acc, [category, productList]) => {
            acc[category] = productList.filter(
              (p) => p.producto._id !== data.product._id
            );
            return acc;
          }, { ...prevProducts });

          // 3. Create updated item with new catalog data
          const newItem = { 
            ...existingItem, 
            producto: data.product 
          };

          // 4. Place in correct category
          const sortFn = (a, b) => {
            const nameA = a.producto?.nombre || a.nombre || "";
            const nameB = b.producto?.nombre || b.nombre || "";
            return nameA.localeCompare(nameB);
          };

          if (newItem.producto.isDirectConsumption) {
            if (!cleanedProducts["directos"]) cleanedProducts["directos"] = [];
            cleanedProducts["directos"] = [...cleanedProducts["directos"], newItem].sort(sortFn);
          } else {
            const category = newItem.estado || "sin-clasificar";
             if (!cleanedProducts[category]) cleanedProducts[category] = [];
            cleanedProducts[category] = [...cleanedProducts[category], newItem].sort(sortFn);
          }
          
          return cleanedProducts;
        });
      }
    };

    socket.on("catalogUpdate", handleCatalogUpdate);

    const handleStatusUpdate = (data) => {
      
      if (data.type === "delete") {
        removeProductFromState(data.productId);
        if (data.product) {
             const unclassifiedProduct = {
                producto: data.product,
                estado: "sin-clasificar",
                fechaFrente: null,
                fechaAlmacen: null,
                fechasAlmacen: [],
                cajaUnica: false,
                hayUnicaCajaActual: false
              };
              addProductToState(unclassifiedProduct);
        }
      } else if ((data.type === "create" || data.type === "update") && data.productStatus) {
        updateProductInState(data.productStatus);
      }
    };

    socket.on("productStatusUpdate", handleStatusUpdate);

    // Listen for local updates (for offline sync between components)
    const handleLocalUpdate = (event) => {
      const data = event.detail;
      if (data.type === "catalogUpdate" || event.type === "localCatalogUpdate") {
        handleCatalogUpdate(data || event.detail);
      } else {
        handleStatusUpdate(data || event.detail);
      }
    };

    window.addEventListener('local-product-update', handleLocalUpdate);
    window.addEventListener('localCatalogUpdate', handleLocalUpdate);
    window.addEventListener('localProductStatusUpdate', handleLocalUpdate);

    return () => {
      socket.off("catalogUpdate", handleCatalogUpdate);
      socket.off("productStatusUpdate", handleStatusUpdate);
      window.removeEventListener('local-product-update', handleLocalUpdate);
      window.removeEventListener('localCatalogUpdate', handleLocalUpdate);
      window.removeEventListener('localProductStatusUpdate', handleLocalUpdate);
    };
  }, [socket, updateProductInState, addProductToState, removeProductFromState]);


  // Helpers para gestión offline
  const addToOfflineBlacklist = (id) => {
    try {
      const ids = JSON.parse(localStorage.getItem('offline_modified_ids') || '[]');
      if (!ids.includes(id)) {
        localStorage.setItem('offline_modified_ids', JSON.stringify([...ids, id]));
      }
    } catch (e) {
      console.error('Error accessing localStorage', e);
    }
  };

  const removeFromOfflineBlacklist = (id) => {
    try {
      const ids = JSON.parse(localStorage.getItem('offline_modified_ids') || '[]');
      const newIds = ids.filter(existingId => existingId !== id);
      localStorage.setItem('offline_modified_ids', JSON.stringify(newIds));
    } catch (e) {
      console.error('Error accessing localStorage', e);
    }
  };

  const handleUpdateProduct = async (productId, updateData) => {
    try {
      const productToUpdate = Object.values(products)
        .flat()
        .find((p) => p.producto._id === productId);

      if (!productToUpdate) throw new Error("Producto no encontrado");

      // 1. Optimistic Update
      const optimisticProduct = {
        ...productToUpdate,
        ...updateData,
        estado: updateData.estado || productToUpdate.estado,
        producto: productToUpdate.producto,
        updatedAt: new Date().toISOString()
      };

      // Remove from offline blacklist BEFORE updating state
      removeFromOfflineBlacklist(productId);

      // Update UI immediately
      updateProductInState(optimisticProduct);

      // Broadcast local event
      window.dispatchEvent(new CustomEvent('local-product-update', {
        detail: { type: 'update', productStatus: optimisticProduct }
      }));

      // 2. Server Call
      const updatedProduct = await updateProductStatus(productId, updateData);
      
      // 3. Confirm with real response
      updateProductInState(updatedProduct);
      
      // --- Lógica de Alerta de Fecha Corta ---
      let minDays = Infinity;
      const today = new Date();
      // Normalizamos 'hoy' a inicio del día para cálculo correcto de días
      today.setHours(0, 0, 0, 0);

      const checkDate = (dateStr) => {
        if (!dateStr) return;
        const d = new Date(dateStr);
        d.setHours(0, 0, 0, 0);
        const diffTime = d - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < minDays) minDays = diffDays;
      };

      // Revisamos todas las fechas enviadas en la actualización
      checkDate(updateData.fechaFrente);
      checkDate(updateData.fechaAlmacen);
      if (updateData.fechasAlmacen && Array.isArray(updateData.fechasAlmacen)) {
        updateData.fechasAlmacen.forEach(f => checkDate(f.date));
      }

      // Si no se actualizó ninguna fecha, minDays será Infinity
      // Si minDays es <= 4, mostramos warning/error
      if (minDays !== Infinity && minDays <= 4) {
          if (minDays <= 0) {
             addToast(
                minDays === 0 ? "¡El producto caduca hoy!" : "¡Producto ya caducado!",
                "error"
             );
          } else {
             addToast(
                `¡El producto caduca en ${minDays} días!`,
                "warning"
             );
          }
          // Vibración doble
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      } else {
          addToast(
            `${productToUpdate.producto.nombre} actualizado correctamente.`,
            "success"
          );
      }
      return true;
    } catch (error) {
      addToast(`Error al actualizar: ${error.message}.`, "error");
      return false;
    }
  };

  const unclassifyProductInState = useCallback((productId, productData) => {
    setProducts((prevProducts) => {
      // 1. Remove from any category
      const newProducts = Object.entries(prevProducts).reduce(
        (acc, [category, productList]) => {
          const filtered = productList.filter((p) => {
             if (p.producto && p.producto._id) return p.producto._id !== productId;
             return p._id !== productId;
          });
          acc[category] = filtered;
          return acc;
        },
        { ...prevProducts }
      );

      // 2. Add to 'sin-clasificar'
      const unclassifiedProduct = {
        producto: productData,
        estado: "sin-clasificar",
        fechaFrente: null,
        fechaAlmacen: null,
        fechasAlmacen: [],
        cajaUnica: false,
        hayUnicaCajaActual: false,
        // Preserve temp ID if it exists
        _id: productData._id || productId 
      };

      // Check existence to avoid duplicates (safeguard)
      // Note: Since we removed it from all categories above, it shouldn't be here unless duplicate IDs exist
      const exists = newProducts["sin-clasificar"]?.some(
          p => (p.producto._id === unclassifiedProduct.producto._id)
      );

      if (!exists) {
          // Check Direct Consumption
          if (unclassifiedProduct.producto?.isDirectConsumption) {
              if (!newProducts["directos"]) newProducts["directos"] = [];
               newProducts["directos"] = [
                ...newProducts["directos"], 
                unclassifiedProduct
              ].sort((a, b) => {
                  const nameA = a.producto?.nombre || "";
                  const nameB = b.producto?.nombre || "";
                  return nameA.localeCompare(nameB);
              });
          } else {
               if (!newProducts["sin-clasificar"]) newProducts["sin-clasificar"] = [];
               newProducts["sin-clasificar"] = [
                ...newProducts["sin-clasificar"], 
                unclassifiedProduct
              ].sort((a, b) => {
                  const nameA = a.producto?.nombre || "";
                  const nameB = b.producto?.nombre || "";
                  return nameA.localeCompare(nameB);
              });
          }
      }

      return newProducts;
    });
  }, []);

  const handleDeleteProduct = async (productId) => {
    try {
      const productToDelete = Object.values(products)
        .flat()
        .find((p) => p.producto._id === productId);

      if (!productToDelete) throw new Error("Producto no encontrado");

      // Preparar backup del producto
      const savedProduct = {
        producto: { 
          _id: productToDelete.producto._id,
          nombre: productToDelete.producto.nombre,
          tipo: productToDelete.producto.tipo,
          activo: productToDelete.producto.activo
        },
        estado: productToDelete.estado,
        fechaFrente: productToDelete.fechaFrente,
        fechaAlmacen: productToDelete.fechaAlmacen,
        cajasAlmacen: productToDelete.cajasAlmacen || 0,
        fechasAlmacen: productToDelete.fechasAlmacen ? [...productToDelete.fechasAlmacen] : [],
        cajaUnica: Boolean(productToDelete.cajaUnica),
        hayUnicaCajaActual: Boolean(productToDelete.hayUnicaCajaActual),
        _id: productToDelete._id
      };
      
      // Guardar en Context (reemplaza a window y localStorage manual)
      addToHistory(savedProduct);
      
      // AGREGAR A LISTA NEGRA LOCAL (Offline Support)
      addToOfflineBlacklist(productId);

      await deleteProductStatus(productId);
      
      // ATOMIC LOCAL UPDATE
      unclassifyProductInState(productId, productToDelete.producto);

      // Broadcast local event
      window.dispatchEvent(new CustomEvent('local-product-update', {
        detail: { 
            type: 'delete', 
            productId, 
            product: productToDelete.producto 
        }
      }));

      addToast(
        `${productToDelete.producto.nombre} desclasificado correctamente.`,
        "success",
        { productId }
      );
      return true;
    } catch (error) {
      addToast(`Error al desclasificar: ${error.message}.`, "error");
      return false;
    }
  };

  const handleUndoDelete = async (productId) => {
    try {
      // Recuperar del Context
      const productToRestore = getFromHistory(productId);

      if (!productToRestore) {
        throw new Error("No hay producto para restaurar");
      }

      const updateData = {
        fechaFrente: productToRestore.fechaFrente,
        fechaAlmacen: productToRestore.fechaAlmacen,
        cajasAlmacen: productToRestore.cajasAlmacen,
        fechasAlmacen: productToRestore.fechasAlmacen || [],
        cajaUnica: productToRestore.cajaUnica || false,
        hayUnicaCajaActual: productToRestore.hayUnicaCajaActual || false,
        estado: productToRestore.estado,
      };

      // Remove from offline blacklist BEFORE state update
      removeFromOfflineBlacklist(productId);

      const restoredProduct = await updateProductStatus(productId, updateData);
      updateProductInState(restoredProduct);
      
      // Broadcast local event
      window.dispatchEvent(new CustomEvent('local-product-update', {
        detail: { type: 'update', productStatus: restoredProduct }
      }));

      // await loadAllProducts();

      // Limpiar del historial una vez restaurado
      removeFromHistory(productId);

      addToast(`${productToRestore.producto.nombre} restaurado correctamente.`, "success");
      return true;
    } catch (error) {
      addToast(`Error al deshacer: ${error.message}`, "error");
      return false;
    }
  };

  // Memoizar instancias de Fuse para evitar re-creación en cada render
  const fuseInstances = useMemo(() => {
    const instances = {};
    const options = {
      keys: ['producto.nombre', 'producto.tipo'],
      threshold: 0.35, // Tolerancia a errores (0.0 = exacto, 1.0 = cualquier cosa)
      ignoreLocation: true, // Buscar en cualquier parte del string
      minMatchCharLength: 2,
      shouldSort: true
    };

    Object.entries(products).forEach(([category, list]) => {
      instances[category] = new Fuse(list, options);
    });

    return instances;
  }, [products]);

  const filterProducts = useCallback(
    (searchTerm) => {
      if (!searchTerm) {
        // eslint-disable-next-line no-unused-vars
        const { "sin-clasificar": _unused, ...rest } = products;
        return rest;
      }

      const searchTermTrimmed = searchTerm.trim();
      
      return Object.entries(products).reduce(
        (filteredProducts, [category, productList]) => {
          let filtered;

          // Usar Fuzzy Search
          const fuse = fuseInstances[category];
          if (fuse && searchTermTrimmed.length >= 1) {
             const results = fuse.search(searchTermTrimmed);
             filtered = results.map(result => result.item);
          } else {
             // Fallback o búsqueda vacía (aunque el if inicial lo atrapa)
             filtered = productList;
          }

          // Keep if results found OR not 'sin-clasificar'
          if (filtered.length > 0 || category !== "sin-clasificar") {
            filteredProducts[category] = filtered;
          }

          return filteredProducts;
        },
        {}
      );
    },
    [products, fuseInstances]
  );

  return {
    products,
    loading,
    error,
    lastUpdatedProductId,
    loadAllProducts,
    handleUpdateProduct,
    handleDeleteProduct,
    handleUndoDelete,
    filterProducts,
    updateProductInState,
    removeProductFromState,
    addProductToState,
  };
};
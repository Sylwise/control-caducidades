import { useState, useCallback, useEffect } from "react";
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
        "sin-clasificar": combinedUnclassifiedProducts,
        "frente-cambia": validStatusData.filter(
          (product) => product.estado === "frente-cambia"
        ),
        "frente-agota": validStatusData.filter(
          (product) => product.estado === "frente-agota"
        ),
        "abierto-cambia": validStatusData.filter(
          (product) => product.estado === "abierto-cambia"
        ),
        "abierto-agota": validStatusData.filter(
          (product) => product.estado === "abierto-agota"
        ),
      };

      setProducts(organizedProducts);
    } catch (err) {
      setError(err.message || "Error al cargar los productos");
    } finally {
      setLoading(false);
    }
  }, []);

  // Escuchar eventos del catálogo en tiempo real
  useEffect(() => {
    if (!socket) return;

    const handleCatalogUpdate = (data) => {
      if (data.type === "delete") {
        removeProductFromState(data.productId);
      } else if (data.type === "create" && data.productStatus) {
        addProductToState(data.productStatus);
      } else if (data.type === "update" && data.product) {
        setProducts((prevProducts) => {
          const newProducts = { ...prevProducts };
          
          Object.keys(newProducts).forEach((category) => {
            newProducts[category] = newProducts[category].map((item) => {
              if (item.producto._id === data.product._id) {
                return {
                  ...item,
                  producto: data.product
                };
              }
              return item;
            });
          });
          
          return newProducts;
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
      if (data.type === "catalogUpdate") {
        handleCatalogUpdate(data);
      } else {
        handleStatusUpdate(data);
      }
    };

    window.addEventListener('local-product-update', handleLocalUpdate);

    return () => {
      socket.off("catalogUpdate", handleCatalogUpdate);
      socket.off("productStatusUpdate", handleStatusUpdate);
      window.removeEventListener('local-product-update', handleLocalUpdate);
    };
  }, [socket]);

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

      newProducts[category] = [...newProducts[category], productToSave];
      
      if (category === "sin-clasificar") {
        newProducts[category] = newProducts[category].sort((a, b) => {
           const nameA = a.producto?.nombre || a.nombre || "";
           const nameB = b.producto?.nombre || b.nombre || "";
           return nameA.localeCompare(nameB);
        });
      }

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
        const exists = prevProducts[category].some(
          (p) => p.producto._id === productData.producto._id
        );
        
        if (exists) return prevProducts;

        const newCategoryList = [...prevProducts[category], productData];
        
        if (category === "sin-clasificar") {
            newCategoryList.sort((a, b) => a.producto.nombre.localeCompare(b.producto.nombre));
        }

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

      const newUnclassifiedProducts = [...prevProducts["sin-clasificar"], unclassifiedProduct]
        .sort((a, b) => a.producto.nombre.localeCompare(b.producto.nombre));

      return {
        ...prevProducts,
        "sin-clasificar": newUnclassifiedProducts,
      };
    });
  }, []);

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

      // 1. Optimistic Update (Actualización Optimista)
      const optimisticProduct = {
        ...productToUpdate,
        ...updateData,
        estado: updateData.estado || productToUpdate.estado,
        producto: productToUpdate.producto,
        updatedAt: new Date().toISOString()
      };

      // CRÍTICO: Quitamos de la lista negra ANTES de actualizar el estado
      // Esto evita que useExpiringProducts filtre el producto cuando se renderice
      removeFromOfflineBlacklist(productId);

      // Actualizamos el estado visualmente YA
      updateProductInState(optimisticProduct);

      // Broadcast local event for other components (like MainLayout)
      window.dispatchEvent(new CustomEvent('local-product-update', {
        detail: { type: 'update', productStatus: optimisticProduct }
      }));

      // 2. Llamada real al servidor / OfflineManager
      const updatedProduct = await updateProductStatus(productId, updateData);
      
      // 3. Confirmamos con la respuesta real
      updateProductInState(updatedProduct);
      
      addToast(
        `${productToUpdate.producto.nombre} actualizado correctamente.`,
        "success"
      );
      return true;
    } catch (error) {
      addToast(`Error al actualizar: ${error.message}.`, "error");
      return false;
    }
  };

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
      removeProductFromState(productId);

      const unclassifiedProduct = {
        producto: productToDelete.producto,
        estado: "sin-clasificar",
        fechaFrente: null,
        fechaAlmacen: null,
        fechasAlmacen: [],
        cajaUnica: false,
        hayUnicaCajaActual: false
      };
      addProductToState(unclassifiedProduct);

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

      // CRÍTICO: Quitamos de la lista negra ANTES de cualquier actualización de estado
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

  const filterProducts = useCallback(
    (searchTerm) => {
      if (!searchTerm) {
        // eslint-disable-next-line no-unused-vars
        const { "sin-clasificar": _unused, ...rest } = products;
        return rest;
      }

      const searchTermLower = searchTerm.toLowerCase().trim();
      return Object.entries(products).reduce(
        (filteredProducts, [category, productList]) => {
          const filtered = productList.filter((product) =>
            product.producto?.nombre?.toLowerCase().includes(searchTermLower)
          );

          if (filtered.length > 0 || category !== "sin-clasificar") {
            filteredProducts[category] = filtered;
          }

          return filteredProducts;
        },
        {}
      );
    },
    [products]
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
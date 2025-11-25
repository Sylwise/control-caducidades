// Crear un almacenamiento global para el historial de productos eliminados
// Esto garantiza que esté disponible incluso si los estados de React se reinician
if (typeof window !== 'undefined') {
  window.deletedProductsHistory = window.deletedProductsHistory || {
    // Usar un objeto para almacenar por ID del producto
    history: {},
    
    // Añadir un producto al historial
    addProduct: function(product) {
      if (!product || !product.producto || !product.producto._id) {
        console.error('Intento de añadir un producto inválido al historial');
        return;
      }
      
      const productId = product.producto._id;
      console.log('Añadiendo producto al historial:', productId, product.producto.nombre);
      
      // Guardar en el historial en memoria
      this.history[productId] = product;
      
      // También guardar en localStorage como respaldo
      try {
        // Leer el historial actual
        let storedHistory = {};
        const saved = localStorage.getItem('deletedProductsHistory');
        if (saved) {
          storedHistory = JSON.parse(saved);
        }
        
        // Añadir/actualizar este producto
        storedHistory[productId] = product;
        
        // Guardar de nuevo
        localStorage.setItem('deletedProductsHistory', JSON.stringify(storedHistory));
      } catch (e) {
        console.error('Error al guardar el historial en localStorage:', e);
      }
    },
    
    // Obtener un producto del historial por ID
    getProduct: function(productId) {
      console.log('Buscando producto en el historial:', productId);
      
      // Primero buscar en la memoria
      if (this.history[productId]) {
        console.log('Producto encontrado en el historial en memoria');
        return this.history[productId];
      }
      
      // Si no está en memoria, intentar recuperar de localStorage
      try {
        const saved = localStorage.getItem('deletedProductsHistory');
        if (saved) {
          const storedHistory = JSON.parse(saved);
          if (storedHistory[productId]) {
            console.log('Producto encontrado en el historial en localStorage');
            // Actualizar la versión en memoria
            this.history[productId] = storedHistory[productId];
            return storedHistory[productId];
          }
        }
      } catch (e) {
        console.error('Error al recuperar el historial de localStorage:', e);
      }
      
      console.log('Producto no encontrado en el historial');
      return null;
    },
    
    // Eliminar un producto del historial
    removeProduct: function(productId) {
      console.log('Eliminando producto del historial:', productId);
      
      // Eliminar de la memoria
      if (this.history[productId]) {
        delete this.history[productId];
      }
      
      // Eliminar de localStorage
      try {
        const saved = localStorage.getItem('deletedProductsHistory');
        if (saved) {
          const storedHistory = JSON.parse(saved);
          if (storedHistory[productId]) {
            delete storedHistory[productId];
            localStorage.setItem('deletedProductsHistory', JSON.stringify(storedHistory));
          }
        }
      } catch (e) {
        console.error('Error al eliminar producto del historial en localStorage:', e);
      }
    }
  };
}

import { useState, useCallback, useEffect } from "react";
import { INITIAL_PRODUCTS_STATE } from "../constants/productConstants";
import {
  getAllProductStatus,
  getAllCatalogProducts,
  updateProductStatus,
  deleteProductStatus,
} from "../services/api";

export const useProductManagement = (addToast) => {
  const [products, setProducts] = useState(INITIAL_PRODUCTS_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdatedProductId, setLastUpdatedProductId] = useState(null);
  
  // Cargar lastDeletedProduct desde localStorage si existe
  const [lastDeletedProduct, setLastDeletedProduct] = useState(() => {
    try {
      const saved = localStorage.getItem('lastDeletedProduct');
      return saved ? JSON.parse(saved) : null;
    } catch (err) {
      console.error('Error al cargar el último producto eliminado:', err);
      return null;
    }
  });

  // Persistir lastDeletedProduct en localStorage cuando cambie
  useEffect(() => {
    if (lastDeletedProduct) {
      try {
        localStorage.setItem('lastDeletedProduct', JSON.stringify(lastDeletedProduct));
      } catch (err) {
        console.error('Error al guardar el último producto eliminado:', err);
      }
    } else {
      localStorage.removeItem('lastDeletedProduct');
    }
  }, [lastDeletedProduct]);

  const loadAllProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [statusData, catalogData] = await Promise.all([
        getAllProductStatus(),
        getAllCatalogProducts(),
      ]);

      const classifiedProductIds = new Set(
        statusData.map((product) => product.producto._id)
      );

      const unclassifiedProducts = catalogData
        .filter((product) => !classifiedProductIds.has(product._id))
        .map((product) => ({
          producto: product,
          estado: "sin-clasificar",
        }));

      // Combinar y ordenar alfabéticamente los productos sin clasificar
      const combinedUnclassifiedProducts = [
        ...unclassifiedProducts,
        ...statusData.filter(
          (product) => product.estado === "sin-clasificar"
        )
      ].sort((a, b) => a.producto.nombre.localeCompare(b.producto.nombre));

      const organizedProducts = {
        "sin-clasificar": combinedUnclassifiedProducts,
        "frente-cambia": statusData.filter(
          (product) => product.estado === "frente-cambia"
        ),
        "frente-agota": statusData.filter(
          (product) => product.estado === "frente-agota"
        ),
        "abierto-cambia": statusData.filter(
          (product) => product.estado === "abierto-cambia"
        ),
        "abierto-agota": statusData.filter(
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

  const updateProductInState = useCallback((productData) => {
    if (!productData) return;

    // Normalizar datos: si viene del catálogo (update), puede no tener la estructura de status
    // Si productData no tiene .producto, asumimos que es el producto en sí mismo
    const productId = productData.producto?._id || productData._id;
    
    if (!productId) {
        console.error("updateProductInState: No valid ID found in data", productData);
        return;
    }

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
      
      // Si productData no es un status completo, intentamos reconstruirlo o lo usamos tal cual si es compatible
      const productToSave = productData.producto ? productData : {
          producto: productData,
          estado: category,
          // Mantener otros campos si existen
          ...productData
      };

      // Añadir el producto a su categoría
      newProducts[category] = [...newProducts[category], productToSave];
      
      // Ordenar alfabéticamente los productos sin clasificar
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
            // Comprobar si el producto está en un estado
            if (p.producto && p.producto._id) {
              return p.producto._id !== productId;
            }
            // Comprobar si el producto está en el catálogo
            if (p._id) {
              return p._id !== productId;
            }
            // Si no tiene ID, mantenerlo (no debería ocurrir)
            return true;
          });
          return acc;
        },
        { ...prevProducts }
      );
    });

    // Limpiar el último producto eliminado
    setLastDeletedProduct(null);
  }, []);

  const addProductToState = useCallback((productData) => {
    setProducts((prevProducts) => {
      // Si el producto ya tiene un estado, usarlo directamente
      if (productData.estado) {
        console.log("Adding product with status to state:", productData);
        const category = productData.estado;
        // Verificar si el producto ya existe en la categoría
        const exists = prevProducts[category].some(
          (p) => p.producto._id === productData.producto._id
        );
        
        if (exists) {
            console.log("Product already exists in state, skipping:", productData.producto.nombre);
            return prevProducts;
        }

        const newCategoryList = [...prevProducts[category], productData];
        
        // Ordenar si es sin-clasificar
        if (category === "sin-clasificar") {
            newCategoryList.sort((a, b) => a.producto.nombre.localeCompare(b.producto.nombre));
        }

        return {
          ...prevProducts,
          [category]: newCategoryList,
        };
      }

      // Si es un producto del catálogo, añadirlo como sin clasificar
      const unclassifiedProduct = {
        producto: productData,
        estado: "sin-clasificar",
        fechaFrente: null,
        fechaAlmacen: null,
        fechasAlmacen: [],
        cajaUnica: false,
        hayUnicaCajaActual: false
      };
      // Eliminar esta línea duplicada que causa un problema
      // addProductToState(unclassifiedProduct);

      // Verificar si el producto ya existe en sin-clasificar
      // Primero verificar por ID exacto
      const existsById = prevProducts["sin-clasificar"].some(
        (p) => p.producto._id === productData._id
      );
      
      // Luego verificar si hay algún producto con nombre idéntico y tipo temporal
      // Esto ayuda a prevenir duplicados cuando se sincronizan productos temporales
      const existsByName = productData.nombre && prevProducts["sin-clasificar"].some(
        (p) => 
          p.producto.nombre === productData.nombre && 
          (p.producto._id.startsWith('temp_') || productData._id.startsWith('temp_'))
      );
      
      if (existsById || existsByName) return prevProducts;

      // Añadir el producto y ordenar alfabéticamente
      const newUnclassifiedProducts = [...prevProducts["sin-clasificar"], unclassifiedProduct]
        .sort((a, b) => a.producto.nombre.localeCompare(b.producto.nombre));

      return {
        ...prevProducts,
        "sin-clasificar": newUnclassifiedProducts,
      };
    });
  }, []);

  const handleUpdateProduct = async (productId, updateData) => {
    try {
      const productToUpdate = Object.values(products)
        .flat()
        .find((p) => p.producto._id === productId);

      if (!productToUpdate) {
        throw new Error("Producto no encontrado");
      }

      const updatedProduct = await updateProductStatus(productId, updateData);
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

      if (!productToDelete) {
        throw new Error("Producto no encontrado");
      }

      // Hacer una copia profunda y completa del producto antes de eliminarlo
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
        fechasAlmacen: productToDelete.fechasAlmacen ? [...productToDelete.fechasAlmacen] : [],
        cajaUnica: Boolean(productToDelete.cajaUnica),
        hayUnicaCajaActual: Boolean(productToDelete.hayUnicaCajaActual),
        _id: productToDelete._id
      };

      console.log("Guardando producto eliminado:", savedProduct);
      
      // Guardar en el historial global
      if (window.deletedProductsHistory) {
        window.deletedProductsHistory.addProduct(savedProduct);
      }
      
      // También mantener el último en el estado (para compatibilidad)
      setLastDeletedProduct(savedProduct);

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

      // Asegurarse de que los datos del toast contengan el ID correcto del producto
      const toastData = {
        productId: productId, // Usar directamente el productId recibido como parámetro
      };

      addToast(
        `${productToDelete.producto.nombre} desclasificado correctamente.`,
        "success",
        toastData
      );
      return true;
    } catch (error) {
      console.error("Error al desclasificar:", error);
      addToast(
        `Error al desclasificar el producto: ${error.message}.`,
        "error"
      );
      return false;
    }
  };

  const handleUndoDelete = async (productId) => {
    try {
      console.log("Intentando restaurar producto con ID:", productId);
      
      // Intentar recuperar el producto del historial global primero
      let productToRestore = null;
      
      if (window.deletedProductsHistory) {
        productToRestore = window.deletedProductsHistory.getProduct(productId);
      }
      
      // Si no está en el historial global, intentar del estado (para compatibilidad)
      if (!productToRestore && lastDeletedProduct && lastDeletedProduct.producto._id === productId) {
        productToRestore = lastDeletedProduct;
        console.log("Usando producto del estado:", productToRestore);
      }

      // Verificar si tenemos un producto para restaurar
      if (!productToRestore) {
        console.error("No se encontró producto para restaurar en el historial");
        throw new Error("No hay producto para restaurar");
      }

      console.log("Datos del producto a restaurar:", {
        id: productToRestore.producto?._id,
        nombre: productToRestore.producto?.nombre,
        estado: productToRestore.estado
      });

      const updateData = {
        fechaFrente: productToRestore.fechaFrente,
        fechaAlmacen: productToRestore.fechaAlmacen,
        fechasAlmacen: productToRestore.fechasAlmacen || [],
        cajaUnica: productToRestore.cajaUnica || false,
        hayUnicaCajaActual: productToRestore.hayUnicaCajaActual || false,
        estado: productToRestore.estado,
      };

      console.log("Datos de restauración:", updateData);

      const result = await updateProductStatus(productId, updateData);
      console.log("Resultado de la restauración:", result);
      
      await loadAllProducts(); // Recargar productos después de la restauración

      const nombreProducto = productToRestore.producto.nombre;
      
      // Eliminar del historial ya que se ha restaurado
      if (window.deletedProductsHistory) {
        window.deletedProductsHistory.removeProduct(productId);
      }
      
      // Limpiar el último eliminado si es el mismo (para compatibilidad)
      if (lastDeletedProduct && lastDeletedProduct.producto._id === productId) {
        setLastDeletedProduct(null);
      }

      addToast(`${nombreProducto} restaurado correctamente.`, "success");
      return true;
    } catch (error) {
      console.error("Error al deshacer:", error);
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

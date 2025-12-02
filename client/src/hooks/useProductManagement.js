import { useState, useCallback } from "react";
import { INITIAL_PRODUCTS_STATE } from "../constants/productConstants";
import { useDeletedProducts } from "../contexts/DeletedProductsContext";
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

      const classifiedProductIds = new Set(
        statusData.map((product) => product.producto._id)
      );

      const unclassifiedProducts = catalogData
        .filter((product) => !classifiedProductIds.has(product._id))
        .map((product) => ({
          producto: product,
          estado: "sin-clasificar",
        }));

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

  const handleUpdateProduct = async (productId, updateData) => {
    try {
      const productToUpdate = Object.values(products)
        .flat()
        .find((p) => p.producto._id === productId);

      if (!productToUpdate) throw new Error("Producto no encontrado");

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

      const restoredProduct = await updateProductStatus(productId, updateData);
      updateProductInState(restoredProduct);
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
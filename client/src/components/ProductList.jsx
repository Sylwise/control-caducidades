import { useState, useEffect, useCallback } from "react";
import { useOutletContext, useLocation } from "react-router-dom";
import { CheckCircle, ClipboardList } from "lucide-react";
import SearchBar from "./SearchBar";
import UpdateModal from "./UpdateModal";
import CategorySection from "./CategorySection";
import ModalContainer from "./ModalContainer";
import ProductListContainer from "./ProductListContainer";
import LoadingErrorContainer from "./LoadingErrorContainer";
import { useProductManagement } from "../hooks/useProductManagement";
import { useModalManagement } from "../hooks/useModalManagement";
import { useProductUpdateForm } from "../hooks/useProductUpdateForm";
import { useProductScroll } from "../hooks/useProductScroll";
import { isExpiringSoon } from "../utils/dateUtils";
import { useSocket } from "../hooks/useSocket";
import usePreventScroll from "../hooks/usePreventScroll";
import useToasts from "../hooks/useToasts";

import ToastContainer from "./ToastContainer";

import useHardwareBackButton from "../hooks/useHardwareBackButton";

const ProductList = () => {
  const { socket } = useSocket();
  const { addToast, toasts, removeToast } = useToasts();
  const location = useLocation();
  
  // Estados locales
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewMode, setViewMode] = useState('card');

  // Custom Hooks
  const {
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
  } = useProductManagement((message, type, data) =>
    addToast(message, type, data)
  );

  const {
    isUpdateModalOpen,
    showUnclassified,
    isClosingUnclassified,
    isClosingUpdateModal,
    setIsUpdateModalOpen,
    setShowUnclassified,
    handleCloseUnclassified,
    handleCloseUpdateModal,
  } = useModalManagement();

  // --- Hardware Back Button Hooks ---
  // 1. Pending Products Modal (Priority 10)
  useHardwareBackButton(showUnclassified, handleCloseUnclassified, 10, 'pending-products-list');

  // 2. Deselect Product Card (Priority 15)
  // Ensures card collapses before modal closes
  useHardwareBackButton(!!selectedProduct, () => setSelectedProduct(null), 15, 'deselect-product');

  // Hook de Scroll
  const { scrollToProductId } = useProductScroll(selectedProduct);

  // Hook de Formulario
  const {
    updateForm,
    setUpdateForm,
    editingProduct,
    isUpdating,
    prepareFormForUpdate,
    submitUpdate
  } = useProductUpdateForm({
    handleUpdateProduct,
    addToast,
    setIsUpdateModalOpen,
    setShowUnclassified,
    setSearchTerm,
    setSelectedProduct,
    scrollToProductId
  });

  // Prevenir scroll cuando los modales están abiertos
  usePreventScroll(isUpdateModalOpen && !isClosingUpdateModal);
  usePreventScroll(showUnclassified && !isClosingUnclassified);

  // Manejadores de eventos
  const handleProductClick = useCallback((product) => {
    setSelectedProduct((current) => {
      return current?.producto?._id === product.producto?._id ? null : product;
    });
  }, []);

  const handleDeleteClick = useCallback(async (product, e) => {
    e.stopPropagation();
    const success = await handleDeleteProduct(product.producto?._id);
    if (success) {
      setSelectedProduct(null);
      setSearchTerm("");
    }
  }, [handleDeleteProduct]);

  // Efectos
  useEffect(() => {
    loadAllProducts();
  }, [loadAllProducts]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const productCard = event.target.closest(".product-card");

      if (selectedProduct && !productCard) {
        setSelectedProduct(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedProduct]);

  // Efecto para manejar navegación desde el modal de caducidades
  useEffect(() => {
    if (location.state?.productId && !loading && products) {
      const productId = location.state.productId;
      
      // Buscar el producto en todas las categorías
      let foundProduct = null;
      let foundCategory = null;

      for (const category in products) {
        const product = products[category].find(p => p.producto._id === productId);
        if (product) {
          foundProduct = product;
          foundCategory = category;
          break;
        }
      }

      if (foundProduct) {
        // Si es un producto sin clasificar, usamos el buscador para que aparezca en la lista
        if (foundCategory === "sin-clasificar") {
          setSearchTerm(foundProduct.producto.nombre);
        } else {
          // Si es clasificado, limpiamos el buscador para asegurar que no esté filtrado
          setSearchTerm("");
        }

        setSelectedProduct(foundProduct);
        scrollToProductId(productId);
        
        // Limpiar el state para evitar re-selección al recargar o navegar
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, loading, products, scrollToProductId]);

  // Handlers para eventos
  const handleCatalogUpdate = useCallback((data) => {
    if (data.type === "create") {
      addProductToState(data.productStatus || data.product);
    } else if (data.type === "update") {
      updateProductInState(data.productStatus || data.product);
    } else if (data.type === "delete") {
      removeProductFromState(data.productId);
    }
  }, [addProductToState, updateProductInState, removeProductFromState]);

  const handleProductStatusUpdate = useCallback((data) => {
    if (data.type === "update" || data.type === "create") {
      updateProductInState(data.productStatus);
    } else if (data.type === "delete") {
      removeProductFromState(data.productId);
      
      if (data.product) {
        addProductToState({
          producto: data.product,
          estado: "sin-clasificar",
          fechaFrente: null,
          fechaAlmacen: null,
          fechasAlmacen: [],
          cajaUnica: false,
          hayUnicaCajaActual: false
        });
      }
    }
  }, [updateProductInState, removeProductFromState, addProductToState]);

  // Efecto para eventos locales
  useEffect(() => {
    const handleLocalCatalogUpdate = (event) => {
      handleCatalogUpdate(event.detail);
    };

    const handleLocalProductStatusUpdate = (event) => {
      handleProductStatusUpdate(event.detail);
    };

    window.addEventListener("localCatalogUpdate", handleLocalCatalogUpdate);
    window.addEventListener("localProductStatusUpdate", handleLocalProductStatusUpdate);

    return () => {
      window.removeEventListener("localCatalogUpdate", handleLocalCatalogUpdate);
      window.removeEventListener("localProductStatusUpdate", handleLocalProductStatusUpdate);
    };
  }, [handleCatalogUpdate, handleProductStatusUpdate]);

  // Efecto para eventos de socket
  useEffect(() => {
    if (!socket) return;

    socket.on("productStatusUpdate", handleProductStatusUpdate);
    socket.on("catalogUpdate", handleCatalogUpdate);

    return () => {
      socket.off("productStatusUpdate", handleProductStatusUpdate);
      socket.off("catalogUpdate", handleCatalogUpdate);
    };
  }, [socket, handleProductStatusUpdate, handleCatalogUpdate]);

  return (
    <LoadingErrorContainer
      loading={loading}
      error={error}
      onRetry={loadAllProducts}
    >
      <div className="max-w-md md:max-w-xl mx-auto">
        <ToastContainer
          toasts={toasts}
          removeToast={removeToast}
          onUndo={handleUndoDelete}
        />
        
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          unclassifiedCount={products["sin-clasificar"].length}
          onUnclassifiedClick={() => setShowUnclassified(!showUnclassified)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Lista de productos sin clasificar */}
        {showUnclassified && (
          <ModalContainer
            isOpen={showUnclassified}
            isClosing={isClosingUnclassified}
            onClose={handleCloseUnclassified}
            title={
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#1d5030]" />
                <span>Productos Pendientes</span>
              </div>
            }
          >
            <div className="flex-1 overflow-y-auto overscroll-contain p-4">
              {products["sin-clasificar"].length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      ¡Todo al día!
                    </h3>
                    <p className="text-gray-500">
                      No hay productos pendientes de clasificar.
                    </p>
                  </div>
                </div>
              ) : (
                <CategorySection
                  category="sin-clasificar"
                  products={
                    viewMode === 'compact'
                      ? products["sin-clasificar"].filter(p => p.fechaFrente || p.fechaAlmacen)
                      : products["sin-clasificar"]
                  }
                  selectedProduct={selectedProduct}
                  isExpiringSoon={isExpiringSoon}
                  lastUpdatedProductId={lastUpdatedProductId}
                  onProductClick={handleProductClick}
                  onUpdateClick={prepareFormForUpdate}
                  onDeleteClick={handleDeleteClick}
                  viewMode={viewMode}
                />
              )}
            </div>
          </ModalContainer>
        )}
        
        {/* Lista de productos clasificados */}
        <ProductListContainer
          filteredProducts={filterProducts(searchTerm)}
          selectedProduct={selectedProduct}
          isExpiringSoon={isExpiringSoon}
          lastUpdatedProductId={lastUpdatedProductId}
          onProductClick={handleProductClick}
          onUpdateClick={prepareFormForUpdate}
          onDeleteClick={handleDeleteClick}
          searchTerm={searchTerm}
          viewMode={viewMode}
        />

        {/* Modales Locales */}
        <UpdateModal
          isOpen={isUpdateModalOpen}
          isClosing={isClosingUpdateModal}
          editingProduct={editingProduct}
          updateForm={updateForm}
          setUpdateForm={setUpdateForm}
          isUpdating={isUpdating}
          onClose={handleCloseUpdateModal}
          onSubmit={submitUpdate}
        />
      </div>
    </LoadingErrorContainer>
  );
};

export default ProductList;

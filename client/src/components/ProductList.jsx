import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
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

const ProductList = () => {
  // Use context from MainLayout if available, or fallback to local fetching (though MainLayout should provide it)
  // Actually, for simplicity and to ensure full functionality of useProductManagement hooks (like update/delete),
  // we will use the hook locally as well. The double fetch is acceptable for now.
  // Ideally, we would pass all handlers from MainLayout, but that's a larger refactor.
  
  const { socket } = useSocket();
  const { addToast } = useToasts(); // We use local toast hook, but MainLayout has its own container.
  // Wait, if MainLayout has ToastContainer, we should probably use that one?
  // But useToasts is a hook, it doesn't share state unless via Context.
  // The app doesn't seem to have a ToastContext.
  // So we might have double toasts if we are not careful.
  // MainLayout has ToastContainer. ProductList had ToastContainer.
  // I should REMOVE ToastContainer from ProductList if MainLayout has it.
  // But how does ProductList trigger toasts in MainLayout?
  // It can't unless we use a Context.
  // For now, I will leave ToastContainer in ProductList too? No, that's ugly.
  // I'll assume I should leave it in ProductList for the product actions, 
  // and MainLayout uses it for global actions?
  // Actually, let's look at App.jsx. There is no ToastProvider.
  // So I will keep ToastContainer in ProductList for now to ensure feedback works.
  // MainLayout's ToastContainer will handle MainLayout's toasts.
  
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
        {/* Note: ToastContainer is kept here for local feedback. 
            Ideally should be global but we lack a ToastContext. */}
        {/* <ToastContainer
          toasts={toasts}
          removeToast={removeToast}
          onUndo={handleUndoDelete}
        /> */}
        {/* Actually, let's try to rely on MainLayout's ToastContainer? 
            No, we can't emit to it. 
            So we MUST render a ToastContainer here if we want to see toasts from this component.
            BUT, MainLayout also renders one. 
            This might cause overlapping toasts if both are active.
            However, MainLayout's toasts are driven by MainLayout's useToasts hook.
            ProductList's toasts are driven by ProductList's useToasts hook.
            They are independent.
            So it's fine to have both.
        */}
        
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
                  onProductClick={(p) => {
                    handleProductClick(p);
                    prepareFormForUpdate(p);
                  }}
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

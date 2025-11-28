import { useState, useEffect, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../contexts/AuthContext";
import ToastContainer from "./ToastContainer";
import UserManagement from "./UserManagement";
import CatalogManagement from "./CatalogManagement";
import RestaurantManagement from "./RestaurantManagement";
import { useSocket } from "../hooks/useSocket";
import usePreventScroll from "../hooks/usePreventScroll";
import useToasts from "../hooks/useToasts";
import { CheckCircle } from "lucide-react";
import SearchBar from "./SearchBar";
import UpdateModal from "./UpdateModal";
import ExpiringModal from "./ExpiringModal";
import HeaderSection from "./HeaderSection";
import CategorySection from "./CategorySection";
import ModalContainer from "./ModalContainer";
import ProductListContainer from "./ProductListContainer";
import LoadingErrorContainer from "./LoadingErrorContainer";
import { useProductManagement } from "../hooks/useProductManagement";
import { useModalManagement } from "../hooks/useModalManagement";
import { useExpiringProducts } from "../hooks/useExpiringProducts";
import { useProductUpdateForm } from "../hooks/useProductUpdateForm";
import { useProductScroll } from "../hooks/useProductScroll";
import { isExpiringSoon } from "../utils/dateUtils";

const ProductList = () => {
  const navigate = useNavigate();
  const {
    user: authUser,
    setIsAuthenticated,
    setUser,
  } = useContext(AuthContext);
  const { socket } = useSocket();
  const { toasts, addToast, removeToast } = useToasts();

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
    isExpiringModalOpen,
    showUnclassified,
    isUserManagementOpen,
    showCatalogManagement,
    isClosingUnclassified,
    isClosingUpdateModal,
    isClosingExpiringModal,
    setIsUpdateModalOpen,
    setIsExpiringModalOpen,
    setShowUnclassified,
    setIsUserManagementOpen,
    setShowCatalogManagement,
    handleCloseUnclassified,
    handleCloseUpdateModal,
    handleCloseExpiringModal,
  } = useModalManagement();

  const [isRestaurantManagementOpen, setIsRestaurantManagementOpen] = useState(false);

  const {
    calculateExpiringProducts,
    getGroupedExpiringProducts,
  } = useExpiringProducts(products);

  // Hook de Scroll (Objetivo 2)
  const { scrollToProductId } = useProductScroll(selectedProduct);

  // Hook de Formulario (Objetivo 1)
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
  usePreventScroll(isExpiringModalOpen && !isClosingExpiringModal);

  // Funciones de utilidad
  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setIsAuthenticated(false);
    setUser(null);
    navigate("/login");
  };

  // Manejadores de eventos
  const handleProductClick = useCallback((product) => {
    setSelectedProduct((current) => {
      // Si es el mismo, lo deseleccionamos (null), si no, seleccionamos el nuevo
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

  const navigateToProduct = useCallback(
    (product) => {
      setIsExpiringModalOpen(false);
      // Pequeño delay para permitir que el modal se cierre visualmente antes de cambiar el estado
      // (aunque el scroll ya no depende de timeouts arbitrarios para encontrar el elemento)
      setTimeout(() => {
        setSelectedProduct(product);
        setSearchTerm(product.producto.nombre);
      }, 300);
    },
    [setIsExpiringModalOpen]
  );

  // Efectos
  useEffect(() => {
    loadAllProducts();
  }, [loadAllProducts]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const apiUrl = import.meta.env.PROD ? "/api/auth/me" : "http://localhost:5000/api/auth/me";
        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Error al cargar usuario:", error);
      }
    };

    loadUser();
  }, [setUser]);

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
      
      // Si el servidor envía los datos del producto (desclasificación),
      // añadirlo de nuevo a la lista de sin clasificar
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

  // Efecto para eventos locales (independiente del socket)
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

  const groupedProducts = getGroupedExpiringProducts();
  const hasExpiredProducts = groupedProducts.expired.products.length > 0;

  return (
    <LoadingErrorContainer
      loading={loading}
      error={error}
      onRetry={loadAllProducts}
    >
      <div className="max-w-md mx-auto p-4 bg-[#f8f8f8]">
        <ToastContainer
          toasts={toasts}
          removeToast={removeToast}
          onUndo={handleUndoDelete}
        />

        <HeaderSection
          user={authUser}
          expiringCount={calculateExpiringProducts()}
          hasExpiredProducts={hasExpiredProducts}
          onLogout={handleLogout}
          onUserManagementClick={() => setIsUserManagementOpen(true)}
          onCatalogManagementClick={() => setShowCatalogManagement(true)}
          onExpiringClick={() => setIsExpiringModalOpen(true)}
          onRestaurantManagementClick={() => setIsRestaurantManagementOpen(true)}
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
            title="Productos Pendientes"
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
                  products={products["sin-clasificar"]}
                  selectedProduct={selectedProduct}
                  isExpiringSoon={isExpiringSoon}
                  lastUpdatedProductId={lastUpdatedProductId}
                  onProductClick={(p) => {
                    handleProductClick(p);
                    prepareFormForUpdate(p); // Usar la nueva función del hook
                  }}
                  onUpdateClick={prepareFormForUpdate} // Usar la nueva función del hook
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
          onUpdateClick={prepareFormForUpdate} // Usar la nueva función del hook
          onDeleteClick={handleDeleteClick}
          searchTerm={searchTerm}
          viewMode={viewMode}
        />

        {/* Modales */}
        <UpdateModal
          isOpen={isUpdateModalOpen}
          isClosing={isClosingUpdateModal}
          editingProduct={editingProduct}
          updateForm={updateForm}
          setUpdateForm={setUpdateForm}
          isUpdating={isUpdating}
          onClose={handleCloseUpdateModal}
          onSubmit={submitUpdate} // Usar la nueva función del hook
        />

        <ExpiringModal
          isOpen={isExpiringModalOpen}
          isClosing={isClosingExpiringModal}
          groupedProducts={groupedProducts}
          onClose={handleCloseExpiringModal}
          onProductClick={navigateToProduct}
        />

        <UserManagement
          isOpen={isUserManagementOpen}
          onClose={() => setIsUserManagementOpen(false)}
          currentUser={authUser}
        />

        <CatalogManagement
          isOpen={showCatalogManagement}
          onClose={() => setShowCatalogManagement(false)}
        />

        <RestaurantManagement
          isOpen={isRestaurantManagementOpen}
          onClose={() => setIsRestaurantManagementOpen(false)}
        />
      </div>
    </LoadingErrorContainer>
  );
};
export default ProductList;

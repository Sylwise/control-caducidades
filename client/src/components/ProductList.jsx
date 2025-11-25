import { useState, useEffect, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../contexts/AuthContext";
import ToastContainer from "./ToastContainer";
import UserManagement from "./UserManagement";
import CatalogManagement from "./CatalogManagement";
import { useSocket } from "../hooks/useSocket";
import usePreventScroll from "../hooks/usePreventScroll";
import useToasts from "../hooks/useToasts";
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
  const [editingProduct, setEditingProduct] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    fechaFrente: "",
    fechaAlmacen: "",
    fechaAlmacen2: "",
    fechaAlmacen3: "",
    cajaUnica: false,
    hayUnicaCajaActual: false,
    showSecondDate: false,
    showThirdDate: false,
    noHayEnAlmacen: false,
  });

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

  const {
    calculateExpiringProducts,
    getGroupedExpiringProducts,
  } = useExpiringProducts(products);

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
      const newSelected =
        current?.producto?._id === product.producto?._id ? null : product;

      if (newSelected) {
        setTimeout(() => {
          const productElement = document.querySelector(
            `[data-product-id="${product.producto?._id}"]`
          );
          if (productElement) {
            productElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "nearest",
            });
          }
        }, 100);
      }

      return newSelected;
    });
  }, []);

  const handleUpdateClick = useCallback(
    (product, e) => {
      e?.stopPropagation();
      setEditingProduct(product);

      // Extraer fechas adicionales si existen
      const fechas = product.fechasAlmacen || [];
      const [primeraFecha, segundaFecha, terceraFecha] = fechas;

      setUpdateForm({
        fechaFrente: product.fechaFrente
          ? new Date(product.fechaFrente).toISOString().split("T")[0]
          : "",
        fechaAlmacen:
          product.estado === "frente-agota"
            ? ""
            : primeraFecha
            ? new Date(primeraFecha).toISOString().split("T")[0]
            : product.fechaAlmacen
            ? new Date(product.fechaAlmacen).toISOString().split("T")[0]
            : "",
        fechaAlmacen2: segundaFecha
          ? new Date(segundaFecha).toISOString().split("T")[0]
          : "",
        fechaAlmacen3: terceraFecha
          ? new Date(terceraFecha).toISOString().split("T")[0]
          : "",
        cajaUnica: product.cajaUnica || false,
        hayUnicaCajaActual: product.hayUnicaCajaActual || false,
        showSecondDate: Boolean(segundaFecha),
        showThirdDate: Boolean(terceraFecha),
        noHayEnAlmacen: product.estado === "frente-agota",
      });

      setIsUpdateModalOpen(true);
    },
    [setIsUpdateModalOpen]
  );

  const handleSubmitUpdate = async () => {
    try {
      setIsUpdating(true);

      if (!editingProduct) {
        addToast("No hay producto seleccionado.", "error");
        return;
      }

      if (!updateForm.fechaFrente) {
        addToast("La fecha de frente es obligatoria.", "error");
        return;
      }

      // Preparar array de fechas de almacén
      const fechasAlmacen = [];
      if (!updateForm.noHayEnAlmacen) {
        if (updateForm.fechaAlmacen) {
          fechasAlmacen.push(updateForm.fechaAlmacen);
        }
        if (updateForm.showSecondDate && updateForm.fechaAlmacen2) {
          fechasAlmacen.push(updateForm.fechaAlmacen2);
        }
        if (updateForm.showThirdDate && updateForm.fechaAlmacen3) {
          fechasAlmacen.push(updateForm.fechaAlmacen3);
        }
      }

      const updateData = {
        fechaFrente: updateForm.fechaFrente,
        fechaAlmacen: updateForm.noHayEnAlmacen
          ? null
          : updateForm.fechaAlmacen || null,
        fechasAlmacen: updateForm.noHayEnAlmacen ? [] : fechasAlmacen,
        cajaUnica: Boolean(updateForm.cajaUnica),
        hayUnicaCajaActual: Boolean(updateForm.hayUnicaCajaActual),
        estado: updateForm.noHayEnAlmacen ? "frente-agota" : "frente-cambia",
      };

      const success = await handleUpdateProduct(
        editingProduct.producto._id,
        updateData
      );

      if (success) {
        setIsUpdateModalOpen(false);
        setShowUnclassified(false);
        setEditingProduct(null);
        setSelectedProduct(null);
        setSearchTerm("");

        setTimeout(() => {
          const productElement = document.querySelector(
            `[data-product-id="${editingProduct.producto._id}"]`
          );
          if (productElement) {
            productElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }, 100);
      }
    } catch (error) {
      addToast(`Error al actualizar: ${error.message}.`, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = async (product, e) => {
    e.stopPropagation();
    const success = await handleDeleteProduct(product.producto?._id);
    if (success) {
      setSelectedProduct(null);
      setSearchTerm("");
    }
  };

  const navigateToProduct = useCallback(
    (product) => {
      setIsExpiringModalOpen(false);
      setTimeout(() => {
        setSelectedProduct(product);
        setSearchTerm(product.producto.nombre);

        setTimeout(() => {
          const productElement = document.querySelector(
            `[data-product-id="${product.producto._id}"]`
          );
          if (productElement) {
            productElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }, 100);
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

        const response = await fetch("http://localhost:5000/api/auth/me", {
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
    }
  }, [updateProductInState, removeProductFromState]);

  // Efecto para eventos locales (independiente del socket)
  useEffect(() => {
    const handleLocalCatalogUpdate = (event) => {
      handleCatalogUpdate(event.detail);
    };
    window.addEventListener("localCatalogUpdate", handleLocalCatalogUpdate);

    return () => {
      window.removeEventListener("localCatalogUpdate", handleLocalCatalogUpdate);
    };
  }, [handleCatalogUpdate]);

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
        />

        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          unclassifiedCount={products["sin-clasificar"].length}
          onUnclassifiedClick={() => setShowUnclassified(!showUnclassified)}
        />

        {/* Lista de productos sin clasificar */}
        {showUnclassified && (
          <ModalContainer
            isOpen={showUnclassified}
            isClosing={isClosingUnclassified}
            onClose={handleCloseUnclassified}
            title={`Productos Sin Clasificar (${products["sin-clasificar"].length})`}
          >
            <div className="flex-1 overflow-y-auto overscroll-contain p-4">
              <CategorySection
                category="sin-clasificar"
                products={products["sin-clasificar"]}
                selectedProduct={selectedProduct}
                isExpiringSoon={isExpiringSoon}
                lastUpdatedProductId={lastUpdatedProductId}
                onProductClick={(p) => {
                  handleProductClick(p);
                  handleUpdateClick(p);
                }}
                onUpdateClick={handleUpdateClick}
                onDeleteClick={handleDeleteClick}
              />
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
          onUpdateClick={handleUpdateClick}
          onDeleteClick={handleDeleteClick}
          searchTerm={searchTerm}
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
          onSubmit={handleSubmitUpdate}
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
      </div>
    </LoadingErrorContainer>
  );
};
export default ProductList;

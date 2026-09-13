import { useState, useEffect, useContext } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import AuthContext from "../contexts/AuthContext";
import Navbar from "./layout/Navbar";
import MobileNavigation from "./MobileNavigation";
import UserManagement from "./UserManagement";
import CatalogManagement from "./CatalogManagement";
import RestaurantManagement from "./RestaurantManagement";
import ExpiringModal from "./ExpiringModal";
import { useModalManagement } from "../hooks/useModalManagement";
import { useProductManagement } from "../hooks/useProductManagement";
import { useExpiringProducts } from "../hooks/useExpiringProducts";
import { useToast } from "../contexts/ToastContext";

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setIsAuthenticated, setUser } = useContext(AuthContext);
  const { addToast } = useToast();

  // Determine active module based on current path
  const activeModule = location.pathname.includes("training")
    ? "training"
    : location.pathname.includes("tasks")
    ? "tasks"
    : "inventory";

  // Modal Management
  const {
    isExpiringModalOpen,
    isUserManagementOpen,
    showCatalogManagement,
    isClosingExpiringModal,
    setIsExpiringModalOpen,
    setIsUserManagementOpen,
    setShowCatalogManagement,
    handleCloseExpiringModal,
  } = useModalManagement();

  const [isRestaurantManagementOpen, setIsRestaurantManagementOpen] = useState(false);
  const [isCreateEmployeeModalOpen, setIsCreateEmployeeModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Product Management (for Header Stats and Expiring Modal)
  const { products, loadAllProducts } = useProductManagement((message, type) =>
    addToast(message, type)
  );
  
  const { calculateExpiringProducts, getGroupedExpiringProducts } =
    useExpiringProducts(products);

  // Load products on mount to populate header stats
  useEffect(() => {
    loadAllProducts();
  }, [loadAllProducts]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setIsAuthenticated(false);
    setUser(null);
    navigate("/login");
  };

  const handleModuleChange = (module) => {
    if (module === "training") {
      navigate("/training", { replace: true });
    } else if (module === "tasks") {
      navigate("/tasks", { replace: true });
    } else {
      navigate("/inventory", { replace: true });
    }
  };

  const navigateToProduct = (product) => {
    setIsExpiringModalOpen(false);
    navigate("/inventory", { state: { productId: product.producto._id } });
  };

  const groupedProducts = getGroupedExpiringProducts();
  const hasExpiredProducts = groupedProducts.expired.products.length > 0 || groupedProducts.critical.products.length > 0;

  return (
    <div className="min-h-screen bg-[#f8f8f8]">

      {/* Top Navbar (Universal) */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        activeModule={activeModule}
        onModuleChange={handleModuleChange}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onRestaurantManagementClick={() => setIsRestaurantManagementOpen(true)}
        onCatalogManagementClick={() => setShowCatalogManagement(true)}
        onUserManagementClick={() => setIsUserManagementOpen(true)}
        expiringCount={calculateExpiringProducts()}
        hasExpiredProducts={hasExpiredProducts}
        onExpiringClick={() => setIsExpiringModalOpen(true)}
      />

      <div className="max-w-7xl mx-auto min-h-[calc(100vh-64px)] shadow-sm bg-white">
        <main>
          <Outlet context={{
            loadAllProducts,
            isCreateEmployeeModalOpen,
            setIsCreateEmployeeModalOpen,
            // Estado de modales globales para ocultar FAB
            isUserManagementOpen,
            showCatalogManagement,
            isRestaurantManagementOpen,
            isExpiringModalOpen,
            user,
            expiringCount: calculateExpiringProducts(),
            hasExpiredProducts,
            onExpiringClick: () => setIsExpiringModalOpen(true)
          }} />
        </main>
      </div>

      {/* Mobile Navigation Drawer */}
      <MobileNavigation
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeModule={activeModule}
        onModuleChange={handleModuleChange}
        user={user}
        onLogout={handleLogout}
        onUserManagementClick={() => setIsUserManagementOpen(true)}
        onCatalogManagementClick={() => setShowCatalogManagement(true)}
        onRestaurantManagementClick={() => setIsRestaurantManagementOpen(true)}
      />

      {/* Global Modals */}
      <UserManagement
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
        currentUser={user}
      />

      <CatalogManagement
        isOpen={showCatalogManagement}
        onClose={() => setShowCatalogManagement(false)}
      />

      <RestaurantManagement
        isOpen={isRestaurantManagementOpen}
        onClose={() => setIsRestaurantManagementOpen(false)}
      />

      <ExpiringModal
        isOpen={isExpiringModalOpen}
        isClosing={isClosingExpiringModal}
        groupedProducts={groupedProducts}
        onClose={handleCloseExpiringModal}
        onProductClick={navigateToProduct}
      />
    </div>
  );
};

export default MainLayout;

import { useState, useEffect, useContext } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import AuthContext from "../contexts/AuthContext";
import HeaderSection from "./HeaderSection";
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
      navigate("/training");
    } else {
      navigate("/inventory");
    }
  };

  const navigateToProduct = (product) => {
    setIsExpiringModalOpen(false);
    navigate("/inventory", { state: { productId: product.producto._id } });
  };

  const groupedProducts = getGroupedExpiringProducts();
  const hasExpiredProducts = groupedProducts.expired.products.length > 0;

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <div className="max-w-7xl mx-auto bg-white min-h-screen shadow-sm">
        <div className="p-4">
          
          <HeaderSection
            user={user}
            expiringCount={calculateExpiringProducts()}
            hasExpiredProducts={hasExpiredProducts}
            onLogout={handleLogout}
            onUserManagementClick={() => setIsUserManagementOpen(true)}
            onCatalogManagementClick={() => setShowCatalogManagement(true)}
            onExpiringClick={() => setIsExpiringModalOpen(true)}
            onRestaurantManagementClick={() => setIsRestaurantManagementOpen(true)}
            activeModule={activeModule}
            onModuleChange={handleModuleChange}
            showAddEmployeeButton={false}
            onAddEmployeeClick={() => {
              if (location.pathname !== '/training') {
                navigate('/training');
              }
              setIsCreateEmployeeModalOpen(true);
            }}
          />

          <main>
            <Outlet context={{ 
              products, 
              loadAllProducts,
              isCreateEmployeeModalOpen,
              setIsCreateEmployeeModalOpen 
            }} />
          </main>
        </div>
      </div>

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

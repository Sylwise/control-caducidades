import { LogOut, Users, Package, CloudOff, Store } from "lucide-react";
import PropTypes from "prop-types";
import { useSyncContext } from "../hooks/useSyncContext";

const HeaderSection = ({
  user,
  expiringCount,
  hasExpiredProducts,
  onLogout,
  onUserManagementClick,
  onCatalogManagementClick,
  onExpiringClick,
  onRestaurantManagementClick,
}) => {
  const { pendingChanges } = useSyncContext();

  return (
    <div className="flex flex-col items-center justify-center gap-1 mb-8">
      {/* Información del usuario y botones */}
      <div className="flex items-center gap-3 text-sm text-gray-500 font-medium mb-3">
        <div className="flex items-center gap-2">
          <span className="select-none">
            {user?.username} ·{" "}
            {user?.role === "admin"
              ? "Administrador"
              : user?.role === "supervisor"
              ? "Supervisor"
              : user?.role === "encargado"
              ? "Encargado"
              : "Gerente"}
          </span>
          <div className="flex items-center gap-2">
            {pendingChanges > 0 && (
              <div className="flex items-center gap-1 text-gray-600">
                <CloudOff size={20} />
                <span>{pendingChanges}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(user?.role === "supervisor" || user?.role === "admin") && (
            <>
              {user?.role === "admin" && (
                <button
                  onClick={onRestaurantManagementClick}
                  className="p-2 text-gray-400 hover:text-[#1d5030]
                    hover:bg-[#1d5030]/10 rounded-md transition-colors"
                  title="Gestionar Restaurantes"
                >
                  <Store className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onCatalogManagementClick}
                className="p-2 text-gray-400 hover:text-[#1d5030]
                  hover:bg-[#1d5030]/10 rounded-md transition-colors"
                title="Gestionar Catálogo"
              >
                <Package className="w-5 h-5" />
              </button>
              <button
                onClick={onUserManagementClick}
                className="p-2 text-gray-400 hover:text-[#1d5030]
                  hover:bg-[#1d5030]/10 rounded-md transition-colors"
                title="Gestionar Usuarios"
              >
                <Users className="w-5 h-5" />
              </button>
            </>
          )}
          <button
            onClick={onLogout}
            className="p-2 text-gray-400 hover:text-red-600
              hover:bg-red-50 rounded-md transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-[#1d5030] font-['Noto Sans'] tracking-tight select-none">
          Lista de Caducidades
        </h1>
        {expiringCount > 0 && (
          <button
            onClick={onExpiringClick}
            className={`
              relative inline-flex items-center justify-center
              min-w-[24px] h-[24px]
              ${
                hasExpiredProducts
                  ? "bg-red-600 text-white"
                  : "bg-[#ffb81c] text-[#1a1a1a]"
              }
              rounded-full px-2
              font-['Noto Sans'] font-bold text-sm
              shadow-sm select-none
              transition-all duration-200
              hover:opacity-90 hover:shadow
              active:scale-95
              ${hasExpiredProducts ? "animate-pulse" : ""}
            `}
            aria-label="Ver productos próximos a caducar"
          >
            {expiringCount}
          </button>
        )}
      </div>
    </div>
  );
};

HeaderSection.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string,
    role: PropTypes.oneOf(["admin", "supervisor", "encargado", "gerente"]),
  }),
  expiringCount: PropTypes.number.isRequired,
  hasExpiredProducts: PropTypes.bool.isRequired,
  onLogout: PropTypes.func.isRequired,
  onUserManagementClick: PropTypes.func.isRequired,
  onCatalogManagementClick: PropTypes.func.isRequired,
  onExpiringClick: PropTypes.func.isRequired,
  onRestaurantManagementClick: PropTypes.func,
};

export default HeaderSection;

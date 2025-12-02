import { LogOut, Users, Package, CloudOff, Store, GraduationCap, Plus } from "lucide-react";
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
  activeModule,
  onModuleChange,
  onAddEmployeeClick,
  showAddEmployeeButton,
}) => {
  const { pendingChanges } = useSyncContext();

  return (
    <div className="flex flex-col items-center justify-center gap-1 mb-4">
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

      {/* Module Switcher - Segmented Control */}
      <div className="bg-gray-100 p-1 rounded-lg flex items-center justify-center w-full max-w-md mb-6">
        <button
          onClick={() => onModuleChange('inventory')}
          className={`
            flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200
            ${activeModule === 'inventory'
              ? 'bg-white text-[#1d5030] shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
            }
          `}
        >
          <Package className="w-4 h-4" />
          Caducidades
        </button>

        {['admin', 'supervisor', 'encargado'].includes(user?.role) && (
          <button
            onClick={() => onModuleChange('training')}
            className={`
              flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200
              ${activeModule === 'training'
                ? 'bg-white text-[#1d5030] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            <GraduationCap className="w-4 h-4" />
            Formación
          </button>
        )}
      </div>

      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#1d5030] font-['Noto Sans'] tracking-tight select-none text-center">
            {activeModule === 'inventory' ? 'Lista de Caducidades' : 'Formación'}
          </h1>
          {activeModule === 'inventory' && expiringCount > 0 && (
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
        {/* Add Employee button moved to TrainingDashboard */}
        {user?.restaurante?.nombre && (
          <span className="text-sm font-medium text-gray-500 select-none">
            {user.restaurante.nombre}
          </span>
        )}
      </div>
    </div>
  );
};

HeaderSection.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string,
    role: PropTypes.oneOf(["admin", "supervisor", "encargado", "gerente"]),
    restaurante: PropTypes.shape({
      nombre: PropTypes.string,
    }),
  }),
  expiringCount: PropTypes.number.isRequired,
  hasExpiredProducts: PropTypes.bool.isRequired,
  onLogout: PropTypes.func.isRequired,
  onUserManagementClick: PropTypes.func.isRequired,
  onCatalogManagementClick: PropTypes.func.isRequired,
  onExpiringClick: PropTypes.func.isRequired,
  onRestaurantManagementClick: PropTypes.func,
  activeModule: PropTypes.string,
  onModuleChange: PropTypes.func,
  onAddEmployeeClick: PropTypes.func,
  showAddEmployeeButton: PropTypes.bool,
};

export default HeaderSection;

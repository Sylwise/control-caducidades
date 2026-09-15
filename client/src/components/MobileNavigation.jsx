
import { Package, GraduationCap, LogOut, ClipboardList, Store, Users } from "lucide-react";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import FeatureManager from "../config/features";

const MobileNavigation = ({ 
  isOpen, 
  onClose, 
  activeModule, 
  onModuleChange,
  user,
  onLogout,
  onUserManagementClick,
  onCatalogManagementClick,
  onRestaurantManagementClick
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const isTrainingEnabled = FeatureManager.isEnabled("TRAINING_MODULE");

  // Handle animation logic
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
      // Small delay to allow mount before animating in
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
        document.body.style.overflow = "";
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden font-['Noto Sans']">
      {/* Backdrop */}
      <div 
        className={`
          absolute inset-0 bg-black/50 transition-opacity duration-300
          ${isOpen ? "opacity-100" : "opacity-0"}
        `}
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        className={`
          absolute top-0 right-0 bottom-0 w-[280px] bg-white shadow-2xl 
          transform transition-transform duration-300 ease-out flex flex-col
          ${isAnimating ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#1d5030] text-white">
          <div>
             <h2 className="text-xl font-bold">Menú</h2>
             <p className="text-xs text-white/80 mt-1">
               {user?.username || "Usuario"}
             </p>
          </div>
          {/* Close button controlled by external header button */}
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <button
            onClick={() => { onModuleChange('inventory'); onClose(); }}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all
              ${activeModule === 'inventory' 
                ? 'bg-[#1d5030]/10 text-[#1d5030]' 
                : 'text-gray-600 hover:bg-gray-50'
              }
            `}
          >
            <Package className="w-5 h-5" />
            Caducidades
          </button>

          <button
            onClick={() => { onModuleChange('tasks'); onClose(); }}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all
              ${activeModule === 'tasks' 
                ? 'bg-[#1d5030]/10 text-[#1d5030]' 
                : 'text-gray-600 hover:bg-gray-50'
              }
            `}
          >
            <ClipboardList className="w-5 h-5" />
            Tareas
          </button>

          {isTrainingEnabled && ['admin', 'supervisor', 'encargado'].includes(user?.role) && (
             <button
              onClick={() => { onModuleChange('training'); onClose(); }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all
                ${activeModule === 'training' 
                  ? 'bg-[#1d5030]/10 text-[#1d5030]' 
                  : 'text-gray-600 hover:bg-gray-50'
                }
              `}
            >
              <GraduationCap className="w-5 h-5" />
              Formación
            </button>
          )}

          {/* Administration Section */}
          {(user?.role === "supervisor" || user?.role === "admin") && (
            <div className="pt-4 mt-2 border-t border-gray-100">
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Administración
              </p>
              
              {user?.role === "admin" && (
                <button
                  onClick={() => { onRestaurantManagementClick(); onClose(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl text-left font-medium transition-all"
                >
                  <Store className="w-5 h-5 text-gray-400" />
                  Restaurantes
                </button>
              )}

              <button
                onClick={() => { onCatalogManagementClick(); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl text-left font-medium transition-all"
              >
                <Package className="w-5 h-5 text-gray-400" />
                Catálogo
              </button>

              <button
                onClick={() => { onUserManagementClick(); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl text-left font-medium transition-all"
              >
                <Users className="w-5 h-5 text-gray-400" />
                Usuarios
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
           <button
             onClick={() => { onLogout(); onClose(); }}
             className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
           >
             <LogOut className="w-5 h-5" />
             Cerrar Sesión
           </button>
           
           <div className="text-center mt-4 text-xs text-gray-400">
             v1.2.0 • Control de Caducidades
           </div>
        </div>
      </div>
    </div>
  );
};

MobileNavigation.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  activeModule: PropTypes.string.isRequired,
  onModuleChange: PropTypes.func.isRequired,
  user: PropTypes.object,
  onLogout: PropTypes.func.isRequired,
  onUserManagementClick: PropTypes.func,
  onCatalogManagementClick: PropTypes.func,
  onRestaurantManagementClick: PropTypes.func
};

export default MobileNavigation;

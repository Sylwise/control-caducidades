import { Package, ClipboardList, GraduationCap, Menu, X, LogOut, CloudOff, Store, Users, LayoutDashboard } from "lucide-react";

import { useSyncContext } from "../../hooks/useSyncContext";

const Navbar = ({
  user,
  onLogout,
  activeModule,
  onModuleChange,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  onRestaurantManagementClick,
  onCatalogManagementClick,
  onUserManagementClick,
  expiringCount = 0,
  hasExpiredProducts = false,
  onExpiringClick,
}) => {
  const { pendingChanges } = useSyncContext();

  return (
    <nav className="bg-white border-b border-gray-200 relative md:sticky top-0 z-50 h-16 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        
        {/* Left: Brand & Desktop Nav */}
        <div className="flex items-center gap-8">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-8 h-8 text-[#1d5030]" strokeWidth={1.5} />
            <span className="text-lg font-bold text-[#1d5030] tracking-tight hidden sm:block">
              Gestión Operativa
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <NavButton 
              label="Caducidades" 
              icon={Package} 
              isActive={activeModule === 'inventory'} 
              onClick={() => onModuleChange('inventory')} 
            />
            <NavButton 
              label="Tareas" 
              icon={ClipboardList} 
              isActive={activeModule === 'tasks'} 
              onClick={() => onModuleChange('tasks')} 
            />
            {['admin', 'supervisor', 'encargado'].includes(user?.role) && (
              <NavButton 
                label="Formación" 
                icon={GraduationCap} 
                isActive={activeModule === 'training'} 
                onClick={() => onModuleChange('training')} 
              />
            )}
          </div>
        </div>

        {/* Right: User Actions */}
        <div className="flex items-center gap-3">

          {/* Aviso de productos por caducar */}
          {expiringCount > 0 && (
            <button
              onClick={onExpiringClick}
              className={`
                relative inline-flex items-center justify-center
                min-w-[24px] h-[24px] mr-1
                ${hasExpiredProducts
                  ? "bg-red-600 text-white"
                  : "bg-[#ffb81c] text-[#1a1a1a]"
                }
                rounded-full px-2
                font-bold text-sm
                shadow-sm select-none
                transition-all duration-200
                hover:opacity-90 hover:shadow
                active:scale-95
                ${hasExpiredProducts ? "animate-pulse" : ""}
              `}
              title="Productos próximos a caducar"
              aria-label="Ver productos próximos a caducar"
            >
              {expiringCount}
            </button>
          )}

          {/* Pending Changes Indicator */}
          {pendingChanges > 0 && (
            <div className="flex items-center gap-1 text-gray-600 bg-gray-50 px-2 py-1 rounded-md mr-2" title={`${pendingChanges} cambios pendientes`}>
              <CloudOff size={18} />
              <span className="text-xs font-semibold">{pendingChanges}</span>
            </div>
          )}

          {/* Desktop Admin Actions */}
          <div className="hidden md:flex items-center gap-1 mr-2 border-r border-gray-200 pr-2">
             {(user?.role === "supervisor" || user?.role === "admin") && (
              <>
                {user?.role === "admin" && (
                  <IconButton 
                    icon={Store} 
                    onClick={onRestaurantManagementClick} 
                    title="Gestionar Restaurantes" 
                  />
                )}
                <IconButton 
                  icon={Package} 
                  onClick={onCatalogManagementClick} 
                  title="Gestionar Catálogo" 
                />
                <IconButton 
                  icon={Users} 
                  onClick={onUserManagementClick} 
                  title="Gestionar Usuarios" 
                />
              </>
            )}
          </div>

          {/* User Profile (Desktop) */}
          <div className="hidden sm:flex items-center gap-3 text-sm mr-2">
            <div className="text-right hidden lg:block">
              <div className="font-medium text-gray-900">{user?.username}</div>
              <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-lg md:hidden"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Desktop Actions (Logout) */}
          <button 
            onClick={onLogout}
            className="hidden md:flex p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};

const NavButton = ({ label, icon: Icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
      ${isActive 
        ? 'bg-[#1d5030]/10 text-[#1d5030]' 
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
      }
    `}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

const IconButton = ({ icon: Icon, onClick, title }) => (
  <button
    onClick={onClick}
    className="p-2 text-gray-500 hover:text-[#1d5030] hover:bg-[#1d5030]/10 rounded-lg transition-colors"
    title={title}
  >
    <Icon className="w-5 h-5" />
  </button>
);

export default Navbar;

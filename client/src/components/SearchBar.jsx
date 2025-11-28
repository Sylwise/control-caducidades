import { Search, X, LayoutGrid, List } from "lucide-react";
import PropTypes from "prop-types";

function SearchBar({
  searchTerm,
  onSearchChange,
  unclassifiedCount,
  onUnclassifiedClick,
  viewMode = 'card',
  onViewModeChange,
}) {
  return (
    <div className="flex gap-2 mb-6">
      {/* Buscador más compacto */}
      <div className="flex-1 relative search-container">
        <input
          type="text"
          placeholder="Buscar producto..."
          value={searchTerm}
          onChange={(e) => {
            const value = e.target.value;
            // Permitir letras, números y espacios, máximo 20 caracteres
            if (
              /^[a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ\s]*$/.test(value) &&
              value.length <= 20
            ) {
              onSearchChange(value);
            }
          }}
          className="w-full h-11 pl-10 pr-10 rounded-lg border-0 
            focus:outline-none focus:ring-2 focus:ring-[#1d5030]/50 focus:border-transparent
            font-['Noto Sans'] text-sm font-medium placeholder:text-gray-400
            bg-white shadow-sm"
          maxLength={20}
        />
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1d5030] w-5 h-5" />
        {searchTerm && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1
              text-gray-400 hover:text-gray-600
              rounded-full hover:bg-gray-100
              transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Botón para productos sin clasificar */}
      <button
        onClick={onUnclassifiedClick}
        className={`
          h-11 px-4 rounded-lg
          font-['Noto Sans'] text-sm font-medium select-none
          transition-colors duration-200
          flex items-center gap-2
          bg-white text-[#1d5030] hover:bg-[#1d5030]/10
          shadow-sm
        `}
      >
        Sin Clasificar
        <span className="bg-[#f44336] text-white px-2.5 py-1 rounded-full text-xs font-bold select-none animate-pulse">
          {unclassifiedCount}
        </span>
      </button>

      {/* Selector de Vista */}
      <div className="flex bg-white rounded-lg shadow-sm border border-gray-100 p-1 h-11">
        <button
          onClick={() => onViewModeChange('card')}
          className={`
            p-2 rounded-md transition-all duration-200
            ${viewMode === 'card' 
              ? 'bg-[#1d5030]/10 text-[#1d5030]' 
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}
          `}
          title="Vista Tarjeta"
        >
          <LayoutGrid className="w-5 h-5" />
        </button>
        <button
          onClick={() => onViewModeChange('compact')}
          className={`
            p-2 rounded-md transition-all duration-200
            ${viewMode === 'compact' 
              ? 'bg-[#1d5030]/10 text-[#1d5030]' 
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}
          `}
          title="Vista Compacta"
        >
          <List className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

SearchBar.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  unclassifiedCount: PropTypes.number.isRequired,
  onUnclassifiedClick: PropTypes.func.isRequired,
  viewMode: PropTypes.string,
  onViewModeChange: PropTypes.func,
};

export default SearchBar;

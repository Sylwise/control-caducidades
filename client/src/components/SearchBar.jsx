import { Search, X, LayoutGrid, List, Mic } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import useVoiceInput from "../hooks/useVoiceInput";
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
    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
      {/* Buscador + Micrófono */}
      <div className="flex w-full md:flex-1 gap-2">
      <div className="relative flex-1">
        <input
          type="search"
          name="search_query_nocache_123"
          id="input_busqueda_random"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          data-1p-ignore
          placeholder="Buscar producto..."
          value={searchTerm}
          onChange={(e) => {
            const value = e.target.value;
            if (value.length <= 20) {
              onSearchChange(value);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.target.blur();
            }
          }}
          enterKeyHint="search"
          className="w-full h-12 pl-10 pr-12 rounded-lg border border-gray-300 
            focus:outline-none focus:ring-2 focus:ring-[#1d5030]/50 focus:border-transparent
            font-['Noto Sans'] text-sm font-medium placeholder:text-gray-400
            bg-white shadow-sm [&::-webkit-search-cancel-button]:appearance-none"
          maxLength={20}
        />
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1d5030] w-5 h-5" />
        {searchTerm && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-0 top-0 h-full w-12 flex items-center justify-center
              text-gray-400 hover:text-gray-600
              hover:bg-gray-100/50 rounded-r-lg
              transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      </div>

      {/* Acciones */}
      <div className="flex w-full md:w-auto gap-3">
        {/* Botón para productos sin clasificar */}
        <button
          onClick={onUnclassifiedClick}
          className={`
            flex-1 md:flex-none
            h-12 px-4 rounded-lg
            font-['Noto Sans'] text-sm font-medium select-none
            transition-colors duration-200
            flex items-center justify-center gap-2
            bg-white text-[#1d5030] hover:bg-[#1d5030]/10
            shadow-sm border border-gray-300
          `}
        >
          Sin Clasificar
          <span className="bg-[#f44336] text-white px-2.5 py-1 rounded-full text-xs font-bold select-none animate-pulse">
            {unclassifiedCount}
          </span>
        </button>

        {/* Botón de Micrófono (Mobile FAB) */}
        <div className="md:hidden">
            <MicButton onSpeechResult={onSearchChange} variant="fab" />
        </div>

        {/* Selector de Vista */}
        <div className="flex bg-white rounded-lg shadow-sm border border-gray-300 p-1 h-12">
          <button
            onClick={() => onViewModeChange('card')}
            className={`
              h-full px-3 rounded-md transition-all duration-200 flex items-center justify-center
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
              h-full px-3 rounded-md transition-all duration-200 flex items-center justify-center
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

function MicButton({ onSpeechResult, variant = 'inline' }) {
  const { isListening, transcript, error, startListening, stopListening } = useVoiceInput();

  useEffect(() => {
    if (transcript) {
      onSpeechResult(transcript);
    }
  }, [transcript, onSpeechResult]);

  const handleStart = (e) => {
      e.preventDefault();
      startListening();
  };

  const handleStop = (e) => {
      e.preventDefault();
      stopListening();
  };

  const buttonContent = (
    <button
      type="button"
      onTouchStart={handleStart}
      onTouchEnd={handleStop}
      onMouseDown={handleStart}
      onMouseUp={handleStop}
      className={`
        flex items-center justify-center transition-all duration-200
        ${variant === 'fab' 
           ? 'fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-[90] active:scale-95 md:hidden' 
           : 'flex-none w-12 h-12 rounded-lg border shadow-sm'
        }
        ${isListening 
          ? 'bg-red-500 border-red-600 text-white animate-pulse shadow-red-500/50' 
          : variant === 'fab'
             ? 'bg-[#1d5030] text-white shadow-[#1d5030]/30 hover:bg-[#153e24]'
             : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
        }
      `}
      title="Mantener para hablar"
    >
      <Mic className={`${variant === 'fab' ? 'w-6 h-6' : 'w-5 h-5'} ${isListening ? 'animate-bounce' : ''}`} />
    </button>
  );

  // Para el FAB usamos Portal para asegurar que flota sobre todo (como modales o listas largas con overflow)
  if (variant === 'fab') {
      return createPortal(buttonContent, document.body);
  }

  return buttonContent;
}


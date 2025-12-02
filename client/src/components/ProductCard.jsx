import { memo, useMemo } from "react";
import { Box, Clock, Edit3, Trash2, Package, Hourglass } from "lucide-react";
import PropTypes from "prop-types";

const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Fecha inválida";

    return date.getFullYear() !== new Date().getFullYear()
      ? `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}/${date.getFullYear()}`
      : `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}`;
  } catch {
    return "Fecha inválida";
  }
};

const ProductCard = memo(({
  product,
  isSelected,
  isExpiringSoon,
  lastUpdatedProductId,
  onProductClick,
  onUpdateClick,
  onDeleteClick,
  viewMode = 'card',
}) => {

  const isStale = useMemo(() => {
    if (!product.updatedAt) return false;
    const daysDiff = (new Date() - new Date(product.updatedAt)) / (1000 * 60 * 60 * 24);
    return daysDiff > 7;
  }, [product.updatedAt]);

  return (
    <div
      data-product-id={product.producto?._id}
      onClick={() => onProductClick(product)}
      className={`
        w-full text-left 
        rounded-lg
        ${isStale 
          ? "bg-orange-50/40 hover:bg-orange-50/60 border border-[#c17817]/30" 
          : "bg-white hover:bg-gray-50 border border-gray-300/50 hover:border-gray-300"
        }
        ${viewMode === 'compact' 
          ? 'p-3 sm:p-2 border-b border-gray-100' 
          : 'p-3 md:p-4 shadow hover:shadow-md'}
        transition-all duration-300
        ${isSelected ? "ring-1 ring-[#1d5030]/30 bg-[#1d5030]/5" : ""}
        ${
          lastUpdatedProductId === product.producto?._id
            ? "animate-highlight bg-[#1d5030]/5"
            : ""
        }
        active:scale-[0.995]
        product-card
        cursor-pointer
      `}
    >
      {viewMode === 'compact' ? (
        // VISTA COMPACTA
        <div className="flex flex-col sm:flex-row sm:items-center w-full gap-2 sm:gap-4">
          {/* FILA SUPERIOR (Móvil) / IZQUIERDA (Desktop): Indicador y Nombre */}
          <div className="flex items-center gap-3 w-full sm:flex-1 min-w-0">
            {/* Indicador de estado (punto) */}
            <div className={`
              w-2.5 h-2.5 rounded-full flex-shrink-0
              ${isExpiringSoon(product.fechaFrente) ? 'bg-[#ffb81c] animate-pulse' : 'bg-gray-300'}
            `} />

            {isStale && (
              <div 
                className="flex items-center justify-center p-1.5 bg-[#c17817]/10 rounded-full flex-shrink-0"
                title="Pendiente de revisar"
              >
                <Hourglass size={14} className="text-[#c17817]" />
              </div>
            )}

            {/* Nombre del producto */}
            <span className="font-['Noto Sans'] font-medium text-gray-700 text-sm sm:text-sm truncate block w-full">
              {product.producto?.nombre}
            </span>
          </div>

          {/* FILA INFERIOR (Móvil) / DERECHA (Desktop): Fechas y Acciones */}
          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2 sm:gap-6 pl-5 sm:pl-0">
            {/* Fechas Compactas */}
            <div className="flex flex-wrap items-center gap-2 text-xs flex-1 min-w-0">
              {product.fechaFrente && (
                <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                  <span className="text-[#1d5030] font-semibold">F:</span>
                  <span className="font-medium text-gray-600">{formatDate(product.fechaFrente)}</span>
                </div>
              )}
              {product.fechaAlmacen && (
                <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                  <span className="text-[#1d5030] font-semibold">A:</span>
                  <span className="font-medium text-gray-600">{formatDate(product.fechaAlmacen)}</span>
                  {product.cajasAlmacen > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-[#1d5030]/10 text-[#1d5030] rounded-full text-[10px] font-bold">
                      {product.cajasAlmacen}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Acciones Rápidas - Touch Friendly */}
            <div className="flex items-center gap-4 sm:gap-1 flex-shrink-0 ml-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateClick(product, e);
                }}
                className="
                  flex items-center justify-center
                  min-w-[36px] min-h-[36px] sm:min-w-[32px] sm:min-h-[32px]
                  text-gray-400 hover:text-[#1d5030] hover:bg-[#1d5030]/10 
                  rounded-full sm:rounded transition-colors
                "
                title="Editar"
              >
                <Edit3 className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
              {(product.estado !== "sin-clasificar" || product.fechaFrente || product.fechaAlmacen) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClick(product, e);
                  }}
                  className="
                    flex items-center justify-center
                    min-w-[36px] min-h-[36px] sm:min-w-[32px] sm:min-h-[32px]
                    text-gray-400 hover:text-red-500 hover:bg-red-50 
                    rounded-full sm:rounded transition-colors
                  "
                  title="Eliminar"
                >
                  <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        // VISTA TARJETA (Original)
        <>
          <div className="flex items-center gap-2">
            <span className="font-['Noto Sans'] font-semibold text-gray-700 text-base flex-1 select-none">
              {product.producto?.nombre}
            </span>
            {isStale && (
              <div 
                className="flex items-center justify-center p-1.5 bg-[#c17817]/10 rounded-full ml-2"
                title="Pendiente de revisar"
              >
                <Hourglass size={16} className="text-[#c17817]" />
              </div>
            )}
            {isExpiringSoon(product.fechaFrente) && (
              <div
                className="
                w-2 h-2 
                rounded-full 
                bg-[#ffb81c]
                shadow-[0_0_6px_rgba(255,184,28,0.5)]
                animate-pulse
                transition-opacity duration-300
              "
              />
            )}
          </div>

          {/* Contenido expandible - para todos los productos cuando están seleccionados */}
          <div
            className={`
            transform transition-all duration-300
            ${isSelected ? "max-h-[500px] opacity-100 mt-4" : "max-h-0 opacity-0"}
            overflow-hidden
          `}
          >
            <div className="space-y-4">
              {/* Mostrar fechas si existen, independientemente del estado */}
              {(product.fechaFrente || product.fechaAlmacen) && (
                <div className="grid grid-cols-2 gap-4">
                  {product.fechaFrente && (
                    <div className="w-full bg-white border border-gray-200 rounded-md overflow-hidden border-l-4 border-l-[#1d5030]">
                      <div className="bg-slate-100 w-full h-9 flex justify-between items-center px-2">
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                          FRENTE
                        </span>
                      </div>
                      <div className="p-2 text-center">
                        <div className="text-lg font-bold text-gray-900 leading-tight select-none">
                          {formatDate(product.fechaFrente)}
                        </div>
                      </div>
                    </div>
                  )}
                  {product.fechaAlmacen && (
                    <div className="w-full bg-white border border-gray-200 rounded-md overflow-hidden border-l-4 border-l-[#1d5030]">
                      <div className="bg-slate-100 w-full h-9 flex justify-between items-center px-2">
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                          ALMACÉN
                        </span>
                        {product.cajasAlmacen > 0 && (
                          <div className="bg-white px-2 py-0.5 rounded shadow-sm flex items-center gap-1 text-xs font-bold text-[#1d5030] border border-gray-100">
                            <Package size={12} />
                            <span>{product.cajasAlmacen}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-2 text-center">
                        <div className="text-lg font-bold text-[#1a1a1a] leading-tight select-none">
                          {formatDate(product.fechaAlmacen)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mostrar etiqueta de caja única si aplica */}
              {product.hayOtrasFechas && (
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600 select-none">
                    Hay más fechas disponibles
                  </span>
                  {product.cajaUnica && (
                    <div
                      className="inline-flex items-center px-2.5 py-1 rounded-md
                      bg-[#ffb81c]/5 text-[#1d5030] text-sm select-none"
                    >
                      <Box className="w-3.5 h-3.5 mr-1" />
                      Última caja
                    </div>
                  )}
                </div>
              )}
              
              {/* Botones - siempre mostrar el botón de actualizar, y el de eliminar solo si aplica */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateClick(product, e);
                  }}
                  className="flex-1 py-2 text-white rounded-md
                    bg-[#1d5030] hover:bg-[#1d5030]/90
                    transition-colors duration-200
                    font-medium text-sm select-none
                    flex items-center justify-center gap-1.5
                    shadow-sm hover:shadow
                    mr-2"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Actualizar Estado
                </button>
                {(product.estado !== "sin-clasificar" ||
                  product.fechaFrente ||
                  product.fechaAlmacen) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteClick(product, e);
                    }}
                    className="min-w-[48px] h-[40px] flex items-center justify-center
                      text-gray-400 rounded-md
                      hover:text-red-500 hover:bg-red-50
                      transition-colors duration-200
                      active:bg-red-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
});

ProductCard.displayName = "ProductCard";

ProductCard.propTypes = {
  product: PropTypes.shape({
    producto: PropTypes.shape({
      _id: PropTypes.string,
      nombre: PropTypes.string,
    }),
    estado: PropTypes.string,
    fechaFrente: PropTypes.string,
    fechaAlmacen: PropTypes.string,
    cajasAlmacen: PropTypes.number,
    cajaUnica: PropTypes.bool,
    hayOtrasFechas: PropTypes.bool,
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  isExpiringSoon: PropTypes.func.isRequired,
  lastUpdatedProductId: PropTypes.string,
  onProductClick: PropTypes.func.isRequired,
  onUpdateClick: PropTypes.func.isRequired,
  onDeleteClick: PropTypes.func.isRequired,
  viewMode: PropTypes.string,
};

export default ProductCard;

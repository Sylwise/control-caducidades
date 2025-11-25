import { Box, Clock, Edit3, Trash2 } from "lucide-react";
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

const ProductCard = ({
  product,
  isSelected,
  isExpiringSoon,
  lastUpdatedProductId,
  onProductClick,
  onUpdateClick,
  onDeleteClick,
}) => {
  // Determinar si el producto está clasificado o no
  const isClassified = product.estado !== "sin-clasificar";

  return (
    <div
      data-product-id={product.producto?._id}
      onClick={() => onProductClick(product)}
      className={`
        w-full text-left 
        bg-white hover:bg-gray-50
        rounded-lg
        shadow-sm hover:shadow
        transition-all duration-300
        ${isSelected ? "ring-1 ring-[#1d5030]/30" : ""}
        ${
          lastUpdatedProductId === product.producto?._id
            ? "animate-highlight bg-[#1d5030]/5"
            : ""
        }
        active:scale-[0.995]
        p-4 product-card
        cursor-pointer
      `}
    >
      <div className="flex items-center gap-2">
        <span className="font-['Noto Sans'] font-semibold text-[#2d3748] text-base flex-1 select-none">
          {product.producto?.nombre}
        </span>
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
          {/* Mostrar fechas solo si el producto está clasificado */}
          {isClassified && (
            <div className="grid grid-cols-2 gap-4">
              {product.fechaFrente && (
                <div className="bg-[#f8f8f8] rounded-md p-3">
                  <div
                    className="inline-block bg-[#1d5030]/10 px-2 py-1 rounded text-[#1d5030] 
                    text-[14px] font-semibold mb-2 select-none"
                  >
                    FRENTE
                  </div>
                  <div className="text-xl font-bold text-[#1a1a1a] leading-tight select-none">
                    {formatDate(product.fechaFrente)}
                  </div>
                </div>
              )}
              {product.fechaAlmacen && (
                <div className="bg-[#f8f8f8] rounded-md p-3">
                  <div
                    className="inline-block bg-[#1d5030]/10 px-2 py-1 rounded text-[#1d5030] 
                    text-[14px] font-semibold mb-2 select-none"
                  >
                    ALMACÉN
                  </div>
                  <div className="text-xl font-bold text-[#1a1a1a] leading-tight select-none">
                    {formatDate(product.fechaAlmacen)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mostrar etiqueta de caja única solo si está clasificado */}
          {isClassified && product.hayOtrasFechas && (
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
    </div>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    producto: PropTypes.shape({
      _id: PropTypes.string,
      nombre: PropTypes.string,
    }),
    estado: PropTypes.string,
    fechaFrente: PropTypes.string,
    fechaAlmacen: PropTypes.string,
    cajaUnica: PropTypes.bool,
    hayOtrasFechas: PropTypes.bool,
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  isExpiringSoon: PropTypes.func.isRequired,
  lastUpdatedProductId: PropTypes.string,
  onProductClick: PropTypes.func.isRequired,
  onUpdateClick: PropTypes.func.isRequired,
  onDeleteClick: PropTypes.func.isRequired,
};

export default ProductCard;

import { ChevronRight, Calendar } from "lucide-react";
import PropTypes from "prop-types";
import ModalContainer from "./ModalContainer";
import useHardwareBackButton from "../hooks/useHardwareBackButton";

const formatDate = (dateString) => {
// ... existing formatDate code
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

const ExpiringModal = ({
  isOpen,
  isClosing,
  groupedProducts,
  onClose,
  onProductClick,
}) => {
  // --- Hardware Back Button Hook ---
  // Priority 20: Main Overlay Modal
  useHardwareBackButton(isOpen, onClose, 20, 'expiring-products-modal');

  return (
    <ModalContainer
      isOpen={isOpen}
      isClosing={isClosing}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#1d5030]" />
          <span>Próximas Caducidades</span>
        </div>
      }
      containerClassName="max-h-[70vh] min-h-[320px]"
    >
      {/* Lista de productos agrupada */}
      <div className="overflow-y-auto" data-scrollable>
        {Object.entries(groupedProducts).map(
          ([key, { title, color, products }]) =>
            products.length > 0 && (
              <div key={key} className="mb-6 last:mb-0">
                {/* Header de sección */}
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    {title}
                  </h3>
                </div>

                {/* Lista de productos */}
                <div className="divide-y divide-gray-100">
                  {products
                    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
                    .map((product) => (
                      <div
                        key={product.producto._id}
                        onClick={() => onProductClick(product)}
                        className={`
                          w-full text-left 
                          hover:bg-gray-50 active:bg-gray-100 
                          transition-colors duration-200
                          flex items-start gap-4 group
                          p-4 cursor-pointer
                          ${key === "expired" ? "bg-red-50" : ""} 
                        `}
                      >
                        {/* Barra indicadora de urgencia */}
                        <div
                          className={`
                            w-1.5 self-stretch rounded-full
                            ${key === "expired" ? "animate-pulse" : ""}
                          `}
                          style={{ backgroundColor: color }}
                        />

                        {/* Información del producto */}
                        <div className="flex-1 min-w-0">
                          {/* Nombre y días */}
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <h4
                              className={`
                              font-semibold truncate group-hover:text-[#1d5030] 
                              transition-colors
                              ${
                                key === "expired"
                                  ? "text-red-700"
                                  : "text-[#2d3748]"
                              }
                            `}
                            >
                              {product.producto.nombre}
                            </h4>
                            <span
                              className="text-sm font-medium whitespace-nowrap"
                              style={{ color }}
                            >
                              {product.daysUntilExpiry < 0
                                ? `Caducado hace ${Math.abs(
                                    product.daysUntilExpiry
                                  )} ${
                                    Math.abs(product.daysUntilExpiry) === 1
                                      ? "día"
                                      : "días"
                                  }`
                                : `${product.daysUntilExpiry} ${
                                    product.daysUntilExpiry === 1
                                      ? "día"
                                      : "días"
                                  }`}
                            </span>
                          </div>

                          {/* Fecha de caducidad */}
                          <p
                            className={`
                            text-sm font-medium
                            ${
                              key === "expired"
                                ? "text-red-600"
                                : "text-[#1d5030]"
                            }
                          `}
                          >
                            {formatDate(product.fechaFrente)}
                          </p>
                        </div>

                        {/* Indicador de acción */}
                        <div
                          className="text-gray-400 group-hover:text-[#1d5030] 
                          transition-colors self-center"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )
        )}
        <div className="h-8" /> {/* Padding inferior aumentado */}
      </div>
    </ModalContainer>
  );
};

ExpiringModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  isClosing: PropTypes.bool.isRequired,
  groupedProducts: PropTypes.objectOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
      products: PropTypes.arrayOf(
        PropTypes.shape({
          producto: PropTypes.shape({
            _id: PropTypes.string.isRequired,
            nombre: PropTypes.string.isRequired,
          }).isRequired,
          daysUntilExpiry: PropTypes.number.isRequired,
          fechaFrente: PropTypes.string,
        })
      ).isRequired,
    })
  ).isRequired,
  onClose: PropTypes.func.isRequired,
  onProductClick: PropTypes.func.isRequired,
};

export default ExpiringModal;

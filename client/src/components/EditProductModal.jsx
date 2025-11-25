import { useState, useCallback, useEffect } from "react";
import { Pencil, X, RefreshCw } from "lucide-react";
import PropTypes from "prop-types";
import usePreventScroll from "../hooks/usePreventScroll";
import OfflineManager from "../services/offlineManager";

const EditProductModal = ({ isOpen, onClose, productId, onProductUpdated }) => {
  // Usar el hook para prevenir scroll
  usePreventScroll(isOpen);

  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "permanente",
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      if (isOpen && productId) {
        try {
          setLoading(true);
          const products = await OfflineManager.getAllCatalogProducts();
          const product = products.find(p => p._id === productId);
          
          if (product) {
            setFormData({
              nombre: product.nombre,
              tipo: product.tipo
            });
          } else {
            setError("No se encontró el producto");
          }
        } catch (err) {
          setError(err.message || "Error al cargar el producto");
        } finally {
          setLoading(false);
        }
      }
    };

    loadProduct();
  }, [isOpen, productId]);

  // Validación en tiempo real
  const validateForm = useCallback((data) => {
    const errors = {};
    if (!data.nombre) {
      errors.nombre = "El nombre del producto es requerido";
    } else if (data.nombre.length < 2) {
      errors.nombre = "El nombre debe tener al menos 2 caracteres";
    }
    return errors;
  }, []);

  // Manejar cambios en el formulario
  const handleInputChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      const newFormData = { ...formData, [name]: value };
      setFormData(newFormData);

      // Validar solo el campo que cambió
      const fieldError = validateForm(newFormData)[name];
      setFormErrors((prev) => ({
        ...prev,
        [name]: fieldError,
      }));
    },
    [formData, validateForm]
  );
  
  // Manejar cambio de tipo de producto con botones
  const handleTypeChange = useCallback((tipo) => {
    setFormData((prev) => ({ ...prev, tipo }));
  }, []);

  // Actualizar producto
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    const errors = validateForm(formData);

    if (Object.values(errors).filter(Boolean).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      const updatedProduct = await OfflineManager.updateCatalogProduct(productId, formData);
      onProductUpdated(updatedProduct);
      handleClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ nombre: "", tipo: "permanente" });
    setFormErrors({});
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4
      animate-[fadeIn_0.2s_ease-out]"
    >
      <div
        className="fixed inset-0 bg-black/50 
          animate-[fadeIn_0.2s_ease-out]"
        onClick={handleClose}
      />

      <div
        className="relative w-full max-w-md bg-white rounded-lg shadow-xl z-10
        animate-[slideIn_0.3s_ease-out]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-[#1d5030]" />
            <h2 className="text-lg font-bold text-[#1d5030]">
              Editar producto
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {error && (
            <div
              className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm
              animate-[slideDown_0.3s_ease-out]"
            >
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Producto
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md
                    ${formErrors.nombre ? "border-red-500" : "border-gray-300"}
                    focus:outline-none focus:ring-2 focus:ring-[#1d5030]/50`}
                />
                {formErrors.nombre && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.nombre}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTypeChange("permanente")}
                    className={`px-4 py-3 min-h-[48px] text-sm font-medium rounded-md transition-colors
                      ${formData.tipo === "permanente" 
                        ? "bg-[#1d5030]/10 text-[#1d5030] border-2 border-[#1d5030]" 
                        : "bg-gray-50 text-gray-700 border border-gray-300 hover:bg-gray-100"
                      }`}
                  >
                    Permanente
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange("promocional")}
                    className={`px-4 py-3 min-h-[48px] text-sm font-medium rounded-md transition-colors
                      ${formData.tipo === "promocional" 
                        ? "bg-[#c17817]/10 text-[#c17817] border-2 border-[#c17817]" 
                        : "bg-gray-50 text-gray-700 border border-gray-300 hover:bg-gray-100"
                      }`}
                  >
                    Promocional
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-3 min-h-[48px] min-w-[80px] text-sm font-medium text-gray-700
                    bg-gray-50 hover:bg-gray-100
                    rounded-md transition-colors flex items-center justify-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !formData.nombre ||
                    Object.values(formErrors).some(Boolean)
                  }
                  className="px-4 py-3 min-h-[48px] min-w-[80px] text-sm font-medium text-white
                    bg-[#1d5030] hover:bg-[#1d5030]/90
                    rounded-md transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    "Guardar Cambios"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

EditProductModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  productId: PropTypes.string,
  onProductUpdated: PropTypes.func.isRequired,
};

export default EditProductModal;

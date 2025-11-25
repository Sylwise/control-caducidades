import { useState, useCallback } from "react";
import { PackagePlus, X, RefreshCw } from "lucide-react";
import PropTypes from "prop-types";
import usePreventScroll from "../hooks/usePreventScroll";
import OfflineManager from "../services/offlineManager";

const CreateProductModal = ({ isOpen, onClose, onProductCreated }) => {
  // Usar el hook para prevenir scroll
  usePreventScroll(isOpen);

  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "permanente",
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

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

  // Crear producto
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    const errors = validateForm(formData);

    if (Object.values(errors).filter(Boolean).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      const newProduct = await OfflineManager.createCatalogProduct(formData);
      onProductCreated(newProduct);
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
            <PackagePlus className="w-5 h-5 text-[#1d5030]" />
            <h2 className="text-lg font-bold text-[#1d5030]">
              Añadir nuevo producto
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

          <form onSubmit={handleCreateProduct} className="space-y-4">
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
                className="px-4 py-3 min-h-[48px] min-w-[100px] text-sm font-medium text-white
                  bg-[#1d5030] hover:bg-[#1d5030]/90
                  rounded-md transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear Producto"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

CreateProductModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onProductCreated: PropTypes.func.isRequired,
};

export default CreateProductModal;

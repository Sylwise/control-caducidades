import { RefreshCw, Plus, AlertCircle, Check, HelpCircle, Trash } from "lucide-react";
import PropTypes from "prop-types";
import { useState } from "react";
import CustomDateInput from "./CustomDateInput";
import ModalContainer from "./ModalContainer";
import QuantitySelector from "./QuantitySelector";

// Componente de checkbox mejorado con tooltip
const CustomCheckbox = ({ 
  id, 
  label, 
  checked, 
  disabled = false, 
  onChange, 
  tooltip = null 
}) => (
  <label
    htmlFor={id}
    className={`
      flex items-center gap-3
      w-full py-2.5 px-4 my-1.5 
      rounded-lg transition-all duration-200
      font-medium text-sm select-none
      ${
        disabled
          ? "text-gray-400 cursor-not-allowed"
          : "text-[#2d3748] hover:bg-gray-50 cursor-pointer"
      }
    `}
  >
    <div className="relative">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only" // Oculto visualmente pero accesible
      />
      <div
        className={`
          w-5 h-5 rounded-md
          flex items-center justify-center
          transition-all duration-200
          ${
            disabled
              ? "bg-gray-100"
              : checked
                ? "bg-[#1d5030]"
                : "bg-white border-2 border-gray-300"
          }
        `}
      >
        {checked && <Check className="w-3.5 h-3.5 text-white" />}
      </div>
    </div>
    <div className="flex items-center gap-1.5">
      <span>{label}</span>
      {tooltip && (
        <div className="group relative">
          <HelpCircle className="w-4 h-4 text-gray-400" />
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
            {tooltip}
          </div>
        </div>
      )}
    </div>
  </label>
);

CustomCheckbox.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  disabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  tooltip: PropTypes.string,
};

const ConfirmDialog = ({ onConfirm, onCancel, title, message }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center animate-fade-in">
    <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
    <div className="relative bg-white rounded-lg p-5 max-w-sm w-full mx-4 z-10 animate-slide-down">
      <div className="flex items-start gap-3 mb-4">
        <AlertCircle className="w-5 h-5 text-[#f59e0b] flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-sm font-medium text-white bg-[#f59e0b] hover:bg-[#f59e0b]/90 rounded-lg transition-colors"
        >
          Confirmar
        </button>
      </div>
    </div>
  </div>
);

ConfirmDialog.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
};

const UpdateModal = ({
  isOpen,
  isClosing,
  editingProduct,
  updateForm,
  setUpdateForm,
  isUpdating,
  onClose,
  onSubmit,
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [dateErrors, setDateErrors] = useState({
    fechaAlmacen2: "",
    fechaAlmacen3: "",
  });
  const [showFrontDateDialog, setShowFrontDateDialog] = useState(false);
  const [dateToDelete, setDateToDelete] = useState(null);

  const handleConfirmDeleteDate = () => {
    if (dateToDelete) {
      handleStorageDateRemoval(dateToDelete);
      setDateToDelete(null);
    }
  };

  const isDateAfter = (dateToCheck, baseDate) => {
    if (!dateToCheck || !baseDate) return true;
    const date1 = new Date(dateToCheck);
    const date2 = new Date(baseDate);
    return date1 > date2;
  };

  const validateAdditionalDate = (value, dateNumber) => {
    if (!value) {
      setDateErrors((prev) => ({ ...prev, [`fechaAlmacen${dateNumber}`]: "" }));
      return true;
    }

    const baseDate =
      dateNumber === 2 ? updateForm.fechaAlmacen : updateForm.fechaAlmacen2;

    if (!baseDate) {
      return true;
    }

    const isValid = isDateAfter(value, baseDate);

    if (!isValid) {
      setDateErrors((prev) => ({
        ...prev,
        [`fechaAlmacen${dateNumber}`]: `La fecha debe ser posterior a la ${
          dateNumber === 2 ? "primera" : "segunda"
        } fecha`,
      }));

      setUpdateForm((prev) => ({
        ...prev,
        [`fechaAlmacen${dateNumber}`]: "",
        ...(dateNumber === 2 && {
          fechaAlmacen3: "",
          showThirdDate: false,
        }),
      }));
    } else {
      setDateErrors((prev) => ({
        ...prev,
        [`fechaAlmacen${dateNumber}`]: "",
      }));
    }

    return isValid;
  };

  const handleFrontDateRemoval = () => {
    if (!updateForm.fechaAlmacen) {
      setUpdateForm((prev) => ({
        ...prev,
        fechaFrente: "",
      }));
      return;
    }

    const frontDate = new Date(updateForm.fechaFrente).setHours(0, 0, 0, 0);
    const storageDate = new Date(updateForm.fechaAlmacen).setHours(0, 0, 0, 0);

    // Siempre mostrar el diálogo para dar control al usuario
    setShowFrontDateDialog(true);
  };

  const handleMoveBoxToFront = () => {
    const currentBoxes = updateForm.cajasAlmacen || 1;

    if (currentBoxes > 1) {
      setUpdateForm((prev) => ({
        ...prev,
        fechaFrente: prev.fechaAlmacen,
        cajasAlmacen: currentBoxes - 1,
      }));
    } else {
      setUpdateForm((prev) => ({
        ...prev,
        fechaFrente: prev.fechaAlmacen,
        fechaAlmacen: prev.fechaAlmacen2 || "",
        cajasAlmacen: prev.fechaAlmacen2 ? (prev.cajasAlmacen2 || 1) : 1,
        fechaAlmacen2: prev.fechaAlmacen3 || "",
        cajasAlmacen2: prev.fechaAlmacen3 ? (prev.cajasAlmacen3 || 1) : 1,
        fechaAlmacen3: "",
        cajasAlmacen3: 1,
        showThirdDate: false,
        showSecondDate: Boolean(prev.fechaAlmacen3),
      }));
    }
    setShowFrontDateDialog(false);
  };

  const handlePartialToFront = () => {
    setUpdateForm((prev) => ({
      ...prev,
      fechaFrente: prev.fechaAlmacen,
    }));
    setShowFrontDateDialog(false);
  };

  const handleStorageDateRemoval = (dateNumber) => {
    setUpdateForm((prev) => {
      const newState = { ...prev };

      if (dateNumber === 1) {
        newState.fechaAlmacen = prev.fechaAlmacen2 || "";
        newState.cajasAlmacen = prev.fechaAlmacen2 ? (prev.cajasAlmacen2 || 1) : 1;
        
        newState.fechaAlmacen2 = prev.fechaAlmacen3 || "";
        newState.cajasAlmacen2 = prev.fechaAlmacen3 ? (prev.cajasAlmacen3 || 1) : 1;
        
        newState.fechaAlmacen3 = "";
        newState.cajasAlmacen3 = 1;
        
        newState.showThirdDate = false;
        newState.showSecondDate = Boolean(prev.fechaAlmacen3);
      } else if (dateNumber === 2) {
        newState.fechaAlmacen2 = prev.fechaAlmacen3 || "";
        newState.cajasAlmacen2 = prev.fechaAlmacen3 ? (prev.cajasAlmacen3 || 1) : 1;
        
        newState.fechaAlmacen3 = "";
        newState.cajasAlmacen3 = 1;
        
        newState.showThirdDate = false;
        newState.showSecondDate = Boolean(prev.fechaAlmacen3);
      } else if (dateNumber === 3) {
        newState.fechaAlmacen3 = "";
        newState.cajasAlmacen3 = 1;
        newState.showThirdDate = false;
      }

      return newState;
    });
  };

  const title = (
    <div className="text-[#2d3748]">
      <span className="font-medium">Actualizar estado de</span>
      <span className="block text-[#1d5030] font-semibold mt-1 break-words">
        {editingProduct?.producto?.nombre}
      </span>
    </div>
  );

  const handleAddDate = () => {
    if (!updateForm.fechaAlmacen) {
      return;
    }

    if (!updateForm.showSecondDate) {
      setUpdateForm((prev) => ({
        ...prev,
        showSecondDate: true,
        fechaAlmacen2: "",
        cajasAlmacen2: 1, // Resetear cajas al añadir nueva fecha
        cajaUnica: false,
        hayUnicaCajaActual: false,
      }));
      setDateErrors((prev) => ({
        ...prev,
        fechaAlmacen2: "",
      }));
      setTimeout(() => {
        const dateInput = document.querySelector(
          '[data-date-input="fechaAlmacen2"]'
        );
        if (dateInput) {
          dateInput.click();
        }
      }, 100);
    } else if (!updateForm.showThirdDate) {
      setUpdateForm((prev) => ({
        ...prev,
        showThirdDate: true,
        fechaAlmacen3: "",
        cajasAlmacen3: 1, // Resetear cajas al añadir nueva fecha
        cajaUnica: false,
        hayUnicaCajaActual: false,
      }));
      setDateErrors((prev) => ({
        ...prev,
        fechaAlmacen3: "",
      }));
      setTimeout(() => {
        const dateInput = document.querySelector(
          '[data-date-input="fechaAlmacen3"]'
        );
        if (dateInput) {
          dateInput.click();
        }
      }, 100);
    }
  };

  const canAddMoreDates =
    !updateForm.noHayEnAlmacen &&
    updateForm.fechaAlmacen &&
    (!updateForm.showSecondDate ||
      (updateForm.showSecondDate &&
        updateForm.fechaAlmacen2 &&
        !updateForm.showThirdDate));

  const handleNoHayEnAlmacenChange = (checked) => {
    if (checked && (updateForm.fechaAlmacen2 || updateForm.fechaAlmacen3)) {
      setShowConfirmDialog(true);
      return;
    }

    setUpdateForm({
      ...updateForm,
      noHayEnAlmacen: checked,
      fechaAlmacen: checked ? "" : updateForm.fechaAlmacen,
      fechaAlmacen2: "",
      fechaAlmacen3: "",
      showSecondDate: false,
      showThirdDate: false,
      cajaUnica: checked ? false : updateForm.cajaUnica,
      hayUnicaCajaActual: checked ? false : updateForm.hayUnicaCajaActual,
    });
  };

  const handleConfirmNoHayEnAlmacen = () => {
    setUpdateForm({
      ...updateForm,
      noHayEnAlmacen: true,
      fechaAlmacen: "",
      fechaAlmacen2: "",
      fechaAlmacen3: "",
      showSecondDate: false,
      showThirdDate: false,
      cajaUnica: false,
      hayUnicaCajaActual: false,
    });
    setShowConfirmDialog(false);
  };

  const handleCancelNoHayEnAlmacen = () => {
    setShowConfirmDialog(false);
  };

  return (
    <>
      <ModalContainer
        isOpen={isOpen}
        isClosing={isClosing}
        onClose={onClose}
        title={title}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 p-5 space-y-6 min-h-[400px]">
            <div className="space-y-4">
              <div className="relative">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Fecha visible al cliente
                </h3>
                <CustomDateInput
                  label="Fecha Frente"
                  value={updateForm.fechaFrente}
                  onChange={(value) =>
                    setUpdateForm({ ...updateForm, fechaFrente: value })
                  }
                  onRemove={handleFrontDateRemoval}
                  RemoveIcon={Trash}
                  className="w-full py-2.5 px-4 my-1.5 rounded-lg transition-all duration-200 font-medium text-sm select-none flex items-center justify-between shadow-sm hover:shadow-md"
                />
              </div>

              <div className="relative">
                <div className="flex items-center justify-between">
                  <CustomCheckbox
                    id="noHayEnAlmacen"
                    label="No hay producto en almacén"
                    checked={updateForm.noHayEnAlmacen}
                    disabled={isUpdating}
                    onChange={handleNoHayEnAlmacenChange}
                    tooltip="Si se selecciona esta opción, se eliminarán todas las fechas de almacén."
                  />
                </div>
              </div>

              {!updateForm.noHayEnAlmacen && (
                <div className="space-y-5 mt-3">
                  <div className="relative">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Fechas de caducidad en almacén
                    </h3>
                    <div className="flex flex-col gap-4">
                      {/* Fecha Principal */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <CustomDateInput
                            label="Fecha Principal"
                            value={updateForm.fechaAlmacen}
                            onChange={(value) =>
                              setUpdateForm({
                                ...updateForm,
                                fechaAlmacen: value,
                                // Si se está poniendo una nueva fecha (value existe y antes no había o era diferente), resetear a 1
                                // Si se está borrando (value es vacío), poner a 0
                                cajasAlmacen: value ? (updateForm.fechaAlmacen ? updateForm.cajasAlmacen : 1) : 0,
                                ...(value === "" && {
                                  fechaAlmacen2: "",
                                  fechaAlmacen3: "",
                                  showSecondDate: false,
                                  showThirdDate: false,
                                }),
                              })
                            }
                            // No pasamos onRemove aquí para manejarlo externamente
                            className="w-full py-2.5 px-3 my-0 rounded-lg transition-all duration-200 font-medium text-sm select-none flex items-center justify-between shadow-sm hover:shadow-md h-[42px]"
                          />
                        </div>
                        
                        {updateForm.fechaAlmacen && (
                          <>
                            <div className="flex-shrink-0">
                              <QuantitySelector
                                value={updateForm.cajasAlmacen || 1}
                                onChange={(val) => setUpdateForm({ ...updateForm, cajasAlmacen: val })}
                                min={1}
                                max={50}
                                className="w-[100px]"
                              />
                            </div>
                            <button
                              onClick={() => setDateToDelete(1)}
                              className="flex-shrink-0 p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar fecha"
                            >
                              <Trash className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>

                      {updateForm.showSecondDate && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <CustomDateInput
                              label="Fecha Secundaria"
                              value={updateForm.fechaAlmacen2}
                              onChange={(value) => {
                                if (validateAdditionalDate(value, 2)) {
                                  setUpdateForm({
                                    ...updateForm,
                                    fechaAlmacen2: value,
                                    // Resetear a 1 si es una nueva fecha
                                    cajasAlmacen2: value ? (updateForm.fechaAlmacen2 ? updateForm.cajasAlmacen2 : 1) : 0,
                                    ...(value === "" && {
                                      fechaAlmacen3: "",
                                      showThirdDate: false,
                                    }),
                                  });
                                }
                              }}
                              data-date-input="fechaAlmacen2"
                              // No pasamos onRemove aquí
                              showRemoveWhenEmpty={false}
                              className="w-full py-2.5 px-3 my-0 rounded-lg transition-all duration-200 font-medium text-sm select-none flex items-center justify-between shadow-sm hover:shadow-md h-[42px]"
                            />
                            {dateErrors.fechaAlmacen2 && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                <p className="text-xs text-red-600 font-medium">
                                  {dateErrors.fechaAlmacen2}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {updateForm.fechaAlmacen2 && (
                            <>
                              <div className="flex-shrink-0">
                                <QuantitySelector
                                  value={updateForm.cajasAlmacen2 || 1}
                                  onChange={(val) => setUpdateForm({ ...updateForm, cajasAlmacen2: val })}
                                  min={1}
                                  max={50}
                                  className="w-[100px]"
                                />
                              </div>
                              <button
                                onClick={() => setDateToDelete(2)}
                                className="flex-shrink-0 p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar fecha"
                              >
                                <Trash className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {updateForm.showThirdDate && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <CustomDateInput
                              label="Fecha Adicional"
                              value={updateForm.fechaAlmacen3}
                              onChange={(value) => {
                                if (validateAdditionalDate(value, 3)) {
                                  setUpdateForm({
                                    ...updateForm,
                                    fechaAlmacen3: value,
                                    // Resetear a 1 si es una nueva fecha
                                    cajasAlmacen3: value ? (updateForm.fechaAlmacen3 ? updateForm.cajasAlmacen3 : 1) : 0,
                                  });
                                }
                              }}
                              data-date-input="fechaAlmacen3"
                              // No pasamos onRemove aquí
                              showRemoveWhenEmpty={false}
                              className="w-full py-2.5 px-3 my-0 rounded-lg transition-all duration-200 font-medium text-sm select-none flex items-center justify-between shadow-sm hover:shadow-md h-[42px]"
                            />
                            {dateErrors.fechaAlmacen3 && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                <p className="text-xs text-red-600 font-medium">
                                  {dateErrors.fechaAlmacen3}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {updateForm.fechaAlmacen3 && (
                            <>
                              <div className="flex-shrink-0">
                                <QuantitySelector
                                  value={updateForm.cajasAlmacen3 || 1}
                                  onChange={(val) => setUpdateForm({ ...updateForm, cajasAlmacen3: val })}
                                  min={1}
                                  max={50}
                                  className="w-[100px]"
                                />
                              </div>
                              <button
                                onClick={() => setDateToDelete(3)}
                                className="flex-shrink-0 p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar fecha"
                              >
                                <Trash className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {canAddMoreDates && (
                    <button
                      onClick={handleAddDate}
                      className="w-full py-3 px-4 my-1.5 
                        rounded-lg transition-all duration-300
                        font-medium text-sm select-none
                        flex items-center justify-center gap-2
                        text-[#1d5030] bg-[#1d5030]/15
                        hover:bg-[#1d5030]/25 hover:shadow-sm
                        active:bg-[#1d5030]/30
                        border border-dashed border-[#1d5030]/30
                        disabled:opacity-40 disabled:cursor-not-allowed"
                      disabled={!updateForm.fechaAlmacen}
                    >
                      <Plus className="w-5 h-5" />
                      Añadir fecha adicional
                    </button>
                  )}
                </div>
              )}    {/* Checkbox de caja única eliminado en favor del contador */}
            </div>
          </div>

          <div className="flex justify-end gap-3 p-5 pt-3 border-t border-gray-200">
            <button
              onClick={onClose}
              className="min-h-[48px] px-5 text-sm font-medium 
                text-[#1d5030] border border-[#1d5030]/30
                bg-white hover:bg-[#1d5030]/5
                rounded-md transition-colors duration-200
                shadow-sm"
            >
              Cancelar
            </button>
            <button
              onClick={onSubmit}
              disabled={
                isUpdating ||
                Object.values(dateErrors).some((error) => error !== "")
              }
              className="min-h-[48px] px-5 text-sm font-medium text-white
                bg-[#1d5030] hover:bg-[#1d5030]/90
                rounded-md transition-colors duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center gap-2
                shadow-sm"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Actualizando...
                </>
              ) : (
                "Guardar"
              )}
            </button>
          </div>
        </div>
      </ModalContainer>

      {showConfirmDialog && (
        <ConfirmDialog
          title="¿Estás seguro?"
          message="Se perderán todas las fechas de almacén que hayas añadido."
          onConfirm={handleConfirmNoHayEnAlmacen}
          onCancel={handleCancelNoHayEnAlmacen}
        />
      )}

      {dateToDelete && (
        <ConfirmDialog
          title="¿Eliminar fecha?"
          message="¿Estás seguro de que deseas eliminar esta fecha y sus cajas?"
          onConfirm={handleConfirmDeleteDate}
          onCancel={() => setDateToDelete(null)}
        />
      )}

      {showFrontDateDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center animate-fade-in select-none">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowFrontDateDialog(false)}
          />
          <div className="relative bg-white rounded-lg p-5 max-w-sm w-full mx-4 z-10 animate-slide-down">
            <div className="flex items-start gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-[#f59e0b] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  ¿Qué deseas hacer?
                </h3>
                <p className="text-sm text-gray-600">
                  ¿Has traído una caja entera al frente?
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleMoveBoxToFront}
                className="w-full px-4 py-2.5 text-sm font-medium text-white
                  bg-[#1d5030] hover:bg-[#1d5030]/90 rounded-md transition-colors"
              >
                Sí, mover 1 caja al frente
              </button>
              <button
                onClick={() => setShowFrontDateDialog(false)}
                className="w-full px-4 py-2.5 text-sm font-medium text-gray-700
                  bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

UpdateModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  isClosing: PropTypes.bool.isRequired,
  editingProduct: PropTypes.shape({
    producto: PropTypes.shape({
      nombre: PropTypes.string,
    }),
  }),
  updateForm: PropTypes.shape({
    fechaFrente: PropTypes.string,
    fechaAlmacen: PropTypes.string,
    fechaAlmacen2: PropTypes.string,
    fechaAlmacen3: PropTypes.string,
    noHayEnAlmacen: PropTypes.bool,
    cajaUnica: PropTypes.bool,
    showSecondDate: PropTypes.bool,
    showThirdDate: PropTypes.bool,
    hayUnicaCajaActual: PropTypes.bool,
  }).isRequired,
  setUpdateForm: PropTypes.func.isRequired,
  isUpdating: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default UpdateModal;

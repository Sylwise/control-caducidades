import { RefreshCw, Plus, AlertCircle, Check, HelpCircle, Trash } from "lucide-react";
import PropTypes from "prop-types";
import { useState } from "react";
import CustomDateInput from "./CustomDateInput";
import ModalContainer from "./ModalContainer";
import QuantitySelector from "./QuantitySelector";

// Componente de checkbox mejorado con tooltip


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

import useHardwareBackButton from "../hooks/useHardwareBackButton";

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

  // --- Hardware Back Button Hooks ---
  
  // 1. Internal Dialogs (Priority 30 - Higher than modal itself)
  useHardwareBackButton(showConfirmDialog, () => setShowConfirmDialog(false), 30, 'update-confirm-dialog');
  useHardwareBackButton(!!dateToDelete, () => setDateToDelete(null), 30, 'update-delete-date-dialog');
  useHardwareBackButton(showFrontDateDialog, () => setShowFrontDateDialog(false), 30, 'update-front-date-dialog');

  // 2. Main Modal (Priority 20)
  useHardwareBackButton(isOpen, onClose, 20, 'update-main-modal');

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
    updateForm.fechaAlmacen &&
    (!updateForm.showSecondDate ||
      (updateForm.showSecondDate &&
        updateForm.fechaAlmacen2 &&
        !updateForm.showThirdDate));

  // Validación: Almacén debe ser posterior a frente (Excluir para consumo directo)
  const isStorageDateInvalid = !editingProduct?.producto?.isDirectConsumption && 
                               updateForm.fechaFrente && 
                               updateForm.fechaAlmacen && 
                               new Date(updateForm.fechaAlmacen) < new Date(updateForm.fechaFrente);



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
              {!editingProduct?.producto?.isDirectConsumption && (
                <>
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


                </>
              )}

              <div className="space-y-5 mt-3">
                  <div className="relative">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      {editingProduct?.producto?.isDirectConsumption ? "Fechas de Caducidad" : "Fechas de caducidad en almacén"}
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
                      {isStorageDateInvalid && (
                        <div className="flex items-center gap-1.5 mt-1 animate-slide-down">
                           <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                           <p className="text-xs text-red-600 font-medium">
                             La fecha debe ser posterior a la del frente
                           </p>
                        </div>
                      )}

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
                Object.values(dateErrors).some((error) => error !== "") ||
                isStorageDateInvalid
              }
              className="min-h-[48px] px-5 text-sm font-medium text-white
                bg-[#1d5030] hover:bg-[#1d5030]/90
                rounded-md transition-colors duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center gap-2
                shadow-sm"
              title={isStorageDateInvalid ? "La fecha de almacén debe ser posterior a la de frente" : ""}
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
              {/* Solo mostrar la opción de actualizar fecha si las fechas son diferentes */}
              {new Date(updateForm.fechaFrente).setHours(0,0,0,0) !== new Date(updateForm.fechaAlmacen).setHours(0,0,0,0) && (
                <button
                  onClick={handlePartialToFront}
                  className="w-full px-4 py-2.5 text-sm font-medium text-[#1d5030]
                    bg-[#1d5030]/10 hover:bg-[#1d5030]/20 rounded-md transition-colors"
                >
                  Solo actualizar fecha (sin mover caja)
                </button>
              )}
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
    hayUnicaCajaActual: PropTypes.bool,
  }).isRequired,
  setUpdateForm: PropTypes.func.isRequired,
  isUpdating: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default UpdateModal;

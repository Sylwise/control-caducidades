import { RefreshCw, Plus, AlertCircle, Check, HelpCircle } from "lucide-react";
import PropTypes from "prop-types";
import { useState } from "react";
import CustomDateInput from "./CustomDateInput";
import ModalContainer from "./ModalContainer";

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

    if (frontDate === storageDate) {
      const currentFrontDate = updateForm.fechaFrente;
      setUpdateForm({
        ...updateForm,
        fechaFrente: currentFrontDate,
        fechaAlmacen: updateForm.fechaAlmacen2 || "",
        fechaAlmacen2: updateForm.fechaAlmacen3 || "",
        fechaAlmacen3: "",
        showThirdDate: false,
        showSecondDate: Boolean(updateForm.fechaAlmacen3),
      });
    } else {
      setShowFrontDateDialog(true);
    }
  };

  const handleAllToFront = () => {
    setUpdateForm((prev) => ({
      ...prev,
      fechaFrente: prev.fechaAlmacen,
      fechaAlmacen: prev.fechaAlmacen2 || "",
      fechaAlmacen2: prev.fechaAlmacen3 || "",
      fechaAlmacen3: "",
      showThirdDate: false,
      showSecondDate: Boolean(prev.fechaAlmacen3),
    }));
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
        newState.fechaAlmacen2 = prev.fechaAlmacen3 || "";
        newState.fechaAlmacen3 = "";
        newState.showThirdDate = false;
        newState.showSecondDate = Boolean(prev.fechaAlmacen3);
      } else if (dateNumber === 2) {
        newState.fechaAlmacen2 = prev.fechaAlmacen3 || "";
        newState.fechaAlmacen3 = "";
        newState.showThirdDate = false;
        newState.showSecondDate = Boolean(prev.fechaAlmacen3);
      } else if (dateNumber === 3) {
        newState.fechaAlmacen3 = "";
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
          <div className="flex-1 p-5 space-y-4">
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
                    <div className="flex flex-col space-y-4">
                      <CustomDateInput
                        label="Fecha Principal"
                        value={updateForm.fechaAlmacen}
                        onChange={(value) =>
                          setUpdateForm({
                            ...updateForm,
                            fechaAlmacen: value,
                            ...(value === "" && {
                              fechaAlmacen2: "",
                              fechaAlmacen3: "",
                              showSecondDate: false,
                              showThirdDate: false,
                            }),
                          })
                        }
                        onRemove={() => handleStorageDateRemoval(1)}
                        className="w-full py-2.5 px-4 my-1.5 rounded-lg transition-all duration-200 font-medium text-sm select-none flex items-center justify-between shadow-sm hover:shadow-md"
                      />

                      {updateForm.showSecondDate && (
                        <div className="relative">
                          <CustomDateInput
                            label="Fecha Secundaria"
                            value={updateForm.fechaAlmacen2}
                            onChange={(value) => {
                              if (validateAdditionalDate(value, 2)) {
                                setUpdateForm({
                                  ...updateForm,
                                  fechaAlmacen2: value,
                                  ...(value === "" && {
                                    fechaAlmacen3: "",
                                    showThirdDate: false,
                                  }),
                                });
                              }
                            }}
                            data-date-input="fechaAlmacen2"
                            onRemove={() => handleStorageDateRemoval(2)}
                            showRemoveWhenEmpty
                            className="w-full py-2.5 px-4 my-1.5 rounded-lg transition-all duration-200 font-medium text-sm select-none flex items-center justify-between shadow-sm hover:shadow-md"
                          />
                          {dateErrors.fechaAlmacen2 && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                              <p className="text-sm text-red-600 font-medium">
                                {dateErrors.fechaAlmacen2}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {updateForm.showThirdDate && (
                        <div className="relative">
                          <CustomDateInput
                            label="Fecha Adicional"
                            value={updateForm.fechaAlmacen3}
                            onChange={(value) => {
                              if (validateAdditionalDate(value, 3)) {
                                setUpdateForm({
                                  ...updateForm,
                                  fechaAlmacen3: value,
                                });
                              }
                            }}
                            data-date-input="fechaAlmacen3"
                            onRemove={() => handleStorageDateRemoval(3)}
                            showRemoveWhenEmpty
                            className="w-full py-2.5 px-4 my-1.5 rounded-lg transition-all duration-200 font-medium text-sm select-none flex items-center justify-between shadow-sm hover:shadow-md"
                          />
                          {dateErrors.fechaAlmacen3 && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                              <p className="text-sm text-red-600 font-medium">
                                {dateErrors.fechaAlmacen3}
                              </p>
                            </div>
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

                  {/* Separador visual */}
                  <div className="border-t border-gray-100 my-3"></div>

                  <CustomCheckbox
                    id="cajaUnica"
                    label="Solo queda una caja"
                    checked={updateForm.cajaUnica}
                    disabled={
                      updateForm.noHayEnAlmacen || updateForm.showSecondDate
                    }
                    onChange={(checked) =>
                      setUpdateForm({
                        ...updateForm,
                        cajaUnica: checked,
                      })
                    }
                    tooltip="Si se selecciona esta opción, se considerará que solo queda una caja del producto en almacén."
                  />
                  
                  {updateForm.showSecondDate && !updateForm.noHayEnAlmacen && (
                    <CustomCheckbox
                      id="hayUnicaCajaActual"
                      label="Solo una caja de la fecha principal"
                      checked={updateForm.hayUnicaCajaActual}
                      onChange={(checked) =>
                        setUpdateForm({
                          ...updateForm,
                          hayUnicaCajaActual: checked,
                        })
                      }
                      tooltip="Si se selecciona esta opción, se considerará que solo hay una caja de la fecha principal antes de cambiar a otra fecha."
                    />
                  )}
                </div>
              )}
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

      {showFrontDateDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center animate-fade-in">
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
                  Al quitar la fecha de frente, ¿cómo deseas manejar el producto
                  del almacén?
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleAllToFront}
                className="w-full px-4 py-2.5 text-sm font-medium text-white
                  bg-[#1d5030] hover:bg-[#1d5030]/90 rounded-md transition-colors"
              >
                Todo el producto pasa al frente
              </button>
              <button
                onClick={handlePartialToFront}
                className="w-full px-4 py-2.5 text-sm font-medium text-[#1d5030]
                  bg-[#1d5030]/10 hover:bg-[#1d5030]/20 rounded-md transition-colors"
              >
                Solo una parte pasa al frente
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

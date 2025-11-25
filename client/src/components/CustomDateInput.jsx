import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { X, Calendar, AlertCircle } from "lucide-react";
import usePreventScroll from "../hooks/usePreventScroll";

const CustomDateInput = ({
  label,
  value,
  onChange,
  disabled = false,
  onRemove,
  showRemoveWhenEmpty = false,
  "data-date-input": dataDateInput,
  onCancel,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const modalRef = useRef(null);
  const keypadRef = useRef(null);

  // Usar el hook para prevenir scroll
  usePreventScroll(isOpen);

  // Formatear fecha inicial si existe
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        setInputValue(`${day}/${month}/${year}`);
      }
    } else {
      setInputValue("");
    }
  }, [value]);

  // Manejar clics fuera del modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target) &&
        event.target.closest("[data-modal-backdrop]") // Solo cerrar si el click fue en el backdrop
      ) {
        setIsOpen(false);
        if (!value && onCancel) {
          onCancel();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, value, onCancel]);

  // Validar fecha y que no sea más de 5 años en el futuro
  const isValidDate = useCallback((day, month, year) => {
    const date = new Date(year, month - 1, day);
    const isValidFormat =
      date.getDate() === parseInt(day) &&
      date.getMonth() === month - 1 &&
      date.getFullYear() === parseInt(year);

    const currentYear = new Date().getFullYear();
    const isValidYear = year <= currentYear + 5;

    return isValidFormat && isValidYear;
  }, []);

  // Validar que la fecha no sea anterior a hoy ni posterior a 5 años
  const isDateAfterToday = useCallback((day, month, year) => {
    const inputDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 5);
    maxDate.setHours(23, 59, 59, 999);

    return inputDate >= today && inputDate <= maxDate;
  }, []);

  // Formatear entrada mientras se escribe
  const formatInput = useCallback((input) => {
    const numbers = input.replace(/\D/g, "");
    let formatted = "";

    if (numbers.length > 0) {
      formatted += numbers.substring(0, 2);
    }
    if (numbers.length > 2) {
      formatted += "/" + numbers.substring(2, 4);
    }
    if (numbers.length > 4) {
      formatted += "/" + numbers.substring(4, 8);
    }

    return formatted;
  }, []);

  // Validar y actualizar valor
  const validateAndUpdate = useCallback(
    (dateString) => {
      const [day, month, year] = dateString.split("/").map(Number);

      if (dateString.length === 10) {
        if (!isValidDate(day, month, year)) {
          const currentYear = new Date().getFullYear();
          if (year > currentYear + 5) {
            setError(`El año no puede ser posterior a ${currentYear + 5}`);
          } else {
            setError("Fecha inválida");
          }
          return;
        }

        if (!isDateAfterToday(day, month, year)) {
          const maxDate = new Date();
          maxDate.setFullYear(maxDate.getFullYear() + 5);
          if (new Date(year, month - 1, day) > maxDate) {
            setError(
              `La fecha no puede ser posterior a ${maxDate
                .getDate()
                .toString()
                .padStart(2, "0")}/${(maxDate.getMonth() + 1)
                .toString()
                .padStart(2, "0")}/${maxDate.getFullYear()}`
            );
          } else {
            setError("La fecha no puede ser anterior a hoy");
          }
          return;
        }

        setError("");
        const formattedDate = `${year}-${month
          .toString()
          .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
        onChange(formattedDate);
        setIsOpen(false);
      }
    },
    [isValidDate, isDateAfterToday, onChange]
  );

  // Manejar entrada de teclado
  const handleInputChange = useCallback(
    (e) => {
      const formatted = formatInput(e.target.value);
      if (formatted.length <= 10) {
        setInputValue(formatted);
        if (formatted.length === 10) {
          validateAndUpdate(formatted);
        }
      }
    },
    [formatInput, validateAndUpdate]
  );

  // Debounce function
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Manejar clic en número del teclado con debounce
  const debouncedKeypadClick = useMemo(
    () =>
      debounce(
        (
          e,
          num,
          currentInputValue,
          onSetInputValue,
          onSetError,
          onValidateAndUpdate
        ) => {
          e.stopPropagation();

          // Si ya hay una fecha completa (10 caracteres), borrar todo y empezar de nuevo
          if (currentInputValue.length === 10) {
            onSetInputValue(num.toString());
            onSetError("");
            return;
          }

          if (currentInputValue.length < 10) {
            const newValue = formatInput(
              currentInputValue.replace(/\D/g, "") + num
            );
            onSetInputValue(newValue);
            if (newValue.length === 10) {
              onValidateAndUpdate(newValue);
            }
          }
        },
        50
      ),
    [formatInput]
  );

  const handleKeypadClick = useCallback(
    (e, num) => {
      debouncedKeypadClick(
        e,
        num,
        inputValue,
        setInputValue,
        setError,
        validateAndUpdate
      );
    },
    [debouncedKeypadClick, inputValue, validateAndUpdate]
  );

  // Manejar borrado
  const handleDelete = useCallback((e) => {
    e.stopPropagation(); // Evitar que el click se propague
    setInputValue((prev) => {
      const newValue = prev.slice(0, -1);
      if (newValue.length < 10) {
        setError("");
      }
      return newValue;
    });
  }, []);

  // Manejar limpieza
  const handleClear = useCallback((e) => {
    e.stopPropagation(); // Evitar que el click se propague
    setInputValue("");
    setError("");
  }, []);

  // Memoizar los botones del teclado para evitar re-renders innecesarios
  const keypadButtons = useMemo(
    () => [
      ...Array(9)
        .fill(null)
        .map((_, i) => ({
          value: i + 1,
          label: (i + 1).toString(),
          action: handleKeypadClick,
        })),
      {
        value: "clear",
        label: "C",
        action: handleClear,
        variant: "secondary",
      },
      {
        value: 0,
        label: "0",
        action: handleKeypadClick,
      },
      {
        value: "delete",
        label: "←",
        action: handleDelete,
        variant: "secondary",
      },
    ],
    [handleKeypadClick, handleClear, handleDelete]
  );

  // Manejar entrada de teclado físico
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      // Números del 0-9
      if (/^\d$/.test(e.key)) {
        e.preventDefault();
        handleKeypadClick(e, parseInt(e.key));
      }
      // Borrar con Backspace o Delete
      else if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        handleDelete(e);
      }
      // Escape: limpiar si hay input, cerrar si no hay
      else if (e.key === "Escape") {
        e.preventDefault();
        if (inputValue) {
          handleClear(e);
        } else {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeypadClick, handleDelete, handleClear, inputValue]);

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(true)}
          data-date-input={dataDateInput}
          disabled={disabled}
          className={`
            flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg w-full
            font-medium text-sm transition-all duration-200
            ${
              disabled
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-[#2d3748] hover:bg-gray-50 active:bg-gray-100"
            }
            border border-gray-200 shadow-sm hover:border-[#1d5030]/20
          `}
        >
          <Calendar className="w-4.5 h-4.5 text-[#1d5030]" />
          {value ? (
            <span>{inputValue}</span>
          ) : (
            <span className="text-gray-500">Seleccionar {label}</span>
          )}
        </button>
        {((value && !disabled) ||
          (!value && showRemoveWhenEmpty && onRemove)) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onRemove) {
                onRemove();
              }
            }}
            className="p-2.5 text-gray-400 hover:text-gray-600
              hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        )}
      </div>

      {/* Modal con teclado numérico */}
      {isOpen && !disabled && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div
            data-modal-backdrop
            className="fixed inset-0 bg-black/50"
            onClick={() => {
              setIsOpen(false);
              if (!value && onCancel) {
                onCancel();
              }
            }}
          />
          <div
            ref={modalRef}
            data-modal-content
            className="relative bg-white rounded-lg shadow-xl
              max-w-sm w-full mx-auto z-10 animate-slide-down
              overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-[#2d3748]">
                Seleccionar {label}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  if (!value && onCancel) {
                    onCancel();
                  }
                }}
                className="p-2 text-gray-400 hover:text-gray-600
                  hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="max-h-[calc(100vh-8rem)] overflow-y-auto">
              {/* Input y error */}
              <div className="px-4">
                <div className="flex flex-col items-center space-y-3 py-4">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="DD/MM/YYYY"
                    className="w-full text-2xl text-center py-4 text-gray-800
                      rounded-md shadow-sm px-3
                      border border-gray-300 focus:border-[#1d5030] focus:ring-[#1d5030]
                      transition-colors duration-200
                      outline-none"
                  />
                  {error && (
                    <div
                      className="w-full bg-red-50 rounded-md px-3 py-2
                      flex items-center justify-center gap-2
                      animate-[slideDown_0.2s_ease-out]"
                    >
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <p className="text-base text-red-600">{error}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Separador */}
              <div className="border-t border-gray-200 my-2" />

              {/* Teclado numérico */}
              <div className="p-4">
                <div ref={keypadRef} className="grid grid-cols-3 gap-3">
                  {keypadButtons.map((button) => (
                    <button
                      key={button.value}
                      onClick={(e) => button.action(e, button.value)}
                      className={`
                        min-h-[56px] flex items-center justify-center
                        ${
                          button.variant === "secondary"
                            ? "text-gray-600 bg-gray-100 hover:bg-gray-200 active:bg-gray-300"
                            : "text-gray-700 bg-gray-50 hover:bg-gray-100 active:bg-gray-200"
                        }
                        ${
                          typeof button.value === "number"
                            ? "text-2xl"
                            : "text-lg"
                        }
                        font-medium rounded-lg
                        border border-gray-100
                        transition-transform duration-100
                        active:scale-[0.97]
                        focus:outline-none
                        disabled:opacity-50 disabled:cursor-not-allowed
                        select-none
                      `}
                    >
                      {button.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

CustomDateInput.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  onRemove: PropTypes.func,
  showRemoveWhenEmpty: PropTypes.bool,
  "data-date-input": PropTypes.string,
  onCancel: PropTypes.func,
};

export default CustomDateInput;

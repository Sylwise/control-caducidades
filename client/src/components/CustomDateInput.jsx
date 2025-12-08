import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { X, Calendar, AlertCircle, Mic, Trash2 } from "lucide-react";
import usePreventScroll from "../hooks/usePreventScroll";
import useVoiceDateParser from "../hooks/useVoiceDateParser";
import useHardwareBackButton from "../hooks/useHardwareBackButton";

const KeypadButton = memo(({ value, label, onClick, onMouseDown, onMouseUp, onTouchStart, onTouchEnd, variant = "primary", disabled = false, isMic = false }) => (
  <button
    onClick={(e) => onClick && onClick(e, value)}
    onMouseDown={onMouseDown}
    onMouseUp={onMouseUp}
    onTouchStart={onTouchStart}
    onTouchEnd={onTouchEnd}
    disabled={disabled}
    className={`
      h-12 sm:h-14 flex items-center justify-center
      ${
        variant === "secondary"
          ? "bg-white text-gray-400 hover:text-gray-600 active:bg-gray-50"
          : variant === "danger"
          ? "bg-red-500 text-white shadow-red-200"
          : "bg-white text-gray-800 hover:bg-gray-50 active:bg-gray-100"
      }
      ${typeof value === "number" ? "text-xl font-normal" : "text-lg font-medium"}
      rounded-md shadow-sm border border-gray-100
      transition-all duration-150
      active:scale-[0.98] active:shadow-inner
      focus:outline-none
      disabled:opacity-50 disabled:cursor-not-allowed
      select-none touch-manipulation
      ${isMic ? 'active:bg-red-600' : ''}
    `}
  >
    {label}
  </button>
));

KeypadButton.displayName = "KeypadButton";

const CustomDateInput = ({
  label,
  value,
  onChange,
  disabled = false,
  onRemove,
  showRemoveWhenEmpty = false,
  "data-date-input": dataDateInput,
  onCancel,
  RemoveIcon = X,
  minDate,
  maxDate,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const modalRef = useRef(null);
  const triggerRef = useRef(null);
  const recognitionRef = useRef(null);
  const valueRef = useRef(inputValue); // Ref to track value synchronously
  const { parseVoiceDate } = useVoiceDateParser();

  // --- Hardware Back Button Hook ---
  // Priority 40 - Highest (keyboard overlay)
  useHardwareBackButton(isOpen, () => {
    setIsOpen(false);
    if (!value && onCancel) {
      onCancel();
    }
  }, 40, 'date-input-keyboard');

  // Default ranges if not provided
  const effectiveMinDate = useMemo(() => {
    if (minDate) return new Date(minDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, [minDate]);

  const effectiveMaxDate = useMemo(() => {
    if (maxDate) return new Date(maxDate);
    const d = new Date();
    d.setFullYear(d.getFullYear() + 5);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [maxDate]);

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
        event.target.closest("[data-modal-backdrop]")
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

  // Scroll trigger into view on open (Mobile UX)
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      // Pequeño delay para asegurar que el teclado virtual o la UI se haya asentado
      setTimeout(() => {
        triggerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [isOpen]);

  // Validar fecha y rango
  const isValidDate = useCallback((day, month, year) => {
    const date = new Date(year, month - 1, day);
    return (
      date.getDate() === parseInt(day) &&
      date.getMonth() === month - 1 &&
      date.getFullYear() === parseInt(year)
    );
  }, []);


  const isDateInRange = useCallback((day, month, year) => {
    const inputDate = new Date(year, month - 1, day);
    const min = new Date(effectiveMinDate);
    min.setHours(0, 0, 0, 0);
    const max = new Date(effectiveMaxDate);
    max.setHours(23, 59, 59, 999);
    return inputDate >= min && inputDate <= max;
  }, [effectiveMinDate, effectiveMaxDate]);

  // Keep ref in sync with state for normal interactions
  useEffect(() => {
    valueRef.current = inputValue;
  }, [inputValue]);

  // Formatear entrada
  const formatInput = useCallback((input) => {
    const numbers = input.replace(/\D/g, "");
    let formatted = "";
    if (numbers.length > 0) formatted += numbers.substring(0, 2);
    if (numbers.length > 2) formatted += "/" + numbers.substring(2, 4);
    if (numbers.length > 4) formatted += "/" + numbers.substring(4, 8);
    return formatted;
  }, []);

  // Validar y actualizar valor
  const validateAndUpdate = useCallback(
    (dateString) => {
      const [day, month, year] = dateString.split("/").map(Number);

      if (dateString.length === 10) {
        if (!isValidDate(day, month, year)) {
          setError("Fecha inválida");
          return;
        }

        if (!isDateInRange(day, month, year)) {
          const min = new Date(effectiveMinDate);
          const max = new Date(effectiveMaxDate);
          if (new Date(year, month - 1, day) > max) {
             setError(`La fecha no puede ser posterior a ${max.toLocaleDateString('es-ES')}`);
          } else {
             setError(`La fecha no puede ser anterior a ${min.toLocaleDateString('es-ES')}`);
          }
          return;
        }

        setError("");
        const formattedDate = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
        onChange(formattedDate);
        setIsOpen(false);
      }
    },
    [isValidDate, isDateInRange, onChange, effectiveMinDate, effectiveMaxDate]
  );

  // Manejar entrada de teclado físico
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

  // Estado para la animación de error
  const [isShaking, setIsShaking] = useState(false);

  // Validación parcial "en vivo"
  const isValidPartial = (rawNumbers) => {
      const len = rawNumbers.length;
      if (len === 0) return true;

      const d1 = parseInt(rawNumbers[0]);
      
      // Dígito 1: Máximo 3 (0-3)
      if (len >= 1) {
          if (isNaN(d1) || d1 > 3) return false;
      }

      // Dígito 2: Si D1 es 3, D2 máx 1.
      if (len >= 2) {
          const d2 = parseInt(rawNumbers[1]);
          if (d1 === 3 && d2 > 1) return false;
          // Validación básica de 00 (no existe día 0) - Opcional, pero bueno tener
          if (d1 === 0 && d2 === 0) return false;
      }

      // Dígito 3: Mes decena (0-1)
      if (len >= 3) {
          const m1 = parseInt(rawNumbers[2]);
          if (m1 > 1) return false;
      }

      // Dígito 4: Mes unidad. Si M1 es 1, M2 máx 2.
      if (len >= 4) {
          const m1 = parseInt(rawNumbers[2]);
          const m2 = parseInt(rawNumbers[3]);
          if (m1 === 1 && m2 > 2) return false;
          if (m1 === 0 && m2 === 0) return false;
      }

      return true;
  };

  const triggerErrorFeedback = () => {
      // Vibración fuerte
      if (navigator.vibrate) navigator.vibrate(200);
      // Animación visual
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 200);
  };

  // Manejar clic en número del teclado (OPTIMIZADO: Sin debounce, lógica directa)
  const handleKeypadClick = useCallback((e, num) => {
    e.stopPropagation();
    
    setInputValue(prev => {
      // Si ya está lleno, reiniciar con el nuevo número (si es válido)
      if (prev.length === 10) {
        // Validar el primer dígito si reiniciamos
        if (num > 3) {
            triggerErrorFeedback();
            return prev; // Mantenemos valor anterior
        }
        if (navigator.vibrate) navigator.vibrate(10);
        setError("");
        return num.toString();
      }

      // Intentar añadir número
      let rawNumbers = prev.replace(/\D/g, "") + num;

      // VALIDACIÓN "EN VIVO"
      if (!isValidPartial(rawNumbers)) {
          triggerErrorFeedback();
          return prev; // Rechazamos el input
      }

      // Feedback de éxito (suave)
      if (navigator.vibrate) navigator.vibrate(10);

      // DETECCIÓN DE SHORTHAND (6 dígitos)
      // Si llegamos a 6 números, asumimos formato DDMMYY y expandimos a DDMM20YY
      if (rawNumbers.length === 6) {
        const day = rawNumbers.substring(0, 2);
        const month = rawNumbers.substring(2, 4);
        const year = rawNumbers.substring(4, 6);
        rawNumbers = `${day}${month}20${year}`;
      }

      // Formatear
      const newValue = formatInput(rawNumbers);
      
      // Validar si está completo (ahora será 10 chars si se expandió o si se escribió completo)
      if (newValue.length === 10) {
        // Necesitamos validar asíncronamente o en un efecto, pero para inmediatez visual
        // actualizamos el estado y dejamos que un efecto o la siguiente renderización maneje la validación final
        // OJO: validateAndUpdate depende de inputValue, pero aquí tenemos el newValue.
        // Llamamos directamente a validateAndUpdate con el nuevo valor.
        // Usamos setTimeout para permitir que el renderizado de UI ocurra primero (snappy feel)
        setTimeout(() => validateAndUpdate(newValue), 0);
      }
      
      return newValue;
    });
  }, [formatInput, validateAndUpdate]);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    setInputValue((prev) => {
      const newValue = prev.slice(0, -1);
      if (newValue.length < 10) setError("");
      return newValue;
    });
  }, []);

  const handleClear = useCallback((e) => {
    e && e.stopPropagation && e.stopPropagation();
    setInputValue("");
    setError("");
  }, []);

  // Voice Interaction Logic
  const handleStartListening = useCallback((e) => {
    e.preventDefault(); // Prevent focus loss or other default touch actions
    e.stopPropagation();
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Tu navegador no soporta reconocimiento de voz.");
      return;
    }

    if (navigator.vibrate) navigator.vibrate(50);
    setIsListening(true);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const parsedDate = parseVoiceDate(transcript);
      
      if (parsedDate) {
        // Walkie-Talkie Mode: Just update UI, don't validate/close yet
        const newFormatted = formatInput(parsedDate);
        setInputValue(newFormatted);
        valueRef.current = newFormatted; // Sync ref immediately for upcoming release event
      } else {
         // Error feedback if not understood (shaky)
         if (navigator.vibrate) navigator.vibrate(200);
         setError("No entendí la fecha");
      }
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
          setError("Permiso de micrófono denegado");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  }, [parseVoiceDate, formatInput]);

  const handleStopListening = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (recognitionRef.current) {
        recognitionRef.current.stop(); 
    }

    // Logic "On Release" (TouchEnd/MouseUp)
    // Check if we have a full valid date in the input
    // Use ref to avoid state closure looseness
    const currentVal = valueRef.current;
    
    if (currentVal.length === 10) {
        const [day, month, year] = currentVal.split("/").map(Number);
        if (isValidDate(day, month, year) && isDateInRange(day, month, year)) {
             // SUCCESS: Double Vibrate + Green Feedback + Close
             if (navigator.vibrate) navigator.vibrate([50, 50]);
             setIsSuccess(true);
             setTimeout(() => {
                 setIsSuccess(false);
                 validateAndUpdate(currentVal);
             }, 500);
        } else {
            // Invalid params but has text? Shake?
             // Maybe explicit error
             // validateAndUpdate handles errors but it closes modal? No, inside it sets error.
             validateAndUpdate(currentVal); 
        }
    }
    // If empty or partial, do nothing (keep open)
  }, [isValidDate, isDateInRange, validateAndUpdate]);

  // Configuración de botones memorizada
  const keypadButtons = useMemo(() => [
    ...Array(9).fill(null).map((_, i) => ({
      value: i + 1,
      label: (i + 1).toString(),
      action: handleKeypadClick,
    })),
    { value: "delete", label: "←", action: handleDelete, variant: "secondary" },
    { value: 0, label: "0", action: handleKeypadClick },
    { 
        value: "mic", 
        label: <Mic className={`w-6 h-6 ${isListening ? 'animate-pulse text-white' : ''}`} />, 
        action: () => {}, // Handled by separate events
        variant: isListening ? "danger" : "secondary", // Custom variant logic could be added
        isMic: true
    },
  ], [handleKeypadClick, handleDelete, isListening]);

  // Manejar teclado físico
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (/^\d$/.test(e.key)) {
        e.preventDefault();
        handleKeypadClick(e, parseInt(e.key));
      } else if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        handleDelete(e);
      } else if (e.key === "Escape") {
        e.preventDefault();
        inputValue ? handleClear(e) : setIsOpen(false);
      }
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeypadClick, handleDelete, handleClear, inputValue]);

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => !disabled && setIsOpen(true)}
          data-date-input={dataDateInput}
          disabled={disabled}
          className={`
            flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg w-full
            font-medium text-sm transition-all duration-200
            ${disabled
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white text-[#2d3748] hover:bg-gray-50 active:bg-gray-100"
            }
            border border-gray-200 shadow-sm hover:border-[#1d5030]/20
          `}
        >
          <Calendar className="w-4.5 h-4.5 text-[#1d5030]" />
          {value ? <span>{inputValue}</span> : <span className="text-gray-500">Seleccionar {label}</span>}
        </button>
        {onRemove && ((value && !disabled) || (!value && showRemoveWhenEmpty)) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RemoveIcon className="w-4.5 h-4.5" />
          </button>
        )}
      </div>

      {isOpen && !disabled && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center p-0 sm:p-4 animate-fade-in">
          <div
            data-modal-backdrop
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => {
              setIsOpen(false);
              if (!value && onCancel) onCancel();
            }}
          />
          <div
            ref={modalRef}
            data-modal-content
            className="relative z-10 bg-white w-full rounded-t-2xl rounded-b-none sm:rounded-2xl shadow-2xl sm:max-w-xs mx-auto animate-slideUp sm:animate-slide-down overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Display Section (White) */}
            <div className="bg-white px-5 pt-5 pb-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Seleccionar {label}
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    if (!value && onCancel) onCancel();
                  }}
                  className="text-gray-300 hover:text-gray-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col items-center space-y-1">
                <div className="relative w-full">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="DD/MM/YYYY"
                    autoComplete="off"
                    inputMode="none"
                    readOnly
                    className={`w-full text-3xl font-bold text-center py-1 bg-transparent border-none focus:ring-0 placeholder-gray-200 outline-none select-none pointer-events-none tracking-tight 
                        ${isShaking ? 'animate-shake text-red-600' : ''}
                        ${isSuccess ? 'text-green-600 scale-110 transition-all duration-300' : 'text-[#004D40]'}
                    `}
                  />
                  {inputValue && (
                     <button 
                        onClick={handleClear}
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-400 p-2 transition-colors active:scale-90"
                     >
                         <Trash2 className="w-5 h-5 opacity-50" />
                     </button>
                  )}
                </div>
                {error && (
                  <div className="flex items-center gap-1.5 text-red-500 animate-[slideDown_0.2s_ease-out]">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">{error}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Keypad Section (Light Gray) */}
            <div className="bg-gray-50 px-5 py-5 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-2.5">
                {keypadButtons.map((button) => (
                  <KeypadButton
                    key={button.value}
                    value={button.value}
                    label={button.label}
                    onClick={button.action}
                    variant={button.variant}
                    isMic={button.isMic}
                    onMouseDown={button.isMic ? handleStartListening : undefined}
                    onMouseUp={button.isMic ? handleStopListening : undefined}
                    onTouchStart={button.isMic ? handleStartListening : undefined}
                    onTouchEnd={button.isMic ? handleStopListening : undefined}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
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
  minDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  maxDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
};

export default CustomDateInput;

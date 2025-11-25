import { X, Undo2, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useState, useEffect } from "react";
import PropTypes from "prop-types";

const getToastStyles = (type) => {
  switch (type) {
    case "success":
      return {
        container: "bg-white border-l-4 border-[#1d5030] text-gray-800",
        icon: "text-[#1d5030]",
        button: "bg-[#1d5030]/10 text-[#1d5030] hover:bg-[#1d5030]/20",
        shadowColor: "rgba(29, 80, 48, 0.2)",
        Icon: CheckCircle,
      };
    case "error":
      return {
        container: "bg-white border-l-4 border-red-600 text-gray-800",
        icon: "text-red-600",
        button: "bg-red-600/10 text-red-600 hover:bg-red-600/20",
        shadowColor: "rgba(220, 38, 38, 0.2)",
        Icon: AlertCircle,
      };
    case "warning":
      return {
        container: "bg-white border-l-4 border-amber-500 text-gray-800",
        icon: "text-amber-600",
        button: "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20",
        shadowColor: "rgba(245, 158, 11, 0.2)",
        Icon: AlertTriangle,
      };
    case "info":
    default:
      return {
        container: "bg-white border-l-4 border-blue-500 text-gray-800",
        icon: "text-blue-600",
        button: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
        shadowColor: "rgba(59, 130, 246, 0.2)",
        Icon: Info,
      };
  }
};

const Toast = ({ toast, onRemove, onUndo }) => {
  const [isExiting, setIsExiting] = useState(false);
  const styles = getToastStyles(toast.type);
  const { Icon } = styles;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onRemove(toast.id);
      }, 150); // Duración de la animación de salida
    }, 5000); // Duración del toast aumentada a 5 segundos

    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const handleManualClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 150);
  };

  const showUndo = toast.message.endsWith("desclasificado correctamente.");

  const handleUndo = async () => {
    // Verificar que el ID del producto está disponible
    if (!toast.productId) {
      console.error("Error: Toast no contiene ID de producto para deshacer", toast);
      return;
    }

    console.log("Intentando deshacer con datos:", {
      message: toast.message,
      productId: toast.productId,
      hasUndoFunction: !!onUndo,
    });

    if (onUndo) {
      try {
        // Desactivar el botón temporalmente para evitar clics múltiples
        const buttonElement = document.querySelector(`button[data-toast-id="${toast.id}"]`);
        if (buttonElement) buttonElement.disabled = true;
        
        // Realizar la operación de deshacer
        const success = await onUndo(toast.productId);
        
        if (success) {
          handleManualClose();
        } else {
          // Si falla, permitir intentar de nuevo
          if (buttonElement) buttonElement.disabled = false;
          console.error("La operación de restauración no tuvo éxito");
        }
      } catch (error) {
        console.error("Error en handleUndo:", error);
        // Si hay una excepción, también permitir intentar de nuevo
        const buttonElement = document.querySelector(`button[data-toast-id="${toast.id}"]`);
        if (buttonElement) buttonElement.disabled = false;
      }
    } else {
      console.warn("No se puede deshacer: falta función onUndo", {
        productId: toast.productId,
        hasUndoFunction: !!onUndo
      });
    }
  };

  return (
    <div
      className={`
        ${styles.container}
        px-4 py-3.5 rounded-lg 
        shadow-[0_4px_12px_${styles.shadowColor}]
        flex items-center justify-between
        w-[calc(100vw-32px)] sm:w-auto sm:min-w-[320px] sm:max-w-md
        ${isExiting ? "animate-slide-out" : "animate-slide-in"}
        font-['Noto Sans'] text-sm
        transform transition-all duration-200
        border bg-gray-50/80
      `}
    >
      <div className="flex items-center gap-3 flex-1">
        <Icon className={`${styles.icon} w-5 h-5 flex-shrink-0`} />
        <span className="font-medium text-gray-700 tracking-wide leading-snug">{toast.message}</span>
      </div>
      <div className="flex items-center gap-2 ml-3">
        {showUndo && (
          <button
            onClick={handleUndo}
            data-toast-id={toast.id}
            className={`
              ${styles.button}
              px-3 py-1.5 rounded-md
              transition-colors duration-200
              flex items-center gap-1.5
              text-sm font-medium tracking-wide
              whitespace-nowrap
            `}
          >
            <Undo2 className="w-4 h-4" />
            Deshacer
          </button>
        )}
        <button
          onClick={handleManualClose}
          className={`
            ${styles.icon}
            p-1.5 rounded-full
            hover:bg-gray-100
            transition-colors duration-200
          `}
          aria-label="Cerrar notificación"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

Toast.propTypes = {
  toast: PropTypes.shape({
    id: PropTypes.number.isRequired,
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf(["success", "error", "warning", "info"]).isRequired,
    productId: PropTypes.string,
  }).isRequired,
  onRemove: PropTypes.func.isRequired,
  onUndo: PropTypes.func,
};

const ToastContainer = ({ toasts, removeToast, onUndo }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
      <div className="flex flex-col gap-2 items-end pointer-events-auto">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onRemove={removeToast}
            onUndo={onUndo}
          />
        ))}
      </div>
    </div>
  );
};

ToastContainer.propTypes = {
  toasts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      message: PropTypes.string.isRequired,
      type: PropTypes.oneOf(["success", "error", "warning", "info"]).isRequired,
      productId: PropTypes.string,
    })
  ).isRequired,
  removeToast: PropTypes.func.isRequired,
  onUndo: PropTypes.func,
};

export default ToastContainer;

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
      }, 300); // Duración de la animación de salida
    }, 4000); 

    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const handleManualClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  };

  const showUndo = toast.message.endsWith("desclasificado correctamente.");

  const handleUndo = async () => {
    if (!toast.productId) return;

    if (onUndo) {
      try {
        const buttonElement = document.querySelector(`button[data-toast-id="${toast.id}"]`);
        if (buttonElement) buttonElement.disabled = true;
        
        const success = await onUndo(toast.productId);
        
        if (success) {
          handleManualClose();
        } else {
          if (buttonElement) buttonElement.disabled = false;
        }
      } catch (error) {
        const buttonElement = document.querySelector(`button[data-toast-id="${toast.id}"]`);
        if (buttonElement) buttonElement.disabled = false;
      }
    }
  };

  return (
    <div
      className={`
        ${styles.container}
        px-4 py-3 rounded-2xl
        shadow-2xl
        flex items-center justify-between
        w-auto max-w-[90vw] sm:max-w-md
        ${isExiting ? "opacity-0 translate-y-10 scale-95" : "animate-slide-up-scale"}
        font-['Noto Sans'] text-sm
        transform transition-all duration-300 ease-out
        border pointer-events-auto
        mb-2 last:mb-0
      `}
      style={{
        boxShadow: `0 10px 25px -5px ${styles.shadowColor}, 0 8px 10px -6px ${styles.shadowColor}`
      }}
    >
      <div className="flex items-center gap-3 flex-1">
        <Icon className={`${styles.icon} w-5 h-5 flex-shrink-0`} />
        <span className="font-medium text-gray-800 tracking-wide leading-snug">{toast.message}</span>
      </div>
      <div className="flex items-center gap-2 ml-3">
        {showUndo && (
          <button
            onClick={handleUndo}
            data-toast-id={toast.id}
            className={`
              ${styles.button}
              px-3 py-1.5 rounded-lg
              transition-colors duration-200
              flex items-center gap-1.5
              text-xs font-bold tracking-wide uppercase
              whitespace-nowrap
            `}
          >
            <Undo2 className="w-3.5 h-3.5" />
            Deshacer
          </button>
        )}
        <button
          onClick={handleManualClose}
          className={`
            text-gray-400 hover:text-gray-600 hover:bg-black/5
            p-1.5 rounded-full
            transition-colors duration-200
          `}
          aria-label="Cerrar notificación"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

Toast.propTypes = {
  toast: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf(["success", "error", "warning", "info"]).isRequired,
    productId: PropTypes.string,
  }).isRequired,
  onRemove: PropTypes.func.isRequired,
  onUndo: PropTypes.func,
};

const ToastContainer = ({ toasts, removeToast, onUndo }) => {
  return (
    <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center pointer-events-none w-full">
      {/* Container wrapper for stacking */}
      <div className="flex flex-col items-center w-full">
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
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      message: PropTypes.string.isRequired,
      type: PropTypes.oneOf(["success", "error", "warning", "info"]).isRequired,
      productId: PropTypes.string,
    })
  ).isRequired,
  removeToast: PropTypes.func.isRequired,
  onUndo: PropTypes.func,
};

export default ToastContainer;

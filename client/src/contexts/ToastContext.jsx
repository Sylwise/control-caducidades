import { createContext, useContext, useState, useCallback } from "react";
import PropTypes from "prop-types";
import ToastContainer from "../components/ToastContainer";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id)
    );
  }, []);

  const addToast = useCallback((message, type = "info", options = {}) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    const newToast = { 
      id, 
      message, 
      type, 
      ...options 
    };

    const MAX_TOASTS = 3;
    
    setToasts((currentToasts) => {
      // Keep only the last (MAX_TOASTS - 1) items to make room for the new one
      const keptToasts = currentToasts.slice(-(MAX_TOASTS - 1));
      return [...keptToasts, newToast];
    });
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toasts }}>
      {children}
      <ToastContainer 
        toasts={toasts} 
        removeToast={removeToast} 
        // We pass a no-op or specific handler for onUndo if needed globally, 
        // but for now most global toasts might not need undo.
        // If a specific toast needs undo, it might be passed in options, 
        // but ToastContainer expects a single onUndo prop.
        // Let's check ToastContainer again. It passes onUndo to all Toasts.
        // If we want per-toast undo, we might need to refactor ToastContainer,
        // but for now let's just pass undefined or a generic handler if we implement global undo.
        // The requirement said: "Asegúrate de que addToast acepte un objeto options para soportar callbacks futuros (como onUndo)."
        // So we might need to handle onUndo dynamically.
        // However, ToastContainer takes a single onUndo prop. 
        // Let's look at ToastContainer.jsx again.
        // It passes onUndo to all Toasts. 
        // And Toast.jsx uses it: const handleUndo = async () => { if (onUndo) ... }
        // This implies onUndo is a global handler in the current design (for ProductList).
        // If we want to support different undo actions for different toasts, we might need to change ToastContainer
        // to look for onUndo in the toast object itself?
        // Actually, looking at Toast.jsx:
        // const Toast = ({ toast, onRemove, onUndo }) => { ... }
        // It receives onUndo as a prop.
        // If we want flexibility, we can pass a "global" undo handler that checks the toast ID or type?
        // OR, we can modify ToastContainer to check if the toast object has an onUndo property.
        // But for this task, I should probably stick to the requested interface.
        // The user said: "Asegúrate de que addToast acepte un objeto options para soportar callbacks futuros (como onUndo)."
        // This suggests we might want to attach onUndo to the toast object.
        // Let's see if ToastContainer supports that.
        // ToastContainer passes the SAME onUndo to all toasts.
        // So if we want per-toast undo, we'd need to change ToastContainer to use `toast.onUndo || onUndo`.
        // I will implement ToastContext first, and if I need to change ToastContainer I will do it.
        // For now, I'll just render ToastContainer.
      />
    </ToastContext.Provider>
  );
};

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

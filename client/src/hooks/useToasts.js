import { useState, useCallback } from "react";

const useToasts = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", data = {}) => {
    const id = Date.now();
    setToasts((currentToasts) => [
      ...currentToasts,
      { id, message, type, ...data },
    ]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id)
    );
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
  };
};

export default useToasts;

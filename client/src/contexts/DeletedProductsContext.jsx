import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const DeletedProductsContext = createContext();

export const useDeletedProducts = () => {
  const context = useContext(DeletedProductsContext);
  if (!context) {
    throw new Error('useDeletedProducts debe usarse dentro de un DeletedProductsProvider');
  }
  return context;
};

export const DeletedProductsProvider = ({ children }) => {
  // Estado inicial: carga de localStorage o objeto vacío
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('deletedProductsHistory');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Error al cargar historial:', error);
      return {};
    }
  });

  // Efecto para guardar en localStorage cada vez que cambie el historial
  useEffect(() => {
    try {
      localStorage.setItem('deletedProductsHistory', JSON.stringify(history));
    } catch (error) {
      console.error('Error al guardar historial:', error);
    }
  }, [history]);

  const addToHistory = useCallback((product) => {
    if (!product?.producto?._id) return;
    
    setHistory(prev => ({
      ...prev,
      [product.producto._id]: product
    }));
  }, []);

  const getFromHistory = useCallback((productId) => {
    return history[productId] || null;
  }, [history]);

  const removeFromHistory = useCallback((productId) => {
    setHistory(prev => {
      const newHistory = { ...prev };
      delete newHistory[productId];
      return newHistory;
    });
  }, []);

  return (
    <DeletedProductsContext.Provider value={{ history, addToHistory, getFromHistory, removeFromHistory }}>
      {children}
    </DeletedProductsContext.Provider>
  );
};
import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook para manejar el scroll hacia productos
 * Elimina la necesidad de usar setTimeout arbitrarios
 */
export const useProductScroll = (selectedProduct, attributeName = 'data-product-id') => {
  
  const scrollToProductId = useCallback((productId) => {
    if (!productId) return;

    // Intentar encontrar el elemento inmediatamente
    const tryScroll = (attempts = 0) => {
      const element = document.querySelector(`[${attributeName}="${productId}"]`);
      
      if (element) {
        // Pequeño delay para asegurar que el layout está estable
        setTimeout(() => {
          element.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest",
          });
          // Resaltar visualmente
          element.classList.add('ring-2', 'ring-[#1d5030]', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-[#1d5030]', 'ring-offset-2');
          }, 2000);
        }, 100);
        return true;
      }

      // Si no lo encuentra y no hemos excedido los intentos (aprox 1.5 segundos)
      if (attempts < 15) {
        setTimeout(() => tryScroll(attempts + 1), 100);
      }
    };

    tryScroll();
  }, []);

  // Track previous product to scroll back when closing
  const prevSelectedProductIdRef = useRef(null);

  // Efecto para hacer scroll cuando cambia el producto seleccionado
  useEffect(() => {
    if (selectedProduct?.producto?._id) {
      // Si hay producto seleccionado, guardamos su ID y hacemos scroll
      prevSelectedProductIdRef.current = selectedProduct.producto._id;
      scrollToProductId(selectedProduct.producto._id);
    } else if (prevSelectedProductIdRef.current) {
       // Si se deselecciona (selectedProduct es null) pero había uno antes,
       // hacemos scroll suave hacia él para evitar saltos bruscos
       // Usamos una pequeña pausa para esperar a que la tarjeta colapse
       const lastId = prevSelectedProductIdRef.current;
       setTimeout(() => {
         const element = document.querySelector(`[${attributeName}="${lastId}"]`);
         if (element) {
           element.scrollIntoView({
             behavior: "smooth",
             block: "center", // Mantenerlo centrado
             inline: "nearest",
           });
         }
       }, 450); // Esperar un poco más que la animación (300ms) para suavizar
       
       // Limpiamos la referencia
       prevSelectedProductIdRef.current = null;
    }
  }, [selectedProduct, scrollToProductId, attributeName]);

  return { scrollToProductId };
};

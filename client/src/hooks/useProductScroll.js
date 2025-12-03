import { useEffect, useCallback } from 'react';

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

  // Efecto para hacer scroll cuando cambia el producto seleccionado
  useEffect(() => {
    if (selectedProduct?.producto?._id) {
      scrollToProductId(selectedProduct.producto._id);
    }
  }, [selectedProduct, scrollToProductId]);

  return { scrollToProductId };
};

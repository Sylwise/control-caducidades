import { useEffect, useCallback } from 'react';

/**
 * Hook para manejar el scroll hacia productos
 * Elimina la necesidad de usar setTimeout arbitrarios
 */
export const useProductScroll = (selectedProduct) => {
  
  const scrollToProductId = useCallback((productId) => {
    if (!productId) return;

    // Usar requestAnimationFrame para asegurar que el DOM se ha actualizado
    requestAnimationFrame(() => {
      const element = document.querySelector(`[data-product-id="${productId}"]`);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      } else {
        // Un segundo intento por si acaso el renderizado es muy pesado
        requestAnimationFrame(() => {
            const el = document.querySelector(`[data-product-id="${productId}"]`);
            if (el) {
                el.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                    inline: "nearest",
                });
            }
        });
      }
    });
  }, []);

  // Efecto para hacer scroll cuando cambia el producto seleccionado
  useEffect(() => {
    if (selectedProduct?.producto?._id) {
      scrollToProductId(selectedProduct.producto._id);
    }
  }, [selectedProduct, scrollToProductId]);

  return { scrollToProductId };
};

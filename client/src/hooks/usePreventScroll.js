import { useEffect } from "react";

const usePreventScroll = (shouldPrevent) => {
  useEffect(() => {
    if (shouldPrevent) {
      // Guardar el scroll actual
      const scrollY = window.scrollY;

      // Prevenir scroll
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
    } else {
      // Restaurar scroll
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";

      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY.replace("-", "")) || 0);
      }
    }

    return () => {
      // Limpiar estilos al desmontar
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
    };
  }, [shouldPrevent]);
};

export default usePreventScroll;

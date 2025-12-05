import { useCallback } from "react";
import { getDaysUntilExpiry, isExpiringSoon, isExpired, isStrictlyExpired } from "../utils/dateUtils";

export const useExpiringProducts = (products) => {
  const calculateExpiringProducts = useCallback(() => {
    let count = 0;
    
    // Leer lista negra offline
    let offlineModifiedIds = [];
    try {
      offlineModifiedIds = JSON.parse(localStorage.getItem('offline_modified_ids') || '[]');
    } catch (e) {
      console.error("Error reading offline_modified_ids", e);
    }

    Object.values(products).forEach((productList) => {
      productList.forEach((product) => {
        // Filtrar si está en lista negra
        if (offlineModifiedIds.includes(product.producto._id)) return;

        if (isExpiringSoon(product.fechaFrente)) {
          count++;
        }
      });
    });
    return count;
  }, [products]);

  const getExpiringProducts = useCallback(() => {
    const expiringProducts = [];
    
    // Leer lista negra offline
    let offlineModifiedIds = [];
    try {
      offlineModifiedIds = JSON.parse(localStorage.getItem('offline_modified_ids') || '[]');
    } catch (e) {
      console.error("Error reading offline_modified_ids", e);
    }

    Object.values(products).forEach((productList) => {
      productList.forEach((product) => {
        // Filtrar si está en lista negra
        if (offlineModifiedIds.includes(product.producto._id)) return;

        const daysUntil = getDaysUntilExpiry(product.fechaFrente);
        if (daysUntil <= 14) {
          expiringProducts.push({
            ...product,
            daysUntilExpiry: daysUntil,
          });
        }
      });
    });
    return expiringProducts.sort(
      (a, b) => a.daysUntilExpiry - b.daysUntilExpiry
    );
  }, [products]);

  const getGroupedExpiringProducts = useCallback(() => {
    const products = getExpiringProducts();
    return {
      expired: {
        title: "Productos Caducados",
        color: "#991b1b",
        products: products.filter((p) => isStrictlyExpired(p.fechaFrente)),
      },
      critical: {
        title: "Caduca Hoy / Mañana",
        color: "#dc2626",
        products: products.filter(
          (p) => isExpired(p.fechaFrente) && !isStrictlyExpired(p.fechaFrente)
        ),
      },
      urgent: {
        title: "Caduca en 2-7 días",
        color: "#ea580c",
        products: products.filter(
          (p) => !isExpired(p.fechaFrente) && p.daysUntilExpiry < 7
        ),
      },
      warning: {
        title: "Caduca en 7-10 días",
        color: "#f97316",
        products: products.filter(
          (p) => p.daysUntilExpiry >= 7 && p.daysUntilExpiry <= 10
        ),
      },
      notice: {
        title: "Caduca en 11-14 días",
        color: "#ffb81c",
        products: products.filter(
          (p) => p.daysUntilExpiry >= 11 && p.daysUntilExpiry <= 14
        ),
      },
    };
  }, [getExpiringProducts]);

  return {
    calculateExpiringProducts,
    getExpiringProducts,
    getGroupedExpiringProducts,
  };
};

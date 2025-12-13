import { useCallback } from "react";
import { getDaysUntilExpiry, isExpiringSoon, isExpiredIncludingToday } from "../utils/dateUtils";

// Helper to find the most critical date for a product
const getNearestExpirationDate = (product) => {
  if (!product) return null;
  
  if (product.producto?.isDirectConsumption) {
    let dates = [];
    if (product.fechaAlmacen) dates.push(product.fechaAlmacen);
    if (product.fechasAlmacen && Array.isArray(product.fechasAlmacen)) {
      product.fechasAlmacen.forEach(f => {
        const d = typeof f === 'object' ? f.date : f;
        if (d) dates.push(d);
      });
    }
    
    if (dates.length === 0) return null;
    
    // Sort to find the earliest date
    dates.sort((a, b) => new Date(a) - new Date(b));
    return dates[0];
  } else {
    // Normal product: fechaFrente is the critical one for consumption/display
    return product.fechaFrente;
  }
};

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

        const criticalDate = getNearestExpirationDate(product);
        if (isExpiringSoon(criticalDate)) {
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

        const criticalDate = getNearestExpirationDate(product);
        const daysUntil = getDaysUntilExpiry(criticalDate);

        if (daysUntil <= 14) {
          expiringProducts.push({
            ...product,
            daysUntilExpiry: daysUntil,
            relevantDate: criticalDate,
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
        products: products.filter((p) => isExpiredIncludingToday(p.relevantDate)),
      },
      critical: {
        title: "Caduca Mañana",
        color: "#dc2626",
        products: products.filter(
            // Logic: Is NOT expired (so > Today) AND (<= Tomorrow)
            // Actually 'isExpiringSoon' usually checks <= 14 days.
            // We want specific buckets.
            // ExpiredIncludingToday = <= Today.
            // So here we want > Today.
            (p) => !isExpiredIncludingToday(p.relevantDate) && p.daysUntilExpiry <= 1
        ),
      },
      urgent: {
        title: "Caduca en 2-7 días",
        color: "#ea580c",
        products: products.filter(
          (p) => p.daysUntilExpiry > 1 && p.daysUntilExpiry < 7
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

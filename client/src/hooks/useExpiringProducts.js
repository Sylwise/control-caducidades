import { useCallback } from "react";
import { getDaysUntilExpiry, isExpiringSoon } from "../utils/dateUtils";

export const useExpiringProducts = (products) => {
  const calculateExpiringProducts = useCallback(() => {
    let count = 0;
    Object.values(products).forEach((productList) => {
      productList.forEach((product) => {
        if (isExpiringSoon(product.fechaFrente)) {
          count++;
        }
      });
    });
    return count;
  }, [products]);

  const getExpiringProducts = useCallback(() => {
    const expiringProducts = [];
    Object.values(products).forEach((productList) => {
      productList.forEach((product) => {
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
        products: products.filter((p) => p.daysUntilExpiry <= 0),
      },
      urgent: {
        title: "Caduca en menos de 7 días",
        color: "#dc2626",
        products: products.filter(
          (p) => p.daysUntilExpiry > 0 && p.daysUntilExpiry < 7
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

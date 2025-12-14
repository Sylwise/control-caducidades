import { memo, useMemo } from "react";
import PropTypes from "prop-types";
import { isExpired, isExpiredIncludingToday, formatDate } from "../utils/dateUtils";
import ProductFreshnessBadge from "./ProductCard/ProductFreshnessBadge";
import ProductStatusIndicator from "./ProductCard/ProductStatusIndicator";
import CompactProductRow from "./ProductCard/CompactView/CompactProductRow";
import ExpandedProductCard from "./ProductCard/ExpandedView/ExpandedProductCard";



const ProductCard = memo(({
  product,
  isSelected,
  isExpiringSoon,
  lastUpdatedProductId,
  onProductClick,
  onUpdateClick,
  onDeleteClick,
  viewMode = 'card',
  forceStacked = false,
}) => {

  const freshnessLevel = useMemo(() => {
    if (!product.updatedAt) return 0;
    const daysDiff = (new Date() - new Date(product.updatedAt)) / (1000 * 60 * 60 * 24);
    
    if (daysDiff > 7) return 3; // ABANDONED: > 7 days
    if (daysDiff > 4) return 2; // OLD: > 4 days
    if (daysDiff > 2) return 1; // STALE: > 2 days
    return 0; // FRESH
  }, [product.updatedAt]);

  const getStatusColor = () => {
    if (product.producto?.isDirectConsumption) {
       let hasExpired = false;
       let hasExpiringSoon = false;

       // Helper to check a single date
       const checkDate = (d) => {
         if (!d) return;
         if (isExpired(d)) hasExpired = true;
         else if (isExpiringSoon(d)) hasExpiringSoon = true;
       };

       // Check standard fields if they exist (though mostly only fechasAlmacen used)
       checkDate(product.fechaAlmacen);
       
       // Check array
       if (product.fechasAlmacen && Array.isArray(product.fechasAlmacen)) {
         product.fechasAlmacen.forEach(f => {
            const dateVal = typeof f === 'object' ? f.date : f;
            checkDate(dateVal);
         });
       }

       if (hasExpired) return 'bg-red-500 animate-pulse';
       if (hasExpiringSoon) return 'bg-[#ffb81c] animate-pulse';
       return null;
    }

    if (isExpired(product.fechaFrente)) return 'bg-red-500 animate-pulse';
    if (isExpiringSoon(product.fechaFrente)) return 'bg-[#ffb81c] animate-pulse';
    return null;
  };

  const isProductExpired = useMemo(() => {
    // Check Internal/Direct Consumption
    if (product.producto?.isDirectConsumption) {
       // Check standard field
       if (isExpiredIncludingToday(product.fechaAlmacen)) return true;
       // Check array
       if (product.fechasAlmacen && Array.isArray(product.fechasAlmacen)) {
         return product.fechasAlmacen.some(f => isExpiredIncludingToday(typeof f === 'object' ? f.date : f));
       }
       return false;
    }
    // Check Normal
    if (isExpiredIncludingToday(product.fechaFrente)) return true;
    return false;
  }, [product]);

  const nextDate = useMemo(() => {
    if (!product.fechasAlmacen || product.fechasAlmacen.length === 0 || !product.fechaFrente) return null;
    
    const frontTime = new Date(product.fechaFrente).getTime();
    if (isNaN(frontTime)) return null;

    const sortedDates = [...product.fechasAlmacen]
      .map(d => {
        // Handle both object structure {date, boxes} and simple date string
        const dateValue = d.date || d;
        const boxes = d.boxes !== undefined ? d.boxes : 1;
        return { date: dateValue, time: new Date(dateValue).getTime(), boxes };
      })
      .filter(d => !isNaN(d.time))
      .sort((a, b) => a.time - b.time);

    const next = sortedDates.find(d => d.time > frontTime);
    return next || null;
  }, [product.fechasAlmacen, product.fechaFrente]);

  const isSameDate = useMemo(() => {
     if (!product.fechaFrente || !product.fechaAlmacen) return false;
     return formatDate(product.fechaFrente) === formatDate(product.fechaAlmacen);
  }, [product.fechaFrente, product.fechaAlmacen]);

  return (
    <div
      data-product-id={product.producto?._id}
      onClick={() => onProductClick(product)}
      className={`
        w-full text-left 
        rounded-lg
        transition-all duration-300
        ${viewMode === 'compact' 
          ? `py-2 px-3 sm:px-2 border shadow-sm mb-2 hover:shadow-md select-none ${
              isProductExpired 
                ? 'bg-red-50/80 border-red-200' 
                : 'bg-white border-gray-200'
            }` 
          : `p-3 md:p-4 shadow hover:shadow-md border ${
               isProductExpired 
                 ? 'bg-red-50/30 border-red-200' 
                 : 'bg-white border-gray-200'
            }`
        }
        
        ${/* STYLES BASED ON FRESHNESS LEVEL */ ''}
        ${!isProductExpired ? (
          freshnessLevel === 0 ? "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50" :
          freshnessLevel === 1 ? "bg-[#fafafa] border-gray-300 hover:bg-gray-100" :
          freshnessLevel === 2 ? "bg-white border-amber-200/60 shadow-sm hover:bg-amber-50/10" :
          freshnessLevel === 3 ? "bg-gray-50 border-red-300/50 opacity-75 grayscale-[0.3] hover:opacity-100 hover:grayscale-0" : ""
        ) : ""}

        ${isSelected ? "ring-1 ring-[#1d5030]/30 bg-[#1d5030]/5" : ""}
        ${
          lastUpdatedProductId === product.producto?._id
            ? "animate-highlight bg-[#1d5030]/5"
            : ""
        }
        active:scale-[0.995]
        product-card
        cursor-pointer
      `}
    >
      {viewMode === 'compact' ? (
        <CompactProductRow
            product={product}
            isSelected={isSelected}
            onUpdateClick={onUpdateClick}
            onDeleteClick={onDeleteClick}
            getStatusColor={getStatusColor}
            freshnessLevel={freshnessLevel}
            isSameDate={isSameDate}
            nextDate={nextDate}
            forceStacked={forceStacked}
        />
      ) : (
        <ExpandedProductCard
            product={product}
            isSelected={isSelected}
            freshnessLevel={freshnessLevel}
            getStatusColor={getStatusColor}
            isProductExpired={isProductExpired}
            nextDate={nextDate}
            onUpdateClick={onUpdateClick}
            onDeleteClick={onDeleteClick}
        />
      )}
    </div>
  );
});

ProductCard.displayName = "ProductCard";

ProductCard.propTypes = {
  product: PropTypes.shape({
    producto: PropTypes.shape({
      _id: PropTypes.string,
      nombre: PropTypes.string,
    }),
    estado: PropTypes.string,
    fechaFrente: PropTypes.string,
    fechaAlmacen: PropTypes.string,
    fechasAlmacen: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          date: PropTypes.string,
          boxes: PropTypes.number
        })
      ])
    ),
    cajasAlmacen: PropTypes.number,
    cajaUnica: PropTypes.bool,
    hayOtrasFechas: PropTypes.bool,
    updatedAt: PropTypes.string,
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  isExpiringSoon: PropTypes.func.isRequired,
  lastUpdatedProductId: PropTypes.string,
  onProductClick: PropTypes.func.isRequired,
  onUpdateClick: PropTypes.func.isRequired,
  onDeleteClick: PropTypes.func.isRequired,
  viewMode: PropTypes.string,
  forceStacked: PropTypes.bool,
};

export default ProductCard;
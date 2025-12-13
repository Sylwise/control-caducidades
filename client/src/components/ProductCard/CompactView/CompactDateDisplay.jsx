import React from 'react';
import PropTypes from 'prop-types';
import { isExpiredIncludingToday } from '../../../utils/dateUtils';
import { Box, Package, PackageOpen } from 'lucide-react';

const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Fecha inválida";

    return date.getFullYear() !== new Date().getFullYear()
      ? `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}/${date.getFullYear().toString().slice(-2)}`
      : `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}`;
  } catch {
    return "Fecha inválida";
  }
};

const DateChip = ({ date, label, boxes, isSameDate = false }) => {
  const expired = isExpiredIncludingToday(date);
  
  return (
    <div className={`flex items-center justify-between gap-1.5 px-2 h-7 rounded border w-auto overflow-hidden ${
        expired ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'
    }`}>
      {label && <span className={`text-xs font-bold flex-shrink-0 ${expired ? 'text-red-700' : 'text-[#1d5030]'}`}>{label}:</span>}
      <span className={`font-medium truncate ${expired ? 'text-red-700' : 'text-gray-700'}`}>{formatDate(date)}</span>
      {boxes > 0 && !(boxes === 1 && !isSameDate) && ( // Show boxes logic from original. 
      // Original logic was inconsistent:
      // Direct: if boxes > 0 show `x${boxes}`
      // Normal SameDate: if boxes > 1 show `x${boxes}`
      // Normal F/A: if boxes > 0 show `x${boxes}`
      // I'll try to replicate or simplify. Let's pass "showBoxes" prop.
       <span className={`text-xs font-bold flex-shrink-0 ${expired ? 'text-red-600' : 'text-[#1d5030]'}`}>
         x{boxes}
       </span>
      )}
    </div>
  );
};

const CompactDateDisplay = ({ product, isSameDate, nextDate }) => {
  if (product.producto?.isDirectConsumption) {
      const allDates = [];
      if (product.fechaAlmacen) allDates.push({ date: product.fechaAlmacen, boxes: product.cajasAlmacen || 0 });
      if (product.fechasAlmacen && Array.isArray(product.fechasAlmacen)) {
          product.fechasAlmacen.forEach(f => {
              const d = typeof f === 'object' ? f.date : f;
              const b = typeof f === 'object' ? f.boxes : 1;
              if (d) allDates.push({ date: d, boxes: b });
          });
      }
      allDates.sort((a, b) => new Date(a.date) - new Date(b.date));

      if (allDates.length === 0) return <div className="col-span-2 text-gray-400 italic">Sin fechas</div>;

      return allDates.map((item, idx) => (
         <DateChip key={idx} date={item.date} boxes={item.boxes} /> // Direct consumption always showed boxes > 0
      ));
  }

  // Normal Logic
  if (isSameDate) {
    return (
      <>
        <DateChip date={product.fechaFrente} label="F/A" boxes={product.cajasAlmacen} isSameDate={true} />
        {nextDate && (
           <DateChip date={nextDate.date} label="A" boxes={nextDate.boxes} />
        )}
      </>
    );
  }

  return (
    <>
      {product.fechaFrente ? (
         <DateChip date={product.fechaFrente} label="F" />
      ) : (
         <div></div>
      )}
      {product.fechaAlmacen ? (
         <DateChip date={product.fechaAlmacen} label="A" boxes={product.cajasAlmacen} />
      ) : (
         <div></div>
      )}
    </>
  );
};

CompactDateDisplay.propTypes = {
  product: PropTypes.object.isRequired,
  isSameDate: PropTypes.bool,
  nextDate: PropTypes.object,
};

// Export internal components specifically if needed, but for now just default
export default CompactDateDisplay;

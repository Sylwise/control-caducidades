import React from 'react';
import PropTypes from 'prop-types';
import { Box, Package, PackageOpen } from 'lucide-react';
import { formatDate, isExpiredIncludingToday } from '../../../utils/dateUtils';

const CardDateGrid = ({ product, nextDate }) => {
  const badgeStyle = "bg-white px-2 py-0.5 rounded shadow-sm flex items-center gap-1 text-xs font-bold text-[#1d5030] border border-gray-100";

  // Función helper de renderizado
  const renderColumn = (title, date, badge, isDisabled) => {
     const isColExpired = date && isExpiredIncludingToday(date);
     return (
      <div className={`w-full bg-white border rounded-md overflow-hidden border-l-4 flex flex-col h-full ${
        isDisabled 
          ? 'border-gray-200 border-l-gray-300' 
          : isColExpired
             ? 'border-red-200 border-l-red-500' // Red for Expired
             : 'border-gray-200 border-l-[#1d5030]' // Standard Green
      }`}>
        <div className={`w-full h-9 flex justify-between items-center px-2 flex-shrink-0 ${
            isColExpired ? 'bg-red-50' : 'bg-slate-100'
        }`}>
          <span className={`text-xs font-bold uppercase tracking-wider ${
              isColExpired ? 'text-red-700' : 'text-gray-600'
          }`}>
            {title}
          </span>
          {badge && badge}
        </div>
        <div className={`p-2 text-center flex-1 flex items-center justify-center min-h-[44px] ${
            isDisabled ? 'bg-gray-50' 
            : isColExpired ? 'bg-red-50/10' 
            : ''
        }`}>
          {isDisabled || !date ? (
            <span className="text-sm font-medium text-gray-400 select-none">
              --
            </span>
          ) : (
            <div className={`text-lg font-bold leading-tight select-none ${
                isColExpired ? 'text-red-600' : 'text-gray-700'
            }`}>
              {formatDate(date)}
            </div>
          )}
        </div>
      </div>
    );
  };

  // CASE: DIRECT CONSUMPTION
  if (product.producto?.isDirectConsumption) {
       // Helper to extract and sort all dates
       const allDates = [];
       if (product.fechaAlmacen) {
           allDates.push({ 
               date: product.fechaAlmacen, 
               boxes: product.cajasAlmacen || 0 
           });
       }
       if (product.fechasAlmacen && Array.isArray(product.fechasAlmacen)) {
           product.fechasAlmacen.forEach(f => {
               const d = typeof f === 'object' ? f.date : f;
               const b = typeof f === 'object' ? f.boxes : 1;
               if (d) allDates.push({ date: d, boxes: b });
           });
       }
       // Sort by date ascending
       allDates.sort((a, b) => new Date(a.date) - new Date(b.date));

       if (allDates.length === 0) {
           return (
               <div className="col-span-2">
                   {renderColumn("FECHA DE CADUCIDAD", null, null, true)}
               </div>
           );
       }

       return (
           <div className="col-span-2 space-y-2">
               <div className="bg-slate-100 w-full h-9 flex items-center px-4 rounded-t-md border border-gray-200 border-b-0">
                   <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                     FECHAS DE CADUCIDAD
                   </span>
               </div>
               <div className="bg-white border border-gray-200 rounded-b-md p-2 space-y-2">
                   {allDates.map((item, idx) => {
                        const itemExpired = isExpiredIncludingToday(item.date);
                        return (
                           <div key={idx} className={`flex items-center justify-between p-2 rounded border ${
                               itemExpired ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'
                           }`}>
                                <span className={`text-sm font-bold ${
                                    itemExpired ? 'text-red-700' : 'text-gray-700'
                                }`}>
                                    {formatDate(item.date)}
                                </span>
                                {item.boxes > 0 && (
                                    <div className={badgeStyle}>
                                        <Package size={12} />
                                        <span>{item.boxes}</span>
                                    </div>
                                )}
                           </div>
                        );
                   })}
               </div>
           </div>
       );
  }
  
  // Default/Fallbacks
  let leftDate = product.fechaFrente;
  let rightDate = product.fechaAlmacen;
  let leftBadge = null;
  let rightBadge = null;
  let rightDisabled = false;
  
  const state = product.estado; // Move state definition here

  if (state === 'frente-agota') {
    // Caso 1: Frente y Agota (Stock solo en frente)
    rightDate = null;
    rightDisabled = true;
  } else if (state === 'abierto-cambia') {
    // Caso 3: Abierto y Cambia (Hay una caja abierta en almacén entre medias)
    leftBadge = (
      <div className={badgeStyle}>
        <Box size={12} />
        <span>+1</span>
      </div>
    );
    rightDate = nextDate ? nextDate.date : null; 
    if (!rightDate) rightDisabled = true; 
    
    if (nextDate && nextDate.boxes > 0) {
        rightBadge = (
            <div className={badgeStyle}>
                <Package size={12} />
                <span>{nextDate.boxes}</span>
            </div>
        );
    }

  } else if (state === 'abierto-agota') {
    // Caso 4: Abierto y Agota (Frente coincide con última caja en almacén)
    rightBadge = (
      <div className={badgeStyle}>
        <PackageOpen size={14} />
      </div>
    );
  } else {
    // Default / frente-cambia
    // Mostrar badge de stock en almacén si existe
    if (product.cajasAlmacen > 0) {
        rightBadge = (
            <div className={badgeStyle}>
                <Package size={12} />
                <span>{product.cajasAlmacen}</span>
            </div>
        );
    }
  }

  return (
    <>
      {renderColumn("FRENTE", leftDate, leftBadge, false)}
      {renderColumn("ALMACÉN", rightDate, rightBadge, rightDisabled)}
    </>
  );
};

CardDateGrid.propTypes = {
  product: PropTypes.object.isRequired,
  nextDate: PropTypes.object,
};

export default CardDateGrid;

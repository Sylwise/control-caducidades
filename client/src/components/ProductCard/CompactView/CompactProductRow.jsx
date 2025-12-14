import React from 'react';
import PropTypes from 'prop-types';
import { Edit3, Trash2 } from 'lucide-react';
import CompactDateDisplay from './CompactDateDisplay';
import ProductStatusIndicator from '../ProductStatusIndicator';
import ProductFreshnessBadge from '../ProductFreshnessBadge';

const CompactProductRow = ({
  product,
  isSelected,
  onUpdateClick,
  onDeleteClick,
  getStatusColor,
  freshnessLevel,
  isSameDate,
  nextDate,
  forceStacked = false,
}) => {
  return (
    <div className={`flex flex-wrap ${!forceStacked ? 'md:flex-nowrap' : ''} items-center w-full gap-y-1 md:gap-4 p-0`}>
      
      {/* 1. SECCIÓN NOMBRE */}
      <div className="order-1 flex items-center gap-3 flex-1 min-w-0">
        <span className="font-['Noto Sans'] font-medium text-gray-700 text-sm md:text-sm truncate block">
          {product.producto?.nombre}
        </span>
      </div>

      {/* 2. SECCIÓN BOTONES */}
      <div className={`order-2 ml-2 ${!forceStacked ? 'md:order-3 md:ml-0' : ''} flex items-center justify-end gap-2 md:gap-1 flex-shrink-0 min-h-[32px] w-[72px]`}>
         {!isSelected ? (
            <>
              <ProductStatusIndicator 
                  bgColorClass={getStatusColor() || 'hidden'} 
              />
              <ProductFreshnessBadge freshnessLevel={freshnessLevel} className="ml-2" />
            </>
         ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateClick(product, e);
                }}
                className="
                  flex items-center justify-center
                  h-8 w-8
                  text-gray-400 hover:text-[#1d5030] hover:bg-[#1d5030]/10 
                  rounded-full sm:rounded transition-colors
                "
                title="Editar"
              >
                <Edit3 className="w-5 h-5 md:w-4 md:h-4" />
              </button>
              {(product.estado !== "sin-clasificar" || product.fechaFrente || product.fechaAlmacen) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClick(product, e);
                  }}
                  className="
                    flex items-center justify-center
                    h-8 w-8
                    text-gray-400 hover:text-red-500 hover:bg-red-50 
                    rounded-full sm:rounded transition-colors
                  "
                  title="Eliminar"
                >
                  <Trash2 className="w-5 h-5 md:w-4 md:h-4" />
                </button>
              )}
            </>
         )}
      </div>

      {/* 3. SECCIÓN FECHAS */}
      <div className={`order-3 w-full ${!forceStacked ? 'md:order-2 md:w-[280px]' : ''}`}>
        <div className="flex flex-wrap gap-2 text-xs">
           <CompactDateDisplay 
               product={product} 
               isSameDate={isSameDate} 
               nextDate={nextDate} 
           />
        </div>
      </div>
    </div>
  );
};

CompactProductRow.propTypes = {
  product: PropTypes.object.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onUpdateClick: PropTypes.func.isRequired,
  onDeleteClick: PropTypes.func.isRequired,
  getStatusColor: PropTypes.func.isRequired,
  freshnessLevel: PropTypes.number.isRequired,
  isSameDate: PropTypes.bool,
  nextDate: PropTypes.object,
  forceStacked: PropTypes.bool,
};

export default CompactProductRow;

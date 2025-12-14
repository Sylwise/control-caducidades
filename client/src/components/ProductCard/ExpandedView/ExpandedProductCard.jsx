import React from 'react';
import PropTypes from 'prop-types';
import ProductStatusIndicator from '../ProductStatusIndicator';
import ProductFreshnessBadge from '../ProductFreshnessBadge';
import CardDateGrid from './CardDateGrid';
import CardActionButtons from './CardActionButtons';

const ExpandedProductCard = ({
  product,
  isSelected,
  freshnessLevel,
  getStatusColor,
  isProductExpired,
  nextDate,
  onUpdateClick,
  onDeleteClick,
}) => {
  return (
    <>
      <div className="flex items-center gap-2">
        <span className="font-['Noto Sans'] font-semibold text-gray-700 text-base flex-1 select-none">
          {product.producto?.nombre}
        </span>
        
        {/* Indicador de estado (punto) */}
        <ProductStatusIndicator 
          bgColorClass={getStatusColor() || 'hidden'} 
        />

        <ProductFreshnessBadge freshnessLevel={freshnessLevel} className="ml-2" />
      </div>

      {/* Contenido expandible */}
      <div
        className={`
          grid transition-[grid-template-rows] duration-300 ease-out
          ${isSelected ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}
        `}
      >
        <div className="overflow-hidden min-h-0">
          <div className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <CardDateGrid product={product} nextDate={nextDate} />
            </div>
            
            <CardActionButtons 
                product={product} 
                onUpdateClick={onUpdateClick} 
                onDeleteClick={onDeleteClick}
                isProductExpired={isProductExpired}
            />
          </div>
        </div>
      </div>
    </>
  );
};

ExpandedProductCard.propTypes = {
  product: PropTypes.object.isRequired,
  isSelected: PropTypes.bool.isRequired,
  freshnessLevel: PropTypes.number.isRequired,
  getStatusColor: PropTypes.func.isRequired,
  isProductExpired: PropTypes.bool.isRequired,
  nextDate: PropTypes.object,
  onUpdateClick: PropTypes.func.isRequired,
  onDeleteClick: PropTypes.func.isRequired,
};

export default ExpandedProductCard;

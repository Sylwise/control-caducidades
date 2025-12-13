import React from 'react';
import PropTypes from 'prop-types';
import { Edit3, Trash2 } from 'lucide-react';

const CardActionButtons = ({ product, onUpdateClick, onDeleteClick, isProductExpired }) => {
  return (
    <div className="flex items-center justify-between pt-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onUpdateClick(product, e);
        }}
        className={`flex-1 py-2 text-white rounded-md
          ${isProductExpired 
            ? "bg-red-500 hover:bg-red-600 shadow-md shadow-red-200" 
            : "bg-[#1d5030] hover:bg-[#1d5030]/90"
          }
          transition-colors duration-200
          font-medium text-sm select-none
          flex items-center justify-center gap-1.5
          shadow-sm hover:shadow
          mr-2
        `}
      >
        <Edit3 className="w-3.5 h-3.5" />
        Actualizar Estado
      </button>
      {(product.estado !== "sin-clasificar" ||
        product.fechaFrente ||
        product.fechaAlmacen) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick(product, e);
          }}
          className="min-w-[48px] h-[40px] flex items-center justify-center
            text-gray-400 rounded-md
            hover:text-red-500 hover:bg-red-50
            transition-colors duration-200
            active:bg-red-100"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

CardActionButtons.propTypes = {
  product: PropTypes.object.isRequired,
  onUpdateClick: PropTypes.func.isRequired,
  onDeleteClick: PropTypes.func.isRequired,
  isProductExpired: PropTypes.bool.isRequired,
};

export default CardActionButtons;

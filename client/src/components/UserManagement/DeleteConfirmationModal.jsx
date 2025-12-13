import React from 'react';
import PropTypes from 'prop-types';

const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm 
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4
        bg-black/50 animate-[fadeIn_0.2s_ease-out] select-none"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-lg shadow-xl
          animate-[slideIn_0.3s_ease-out] select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-2 select-none">
          ¿Eliminar usuario?
        </h3>
        <p className="text-gray-500 mb-4 select-none">
          Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-3 min-h-[48px] min-w-[100px] text-sm font-medium text-gray-700
              bg-gray-100 hover:bg-gray-200
              rounded-md transition-colors flex items-center justify-center select-none"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-3 min-h-[48px] min-w-[100px] text-sm font-medium text-white
              bg-red-500 hover:bg-red-600
              rounded-md transition-colors flex items-center justify-center select-none"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

DeleteConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default DeleteConfirmationModal;

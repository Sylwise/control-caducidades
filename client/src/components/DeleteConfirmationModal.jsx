import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, Trash2 } from 'lucide-react';
import ModalContainer from './ModalContainer';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, itemName }) => {
  const modalTitle = (
    <div className="flex items-center gap-2 text-red-600">
      <AlertTriangle className="w-5 h-5" />
      <span className="font-semibold">{title || 'Confirmar eliminación'}</span>
    </div>
  );

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
    >
      <div className="p-6">
        <p className="text-gray-600 mb-2">
          {message || '¿Estás seguro de que quieres eliminar este elemento?'}
        </p>
        {itemName && (
          <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100 mb-6">
            {itemName}
          </p>
        )}
        <p className="text-sm text-gray-500 mb-6">
          Esta acción no se puede deshacer.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center gap-2 transition-colors shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </button>
        </div>
      </div>
    </ModalContainer>
  );
};

DeleteConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  itemName: PropTypes.string
};

export default DeleteConfirmationModal;

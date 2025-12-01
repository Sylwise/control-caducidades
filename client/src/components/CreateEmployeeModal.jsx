import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Plus, RefreshCw, AlertCircle } from 'lucide-react';
import ModalContainer from './ModalContainer';
import CustomDateInput from './CustomDateInput';

const CreateEmployeeModal = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    fechaEntrada: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.fechaEntrada) {
      setError('Por favor completa todos los campos');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onCreate(formData);
      setFormData({ nombre: '', fechaEntrada: '' });
      onClose();
    } catch (err) {
      setError('Error al crear empleado');
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = (
    <div className="text-[#2d3748]">
      <span className="font-medium">Añadir Nuevo</span>
      <span className="block text-[#1d5030] font-semibold mt-1">
        Empleado
      </span>
    </div>
  );

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      title={title}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 p-5 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Nombre Input - Styled like CustomDateInput */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Nombre del Empleado
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej. Juan Pérez"
                className="w-full py-2.5 px-4 rounded-lg border border-gray-300 
                  text-gray-900 placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-[#1d5030]/50 focus:border-transparent
                  transition-all duration-200 shadow-sm hover:shadow-md"
              />
            </div>

            {/* Fecha Entrada - Using CustomDateInput */}
            <div className="relative">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Fecha de Entrada
              </h3>
              <CustomDateInput
                label="Seleccionar fecha"
                value={formData.fechaEntrada}
                onChange={(value) => setFormData({ ...formData, fechaEntrada: value })}
                className="w-full py-2.5 px-4 rounded-lg transition-all duration-200 font-medium text-sm select-none flex items-center justify-between shadow-sm hover:shadow-md"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-5 pt-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="min-h-[48px] px-5 text-sm font-medium 
              text-[#1d5030] border border-[#1d5030]/30
              bg-white hover:bg-[#1d5030]/5
              rounded-md transition-colors duration-200
              shadow-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="min-h-[48px] px-5 text-sm font-medium text-white
              bg-[#1d5030] hover:bg-[#1d5030]/90
              rounded-md transition-colors duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center gap-2
              shadow-sm"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Crear Empleado
              </>
            )}
          </button>
        </div>
      </div>
    </ModalContainer>
  );
};

CreateEmployeeModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired
};

export default CreateEmployeeModal;

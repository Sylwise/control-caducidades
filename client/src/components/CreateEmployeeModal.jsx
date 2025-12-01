import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { UserPlus, Calendar, User } from 'lucide-react';
import ModalContainer from './ModalContainer';

const CreateEmployeeModal = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    fechaEntrada: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onCreate(formData);
      setFormData({ nombre: '', fechaEntrada: '' }); // Reset form
      onClose();
    } catch (error) {
      console.error('Error creating employee:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <ModalContainer
      isOpen={isOpen}
      isClosing={false} // Simple handling for now
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <UserPlus size={20} />
          <span>Añadir Empleado</span>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre Completo
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              name="nombre"
              required
              value={formData.nombre}
              onChange={handleChange}
              className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-[#1d5030] focus:ring focus:ring-[#1d5030]/20 py-2 border"
              placeholder="Ej. Juan Pérez"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de Entrada
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={16} className="text-gray-400" />
            </div>
            <input
              type="date"
              name="fechaEntrada"
              required
              value={formData.fechaEntrada}
              onChange={handleChange}
              className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-[#1d5030] focus:ring focus:ring-[#1d5030]/20 py-2 border"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1d5030]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-[#1d5030] border border-transparent rounded-md hover:bg-[#1d5030]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1d5030] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Empleado'}
          </button>
        </div>
      </form>
    </ModalContainer>
  );
};

CreateEmployeeModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired
};

export default CreateEmployeeModal;

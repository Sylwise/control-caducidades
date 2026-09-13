
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Plus, RefreshCw, AlertCircle, Type, AlignLeft, Calendar as CalendarIcon, Flag } from "lucide-react";
import ModalContainer from "../ModalContainer";
import CustomDateInput from "../CustomDateInput";
import useHardwareBackButton from "../../hooks/useHardwareBackButton";

const TaskCreationModal = ({
  isOpen,
  onClose,
  onSubmit, // async function returning the task
}) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setForm({
        title: "",
        description: "",
        priority: "medium",
        dueDate: "",
      });
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Hardware Back Button (Priority 20, same as UpdateModal)
  useHardwareBackButton(isOpen, onClose, 20, 'create-task-modal');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleDateChange = (date) => {
    setForm(prev => ({ ...prev, dueDate: date }));
    if (errors.dueDate) {
      setErrors(prev => ({ ...prev, dueDate: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.title.trim()) {
      newErrors.title = "El título es obligatorio";
    }
    if (!form.dueDate) {
      newErrors.dueDate = "La fecha límite es obligatoria";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      console.error("Error creating task:", err);
      // Assume onSubmit handles toast errors or we set a general error here
      setErrors(prev => ({ ...prev, general: "Error al crear la tarea. Inténtalo de nuevo." }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = (
    <div className="text-[#2d3748]">
      <div className="flex items-center gap-2">
         <Plus className="w-5 h-5 text-[#1d5030]" />
         <span className="font-semibold text-[#1d5030]">Nueva Tarea</span>
      </div>
    </div>
  );

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      title={title}
    >
        <div className="flex flex-col h-full">
             <div className="flex-1 p-5 space-y-5 overflow-y-auto">
                 {/* Title */}
                 <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Type className="w-4 h-4 text-gray-400" />
                        Título
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        placeholder="Ej: Limpiar freidora"
                        className={`
                            w-full px-4 py-2.5 rounded-lg border 
                            ${errors.title ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-[#1d5030]/20 focus:border-[#1d5030]'}
                            focus:outline-none focus:ring-2 transition-all duration-200
                        `}
                    />
                    {errors.title && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors.title}
                        </p>
                    )}
                 </div>

                 {/* Description */}
                 <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <AlignLeft className="w-4 h-4 text-gray-400" />
                        Descripción <span className="text-gray-400 text-xs font-normal">(Opcional)</span>
                    </label>
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Detalles adicionales..."
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#1d5030]/20 focus:border-[#1d5030] focus:outline-none transition-all duration-200 resize-none"
                    />
                 </div>

                 {/* Valid date and Priority Row */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {/* Priority */}
                     <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Flag className="w-4 h-4 text-gray-400" />
                            Prioridad
                        </label>
                        <div className="relative">
                            <select
                                name="priority"
                                value={form.priority}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#1d5030]/20 focus:border-[#1d5030] focus:outline-none transition-all duration-200 appearance-none bg-white"
                            >
                                <option value="low">Baja</option>
                                <option value="medium">Media</option>
                                <option value="high">Alta</option>
                                <option value="urgent">Urgente</option>
                            </select>
                            {/* Custom Arrow */}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                     </div>

                     {/* Due Date */}
                     <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-gray-400" />
                            Fecha Límite
                        </label>
                        <CustomDateInput
                            label="Fecha Límite"
                            value={form.dueDate}
                            onChange={handleDateChange}
                            placeholder="Seleccionar"
                            data-date-input="create-task-dueDate"
                        />
                        {errors.dueDate && (
                            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3 h-3" /> {errors.dueDate}
                            </p>
                        )}
                     </div>
                 </div>

                 {errors.general && (
                     <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                         <AlertCircle className="w-4 h-4" />
                         {errors.general}
                     </div>
                 )}
             </div>

             <div className="flex justify-end gap-3 p-5 pt-3 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-medium text-[#1d5030] border border-[#1d5030]/30 bg-white hover:bg-[#1d5030]/5 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-[#1d5030] hover:bg-[#1d5030]/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Crear Tarea"
                  )}
                </button>
             </div>
        </div>
    </ModalContainer>
  );
};

TaskCreationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default TaskCreationModal;

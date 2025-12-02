import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Users, Plus, GraduationCap } from 'lucide-react';
import useEmployees from '../hooks/useEmployees';
import EmployeeCard from './EmployeeCard';
import CreateEmployeeModal from './CreateEmployeeModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { useOutletContext } from 'react-router-dom';

const TrainingDashboard = () => {
  // We can access context from MainLayout if needed, but we also have our own hooks
  // const { user } = useOutletContext(); // If we passed user via context
  // But AuthContext is global, so we can just use that if we needed user.
  // However, the component was receiving currentUser as prop.
  // Since it's now a route component, it won't receive props from App.jsx directly.
  // We need to get the user from AuthContext.
  
  // Let's import AuthContext
  // import { useContext } from 'react';
  // import AuthContext from '../contexts/AuthContext';
  // But wait, I can't add imports easily with write_to_file unless I rewrite the whole file.
  // I am rewriting the whole file.
  
  return <TrainingDashboardContent />;
};

// Inner component to use hooks
import { useContext } from 'react';
import AuthContext from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const TrainingDashboardContent = () => {
  const { user: currentUser } = useContext(AuthContext);
  const { addToast } = useToast();
  const { isCreateEmployeeModalOpen, setIsCreateEmployeeModalOpen } = useOutletContext();
  const { employees, loading, error, loadEmployees, createEmployee, deleteEmployee } = useEmployees();
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const handleCreateEmployee = async (data) => {
    try {
      await createEmployee({
        ...data,
        restaurante: currentUser?.restaurante?._id || currentUser?.restaurante
      });
      addToast("Empleado creado correctamente", "success");
      setIsCreateEmployeeModalOpen(false);
    } catch (err) {
      addToast(err.response?.data?.message || "Error al crear empleado", "error");
    }
  };

  const handleDeleteClick = (employee) => {
    setEmployeeToDelete(employee);
  };

  const handleCardSelect = (id) => {
    setSelectedEmployeeId(prev => prev === id ? null : id);
  };

  const handleConfirmDelete = async () => {
    if (employeeToDelete) {
      try {
        await deleteEmployee(employeeToDelete._id);
        addToast("Empleado eliminado correctamente", "success");
        setEmployeeToDelete(null);
      } catch (err) {
        addToast("Error al eliminar empleado", "error");
      }
    }
  };

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';

  return (
    <div className="min-h-screen" onClick={() => setSelectedEmployeeId(null)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Actions */}
        {/* Header Actions - Removed as it's now in HeaderSection */}

        {/* Content */}
        {loading && employees.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-24 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-[#1d5030] rounded-full animate-spin absolute top-0 left-0 border-t-transparent"></div>
            </div>
            <p className="text-gray-500 font-medium text-lg">Cargando equipo...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-sm relative" role="alert">
            <strong className="font-bold block mb-1">Error al cargar datos</strong>
            <span className="block sm:inline">{error}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(employees) && employees.map(employee => (
              <EmployeeCard
                key={employee._id}
                employee={employee}
                onDelete={canManage ? handleDeleteClick : undefined}
                isSelected={selectedEmployeeId === employee._id}
                onSelect={() => handleCardSelect(employee._id)}
              />
            ))}
            
            {employees.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-24 px-4 bg-white rounded-2xl border-2 border-dashed border-gray-200 shadow-sm">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <Users className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-[#1d5030] mb-2 text-center">No hay empleados registrados</h3>
                <p className="text-gray-500 text-center max-w-md mb-8">
                  Comienza añadiendo a los miembros de tu equipo para realizar un seguimiento de su formación y competencias.
                </p>
                {canManage && (
                  <button
                    onClick={() => setIsCreateEmployeeModalOpen(true)}
                    className="inline-flex items-center px-4 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-[#1d5030] hover:bg-[#153a23] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1d5030] transition-all"
                  >
                    <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Añadir Primer Empleado
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        <CreateEmployeeModal
          isOpen={isCreateEmployeeModalOpen}
          onClose={() => setIsCreateEmployeeModalOpen(false)}
          onCreate={handleCreateEmployee}
        />

        <DeleteConfirmationModal
          isOpen={!!employeeToDelete}
          onClose={() => setEmployeeToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Eliminar Empleado"
          message="¿Estás seguro de que quieres eliminar a este empleado del sistema?"
          itemName={employeeToDelete?.nombre}
        />
      </div>
    </div>
  );
};

export default TrainingDashboard;

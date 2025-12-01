import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Users, Plus, GraduationCap } from 'lucide-react';
import useEmployees from '../hooks/useEmployees';
import EmployeeCard from './EmployeeCard';
import CreateEmployeeModal from './CreateEmployeeModal';
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

const TrainingDashboardContent = () => {
  const { user: currentUser } = useContext(AuthContext);
  const { employees, loading, error, loadEmployees, createEmployee, deleteEmployee } = useEmployees();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const handleCreateEmployee = async (data) => {
    await createEmployee({
      ...data,
      restaurante: currentUser?.restaurante?._id || currentUser?.restaurante
    });
  };

  const handleDeleteEmployee = async (employee) => {
    if (window.confirm(`¿Estás seguro de eliminar a ${employee.nombre}?`)) {
      await deleteEmployee(employee._id);
    }
  };

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Actions */}
        {canManage && (
          <div className="flex justify-end pb-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-[#1d5030] hover:bg-[#153a23] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1d5030] transition-all transform hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              Añadir Empleado
            </button>
          </div>
        )}

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
                onDelete={canManage ? handleDeleteEmployee : undefined}
              />
            ))}
            
            {employees.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-24 bg-white rounded-2xl border-2 border-dashed border-gray-200 shadow-sm">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <Users className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No hay empleados registrados</h3>
                <p className="text-gray-500 text-center max-w-md mb-8">
                  Comienza añadiendo a los miembros de tu equipo para realizar un seguimiento de su formación y competencias.
                </p>
                {canManage && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-lg text-white bg-[#1d5030] hover:bg-[#153a23] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1d5030] transition-all"
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
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateEmployee}
        />
      </div>
    </div>
  );
};

export default TrainingDashboard;

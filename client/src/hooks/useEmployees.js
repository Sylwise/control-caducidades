import { useState, useCallback, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from './useSocket';

const useEmployees = () => {
  const { socket } = useSocket();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/employees');
      if (Array.isArray(response.data)) {
        setEmployees(response.data);
      } else {
        console.error('Expected array but got:', response.data);
        setEmployees([]);
        setError('Error: Formato de respuesta inválido');
      }
    } catch (err) {
      console.error('Error loading employees:', err);
      setError(err.response?.data?.message || 'Error al cargar empleados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (data) => {
      loadEmployees();
    };

    socket.on('employeesUpdate', handleUpdate);

    return () => {
      socket.off('employeesUpdate', handleUpdate);
    };
  }, [socket, loadEmployees]);

  const createEmployee = useCallback(async (employeeData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/employees', employeeData);
      setEmployees(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      console.error('Error creating employee:', err);
      setError(err.response?.data?.message || 'Error al crear empleado');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEmployee = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/employees/${id}`);
      setEmployees(prev => prev.filter(emp => emp._id !== id));
    } catch (err) {
      console.error('Error deleting employee:', err);
      setError(err.response?.data?.message || 'Error al eliminar empleado');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    employees,
    loading,
    error,
    loadEmployees,
    createEmployee,
    deleteEmployee
  };
};

export default useEmployees;

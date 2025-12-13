import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';
import { 
  Armchair, 
  Flame, 
  Sandwich, 
  Thermometer, 
  IceCream, 
  PackageCheck, 
  PlayCircle, 
  Car, 
  ShoppingBag, 
  Store, 
  Sunrise, 
  Moon,
  ArrowLeft,
  User,
  Calendar,
  Award,
  ChefHat,
  UtensilsCrossed,
  Leaf
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import competenciesConfig from '../config/competencies.json';
import AreaCard from './AreaCard';
import { useSocket } from '../hooks/useSocket';
import useHardwareBackButton from "../hooks/useHardwareBackButton";

// Icon Mapping
const ICON_MAP = {
  Armchair,
  Flame,
  Sandwich,
  Thermometer,
  IceCream,
  PackageCheck,
  PlayCircle,
  Car,
  ShoppingBag,
  Store,
  Sunrise,
  Moon,
  ChefHat,
  UtensilsCrossed,
  Leaf
};

const EmployeeDetail = () => {
  const { user } = useContext(AuthContext);
  const { socket } = useSocket();
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Hardware Back Button Hook ---
  // Priority 10: Exit detail view and return to dashboard
  useHardwareBackButton(true, () => navigate('/training'), 10, 'employee-detail-back');

  useEffect(() => {
    fetchEmployee();
  }, [employeeId]);

  const fetchEmployee = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await api.get(`/employees/${employeeId}`);
      setEmployee(response.data);
    } catch (err) {
      console.error('Error fetching employee:', err);
      setError('Error al cargar los datos del empleado');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (data) => {
      if (data.employeeId === employeeId) {
        if (data.type === 'delete') {
          alert('Este empleado ha sido eliminado por otro usuario.');
          navigate('/training');
        } else {
          // Silent update for other changes
          fetchEmployee(false);
        }
      }
    };

    socket.on('employeesUpdate', handleUpdate);

    return () => {
      socket.off('employeesUpdate', handleUpdate);
    };
  }, [socket, employeeId, navigate]);

  const handleToggleCompetence = async (areaId, taskId, completed) => {
    // 1. Optimistic Update
    const previousEmployee = { ...employee };
    
    setEmployee(prev => {
      const newCompetencies = { ...prev.competencias };
      
      if (!newCompetencies[areaId]) {
        newCompetencies[areaId] = {};
      }

      if (completed) {
        newCompetencies[areaId][taskId] = {
          completed: true,
          date: new Date().toISOString(),
          certifiedBy: user?.username || 'Sistema',
        };
      } else {
        if (newCompetencies[areaId][taskId]) {
          delete newCompetencies[areaId][taskId];
        }
      }

      return {
        ...prev,
        competencias: newCompetencies
      };
    });

    // 2. API Call
    try {
      await api.put(`/employees/${employeeId}/competence`, {
        areaId,
        taskId,
        completed
      });
      // Optionally refetch to get the server-side data (like certifiedBy populated)
      // But for now, we trust the optimistic update or wait for next reload
    } catch (err) {
      console.error('Error updating competence:', err);
      // 3. Revert on Error
      setEmployee(previousEmployee);
      // Show toast or alert
      alert('Error al actualizar la competencia');
    }
  };

  // Calculate Global Progress
  const calculateGlobalProgress = () => {
    if (!employee) return 0;
    
    let totalTasks = 0;
    let completedTasks = 0;

    competenciesConfig.forEach(area => {
      totalTasks += area.tasks.length;
      area.tasks.forEach(task => {
        if (employee.competencias?.[area.id]?.[task.id]?.completed) {
          completedTasks++;
        }
      });
    });

    return totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1d5030]"></div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
        <p className="text-gray-600 mb-6">{error || 'Empleado no encontrado'}</p>
        <button 
          onClick={() => navigate('/training')}
          className="px-4 py-2 bg-[#1d5030] text-white rounded-lg hover:bg-[#153a23]"
        >
          Volver al Panel
        </button>
      </div>
    );
  }

  const globalProgress = calculateGlobalProgress();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gray-50 pb-12 select-none"
    >
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm shadow-sm transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => navigate('/training')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{employee.nombre}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <User size={14} />
                  {employee.puesto || 'Empleado'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {new Date(employee.fechaEntrada).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Global Progress Bar */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#1d5030] transition-all duration-500 ease-out rounded-full"
                style={{ width: `${globalProgress}%` }}
              />
            </div>
            <div className="flex items-center gap-2 min-w-[80px]">
              <Award size={16} className="text-[#1d5030]" />
              <span className="font-bold text-[#1d5030]">{globalProgress}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile View (Single Column, Natural Order) */}
        <div className="flex flex-col gap-6 lg:hidden">
          {competenciesConfig.map(area => (
            <AreaCard
              key={area.id}
              area={area}
              competencies={employee.competencias?.[area.id]}
              onToggle={handleToggleCompetence}
              Icon={ICON_MAP[area.icon] || Store}
            />
          ))}
        </div>

        {/* Desktop View (Two Independent Flex Columns) */}
        <div className="hidden lg:flex gap-6 items-start">
          {/* Left Column (Even Indices: 0, 2, 4...) */}
          <div className="flex flex-col gap-6 flex-1 w-full">
            {competenciesConfig.filter((_, i) => i % 2 === 0).map(area => (
              <AreaCard
                key={area.id}
                area={area}
                competencies={employee.competencias?.[area.id]}
                onToggle={handleToggleCompetence}
                Icon={ICON_MAP[area.icon] || Store}
              />
            ))}
          </div>

          {/* Right Column (Odd Indices: 1, 3, 5...) */}
          <div className="flex flex-col gap-6 flex-1 w-full">
            {competenciesConfig.filter((_, i) => i % 2 !== 0).map(area => (
              <AreaCard
                key={area.id}
                area={area}
                competencies={employee.competencias?.[area.id]}
                onToggle={handleToggleCompetence}
                Icon={ICON_MAP[area.icon] || Store}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EmployeeDetail;

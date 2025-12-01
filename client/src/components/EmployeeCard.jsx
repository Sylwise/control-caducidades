import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Trash2, Calendar, ChevronRight, Utensils, Store, Sun, Moon, Award } from 'lucide-react';
import { calculateEmployeeProgress } from '../utils/progressCalculator';

const CircularProgress = ({ percentage, icon: Icon, label, color }) => {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-12 h-12 flex items-center justify-center">
        {/* Background Circle */}
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            cx="24"
            cy="24"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="3"
            fill="transparent"
          />
          {/* Progress Circle */}
          <circle
            cx="24"
            cy="24"
            r={radius}
            stroke={color}
            strokeWidth="3"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Icon in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon size={16} className="text-gray-500" />
        </div>
      </div>
      <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      <span className="text-xs font-bold text-gray-600">{percentage}%</span>
    </div>
  );
};

CircularProgress.propTypes = {
  percentage: PropTypes.number.isRequired,
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
};

const EmployeeCard = ({ employee, onDelete, isSelected, onSelect }) => {
  // Calculate seniority
  const seniority = useMemo(() => {
    if (!employee.fechaEntrada) return 'N/A';
    const start = new Date(employee.fechaEntrada);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} días`;
    const months = Math.floor(diffDays / 30);
    if (months < 12) return `${months} meses`;
    const years = Math.floor(months / 12);
    return `${years} años`;
  }, [employee.fechaEntrada]);

  // Calculate progress for each area
  const progressData = useMemo(() => {
    return calculateEmployeeProgress(employee);
  }, [employee]);

  const isExpert = useMemo(() => {
    return Object.values(progressData).every(val => val === 100);
  }, [progressData]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Get initials for avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate a consistent color based on name
  const getAvatarColor = (name) => {
    const colors = [
      'bg-[#1d5030]/10 text-[#1d5030]',
      'bg-[#c17817]/10 text-[#c17817]',
      'bg-gray-100 text-gray-700',
      'bg-[#1d5030]/20 text-[#1d5030]',
      'bg-[#c17817]/20 text-[#c17817]',
      'bg-gray-200 text-gray-800'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getProgressColor = (percentage) => {
    if (percentage === 100) return '#1d5030'; // Green
    if (percentage >= 50) return '#c17817'; // Orange
    return '#9ca3af'; // Gray
  };

  return (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`bg-white rounded-xl shadow hover:shadow-md transition-all duration-200 border flex flex-col h-full overflow-hidden group cursor-pointer ${
        isSelected 
          ? 'ring-2 ring-[#1d5030]/50 bg-[#1d5030]/5 border-[#1d5030]/50' 
          : isExpert
            ? 'border-yellow-400/50 bg-yellow-50/50 shadow-yellow-100 hover:border-yellow-400'
            : 'border-gray-300/50 hover:border-gray-300'
      }`}
    >
      {/* Header */}
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${getAvatarColor(employee.nombre)}`}>
            {getInitials(employee.nombre)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-gray-800 text-base leading-tight truncate max-w-[140px]" title={employee.nombre}>
                {employee.nombre}
              </h3>
              {isExpert && (
                <Award size={18} className="text-yellow-500 fill-yellow-500/20" />
              )}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
              <Calendar size={10} className="text-gray-400" />
              <span>{formatDate(employee.fechaEntrada)}</span>
              <span className="text-gray-300">•</span>
              <span>{seniority}</span>
            </div>
          </div>
        </div>
        
        {onDelete && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(employee);
            }}
            className={`text-gray-300 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors focus:opacity-100 ${
              isSelected ? 'opacity-100 text-red-500' : 'opacity-0 group-hover:opacity-100'
            }`}
            title="Eliminar empleado"
            aria-label="Eliminar empleado"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Progress Section */}
      <div className="px-4 pb-4 flex-1">
        <div className="grid grid-cols-4 gap-2 mt-2">
          <CircularProgress 
            percentage={progressData.COCINA} 
            icon={Utensils} 
            label="Cocina" 
            color={getProgressColor(progressData.COCINA)} 
          />
          <CircularProgress 
            percentage={progressData.FRENTE} 
            icon={Store} 
            label="Frente" 
            color={getProgressColor(progressData.FRENTE)} 
          />
          <CircularProgress 
            percentage={progressData.APERTURA} 
            icon={Sun} 
            label="Apertura" 
            color={getProgressColor(progressData.APERTURA)} 
          />
          <CircularProgress 
            percentage={progressData.CIERRE} 
            icon={Moon} 
            label="Cierre" 
            color={getProgressColor(progressData.CIERRE)} 
          />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-2.5 border-t border-gray-100 mt-auto">
        <Link to={`/training/${employee._id}`} className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-[#1d5030] hover:text-[#153a23] transition-all active:scale-95 group/btn">
          Ver Ficha Completa
          <ChevronRight size={14} className="transition-transform group-hover/btn:translate-x-1" />
        </Link>
      </div>
    </div>
  );
};

EmployeeCard.propTypes = {
  employee: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    nombre: PropTypes.string.isRequired,
    fechaEntrada: PropTypes.string.isRequired,
    competencias: PropTypes.object
  }).isRequired,
  onDelete: PropTypes.func,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func
};

export default EmployeeCard;

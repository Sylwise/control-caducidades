
import { useState, useEffect } from "react";
import { CheckCircle2, Clock, AlertTriangle, ListTodo, Ban } from "lucide-react";
import { useTasks } from "../../contexts/TaskContext";
import PropTypes from "prop-types";

const StatCard = ({ label, value, icon: Icon, color, subLabel }) => (
    <div className="bg-white p-3 sm:p-4 rounded-xl shadow border border-gray-200 flex items-center gap-3 sm:gap-4 transition-all hover:shadow-md h-full">
        <div className={`p-2.5 sm:p-3 rounded-full flex-shrink-0 ${color}`}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0">
            <p className="text-gray-500 text-xs sm:text-sm font-medium truncate">{label}</p>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800">{value}</h3>
            {subLabel && <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 truncate">{subLabel}</p>}
        </div>
    </div>
);

StatCard.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    icon: PropTypes.elementType.isRequired,
    color: PropTypes.string.isRequired,
    subLabel: PropTypes.string,
};

const TaskStats = ({ currentFilter, onFilterChange }) => {
    const { tasks } = useTasks();
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        completed: 0,
        cancelled: 0,
        overdue: 0
    });

    useEffect(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const newStats = tasks.reduce((acc, task) => {
            acc.total++;
            if (task.status === 'completed') {
                acc.completed++;
            } else if (task.status === 'cancelled') {
                acc.cancelled++;
            } else if (task.status === 'pending') {
                acc.pending++;
                const dueDate = new Date(task.dueDate);
                if (dueDate < today) {
                    acc.overdue++;
                }
            }
            return acc;
        }, { total: 0, pending: 0, completed: 0, cancelled: 0, overdue: 0 });

        setStats(newStats);
    }, [tasks]);

    const statConfig = [
        { 
            id: 'all', 
            label: 'Total', 
            value: stats.total, 
            icon: ListTodo, 
            color: 'bg-gray-50 text-gray-600 border-gray-200',
            activeColor: 'bg-gray-100 text-gray-800 border-gray-300'
        },
        { 
            id: 'pending', 
            label: 'Pendientes', 
            value: stats.pending, 
            icon: Clock, 
            color: 'bg-[#1d5030]/5 text-[#1d5030] border-[#1d5030]/10',
            activeColor: 'bg-[#1d5030]/10 text-[#1d5030] border-[#1d5030]/30'
        },
        { 
            id: 'completed', 
            label: 'Listas', 
            value: stats.completed, 
            icon: CheckCircle2, 
            color: 'bg-green-50 text-green-700 border-green-200',
            activeColor: 'bg-green-100 text-green-800 border-green-300'
        },
        {
            id: 'cancelled', label: 'Canceladas', value: stats.cancelled, icon: Ban,
            color: 'bg-gray-50 text-gray-600 border-gray-200',
            activeColor: 'bg-gray-100 text-gray-800 border-gray-300'
        },
        { 
            id: 'overdue', 
            label: 'Vencidas', 
            value: stats.overdue, 
            icon: AlertTriangle, 
            color: 'bg-red-50 text-red-700 border-red-200',
            activeColor: 'bg-red-100 text-red-800 border-red-300'
        }
    ];

    return (
        <>
            {/* Mobile: Grid Filter Chips */}
            <div className="grid grid-cols-2 sm:hidden gap-3 mb-6">
                {statConfig.map((stat) => {
                    const isActive = currentFilter === stat.id;
                    const Icon = stat.icon;
                    return (
                        <button
                            key={stat.id}
                            onClick={() => onFilterChange(stat.id)}
                            className={`
                                flex items-center justify-between px-4 py-3 rounded-xl border transition-all w-full
                                ${isActive 
                                    ? `${stat.activeColor} shadow-md` 
                                    : 'bg-white border-gray-100 text-gray-600 shadow-sm'
                                }
                            `}
                        >
                            <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4" />
                                <span className="font-medium text-sm">{stat.label}</span>
                            </div>
                            <span className={`
                                text-xs px-2 py-0.5 rounded-full font-bold
                                ${isActive ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}
                            `}>
                                {stat.value}
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* Desktop: Grid Cards */}
            <div className="hidden sm:grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {statConfig.map((stat) => (
                    <StatCard 
                        key={stat.id}
                        label={stat.label === 'Listas' ? 'Completadas' : stat.label} // Restore full label for desktop
                        value={stat.value} 
                        icon={stat.icon} 
                        color={stat.color.split(' ').slice(0, 2).join(' ')} // Extract base colors
                        subLabel={
                            stat.id === 'completed' 
                            ? `${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% completado`
                            : stat.id === 'pending' ? 'En curso' 
                            : stat.id === 'overdue' ? 'Requieren atención' 
                            : null
                        }
                    />
                ))}
            </div>
        </>
    );
};

TaskStats.propTypes = {
    currentFilter: PropTypes.string,
    onFilterChange: PropTypes.func
};

export default TaskStats;


import PropTypes from "prop-types";
import { useTasks } from "../../contexts/TaskContext";
import TaskCard from "./TaskCard";
import { useMemo } from "react";
import { Loader2, ClipboardList } from "lucide-react";

const TaskList = ({ statusFilter, searchQuery, onTaskClick }) => {
    const { tasks, loading } = useTasks();

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            // Status Filter
            if (statusFilter === 'overdue') {
                 const today = new Date();
                 today.setHours(0,0,0,0);
                 const dueDate = new Date(task.dueDate);
                 if (dueDate >= today || task.status !== 'pending') return false;
            } else if (statusFilter !== 'all' && task.status !== statusFilter) {
                return false;
            }
            
            // Search Filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesTitle = task.title.toLowerCase().includes(query);
                const matchesDesc = task.description?.toLowerCase().includes(query);
                if (!matchesTitle && !matchesDesc) return false;
            }
            
            return true;
        })
        .sort((a, b) => {
            // Sort by status (pending first) then by dueDate (sooner first)
            const order = { pending: 0, completed: 1, cancelled: 2 };
            if (a.status !== b.status) return order[a.status] - order[b.status];
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
    }, [tasks, statusFilter, searchQuery]);

    if (loading && tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Loader2 className="w-10 h-10 animate-spin mb-3" />
                <p>Cargando tareas...</p>
            </div>
        );
    }

    if (filteredTasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                <ClipboardList className="w-16 h-16 mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-gray-600">No hay tareas encontradas</h3>
                <p className="text-sm">Intenta ajustar los filtros o crea una nueva tarea.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
            {filteredTasks.map(task => (
                <TaskCard 
                    key={task._id} 
                    task={task} 
                    data-task-id={task._id}
                    onClick={() => onTaskClick && onTaskClick(task)}
                />
            ))}
        </div>
    );
};

TaskList.propTypes = {
    statusFilter: PropTypes.string.isRequired,
    searchQuery: PropTypes.string.isRequired,
    onTaskClick: PropTypes.func,
};

export default TaskList;


import { useState, useEffect, useContext } from "react";
import { Plus, Filter, Search } from "lucide-react";
import { useTasks } from "../../contexts/TaskContext";
import AuthContext from "../../contexts/AuthContext";
import DeleteConfirmationModal from "../DeleteConfirmationModal";
import { useToast } from "../../contexts/ToastContext";
import { useProductScroll } from "../../hooks/useProductScroll";
import TaskCreationModal from "./TaskCreationModal";
import TaskDetailModal from "./TaskDetailModal";
import TaskList from "./TaskList";
import TaskStats from "./TaskStats";

const TasksPage = () => {
    const { tasks, fetchTasks, createTask, deleteTask, error } = useTasks();
    const { user } = useContext(AuthContext);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const { addToast } = useToast();

    const [taskToDelete, setTaskToDelete] = useState(null);

    const handleDeleteRequest = (task) => {
        setTaskToDelete(task);
    };

    const handleConfirmDelete = async () => {
        if (!taskToDelete) return;

        try {
             await deleteTask(taskToDelete._id);
             addToast("Tarea eliminada correctamente", "success");
        } catch (err) {
             console.error(err);
             addToast("Error al eliminar la tarea", "error");
        } finally {
             setTaskToDelete(null);
        }
    };

    // Hook for scrolling to new tasks
    const { scrollToProductId } = useProductScroll(null, 'data-task-id');

    // Fetch tasks on mount
    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const handleCreateTask = async (taskData) => {
        try {
            const newTask = await createTask(taskData);
            addToast("Tarea creada exitosamente", "success");
            
            // Scroll to new task and highlight it
            if (newTask?._id) {
                // If filter is active and hides the new task, maybe we should reset it?
                // For now user just asked for scroll.
                scrollToProductId(newTask._id);
            }
        } catch (err) {
            console.error(err);
            addToast("Error al crear la tarea", "error");
            throw err; // Re-throw so modal knows it failed
        }
    };

    // Date formatting options
    const dateOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const currentDate = new Date().toLocaleDateString('es-ES', dateOptions);
    const formattedDate = currentDate.charAt(0).toUpperCase() + currentDate.slice(1);

    return (
        <div className="container mx-auto px-4 md:px-4 py-6 max-w-5xl">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex flex-col items-center sm:items-start w-full sm:w-auto">
                   <h1 className="text-2xl font-bold text-[#1d5030] font-['Noto Sans']">
                       Gestión de Tareas
                   </h1>

                   {/* Subtitle Info Row */}
                   <div className="flex flex-col sm:flex-row items-center sm:items-start text-gray-500 text-sm gap-0.5 sm:gap-2 mt-1">
                        <span className="font-medium text-gray-600">
                            {user?.restaurante?.nombre ? user.restaurante.nombre : 'Cargando...'}
                        </span>
                        <span className="hidden sm:inline text-gray-400">·</span>
                        <span className="font-semibold text-gray-700">{formattedDate}</span>
                   </div>
                </div>
                
                {(user?.role === 'admin' || user?.role === 'supervisor') && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-[#1d5030] text-white px-4 py-2.5 rounded-lg font-medium shadow-md hover:bg-[#1d5030]/90 active:scale-95 transition-all mt-4 sm:mt-0"
                    >
                        <Plus className="w-5 h-5" />
                        Nueva Tarea
                    </button>
                )}
            </div>

            {/* Stats Overview (Mobile: Chips/Filters, Desktop: Cards) */}
            <TaskStats 
                currentFilter={filterStatus}
                onFilterChange={setFilterStatus}
            />

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl shadow border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="Buscar tarea..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1d5030]/20 focus:border-[#1d5030] transition-all"
                    />
                </div>
                
                <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
                    <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    {['all', 'pending', 'completed'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`
                                px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                                ${filterStatus === status 
                                    ? 'bg-[#1d5030]/10 text-[#1d5030] border border-[#1d5030]/20' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'}
                            `}
                        >
                            {status === 'all' ? 'Todas' : status === 'pending' ? 'Pendientes' : 'Completadas'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Task List */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 flex items-center gap-2">
                    <span>Error al cargar tareas: {error}</span>
                </div>
            )}

            <TaskList 
                statusFilter={filterStatus} 
                searchQuery={searchQuery}
                onTaskClick={(task) => setSelectedTaskId(task._id)}
                onDeleteRequest={handleDeleteRequest}
            />

            {/* Modals */}
            <TaskCreationModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateTask}
            />

            <TaskDetailModal
                isOpen={!!selectedTaskId}
                onClose={() => setSelectedTaskId(null)}
                task={tasks.find(t => t._id === selectedTaskId)}
                currentUserId={user?.id || user?._id}
            />

            <DeleteConfirmationModal
                isOpen={!!taskToDelete}
                onClose={() => setTaskToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Eliminar Tarea"
                message="¿Estás seguro de que deseas eliminar esta tarea permanentemente?"
                itemName={taskToDelete?.title}
            />
        </div>
    );
};

export default TasksPage;

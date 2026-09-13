
import PropTypes from "prop-types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, CheckCircle2, Clock, Trash2, MessageCircle } from "lucide-react";
import { useTasks } from "../../contexts/TaskContext";
import { useToast } from "../../contexts/ToastContext";
import AuthContext from "../../contexts/AuthContext";
import { useState, useContext } from "react";

const getPriorityColor = (priority) => {
    switch (priority) {
        case 'urgent': return 'text-red-600 bg-red-50 border-red-100';
        case 'high': return 'text-orange-600 bg-orange-50 border-orange-100';
        case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-100';
        case 'low': return 'text-blue-600 bg-blue-50 border-blue-100';
        default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
};

const getPriorityLabel = (priority) => {
    switch (priority) {
        case 'urgent': return 'Urgente';
        case 'high': return 'Alta';
        case 'medium': return 'Media';
        case 'low': return 'Baja';
        default: return priority;
    }
};

const TaskCard = ({ task, onClick, onDeleteRequest, 'data-task-id': dataTaskId }) => {
    const { user } = useContext(AuthContext);
    const { completeTask } = useTasks();
    const { addToast } = useToast();
    const [isCompleting, setIsCompleting] = useState(false);

    const handleComplete = async (e) => {
        e.stopPropagation();
        try {
            setIsCompleting(true);
            await completeTask(task._id);
            addToast("Tarea completada", "success");
        } catch (error) {
            console.error(error);
            addToast("Error al completar tarea", "error");
        } finally {
            setIsCompleting(false);
        }
    };

    const isPending = task.status === 'pending';
    const dueDate = new Date(task.dueDate);
    const isOverdue = isPending && dueDate < new Date() && dueDate.toDateString() !== new Date().toDateString();

    return (
        <div
            onClick={onClick}
            data-task-id={dataTaskId}
            className={`
            relative bg-white rounded-xl p-4 shadow border transition-all duration-200 cursor-pointer
            ${task.status === 'completed' ? 'opacity-75 bg-gray-50 border-gray-200' : 'border-gray-200 hover:shadow-md hover:border-[#1d5030]/30'}
        `}>
             {/* Strikethrough for completed removed - replaced with text decoration */}

            <div className="flex justify-between items-start mb-3">
                <span className={`
                    px-2.5 py-0.5 rounded-full text-xs font-medium border
                    ${getPriorityColor(task.priority)}
                `}>
                    {getPriorityLabel(task.priority)}
                </span>

                {/* Delete Icon - Only for Admin/Supervisor */}
                {(user?.role === 'admin' || user?.role === 'supervisor') && onDeleteRequest && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteRequest(task);
                        }}
                        className="p-1.5 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-lg transition-colors"
                        title="Eliminar tarea"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            <h3 className={`font-semibold text-gray-800 mb-2 line-clamp-2 ${task.status === 'completed' ? 'text-gray-500 line-through decoration-gray-400 decoration-2' : ''}`}>
                {task.title}
            </h3>
            
            {task.description && (
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                    {task.description}
                </p>
            )}

            <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                <div className={`flex items-center gap-1.5 text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                    <Calendar className="w-4 h-4" />
                    <span>
                        {format(dueDate, "d MMM", { locale: es })}
                    </span>
                    {isOverdue && <span className="text-xs bg-red-100 text-red-600 px-1.5 rounded">Vencida</span>}
                </div>

                {isPending ? (
                    <button
                        onClick={handleComplete}
                        disabled={isCompleting}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-[#1d5030] hover:text-white text-gray-600 rounded-lg text-sm font-medium transition-colors"
                    >
                        {isCompleting ? <Clock className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        {isCompleting ? "..." : "Completar"}
                    </button>
                ) : (
                    <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        Completada
                    </div>
                )}
            </div>
            
            {/* Comments Badge (Future) */}
            {task.comments?.length > 0 && (
                <div className="absolute -bottom-2 right-4 bg-white border px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-1 text-xs text-blue-600">
                    <MessageCircle className="w-3 h-3" /> {task.comments.length}
                </div>
            )}
        </div>
    );
};

TaskCard.propTypes = {
    task: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        description: PropTypes.string,
        priority: PropTypes.string,
        status: PropTypes.string,
        dueDate: PropTypes.string.isRequired,
        comments: PropTypes.array
    }).isRequired,
    onClick: PropTypes.func,
    onDeleteRequest: PropTypes.func,
};

export default TaskCard;

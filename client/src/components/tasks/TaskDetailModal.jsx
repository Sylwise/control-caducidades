
import { useState, useEffect, useRef, useContext } from "react";
import PropTypes from "prop-types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
    Calendar, Flag, CheckCircle2, Clock, Trash2, Send, User, MessageSquare, ChevronDown, ChevronUp 
} from "lucide-react";
import ModalContainer from "../ModalContainer";
import useHardwareBackButton from "../../hooks/useHardwareBackButton";
import { useTasks } from "../../contexts/TaskContext";
import { useToast } from "../../contexts/ToastContext";
import AuthContext from "../../contexts/AuthContext";
import { getTaskType } from "../../constants/taskConstants";

const getPriorityLabel = (priority) => {
    switch (priority) {
        case 'urgent': return { label: 'Urgente', color: 'text-red-700 bg-red-50 border-red-200' };
        case 'high': return { label: 'Alta', color: 'text-orange-700 bg-orange-50 border-orange-200' };
        case 'medium': return { label: 'Media', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' };
        case 'low': return { label: 'Baja', color: 'text-blue-700 bg-blue-50 border-blue-200' };
        default: return { label: priority, color: 'text-gray-700 bg-gray-50 border-gray-200' };
    }
};

const CommentItem = ({ comment, currentUserId }) => {
    // Robust comparison: handle populated user object (with _id) vs raw ID string, and mixed types (ObjectId vs String)
    const commentUserId = comment.user?._id || comment.user;
    const isOwn = commentUserId && currentUserId && (commentUserId.toString() === currentUserId.toString());
    const date = new Date(comment.createdAt);
    
    return (
            <div className={`flex gap-3 max-w-[90%] ${isOwn ? 'ml-auto flex-row-reverse' : ''}`}>
            <div className={`
                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                ${isOwn ? 'bg-[#1d5030] text-white' : 'bg-gray-200 text-gray-500'}
            `}>
                <span className="text-xs font-bold">
                    {(comment.user?.name || comment.user?.username)?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                </span>
            </div>
            
            <div className={`
                flex flex-col 
                ${isOwn ? 'items-end' : 'items-start'}
            `}>
                <div className={`
                    px-4 py-2 rounded-2xl text-sm
                    ${isOwn 
                        ? 'bg-[#1d5030] text-white rounded-tr-none' 
                        : 'bg-gray-100 text-gray-800 rounded-tl-none'
                    }
                `}>
                    <p>{comment.text}</p>
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1">
                    {format(date, "d MMM HH:mm", { locale: es })}
                    {comment.user?.name ? ` · ${comment.user.name}` : ''}
                </span>
            </div>
        </div>
    );
};

CommentItem.propTypes = {
    comment: PropTypes.object.isRequired,
    currentUserId: PropTypes.string,
};

import DeleteConfirmationModal from "../DeleteConfirmationModal";

const TaskDetailModal = ({
    isOpen,
    onClose,
    task,
    currentUserId,
}) => {
    const { addComment, completeTask, deleteTask, isOnline } = useTasks();
    const { addToast } = useToast();
    const { user } = useContext(AuthContext);
    const currentUserRole = user?.role;
    
    const [newComment, setNewComment] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    const commentsBottomRef = useRef(null);

    // Hardware Back Button (Priority 20)
    useHardwareBackButton(isOpen, onClose, 20, 'task-detail-modal');

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setIsCommentsOpen(false);
            setNewComment("");
        }
    }, [isOpen]);

    // Scroll to bottom ONLY when a new comment is added (length changes), not on initial open
    useEffect(() => {
        if (isOpen && isCommentsOpen && commentsBottomRef.current && task?.comments?.length > 0) {
            handleScrollToBottom();
        }
    }, [task?.comments?.length, isCommentsOpen, isOpen]); 

    // Auto-scroll when submitting a new comment locally
    const handleScrollToBottom = () => {
        commentsBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    if (!task) return null;

    const handleSendComment = async () => {
        if (!newComment.trim()) return;
        
        setIsSubmittingComment(true);
        try {
            await addComment(task._id, newComment);
            setNewComment("");
            setIsCommentsOpen(true); // Auto-open comments to see the new one
            setTimeout(handleScrollToBottom, 100); // Small delay to let render update
        } catch (error) {
            console.error(error);
            addToast("Error al enviar comentario", "error");
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleComplete = async () => {
        setIsActionLoading(true);
        try {
            await completeTask(task._id);
            addToast("Tarea completada", "success");
            onClose();
        } catch {
           addToast("Error al completar", "error");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDeleteClick = () => {
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        setIsActionLoading(true);
        try {
            await deleteTask(task._id);
            addToast("Tarea eliminada", "success");
            onClose();
        } catch {
           addToast("Error al eliminar", "error");
        } finally {
            setIsActionLoading(false);
            setIsDeleteModalOpen(false); // Close modal regardless of success/failure
        }
    };

    const priorityInfo = getPriorityLabel(task.priority);
    const taskType = getTaskType(task.type);
    const isCompleted = task.status === 'completed';

    const title = (
        <div className="flex items-center gap-2 text-[#2d3748] min-w-0">
             <span className="font-semibold truncate">{task.title}</span>
        </div>
    );

    return (
        <>
            <ModalContainer
                isOpen={isOpen}
                onClose={onClose}
                title={title}
            >
                <div className="flex flex-col h-full bg-gray-50">
                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto">
                        {/* Task Details Section */}
                        <div className="bg-white p-5 border-b border-gray-100">
                            {/* Status & Priority Badges */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${taskType.className}`}>
                                    {taskType.label}
                                </span>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${priorityInfo.color} flex items-center gap-1`}>
                                    <Flag className="w-3 h-3" /> {priorityInfo.label}
                                </span>
                                {isCompleted ? (
                                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> Completada
                                    </span>
                                ) : (
                                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Pendiente
                                    </span>
                                )}
                                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> {format(new Date(task.dueDate), "dd MMM yyyy", { locale: es })}
                                </span>
                            </div>

                            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                                {task.description || <span className="italic text-gray-400">Sin descripción</span>}
                            </p>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-6 pt-4 border-t border-gray-50 text-xs text-gray-400">
                                <span>Creada por: {task.createdBy?.name || task.createdBy?.username || 'Usuario'}</span>
                                {task.completedBy && (
                                    <span>Completada por: {task.completedBy?.name || task.completedBy?.username}</span>
                                )}
                            </div>
                        </div>

                        {/* Comments Section */}
                        <div className="p-5">
                            <button 
                                onClick={() => setIsCommentsOpen(!isCommentsOpen)}
                                className="flex items-center justify-between w-full text-sm font-semibold text-gray-700 mb-4 hover:bg-gray-100 p-2 -ml-2 rounded-lg transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Comentarios ({task.comments?.length || 0})
                                </div>
                                {isCommentsOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                            </button>

                            {isCommentsOpen && (
                                <div className="space-y-4 animate-fade-in">
                                    {task.comments?.length > 0 ? (
                                        task.comments.map((comment, index) => (
                                            <CommentItem 
                                                key={comment._id || index} // MongoDB usually provides _id, but fallback to index if missing
                                                comment={comment} 
                                                currentUserId={currentUserId} 
                                            />
                                        ))
                                    ) : (
                                        <div className="text-center py-6 text-gray-400 text-sm italic">
                                            No hay comentarios aún.
                                        </div>
                                    )}
                                    <div ref={commentsBottomRef} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions & Input */}
                    <div className="bg-white p-3 border-t border-gray-200">
                        {/* Input Area */}
                        <div className="flex gap-2 mb-3">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                disabled={!isOnline}
                                placeholder="Escribe un comentario..."
                                rows={1}
                                className="flex-1 px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1d5030]/20 focus:bg-white transition-all resize-none overflow-hidden"
                                style={{ minHeight: '44px' }}
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendComment();
                                    }
                                }}
                            />
                            <button
                                onClick={handleSendComment}
                                disabled={!isOnline || !newComment.trim() || isSubmittingComment}
                                className="p-3 bg-[#1d5030] text-white rounded-xl hover:bg-[#1d5030]/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {isSubmittingComment ? <Clock className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </button>
                        </div>

                    {/* Main Actions */}
                    <div className="flex gap-3 pt-2">
                        {!isCompleted && (
                            <button 
                                onClick={handleComplete}
                                disabled={isActionLoading || !isOnline}
                                className="flex-1 flex items-center justify-center gap-2 bg-[#1d5030] text-white hover:bg-[#1d5030]/90 px-4 py-3 rounded-xl font-medium transition-all active:scale-95 shadow-sm"
                            >
                                <CheckCircle2 className="w-5 h-5" /> 
                                <span>Completar</span>
                            </button>
                        )}
                        
                        {(currentUserRole === 'admin' || currentUserRole === 'supervisor') && (
                            <button 
                                onClick={handleDeleteClick}
                                disabled={isActionLoading || !isOnline}
                                className={`
                                    flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-xl font-medium transition-all active:scale-95 shadow-sm
                                    ${!isCompleted ? 'p-3 aspect-square' : 'flex-1 py-3 px-4'}
                                `}
                                title="Eliminar tarea"
                            >
                                <Trash2 className="w-5 h-5" /> 
                                {isCompleted && <span>Eliminar</span>}
                            </button>
                        )}
                    </div>
                    </div>
                </div>
            </ModalContainer>

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Eliminar Tarea"
                message="¿Estás seguro de que deseas eliminar esta tarea permanentemente?"
                itemName={task.title}
            />
        </>
    );
};

TaskDetailModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    task: PropTypes.object,
    currentUserId: PropTypes.string,
};

export default TaskDetailModal;

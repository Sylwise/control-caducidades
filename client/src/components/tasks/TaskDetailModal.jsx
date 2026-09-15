import { useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Calendar, CheckCircle2, Clock, MessageSquare } from "lucide-react";
import ModalContainer from "../ModalContainer";
import useHardwareBackButton from "../../hooks/useHardwareBackButton";
import { useTasks } from "../../contexts/TaskContext";
import { useToast } from "../../contexts/ToastContext";
import AuthContext from "../../contexts/AuthContext";
import { getTaskType, TASK_STATES, getTaskPermissions } from "../../constants/taskConstants";
import TaskActivity from "./TaskActivity";
import { getTaskActivity, actorName, activityDate } from "../../utils/taskActivity";
import TaskReasonModal from "./TaskReasonModal";

const priorityLabels = { urgent: "Urgente", high: "Alta", medium: "Media", low: "Baja" };
const TaskDetailModal = ({ isOpen, onClose, task, onEdit }) => {
  const { addComment, completeTask, cancelTask, reopenTask, isOnline } = useTasks();
  const { addToast } = useToast();
  const { user } = useContext(AuthContext);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [action, setAction] = useState(null);
  useHardwareBackButton(isOpen, onClose, 20, "task-detail");
  useEffect(() => {
    setComment(""); setAction(null); setSaving(false);
  }, [isOpen, task?._id]);
  useEffect(() => { if (!isOnline) setAction(null); }, [isOnline]);
  if (!task) return null;
  const permissions = getTaskPermissions(user?.role, task.status);
  const type = getTaskType(task.type);
  const state = TASK_STATES[task.status] || TASK_STATES.pending;
  const activity = getTaskActivity(task);
  const lastTransition = [...activity].reverse().find((event) => event.type !== "created");
  const submitComment = async () => {
    if (!isOnline || saving || !comment.trim()) return;
    setSaving(true);
    try { await addComment(task._id, comment.trim()); setComment(""); }
    catch (err) { addToast(err.message || "Error al comentar", "error"); }
    finally { setSaving(false); }
  };
  const complete = async () => {
    if (!isOnline || saving) return;
    setSaving(true);
    try { await completeTask(task._id); addToast("Tarea completada", "success"); }
    catch (err) { addToast(err.message || "Error al completar", "error"); }
    finally { setSaving(false); }
  };
  const transition = async (reason) => {
    if (action === "cancel") await cancelTask(task._id, reason);
    else await reopenTask(task._id, reason);
    addToast(action === "cancel" ? "Tarea cancelada" : "Tarea reabierta", "success");
  };
  return (
    <>
      <ModalContainer isOpen={isOpen} onClose={onClose} title={task.title}>
        <div className="flex flex-col h-full bg-gray-50">
          <div className="flex-1 overflow-y-auto">
            <div className="bg-white p-5 border-b border-gray-100">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${type.className}`}>{type.label}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${state.className}`}>{state.label}</span>
                <span className="px-2.5 py-1 rounded-full text-xs border border-gray-200">{priorityLabels[task.priority]}</span>
                <span className="px-2.5 py-1 rounded-full text-xs border border-gray-200 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {activityDate(task.dueDate).split(" ").slice(0, 3).join(" ")}
                </span>
              </div>
              <p className="text-gray-600 text-sm whitespace-pre-wrap">{task.description || "Sin descripción"}</p>
              <p className="mt-4 text-xs text-gray-500">Creada por: {actorName(task.createdBy)}</p>
              {task.completedBy && <p className="mt-2 text-xs text-green-700">Completada por: {actorName(task.completedBy)} · {activityDate(task.completedAt)}</p>}
              {lastTransition && lastTransition.type !== "completed" && (
                <p className="mt-2 text-xs text-gray-600">
                  {lastTransition.type === "cancelled" ? "Cancelada" : "Reabierta"} por: {actorName(lastTransition.user)} · {activityDate(lastTransition.at)}
                </p>
              )}
              <TaskActivity task={task} />
            </div>
            <section className="p-5" aria-label="Comentarios">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Comentarios ({task.comments?.length || 0})
              </h3>
              <div className="space-y-3">
                {task.comments?.map((item) => (
                  <div key={item._id} className="bg-white border border-gray-100 rounded-xl p-3 text-sm">
                    <p className="whitespace-pre-wrap">{item.text}</p>
                    <p className="text-xs text-gray-400 mt-1">{actorName(item.user)} · {activityDate(item.createdAt)}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <div className="bg-white p-3 border-t border-gray-200 space-y-3">
            <div className="flex gap-2">
              <textarea aria-label="Nuevo comentario" placeholder="Escribe un comentario..." value={comment} onChange={(e) => setComment(e.target.value)}
                maxLength={300} rows={1} disabled={!isOnline || saving} className="flex-1 p-3 bg-gray-50 rounded-xl text-sm" />
              <button onClick={submitComment} disabled={!isOnline || saving || !comment.trim()} className="px-3 bg-[#1d5030] text-white rounded-xl disabled:opacity-50">Comentar</button>
            </div>
            <div className="flex flex-wrap gap-3">
              {permissions.complete && <button onClick={complete} disabled={!isOnline || saving} className="flex-1 flex items-center justify-center gap-2 bg-[#1d5030] text-white p-3 rounded-xl disabled:opacity-50">
                {saving ? <Clock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />} Completar
              </button>}
              {permissions.edit && <button onClick={() => onEdit(task)} disabled={!isOnline || saving} className="flex-1 p-3 border border-gray-200 rounded-xl">Editar</button>}
              {permissions.cancel && <button onClick={() => setAction("cancel")} disabled={!isOnline || saving} className="flex-1 p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl">Cancelar tarea</button>}
              {permissions.reopen && <button onClick={() => setAction("reopen")} disabled={!isOnline || saving} className="flex-1 p-3 bg-[#1d5030] text-white rounded-xl">Reabrir tarea</button>}
            </div>
          </div>
        </div>
      </ModalContainer>
      <TaskReasonModal action={action} onClose={() => setAction(null)} onSubmit={transition} isOnline={isOnline} />
    </>
  );
};
TaskDetailModal.propTypes = { isOpen: PropTypes.bool.isRequired, onClose: PropTypes.func.isRequired, task: PropTypes.object, onEdit: PropTypes.func.isRequired };
export default TaskDetailModal;

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { http } from "../services/api";
import useOnlineStatus from "../hooks/useOnlineStatus";
import { useSocket } from "../hooks/useSocket";
import { useToast } from "./ToastContext";
import AuthContext from "./AuthContext";

export const TaskContext = createContext();
export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error("useTasks must be used within a TaskProvider");
  return context;
};
const sameId = (a, b) => a != null && b != null && a.toString() === b.toString();
const upsert = (tasks, task) => tasks.some((t) => sameId(t._id, task._id))
  ? tasks.map((t) => sameId(t._id, task._id) ? task : t) : [...tasks, task];
const appendComment = (task, comment) => {
  const comments = task.comments || [];
  return comments.some((c) => sameId(c._id, comment._id)) ? task : { ...task, comments: [...comments, comment] };
};

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isOnline = useOnlineStatus();
  const { user } = useContext(AuthContext);
  const { socket } = useSocket();
  const { addToast } = useToast();
  const userId = user?._id || user?.id;
  const restaurantId = user?.restaurante?._id || user?.restaurante;
  const sessionKey = `${userId || ""}:${restaurantId || ""}`;
  const session = useRef(sessionKey);
  // Invalidate immediately on session changes, including requests still in flight.
  session.current = sessionKey;
  const requestSequence = useRef(0);
  const eventRevision = useRef(0);

  const fetchTasks = useCallback(async function loadTasks(filters = {}) {
    if (!navigator.onLine || !userId) return [];
    const key = sessionKey;
    const sequence = ++requestSequence.current;
    const revision = eventRevision.current;
    setLoading(true);
    try {
      const data = await http.getTasks(filters);
      if (!navigator.onLine || session.current !== key || sequence !== requestSequence.current) return [];
      // A socket/mutation occurred during the snapshot. Fetch a fresh snapshot
      // instead of overwriting newer activity/comments with the older response.
      if (revision !== eventRevision.current) return await loadTasks(filters);
      setTasks(data);
      setError(null);
      return data;
    } catch (requestError) {
      if (navigator.onLine && session.current === key && sequence === requestSequence.current) {
        setTasks([]);
        setError(requestError.message);
      }
      return [];
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }, [sessionKey, userId]);

  const mutateTask = async (operation) => {
    if (!isOnline || !navigator.onLine) throw new Error("Sin conexión. Tareas no está disponible");
    const key = sessionKey;
    try {
      const task = await operation();
      if (navigator.onLine && session.current === key) {
        eventRevision.current++;
        setTasks((previous) => upsert(previous, task));
        setError(null);
      }
      return task;
    } catch (requestError) {
      if (requestError.status === 409 && session.current === key) await fetchTasks();
      if (session.current === key && navigator.onLine) setError(requestError.message);
      throw requestError;
    }
  };

  const addComment = async (taskId, text) => {
    if (!isOnline || !navigator.onLine) throw new Error("Sin conexión. Tareas no está disponible");
    const key = sessionKey;
    const comment = await http.addTaskComment(taskId, { text });
    if (navigator.onLine && session.current === key) {
      eventRevision.current++;
      setTasks((previous) => previous.map((task) => sameId(task._id, taskId) ? appendComment(task, comment) : task));
    }
    return comment;
  };

  useEffect(() => {
    requestSequence.current++;
    setTasks([]);
    setError(null);
    setLoading(false);
    if (isOnline && userId) fetchTasks();
  }, [isOnline, userId, fetchTasks]);

  useEffect(() => {
    const reload = () => { if (navigator.onLine) fetchTasks(); };
    // Explicit listener also handles online events when the hook already says online.
    window.addEventListener("online", reload);
    return () => window.removeEventListener("online", reload);
  }, [fetchTasks]);

  useEffect(() => {
    if (!socket || !isOnline || !userId) return undefined;
    const acceptTask = (task) => {
      if (!navigator.onLine) return;
      eventRevision.current++;
      setTasks((previous) => upsert(previous, task));
    };
    const created = (task) => {
      acceptTask(task);
      if (!sameId(task.createdBy?._id || task.createdBy, userId)) addToast(`Nueva tarea: ${task.title}`, "info");
    };
    const completed = (task) => {
      acceptTask(task);
      if (!sameId(task.completedBy?._id || task.completedBy, userId)) addToast(`Tarea completada: ${task.title}`, "success");
    };
    const commented = ({ taskId, comment }) => {
      if (!navigator.onLine) return;
      eventRevision.current++;
      setTasks((previous) => previous.map((task) => sameId(task._id, taskId) ? appendComment(task, comment) : task));
    };
    const reload = () => { if (navigator.onLine) fetchTasks(); };
    const handlers = {
      connect: reload,
      "task:created": created,
      "task:updated": acceptTask,
      "task:completed": completed,
      "task:cancelled": acceptTask,
      "task:reopened": acceptTask,
      "task:commented": commented,
    };
    Object.entries(handlers).forEach(([name, handler]) => socket.on(name, handler));
    return () => Object.entries(handlers).forEach(([name, handler]) => socket.off(name, handler));
  }, [socket, isOnline, userId, addToast, fetchTasks]);

  return (
    <TaskContext.Provider value={{
      tasks, loading, error, isOnline, fetchTasks,
      createTask: (data) => mutateTask(() => http.createTask(data)),
      updateTask: (id, data) => mutateTask(() => http.updateTask(id, data)),
      completeTask: (id) => mutateTask(() => http.completeTask(id)),
      cancelTask: (id, reason) => mutateTask(() => http.cancelTask(id, reason)),
      reopenTask: (id, reason) => mutateTask(() => http.reopenTask(id, reason)),
      addComment,
    }}>
      {children}
    </TaskContext.Provider>
  );
};
TaskProvider.propTypes = { children: PropTypes.node.isRequired };

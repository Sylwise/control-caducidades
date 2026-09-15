import { createContext, useCallback, useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { http } from "../services/api";
import useOnlineStatus from "../hooks/useOnlineStatus";
import { useSocket } from "../hooks/useSocket";
import { useToast } from "./ToastContext";
import AuthContext from "./AuthContext";

export const TaskContext = createContext();

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTasks must be used within a TaskProvider");
  }
  return context;
};

const sameId = (left, right) =>
  left != null && right != null && left.toString() === right.toString();

const upsertTask = (tasks, task) => {
  const index = tasks.findIndex((current) => sameId(current._id, task._id));
  if (index === -1) return [...tasks, task];
  return tasks.map((current, currentIndex) => currentIndex === index ? task : current);
};

const appendComment = (task, comment) => {
  const comments = task.comments || [];
  if (comment._id && comments.some((current) => sameId(current._id, comment._id))) {
    return task;
  }
  return { ...task, comments: [...comments, comment] };
};

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isOnline = useOnlineStatus();
  const { user } = useContext(AuthContext);
  const { socket } = useSocket();
  const { addToast } = useToast();

  const requireOnline = useCallback(() => {
    if (!isOnline || !navigator.onLine) {
      throw new Error("Sin conexión. Tareas no está disponible");
    }
  }, [isOnline]);

  const fetchTasks = useCallback(async (filters = {}) => {
    if (!isOnline) {
      setTasks([]);
      setError(null);
      setLoading(false);
      return [];
    }

    setLoading(true);
    try {
      const data = await http.getTasks(filters);
      setTasks(data);
      setError(null);
      return data;
    } catch (requestError) {
      setTasks([]);
      setError(requestError.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  const createTask = async (taskData) => {
    requireOnline();
    try {
      const newTask = await http.createTask(taskData);
      setTasks((previous) => upsertTask(previous, newTask));
      setError(null);
      return newTask;
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  };

  const updateTask = async (taskId, data) => {
    requireOnline();
    try {
      const updatedTask = await http.updateTask(taskId, data);
      setTasks((previous) => upsertTask(previous, updatedTask));
      setError(null);
      return updatedTask;
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  };

  const completeTask = async (taskId) => {
    requireOnline();
    try {
      const completedTask = await http.completeTask(taskId);
      setTasks((previous) => upsertTask(previous, completedTask));
      setError(null);
      return completedTask;
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  };

  const deleteTask = async (taskId) => {
    requireOnline();
    try {
      await http.deleteTask(taskId);
      setTasks((previous) => previous.filter((task) => !sameId(task._id, taskId)));
      setError(null);
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  };

  const addComment = async (taskId, text) => {
    requireOnline();
    try {
      const comment = await http.addTaskComment(taskId, { text });
      setTasks((previous) => previous.map((task) =>
        sameId(task._id, taskId) ? appendComment(task, comment) : task
      ));
      setError(null);
      return comment;
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  };

  useEffect(() => {
    if (!isOnline) {
      setTasks([]);
      setError(null);
    }
  }, [isOnline]);

  useEffect(() => {
    if (!socket || !isOnline) return undefined;

    const handleTaskCreated = (newTask) => {
      setTasks((previous) => upsertTask(previous, newTask));
      const currentUserId = user?._id || user?.id;
      const createdById = newTask.createdBy?._id || newTask.createdBy;
      if (!sameId(createdById, currentUserId)) {
        addToast(`Nueva tarea: ${newTask.title}`, "info");
      }
    };

    const handleTaskUpdated = (updatedTask) => {
      setTasks((previous) => upsertTask(previous, updatedTask));
    };

    const handleTaskCompleted = (completedTask) => {
      setTasks((previous) => upsertTask(previous, completedTask));
      const currentUserId = user?._id || user?.id;
      const completedById = completedTask.completedBy?._id || completedTask.completedBy;
      if (!sameId(completedById, currentUserId)) {
        addToast(`Tarea completada: ${completedTask.title}`, "success");
      }
    };

    const handleTaskDeleted = (data) => {
      const taskId = data.taskId || data;
      setTasks((previous) => previous.filter((task) => !sameId(task._id, taskId)));

      const currentUserId = user?._id || user?.id;
      if (data.actor && !sameId(data.actor, currentUserId)) {
        addToast(`${data.actorName || "Otro usuario"} ha eliminado una tarea`, "error");
      }
    };

    const handleTaskCommented = ({ taskId, comment }) => {
      setTasks((previous) => previous.map((task) =>
        sameId(task._id, taskId) ? appendComment(task, comment) : task
      ));
    };

    socket.on("task:created", handleTaskCreated);
    socket.on("task:updated", handleTaskUpdated);
    socket.on("task:completed", handleTaskCompleted);
    socket.on("task:deleted", handleTaskDeleted);
    socket.on("task:commented", handleTaskCommented);

    return () => {
      socket.off("task:created", handleTaskCreated);
      socket.off("task:updated", handleTaskUpdated);
      socket.off("task:completed", handleTaskCompleted);
      socket.off("task:deleted", handleTaskDeleted);
      socket.off("task:commented", handleTaskCommented);
    };
  }, [socket, isOnline, addToast, user]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        error,
        isOnline,
        fetchTasks,
        createTask,
        updateTask,
        completeTask,
        deleteTask,
        addComment,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

TaskProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

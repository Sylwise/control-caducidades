import { createContext, useContext, useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import taskService from "../services/offline/taskService";
import OfflineDebugger from "../utils/debugger";

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

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);

  const fetchTasks = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const data = await taskService.getTasks(filters);
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      OfflineDebugger.error("TASK_CONTEXT_FETCH_ERROR", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = async (taskData) => {
    try {
      const newTask = await taskService.createTask(taskData);
      // Local update handled by event listener
      return newTask;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateTask = async (taskId, data) => {
    try {
      const updated = await taskService.updateTask(taskId, data);
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const completeTask = async (taskId) => {
    try {
      const completed = await taskService.completeTask(taskId);
      return completed;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };
  
  const deleteTask = async (taskId) => {
      try {
          await taskService.deleteTask(taskId);
      } catch (err) {
          setError(err.message);
          throw err;
      }
  };

  const addComment = async (taskId, text) => {
      // Get current in-memory task to ensure we have latest socket updates
      const currentTask = tasks.find(t => t._id === taskId);
      
      try {
          const comment = await taskService.addTaskComment(taskId, text, currentTask);
          return comment;
      } catch (err) {
           setError(err.message);
           throw err;
      }
  }

  // Listen for local updates (from TaskService or SyncHandler)
  useEffect(() => {
    const handleLocalUpdate = (event) => {
       const { type, task, taskId } = event.detail;
       OfflineDebugger.log("TASK_CONTEXT_LOCAL_UPDATE", event.detail);
       
       setTasks(prev => {
           if (type === 'create') {
               if (prev.find(t => t._id === task._id)) return prev;
               return [...prev, task];
           }
           if (type === 'update') {
               return prev.map(t => t._id === task._id ? task : t);
           }
           if (type === 'delete') {
               return prev.filter(t => t._id !== taskId);
           }
           if (type === 'create_sync') {
               const { oldId } = event.detail;
               // Check if server task already exists (from socket race condition)
               if (prev.find(t => t._id === task._id)) {
                   // Server task is already there, just remove the temp one
                   return prev.filter(t => t._id !== oldId);
               }
               // Otherwise, replace the temp one with the server one
               return prev.map(t => t._id === oldId ? task : t);
           }
           return prev;
       });
    };

    window.addEventListener("localTaskUpdate", handleLocalUpdate);
    return () => window.removeEventListener("localTaskUpdate", handleLocalUpdate);
  }, []);

    // Socket.IO Real-time Updates
    const { socket } = useSocket();
    const { addToast } = useToast();
  
    useEffect(() => {
      if (!socket) return;
  
      const handleTaskCreated = (newTask) => {
        setTasks((prev) => {
          // 1. Strict ID Check
          if (prev.find((t) => t._id === newTask._id)) return prev;
  
          // 2. Fuzzy Check for race conditions (Socket vs Sync)
          const currentUserId = user?._id || user?.id;
          const isMyTask = (newTask.createdBy?._id === currentUserId) || (newTask.createdBy === currentUserId);
  
          if (isMyTask) {
               const hasMatchingTempTask = prev.some(t => 
                  t._id.startsWith('temp_') && 
                  t.title === newTask.title
               );
               if (hasMatchingTempTask) return prev;
          }
  
          return [...prev, newTask];
        });
        
        // ONLY toast if NOT created by current user
        const currentUserId = user?._id || user?.id;
        const createdById = newTask.createdBy?._id || newTask.createdBy;
        const isCreator = createdById && currentUserId && (createdById.toString() === currentUserId.toString());
        
        if (!isCreator) {
            addToast(`Nueva tarea: ${newTask.title}`, "info");
        }
      };
  
      const handleTaskUpdated = (updatedTask) => {
        setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
      };
  
      const handleTaskCompleted = (completedTask) => {
        setTasks((prev) => prev.map((t) => (t._id === completedTask._id ? completedTask : t)));
        
        const currentUserId = user?._id || user?.id;
        const completedById = completedTask.completedBy?._id || completedTask.completedBy;
        const isCompleter = completedById && currentUserId && (completedById.toString() === currentUserId.toString());
  
        if (!isCompleter) {
           addToast(`Tarea completada: ${completedTask.title}`, "success");
        }
      };
  
      const handleTaskDeleted = (data) => {
        // Data can be just ID (legacy/other parts) or object with { taskId, actor, actorName }
        const taskId = data.taskId || data;
        const actorId = data.actor;
        const getActorName = data.actorName || "Otro usuario";
        
        setTasks((prev) => prev.filter((t) => t._id !== taskId));
  
        // Show toast only if deleted by SOMEONE ELSE
        const currentUserId = user?._id || user?.id;
        
        const isMe = actorId && currentUserId && (actorId.toString() === currentUserId.toString());
        
        if (actorId && !isMe) {
            addToast(`${getActorName} ha eliminado una tarea`, "error");
        }
      };
  
      const handleTaskCommented = ({ taskId, comment }) => {
        setTasks((prev) =>
          prev.map((t) => {
            if (t._id === taskId) {
              return {
                ...t,
                comments: t.comments ? [...t.comments, comment] : [comment],
              };
            }
            return t;
          })
        );
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
    }, [socket, addToast, user]);
  
  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        error,
        fetchTasks,
        createTask,
        updateTask,
        completeTask,
        deleteTask,
        addComment
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

TaskProvider.propTypes = {
  children: PropTypes.node.isRequired,
};



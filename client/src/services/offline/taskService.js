import FeatureManager from "../../config/features";
import OfflineDebugger from "../../utils/debugger";
import IndexedDB from "../indexedDB";
import * as api from "../api";

class TaskService {
  get isOnline() {
    return navigator.onLine;
  }

  get isOfflineMode() {
    return FeatureManager.isEnabled("OFFLINE_MODE") && !this.isOnline;
  }

  _dispatchLocalEvent(eventName, detail) {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  async getTasks(filters = {}) {
    try {
      OfflineDebugger.log("GET_TASKS_START", { filters, isOnline: this.isOnline });

      if (this.isOnline && !this.isOfflineMode) {
        const serverTasks = await api.http.getTasks(filters);
        // Save to local DB for caching
        await this.saveTasksToLocal(serverTasks);
        return serverTasks;
      }

      // Offline: Get from IndexedDB
      // Note: Filters might need to be applied manually if IndexedDB query is limited
      const localTasks = await IndexedDB.getTasks(); // We need to implement getTasks in IndexedDB
      
      // Manual filtering for offline
      let filtered = localTasks;
      if (filters.status) filtered = filtered.filter(t => t.status === filters.status);
      if (filters.priority) filtered = filtered.filter(t => t.priority === filters.priority);
      
      // Sort by default (dueDate asc, priority desc) - basic sort
      filtered.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

      return filtered;
    } catch (error) {
      OfflineDebugger.error("GET_TASKS_ERROR", error);
      // Fallback
      return this.isOnline ? [] : await IndexedDB.getTasks();
    }
  }

  async createTask(taskData) {
    try {
      if (this.isOnline && !this.isOfflineMode) {
        const serverTask = await api.http.createTask(taskData);
        await IndexedDB.saveTask(serverTask);
        this._dispatchLocalEvent("localTaskUpdate", { type: "create", task: serverTask });
        return serverTask;
      }

      // Offline
      const tempId = `temp_${Date.now()}`;
      const localTask = {
        _id: tempId,
        ...taskData,
        status: 'pending',
        comments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // We lack full user info offline, maybe store partial?
        // For now, UI should handle missing populated fields gracefully.
      };

      await IndexedDB.saveTask(localTask);
      await IndexedDB.addPendingChange({
        type: "CREATE_TASK",
        tempId,
        taskId: tempId, 
        data: taskData,
        timestamp: new Date().toISOString()
      });

      this._dispatchLocalEvent("localTaskUpdate", { type: "create", task: localTask });
      return localTask;

    } catch (error) {
      OfflineDebugger.error("CREATE_TASK_ERROR", error);
      throw error;
    }
  }

  async updateTask(taskId, data) {
    try {
        if (this.isOnline && !this.isOfflineMode) {
            const updatedTask = await api.http.updateTask(taskId, data);
            await IndexedDB.saveTask(updatedTask);
            this._dispatchLocalEvent("localTaskUpdate", { type: "update", task: updatedTask });
            return updatedTask;
        }

        const current = await IndexedDB.getTask(taskId);
        if (!current) throw new Error("Task not found locally");

        const updated = { ...current, ...data, updatedAt: new Date().toISOString() };
        await IndexedDB.saveTask(updated);
        
        await IndexedDB.addPendingChange({
            type: "UPDATE_TASK",
            taskId,
            data,
            timestamp: new Date().toISOString()
        });

        this._dispatchLocalEvent("localTaskUpdate", { type: "update", task: updated });
        return updated;
    } catch (error) {
        OfflineDebugger.error("UPDATE_TASK_ERROR", error);
        throw error;
    }
  }

  async completeTask(taskId) {
      try {
          if (this.isOnline && !this.isOfflineMode) {
              const completed = await api.http.completeTask(taskId);
              await IndexedDB.saveTask(completed);
              this._dispatchLocalEvent("localTaskUpdate", { type: "update", task: completed });
              return completed;
          }

          const current = await IndexedDB.getTask(taskId);
          if (!current) throw new Error("Task not found locally");
          
          const completed = { 
              ...current, 
              status: 'completed', 
              completedAt: new Date().toISOString(),
              // completedBy: currentUser?? We might need to inject user context or just leave it for server sync
          };
          
          await IndexedDB.saveTask(completed);
          await IndexedDB.addPendingChange({
              type: "COMPLETE_TASK",
              taskId,
              timestamp: new Date().toISOString()
          });

          this._dispatchLocalEvent("localTaskUpdate", { type: "update", task: completed });
          return completed;

      } catch (error) {
          OfflineDebugger.error("COMPLETE_TASK_ERROR", error);
          throw error;
      }
  }

  async addTaskComment(taskId, text, injectedTask = null) {
      try {
          // Comment structure usually requires user details.
          // Offline, we might just append text and sync later.
          
          if (this.isOnline && !this.isOfflineMode) {
              // API returns the comment object
              const newComment = await api.http.addTaskComment(taskId, { text });
              
              // We need to update the task locally. 
              // Option 1: Re-fetch task. Option 2: Append manually.
              // Use injected task if available to avoid stale DB read
              let current;
              if (injectedTask) {
                  current = structuredClone(injectedTask);
              } else {
                  current = await IndexedDB.getTask(taskId);
              }

              if (current) {
                  current.comments.push(newComment);
                  await IndexedDB.saveTask(current);
                  this._dispatchLocalEvent("localTaskUpdate", { type: "update", task: current });
              }
              return newComment;
          }

          let current;
          if (injectedTask) {
              current = structuredClone(injectedTask);
          } else {
             current = await IndexedDB.getTask(taskId);
          }
          
          if (!current || !current._id) {
               // Fallback or double check if injectedTask was valid
               current = await IndexedDB.getTask(taskId);
          }
          if (!current) throw new Error("Task not found locally");

          const tempComment = {
              text,
              createdAt: new Date().toISOString(),
              user: {_id: 'me', name: 'Me (Offline)'} // Placeholder
          };

          current.comments.push(tempComment);
          await IndexedDB.saveTask(current);

          await IndexedDB.addPendingChange({
              type: "ADD_COMMENT",
              taskId,
              data: { text },
              timestamp: new Date().toISOString()
          });
          
          this._dispatchLocalEvent("localTaskUpdate", { type: "update", task: current });
          return tempComment;

      } catch (error) {
          OfflineDebugger.error("ADD_COMMENT_ERROR", error);
          throw error;
      }
  }
  
  async deleteTask(taskId) {
      try {
          if (this.isOnline && !this.isOfflineMode) {
              await api.http.deleteTask(taskId);
              await IndexedDB.deleteTask(taskId);
              this._dispatchLocalEvent("localTaskUpdate", { type: "delete", taskId });
              return;
          }
          
          await IndexedDB.deleteTask(taskId);
          await IndexedDB.addPendingChange({
              type: "DELETE_TASK",
              taskId,
              timestamp: new Date().toISOString()
          });
          
          this._dispatchLocalEvent("localTaskUpdate", { type: "delete", taskId });
      } catch (error) {
          OfflineDebugger.error("DELETE_TASK_ERROR", error);
          throw error;
      }
  }

  async saveTasksToLocal(tasks) {
      // Clear or Merge? Usually merge or overwrite.
      // If getting all, maybe overwrite?
      // Let's safe save individually.
      for (const t of tasks) {
          await IndexedDB.saveTask(t);
      }
  }
}

export default new TaskService();

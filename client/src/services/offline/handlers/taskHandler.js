
import OfflineDebugger from "../../../utils/debugger";
import IndexedDB from "../../indexedDB";
import * as api from "../../api";

class TaskSyncHandler {
  async sync(change, idMapping) {
    try {
      OfflineDebugger.log("SYNC_TASK_START", { change });

      // Handle Task Creation
      if (change.type === "CREATE_TASK") {
        return this.handleCreate(change, idMapping);
      }
      
      // Handle Task Completion
      if (change.type === "COMPLETE_TASK") {
        return this.handleComplete(change, idMapping);
      }

      // Handle Adding Comment
      if (change.type === "ADD_COMMENT") {
        return this.handleAddComment(change, idMapping);
      }
      
      // Handle Updates (Edit)
      if (change.type === "UPDATE_TASK") {
        return this.handleUpdate(change, idMapping);
      }

      // Handle Deletes
      if (change.type === "DELETE_TASK") {
        return this.handleDelete(change, idMapping);
      }

    } catch (error) {
      OfflineDebugger.error("SYNC_TASK_ERROR", error, { change });
      throw error;
    }
  }

  async handleCreate(change, idMapping) {
    const response = await api.http.createTask(change.data);
    const serverTask = response.data || response;
    
    // Map temp ID to server ID
    if (change.tempId) {
      idMapping.set(change.tempId, serverTask._id);
      
      // Update local DB: Remove temp task, Add server task
      await IndexedDB.deleteTask(change.tempId);
      await IndexedDB.saveTask(serverTask);
      
      // Notify UI via event
      window.dispatchEvent(new CustomEvent("localTaskUpdate", {
        detail: { type: "create_sync", oldId: change.tempId, task: serverTask }
      }));
    } else {
      await IndexedDB.saveTask(serverTask);
    }
    
    return serverTask;
  }

  async handleComplete(change, idMapping) {
    let taskId = change.taskId;
    // Resolve temp ID if needed
    if (taskId.startsWith("temp_")) {
      const mappedId = idMapping.get(taskId);
      if (mappedId) taskId = mappedId;
      else {
        // If we can't map it, maybe the creation failed or hasn't happened yet?
        // But changes are ordered by timestamp, so creation should be first.
        OfflineDebugger.error("SYNC_TASK_MISSING_ID", { taskId });
        return; // Skip
      }
    }

    const response = await api.http.completeTask(taskId);
    const updatedTask = response.data || response;
    
    await IndexedDB.saveTask(updatedTask);
    return updatedTask;
  }

  async handleAddComment(change, idMapping) {
    let taskId = change.taskId;
    if (taskId.startsWith("temp_")) {
        const mappedId = idMapping.get(taskId);
        if (mappedId) taskId = mappedId;
        else return; 
    }

    await api.http.addTaskComment(taskId, change.data);
    // Response might be just the comment or the task. Assuming we refetch or response is enough.
    // Ideally we update the whole task in DB.
    
    // For simplicity, let's assume we fetch the fresh task or the API returns the comment and we duplicate logic.
    // Better: Fetch fresh task after comment logic if API doesn't return full task.
    // The previous controller returns the *comment*.
    // So we need to locally append it or fetch the task. 
    // Let's implement fetchTask in TaskService and use it here or update locally.
  }

  async handleUpdate(change, idMapping) {
    let taskId = change.taskId;
    if (taskId.startsWith("temp_")) {
      const mappedId = idMapping.get(taskId);
      if (mappedId) taskId = mappedId;
      else return; 
    }
    
    const response = await api.http.updateTask(taskId, change.data);
    const updatedTask = response.data || response;
    await IndexedDB.saveTask(updatedTask);
  }

  async handleDelete(change, idMapping) {
    let taskId = change.taskId;
    if (taskId.startsWith("temp_")) {
      const mappedId = idMapping.get(taskId);
      if (mappedId) taskId = mappedId;
      else {
        // Just delete local temp if it wasn't synced?
        await IndexedDB.deleteTask(taskId);
        return; 
      }
    }

    await api.http.deleteTask(taskId);
    await IndexedDB.deleteTask(taskId);
  }
}

export default new TaskSyncHandler();

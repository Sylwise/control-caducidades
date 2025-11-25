class OfflineDebugger {
  static enabled = true;
  static logHistory = [];
  static maxLogHistory = 1000;

  static enable() {
    this.enabled = true;
    console.log("Debugger activado");
  }

  static disable() {
    this.enabled = false;
    console.log("Debugger desactivado");
  }

  static log(operation, data) {
    if (!this.enabled) return;

    const logEntry = {
      timestamp: new Date(),
      operation,
      data,
      state: this.getCurrentState(),
    };

    this.logHistory.push(logEntry);
    if (this.logHistory.length > this.maxLogHistory) {
      this.logHistory.shift();
    }

    console.group(`🔍 Operación: ${operation}`);
    console.log("📦 Datos:", data);
    console.log("🌍 Estado:", this.getCurrentState());
    console.groupEnd();
  }

  static error(operation, error, context = {}) {
    const errorEntry = {
      timestamp: new Date(),
      operation,
      error: {
        message: error.message,
        stack: error.stack,
        ...error,
      },
      context,
      state: this.getCurrentState(),
    };

    this.logHistory.push(errorEntry);

    console.group(`❌ Error en: ${operation}`);
    console.error("🔥 Error:", error);
    console.log("📝 Contexto:", context);
    console.log("🌍 Estado:", this.getCurrentState());
    console.groupEnd();
  }

  static getCurrentState() {
    return {
      isOnline: navigator.onLine,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      storageEstimate: this.getStorageEstimate(),
    };
  }

  static async getStorageEstimate() {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          usage: estimate.usage,
          quota: estimate.quota,
          percentageUsed:
            ((estimate.usage / estimate.quota) * 100).toFixed(2) + "%",
        };
        // eslint-disable-next-line no-unused-vars
      } catch (error) {
        return { error: "No se pudo obtener estimación de almacenamiento" };
      }
    }
    return { error: "API de estimación no disponible" };
  }

  static getLogHistory() {
    return this.logHistory;
  }

  static clearHistory() {
    this.logHistory = [];
    console.log("Historial de logs limpiado");
  }
}

export default OfflineDebugger;

import { useState, useEffect } from "react";
import { Wifi, WifiOff, Bug } from "lucide-react";
import FeatureManager from "../config/features";
import OfflineDebugger from "../utils/debugger";

const ConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showDebugger, setShowDebugger] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (showDebugger) {
        setLogs(OfflineDebugger.getLogHistory());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showDebugger]);

  const toggleDebugger = () => {
    if (!showDebugger) {
      OfflineDebugger.enable();
    } else {
      OfflineDebugger.disable();
    }
    setShowDebugger(!showDebugger);
  };

  if (!FeatureManager.isEnabled("OFFLINE_MODE")) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Estado de Conexión */}
      <div
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg
          ${isOnline ? "bg-green-500" : "bg-red-500"} 
          text-white mb-2
        `}
      >
        {isOnline ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          {isOnline ? "Online" : "Offline"}
        </span>
      </div>

      {/* Botón de Debug */}
      <button
        onClick={toggleDebugger}
        className={`
          p-2 rounded-full shadow-lg
          ${showDebugger ? "bg-purple-500" : "bg-gray-500"}
          text-white
        `}
      >
        <Bug className="w-4 h-4" />
      </button>

      {/* Panel de Debug */}
      {showDebugger && (
        <div className="fixed bottom-20 right-4 w-96 max-h-96 bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="p-4 bg-gray-100 border-b">
            <h3 className="font-medium">Debug Panel</h3>
          </div>
          <div className="p-4 overflow-y-auto max-h-80">
            {logs.map((log, index) => (
              <div key={index} className="mb-4 text-sm">
                <div className="font-medium text-gray-700">
                  {new Date(log.timestamp).toLocaleTimeString()}
                  {" - "}
                  {log.operation}
                </div>
                <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                  {JSON.stringify(log.data || log.error, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;

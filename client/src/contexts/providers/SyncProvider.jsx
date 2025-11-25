import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import IndexedDB from "../../services/indexedDB";
import OfflineDebugger from "../../utils/debugger";
import OfflineManager from "../../services/offlineManager";
import SyncContext from "../SyncContext";

export const SyncProvider = ({ children }) => {
  const [pendingChanges, setPendingChanges] = useState(0);

  useEffect(() => {
    const updatePendingCount = async () => {
      try {
        const changes = await IndexedDB.getPendingChanges();
        setPendingChanges(changes.length);

        // Log detallado de los cambios pendientes
        if (changes.length > 0) {
          console.group("🔄 Cambios Pendientes");
          changes.forEach((change) => {
            console.log(`Tipo: ${change.type}`);
            console.log(`ID Producto: ${change.productId}`);
            
            // Más detalles para cambios de CREATE_CATALOG
            if (change.type === "CREATE_CATALOG") {
              console.log(`Temp ID: ${change.tempId}`);
              console.log(`Nombre Producto: ${change.data?.nombre || 'N/A'}`);
            }
            
            console.log(`Datos:`, change.data);
            console.log(
              `Timestamp: ${new Date(change.timestamp).toLocaleString()}`
            );
            console.log("---");
          });
          console.groupEnd();

          // Si estamos online, intentar sincronizar
          if (navigator.onLine) {
            console.log("🌐 Online detectado, intentando sincronizar...");
            await OfflineManager.syncChanges();
            // Actualizar conteo después de sincronizar
            const updatedChanges = await IndexedDB.getPendingChanges();
            setPendingChanges(updatedChanges.length);
          }
        }
      } catch (error) {
        OfflineDebugger.error("ERROR_GETTING_PENDING_CHANGES", error);
      }
    };

    // Actualizar conteo inicial
    updatePendingCount();

    // Actualizar cada vez que cambie el estado de conexión
    const handleOnline = async () => {
      OfflineDebugger.log("NETWORK_STATUS_CHANGED", { status: "online" });
      await updatePendingCount();
    };

    const handleOffline = () => {
      OfflineDebugger.log("NETWORK_STATUS_CHANGED", { status: "offline" });
      updatePendingCount();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Configurar un intervalo para actualizar el conteo periódicamente
    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  return (
    <SyncContext.Provider value={{ pendingChanges, setPendingChanges }}>
      {children}
    </SyncContext.Provider>
  );
};

SyncProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default SyncProvider;

import { useEffect, useState, useCallback, useContext } from "react";
import { io } from "socket.io-client";
import PropTypes from "prop-types";
import SocketContext from "../SocketContext";
import AuthContext from "../../contexts/AuthContext";

const SOCKET_URL = import.meta.env.PROD
  ? window.location.origin
  : "http://localhost:5000";

const RECONNECTION_ATTEMPTS = 5;
const RECONNECTION_DELAY = 1000;
const RECONNECTION_DELAY_MAX = 5000;

export const SocketProvider = ({ children }) => {
  const { token } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [error, setError] = useState(null);

  const handleReconnect = useCallback((attemptNumber) => {
    if (import.meta.env.DEV) {
      console.log(`Intento de reconexión #${attemptNumber}`);
    }
    setReconnectAttempt(attemptNumber);
  }, []);

  const handleConnectionError = useCallback((error) => {
    if (import.meta.env.DEV) {
      console.error("Error de conexión WebSocket:", error);
    }
    setIsConnected(false);
    setError(error.message);
  }, []);

  const cleanupSocket = useCallback((socketInstance) => {
    if (!socketInstance) return;
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    setSocket(null);
    setIsConnected(false);
    setError(null);
    setReconnectAttempt(0);
  }, []);

  useEffect(() => {
    if (!token) {
      if (socket) {
        cleanupSocket(socket);
      }
      return;
    }

    const socketInstance = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: RECONNECTION_ATTEMPTS,
      reconnectionDelay: RECONNECTION_DELAY,
      reconnectionDelayMax: RECONNECTION_DELAY_MAX,
      timeout: 10000,
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => {
      if (import.meta.env.DEV) {
        console.log("WebSocket conectado exitosamente");
      }
      setIsConnected(true);
      setError(null);
      setReconnectAttempt(0);
    });

    socketInstance.on("disconnect", (reason) => {
      if (import.meta.env.DEV) {
        console.log("WebSocket desconectado:", reason);
      }
      setIsConnected(false);
    });

    socketInstance.on("connect_error", handleConnectionError);
    socketInstance.on("reconnect_attempt", handleReconnect);
    socketInstance.on("reconnect_failed", () => {
      if (import.meta.env.DEV) {
        console.error("Falló la reconexión después de todos los intentos");
      }
      setError("No se pudo restablecer la conexión");
    });

    // Manejar evento de restaurante eliminado
    socketInstance.on("restaurantDeleted", (data) => {
      console.warn("Restaurante eliminado:", data.message);
      alert("Tu restaurante ha sido eliminado. La sesión se cerrará.");
      
      // Limpiar almacenamiento y redirigir
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      window.location.href = "/login";
    });

    setSocket(socketInstance);

    return () => cleanupSocket(socketInstance);
  }, [token, handleConnectionError, handleReconnect, cleanupSocket]);

  const value = {
    socket,
    isConnected,
    error,
    reconnectAttempt,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

SocketProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default SocketProvider;

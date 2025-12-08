const config = {
  apiUrl: import.meta.env.PROD
    ? "/api" // En producción, usa rutas relativas
    : `http://${window.location.hostname}:5000/api`, // En desarrollo, usa la IP dinámica
  SOCKET_URL: import.meta.env.PROD
    ? window.location.origin // En producción, usa el mismo origen
    : `http://${window.location.hostname}:5000`, // En desarrollo, usa la IP dinámica
};

export default config;

const config = {
  apiUrl: import.meta.env.PROD
    ? "/api" // En producción, usa rutas relativas
    : "http://localhost:5000/api", // En desarrollo, usa la URL completa
  wsUrl: import.meta.env.PROD
    ? window.location.origin // En producción, usa el origen actual
    : "http://localhost:5000", // En desarrollo, usa la URL completa
};

export default config;

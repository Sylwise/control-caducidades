import OfflineDebugger from "../utils/debugger";
import OfflineManager from "./offlineManager";
import axios from 'axios';

import config from "../config";

// API Base URL basada en la configuración centralizada
const API_BASE_URL = config.apiUrl;



// Función auxiliar para obtener el token
const getAuthToken = () => {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
};

// Instancia de Axios configurada
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

// Función auxiliar para obtener los headers comunes
const getHeaders = (contentType = false) => {
  const headers = {
    Authorization: `Bearer ${getAuthToken()}`,
  };

  if (contentType) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
};

const fetchWithNoCache = async (url, options = {}) => {
  return fetch(url, {
    ...options,
    cache: 'no-store',
    headers: {
      ...options.headers,
      'Pragma': 'no-cache',
      'Cache-Control': 'no-cache'
    }
  });
};

// Función auxiliar para manejar errores de la API
const handleApiError = async (response) => {
  const contentType = response.headers.get("content-type");
  let errorMessage;

  try {
    if (contentType && contentType.includes("application/json")) {
      const errorData = await response.json();
      // Better Errors Standard: Uses .message (string)
      // Legacy or Dev mode: .error might be an object
      errorMessage =
        errorData.message || (typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error)) || "Error en la petición";
    } else {
      errorMessage = "Error en la petición";
    }
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    errorMessage = "Error al procesar la respuesta del servidor";
  }

  OfflineDebugger.error("API_ERROR", new Error(errorMessage), {
    status: response.status,
    url: response.url,
    contentType,
  });

  throw new Error(errorMessage);
};

// Implementación de las operaciones HTTP directas
const httpOperations = {
  getAllProductStatus: async () => {
    const response = await fetchWithNoCache(`${API_BASE_URL}/status`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  updateProductStatus: async (productId, data) => {
    const response = await fetchWithNoCache(`${API_BASE_URL}/status/${productId}`, {
      method: "PUT",
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  getAllCatalogProducts: async () => {
    const response = await fetchWithNoCache(`${API_BASE_URL}/catalog`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  createCatalogProduct: async (data) => {
    const response = await fetchWithNoCache(`${API_BASE_URL}/catalog`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  updateCatalogProduct: async (productId, data) => {
    const response = await fetchWithNoCache(`${API_BASE_URL}/catalog/${productId}`, {
      method: "PUT",
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  deleteCatalogProduct: async (productId) => {
    const response = await fetchWithNoCache(`${API_BASE_URL}/catalog/${productId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  deleteProductStatus: async (productId) => {
    const response = await fetchWithNoCache(`${API_BASE_URL}/status/${productId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  deleteProduct: async (productId) => {
    const response = await fetchWithNoCache(`${API_BASE_URL}/catalog/${productId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },
};

// Métodos para el catálogo
export const getAllCatalogProducts = async () => {
  return await OfflineManager.getAllCatalogProducts();
};

// Exportar las operaciones envueltas con el OfflineManager
export const getAllProductStatus = () => OfflineManager.getAllProductStatus();
export const updateProductStatus = (productId, data) =>
  OfflineManager.updateProductStatus(productId, data);
export const deleteProductStatus = (productId) =>
  OfflineManager.deleteProductStatus(productId);
export const deleteProduct = (productId) =>
  httpOperations.deleteProduct(productId);

// Exportar las operaciones HTTP directas para uso interno
export const http = httpOperations;

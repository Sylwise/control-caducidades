import { useState, useEffect, useCallback } from "react";
import { Store, Plus, Trash2, Edit, RefreshCw, MapPin, WifiOff } from "lucide-react";
import PropTypes from "prop-types";
import config from "../config";
import usePreventScroll from "../hooks/usePreventScroll";
import ModalContainer from "./ModalContainer";
import OfflineManager from "../services/offlineManager";

const RestaurantManagement = ({
  isOpen = false,
  onClose = () => {},
}) => {
  usePreventScroll(isOpen);

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    direccion: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [editFormData, setEditFormData] = useState({
    nombre: "",
    direccion: "",
  });

  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const checkOfflineStatus = () => {
      const status = !navigator.onLine || OfflineManager.isOfflineMode;
      setIsOffline(status);
    };

    if (isOpen) {
      checkOfflineStatus();
    }

    window.addEventListener("online", checkOfflineStatus);
    window.addEventListener("offline", checkOfflineStatus);

    return () => {
      window.removeEventListener("online", checkOfflineStatus);
      window.removeEventListener("offline", checkOfflineStatus);
    };
  }, [isOpen]);

  const loadRestaurants = useCallback(async () => {
    if (isOffline) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${config.apiUrl}/restaurants`, {
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem("token") || sessionStorage.getItem("token")
          }`,
        },
      });

      if (!response.ok) throw new Error("Error al cargar restaurantes");

      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setRestaurants(data.data);
      } else {
        setRestaurants([]);
        if (data.error) throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isOffline]);

  useEffect(() => {
    if (isOpen) {
      loadRestaurants();
    }
  }, [isOpen, loadRestaurants]);

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`${config.apiUrl}/restaurants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            localStorage.getItem("token") || sessionStorage.getItem("token")
          }`,
        },
        body: JSON.stringify({
          ...formData,
          nombre: formData.nombre.trim(),
          direccion: formData.direccion.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al crear restaurante");
      }

      await loadRestaurants();
      setShowCreateForm(false);
      setFormData({ nombre: "", direccion: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRestaurant = async (id) => {
    try {
      const response = await fetch(`${config.apiUrl}/restaurants/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem("token") || sessionStorage.getItem("token")
          }`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al eliminar restaurante");
      }

      await loadRestaurants();
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateRestaurant = async (e) => {
    e.preventDefault();
    if (!editFormData.nombre.trim()) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`${config.apiUrl}/restaurants/${editingRestaurant}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            localStorage.getItem("token") || sessionStorage.getItem("token")
          }`,
        },
        body: JSON.stringify({
          ...editFormData,
          nombre: editFormData.nombre.trim(),
          direccion: editFormData.direccion.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar restaurante");
      }

      await loadRestaurants();
      setEditingRestaurant(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = (
    <div className="flex items-center gap-2">
      <Store className="w-5 h-5 text-[#1d5030]" />
      <span>Gestión de Restaurantes</span>
    </div>
  );

  return (
    <ModalContainer
      isOpen={isOpen}
      isClosing={false}
      onClose={onClose}
      title={title}
      containerClassName="max-w-2xl select-none"
    >
      <div className="p-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
        {isOffline && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-300 rounded-md
            animate-[slideDown_0.3s_ease-out] text-amber-800 flex items-start gap-3 select-none">
            <WifiOff className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium mb-1 select-none">Servicio no disponible</h3>
              <p className="text-sm select-none">
                La gestión de restaurantes no está disponible en modo offline por razones de seguridad.
                Por favor, conéctate a internet para administrar restaurantes.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm animate-[slideDown_0.3s_ease-out]">
            {error}
          </div>
        )}

        {!showCreateForm && !isOffline && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full p-3 mb-4 flex items-center justify-center gap-2 min-h-[48px]
              bg-[#1d5030] text-white rounded-lg
              hover:bg-[#1d5030]/90 transition-colors font-medium select-none"
          >
            <Plus className="w-5 h-5" />
            Añadir Restaurante
          </button>
        )}

        {showCreateForm && !isOffline && (
          <form onSubmit={handleCreateRestaurant} className="mb-6 p-4 bg-gray-50 rounded-lg animate-[slideDown_0.3s_ease-out]">
            <h3 className="text-lg font-semibold text-[#1d5030] mb-4">Nuevo Restaurante</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-[#1d5030] focus:border-[#1d5030]"
                    placeholder="Ej: Restaurante Centro"
                    required
                    maxLength={20}
                  />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-[#1d5030] focus:border-[#1d5030]"
                  placeholder="Ej: Av. Principal 123"
                  required
                  maxLength={120}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-white bg-[#1d5030] rounded-md hover:bg-[#1d5030]/90 disabled:opacity-50"
                >
                  {isSubmitting ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </form>
        )}

        {!isOffline && (
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="w-6 h-6 text-[#1d5030] animate-spin" />
              </div>
            ) : (
              restaurants.map((restaurant) => (
                <div key={restaurant._id} className="p-4 bg-white border border-gray-200 rounded-lg flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{restaurant.nombre}</h4>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <MapPin className="w-3 h-3" />
                      <span>{restaurant.direccion || "Sin dirección"}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingRestaurant(restaurant._id);
                        setEditFormData({ nombre: restaurant.nombre, direccion: restaurant.direccion });
                      }}
                      className="p-2 text-[#1d5030] hover:bg-[#1d5030]/10 rounded-lg"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(restaurant._id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Modal Edición */}
        {editingRestaurant && !isOffline && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-lg font-semibold text-[#1d5030] mb-4">Editar Restaurante</h3>
              <form onSubmit={handleUpdateRestaurant} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={editFormData.nombre}
                    onChange={(e) => setEditFormData({ ...editFormData, nombre: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-[#1d5030] focus:border-[#1d5030]"
                    required
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input
                    type="text"
                    value={editFormData.direccion}
                    onChange={(e) => setEditFormData({ ...editFormData, direccion: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-[#1d5030] focus:border-[#1d5030]"
                    required
                    maxLength={120}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingRestaurant(null)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-white bg-[#1d5030] rounded-md hover:bg-[#1d5030]/90 disabled:opacity-50"
                  >
                    {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmación Borrado */}
        {deleteConfirm && !isOffline && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">¿Eliminar restaurante?</h3>
              <p className="text-gray-500 mb-4">Esta acción no se puede deshacer y podría afectar a los usuarios asociados.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteRestaurant(deleteConfirm)}
                  className="px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-600"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModalContainer>
  );
};

RestaurantManagement.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
};

export default RestaurantManagement;

import { useState, useEffect, useCallback } from "react";
import { Users, UserPlus, WifiOff, ChevronDown } from "lucide-react";
import PropTypes from "prop-types";
import config from "../config";
import usePreventScroll from "../hooks/usePreventScroll";
import ModalContainer from "./ModalContainer";
import { useSocket } from "../hooks/useSocket";
import OfflineManager from "../services/offlineManager";
import { useToast } from "../contexts/ToastContext";
import useHardwareBackButton from "../hooks/useHardwareBackButton";
import UserList from "./UserManagement/UserList";
import UserForm from "./UserManagement/UserForm";
import DeleteConfirmationModal from "./UserManagement/DeleteConfirmationModal";

const UserManagement = ({
  isOpen = false,
  onClose = () => {},
  currentUser = null,
}) => {
  // Usar el hook para prevenir scroll
  // Usar el hook para prevenir scroll
  usePreventScroll(isOpen);
  const { socket } = useSocket();
  const { addToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "encargado",
    restaurante: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    username: "",
    password: "",
    role: "",
    restaurante: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantFilter, setSelectedRestaurantFilter] = useState("");

  // Cargar restaurantes si es admin
  useEffect(() => {
    if (currentUser?.role === "admin" && isOpen) {
      fetch(`${config.apiUrl}/restaurants`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            setRestaurants(data.data);
          } else {
            console.error("Error fetching restaurants:", data);
            setRestaurants([]);
          }
        })
        .catch((err) => console.error("Error cargando restaurantes:", err));
    }
  }, [currentUser, isOpen]);

  // Verificar estado offline al abrir el modal
  useEffect(() => {
    if (isOpen) {
      const checkOfflineStatus = () => {
        const offlineStatus = !navigator.onLine || OfflineManager.isOfflineMode;
        setIsOffline(offlineStatus);
        return offlineStatus;
      };
      
      // Verificar estado inicial
      const initialOfflineStatus = checkOfflineStatus();
      
      // Si estamos online, cargar usuarios
      if (!initialOfflineStatus) {
        loadUsers();
      }
      
      // Configurar listeners para cambios en la conectividad
      const handleOnline = () => {
        setIsOffline(false);
        loadUsers();
      };
      
      const handleOffline = () => {
        setIsOffline(true);
      };
      
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, [isOpen]);

  // Cargar usuarios
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.apiUrl}/auth/users`, {
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem("token") || sessionStorage.getItem("token")
          }`,
        },
      });

      if (!response.ok) throw new Error("Error al cargar usuarios");

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Escuchar eventos de socket para actualizaciones de usuarios
  useEffect(() => {
    if (!socket) return;

    const handleUserUpdate = (data) => {


      if (data.type === "create") {
        setUsers((prevUsers) => [
          ...prevUsers,
          {
            ...data.user,
            _id: data.user.id,
          },
        ]);
      } else if (data.type === "update") {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === data.user.id
              ? {
                  ...user,
                  ...data.user,
                  _id: data.user.id,
                }
              : user
          )
        );
      } else if (data.type === "delete") {
        setUsers((prevUsers) =>
          prevUsers.filter((user) => user._id !== data.userId)
        );
      }
    };

    socket.on("userUpdate", handleUserUpdate);

    return () => {
      socket.off("userUpdate", handleUserUpdate);
    };
  }, [socket]);

  // Validación en tiempo real
  const validateForm = useCallback((data) => {
    const errors = {};
    if (!data.username) {
      errors.username = "El nombre de usuario es requerido";
    } else if (data.username.length < 3) {
      errors.username = "El nombre debe tener al menos 3 caracteres";
    }

    if (!data.password) {
      errors.password = "La contraseña es requerida";
    } else if (data.password.length < 6) {
      errors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    return errors;
  }, []);

  // Manejar cambios en el formulario
  const handleInputChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      
      // Bloquear espacios en el nombre de usuario
      if (name === "username" && value.includes(" ")) {
        return;
      }

      const newFormData = { ...formData, [name]: value };
      setFormData(newFormData);

      // Validar solo el campo que cambió
      const fieldError = validateForm(newFormData)[name];
      setFormErrors((prev) => ({
        ...prev,
        [name]: fieldError,
      }));
    },
    [formData, validateForm]
  );

  const [lastCreatedUserId, setLastCreatedUserId] = useState(null);

  // Crear usuario
  const handleCreateUser = async (e) => {
    e.preventDefault();
    const errors = validateForm(formData);

    if (Object.values(errors).filter(Boolean).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`${config.apiUrl}/auth/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            localStorage.getItem("token") || sessionStorage.getItem("token")
          }`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();


      if (!response.ok) {
        throw new Error(
          data.details
            ? `${data.error}: ${
                typeof data.details === "string"
                  ? data.details
                  : Object.values(data.details).filter(Boolean).join(", ")
              }`
            : data.error || "Error al crear usuario"
        );
      }

      await loadUsers();
      setShowCreateForm(false);
      setSelectedUserId(null); // Deseleccionar usuario al crear uno nuevo exitosamente
      
      // Highlight del nuevo usuario
      if (data.user && data.user._id) {
        setLastCreatedUserId(data.user._id);
        // Scroll al nuevo usuario (opcional, pero recomendado)
        const userElement = document.getElementById(`user-${data.user._id}`);
        if (userElement) {
          userElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        setTimeout(() => {
          setLastCreatedUserId(null);
        }, 3000); // 3 segundos coincide con la duración de la animación en CSS
      }

      setFormData({
        username: "",
        password: "",
        role: "encargado",
        restaurante: "",
      });
      setError(null);
      addToast("Usuario creado correctamente", "success");
    } catch (err) {
      console.error("Error completo:", err);
      setError(
        err.message || "Error al crear usuario. Por favor, intenta de nuevo."
      );
      addToast(err.message || "Error al crear usuario", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`${config.apiUrl}/auth/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem("token") || sessionStorage.getItem("token")
          }`,
        },
      });

      if (!response.ok) throw new Error("Error al eliminar usuario");

      await loadUsers();
      setDeleteConfirm(null);
      setSelectedUserId(null); // Deseleccionar usuario después de eliminarlo
      addToast("Usuario eliminado correctamente", "success");
    } catch (err) {
      setError(err.message);
      addToast(err.message || "Error al eliminar usuario", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setShowCreateForm(false);
    setSelectedUserId(null); // Deseleccionar usuario al cerrar el modal
    setFormData({
      username: "",
      password: "",
      role: "encargado",
      restaurante: "",
    });
    setFormErrors({});
    setEditingUser(null); // Limpiar usuario en edición
    setEditFormData({
      username: "",
      password: "",
      role: "",
      restaurante: ""
    });
    setSelectedRestaurantFilter("");
    onClose();
  };

  // Iniciar edición de usuario
  const handleStartEditing = (user) => {
    setEditingUser(user._id);
    setEditFormData({
      username: user.username,
      password: "", // No rellenamos la contraseña por seguridad
      role: user.role,
      restaurante: user.restaurante?._id || user.restaurante
    });
    setSelectedUserId(null); // Deseleccionar usuario al iniciar edición
  };

  // Cancelar edición de usuario
  const handleCancelEditing = () => {
    setEditingUser(null);
    setEditFormData({
      username: "",
      password: "",
      role: ""
    });
    setFormErrors({});
  };

  // Validar formulario de edición
  const validateEditForm = () => {
    const errors = {};
    
    if (editFormData.username.trim() === "") {
      errors.username = "El nombre de usuario es obligatorio";
    } else if (editFormData.username.length < 3) {
      errors.username = "El nombre debe tener al menos 3 caracteres";
    }
    
    // Solo validamos la contraseña si se ha introducido alguna
    if (editFormData.password && editFormData.password.length < 6) {
      errors.password = "La contraseña debe tener al menos 6 caracteres";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Manejar cambios en el formulario de edición
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Guardar cambios de usuario
  const handleSaveUser = async (userId) => {
    if (!validateEditForm()) return;

    try {
      setIsSubmitting(true);
      
      // Crear objeto con los datos a actualizar
      const updateData = {
        username: editFormData.username,
        role: editFormData.role,
        restaurante: editFormData.restaurante
      };
      
      // Solo incluir contraseña si se ha proporcionado una nueva
      if (editFormData.password.trim() !== "") {
        updateData.password = editFormData.password;
      }
      
      const response = await fetch(`${config.apiUrl}/auth/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            localStorage.getItem("token") || sessionStorage.getItem("token")
          }`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error
            ? `${data.error}: ${
                typeof data.details === "string"
                  ? data.details
                  : Object.values(data.details).filter(Boolean).join(", ")
              }`
            : data.error || "Error al actualizar usuario"
        );
      }

      // Actualizar lista de usuarios
      await loadUsers();
      
      // Limpiar formulario de edición
      setEditingUser(null);
      setEditFormData({
        username: "",
        password: "",
        role: ""
      });
      setError(null);
      addToast("Usuario actualizado correctamente", "success");
    } catch (err) {
      console.error("Error al actualizar usuario:", err);
      setError(
        err.message || "Error al actualizar usuario. Por favor, intenta de nuevo."
      );
      addToast(err.message || "Error al actualizar usuario", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = (
    <div className="flex items-center gap-2">
      <Users className="w-5 h-5 text-[#1d5030]" />
      <span>Gestión de Usuarios</span>
    </div>
  );

  // --- Hardware Back Button Hooks ---
  // Placed here to ensure all handlers (handleClose, handleCancelEditing) are defined

  // 1. Delete Confirmation (Priority 20 - Highest)
  useHardwareBackButton(!!deleteConfirm, () => setDeleteConfirm(null), 20, 'user-delete');

  // 2. Edit Modal (Priority 20 - Highest)
  useHardwareBackButton(!!editingUser, handleCancelEditing, 20, 'user-edit');

  // 3. Create Form View (Priority 15 - Middle)
  useHardwareBackButton(showCreateForm, () => {
    setShowCreateForm(false);
    setSelectedUserId(null);
  }, 15, 'user-create-view');

  // 4. Main Modal (Priority 10 - Lowest)
  useHardwareBackButton(isOpen, handleClose, 10, 'user-main');

  return (
    <ModalContainer
      isOpen={isOpen}
      isClosing={false}
      onClose={handleClose}
      title={title}
      containerClassName="max-w-2xl select-none"
    >
      {/* Content */}
      <div className="p-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
        {/* Mensaje de alerta para modo offline */}
        {isOffline && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-300 rounded-md
            animate-[slideDown_0.3s_ease-out] text-amber-800 flex items-start gap-3 select-none">
            <WifiOff className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium mb-1 select-none">Servicio no disponible</h3>
              <p className="text-sm select-none">
                La gestión de usuarios no está disponible en modo offline por razones de seguridad.
                Por favor, conéctate a internet para administrar usuarios.
              </p>
            </div>
          </div>
        )}
        
        {error && (
          <div
            className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm
            animate-[slideDown_0.3s_ease-out] select-none"
          >
            {error}
          </div>
        )}

        {/* Botón de crear usuario (oculto en modo offline) */}
        {!showCreateForm && !isOffline && (
          <button
            onClick={() => {
              setShowCreateForm(true);
              setSelectedUserId(null); // Deseleccionar usuario al abrir formulario de creación
            }}
            className="w-full p-3 mb-4 flex items-center justify-center gap-2 min-h-[48px]
              bg-[#1d5030] text-white rounded-lg
              hover:bg-[#1d5030]/90 transition-colors font-medium select-none"
          >
            <UserPlus className="w-5 h-5" />
            Crear Nuevo Usuario
          </button>
        )}

        {/* Formulario de creación (oculto en modo offline) */}
        {showCreateForm && !isOffline && (
            <UserForm
                initialData={formData}
                isEditing={false}
                isSubmitting={isSubmitting}
                errors={formErrors}
                restaurants={restaurants}
                isAdmin={currentUser?.role === 'admin'}
                onSubmit={handleCreateUser}
                onCancel={() => {
                  setShowCreateForm(false);
                  setFormData({
                    username: "",
                    password: "",
                    role: "encargado",
                    restaurante: "",
                  });
                  setFormErrors({});
                }}
                onChange={handleInputChange}
            />
        )}
        
        {/* Filtro de restaurante (solo admin) */}
        {currentUser?.role === "admin" && !isOffline && (
          <div className="mb-4 relative">
            <select
              value={selectedRestaurantFilter}
              onChange={(e) => setSelectedRestaurantFilter(e.target.value)}
              className="w-full h-12 bg-white border border-gray-300 rounded-lg pl-4 pr-10 text-gray-700 font-medium focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none appearance-none"
            >
              <option value="">Todos los restaurantes</option>
              {restaurants.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.nombre}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
          </div>
        )}

        {/* Lista de usuarios */}
        {/* Lista de usuarios */}
        {!isOffline && (
            <UserList
                loading={loading}
                users={users}
                selectedRestaurantFilter={selectedRestaurantFilter}
                selectedUserId={selectedUserId}
                lastCreatedUserId={lastCreatedUserId}
                currentUser={currentUser}
                isOffline={isOffline}
                onUserClick={(id) => setSelectedUserId(selectedUserId === id ? null : id)}
                onEditClick={handleStartEditing}
                onDeleteClick={setDeleteConfirm}
            />
        )}

        {/* Modal de Edición */}
        {editingUser && !isOffline && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4
              bg-black/50 animate-[fadeIn_0.2s_ease-out] select-none"
            onClick={handleCancelEditing}
          >
            <UserForm
                initialData={editFormData}
                isEditing={true}
                isSubmitting={isSubmitting}
                errors={formErrors}
                restaurants={restaurants}
                isAdmin={currentUser?.role === 'admin'}
                onSubmit={(e) => {
                    e.preventDefault();
                    const userToEdit = users.find(u => u._id === editingUser);
                    if (userToEdit) {
                        handleSaveUser(userToEdit._id);
                    }
                }}
                onCancel={handleCancelEditing}
                onChange={handleEditFormChange}
            />
          </div>
        )}
        
        {/* Confirmación de eliminación */}
        <DeleteConfirmationModal 
            isOpen={!!deleteConfirm && !isOffline}
            onClose={() => setDeleteConfirm(null)}
            onConfirm={() => handleDeleteUser(deleteConfirm)}
        />
      </div>
    </ModalContainer>
  );
};

UserManagement.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  currentUser: PropTypes.shape({
    _id: PropTypes.string,
    username: PropTypes.string,
    role: PropTypes.string,
    restaurante: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        _id: PropTypes.string,
        nombre: PropTypes.string,
      }),
    ]),
  }),
};

export default UserManagement;

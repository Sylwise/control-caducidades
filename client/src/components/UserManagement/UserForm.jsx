import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Eye, EyeOff, RefreshCw, ChevronDown, Edit } from 'lucide-react';

const UserForm = ({
  initialData = { username: '', password: '', role: 'encargado', restaurante: '' },
  isEditing = false,
  isSubmitting = false,
  errors = {},
  restaurants = [],
  isAdmin = false,
  onSubmit, // (formData) => void
  onCancel,
  onChange, // Optional: if we want controlled input from parent, or we can manage local state
}) => {
  // We can manage local state here, but the parent `UserManagement` has complex validation and state logic.
  // To keep it simple for refactoring, let's make this a Controlled Component that relies on props,
  // OR we can move the state inside. 
  // Given `UserManagement` has `handleInputChange` and `validateForm`, 
  // moving state inside might be cleaner to reduce prop drilling, 
  // BUT `UserManagement` needs to clear state on close.

  // Let's use the props passed from parent for state to minimize logic changes first 
  // and just purely extract the render logic.
  
  // Actually, to make it truly reusable, let's assume `data` and `onChange` are passed.
  
  const [showPassword, setShowPassword] = useState(false);

  const { username, password, role, restaurante } = initialData;

  const handleChange = (e) => {
      onChange(e); // Propagate event
  };

  return (
    <div className={`
        ${isEditing ? "bg-white p-6 rounded-lg shadow-xl w-full max-w-md animate-[slideIn_0.3s_ease-out] select-none" : "mb-6 p-4 bg-gray-50 rounded-lg animate-[slideDown_0.3s_ease-out] select-none"}
    `}
    onClick={isEditing ? (e) => e.stopPropagation() : undefined}
    >
      {isEditing ? (
          <h3 className="text-lg font-semibold text-[#1d5030] mb-4 flex items-center gap-2 select-none">
            <Edit className="w-5 h-5" />
            Editar Usuario
          </h3>
      ) : (
          <h3 className="text-lg font-semibold text-[#1d5030] mb-4 flex items-center gap-2 select-none">
            <Edit className="w-5 h-5" />
            Crear Nuevo Usuario
          </h3>
      )}

      <form onSubmit={onSubmit}>
        {/* Username field */}
        <div className="mb-4">
          <label
            htmlFor={isEditing ? "edit-username" : "username"}
            className="block text-sm font-medium text-gray-700 mb-1 select-none"
          >
            Nombre de Usuario
          </label>
          <input
            type="text"
            id={isEditing ? "edit-username" : "username"}
            name="username"
            value={username}
            onChange={handleChange}
            className={`w-full p-3 border rounded-md min-h-[48px]
              ${
                errors.username
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-[#1d5030]"
              }
              focus:outline-none focus:ring-2 focus:ring-opacity-50 select-none`}
            required={!isEditing} // Required on creation
            minLength={3}
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-500 select-none">{errors.username}</p>
          )}
        </div>

        {/* Password field */}
        <div className="mb-4">
          <label
            htmlFor={isEditing ? "edit-password" : "password"}
            className="block text-sm font-medium text-gray-700 mb-1 select-none"
          >
            {isEditing ? "Nueva Contraseña" : "Contraseña"}
            {isEditing && <span className="text-gray-400 text-xs ml-1">(Dejar en blanco para mantener)</span>}
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id={isEditing ? "edit-password" : "password"}
              name="password"
              value={password}
              onChange={handleChange}
              className={`w-full p-3 border rounded-md pr-10 min-h-[48px]
                ${
                  errors.password
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-[#1d5030]"
                }
                focus:outline-none focus:ring-2 focus:ring-opacity-50 select-none`}
              required={!isEditing}
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2
                p-1 text-gray-400 hover:text-gray-600 select-none"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-500 select-none">{errors.password}</p>
          )}
        </div>

        {/* Role & Restaurant fields - Only show if current user is admin */}
        {isAdmin && (
          <>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2 select-none">
                Rol
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleChange({ target: { name: 'role', value: 'encargado' } })}
                  className={`flex-1 min-h-[48px] py-3 px-4 rounded-md flex items-center justify-center font-medium transition-colors ${
                    role === "encargado"
                      ? "bg-[#1d5030] text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  } select-none`}
                >
                  Encargado
                </button>
                <button
                  type="button"
                  onClick={() => handleChange({ target: { name: 'role', value: 'supervisor' } })}
                  className={`flex-1 min-h-[48px] py-3 px-4 rounded-md flex items-center justify-center font-medium transition-colors ${
                    role === "supervisor"
                      ? "bg-[#1d5030] text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  } select-none`}
                >
                  Supervisor
                </button>
              </div>
            </div>

            <div className="mb-5 relative">
              <label className="block text-sm font-medium text-gray-700 mb-2 select-none">
                Restaurante
              </label>
              <select
                name="restaurante"
                value={restaurante}
                onChange={handleChange}
                className="w-full h-12 bg-white border border-gray-300 rounded-lg pl-4 pr-10 text-gray-700 font-medium focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none appearance-none"
              >
                <option value="">Seleccionar Restaurante</option>
                {restaurants.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.nombre}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-[42px] w-5 h-5 text-gray-500 pointer-events-none" />
            </div>
          </>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-3 min-h-[48px] min-w-[100px] text-sm font-medium text-gray-700
              bg-gray-100 hover:bg-gray-200
              rounded-md transition-colors flex items-center justify-center select-none"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-3 min-h-[48px] min-w-[120px] text-sm font-medium text-white
              bg-[#1d5030] hover:bg-[#1d5030]/90
              rounded-md transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2 select-none"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>{isEditing ? "Guardando..." : "Creando..."}</span>
              </>
            ) : (
                isEditing ? "Guardar Cambios" : "Crear Usuario"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

UserForm.propTypes = {
  initialData: PropTypes.shape({
    username: PropTypes.string,
    password: PropTypes.string,
    role: PropTypes.string,
    restaurante: PropTypes.string,
  }),
  isEditing: PropTypes.bool,
  isSubmitting: PropTypes.bool,
  errors: PropTypes.object,
  restaurants: PropTypes.array,
  isAdmin: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default UserForm;

import React from 'react';
import PropTypes from 'prop-types';
import { RefreshCw, Edit, Trash2 } from 'lucide-react';

const UserList = ({ 
  loading, 
  users, 
  selectedRestaurantFilter, 
  selectedUserId, 
  lastCreatedUserId, 
  currentUser, 
  isOffline, 
  onUserClick, 
  onEditClick, 
  onDeleteClick 
}) => {
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 text-[#1d5030] animate-spin" />
      </div>
    );
  }

  const filteredUsers = users.filter((user) => {
    if (!selectedRestaurantFilter) return true;
    return user.restaurante?._id === selectedRestaurantFilter || user.restaurante === selectedRestaurantFilter;
  });

  if (filteredUsers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 select-none">
        No hay usuarios para mostrar
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredUsers.map((user) => (
        <div
          key={user._id}
          id={`user-${user._id}`}
          className={`p-3 bg-white border border-gray-300/50 rounded-lg shadow hover:shadow-md
            flex items-center justify-between gap-4
            hover:border-gray-300 transition-all
            ${selectedUserId === user._id ? "bg-gray-50" : ""} 
            ${lastCreatedUserId === user._id ? "animate-highlight bg-[#1d5030]/5" : ""}
            select-none`}
          onClick={() => onUserClick(user._id)}
        >
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-[#2d3748] truncate select-none">
              {user.username}
            </h4>
            <p className="text-sm text-gray-500 select-none">
              {user.role === "admin"
                ? "Administrador"
                : user.role === "supervisor"
                ? "Supervisor"
                : "Encargado"}
              {user.restaurante?.nombre && (
                <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                  {user.restaurante.nombre}
                </span>
              )}
            </p>
          </div>

          {/* Acciones (solo visibles cuando el usuario está seleccionado y no está en modo offline) */}
          {!isOffline && currentUser?._id !== user._id && selectedUserId === user._id && (
            <div className="flex items-center gap-2">
              {/* Botón de editar */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditClick(user);
                }}
                className="p-2 min-w-[48px] min-h-[48px] flex items-center justify-center text-[#1d5030] hover:bg-[#1d5030]/10
                  rounded-lg transition-colors select-none"
                aria-label="Editar usuario"
              >
                <Edit className="w-5 h-5" />
              </button>
              
              {/* Botón de eliminar */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteClick(user._id);
                }}
                className="p-2 min-w-[48px] min-h-[48px] flex items-center justify-center text-red-500 hover:bg-red-50
                  rounded-lg transition-colors select-none"
                aria-label="Eliminar usuario"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

UserList.propTypes = {
  loading: PropTypes.bool.isRequired,
  users: PropTypes.array.isRequired,
  selectedRestaurantFilter: PropTypes.string,
  selectedUserId: PropTypes.string,
  lastCreatedUserId: PropTypes.string,
  currentUser: PropTypes.object,
  isOffline: PropTypes.bool.isRequired,
  onUserClick: PropTypes.func.isRequired,
  onEditClick: PropTypes.func.isRequired,
  onDeleteClick: PropTypes.func.isRequired,
};

export default UserList;

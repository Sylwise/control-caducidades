export const TASK_TYPES = [
  { value: "aviso", label: "Aviso" },
  { value: "incidencia", label: "Incidencia" },
  { value: "averia", label: "Avería" },
  { value: "tarea", label: "Tarea" },
];

const TYPE_STYLES = {
  aviso: "bg-blue-50 text-blue-700 border-blue-200",
  incidencia: "bg-orange-50 text-orange-700 border-orange-200",
  averia: "bg-red-50 text-red-700 border-red-200",
  tarea: "bg-gray-50 text-gray-700 border-gray-200",
};

export const getTaskType = (type) => {
  const normalizedType = TASK_TYPES.some((option) => option.value === type) ? type : "tarea";
  return {
    value: normalizedType,
    label: TASK_TYPES.find((option) => option.value === normalizedType).label,
    className: TYPE_STYLES[normalizedType],
  };
};

export const TASK_STATES = {
  pending: { label: "Pendiente", className: "bg-gray-100 text-gray-600 border-gray-200" },
  completed: { label: "Completada", className: "bg-green-50 text-green-700 border-green-200" },
  cancelled: { label: "Cancelada", className: "bg-red-50 text-red-700 border-red-200" },
};

export const getTaskPermissions = (role, status) => {
  const manager = role === "admin" || role === "supervisor";
  return {
    edit: manager && status === "pending",
    cancel: manager && status === "pending",
    reopen: manager && ["completed", "cancelled"].includes(status),
    complete: role === "encargado" && status === "pending",
  };
};

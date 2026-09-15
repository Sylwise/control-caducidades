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

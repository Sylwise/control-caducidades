import { format } from "date-fns";
import { es } from "date-fns/locale";

export const getTaskActivity = (task) => {
  if (task.activity?.length) return task.activity;
  // Only show known facts for legacy tasks; do not fabricate prior transitions.
  const events = [];
  if (task.createdAt) events.push({ type: "created", user: task.createdBy, at: task.createdAt, legacy: true });
  if (task.completedAt && task.completedBy) events.push({ type: "completed", user: task.completedBy, at: task.completedAt, legacy: true });
  return events;
};
export const actorName = (user) => user?.name || user?.username || "Usuario";
export const activityDate = (at) => {
  const date = new Date(at);
  return at && !Number.isNaN(date.getTime()) ? format(date, "dd MMM yyyy HH:mm:ss", { locale: es }) : "Fecha no disponible";
};

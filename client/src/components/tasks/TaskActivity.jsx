import PropTypes from "prop-types";
import { getTaskActivity, actorName, activityDate } from "../../utils/taskActivity";

const labels = { created: "Creada", completed: "Completada", cancelled: "Cancelada", reopened: "Reabierta" };

const TaskActivity = ({ task }) => (
  <section className="mt-4 border-t border-gray-100 pt-4" aria-label="Historial de actividad">
    <h3 className="text-sm font-semibold text-gray-700 mb-3">Actividad</h3>
    <ol className="space-y-3 text-xs text-gray-600">
      {getTaskActivity(task).map((event, index) => (
        <li key={event._id || index}>
          <p><span className="font-medium">{labels[event.type] || event.type}</span> · {actorName(event.user)}</p>
          <time dateTime={event.at}>{activityDate(event.at)}</time>
          {event.reason && <p className="mt-1 whitespace-pre-wrap">Motivo: {event.reason}</p>}
          {event.legacy && <p className="text-gray-400">Registro anterior al historial</p>}
        </li>
      ))}
    </ol>
    {!getTaskActivity(task).length && <p className="text-xs text-gray-400">Sin actividad registrada</p>}
  </section>
);
TaskActivity.propTypes = { task: PropTypes.object.isRequired };
export default TaskActivity;

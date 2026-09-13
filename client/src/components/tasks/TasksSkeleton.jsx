import { Link } from "react-router-dom";

const TasksSkeleton = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Módulo de Tareas</h1>
      <p className="mb-4">Este módulo está en construcción.</p>
      <Link to="/" className="text-blue-500 underline">Volver al inicio</Link>
    </div>
  );
};

export default TasksSkeleton;

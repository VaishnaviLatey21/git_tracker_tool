import { useNavigate } from "react-router-dom";

function ModuleCard({ module, onEdit, onDelete }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <h2 className="text-xl font-semibold">{module.name}</h2>
      <p className="text-gray-500">{module.year}</p>

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => navigate(`/convenor/modules/${module.id}`)}
          className="bg-indigo-600 text-white px-3 py-1 rounded"
        >
          Manage Groups
        </button>

        <button
          onClick={onEdit}
          className="bg-yellow-500 text-white px-3 py-1 rounded"
        >
          Edit
        </button>

        <button
          onClick={onDelete}
          className="bg-rose-600 text-white px-3 py-1 rounded"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default ModuleCard;
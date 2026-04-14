import { useNavigate } from "react-router-dom";

function GroupCard({ group }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
      <h2 className="text-xl font-semibold">
        {group.name}
      </h2>

      <button
        onClick={() => navigate(`/convenor/groups/${group.id}`)}
        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        View Analytics →
      </button>
    </div>
  );
}

export default GroupCard;
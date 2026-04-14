function StudentCard({ student }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <h3 className="text-lg font-semibold">
        {student.name}
      </h3>

      <p className="text-gray-500">{student.email}</p>

      <div className="mt-4 space-y-2 text-sm">
        <p>Total Commits: {student.totalCommits}</p>
        <p>Contribution: {student.contributionPercentage}%</p>

        {student.lowQualityCommits > 0 && (
          <p className="text-rose-600">
            ⚠ {student.lowQualityCommits} Low Quality Commits
          </p>
        )}
      </div>
    </div>
  );
}

export default StudentCard;
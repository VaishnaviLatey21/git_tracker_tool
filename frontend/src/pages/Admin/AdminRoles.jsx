import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, UserCog, Users } from "lucide-react";
import axios from "../../api/axios";

const roleOptions = ["ADMIN", "CONVENOR", "STUDENT"];

function AdminRoles() {
  const [users, setUsers] = useState([]);
  const [pendingRoles, setPendingRoles] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/admin/users");
      const rows = response.data || [];
      setUsers(rows);
      setPendingRoles(
        rows.reduce((acc, row) => {
          acc[row.id] = row.role;
          return acc;
        }, {})
      );
    } catch (error) {
      console.error("Failed to load role data:", error);
      setMessage(error.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const roleCounts = useMemo(
    () =>
      users.reduce(
        (acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        },
        { ADMIN: 0, CONVENOR: 0, STUDENT: 0 }
      ),
    [users]
  );

  const saveRole = async (row) => {
    const nextRole = pendingRoles[row.id];
    if (!nextRole || nextRole === row.role) return;

    setSavingId(row.id);
    setMessage("");
    try {
      await axios.put(`/admin/users/${row.id}/role`, { role: nextRole });
      setMessage(`Updated role for ${row.name}`);
      await loadUsers();
    } catch (error) {
      console.error("Failed updating role:", error);
      setMessage(error.response?.data?.message || "Role update failed");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <div className="rounded-2xl border border-[#d7e1f0] bg-white p-6">Loading role management...</div>;
  }

  return (
    <div className="admin-page space-y-4">
      <section className="admin-surface rounded-2xl border border-[#d7e1f0] bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7188a9]">
          Role Management
        </p>
        <h1 className="text-xl font-bold text-[#21344e] sm:text-2xl">Role Governance</h1>
        <p className="mt-1 text-sm text-[#5f7698]">
          Control who can access admin controls, convenor tooling, and student-facing views.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#d6e0ef] bg-[#f8fbff] p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6c84a8]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[#244066]">{roleCounts.ADMIN}</h2>
          </div>
          <div className="rounded-xl border border-[#d6e0ef] bg-[#f8fbff] p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6c84a8]">
              <UserCog className="h-3.5 w-3.5" />
              Convenor
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[#244066]">{roleCounts.CONVENOR}</h2>
          </div>
          <div className="rounded-xl border border-[#d6e0ef] bg-[#f8fbff] p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6c84a8]">
              <Users className="h-3.5 w-3.5" />
              Student
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[#244066]">{roleCounts.STUDENT}</h2>
          </div>
        </div>

        {message && (
          <p className="mt-3 rounded-lg border border-[#d8e2f0] bg-[#f6f9ff] px-3 py-2 text-sm text-[#355377]">
            {message}
          </p>
        )}
      </section>

      <section className="admin-surface rounded-2xl border border-[#d7e1f0] bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm sm:min-w-[760px]">
            <thead>
              <tr className="border-b border-[#e2e9f4] text-xs uppercase tracking-wider text-[#6f85a5]">
                <th className="px-3 py-3">User</th>
                <th className="hidden px-3 py-3 md:table-cell">Email</th>
                <th className="px-3 py-3">Current Role</th>
                <th className="hidden px-3 py-3 sm:table-cell">Assign New Role</th>
                <th className="px-3 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((row) => {
                const isSaving = savingId === row.id;
                return (
                  <tr key={row.id} className="border-b border-[#edf2f9] text-[#29405f]">
                    <td className="px-3 py-3 font-semibold">{row.name}</td>
                    <td className="hidden px-3 py-3 md:table-cell">{row.email}</td>
                    <td className="px-3 py-3">{row.role}</td>
                    <td className="hidden px-3 py-3 sm:table-cell">
                      <select
                        value={pendingRoles[row.id] || row.role}
                        onChange={(event) =>
                          setPendingRoles((prev) => ({
                            ...prev,
                            [row.id]: event.target.value,
                          }))
                        }
                        disabled={isSaving}
                        className="rounded-lg border border-[#d4dfef] bg-white px-2 py-1 text-xs font-semibold text-[#29415f]"
                      >
                        {roleOptions.map((role) => (
                          <option key={`${row.id}-${role}`} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => saveRole(row)}
                        disabled={isSaving || pendingRoles[row.id] === row.role}
                        className="rounded-lg border border-[#cad9ee] bg-[#edf4ff] px-2.5 py-1.5 text-xs font-semibold text-[#365a89] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="sm:hidden">Save</span>
                        <span className="hidden sm:inline">Save Role</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default AdminRoles;

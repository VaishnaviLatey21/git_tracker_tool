import { useEffect, useMemo, useState } from "react";
import { Trash2, UserRoundSearch } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import axios from "../../api/axios";

const roleOptions = ["ADMIN", "CONVENOR"];

function AdminUsers() {
  const { user: currentUser } = useOutletContext() || {};

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pendingRoles, setPendingRoles] = useState({});
  const [savingUserId, setSavingUserId] = useState(null);
  const [message, setMessage] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/admin/users");
      const rows = response.data || [];
      setUsers(rows);
      setPendingRoles(
        rows.reduce((acc, item) => {
          acc[item.id] = item.role;
          return acc;
        }, {})
      );
    } catch (error) {
      console.error("Failed to load users:", error);
      setMessage(error.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        item.role.toLowerCase().includes(query)
    );
  }, [search, users]);

  const saveRole = async (targetUser) => {
    const nextRole = pendingRoles[targetUser.id];
    if (!nextRole || nextRole === targetUser.role) return;

    setSavingUserId(targetUser.id);
    setMessage("");

    try {
      await axios.put(`/admin/users/${targetUser.id}/role`, { role: nextRole });
      setMessage(`Updated role for ${targetUser.name}`);
      await loadUsers();
    } catch (error) {
      console.error("Failed updating role:", error);
      setMessage(error.response?.data?.message || "Role update failed");
    } finally {
      setSavingUserId(null);
    }
  };

  const deleteUser = async (targetUser) => {
    const confirmed = window.confirm(
      `Delete ${targetUser.name} (${targetUser.email})? This action cannot be undone.`
    );
    if (!confirmed) return;

    setSavingUserId(targetUser.id);
    setMessage("");

    try {
      await axios.delete(`/admin/users/${targetUser.id}`);
      setMessage(`Deleted ${targetUser.name}`);
      await loadUsers();
    } catch (error) {
      console.error("Failed deleting user:", error);
      setMessage(error.response?.data?.message || "Delete failed");
    } finally {
      setSavingUserId(null);
    }
  };

  if (loading) {
    return <div className="rounded-2xl border border-[#d7e1f0] bg-white p-6">Loading users...</div>;
  }

  return (
    <div className="admin-page space-y-4">
      <section className="admin-surface rounded-2xl border border-[#d7e1f0] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7188a9]">
              User Management
            </p>
            <h1 className="text-xl font-bold text-[#21344e] sm:text-2xl">Manage Accounts</h1>
          </div>

          <div className="flex w-full items-center gap-2 rounded-xl border border-[#d6e0ef] bg-[#f9fbff] px-3 py-2 sm:min-w-[240px] sm:w-auto">
            <UserRoundSearch className="h-4 w-4 text-[#6b809f]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email or role..."
              className="w-full bg-transparent text-sm text-[#29415f] outline-none"
            />
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
          <table className="w-full min-w-[680px] text-left text-sm sm:min-w-[860px]">
            <thead>
              <tr className="border-b border-[#e2e9f4] text-xs uppercase tracking-wider text-[#6f85a5]">
                <th className="px-3 py-3">Name</th>
                <th className="hidden px-3 py-3 md:table-cell">Email</th>
                <th className="px-3 py-3">Role</th>
                <th className="hidden px-3 py-3 sm:table-cell">Verified</th>
                <th className="hidden px-3 py-3 sm:table-cell">Modules</th>
                <th className="hidden px-3 py-3 lg:table-cell">Created</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((item) => {
                const isSelf = currentUser?.id === item.id;
                const isSaving = savingUserId === item.id;

                return (
                  <tr key={item.id} className="border-b border-[#edf2f9] text-[#29405f]">
                    <td className="px-3 py-3 font-semibold">{item.name}</td>
                    <td className="hidden px-3 py-3 md:table-cell">{item.email}</td>
                    <td className="px-3 py-3">
                      <select
                        value={pendingRoles[item.id] || item.role}
                        onChange={(event) =>
                          setPendingRoles((prev) => ({
                            ...prev,
                            [item.id]: event.target.value,
                          }))
                        }
                        disabled={isSaving}
                        className="rounded-lg border border-[#d4dfef] bg-white px-2 py-1 text-xs font-semibold text-[#29415f]"
                      >
                        {roleOptions.map((role) => (
                          <option key={`${item.id}-${role}`} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="hidden px-3 py-3 sm:table-cell">
                      {item.isVerified ? (
                        <span className="rounded-full bg-[#e7f8ee] px-2 py-1 text-xs font-semibold text-[#2f7e54]">
                          Yes
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#fff4e4] px-2 py-1 text-xs font-semibold text-[#9b6a29]">
                          No
                        </span>
                      )}
                    </td>
                    <td className="hidden px-3 py-3 sm:table-cell">{item._count?.modules || 0}</td>
                    <td className="hidden px-3 py-3 lg:table-cell">
                      {new Date(item.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => saveRole(item)}
                          disabled={isSaving || pendingRoles[item.id] === item.role}
                          className="rounded-lg border border-[#cad9ee] bg-[#edf4ff] px-2.5 py-1.5 text-xs font-semibold text-[#365a89] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="sm:hidden">Save</span>
                          <span className="hidden sm:inline">Save Role</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteUser(item)}
                          disabled={isSaving || isSelf}
                          title={isSelf ? "Cannot delete your own account" : "Delete user"}
                          className="rounded-lg border border-[#f1d1d7] bg-[#fff3f5] px-2 py-1.5 text-xs font-semibold text-[#b14a5c] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <p className="mt-3 text-sm text-[#6f85a5]">No users matched your search.</p>
        )}
      </section>
    </div>
  );
}

export default AdminUsers;

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import UserForm from "../components/UserForm";
import {
  FiPlus,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiEdit2,
  FiTrash2,
  FiUserCheck,
  FiUserX,
  FiInbox,
} from "react-icons/fi";

function Users() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // ======================================================
  // FETCH USERS
  // ======================================================
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await api.get("/users");
      setUsers(response.data.users || []);
    } catch (error) {
      console.error(
        "Fetch users error:",
        error.response?.data || error.message
      );

      setErrorMessage(
        error.response?.data?.message || "Failed to fetch users"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Auto-dismiss messages
  useEffect(() => {
    if (!successMessage && !errorMessage) return;

    const t = setTimeout(() => {
      setSuccessMessage("");
      setErrorMessage("");
    }, 4000);

    return () => clearTimeout(t);
  }, [successMessage, errorMessage]);

  // ======================================================
  // HANDLERS
  // ======================================================
  const handleAddUser = () => {
    setEditingUser(null);
    setSuccessMessage("");
    setErrorMessage("");
    setShowForm(true);
  };

  const handleEditUser = (selectedUser) => {
    setEditingUser(selectedUser);
    setSuccessMessage("");
    setErrorMessage("");
    setShowForm(true);
  };

  const handleSubmit = async (formData) => {
    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      if (editingUser) {
        await api.put(`/users/${editingUser._id}`, formData);

        setSuccessMessage("User updated successfully");
      } else {
        await api.post("/users", formData);

        setSuccessMessage("User created successfully");
      }

      setShowForm(false);
      setEditingUser(null);

      await fetchUsers();
    } catch (error) {
      console.error(
        "Save user error:",
        error.response?.data || error.message
      );

      setErrorMessage(
        error.response?.data?.message || "Failed to save user"
      );

      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (selectedUser) => {
    const newStatus = !selectedUser.isActive;
    const action = newStatus ? "activate" : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${selectedUser.name}?`
    );

    if (!confirmed) return;

    try {
      setErrorMessage("");
      setSuccessMessage("");

      await api.patch(`/users/${selectedUser._id}/status`, {
        isActive: newStatus,
      });

      setSuccessMessage(
        newStatus
          ? "User activated successfully"
          : "User deactivated successfully"
      );

      await fetchUsers();
    } catch (error) {
      console.error(
        "Update user status error:",
        error.response?.data || error.message
      );

      setErrorMessage(
        error.response?.data?.message || "Failed to update user status"
      );
    }
  };

  const handleDelete = async (selectedUser) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedUser.name}?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(selectedUser._id);
      setErrorMessage("");
      setSuccessMessage("");

      await api.delete(`/users/${selectedUser._id}`);

      setSuccessMessage("User deleted successfully");

      await fetchUsers();
    } catch (error) {
      console.error(
        "Delete user error:",
        error.response?.data || error.message
      );

      setErrorMessage(
        error.response?.data?.message || "Failed to delete user"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  // ======================================================
  // HELPERS
  // ======================================================
  const getRoleStyle = (role) => {
    const r = (role || "").toLowerCase();

    const map = {
      admin: "bg-red-50 text-red-700 ring-red-200",
      manager: "bg-purple-50 text-purple-700 ring-purple-200",
      sales: "bg-blue-50 text-blue-700 ring-blue-200",
    };

    return map[r] || "bg-gray-50 text-gray-600 ring-gray-200";
  };

  const getInitials = (name) => {
    if (!name) return "?";

    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = [
      "bg-blue-100 text-blue-700",
      "bg-purple-100 text-purple-700",
      "bg-green-100 text-green-700",
      "bg-pink-100 text-pink-700",
      "bg-amber-100 text-amber-700",
      "bg-cyan-100 text-cyan-700",
      "bg-indigo-100 text-indigo-700",
    ];

    const str = String(name || "?");

    const idx = str
      .split("")
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

    return colors[idx % colors.length];
  };

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u.isActive).length,
      admins: users.filter((u) => u.role === "admin").length,
      managers: users.filter((u) => u.role === "manager").length,
    };
  }, [users]);

  // ======================================================
  // RENDER
  // ======================================================
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1600px] mx-auto min-h-screen bg-gray-50">

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
            Users
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Manage CRM users and their access.
          </p>
        </div>

        <button
          onClick={handleAddUser}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg transition shadow-sm shadow-blue-600/20 w-full sm:w-auto"
        >
          <FiPlus size={18} />
          Add User
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
            Total Users
          </p>

          <p className="text-2xl font-bold text-gray-900 mt-2">
            {loading ? "..." : stats.total}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              Active
            </p>

            <span className="w-2 h-2 rounded-full bg-green-500"></span>
          </div>

          <p className="text-2xl font-bold text-gray-900 mt-2">
            {loading ? "..." : stats.active}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              Admins
            </p>

            <span className="w-2 h-2 rounded-full bg-red-500"></span>
          </div>

          <p className="text-2xl font-bold text-gray-900 mt-2">
            {loading ? "..." : stats.admins}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              Managers
            </p>

            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
          </div>

          <p className="text-2xl font-bold text-gray-900 mt-2">
            {loading ? "..." : stats.managers}
          </p>
        </div>

      </div>

      {/* ALERTS */}
      {successMessage && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-lg">
          <FiCheckCircle
            className="flex-shrink-0 mt-0.5"
            size={18}
          />

          <p className="flex-1">{successMessage}</p>

          <button
            onClick={() => setSuccessMessage("")}
            className="text-green-600 hover:text-green-800 flex-shrink-0"
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 rounded-lg">
          <FiAlertCircle
            className="flex-shrink-0 mt-0.5"
            size={18}
          />

          <p className="flex-1">{errorMessage}</p>

          <button
            onClick={() => setErrorMessage("")}
            className="text-red-600 hover:text-red-800 flex-shrink-0"
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">

            <svg
              className="animate-spin h-6 w-6 text-blue-600 mb-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>

              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              ></path>
            </svg>

            <p className="text-sm text-gray-500">
              Loading users...
            </p>
          </div>

        ) : users.length === 0 ? (

          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">

            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <FiInbox
                size={28}
                className="text-gray-400"
              />
            </div>

            <h3 className="text-base font-semibold text-gray-800">
              No users found
            </h3>

            <p className="text-sm text-gray-500 mt-1 max-w-sm">
              Click "Add User" to create the first CRM user.
            </p>
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/60">

                  <th className="text-left font-medium text-xs uppercase tracking-wider text-gray-500 px-5 py-3.5">
                    User
                  </th>

                  <th className="text-left font-medium text-xs uppercase tracking-wider text-gray-500 px-4 py-3.5 hidden lg:table-cell">
                    Phone
                  </th>

                  <th className="text-left font-medium text-xs uppercase tracking-wider text-gray-500 px-4 py-3.5">
                    Role
                  </th>

                  <th className="text-left font-medium text-xs uppercase tracking-wider text-gray-500 px-4 py-3.5">
                    Status
                  </th>

                  <th className="text-right font-medium text-xs uppercase tracking-wider text-gray-500 px-5 py-3.5">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {users.map((item) => (

                  <tr
                    key={item._id}
                    className="hover:bg-gray-50/70 transition-colors"
                  >

                    <td className="px-5 py-3.5">

                      <div className="flex items-center gap-3">

                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${getAvatarColor(
                            item.name
                          )}`}
                        >
                          {getInitials(item.name)}
                        </div>

                        <div className="min-w-0">

                          <p className="font-medium text-gray-800 truncate">

                            {item.name}

                            {user?._id === item._id && (
                              <span className="ml-2 text-[10px] text-blue-600 font-semibold">
                                (You)
                              </span>
                            )}

                          </p>

                          <p className="text-xs text-gray-500 truncate">
                            {item.email}
                          </p>

                        </div>

                      </div>

                    </td>

                    <td className="px-4 py-3.5 text-gray-700 hidden lg:table-cell">
                      {item.phone || "—"}
                    </td>

                    <td className="px-4 py-3.5">

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset capitalize ${getRoleStyle(
                          item.role
                        )}`}
                      >
                        {item.role}
                      </span>

                    </td>

                    <td className="px-4 py-3.5">

                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${
                          item.isActive
                            ? "bg-green-50 text-green-700 ring-green-200"
                            : "bg-gray-50 text-gray-600 ring-gray-200"
                        }`}
                      >

                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.isActive
                              ? "bg-green-500"
                              : "bg-gray-400"
                          }`}
                        ></span>

                        {item.isActive ? "Active" : "Inactive"}

                      </span>

                    </td>

                    <td className="px-5 py-3.5">

                      <div className="flex items-center justify-end gap-1">

                        <button
                          onClick={() => handleEditUser(item)}
                          title="Edit"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition"
                        >
                          <FiEdit2 size={16} />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(item)}
                          title={
                            item.isActive
                              ? "Deactivate"
                              : "Activate"
                          }
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition ${
                            item.isActive
                              ? "text-gray-500 hover:text-orange-600 hover:bg-orange-50"
                              : "text-gray-500 hover:text-green-600 hover:bg-green-50"
                          }`}
                        >
                          {item.isActive ? (
                            <FiUserX size={16} />
                          ) : (
                            <FiUserCheck size={16} />
                          )}
                        </button>

                        <button
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item._id}
                          title="Delete"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <FiTrash2 size={16} />
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* USER FORM MODAL */}
      <UserForm
        isOpen={showForm}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        editingUser={editingUser}
        loading={saving}
      />

    </div>
  );
}

export default Users;
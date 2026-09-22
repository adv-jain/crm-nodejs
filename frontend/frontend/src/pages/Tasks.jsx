import { useEffect, useState, useMemo } from "react";
import api from "../api";

import TaskTable from "../components/TaskTable";
import TaskForm from "../components/TaskForm";
import ViewTask from "../components/ViewTask";

import { useAuth } from "../context/AuthContext";
import {
  FiPlus,
  FiSearch,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

function Tasks() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);

  const [leads, setLeads] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [deals, setDeals] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);

  const [editingTask, setEditingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [type, setType] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [totalTasks, setTotalTasks] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // ========================================
  // FETCH TASKS
  // ========================================
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const params = {};

      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;
      if (priority) params.priority = priority;
      if (type) params.type = type;
      if (assignedTo) params.assignedTo = assignedTo;

      params.page = page;
      params.limit = limit;

      const response = await api.get("/tasks", {
        params,
      });

      setTasks(response.data.tasks || []);
      setTotalTasks(response.data.totalTasks || 0);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error(
        "Fetch tasks error:",
        error.response?.data || error.message
      );

      setErrorMessage(
        error.response?.data?.message || "Failed to fetch tasks"
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // FETCH RELATED DATA
  // ========================================
  const fetchRelatedData = async () => {
    try {
      const requests = [
        api.get("/leads"),
        api.get("/contacts"),
        api.get("/companies"),
        api.get("/deals"),
      ];

      if (user?.role === "admin" || user?.role === "manager") {
        requests.push(api.get("/tasks/assignable-users"));
      }

      const responses = await Promise.all(requests);

      setLeads(responses[0].data.leads || []);
      setContacts(responses[1].data.contacts || []);
      setCompanies(responses[2].data.companies || []);
      setDeals(responses[3].data.deals || []);

      if (user?.role === "admin" || user?.role === "manager") {
        setUsers(responses[4].data.users || []);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error(
        "Fetch related data error:",
        error.response?.data || error.message
      );
    }
  };

  // ========================================
  // INITIAL LOAD
  // ========================================
  useEffect(() => {
    if (!user) return;

    fetchRelatedData();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    fetchTasks();
  }, [user, page, status, priority, type, assignedTo]);

  // ========================================
  // AUTO DISMISS MESSAGES
  // ========================================
  useEffect(() => {
    if (!successMessage && !errorMessage) return;

    const t = setTimeout(() => {
      setSuccessMessage("");
      setErrorMessage("");
    }, 4000);

    return () => clearTimeout(t);
  }, [successMessage, errorMessage]);

  // ========================================
  // HANDLERS
  // ========================================
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTasks();
  };

  const handleCreate = () => {
    setEditingTask(null);
    setShowForm(true);
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleView = (task) => {
    setSelectedTask(task);
    setShowView(true);
  };

  // ========================================
  // DELETE TASK
  // ========================================
  const handleDelete = async (task) => {
    if (user?.role !== "admin") return;

    const confirmed = window.confirm(
      `Delete task "${task.title}"?`
    );

    if (!confirmed) return;

    try {
      setErrorMessage("");
      setSuccessMessage("");

      await api.delete(`/tasks/${task._id}`);

      setSuccessMessage("Task deleted successfully");

      await fetchTasks();
    } catch (error) {
      console.error(
        "Delete task error:",
        error.response?.data || error.message
      );

      setErrorMessage(
        error.response?.data?.message || "Failed to delete task"
      );
    }
  };

  // ========================================
  // COMPLETE TASK
  // ========================================
  const handleComplete = async (task) => {
    if (task.status === "Completed") return;

    try {
      setErrorMessage("");
      setSuccessMessage("");

      await api.put(`/tasks/${task._id}`, {
        status: "Completed",
      });

      setSuccessMessage("Task marked as completed");

      await fetchTasks();
    } catch (error) {
      console.error(
        "Complete task error:",
        error.response?.data || error.message
      );

      setErrorMessage(
        error.response?.data?.message || "Failed to complete task"
      );
    }
  };

  // ========================================
  // SAVED
  // ========================================
  const handleSaved = async () => {
    setShowForm(false);
    setEditingTask(null);

    await fetchTasks();
  };

  // ========================================
  // RESET FILTERS
  // ========================================
  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setPriority("");
    setType("");
    setAssignedTo("");
    setPage(1);
  };

  // ========================================
  // STATS
  // ========================================
  const stats = useMemo(() => {
    return {
      total: totalTasks,
      pending: tasks.filter((t) => t.status === "Pending").length,
      inProgress: tasks.filter((t) => t.status === "In Progress").length,
      completed: tasks.filter((t) => t.status === "Completed").length,
    };
  }, [tasks, totalTasks]);

  // ========================================
  // ACTIVE FILTER COUNT
  // ========================================
  const activeFilterCount = useMemo(() => {
    return [
      search,
      status,
      priority,
      type,
      assignedTo,
    ].filter(Boolean).length;
  }, [search, status, priority, type, assignedTo]);

  // ========================================
  // RENDER
  // ========================================
  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1600px] mx-auto w-full">

        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
              Tasks
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Manage follow-ups, activities and work assigned to your team.
            </p>
          </div>

          <button
            onClick={handleCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg transition shadow-sm shadow-blue-600/20 w-full sm:w-auto"
          >
            <FiPlus size={18} />
            Create Task
          </button>
        </div>

        {/* STATISTICS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              Total Tasks
            </p>

            <p className="text-2xl font-bold text-gray-900 mt-2">
              {loading ? "..." : stats.total}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                Pending
              </p>

              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            </div>

            <p className="text-2xl font-bold text-gray-900 mt-2">
              {loading ? "..." : stats.pending}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                In Progress
              </p>

              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            </div>

            <p className="text-2xl font-bold text-gray-900 mt-2">
              {loading ? "..." : stats.inProgress}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                Completed
              </p>

              <span className="w-2 h-2 rounded-full bg-green-500"></span>
            </div>

            <p className="text-2xl font-bold text-gray-900 mt-2">
              {loading ? "..." : stats.completed}
            </p>
          </div>
        </div>

        {/* SEARCH + FILTERS */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-3">

            <form
              onSubmit={handleSearch}
              className="relative flex-1 min-w-[240px]"
            >
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <FiSearch size={18} />
              </span>

              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  paddingLeft: "2.75rem",
                  paddingRight: "2.5rem",
                  height: "2.75rem",
                }}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                >
                  <FiX size={14} />
                </button>
              )}
            </form>

            {/* STATUS */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              style={{ height: "2.75rem" }}
              className="w-full sm:w-40 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {/* PRIORITY */}
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
              style={{ height: "2.75rem" }}
              className="w-full sm:w-36 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition cursor-pointer"
            >
              <option value="">All Priority</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>

            {/* TYPE */}
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              style={{ height: "2.75rem" }}
              className="w-full sm:w-40 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="Call">Call</option>
              <option value="Email">Email</option>
              <option value="Meeting">Meeting</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Demo">Demo</option>
              <option value="Proposal">Proposal</option>
              <option value="Documentation">Documentation</option>
              <option value="Other">Other</option>
            </select>

            {/* ASSIGNED TO */}
            {(user?.role === "admin" || user?.role === "manager") && (
              <select
                value={assignedTo}
                onChange={(e) => {
                  setAssignedTo(e.target.value);
                  setPage(1);
                }}
                style={{ height: "2.75rem" }}
                className="w-full sm:w-44 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition cursor-pointer"
              >
                <option value="">All Assignees</option>

                {users.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            )}

            {/* RESET */}
            <button
              type="button"
              onClick={resetFilters}
              disabled={activeFilterCount === 0}
              style={{ height: "2.75rem" }}
              className="px-4 inline-flex items-center justify-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 hover:text-red-600 hover:bg-red-50 hover:border-red-200 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FiX size={16} />
              <span>Reset</span>
            </button>
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

        {/* RESULT INFO */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-700">
              {tasks.length}
            </span>{" "}
            {tasks.length === 1 ? "task" : "tasks"}

            {totalTasks > 0 && (
              <span className="ml-1">
                of {totalTasks}
              </span>
            )}

            {activeFilterCount > 0 && (
              <span className="ml-1">
                · {activeFilterCount}{" "}
                {activeFilterCount === 1
                  ? "filter"
                  : "filters"}{" "}
                applied
              </span>
            )}
          </p>
        </div>

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
                Loading tasks...
              </p>
            </div>
          ) : (
            <TaskTable
              tasks={tasks}
              user={user}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onComplete={handleComplete}
            />
          )}
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 pt-2">

            <p className="text-xs text-gray-500">
              Page{" "}
              <span className="font-semibold text-gray-700">
                {page}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-700">
                {totalPages}
              </span>
            </p>

            <div className="flex items-center gap-2">

              <button
                disabled={page === 1}
                onClick={() =>
                  setPage((prev) => prev - 1)
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FiChevronLeft size={16} />
                Previous
              </button>

              <button
                disabled={page === totalPages}
                onClick={() =>
                  setPage((prev) => prev + 1)
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
                <FiChevronRight size={16} />
              </button>

            </div>
          </div>
        )}
      </div>

      {/* TASK FORM */}
      {showForm && (
        <TaskForm
          user={user}
          editingTask={editingTask}
          leads={leads}
          contacts={contacts}
          companies={companies}
          deals={deals}
          users={users}
          onClose={() => {
            setShowForm(false);
            setEditingTask(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {/* VIEW TASK */}
      {showView && selectedTask && (
        <ViewTask
          task={selectedTask}
          onClose={() => {
            setShowView(false);
            setSelectedTask(null);
          }}
        />
      )}
    </>
  );
}

export default Tasks;
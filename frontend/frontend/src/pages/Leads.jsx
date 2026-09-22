import { useEffect, useState, useMemo } from "react";
import api from "../api";

import LeadTable from "../components/LeadTable";
import LeadForm from "../components/LeadForm";
import ViewLead from "../components/ViewLead";
import { useAuth } from "../context/AuthContext";
import {
  FiPlus,
  FiSearch,
  FiX,
  FiFilter,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

function Leads() {
  const { user } = useAuth();

  // =========================
  // STATES
  // =========================
  const [leads, setLeads] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [priority, setPriority] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [viewLead, setViewLead] = useState(null);

  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [convertingId, setConvertingId] = useState(null);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // =========================
  // FETCH LEADS
  // =========================
  const fetchLeads = async () => {
    try {
      setErrorMessage("");

      const response = await api.get("/leads", {
        params: {
          search,
          status,
          source,
          priority,
        },
      });

      setLeads(response.data.leads || []);
    } catch (error) {
      console.error(
        "Fetch leads error:",
        error.response?.data || error.message
      );

      setErrorMessage(
        error.response?.data?.message || "Failed to fetch leads"
      );
    }
  };

  // =========================
  // FETCH ASSIGNABLE USERS
  // =========================
  const fetchAssignableUsers = async () => {
    if (user?.role !== "admin" && user?.role !== "manager") {
      setAssignableUsers([]);
      return;
    }

    try {
      const response = await api.get("/leads/assignable-users");

      setAssignableUsers(response.data.users || []);
    } catch (error) {
      console.error(
        "Fetch assignable users error:",
        error.response?.data || error.message
      );

      setErrorMessage(
        error.response?.data?.message ||
          "Failed to fetch assignable users"
      );
    }
  };

  // =========================
  // EFFECTS
  // =========================
  useEffect(() => {
    fetchLeads();
  }, [search, status, source, priority]);

  useEffect(() => {
    if (user) {
      fetchAssignableUsers();
    }
  }, [user]);

  // =========================
  // AUTO-DISMISS MESSAGES
  // =========================
  useEffect(() => {
    if (!successMessage && !errorMessage) return;

    const t = setTimeout(() => {
      setSuccessMessage("");
      setErrorMessage("");
    }, 4000);

    return () => clearTimeout(t);
  }, [successMessage, errorMessage]);

  // =========================
  // HANDLERS
  // =========================
  const handleAddLead = () => {
    setEditingLead(null);
    setShowForm(true);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleEditLead = (lead) => {
    setEditingLead(lead);
    setShowForm(true);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleSubmitLead = async (formData) => {
    try {
      setLoading(true);
      setErrorMessage("");

      if (editingLead) {
        await api.put(
          `/leads/${editingLead._id}`,
          formData
        );

        setSuccessMessage("Lead updated successfully");
      } else {
        await api.post("/leads", formData);

        setSuccessMessage("Lead created successfully");
      }

      setShowForm(false);
      setEditingLead(null);

      await fetchLeads();
    } catch (error) {
      console.error(
        "Save lead error:",
        error.response?.data || error.message
      );

      setErrorMessage(
        error.response?.data?.message || "Failed to save lead"
      );

      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLead = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this lead?"
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(id);
      setErrorMessage("");
      setSuccessMessage("");

      await api.delete(`/leads/${id}`);

      setSuccessMessage("Lead deleted successfully");

      await fetchLeads();
    } catch (error) {
      console.error(
        "Delete lead error:",
        error.response?.data || error.message
      );

      setErrorMessage(
        error.response?.data?.message ||
          "Failed to delete lead"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleConvertLead = async (lead) => {
    const confirmConvert = window.confirm(
      `Convert ${lead.firstName} ${lead.lastName} into a Contact?`
    );

    if (!confirmConvert) return;

    try {
      setConvertingId(lead._id);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await api.post(
        `/leads/${lead._id}/convert`,
        {}
      );

      setSuccessMessage(
        response.data.message ||
          "Lead converted successfully"
      );

      await fetchLeads();
    } catch (error) {
      console.error(
        "Convert lead error:",
        error.response?.data || error.message
      );

      setErrorMessage(
        error.response?.data?.message ||
          "Failed to convert lead"
      );
    } finally {
      setConvertingId(null);
    }
  };

  const handleViewLead = async (lead) => {
    try {
      const response = await api.get(
        `/leads/${lead._id}`
      );

      setViewLead(response.data.lead);
    } catch (error) {
      console.error(
        "View lead error:",
        error.response?.data || error.message
      );

      setErrorMessage(
        error.response?.data?.message ||
          "Failed to fetch lead"
      );
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingLead(null);
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatus("");
    setSource("");
    setPriority("");
  };

  // =========================
  // ACTIVE FILTER COUNT
  // =========================
  const activeFilterCount = useMemo(() => {
    return [
      search,
      status,
      source,
      priority,
    ].filter(Boolean).length;
  }, [search, status, source, priority]);

  // =========================
  // RENDER
  // =========================
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
            Leads
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Manage your leads and sales opportunities.
          </p>
        </div>

        <button
          onClick={handleAddLead}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg transition shadow-sm shadow-blue-600/20 w-full sm:w-auto"
        >
          <FiPlus size={18} />
          Add Lead
        </button>
      </div>

      {/* SEARCH + FILTERS CARD */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">

        {/* Top row */}
        <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-gray-100">

          {/* SEARCH */}
          <div className="relative flex-1">
            <FiSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              size={17}
            />

            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 focus:bg-white transition"
            />

            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <FiX size={14} />
              </button>
            )}
          </div>

          {/* ACTIVE FILTERS */}
          <div className="flex items-center gap-2">

            {activeFilterCount > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg ring-1 ring-inset ring-blue-200">
                <FiFilter size={12} />
                {activeFilterCount} active
              </span>
            )}

            <button
              onClick={handleClearFilters}
              disabled={activeFilterCount === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-600"
            >
              <FiX size={15} />
              Clear
            </button>
          </div>
        </div>

        {/* Filters row */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">

          {/* STATUS */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
              Status
            </label>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 focus:bg-white transition cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Proposal">Proposal</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          {/* SOURCE */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
              Source
            </label>

            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 focus:bg-white transition cursor-pointer"
            >
              <option value="">All Sources</option>
              <option value="Website">Website</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="Google Ads">Google Ads</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Referral">Referral</option>
              <option value="Cold Call">Cold Call</option>
              <option value="Email Campaign">Email Campaign</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* PRIORITY */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
              Priority
            </label>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 focus:bg-white transition cursor-pointer"
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

        </div>
      </div>

      {/* ALERTS */}
      {successMessage && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-lg">
          <FiCheckCircle
            className="flex-shrink-0 mt-0.5"
            size={18}
          />

          <p className="flex-1">
            {successMessage}
          </p>

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

          <p className="flex-1">
            {errorMessage}
          </p>

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
            {leads.length}
          </span>{" "}
          {leads.length === 1 ? "lead" : "leads"}

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

      {/* LEAD TABLE */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <LeadTable
          leads={leads}
          onView={handleViewLead}
          onEdit={handleEditLead}
          onDelete={handleDeleteLead}
          onConvert={handleConvertLead}
          deletingId={deletingId}
          convertingId={convertingId}
          user={user}
        />
      </div>

      {/* MODALS */}
      <LeadForm
        isOpen={showForm}
        onClose={handleCloseForm}
        onSubmit={handleSubmitLead}
        editingLead={editingLead}
        loading={loading}
        currentUser={user}
        assignableUsers={assignableUsers}
      />

      {viewLead && (
        <ViewLead
          lead={viewLead}
          onClose={() => setViewLead(null)}
        />
      )}
    </div>
  );
}

export default Leads;
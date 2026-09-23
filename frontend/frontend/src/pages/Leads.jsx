import { useEffect, useState, useMemo, useRef } from "react";
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
  FiChevronLeft,
  FiChevronRight,
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

  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);

  // =========================
  // PAGINATION STATES
  // =========================
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);

  const RECORDS_PER_PAGE = 50;

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
  const fetchLeads = async (page = currentPage) => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await api.get("/leads", {
        params: {
          search,
          status,
          source,
          priority,
          page,
          limit: RECORDS_PER_PAGE,
        },
      });

      const data = response.data;

      setLeads(data.leads || []);
      setCurrentPage(data.page || page);
      setTotalPages(data.totalPages || 1);
      setTotalLeads(data.total || 0);
    } catch (error) {
      console.error("Fetch leads error:", error.response?.data || error.message);
      setErrorMessage(error.response?.data?.message || "Failed to fetch leads");
    } finally {
      setLoading(false);
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
      console.error("Fetch assignable users error:", error.response?.data || error.message);
    }
  };

  // =========================
  // EFFECTS
  // =========================
  useEffect(() => {
    setCurrentPage(1);
  }, [search, status, source, priority]);

  useEffect(() => {
    fetchLeads(currentPage);
  }, [currentPage, search, status, source, priority]);

  useEffect(() => {
    if (user) fetchAssignableUsers();
  }, [user]);

  useEffect(() => {
    if (!successMessage && !errorMessage) return;
    const timer = setTimeout(() => {
      setSuccessMessage("");
      setErrorMessage("");
    }, 4000);
    return () => clearTimeout(timer);
  }, [successMessage, errorMessage]);

  // Close filter popover on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilters(false);
      }
    };
    if (showFilters) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilters]);

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
        await api.put(`/leads/${editingLead._id}`, formData);
        setSuccessMessage("Lead updated successfully");
      } else {
        await api.post("/leads", formData);
        setSuccessMessage("Lead created successfully");
      }
      setShowForm(false);
      setEditingLead(null);
      await fetchLeads(currentPage);
    } catch (error) {
      console.error("Save lead error:", error.response?.data || error.message);
      setErrorMessage(error.response?.data?.message || "Failed to save lead");
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

      if (leads.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        await fetchLeads(currentPage);
      }
    } catch (error) {
      console.error("Delete lead error:", error.response?.data || error.message);
      setErrorMessage(error.response?.data?.message || "Failed to delete lead");
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

      const response = await api.post(`/leads/${lead._id}/convert`, {});
      setSuccessMessage(response.data.message || "Lead converted successfully");

      if (leads.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        await fetchLeads(currentPage);
      }
    } catch (error) {
      console.error("Convert lead error:", error.response?.data || error.message);
      setErrorMessage(error.response?.data?.message || "Failed to convert lead");
    } finally {
      setConvertingId(null);
    }
  };

  const handleViewLead = async (lead) => {
    try {
      const response = await api.get(`/leads/${lead._id}`);
      setViewLead(response.data.lead);
    } catch (error) {
      console.error("View lead error:", error.response?.data || error.message);
      setErrorMessage(error.response?.data?.message || "Failed to fetch lead");
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
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const activeFilterCount = useMemo(() => {
    return [search, status, source, priority].filter(Boolean).length;
  }, [search, status, source, priority]);

  const dropdownFilterCount = useMemo(() => {
    return [status, source, priority].filter(Boolean).length;
  }, [status, source, priority]);

  // =========================
  // RENDER
  // =========================
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1600px] mx-auto">

      {/* ============================================
          HEADER: SEARCH + FILTER (left) | ADD (right)
          ============================================ */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">

        {/* LEFT: SEARCH + FILTER */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">

          {/* SEARCH */}
          <div className="relative w-full sm:w-64">
            <FiSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              size={15}
            />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 h-9 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-600"
              >
                <FiX size={13} />
              </button>
            )}
          </div>

          {/* FILTER BUTTON + POPOVER */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilters((prev) => !prev)}
              className={`inline-flex items-center justify-center gap-1.5 px-3 h-9 text-sm font-medium rounded-lg border transition whitespace-nowrap ${
                dropdownFilterCount > 0
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <FiFilter size={14} />
              <span className="hidden sm:inline">Filters</span>
              {dropdownFilterCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[10px] font-semibold bg-blue-600 text-white rounded-full">
                  {dropdownFilterCount}
                </span>
              )}
            </button>

            {/* MODERN FILTER POPOVER */}
            {showFilters && (
              <div className="absolute left-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg shadow-gray-200/60 z-30 overflow-hidden">

                {/* HEADER */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Filters
                  </h3>
                  {dropdownFilterCount > 0 && (
                    <button
                      onClick={handleClearFilters}
                      className="text-xs font-medium text-gray-500 hover:text-red-600 transition"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* BODY */}
                <div className="p-4 space-y-4">

                  {/* STATUS */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      Status
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {["New", "Contacted", "Qualified", "Proposal", "Negotiation", "Won", "Lost"].map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatus(status === s ? "" : s)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md border transition ${
                            status === s
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SOURCE */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      Source
                    </label>
                    <select
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 cursor-pointer"
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
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      Priority
                    </label>
                    <div className="flex gap-1.5">
                      {["Low", "Medium", "High"].map((p) => (
                        <button
                          key={p}
                          onClick={() => setPriority(priority === p ? "" : p)}
                          className={`flex-1 px-2.5 py-1.5 text-xs font-medium rounded-md border transition ${
                            priority === p
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* FOOTER */}
                <div className="flex items-center justify-between gap-2 px-4 py-3 bg-gray-50 border-t border-gray-100">
                  <button
                    onClick={handleClearFilters}
                    disabled={dropdownFilterCount === 0}
                    className="text-xs font-medium text-gray-600 hover:text-gray-900 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Clear all
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: ADD BUTTON */}
        <button
          onClick={handleAddLead}
          className="inline-flex items-center justify-center gap-1.5 px-4 h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition shadow-sm whitespace-nowrap self-start lg:self-auto"
        >
          <FiPlus size={15} />
          Add Lead
        </button>
      </div>

      {/* ALERTS */}
      {successMessage && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-lg">
          <FiCheckCircle className="flex-shrink-0 mt-0.5" size={18} />
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
          <FiAlertCircle className="flex-shrink-0 mt-0.5" size={18} />
          <p className="flex-1">{errorMessage}</p>
          <button
            onClick={() => setErrorMessage("")}
            className="text-red-600 hover:text-red-800 flex-shrink-0"
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      {/* LEAD TABLE */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-7 h-7 border-[3px] border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500">Loading leads...</p>
            </div>
          </div>
        ) : (
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
        )}
      </div>

      {/* FOOTER: SHOWING INFO (left) | PAGINATION (right) */}
      {!loading && totalLeads > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* SHOWING */}
          <p className="text-xs text-gray-500">
            Showing{" "}
            <span className="font-medium text-gray-700">{leads.length}</span> of{" "}
            <span className="font-medium text-gray-700">{totalLeads}</span>{" "}
            {totalLeads === 1 ? "lead" : "leads"}
          </p>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || loading}
                className="w-8 h-8 inline-flex items-center justify-center text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FiChevronLeft size={16} />
              </button>

              <span className="px-3 h-8 inline-flex items-center text-sm font-medium text-gray-700">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages || loading}
                className="w-8 h-8 inline-flex items-center justify-center text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

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
        <ViewLead lead={viewLead} onClose={() => setViewLead(null)} />
      )}

    </div>
  );
}

export default Leads;
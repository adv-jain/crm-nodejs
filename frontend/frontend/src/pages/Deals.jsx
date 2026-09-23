import { useEffect, useState, useMemo, useRef } from "react";
import api from "../api";

import DealTable from "../components/DealTable";
import DealForm from "../components/DealForm";
import ViewDeal from "../components/ViewDeal";

import { useAuth } from "../context/AuthContext";

import {
  FiSearch,
  FiPlus,
  FiX,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiGrid,
  FiList,
} from "react-icons/fi";

const PIPELINE_STAGES = [
  "New",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost",
];

const LOST_REASONS = [
  "Price",
  "Competitor",
  "No Budget",
  "Not Interested",
  "Timing",
  "No Response",
  "Other",
];

function Deals() {
  const { user } = useAuth();

  // ==========================================
  // DATA
  // ==========================================
  const [deals, setDeals] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);

  // ==========================================
  // PAGINATION
  // ==========================================
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDeals, setTotalDeals] = useState(0);

  const RECORDS_PER_PAGE = 50;

  // ==========================================
  // FILTERS
  // ==========================================
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");
  const [company, setCompany] = useState("");
  const [owner, setOwner] = useState("");

  // ==========================================
  // VIEW MODE
  // ==========================================
  const [viewMode, setViewMode] = useState("table");

  // ==========================================
  // FORM
  // ==========================================
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [viewDeal, setViewDeal] = useState(null);

  // ==========================================
  // LOADING
  // ==========================================
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [changingStageId, setChangingStageId] = useState(null);

  // ==========================================
  // LOST REASON MODAL
  // ==========================================
  const [showLostReasonModal, setShowLostReasonModal] = useState(false);
  const [lostReason, setLostReason] = useState("");
  const [lostDeal, setLostDeal] = useState(null);

  // ==========================================
  // MESSAGES
  // ==========================================
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // ==========================================
  // FILTER POPOVER
  // ==========================================
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);

  // ==========================================
  // FETCH DEALS
  // ==========================================
  const fetchDeals = async (page = 1) => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await api.get("/deals", {
        params: { search, stage, company, owner, page, limit: RECORDS_PER_PAGE },
      });

      const data = response.data;

      setDeals(data.deals || []);
      setCurrentPage(Number(data.page) || page);
      setTotalPages(Math.max(Number(data.totalPages) || 1, 1));
      setTotalDeals(Number(data.total) || 0);
    } catch (error) {
      console.error("Fetch deals error:", error.response?.data || error.message);
      setErrorMessage(error.response?.data?.message || "Failed to fetch deals");
      setDeals([]);
      setTotalDeals(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await api.get("/companies");
      setCompanies(response.data.companies || []);
    } catch (error) {
      console.error("Fetch companies error:", error.response?.data || error.message);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await api.get("/contacts", {
        params: { page: 1, limit: RECORDS_PER_PAGE },
      });
      setContacts(response.data.contacts || []);
    } catch (error) {
      console.error("Fetch contacts error:", error.response?.data || error.message);
    }
  };

  const fetchLeads = async () => {
    try {
      const response = await api.get("/leads", {
        params: { page: 1, limit: RECORDS_PER_PAGE },
      });
      setLeads(response.data.leads || []);
    } catch (error) {
      console.error("Fetch leads error:", error.response?.data || error.message);
    }
  };

  const fetchUsers = async () => {
    if (user?.role !== "admin" && user?.role !== "manager") {
      setUsers([]);
      return;
    }
    try {
      const response = await api.get("/deals/assignable-users");
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Fetch assignable users error:", error.response?.data || error.message);
      setUsers([]);
    }
  };

  // ==========================================
  // EFFECTS
  // ==========================================
  useEffect(() => {
    if (!user) return;
    fetchCompanies();
    fetchContacts();
    fetchLeads();
    fetchUsers();
  }, [user]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, stage, company, owner]);

  useEffect(() => {
    if (!user) return;
    fetchDeals(currentPage);
  }, [user, currentPage, search, stage, company, owner]);

  useEffect(() => {
    if (!successMessage && !errorMessage) return;
    const t = setTimeout(() => {
      setSuccessMessage("");
      setErrorMessage("");
    }, 4000);
    return () => clearTimeout(t);
  }, [successMessage, errorMessage]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilters(false);
      }
    };
    if (showFilters) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilters]);

  // ==========================================
  // PAGINATION
  // ==========================================
  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // ==========================================
  // CRUD HANDLERS
  // ==========================================
  const handleAddDeal = () => {
    setEditingDeal(null);
    setShowForm(true);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleEditDeal = (deal) => {
    setEditingDeal(deal);
    setShowForm(true);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleSubmitDeal = async (formData) => {
    try {
      setSaving(true);
      setErrorMessage("");

      if (editingDeal) {
        await api.put(`/deals/${editingDeal._id}`, formData);
        setSuccessMessage("Deal updated successfully");
      } else {
        await api.post("/deals", formData);
        setSuccessMessage("Deal created successfully");
      }

      setShowForm(false);
      setEditingDeal(null);
      await fetchDeals(currentPage);
    } catch (error) {
      console.error("Save deal error:", error.response?.data || error.message);
      setErrorMessage(error.response?.data?.message || "Failed to save deal");
    } finally {
      setSaving(false);
    }
  };

  const openLostReasonModal = (deal) => {
    setLostDeal(deal);
    setLostReason("");
    setShowLostReasonModal(true);
    setErrorMessage("");
  };

  const closeLostReasonModal = () => {
    if (changingStageId) return;
    setShowLostReasonModal(false);
    setLostDeal(null);
    setLostReason("");
  };

  const confirmLostDeal = async () => {
    if (!lostDeal) return;
    if (!lostReason) {
      setErrorMessage("Please select a lost reason");
      return;
    }

    try {
      setChangingStageId(lostDeal._id);
      setErrorMessage("");
      setSuccessMessage("");

      await api.put(`/deals/${lostDeal._id}`, {
        stage: "Lost",
        lostReason,
      });

      setShowLostReasonModal(false);
      setLostDeal(null);
      setLostReason("");
      setSuccessMessage(`Deal "${lostDeal.title}" marked as Lost`);
      await fetchDeals(currentPage);
    } catch (error) {
      console.error("Mark deal lost error:", error.response?.data || error.message);
      setErrorMessage(
        error.response?.data?.message || "Failed to mark deal as Lost"
      );
    } finally {
      setChangingStageId(null);
    }
  };

  const handleStageChange = async (deal, newStage) => {
    if (!newStage || newStage === deal.stage) return;

    if (newStage === "Lost") {
      openLostReasonModal(deal);
      return;
    }

    if (newStage === "Won") {
      const confirmed = window.confirm(
        `Are you sure you want to mark "${deal.title}" as Won?`
      );
      if (!confirmed) return;
    }

    try {
      setChangingStageId(deal._id);
      setErrorMessage("");
      setSuccessMessage("");

      await api.put(`/deals/${deal._id}`, { stage: newStage });

      setSuccessMessage(`Deal moved to ${newStage} successfully`);
      await fetchDeals(currentPage);
    } catch (error) {
      console.error("Change deal stage error:", error.response?.data || error.message);
      setErrorMessage(
        error.response?.data?.message || "Failed to change deal stage"
      );
    } finally {
      setChangingStageId(null);
    }
  };

  const handleDeleteDeal = async (id) => {
    if (user?.role !== "admin") {
      setErrorMessage("Only admin can delete deals");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this deal?"
    );
    if (!confirmDelete) return;

    try {
      setDeletingId(id);
      setErrorMessage("");
      setSuccessMessage("");

      await api.delete(`/deals/${id}`);
      setSuccessMessage("Deal deleted successfully");

      if (deals.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        await fetchDeals(currentPage);
      }
    } catch (error) {
      console.error("Delete deal error:", error.response?.data || error.message);
      setErrorMessage(error.response?.data?.message || "Failed to delete deal");
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewDeal = async (deal) => {
    try {
      const response = await api.get(`/deals/${deal._id}`);
      setViewDeal(response.data.deal);
    } catch (error) {
      console.error("View deal error:", error.response?.data || error.message);
      setErrorMessage(error.response?.data?.message || "Failed to fetch deal");
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingDeal(null);
  };

  const handleClearFilters = () => {
    setSearch("");
    setStage("");
    setCompany("");
    setOwner("");
  };

  // ==========================================
  // HELPERS
  // ==========================================
  const getDealsByStage = (stageName) =>
    deals.filter((deal) => deal.stage === stageName);

  const getStageAccent = (stageName) => {
    const map = {
      New: "border-t-gray-500",
      Qualified: "border-t-blue-600",
      Proposal: "border-t-purple-600",
      Negotiation: "border-t-amber-500",
      Won: "border-t-green-600",
      Lost: "border-t-red-600",
    };
    return map[stageName] || "border-t-gray-400";
  };

  const getStageHeaderColor = (stageName) => {
    const map = {
      New: "text-gray-700",
      Qualified: "text-blue-600",
      Proposal: "text-purple-600",
      Negotiation: "text-amber-600",
      Won: "text-green-600",
      Lost: "text-red-600",
    };
    return map[stageName] || "text-gray-700";
  };

  // ==========================================
  // FILTER COUNTS
  // ==========================================
  const activeFilterCount = useMemo(() => {
    return [search, stage, company, owner].filter(Boolean).length;
  }, [search, stage, company, owner]);

  const dropdownFilterCount = useMemo(() => {
    return [stage, company, owner].filter(Boolean).length;
  }, [stage, company, owner]);

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1600px] mx-auto">

      {/* ============================================
          HEADER: SEARCH + FILTER (left) | VIEW + ADD (right)
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
              placeholder="Search deals..."
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

            {/* MODERN FILTER POPOVER (left aligned) */}
            {showFilters && (
              <div className="absolute left-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg shadow-gray-200/60 z-30 overflow-hidden">

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

                <div className="p-4 space-y-4">

                  {/* STAGE CHIPS */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      Stage
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {PIPELINE_STAGES.map((s) => (
                        <button
                          key={s}
                          onClick={() => setStage(stage === s ? "" : s)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md border transition ${
                            stage === s
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* COMPANY */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      Company
                    </label>
                    <select
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 cursor-pointer"
                    >
                      <option value="">All Companies</option>
                      {companies.map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* OWNER */}
                  {(user?.role === "admin" || user?.role === "manager") && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">
                        Owner
                      </label>
                      <select
                        value={owner}
                        onChange={(e) => setOwner(e.target.value)}
                        className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 cursor-pointer"
                      >
                        <option value="">All Owners</option>
                        {users.map((item) => (
                          <option key={item._id} value={item._id}>
                            {item.name} ({item.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

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

        {/* RIGHT: VIEW TOGGLE + ADD */}
        <div className="flex items-center gap-2 self-start lg:self-auto">

          {/* VIEW TOGGLE */}
          <button
            type="button"
            onClick={() =>
              setViewMode(viewMode === "table" ? "pipeline" : "table")
            }
            title={viewMode === "table" ? "Switch to Pipeline" : "Switch to Table"}
            className="inline-flex items-center justify-center gap-1.5 px-3 h-9 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition whitespace-nowrap"
          >
            {viewMode === "table" ? (
              <>
                <FiGrid size={14} />
                <span className="hidden sm:inline">Pipeline</span>
              </>
            ) : (
              <>
                <FiList size={14} />
                <span className="hidden sm:inline">Table</span>
              </>
            )}
          </button>

          {/* ADD BUTTON */}
          <button
            onClick={handleAddDeal}
            className="inline-flex items-center justify-center gap-1.5 px-4 h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition shadow-sm whitespace-nowrap"
          >
            <FiPlus size={15} />
            Add Deal
          </button>
        </div>
      </div>

      {/* ALERTS */}
      {successMessage && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-lg">
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
          <p className="flex-1">{errorMessage}</p>
          <button
            onClick={() => setErrorMessage("")}
            className="text-red-600 hover:text-red-800 flex-shrink-0"
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      {/* LOADING / CONTENT */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-7 h-7 border-[3px] border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500">Loading deals...</p>
          </div>
        </div>
      ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <DealTable
            deals={deals}
            onView={handleViewDeal}
            onEdit={handleEditDeal}
            onDelete={handleDeleteDeal}
            deletingId={deletingId}
            user={user}
          />
        </div>
      ) : (
        /* PIPELINE VIEW */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stageName) => {
            const stageDeals = getDealsByStage(stageName);
            const totalValue = stageDeals.reduce(
              (sum, deal) => sum + Number(deal.value || 0),
              0
            );

            return (
              <div
                key={stageName}
                className={`w-[320px] flex-shrink-0 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden border-t-4 ${getStageAccent(
                  stageName
                )} flex flex-col`}
              >
                {/* COLUMN HEADER */}
                <div className="px-4 py-4 bg-white border-b border-gray-200">
                  <div className="flex items-center justify-between gap-2">
                    <h3
                      className={`text-sm font-bold ${getStageHeaderColor(
                        stageName
                      )}`}
                    >
                      {stageName}
                    </h3>
                    <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-gray-100 text-gray-700 text-[11px] font-bold rounded-full">
                      {stageDeals.length}
                    </span>
                  </div>
                  <strong className="block mt-2 text-base font-bold text-gray-800">
                    ₹{totalValue.toLocaleString("en-IN")}
                  </strong>
                </div>

                {/* COLUMN BODY */}
                <div className="p-3 min-h-[180px] space-y-3 flex-1">
                  {stageDeals.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-400 italic">
                      No deals
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <div
                        key={deal._id}
                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <h4 className="text-sm font-semibold text-gray-900 leading-snug mb-2">
                          {deal.title}
                        </h4>

                        <div className="text-lg font-bold text-gray-900 mb-3">
                          ₹{Number(deal.value || 0).toLocaleString("en-IN")}
                        </div>

                        <div className="flex flex-col gap-1.5 mb-3">
                          <span className="text-xs text-gray-500 truncate">
                            👤{" "}
                            {deal.contact
                              ? `${deal.contact.firstName || ""} ${
                                  deal.contact.lastName || ""
                                }`.trim()
                              : "No contact"}
                          </span>
                          <span className="text-xs text-gray-500 truncate">
                            🏢 {deal.company?.name || "No company"}
                          </span>
                          <span className="text-xs text-gray-500 truncate">
                            👨‍💼 {deal.owner?.name || "No owner"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all duration-300"
                              style={{ width: `${deal.probability || 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700">
                            {deal.probability || 0}%
                          </span>
                        </div>

                        <div className="pt-3 border-t border-gray-100 mb-3">
                          <label className="block mb-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            Change Stage
                          </label>
                          <select
                            value={deal.stage}
                            disabled={changingStageId === deal._id}
                            onChange={(e) =>
                              handleStageChange(deal, e.target.value)
                            }
                            className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded-md text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            {PIPELINE_STAGES.map((stageOption) => (
                              <option key={stageOption} value={stageOption}>
                                {stageOption}
                              </option>
                            ))}
                          </select>
                          {changingStageId === deal._id && (
                            <small className="block mt-1.5 text-[11px] text-gray-500">
                              Updating...
                            </small>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewDeal(deal)}
                            className="flex-1 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-md transition"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditDeal(deal)}
                            className="flex-1 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-md transition"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FOOTER: SHOWING (left) | PAGE INFO + PAGINATION (right) */}
      {!loading && totalDeals > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* SHOWING */}
          <p className="text-xs text-gray-500">
            Showing <span className="font-medium text-gray-700">{deals.length}</span> of{" "}
            <span className="font-medium text-gray-700">{totalDeals}</span>{" "}
            {totalDeals === 1 ? "deal" : "deals"}
            {activeFilterCount > 0 && (
              <span className="ml-1">
                · {activeFilterCount}{" "}
                {activeFilterCount === 1 ? "filter" : "filters"} applied
              </span>
            )}
          </p>

          {/* PAGE INFO + PAGINATION */}
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-500">
              Page <span className="font-medium text-gray-700">{currentPage}</span> of{" "}
              <span className="font-medium text-gray-700">{totalPages}</span>
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={handlePreviousPage}
                  className="w-8 h-8 inline-flex items-center justify-center text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FiChevronLeft size={16} />
                </button>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={handleNextPage}
                  className="w-8 h-8 inline-flex items-center justify-center text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FiChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DEAL FORM */}
      <DealForm
        isOpen={showForm}
        onClose={handleCloseForm}
        onSubmit={handleSubmitDeal}
        editingDeal={editingDeal}
        loading={saving}
        companies={companies}
        contacts={contacts}
        leads={leads}
        users={users}
        user={user}
      />

      {/* VIEW DEAL */}
      {viewDeal && (
        <ViewDeal deal={viewDeal} onClose={() => setViewDeal(null)} />
      )}

      {/* LOST REASON MODAL */}
      {showLostReasonModal && lostDeal && (
        <div className="fixed inset-0 z-[9999] bg-black/55 flex items-center justify-center p-4">
          <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-2xl overflow-hidden">

            <div className="flex items-start justify-between px-5 sm:px-6 py-5 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Mark Deal as Lost
                </h2>
                <p className="mt-1 text-sm text-gray-500 truncate">
                  {lostDeal.title}
                </p>
              </div>
              <button
                type="button"
                onClick={closeLostReasonModal}
                disabled={changingStageId === lostDeal._id}
                className="text-3xl leading-none text-gray-500 hover:text-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                ×
              </button>
            </div>

            <div className="px-5 sm:px-6 py-5">
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Lost Reason <span className="text-red-600">*</span>
              </label>

              <select
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                className="w-full h-11 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 cursor-pointer"
              >
                <option value="">Select Lost Reason</option>
                {LOST_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs text-gray-500">
                Please select the reason why this deal was lost.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 px-5 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={closeLostReasonModal}
                disabled={changingStageId === lostDeal._id}
                className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLostDeal}
                disabled={changingStageId === lostDeal._id}
                className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {changingStageId === lostDeal._id ? "Saving..." : "Mark as Lost"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Deals;
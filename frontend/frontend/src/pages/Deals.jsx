import { useEffect, useState } from "react";
import api from "../api";

import DealTable from "../components/DealTable";
import DealForm from "../components/DealForm";
import ViewDeal from "../components/ViewDeal";

import { useAuth } from "../context/AuthContext";

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
  // FETCH DEALS
  // ==========================================
  const fetchDeals = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await api.get("/deals", {
        params: {
          search,
          stage,
          company,
          owner,
        },
      });

      setDeals(response.data.deals || []);
    } catch (error) {
      console.error(
        "Fetch deals error:",
        error.response?.data || error.message
      );

      setErrorMessage(
        error.response?.data?.message || "Failed to fetch deals"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FETCH COMPANIES
  // ==========================================
  const fetchCompanies = async () => {
    try {
      const response = await api.get("/companies");

      setCompanies(response.data.companies || []);
    } catch (error) {
      console.error(
        "Fetch companies error:",
        error.response?.data || error.message
      );
    }
  };

  // ==========================================
  // FETCH CONTACTS
  // ==========================================
  const fetchContacts = async () => {
    try {
      const response = await api.get("/contacts");

      setContacts(response.data.contacts || []);
    } catch (error) {
      console.error(
        "Fetch contacts error:",
        error.response?.data || error.message
      );
    }
  };

  // ==========================================
  // FETCH LEADS
  // ==========================================
  const fetchLeads = async () => {
    try {
      const response = await api.get("/leads");

      setLeads(response.data.leads || []);
    } catch (error) {
      console.error(
        "Fetch leads error:",
        error.response?.data || error.message
      );
    }
  };

  // ==========================================
  // FETCH USERS
  // ==========================================
  const fetchUsers = async () => {
    if (user?.role !== "admin" && user?.role !== "manager") {
      setUsers([]);
      return;
    }

    try {
      const response = await api.get("/deals/assignable-users");

      setUsers(response.data.users || []);
    } catch (error) {
      console.error(
        "Fetch assignable users error:",
        error.response?.data || error.message
      );

      setUsers([]);
    }
  };

  // ==========================================
  // INITIAL DATA
  // ==========================================
  useEffect(() => {
    if (!user) return;

    fetchCompanies();
    fetchContacts();
    fetchLeads();
    fetchUsers();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    fetchDeals();
  }, [user, search, stage, company, owner]);

  // ==========================================
  // ADD DEAL
  // ==========================================
  const handleAddDeal = () => {
    setEditingDeal(null);
    setShowForm(true);
    setSuccessMessage("");
    setErrorMessage("");
  };

  // ==========================================
  // EDIT DEAL
  // ==========================================
  const handleEditDeal = (deal) => {
    setEditingDeal(deal);
    setShowForm(true);
    setSuccessMessage("");
    setErrorMessage("");
  };

  // ==========================================
  // SAVE DEAL
  // ==========================================
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

      await fetchDeals();
    } catch (error) {
      console.error(
        "Save deal error:",
        error.response?.data || error.message
      );

      throw error;
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // OPEN LOST REASON MODAL
  // ==========================================
  const openLostReasonModal = (deal) => {
    setLostDeal(deal);
    setLostReason("");
    setShowLostReasonModal(true);
    setErrorMessage("");
  };

  // ==========================================
  // CLOSE LOST REASON MODAL
  // ==========================================
  const closeLostReasonModal = () => {
    if (changingStageId) return;

    setShowLostReasonModal(false);
    setLostDeal(null);
    setLostReason("");
  };

  // ==========================================
  // CONFIRM LOST DEAL
  // ==========================================
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

      await fetchDeals();
    } catch (error) {
      console.error(
        "Mark deal lost error:",
        error.response?.data || error.message
      );

      setErrorMessage(
        error.response?.data?.message || "Failed to mark deal as Lost"
      );
    } finally {
      setChangingStageId(null);
    }
  };

  // ==========================================
  // CHANGE DEAL STAGE
  // ==========================================
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

      await api.put(`/deals/${deal._id}`, {
        stage: newStage,
      });

      setSuccessMessage(`Deal moved to ${newStage} successfully`);

      await fetchDeals();
    } catch (error) {
      console.error(
        "Change deal stage error:",
        error.response?.data || error.message
      );

      setErrorMessage(
        error.response?.data?.message || "Failed to change deal stage"
      );
    } finally {
      setChangingStageId(null);
    }
  };

  // ==========================================
  // DELETE DEAL
  // ==========================================
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

      await fetchDeals();
    } catch (error) {
      console.error(
        "Delete deal error:",
        error.response?.data || error.message
      );

      setErrorMessage(
        error.response?.data?.message || "Failed to delete deal"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================
  // VIEW DEAL
  // ==========================================
  const handleViewDeal = async (deal) => {
    try {
      const response = await api.get(`/deals/${deal._id}`);

      setViewDeal(response.data.deal);
    } catch (error) {
      console.error(
        "View deal error:",
        error.response?.data || error.message
      );

      setErrorMessage(
        error.response?.data?.message || "Failed to fetch deal"
      );
    }
  };

  // ==========================================
  // CLOSE FORM
  // ==========================================
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingDeal(null);
  };

  // ==========================================
  // CLEAR FILTERS
  // ==========================================
  const handleClearFilters = () => {
    setSearch("");
    setStage("");
    setCompany("");
    setOwner("");
  };

  // ==========================================
  // GET DEALS BY STAGE
  // ==========================================
  const getDealsByStage = (stageName) =>
    deals.filter((deal) => deal.stage === stageName);

  // ==========================================
  // STAGE ACCENT COLORS
  // ==========================================
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

  // ==========================================
  // STAGE HEADER COLOR
  // ==========================================
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
  // RENDER
  // ==========================================
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1600px] mx-auto min-h-screen bg-gray-50">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
            Deals
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Manage your sales pipeline and opportunities.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() =>
              setViewMode(viewMode === "table" ? "pipeline" : "table")
            }
            className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg transition"
          >
            {viewMode === "table" ? "📊 Pipeline View" : "☷ Table View"}
          </button>

          <button
            onClick={handleAddDeal}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg transition shadow-sm shadow-blue-600/20"
          >
            + Add Deal
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-3">

          {/* SEARCH */}
          <div className="flex-1 min-w-[240px]">
            <input
              type="text"
              placeholder="Search deals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 px-3.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition"
            />
          </div>

          {/* STAGE */}
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="h-11 w-full sm:w-44 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition cursor-pointer"
          >
            <option value="">All Stages</option>

            {PIPELINE_STAGES.map((stageName) => (
              <option key={stageName} value={stageName}>
                {stageName}
              </option>
            ))}
          </select>

          {/* COMPANY */}
          <select
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="h-11 w-full sm:w-44 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition cursor-pointer"
          >
            <option value="">All Companies</option>

            {companies.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>

          {/* OWNER */}
          {(user?.role === "admin" || user?.role === "manager") && (
            <select
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="h-11 w-full sm:w-44 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition cursor-pointer"
            >
              <option value="">All Owners</option>

              {users.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name} ({item.role})
                </option>
              ))}
            </select>
          )}

          {/* CLEAR */}
          <button
            onClick={handleClearFilters}
            className="h-11 px-4 inline-flex items-center justify-center bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 text-gray-700 text-sm font-semibold rounded-lg transition"
          >
            Clear
          </button>
        </div>
      </div>

      {/* SUCCESS MESSAGE */}
      {successMessage && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-lg">
          <span className="flex-1">{successMessage}</span>
        </div>
      )}

      {/* ERROR MESSAGE */}
      {errorMessage && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 rounded-lg">
          <span className="flex-1">{errorMessage}</span>
        </div>
      )}

      {/* LOADING / CONTENT */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500 text-sm">
          Loading deals...
        </div>
      ) : viewMode === "table" ? (

        /* TABLE VIEW */
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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

                        {/* TITLE */}
                        <h4 className="text-sm font-semibold text-gray-900 leading-snug mb-2">
                          {deal.title}
                        </h4>

                        {/* VALUE */}
                        <div className="text-lg font-bold text-gray-900 mb-3">
                          ₹{Number(deal.value || 0).toLocaleString("en-IN")}
                        </div>

                        {/* INFO */}
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

                        {/* PROBABILITY */}
                        <div className="flex items-center gap-2 mb-3">

                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all duration-300"
                              style={{
                                width: `${deal.probability || 0}%`,
                              }}
                            />
                          </div>

                          <span className="text-xs font-semibold text-gray-700">
                            {deal.probability || 0}%
                          </span>

                        </div>

                        {/* STAGE CHANGE */}
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
                              <option
                                key={stageOption}
                                value={stageOption}
                              >
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

                        {/* ACTIONS */}
                        <div className="flex gap-2">

                          <button
                            type="button"
                            onClick={() => handleViewDeal(deal)}
                            className="flex-1 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-md transition"
                          >
                            👁️ View
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEditDeal(deal)}
                            className="flex-1 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-md transition"
                          >
                            ✏️ Edit
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
        <ViewDeal
          deal={viewDeal}
          onClose={() => setViewDeal(null)}
        />
      )}

      {/* LOST REASON MODAL */}
      {showLostReasonModal && lostDeal && (
        <div className="fixed inset-0 z-[9999] bg-black/55 flex items-center justify-center p-4">

          <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-2xl overflow-hidden">

            {/* HEADER */}
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

            {/* BODY */}
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

            {/* FOOTER */}
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
                {changingStageId === lostDeal._id
                  ? "Saving..."
                  : "Mark as Lost"}
              </button>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default Deals;
import { useEffect, useState } from "react";
import { FiX, FiAlertCircle } from "react-icons/fi";

const initialForm = {
  title: "",
  value: "",
  stage: "New",
  probability: 20,
  expectedCloseDate: "",
  lostReason: "",
  company: "",
  contact: "",
  lead: "",
  owner: "",
  description: "",
};

function DealForm({
  isOpen,
  onClose,
  onSubmit,
  editingDeal,
  loading,
  companies = [],
  contacts = [],
  leads = [],
  users = [],
  user,
}) {
  const [formData, setFormData] = useState(initialForm);
  const [formError, setFormError] = useState("");

  // =================================
  // LOAD EDIT DATA
  // =================================
  useEffect(() => {
    if (editingDeal) {
      setFormData({
        title: editingDeal.title || "",
        value: editingDeal.value ?? "",
        stage: editingDeal.stage || "New",
        probability: editingDeal.probability ?? 20,
        expectedCloseDate: editingDeal.expectedCloseDate
          ? new Date(editingDeal.expectedCloseDate).toISOString().split("T")[0]
          : "",
        lostReason: editingDeal.lostReason || "",
        company: editingDeal.company?._id || editingDeal.company || "",
        contact: editingDeal.contact?._id || editingDeal.contact || "",
        lead: editingDeal.lead?._id || editingDeal.lead || "",
        owner: editingDeal.owner?._id || editingDeal.owner || "",
        description: editingDeal.description || "",
      });
    } else {
      setFormData({ ...initialForm });
    }
    setFormError("");
  }, [editingDeal, isOpen]);

  // ESC key close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, loading, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // =================================
  // HANDLE CHANGE
  // =================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // STAGE CHANGE — clear lost reason if not Lost
    if (name === "stage" && value !== "Lost") {
      setFormData((prev) => ({ ...prev, stage: value, lostReason: "" }));
    }

    // LEAD CHANGE — auto-assign owner for admin/manager
    if (name === "lead") {
      const selectedLead = leads.find((lead) => lead._id === value);

      if (selectedLead?.assignedTo) {
        const leadOwner = selectedLead.assignedTo;
        const ownerId =
          typeof leadOwner === "object" ? leadOwner._id : leadOwner;

        if (user?.role === "admin" || user?.role === "manager") {
          setFormData((prev) => ({
            ...prev,
            lead: value,
            owner: ownerId || "",
          }));
        } else {
          setFormData((prev) => ({ ...prev, lead: value }));
        }
      } else {
        setFormData((prev) => ({ ...prev, lead: value }));
      }
    }
  };

  // =================================
  // SUBMIT
  // =================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.title.trim()) {
      setFormError("Deal title is required");
      return;
    }

    if (formData.value === "" || Number(formData.value) < 0) {
      setFormError("Valid deal value is required");
      return;
    }

    if (formData.stage === "Lost" && !formData.lostReason) {
      setFormError("Please select a lost reason");
      return;
    }

    const submitData = {
      title: formData.title.trim(),
      value: Number(formData.value) || 0,
      stage: formData.stage,
      probability: Number(formData.probability) || 0,
      description: formData.description.trim(),
      company: formData.company || undefined,
      contact: formData.contact || undefined,
      lead: formData.lead || undefined,
      expectedCloseDate: formData.expectedCloseDate || undefined,
      lostReason:
        formData.stage === "Lost" ? formData.lostReason : undefined,
    };

    // Owner — only admin/manager
    if (user?.role === "admin" || user?.role === "manager") {
      submitData.owner = formData.owner || undefined;
    }

    // Sales → backend auto-assigns

    try {
      await onSubmit(submitData);
    } catch (error) {
      setFormError(
        error.response?.data?.message || "Something went wrong"
      );
    }
  };

  const canAssign =
    user?.role === "admin" || user?.role === "manager";

  // =================================
  // UI
  // =================================
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-[2px] animate-[fadeIn_.15s_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="w-full max-w-[560px] max-h-[88vh] bg-white rounded-2xl shadow-2xl shadow-gray-900/20 flex flex-col overflow-hidden animate-[popIn_.18s_ease-out]">

        {/* ============================================
            HEADER
        ============================================ */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {editingDeal ? "Edit Deal" : "New Deal"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {editingDeal
                ? "Update the deal information"
                : "Fill in the details below"}
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition disabled:opacity-40"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* ============================================
            SCROLLABLE BODY
        ============================================ */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* ERROR */}
          {formError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg mb-4">
              <FiAlertCircle className="flex-shrink-0 mt-0.5" size={14} />
              <span>{formError}</span>
            </div>
          )}

          <form
            id="deal-form"
            onSubmit={handleSubmit}
            className="space-y-3.5"
          >
            {/* TITLE + VALUE */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Deal Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="ABC CRM Deal"
                  autoFocus
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Deal Value (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="value"
                  value={formData.value}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition"
                />
              </div>
            </div>

            {/* STAGE + PROBABILITY */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Stage
                </label>
                <select
                  name="stage"
                  value={formData.stage}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition cursor-pointer"
                >
                  <option value="New">New</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Proposal">Proposal</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Won">Won</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Probability (%)
                </label>
                <input
                  type="number"
                  name="probability"
                  value={formData.probability}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition"
                />
              </div>
            </div>

            {/* LOST REASON (conditional) */}
            {formData.stage === "Lost" && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Lost Reason <span className="text-red-500">*</span>
                </label>
                <select
                  name="lostReason"
                  value={formData.lostReason}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition cursor-pointer"
                >
                  <option value="">Select Lost Reason</option>
                  <option value="Price">Price</option>
                  <option value="Competitor">Competitor</option>
                  <option value="No Budget">No Budget</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="Timing">Timing</option>
                  <option value="No Response">No Response</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            )}

            {/* CLOSE DATE */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Expected Close Date
              </label>
              <input
                type="date"
                name="expectedCloseDate"
                value={formData.expectedCloseDate}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition"
              />
            </div>

            {/* COMPANY */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Company
              </label>
              <select
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition cursor-pointer"
              >
                <option value="">Select Company</option>
                {companies.map((company) => (
                  <option key={company._id} value={company._id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            {/* CONTACT */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Contact
              </label>
              <select
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition cursor-pointer"
              >
                <option value="">Select Contact</option>
                {contacts.map((contact) => (
                  <option key={contact._id} value={contact._id}>
                    {contact.firstName} {contact.lastName || ""}
                  </option>
                ))}
              </select>
            </div>

            {/* LEAD */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Lead
              </label>
              <select
                name="lead"
                value={formData.lead}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition cursor-pointer"
              >
                <option value="">Select Lead</option>
                {leads.map((lead) => (
                  <option key={lead._id} value={lead._id}>
                    {lead.firstName} {lead.lastName || ""}
                  </option>
                ))}
              </select>
            </div>

            {/* ASSIGNED TO (admin/manager) */}
            {canAssign && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Assigned To
                </label>
                <select
                  name="owner"
                  value={formData.owner}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition cursor-pointer"
                >
                  <option value="">Select User</option>
                  {users.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name} ({item.role})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1.5">
                  By default, the lead owner will be assigned.
                </p>
              </div>
            )}

            {/* SALES OWNER INFO */}
            {user?.role === "sales" && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
                <p className="text-xs text-blue-700">
                  This deal will be assigned to you automatically.
                </p>
              </div>
            )}

            {/* DESCRIPTION */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter deal description..."
                rows="3"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition resize-none"
              />
            </div>
          </form>
        </div>

        {/* ============================================
            FOOTER
        ============================================ */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-gray-100 bg-gray-50/60 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="deal-form"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition shadow-sm shadow-blue-600/20 disabled:opacity-60 min-w-[100px]"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-3.5 w-3.5"
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
                Saving
              </>
            ) : editingDeal ? (
              "Update"
            ) : (
              "Create"
            )}
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.96) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
}

export default DealForm;
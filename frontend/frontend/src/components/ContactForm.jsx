import { useEffect, useState } from "react";
import { FiX, FiAlertCircle } from "react-icons/fi";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  designation: "",
  company: "",
  lead: "",
  owner: "",
  notes: "",
};

function ContactForm({
  isOpen,
  onClose,
  onSubmit,
  editingContact,
  loading,
  currentUser,
  assignableUsers = [],
}) {
  const [formData, setFormData] = useState(initialForm);
  const [formError, setFormError] = useState("");

  // =========================
  // POPULATE FORM
  // =========================
  useEffect(() => {
    if (editingContact) {
      setFormData({
        firstName: editingContact.firstName || "",
        lastName: editingContact.lastName || "",
        email: editingContact.email || "",
        phone: editingContact.phone || "",
        designation: editingContact.designation || "",
        company: editingContact.company?._id || editingContact.company || "",
        lead: editingContact.lead?._id || editingContact.lead || "",
        owner: editingContact.owner?._id || editingContact.owner || "",
        notes: editingContact.notes || "",
      });
    } else {
      setFormData(initialForm);
    }
    setFormError("");
  }, [editingContact, isOpen]);

  // =========================
  // ESC KEY CLOSE
  // =========================
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, loading, onClose]);

  // =========================
  // BODY SCROLL LOCK
  // =========================
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.firstName.trim()) {
      setFormError("First name is required");
      return;
    }

    try {
      const submitData = {
        ...formData,
        company: formData.company || undefined,
        lead: formData.lead || undefined,
      };

      // Owner sirf Admin/Manager assign kar sakte hain
      if (
        currentUser?.role !== "admin" &&
        currentUser?.role !== "manager"
      ) {
        delete submitData.owner;
      } else {
        submitData.owner = formData.owner || undefined;
      }

      await onSubmit(submitData);
    } catch (error) {
      setFormError(
        error.response?.data?.message || "Something went wrong"
      );
    }
  };

  const canAssignOwner =
    currentUser?.role === "admin" || currentUser?.role === "manager";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-[2px] animate-[fadeIn_.15s_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="w-full max-w-[560px] max-h-[88vh] bg-white rounded-2xl shadow-2xl shadow-gray-900/20 flex flex-col overflow-hidden animate-[popIn_.18s_ease-out]">

        {/* =====================================================
            HEADER
        ===================================================== */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {editingContact ? "Edit Contact" : "New Contact"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {editingContact
                ? "Update the contact information"
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

        {/* =====================================================
            SCROLLABLE BODY
        ===================================================== */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Error Alert */}
          {formError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg mb-4">
              <FiAlertCircle className="flex-shrink-0 mt-0.5" size={14} />
              <span>{formError}</span>
            </div>
          )}

          <form
            id="contact-form"
            onSubmit={handleSubmit}
            className="space-y-3.5"
          >
            {/* ============================================
                NAME ROW
            ============================================ */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  autoFocus
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition"
                />
              </div>
            </div>

            {/* ============================================
                EMAIL + PHONE
            ============================================ */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@company.com"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition"
                />
              </div>
            </div>

            {/* ============================================
                DESIGNATION + OWNER
            ============================================ */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Designation
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="Manager"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition"
                />
              </div>

              {canAssignOwner && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Owner
                  </label>
                  <select
                    name="owner"
                    value={formData.owner}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {assignableUsers?.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* ============================================
                COMPANY
            ============================================ */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Company ID
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Optional"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition"
              />
            </div>

            {/* ============================================
                LEAD
            ============================================ */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Lead ID
              </label>
              <input
                type="text"
                name="lead"
                value={formData.lead}
                onChange={handleChange}
                placeholder="Optional"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition"
              />
            </div>

            {/* ============================================
                NOTES
            ============================================ */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Add notes..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition resize-none"
              />
            </div>
          </form>
        </div>

        {/* =====================================================
            FOOTER
        ===================================================== */}
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
            form="contact-form"
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
            ) : editingContact ? (
              "Update"
            ) : (
              "Create"
            )}
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.96) translateY(6px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default ContactForm;
import {
  FiX,
  FiMail,
  FiPhone,
  FiDollarSign,
  FiUser,
  FiBriefcase,
  FiTag,
} from "react-icons/fi";

function ViewLead({ lead, onClose }) {
  if (!lead) return null;

  // Status pill
  const getStatusStyle = (status) => {
    const s = (status || "").toLowerCase();
    const map = {
      new: "bg-blue-50 text-blue-700 ring-blue-200",
      contacted: "bg-cyan-50 text-cyan-700 ring-cyan-200",
      qualified: "bg-green-50 text-green-700 ring-green-200",
      proposal: "bg-purple-50 text-purple-700 ring-purple-200",
      negotiation: "bg-amber-50 text-amber-700 ring-amber-200",
      won: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      lost: "bg-red-50 text-red-700 ring-red-200",
    };
    return map[s] || "bg-gray-50 text-gray-700 ring-gray-200";
  };

  // Priority pill
  const getPriorityStyle = (priority) => {
    const p = (priority || "").toLowerCase();
    const map = {
      high: "bg-red-50 text-red-700 ring-red-200",
      medium: "bg-amber-50 text-amber-700 ring-amber-200",
      low: "bg-gray-50 text-gray-600 ring-gray-200",
    };
    return map[p] || "bg-gray-50 text-gray-600 ring-gray-200";
  };

  const initials =
    (lead.firstName?.[0] || "") + (lead.lastName?.[0] || "");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-[2px] animate-[fadeIn_.15s_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[560px] max-h-[88vh] bg-white rounded-2xl shadow-2xl shadow-gray-900/20 flex flex-col overflow-hidden animate-[popIn_.18s_ease-out]">

        {/* =====================================================
            HEADER — same style as Edit
        ===================================================== */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Lead Details
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              View complete information
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* =====================================================
            BODY — same spacing as Edit
        ===================================================== */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* AVATAR + NAME + PILLS */}
          <div className="flex items-center gap-3.5 pb-4 mb-4 border-b border-gray-100">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 uppercase shadow-sm">
              {initials || "?"}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {lead.firstName} {lead.lastName}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {lead.email || "No email on record"}
              </p>

              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ring-inset ${getStatusStyle(
                    lead.status
                  )}`}
                >
                  {lead.status || "—"}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ring-inset ${getPriorityStyle(
                    lead.priority
                  )}`}
                >
                  {lead.priority || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* FORM-STYLE FIELDS — same layout as Edit form */}
          <div className="space-y-3.5">

            {/* NAME ROW */}
            <div className="grid grid-cols-2 gap-3">
              <ReadOnlyField
                label="First Name"
                value={lead.firstName}
              />
              <ReadOnlyField
                label="Last Name"
                value={lead.lastName}
              />
            </div>

            {/* EMAIL + PHONE */}
            <div className="grid grid-cols-2 gap-3">
              <ReadOnlyField
                label="Email"
                value={lead.email}
                icon={<FiMail size={13} />}
              />
              <ReadOnlyField
                label="Phone"
                value={lead.phone}
                icon={<FiPhone size={13} />}
              />
            </div>

            {/* SOURCE + STATUS */}
            <div className="grid grid-cols-2 gap-3">
              <ReadOnlyField
                label="Source"
                value={lead.source}
                icon={<FiTag size={13} />}
              />
              <ReadOnlyField
                label="Status"
                value={lead.status}
                pill="status"
              />
            </div>

            {/* VALUE + PRIORITY */}
            <div className="grid grid-cols-2 gap-3">
              <ReadOnlyField
                label="Value (₹)"
                value={`₹${Number(lead.value || 0).toLocaleString(
                  "en-IN"
                )}`}
                icon={<FiDollarSign size={13} />}
                highlight
              />
              <ReadOnlyField
                label="Priority"
                value={lead.priority}
                pill="priority"
              />
            </div>

            {/* ASSIGNED TO */}
            <ReadOnlyField
              label="Assigned To"
              value={lead.assignedTo?.name}
              icon={<FiUser size={13} />}
            />

            {/* COMPANY */}
            <ReadOnlyField
              label="Company"
              value={lead.company?.name || lead.company}
              icon={<FiBriefcase size={13} />}
            />

            {/* NOTES */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Notes
              </label>
              <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 min-h-[72px] whitespace-pre-wrap leading-relaxed">
                {lead.notes || (
                  <span className="text-gray-400 italic">
                    No notes available
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            FOOTER — same style as Edit
        ===================================================== */}
        <div className="flex items-center justify-end px-5 py-3.5 border-t border-gray-100 bg-gray-50/60">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition"
          >
            Close
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

// =====================================================
// READ-ONLY FIELD — same look as Edit form inputs
// =====================================================
function ReadOnlyField({ label, value, icon, highlight, pill }) {
  // Pill (Status / Priority)
  if (pill) {
    const styles =
      pill === "status"
        ? {
            new: "bg-blue-50 text-blue-700 ring-blue-200",
            contacted: "bg-cyan-50 text-cyan-700 ring-cyan-200",
            qualified: "bg-green-50 text-green-700 ring-green-200",
            proposal: "bg-purple-50 text-purple-700 ring-purple-200",
            negotiation: "bg-amber-50 text-amber-700 ring-amber-200",
            won: "bg-emerald-50 text-emerald-700 ring-emerald-200",
            lost: "bg-red-50 text-red-700 ring-red-200",
          }
        : {
            high: "bg-red-50 text-red-700 ring-red-200",
            medium: "bg-amber-50 text-amber-700 ring-amber-200",
            low: "bg-gray-50 text-gray-600 ring-gray-200",
          };

    const key = (value || "").toLowerCase();
    const cls = styles[key] || "bg-gray-50 text-gray-700 ring-gray-200";

    return (
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          {label}
        </label>
        <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg min-h-[38px] flex items-center">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ring-inset ${cls}`}
          >
            {value || "—"}
          </span>
        </div>
      </div>
    );
  }

  // Regular field
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      <div
        className={`w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm flex items-center gap-2 min-h-[38px] ${
          highlight ? "font-semibold text-gray-900" : "text-gray-800"
        }`}
      >
        {icon && (
          <span className="text-gray-400 flex-shrink-0">{icon}</span>
        )}
        <span className="truncate">{value || "—"}</span>
      </div>
    </div>
  );
}

export default ViewLead;
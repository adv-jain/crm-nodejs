import {
  FiX,
  FiDollarSign,
  FiTag,
  FiUser,
  FiBriefcase,
  FiMail,
  FiLink,
  FiCalendar,
  FiBarChart2,
} from "react-icons/fi";

function ViewDeal({ deal, onClose }) {
  if (!deal) return null;

  // =========================
  // STAGE PILL STYLE
  // =========================
  const getStageStyle = (stage) => {
    const s = (stage || "").toLowerCase();
    const map = {
      new: "bg-gray-50 text-gray-700 ring-gray-200",
      qualified: "bg-blue-50 text-blue-700 ring-blue-200",
      proposal: "bg-purple-50 text-purple-700 ring-purple-200",
      negotiation: "bg-amber-50 text-amber-700 ring-amber-200",
      won: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      lost: "bg-red-50 text-red-700 ring-red-200",
    };
    return map[s] || "bg-gray-50 text-gray-700 ring-gray-200";
  };

  const formatDate = (date) => {
    if (!date) return "—";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Avatar initials from title
  const initials = (deal.title || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const contactName = deal.contact
    ? `${deal.contact.firstName || ""} ${
        deal.contact.lastName || ""
      }`.trim()
    : "";

  const leadName = deal.lead
    ? `${deal.lead.firstName || ""} ${deal.lead.lastName || ""}`.trim()
    : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-[2px] animate-[fadeIn_.15s_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[560px] max-h-[88vh] bg-white rounded-2xl shadow-2xl shadow-gray-900/20 flex flex-col overflow-hidden animate-[popIn_.18s_ease-out]">

        {/* =====================================================
            HEADER — same style as DealForm
        ===================================================== */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Deal Details
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
            BODY
        ===================================================== */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* AVATAR + TITLE + PILLS */}
          <div className="flex items-center gap-3.5 pb-4 mb-4 border-b border-gray-100">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 uppercase shadow-sm">
              {initials || "?"}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {deal.title}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {deal.company?.name || "No company"}
              </p>

              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ring-inset ${getStageStyle(
                    deal.stage
                  )}`}
                >
                  {deal.stage || "—"}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ring-inset bg-blue-50 text-blue-700 ring-blue-200">
                  {deal.probability || 0}% probability
                </span>
              </div>
            </div>
          </div>

          {/* =====================================================
              FIELDS — Form-style
          ===================================================== */}
          <div className="space-y-3.5">

            {/* VALUE + STAGE */}
            <div className="grid grid-cols-2 gap-3">
              <ReadOnlyField
                label="Deal Value"
                value={`₹${Number(deal.value || 0).toLocaleString(
                  "en-IN"
                )}`}
                icon={<FiDollarSign size={13} />}
                highlight
              />
              <ReadOnlyField
                label="Stage"
                value={deal.stage}
                pill="stage"
              />
            </div>

            {/* PROBABILITY + CLOSE DATE */}
            <div className="grid grid-cols-2 gap-3">
              <ReadOnlyField
                label="Probability"
                value={`${deal.probability || 0}%`}
                icon={<FiBarChart2 size={13} />}
              />
              <ReadOnlyField
                label="Expected Close"
                value={formatDate(deal.expectedCloseDate)}
                icon={<FiCalendar size={13} />}
              />
            </div>

            {/* COMPANY */}
            <ReadOnlyField
              label="Company"
              value={deal.company?.name}
              icon={<FiBriefcase size={13} />}
            />

            {/* CONTACT + EMAIL */}
            <div className="grid grid-cols-2 gap-3">
              <ReadOnlyField
                label="Contact"
                value={contactName}
                icon={<FiUser size={13} />}
              />
              <ReadOnlyField
                label="Contact Email"
                value={deal.contact?.email}
                icon={<FiMail size={13} />}
              />
            </div>

            {/* LEAD + OWNER */}
            <div className="grid grid-cols-2 gap-3">
              <ReadOnlyField
                label="Related Lead"
                value={leadName}
                icon={<FiLink size={13} />}
              />
              <ReadOnlyField
                label="Owner"
                value={deal.owner?.name}
                icon={<FiUser size={13} />}
              />
            </div>

            {/* LOST REASON (conditional) */}
            {deal.stage === "Lost" && deal.lostReason && (
              <ReadOnlyField
                label="Lost Reason"
                value={deal.lostReason}
                icon={<FiTag size={13} />}
              />
            )}

            {/* DESCRIPTION */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Description
              </label>
              <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 min-h-[72px] whitespace-pre-wrap leading-relaxed">
                {deal.description || (
                  <span className="text-gray-400 italic">
                    No description available
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            FOOTER
        ===================================================== */}
        <div className="flex items-center justify-end px-5 py-3.5 border-t border-gray-100 bg-gray-50/60 flex-shrink-0">
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
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.96) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
}

// =====================================================
// READ-ONLY FIELD
// =====================================================
function ReadOnlyField({ label, value, icon, highlight, pill }) {
  // Pill (Stage)
  if (pill) {
    const styles = {
      new: "bg-gray-50 text-gray-700 ring-gray-200",
      qualified: "bg-blue-50 text-blue-700 ring-blue-200",
      proposal: "bg-purple-50 text-purple-700 ring-purple-200",
      negotiation: "bg-amber-50 text-amber-700 ring-amber-200",
      won: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      lost: "bg-red-50 text-red-700 ring-red-200",
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

export default ViewDeal;
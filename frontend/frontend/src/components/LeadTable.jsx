import { FiEye, FiEdit2, FiRefreshCw, FiTrash2, FiInbox } from "react-icons/fi";

function LeadTable({
  leads,
  onView,
  onEdit,
  onDelete,
  onConvert,
  deletingId,
  convertingId,
  user,
}) {
  // =========================
  // STATUS BADGE CLASSES
  // =========================
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

  // =========================
  // PRIORITY BADGE CLASSES
  // =========================
  const getPriorityStyle = (priority) => {
    const p = (priority || "").toLowerCase();
    const map = {
      high: "bg-red-50 text-red-700 ring-red-200",
      medium: "bg-amber-50 text-amber-700 ring-amber-200",
      low: "bg-gray-50 text-gray-600 ring-gray-200",
    };
    return map[p] || "bg-gray-50 text-gray-600 ring-gray-200";
  };

  // =========================
  // AVATAR INITIALS
  // =========================
  const getInitials = (lead) => {
    const f = lead.firstName?.[0] || "";
    const l = lead.lastName?.[0] || "";
    return (f + l).toUpperCase() || "?";
  };

  // Random-ish pastel color per lead for avatar
  const getAvatarColor = (lead) => {
    const colors = [
      "bg-blue-100 text-blue-700",
      "bg-purple-100 text-purple-700",
      "bg-green-100 text-green-700",
      "bg-pink-100 text-pink-700",
      "bg-amber-100 text-amber-700",
      "bg-cyan-100 text-cyan-700",
      "bg-indigo-100 text-indigo-700",
    ];
    const str = String(lead._id || lead.email || lead.firstName || "");
    const idx = str
      .split("")
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return colors[idx % colors.length];
  };

  // =========================
  // EMPTY STATE
  // =========================
  if (!leads || leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <FiInbox size={28} className="text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-800">
          No leads found
        </h3>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">
          Try adjusting your filters or add a new lead to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        {/* =========================
            TABLE HEADER
        ========================= */}
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/60">
            <th className="text-left font-medium text-xs uppercase tracking-wider text-gray-500 px-5 py-3.5">
              Lead
            </th>
            <th className="text-left font-medium text-xs uppercase tracking-wider text-gray-500 px-4 py-3.5 hidden md:table-cell">
              Phone
            </th>
            <th className="text-left font-medium text-xs uppercase tracking-wider text-gray-500 px-4 py-3.5 hidden lg:table-cell">
              Source
            </th>
            <th className="text-left font-medium text-xs uppercase tracking-wider text-gray-500 px-4 py-3.5">
              Status
            </th>
            <th className="text-left font-medium text-xs uppercase tracking-wider text-gray-500 px-4 py-3.5 hidden sm:table-cell">
              Value
            </th>
            <th className="text-left font-medium text-xs uppercase tracking-wider text-gray-500 px-4 py-3.5 hidden md:table-cell">
              Priority
            </th>
            <th className="text-right font-medium text-xs uppercase tracking-wider text-gray-500 px-5 py-3.5">
              Actions
            </th>
          </tr>
        </thead>

        {/* =========================
            TABLE BODY
        ========================= */}
        <tbody className="divide-y divide-gray-100">
          {leads.map((lead) => (
            <tr
              key={lead._id}
              className="hover:bg-gray-50/70 transition-colors"
            >
              {/* LEAD */}
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${getAvatarColor(
                      lead
                    )}`}
                  >
                    {getInitials(lead)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 truncate">
                      {lead.firstName} {lead.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {lead.email || "No email"}
                    </p>
                  </div>
                </div>
              </td>

              {/* PHONE */}
              <td className="px-4 py-3.5 text-gray-700 hidden md:table-cell">
                {lead.phone || "—"}
              </td>

              {/* SOURCE */}
              <td className="px-4 py-3.5 text-gray-700 hidden lg:table-cell">
                {lead.source || "—"}
              </td>

              {/* STATUS */}
              <td className="px-4 py-3.5">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${getStatusStyle(
                    lead.status
                  )}`}
                >
                  {lead.status}
                </span>
              </td>

              {/* VALUE */}
              <td className="px-4 py-3.5 text-gray-700 font-medium hidden sm:table-cell">
                ₹{Number(lead.value || 0).toLocaleString("en-IN")}
              </td>

              {/* PRIORITY */}
              <td className="px-4 py-3.5 hidden md:table-cell">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${getPriorityStyle(
                    lead.priority
                  )}`}
                >
                  {lead.priority}
                </span>
              </td>

              {/* ACTIONS */}
              <td className="px-5 py-3.5">
                <div className="flex items-center justify-end gap-1">
                  {/* VIEW */}
                  <button
                    onClick={() => onView(lead)}
                    title="View"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition"
                  >
                    <FiEye size={16} />
                  </button>

                  {/* EDIT */}
                  <button
                    onClick={() => onEdit(lead)}
                    title="Edit"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition"
                  >
                    <FiEdit2 size={16} />
                  </button>

                  {/* CONVERT — QUALIFIED ONLY */}
                  {lead.status === "Qualified" && (
                    <button
                      onClick={() => onConvert(lead)}
                      disabled={convertingId === lead._id}
                      title="Convert Lead"
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <FiRefreshCw
                        size={16}
                        className={
                          convertingId === lead._id ? "animate-spin" : ""
                        }
                      />
                    </button>
                  )}

                  {/* DELETE — ADMIN ONLY */}
                  {user?.role === "admin" && (
                    <button
                      onClick={() => onDelete(lead._id)}
                      disabled={deletingId === lead._id}
                      title="Delete"
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LeadTable;
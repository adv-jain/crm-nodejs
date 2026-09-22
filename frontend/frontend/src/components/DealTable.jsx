import { FiEye, FiEdit2, FiTrash2, FiInbox } from "react-icons/fi";

function DealTable({ deals, onView, onEdit, onDelete, deletingId, user }) {
  // =========================
  // STAGE BADGE STYLE
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

  // =========================
  // EMPTY STATE
  // =========================
  if (!deals || deals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <FiInbox size={28} className="text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-800">
          No deals found
        </h3>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">
          Try adjusting your filters or add a new deal to get started.
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
              Deal
            </th>
            <th className="text-left font-medium text-xs uppercase tracking-wider text-gray-500 px-4 py-3.5 hidden lg:table-cell">
              Company
            </th>
            <th className="text-left font-medium text-xs uppercase tracking-wider text-gray-500 px-4 py-3.5">
              Value
            </th>
            <th className="text-left font-medium text-xs uppercase tracking-wider text-gray-500 px-4 py-3.5">
              Stage
            </th>
            <th className="text-left font-medium text-xs uppercase tracking-wider text-gray-500 px-4 py-3.5 hidden md:table-cell">
              Probability
            </th>
            <th className="text-left font-medium text-xs uppercase tracking-wider text-gray-500 px-4 py-3.5 hidden xl:table-cell">
              Close Date
            </th>
            <th className="text-left font-medium text-xs uppercase tracking-wider text-gray-500 px-4 py-3.5 hidden lg:table-cell">
              Owner
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
          {deals.map((deal) => (
            <tr
              key={deal._id}
              className="hover:bg-gray-50/70 transition-colors"
            >
              {/* DEAL */}
              <td className="px-5 py-3.5">
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    {deal.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {deal.contact
                      ? `${deal.contact.firstName || ""} ${
                          deal.contact.lastName || ""
                        }`.trim()
                      : "No contact"}
                  </p>
                </div>
              </td>

              {/* COMPANY */}
              <td className="px-4 py-3.5 text-gray-700 hidden lg:table-cell">
                {deal.company?.name || "—"}
              </td>

              {/* VALUE */}
              <td className="px-4 py-3.5">
                <span className="font-semibold text-gray-800">
                  ₹{Number(deal.value || 0).toLocaleString("en-IN")}
                </span>
              </td>

              {/* STAGE */}
              <td className="px-4 py-3.5">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${getStageStyle(
                    deal.stage
                  )}`}
                >
                  {deal.stage}
                </span>
              </td>

              {/* PROBABILITY */}
              <td className="px-4 py-3.5 hidden md:table-cell">
                <div className="flex items-center gap-2 min-w-[100px]">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${deal.probability || 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600 w-9 text-right">
                    {deal.probability || 0}%
                  </span>
                </div>
              </td>

              {/* CLOSE DATE */}
              <td className="px-4 py-3.5 text-gray-700 hidden xl:table-cell">
                {deal.expectedCloseDate
                  ? new Date(deal.expectedCloseDate).toLocaleDateString(
                      "en-IN"
                    )
                  : "—"}
              </td>

              {/* OWNER */}
              <td className="px-4 py-3.5 hidden lg:table-cell">
                {deal.owner?.name ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {deal.owner.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <span className="text-gray-700 truncate">
                      {deal.owner.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>

              {/* ACTIONS */}
              <td className="px-5 py-3.5">
                <div className="flex items-center justify-end gap-1">
                  {/* VIEW */}
                  <button
                    onClick={() => onView(deal)}
                    title="View"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition"
                  >
                    <FiEye size={16} />
                  </button>

                  {/* EDIT */}
                  <button
                    onClick={() => onEdit(deal)}
                    title="Edit"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition"
                  >
                    <FiEdit2 size={16} />
                  </button>

                  {/* DELETE — ADMIN ONLY */}
                  {user?.role === "admin" && (
                    <button
                      onClick={() => onDelete(deal._id)}
                      disabled={deletingId === deal._id}
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

export default DealTable;
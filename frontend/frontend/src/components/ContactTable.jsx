import {
  FiEye,
  FiEdit2,
  FiBriefcase,
  FiTrash2,
  FiInbox,
} from "react-icons/fi";

function ContactTable({
  contacts,
  onView,
  onEdit,
  onDelete,
  onCreateDeal,
  deletingId,
  creatingDealId,
  user,
}) {
  // =========================
  // AVATAR INITIALS
  // =========================
  const getInitials = (contact) => {
    const f = contact.firstName?.[0] || "";
    const l = contact.lastName?.[0] || "";
    return (f + l).toUpperCase() || "?";
  };

  // Random pastel color per contact
  const getAvatarColor = (contact) => {
    const colors = [
      "bg-blue-100 text-blue-700",
      "bg-purple-100 text-purple-700",
      "bg-green-100 text-green-700",
      "bg-pink-100 text-pink-700",
      "bg-amber-100 text-amber-700",
      "bg-cyan-100 text-cyan-700",
      "bg-indigo-100 text-indigo-700",
    ];
    const str = String(contact._id || contact.email || contact.firstName || "");
    const idx = str.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return colors[idx % colors.length];
  };

  // =========================
  // EMPTY STATE
  // =========================
  if (!contacts || contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <FiInbox size={28} className="text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-800">
          No contacts found
        </h3>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">
          Try adjusting your filters or add a new contact to get started.
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
              Contact
            </th>
            <th className="text-left font-medium text-xs uppercase tracking-wider text-gray-500 px-4 py-3.5 hidden md:table-cell">
              Phone
            </th>
            <th className="text-left font-medium text-xs uppercase tracking-wider text-gray-500 px-4 py-3.5 hidden lg:table-cell">
              Company
            </th>
            <th className="text-left font-medium text-xs uppercase tracking-wider text-gray-500 px-4 py-3.5 hidden lg:table-cell">
              Designation
            </th>
            <th className="text-left font-medium text-xs uppercase tracking-wider text-gray-500 px-4 py-3.5 hidden xl:table-cell">
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
          {contacts.map((contact) => (
            <tr
              key={contact._id}
              className="hover:bg-gray-50/70 transition-colors"
            >
              {/* CONTACT */}
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${getAvatarColor(
                      contact
                    )}`}
                  >
                    {getInitials(contact)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 truncate">
                      {contact.firstName} {contact.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {contact.email || "No email"}
                    </p>
                  </div>
                </div>
              </td>

              {/* PHONE */}
              <td className="px-4 py-3.5 text-gray-700 hidden md:table-cell">
                {contact.phone || "—"}
              </td>

              {/* COMPANY */}
              <td className="px-4 py-3.5 text-gray-700 hidden lg:table-cell">
                {contact.company?.name || "—"}
              </td>

              {/* DESIGNATION */}
              <td className="px-4 py-3.5 text-gray-700 hidden lg:table-cell">
                {contact.designation || "—"}
              </td>

              {/* OWNER */}
              <td className="px-4 py-3.5 hidden xl:table-cell">
                {contact.owner?.name ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {contact.owner.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <span className="text-gray-700 truncate">
                      {contact.owner.name}
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
                    onClick={() => onView(contact)}
                    title="View"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition"
                  >
                    <FiEye size={16} />
                  </button>

                  {/* EDIT */}
                  <button
                    onClick={() => onEdit(contact)}
                    title="Edit"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition"
                  >
                    <FiEdit2 size={16} />
                  </button>

                  {/* CREATE DEAL */}
                  <button
                    onClick={() => onCreateDeal(contact)}
                    disabled={creatingDealId === contact._id}
                    title="Create Deal"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FiBriefcase
                      size={16}
                      className={
                        creatingDealId === contact._id
                          ? "animate-pulse"
                          : ""
                      }
                    />
                  </button>

                  {/* DELETE — ADMIN ONLY */}
                  {user?.role === "admin" && (
                    <button
                      onClick={() => onDelete(contact._id)}
                      disabled={deletingId === contact._id}
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

export default ContactTable;

import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  FiSearch,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiEye,
  FiTrash2,
  FiInbox,
  FiUser,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiLink,
  FiCalendar,
} from "react-icons/fi";

import api from "../api";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // FETCH CUSTOMERS
  // ==========================================
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/customers", {
        params: {
          search,
          status,
        },
      });

      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message || "Failed to fetch customers"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, status]);

  // Auto-dismiss messages
  useEffect(() => {
    if (!success && !error) return;

    const t = setTimeout(() => {
      setSuccess("");
      setError("");
    }, 4000);

    return () => clearTimeout(t);
  }, [success, error]);

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleStatusChange = async (customerId, newStatus) => {
    try {
      setError("");
      setSuccess("");

      await api.put(`/customers/${customerId}`, {
        status: newStatus,
      });

      setSuccess("Customer status updated successfully");

      fetchCustomers();
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to update customer"
      );
    }
  };

  const handleDelete = async (customerId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this customer?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await api.delete(`/customers/${customerId}`);

      setSuccess("Customer deleted successfully");

      fetchCustomers();
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to delete customer"
      );
    }
  };

  // ==========================================
  // HELPERS
  // ==========================================
  const getStatusStyle = (status) => {
    const s = (status || "").toLowerCase();

    const map = {
      active: "bg-green-50 text-green-700 ring-green-200",
      inactive: "bg-gray-50 text-gray-600 ring-gray-200",
      churned: "bg-red-50 text-red-700 ring-red-200",
    };

    return map[s] || "bg-gray-50 text-gray-600 ring-gray-200";
  };

  const getAvatarColor = (name) => {
    const colors = [
      "bg-blue-100 text-blue-700",
      "bg-purple-100 text-purple-700",
      "bg-green-100 text-green-700",
      "bg-pink-100 text-pink-700",
      "bg-amber-100 text-amber-700",
      "bg-cyan-100 text-cyan-700",
      "bg-indigo-100 text-indigo-700",
    ];

    const str = String(name || "?");

    const idx = str
      .split("")
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

    return colors[idx % colors.length];
  };

  const getInitials = (name) => {
    if (!name) return "?";

    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
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

  const activeFilterCount = useMemo(() => {
    return [search, status].filter(Boolean).length;
  }, [search, status]);

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1600px] mx-auto min-h-screen bg-gray-50">

      {/* =========================
          PAGE HEADER
      ========================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
            Customers
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Manage your converted customers
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>

          <span className="text-sm font-medium text-gray-700">
            {customers.length}{" "}
            {customers.length === 1 ? "Customer" : "Customers"}
          </span>
        </div>
      </div>

      {/* =========================
          SEARCH + FILTERS
      ========================= */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-3">

          {/* SEARCH */}
          <div className="relative flex-1 min-w-[240px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <FiSearch size={18} />
            </span>

            <input
              type="text"
              placeholder="Search customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                paddingLeft: "2.75rem",
                paddingRight: "2.5rem",
                height: "2.75rem",
              }}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
              >
                <FiX size={14} />
              </button>
            )}
          </div>

          {/* STATUS */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ height: "2.75rem" }}
            className="w-full sm:w-44 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Churned">Churned</option>
          </select>

          {/* RESET */}
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatus("");
            }}
            disabled={activeFilterCount === 0}
            style={{ height: "2.75rem" }}
            className="px-4 inline-flex items-center justify-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 hover:text-red-600 hover:bg-red-50 hover:border-red-200 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FiX size={16} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* =========================
          ALERTS
      ========================= */}
      {success && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-lg">
          <FiCheckCircle
            className="flex-shrink-0 mt-0.5"
            size={18}
          />

          <p className="flex-1">{success}</p>

          <button
            onClick={() => setSuccess("")}
            className="text-green-600 hover:text-green-800 flex-shrink-0"
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 rounded-lg">
          <FiAlertCircle
            className="flex-shrink-0 mt-0.5"
            size={18}
          />

          <p className="flex-1">{error}</p>

          <button
            onClick={() => setError("")}
            className="text-red-600 hover:text-red-800 flex-shrink-0"
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      {/* =========================
          RESULT INFO
      ========================= */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Showing{" "}
          <span className="font-semibold text-gray-700">
            {customers.length}
          </span>{" "}
          {customers.length === 1 ? "customer" : "customers"}

          {activeFilterCount > 0 && (
            <span className="ml-1">
              · {activeFilterCount}{" "}
              {activeFilterCount === 1 ? "filter" : "filters"} applied
            </span>
          )}
        </p>
      </div>

      {/* =========================
          TABLE
      ========================= */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg
              className="animate-spin h-6 w-6 text-blue-600 mb-3"
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

            <p className="text-sm text-gray-500">
              Loading customers...
            </p>
          </div>
        ) : customers.length === 0 ? (
          /* EMPTY STATE */
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <FiInbox size={28} className="text-gray-400" />
            </div>

            <h3 className="text-base font-semibold text-gray-800">
              No customers found
            </h3>

            <p className="text-sm text-gray-500 mt-1 max-w-sm">
              Try adjusting your filters or convert a deal to create a customer.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">

              {/* TABLE HEADER */}
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/60">
                  <th className="text-left font-medium text-xs uppercase tracking-wider text-gray-500 px-5 py-3.5">
                    Customer
                  </th>

                  <th className="text-left font-medium text-xs uppercase tracking-wider text-gray-500 px-4 py-3.5 hidden lg:table-cell">
                    Company
                  </th>

                  <th className="text-left font-medium text-xs uppercase tracking-wider text-gray-500 px-4 py-3.5 hidden xl:table-cell">
                    Deal
                  </th>

                  <th className="text-left font-medium text-xs uppercase tracking-wider text-gray-500 px-4 py-3.5 hidden lg:table-cell">
                    Owner
                  </th>

                  <th className="text-left font-medium text-xs uppercase tracking-wider text-gray-500 px-4 py-3.5 hidden md:table-cell">
                    Customer Since
                  </th>

                  <th className="text-left font-medium text-xs uppercase tracking-wider text-gray-500 px-4 py-3.5">
                    Status
                  </th>

                  <th className="text-right font-medium text-xs uppercase tracking-wider text-gray-500 px-5 py-3.5">
                    Actions
                  </th>
                </tr>
              </thead>

              {/* TABLE BODY */}
              <tbody className="divide-y divide-gray-100">
                {customers.map((customer) => {
                  const contact = customer.contact;

                  const fullName = contact
                    ? `${contact.firstName || ""} ${
                        contact.lastName || ""
                      }`.trim()
                    : "Unknown";

                  return (
                    <tr
                      key={customer._id}
                      className="hover:bg-gray-50/70 transition-colors"
                    >
                      {/* CUSTOMER */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${getAvatarColor(
                              fullName
                            )}`}
                          >
                            {getInitials(fullName)}
                          </div>

                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 truncate">
                              {fullName}
                            </p>

                            <p className="text-xs text-gray-500 truncate">
                              {contact?.email || "No email"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* COMPANY */}
                      <td className="px-4 py-3.5 text-gray-700 hidden lg:table-cell">
                        {customer.company?.name || "—"}
                      </td>

                      {/* DEAL */}
                      <td className="px-4 py-3.5 text-gray-700 hidden xl:table-cell">
                        {customer.convertedFromDeal?.title || "—"}
                      </td>

                      {/* OWNER */}
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        {customer.owner?.name ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                              {getInitials(customer.owner.name)}
                            </div>

                            <span className="text-gray-700 truncate">
                              {customer.owner.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* CUSTOMER SINCE */}
                      <td className="px-4 py-3.5 text-gray-700 hidden md:table-cell">
                        <span className="text-xs">
                          {formatDate(customer.customerSince)}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td className="px-4 py-3.5">
                        <select
                          value={customer.status}
                          onChange={(e) =>
                            handleStatusChange(
                              customer._id,
                              e.target.value
                            )
                          }
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-100 ${getStatusStyle(
                            customer.status
                          )}`}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Churned">Churned</option>
                        </select>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">

                          {/* VIEW */}
                          <button
                            onClick={() =>
                              setSelectedCustomer(customer)
                            }
                            title="View"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition"
                          >
                            <FiEye size={16} />
                          </button>

                          {/* DELETE — Admin only */}
                          {customer.owner?._id &&
                            localStorage.getItem("role") === "admin" && (
                              <button
                                onClick={() =>
                                  handleDelete(customer._id)
                                }
                                title="Delete"
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================
          VIEW MODAL — with Portal
      ========================= */}
      {selectedCustomer &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto animate-[fadeIn_.15s_ease-out]"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedCustomer(null);
              }
            }}
          >
            <div className="w-full max-w-[560px] max-h-[88vh] bg-white rounded-2xl shadow-2xl shadow-gray-900/20 flex flex-col overflow-hidden animate-[popIn_.18s_ease-out] my-auto">

              {/* HEADER */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Customer Details
                  </h2>

                  <p className="text-xs text-gray-500 mt-0.5">
                    View complete information
                  </p>
                </div>

                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                  aria-label="Close"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* BODY */}
              <div className="flex-1 overflow-y-auto px-5 py-4">

                {/* AVATAR + NAME + STATUS */}
                {(() => {
                  const fullName = `${
                    selectedCustomer.contact?.firstName || ""
                  } ${
                    selectedCustomer.contact?.lastName || ""
                  }`.trim();

                  const initials = getInitials(fullName || "?");

                  return (
                    <div className="flex items-center gap-3.5 pb-4 mb-4 border-b border-gray-100">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 uppercase shadow-sm">
                        {initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-gray-900 truncate">
                          {fullName || "Unknown"}
                        </h3>

                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {selectedCustomer.contact?.email || "No email"}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ring-inset ${getStatusStyle(
                              selectedCustomer.status
                            )}`}
                          >
                            {selectedCustomer.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* FIELDS */}
                <div className="space-y-3.5">

                  {/* NAME ROW */}
                  <div className="grid grid-cols-2 gap-3">
                    <ReadOnlyField
                      label="First Name"
                      value={selectedCustomer.contact?.firstName}
                    />

                    <ReadOnlyField
                      label="Last Name"
                      value={selectedCustomer.contact?.lastName}
                    />
                  </div>

                  {/* EMAIL + PHONE */}
                  <div className="grid grid-cols-2 gap-3">
                    <ReadOnlyField
                      label="Email"
                      value={selectedCustomer.contact?.email}
                      icon={<FiMail size={13} />}
                    />

                    <ReadOnlyField
                      label="Phone"
                      value={selectedCustomer.contact?.phone}
                      icon={<FiPhone size={13} />}
                    />
                  </div>

                  {/* COMPANY */}
                  <ReadOnlyField
                    label="Company"
                    value={selectedCustomer.company?.name}
                    icon={<FiBriefcase size={13} />}
                  />

                  {/* CONVERTED FROM DEAL */}
                  <ReadOnlyField
                    label="Converted From"
                    value={selectedCustomer.convertedFromDeal?.title}
                    icon={<FiLink size={13} />}
                  />

                  {/* OWNER + SINCE */}
                  <div className="grid grid-cols-2 gap-3">
                    <ReadOnlyField
                      label="Owner"
                      value={selectedCustomer.owner?.name}
                      icon={<FiUser size={13} />}
                    />

                    <ReadOnlyField
                      label="Customer Since"
                      value={formatDate(
                        selectedCustomer.customerSince
                      )}
                      icon={<FiCalendar size={13} />}
                    />
                  </div>

                  {/* NOTES */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Notes
                    </label>

                    <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 min-h-[72px] whitespace-pre-wrap leading-relaxed">
                      {selectedCustomer.notes || (
                        <span className="text-gray-400 italic">
                          No notes available
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="flex items-center justify-end px-5 py-3.5 border-t border-gray-100 bg-gray-50/60 flex-shrink-0">
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition"
                >
                  Close
                </button>
              </div>
            </div>

            <style>{`
              @keyframes fadeIn {
                from {
                  opacity: 0;
                }
                to {
                  opacity: 1;
                }
              }

              @keyframes popIn {
                from {
                  opacity: 0;
                  transform: scale(0.96) translateY(6px);
                }
                to {
                  opacity: 1;
                  transform: scale(1) translateY(0);
                }
              }
            `}</style>
          </div>,
          document.body
        )}
    </div>
  );
}

// =====================================================
// READ-ONLY FIELD
// =====================================================
function ReadOnlyField({ label, value, icon }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>

      <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 flex items-center gap-2 min-h-[38px]">
        {icon && (
          <span className="text-gray-400 flex-shrink-0">
            {icon}
          </span>
        )}

        <span className="truncate">
          {value || "—"}
        </span>
      </div>
    </div>
  );
}

export default Customers;


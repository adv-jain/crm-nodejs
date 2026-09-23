import { useEffect, useState, useMemo, useRef } from "react";
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
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
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

  // =====================================================
  // PAGINATION
  // =====================================================
  const [page, setPage] = useState(1);
  const RECORDS_PER_PAGE = 50;
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // =====================================================
  // FILTER POPOVER
  // =====================================================
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);

  // =====================================================
  // FETCH CUSTOMERS
  // =====================================================
  const fetchCustomers = async (requestedPage = page) => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/customers", {
        params: {
          search,
          status,
          page: requestedPage,
          limit: RECORDS_PER_PAGE,
        },
      });

      setCustomers(response.data.customers || []);
      setTotalCustomers(response.data.total || 0);
      setTotalPages(response.data.totalPages || 1);
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
    fetchCustomers(page);
  }, [page, search, status]);

  // Auto dismiss messages
  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => {
      setSuccess("");
      setError("");
    }, 4000);
    return () => clearTimeout(t);
  }, [success, error]);

  // Close filter popover on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilters(false);
      }
    };
    if (showFilters) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilters]);

  // =====================================================
  // HANDLERS
  // =====================================================
  const handleStatusChange = async (customerId, newStatus) => {
    try {
      setError("");
      setSuccess("");

      await api.put(`/customers/${customerId}`, { status: newStatus });
      setSuccess("Customer status updated successfully");
      await fetchCustomers(page);
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

      if (customers.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await fetchCustomers(page);
      }
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to delete customer"
      );
    }
  };

  // =====================================================
  // HELPERS
  // =====================================================
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
    const idx = str.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
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

  const dropdownFilterCount = useMemo(() => {
    return [status].filter(Boolean).length;
  }, [status]);

  const handleClearFilters = () => {
    setSearch("");
    setStatus("");
    setPage(1);
  };

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1600px] mx-auto">

      {/* ============================================
          HEADER: TITLE + COUNT | SEARCH + FILTER
          ============================================ */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">

        {/* LEFT: TITLE + COUNT */}
        {/* <div className="flex items-center gap-3 flex-shrink-0">
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Customers
          </h1>
          <span className="inline-flex items-center gap-1.5 px-2.5 h-6 bg-white border border-gray-200 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            <span className="text-xs font-medium text-gray-600">
              {totalCustomers}
            </span>
          </span>
        </div> */}

        {/* RIGHT: SEARCH + FILTER + RESET */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">

          {/* SEARCH */}
          <div className="relative w-full sm:w-64">
            <FiSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              size={15}
            />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-8 h-9 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
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

            {/* MODERN FILTER POPOVER */}
            {showFilters && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg shadow-gray-200/60 z-30 overflow-hidden">

                {/* HEADER */}
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

                {/* BODY */}
                <div className="p-4 space-y-4">

                  {/* STATUS CHIPS */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      Status
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {["Active", "Inactive", "Churned"].map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setStatus(status === s ? "" : s);
                            setPage(1);
                          }}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md border transition ${
                            status === s
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* FOOTER */}
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

          {/* RESET (only when active filters) */}
          {activeFilterCount > 0 && (
            <button
              onClick={handleClearFilters}
              className="w-9 h-9 inline-flex items-center justify-center text-gray-400 hover:text-red-600 transition"
              title="Clear all filters"
            >
              <FiX size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ALERTS */}
      {success && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-lg">
          <FiCheckCircle className="flex-shrink-0 mt-0.5" size={18} />
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
          <FiAlertCircle className="flex-shrink-0 mt-0.5" size={18} />
          <p className="flex-1">{error}</p>
          <button
            onClick={() => setError("")}
            className="text-red-600 hover:text-red-800 flex-shrink-0"
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      {/* RESULT INFO */}
      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <p>
          Showing <span className="font-medium text-gray-700">{customers.length}</span> of{" "}
          <span className="font-medium text-gray-700">{totalCustomers}</span>{" "}
          {totalCustomers === 1 ? "customer" : "customers"}
          {activeFilterCount > 0 && (
            <span className="ml-1">
              · {activeFilterCount}{" "}
              {activeFilterCount === 1 ? "filter" : "filters"} applied
            </span>
          )}
        </p>
        <p>
          Page <span className="font-medium text-gray-700">{page}</span> of{" "}
          <span className="font-medium text-gray-700">{totalPages}</span>
        </p>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-7 h-7 border-[3px] border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500">Loading customers...</p>
            </div>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <FiInbox size={24} className="text-gray-400" />
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

              <tbody className="divide-y divide-gray-100">
                {customers.map((customer) => {
                  const contact = customer.contact;
                  const fullName = contact
                    ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
                    : "Unknown";

                  return (
                    <tr
                      key={customer._id}
                      className="hover:bg-gray-50/70 transition-colors"
                    >
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

                      <td className="px-4 py-3.5 text-gray-700 hidden lg:table-cell">
                        {customer.company?.name || "—"}
                      </td>

                      <td className="px-4 py-3.5 text-gray-700 hidden xl:table-cell">
                        {customer.convertedFromDeal?.title || "—"}
                      </td>

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

                      <td className="px-4 py-3.5 text-gray-700 hidden md:table-cell">
                        <span className="text-xs">
                          {formatDate(customer.customerSince)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <select
                          value={customer.status}
                          onChange={(e) =>
                            handleStatusChange(customer._id, e.target.value)
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

                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedCustomer(customer)}
                            title="View"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition"
                          >
                            <FiEye size={16} />
                          </button>

                          {customer.owner?._id &&
                            localStorage.getItem("role") === "admin" && (
                              <button
                                onClick={() => handleDelete(customer._id)}
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

      {/* PAGINATION */}
      {!loading && totalCustomers > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {page} / {totalPages}
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="w-8 h-8 inline-flex items-center justify-center text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FiChevronLeft size={16} />
            </button>

            <span className="px-3 h-8 inline-flex items-center text-sm font-medium text-gray-700">
              {page}
            </span>

            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page >= totalPages}
              className="w-8 h-8 inline-flex items-center justify-center text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
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

              <div className="flex-1 overflow-y-auto px-5 py-4">
                {(() => {
                  const fullName = `${
                    selectedCustomer.contact?.firstName || ""
                  } ${selectedCustomer.contact?.lastName || ""}`.trim();
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

                <div className="space-y-3.5">
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

                  <ReadOnlyField
                    label="Company"
                    value={selectedCustomer.company?.name}
                    icon={<FiBriefcase size={13} />}
                  />

                  <ReadOnlyField
                    label="Converted From"
                    value={selectedCustomer.convertedFromDeal?.title}
                    icon={<FiLink size={13} />}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <ReadOnlyField
                      label="Owner"
                      value={selectedCustomer.owner?.name}
                      icon={<FiUser size={13} />}
                    />
                    <ReadOnlyField
                      label="Customer Since"
                      value={formatDate(selectedCustomer.customerSince)}
                      icon={<FiCalendar size={13} />}
                    />
                  </div>

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
                from { opacity: 0; }
                to { opacity: 1; }
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
// READ ONLY FIELD
// =====================================================
function ReadOnlyField({ label, value, icon }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 flex items-center gap-2 min-h-[38px]">
        {icon && <span className="text-gray-400 flex-shrink-0">{icon}</span>}
        <span className="truncate">{value || "—"}</span>
      </div>
    </div>
  );
}

export default Customers;
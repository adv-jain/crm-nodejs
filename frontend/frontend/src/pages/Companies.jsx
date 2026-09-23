import { useEffect, useState, useMemo, useRef } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

import {
  FiSearch,
  FiPlus,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiX,
  FiGlobe,
  FiMail,
  FiPhone,
  FiMapPin,
  FiUsers,
  FiChevronLeft,
  FiChevronRight,
  FiBriefcase,
  FiFilter,
} from "react-icons/fi";

function Companies() {
  const { user } = useAuth();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("");
  const [city, setCity] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const LIMIT = 50;

  const [totalCompanies, setTotalCompanies] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [editingCompany, setEditingCompany] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Filter popover
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);

  // Messages
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Form
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    website: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    employees: "",
  });

  // FETCH COMPANIES
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await api.get("/companies", {
        params: { search, industry, city, page, limit: LIMIT },
      });

      setCompanies(response.data.companies || []);
      setTotalCompanies(response.data.total || 0);
      setTotalPages(response.data.totalPages || 0);
    } catch (error) {
      console.error("Fetch companies error:", error);
      setErrorMessage(
        error.response?.data?.message || "Failed to fetch companies"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [page, search, industry, city]);

  useEffect(() => {
    if (!successMessage && !errorMessage) return;
    const timer = setTimeout(() => {
      setSuccessMessage("");
      setErrorMessage("");
    }, 4000);
    return () => clearTimeout(timer);
  }, [successMessage, errorMessage]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilters(false);
      }
    };
    if (showFilters) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilters]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setIndustry("");
    setCity("");
    setPage(1);
  };

  const handleAddCompany = () => {
    setEditingCompany(null);
    setFormData({
      name: "",
      industry: "",
      website: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      country: "",
      employees: "",
    });
    setErrorMessage("");
    setSuccessMessage("");
    setShowFormModal(true);
  };

  const handleEditCompany = (company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name || "",
      industry: company.industry || "",
      website: company.website || "",
      email: company.email || "",
      phone: company.phone || "",
      address: company.address || "",
      city: company.city || "",
      country: company.country || "",
      employees:
        company.employees !== undefined && company.employees !== null
          ? company.employees
          : "",
    });
    setErrorMessage("");
    setSuccessMessage("");
    setShowFormModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setErrorMessage("Company name is required");
      return;
    }

    try {
      setErrorMessage("");
      setSuccessMessage("");

      const payload = {
        ...formData,
        employees:
          formData.employees === "" ? undefined : Number(formData.employees),
      };

      if (editingCompany) {
        const response = await api.put(
          `/companies/${editingCompany._id}`,
          payload
        );
        setSuccessMessage(
          response.data.message || "Company updated successfully"
        );
      } else {
        const response = await api.post("/companies", payload);
        setSuccessMessage(
          response.data.message || "Company created successfully"
        );
      }

      setShowFormModal(false);
      setEditingCompany(null);
      await fetchCompanies();
    } catch (error) {
      console.error("Save company error:", error);
      setErrorMessage(
        error.response?.data?.message || "Failed to save company"
      );
    }
  };

  const handleViewCompany = async (company) => {
    try {
      setErrorMessage("");
      const response = await api.get(`/companies/${company._id}`);
      setSelectedCompany(response.data.company);
      setShowViewModal(true);
    } catch (error) {
      console.error("View company error:", error);
      setErrorMessage(
        error.response?.data?.message || "Failed to fetch company details"
      );
    }
  };

  const handleDeleteCompany = async (company) => {
    if (user?.role !== "admin") return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${company.name}"?`
    );
    if (!confirmed) return;

    try {
      setErrorMessage("");
      const response = await api.delete(`/companies/${company._id}`);
      setSuccessMessage(
        response.data.message || "Company deleted successfully"
      );

      if (companies.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await fetchCompanies();
      }
    } catch (error) {
      console.error("Delete company error:", error);
      setErrorMessage(
        error.response?.data?.message || "Failed to delete company"
      );
    }
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingCompany(null);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedCompany(null);
  };

  const dropdownFilterCount = useMemo(() => {
    return [industry, city].filter(Boolean).length;
  }, [industry, city]);

  const hasFilters = search || industry || city;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1600px] mx-auto">

      {/* ============================================
          HEADER: SEARCH + FILTER (left) | ADD (right)
          ============================================ */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">

        {/* LEFT: SEARCH + FILTER */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">

          {/* SEARCH */}
          <div className="relative w-full sm:w-64">
            <FiSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              size={15}
            />
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Search companies..."
              className="w-full pl-9 pr-8 h-9 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
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

            {/* MODERN FILTER POPOVER (left aligned) */}
            {showFilters && (
              <div className="absolute left-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg shadow-gray-200/60 z-30 overflow-hidden">

                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Filters
                  </h3>
                  {dropdownFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs font-medium text-gray-500 hover:text-red-600 transition"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="p-4 space-y-4">

                  {/* INDUSTRY CHIPS */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      Industry
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "IT Services",
                        "Finance",
                        "Healthcare",
                        "Education",
                        "Retail",
                        "Manufacturing",
                        "Real Estate",
                        "Consulting",
                        "Other",
                      ].map((ind) => (
                        <button
                          key={ind}
                          onClick={() =>
                            setIndustry(industry === ind ? "" : ind)
                          }
                          className={`px-2.5 py-1 text-xs font-medium rounded-md border transition ${
                            industry === ind
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {ind}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CITY */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Enter city..."
                      className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 px-4 py-3 bg-gray-50 border-t border-gray-100">
                  <button
                    onClick={clearFilters}
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
        </div>

        {/* RIGHT: ADD BUTTON */}
        <button
          onClick={handleAddCompany}
          className="inline-flex items-center justify-center gap-1.5 px-4 h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition shadow-sm whitespace-nowrap self-start lg:self-auto"
        >
          <FiPlus size={15} />
          Add Company
        </button>
      </div>

      {/* ALERTS */}
      {successMessage && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-lg">
          <p className="flex-1">{successMessage}</p>
          <button
            onClick={() => setSuccessMessage("")}
            className="text-green-600 hover:text-green-800 flex-shrink-0"
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 rounded-lg">
          <p className="flex-1">{errorMessage}</p>
          <button
            onClick={() => setErrorMessage("")}
            className="text-red-600 hover:text-red-800 flex-shrink-0"
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      {/* COMPANY TABLE */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-7 h-7 border-[3px] border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500">Loading companies...</p>
            </div>
          </div>
        ) : companies.length === 0 ? (
          /* EMPTY STATE */
          <div className="py-16 flex flex-col items-center justify-center px-4">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
              <FiBriefcase size={24} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-gray-800">
              No companies found
            </h3>
            <p className="mt-1 text-sm text-gray-500 text-center max-w-md">
              {hasFilters
                ? "Try changing your search or filters."
                : "Start by adding your first company."}
            </p>
            {!hasFilters && (
              <button
                onClick={handleAddCompany}
                className="mt-5 inline-flex items-center gap-1.5 px-4 h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
              >
                <FiPlus size={15} />
                Add Company
              </button>
            )}
          </div>
        ) : (
          <>
            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Industry
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Employees
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {companies.map((company) => (
                    <tr
                      key={company._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                            <FiBriefcase size={19} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate max-w-[220px]">
                              {company.name}
                            </p>
                            {company.website ? (
                              <a
                                href={
                                  company.website.startsWith("http")
                                    ? company.website
                                    : `https://${company.website}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                              >
                                <FiGlobe size={12} />
                                Website
                              </a>
                            ) : (
                              <span className="text-xs text-gray-400 mt-1 block">
                                No website
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {company.industry ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium">
                            <FiBriefcase size={12} />
                            {company.industry}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          {company.email && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <FiMail size={13} className="text-gray-400" />
                              <span className="truncate max-w-[180px]">
                                {company.email}
                              </span>
                            </div>
                          )}
                          {company.phone && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <FiPhone size={13} className="text-gray-400" />
                              <span>{company.phone}</span>
                            </div>
                          )}
                          {!company.email && !company.phone && (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {company.city || company.country ? (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FiMapPin size={14} className="text-gray-400" />
                            <span>
                              {[company.city, company.country]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <FiUsers size={15} className="text-gray-400" />
                          {company.employees ?? "—"}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewCompany(company)}
                            title="View"
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <FiEye size={16} />
                          </button>
                          <button
                            onClick={() => handleEditCompany(company)}
                            title="Edit"
                            className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          {user?.role === "admin" && (
                            <button
                              onClick={() => handleDeleteCompany(company)}
                              title="Delete"
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
          </>
        )}
      </div>

      {/* FOOTER: SHOWING (left) | PAGE INFO + PAGINATION (right) */}
      {!loading && totalCompanies > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* SHOWING */}
          <p className="text-xs text-gray-500">
            Showing{" "}
            <span className="font-medium text-gray-700">
              {companies.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-gray-700">{totalCompanies}</span>{" "}
            {totalCompanies === 1 ? "company" : "companies"}
          </p>

          {/* PAGE INFO + PAGINATION */}
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-500">
              Page <span className="font-medium text-gray-700">{page}</span> of{" "}
              <span className="font-medium text-gray-700">
                {totalPages || 1}
              </span>
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="w-8 h-8 inline-flex items-center justify-center text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FiChevronLeft size={16} />
                </button>

                <button
                  onClick={() =>
                    setPage((prev) => Math.min(prev + 1, totalPages || 1))
                  }
                  disabled={page >= (totalPages || 1)}
                  className="w-8 h-8 inline-flex items-center justify-center text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FiChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD / EDIT COMPANY MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={closeFormModal}
            className="absolute inset-0 bg-black/50"
          />

          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingCompany ? "Edit Company" : "Add Company"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {editingCompany
                    ? "Update company information"
                    : "Add a new company to your CRM"}
                </p>
              </div>
              <button
                onClick={closeFormModal}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter company name"
                    required
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Industry
                  </label>
                  <input
                    type="text"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    placeholder="e.g. IT Services"
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Employees
                  </label>
                  <input
                    type="number"
                    name="employees"
                    min="0"
                    value={formData.employees}
                    onChange={handleInputChange}
                    placeholder="e.g. 50"
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Website
                  </label>
                  <input
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="company@example.com"
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="9876543210"
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Lucknow"
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder="India"
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter company address"
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-gray-200 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold"
                >
                  {editingCompany ? "Update Company" : "Create Company"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW COMPANY MODAL */}
      {showViewModal && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={closeViewModal}
            className="absolute inset-0 bg-black/50"
          />

          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <FiBriefcase size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {selectedCompany.name}
                  </h2>
                  <p className="text-sm text-gray-500">Company Details</p>
                </div>
              </div>
              <button
                onClick={closeViewModal}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Industry</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedCompany.industry || "Not provided"}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Employees</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedCompany.employees ?? "Not provided"}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="text-sm font-semibold text-gray-900 break-all">
                    {selectedCompany.email || "Not provided"}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Phone</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedCompany.phone || "Not provided"}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Website</p>
                  {selectedCompany.website ? (
                    <a
                      href={
                        selectedCompany.website.startsWith("http")
                          ? selectedCompany.website
                          : `https://${selectedCompany.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-blue-600 hover:underline break-all"
                    >
                      {selectedCompany.website}
                    </a>
                  ) : (
                    <p className="text-sm font-semibold text-gray-900">
                      Not provided
                    </p>
                  )}
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Location</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {[selectedCompany.city, selectedCompany.country]
                      .filter(Boolean)
                      .join(", ") || "Not provided"}
                  </p>
                </div>

                <div className="sm:col-span-2 p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Address</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedCompany.address || "Not provided"}
                  </p>
                </div>

                <div className="sm:col-span-2 p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Owner</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedCompany.owner?.name || "Not provided"}
                  </p>
                  {selectedCompany.owner?.email && (
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedCompany.owner.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeViewModal}
                  className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Companies;
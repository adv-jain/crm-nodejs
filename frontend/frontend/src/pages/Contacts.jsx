import { useEffect, useState, useMemo, useRef } from "react";

import api from "../api";

import ContactTable from "../components/ContactTable";
import ContactForm from "../components/ContactForm";
import ViewContact from "../components/ViewContact";
import DealForm from "../components/DealForm";

import { useAuth } from "../context/AuthContext";
import {
  FiPlus,
  FiSearch,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
} from "react-icons/fi";

function Contacts() {
  const { user } = useAuth();

  // ==========================================
  // CONTACT STATES
  // ==========================================

  const [contacts, setContacts] = useState([]);

  const [search, setSearch] = useState("");
  const [company, setCompany] = useState("");
  const [designation, setDesignation] = useState("");

  const [companies, setCompanies] = useState([]);
  const [designations, setDesignations] = useState([]);

  const [assignableUsers, setAssignableUsers] = useState([]);

  // ==========================================
  // DEAL DROPDOWN DATA
  // ==========================================

  const [dealCompanies, setDealCompanies] = useState([]);
  const [dealContacts, setDealContacts] = useState([]);
  const [dealLeads, setDealLeads] = useState([]);
  const [dealUsers, setDealUsers] = useState([]);

  // ==========================================
  // CONTACT FORM STATES
  // ==========================================

  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [viewContact, setViewContact] = useState(null);

  // ==========================================
  // DEAL FORM STATES
  // ==========================================

  const [showDealForm, setShowDealForm] = useState(false);
  const [creatingDealContact, setCreatingDealContact] = useState(null);
  const [creatingDealId, setCreatingDealId] = useState(null);
  const [savingDeal, setSavingDeal] = useState(false);

  // ==========================================
  // LOADING STATES
  // ==========================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // ==========================================
  // PAGINATION
  // ==========================================

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalContacts, setTotalContacts] = useState(0);

  const RECORDS_PER_PAGE = 50;

  // ==========================================
  // MESSAGES
  // ==========================================

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // ==========================================
  // FILTER POPOVER
  // ==========================================

  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);

  // ==========================================
  // FETCH CONTACTS
  // ==========================================

  const fetchContacts = async (page = currentPage) => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await api.get("/contacts", {
        params: {
          search,
          company,
          designation,
          page,
          limit: RECORDS_PER_PAGE,
        },
      });

      const data = response.data;

      setContacts(data.contacts || []);
      setCurrentPage(data.page || page);
      setTotalPages(data.totalPages || 1);
      setTotalContacts(data.total || 0);
    } catch (error) {
      console.error(
        "Fetch contacts error:",
        error.response?.data || error.message
      );
      setErrorMessage(
        error.response?.data?.message || "Failed to fetch contacts"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FETCH FILTER OPTIONS
  // ==========================================

  const fetchFilterOptions = async () => {
    try {
      const response = await api.get("/contacts", {
        params: { page: 1, limit: 50 },
      });

      const allContacts = response.data.contacts || [];

      const companyMap = new Map();
      allContacts.forEach((contact) => {
        if (contact.company?._id) {
          companyMap.set(contact.company._id, contact.company.name);
        }
      });
      setCompanies(
        Array.from(companyMap, ([id, name]) => ({ id, name }))
      );

      const uniqueDesignations = [
        ...new Set(
          allContacts.map((contact) => contact.designation).filter(Boolean)
        ),
      ];
      setDesignations(uniqueDesignations);
    } catch (error) {
      console.error(
        "Fetch filter options error:",
        error.response?.data || error.message
      );
    }
  };

  // ==========================================
  // FETCH ASSIGNABLE USERS
  // ==========================================

  const fetchAssignableUsers = async () => {
    if (user?.role !== "admin" && user?.role !== "manager") {
      setAssignableUsers([]);
      return;
    }

    try {
      const response = await api.get("/contacts/assignable-users");
      setAssignableUsers(response.data.users || []);
    } catch (error) {
      console.error(
        "Fetch assignable users error:",
        error.response?.data || error.message
      );
      setAssignableUsers([]);
    }
  };

  // ==========================================
  // FETCH DEAL DATA
  // ==========================================

  const fetchDealData = async () => {
    try {
      const companyResponse = await api.get("/companies");
      setDealCompanies(companyResponse.data.companies || []);

      const contactResponse = await api.get("/contacts", {
        params: { page: 1, limit: 50 },
      });
      setDealContacts(contactResponse.data.contacts || []);

      const leadResponse = await api.get("/leads", {
        params: { page: 1, limit: 50 },
      });
      setDealLeads(leadResponse.data.leads || []);

      if (user?.role === "admin" || user?.role === "manager") {
        const userResponse = await api.get("/deals/assignable-users");
        setDealUsers(userResponse.data.users || []);
      } else {
        setDealUsers([]);
      }
    } catch (error) {
      console.error(
        "Fetch deal data error:",
        error.response?.data || error.message
      );
    }
  };

  // ==========================================
  // EFFECTS
  // ==========================================

  useEffect(() => {
    if (!user) return;
    fetchFilterOptions();
    fetchAssignableUsers();
    fetchDealData();
  }, [user]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, company, designation]);

  useEffect(() => {
    if (!user) return;
    fetchContacts(currentPage);
  }, [currentPage, search, company, designation, user]);

  useEffect(() => {
    if (!successMessage && !errorMessage) return;
    const t = setTimeout(() => {
      setSuccessMessage("");
      setErrorMessage("");
    }, 4000);
    return () => clearTimeout(t);
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

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleAddContact = () => {
    setEditingContact(null);
    setShowForm(true);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setShowForm(true);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleSubmitContact = async (formData) => {
    try {
      setSaving(true);
      setErrorMessage("");

      if (editingContact) {
        await api.put(`/contacts/${editingContact._id}`, formData);
        setSuccessMessage("Contact updated successfully");
      } else {
        await api.post("/contacts", formData);
        setSuccessMessage("Contact created successfully");
      }

      setShowForm(false);
      setEditingContact(null);

      await fetchContacts(currentPage);
      await fetchFilterOptions();
      await fetchDealData();
    } catch (error) {
      console.error(
        "Save contact error:",
        error.response?.data || error.message
      );
      setErrorMessage(
        error.response?.data?.message || "Failed to save contact"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContact = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this contact?"
    );
    if (!confirmDelete) return;

    try {
      setDeletingId(id);
      setErrorMessage("");
      setSuccessMessage("");

      await api.delete(`/contacts/${id}`);
      setSuccessMessage("Contact deleted successfully");

      if (contacts.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        await fetchContacts(currentPage);
      }

      await fetchFilterOptions();
      await fetchDealData();
    } catch (error) {
      console.error(
        "Delete contact error:",
        error.response?.data || error.message
      );
      setErrorMessage(
        error.response?.data?.message || "Failed to delete contact"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewContact = (contact) => {
    setViewContact(contact);
  };

  const handleCreateDeal = async (contact) => {
    try {
      setCreatingDealId(contact._id);
      setSuccessMessage("");
      setErrorMessage("");

      await fetchDealData();

      setCreatingDealContact(contact);
      setShowDealForm(true);
    } catch (error) {
      console.error("Open create deal error:", error);
      setErrorMessage("Failed to open deal form");
    } finally {
      setCreatingDealId(null);
    }
  };

  const handleSubmitDeal = async (formData) => {
    try {
      setSavingDeal(true);
      setErrorMessage("");
      setSuccessMessage("");

      await api.post("/deals", formData);

      setSuccessMessage("Deal created successfully");
      setShowDealForm(false);
      setCreatingDealContact(null);
    } catch (error) {
      console.error(
        "Create deal error:",
        error.response?.data || error.message
      );
      setErrorMessage(
        error.response?.data?.message || "Failed to create deal"
      );
      throw error;
    } finally {
      setSavingDeal(false);
    }
  };

  const dealFormEditingData = creatingDealContact
    ? {
        title:
          `${creatingDealContact.firstName || ""} ${
            creatingDealContact.lastName || ""
          } Deal`.trim(),
        value: "",
        stage: "New",
        probability: 20,
        expectedCloseDate: "",
        company:
          creatingDealContact.company?._id ||
          creatingDealContact.company ||
          "",
        contact: creatingDealContact._id,
        lead:
          creatingDealContact.lead?._id ||
          creatingDealContact.lead ||
          "",
        owner:
          creatingDealContact.owner?._id ||
          creatingDealContact.owner ||
          "",
        description: "",
      }
    : null;

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingContact(null);
  };

  const handleCloseDealForm = () => {
    setShowDealForm(false);
    setCreatingDealContact(null);
  };

  const handleClearFilters = () => {
    setSearch("");
    setCompany("");
    setDesignation("");
  };

  const handlePreviousPage = () => {
    if (currentPage > 1 && !loading) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages && !loading) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const activeFilterCount = useMemo(() => {
    return [search, company, designation].filter(Boolean).length;
  }, [search, company, designation]);

  const dropdownFilterCount = useMemo(() => {
    return [company, designation].filter(Boolean).length;
  }, [company, designation]);

  // ==========================================
  // RENDER
  // ==========================================

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
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
                      onClick={handleClearFilters}
                      className="text-xs font-medium text-gray-500 hover:text-red-600 transition"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="p-4 space-y-4">

                  {/* COMPANY */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      Company
                    </label>
                    <select
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 cursor-pointer"
                    >
                      <option value="">All Companies</option>
                      {companies.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* DESIGNATION */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      Designation
                    </label>
                    {designations.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                        {designations.map((item) => (
                          <button
                            key={item}
                            onClick={() =>
                              setDesignation(designation === item ? "" : item)
                            }
                            className={`px-2.5 py-1 text-xs font-medium rounded-md border transition ${
                              designation === item
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">
                        No designations available
                      </p>
                    )}
                  </div>
                </div>

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
        </div>

        {/* RIGHT: ADD BUTTON */}
        <button
          onClick={handleAddContact}
          className="inline-flex items-center justify-center gap-1.5 px-4 h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition shadow-sm whitespace-nowrap self-start lg:self-auto"
        >
          <FiPlus size={15} />
          Add Contact
        </button>
      </div>

      {/* ALERTS */}
      {successMessage && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-lg">
          <FiCheckCircle className="flex-shrink-0 mt-0.5" size={18} />
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
          <FiAlertCircle className="flex-shrink-0 mt-0.5" size={18} />
          <p className="flex-1">{errorMessage}</p>
          <button
            onClick={() => setErrorMessage("")}
            className="text-red-600 hover:text-red-800 flex-shrink-0"
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      {/* CONTACT TABLE */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-7 h-7 border-[3px] border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500">Loading contacts...</p>
            </div>
          </div>
        ) : (
          <ContactTable
            contacts={contacts}
            onView={handleViewContact}
            onEdit={handleEditContact}
            onDelete={handleDeleteContact}
            onCreateDeal={handleCreateDeal}
            deletingId={deletingId}
            creatingDealId={creatingDealId}
            user={user}
          />
        )}
      </div>

      {/* FOOTER: SHOWING (left) | PAGE INFO + PAGINATION (right) */}
      {!loading && totalContacts > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* SHOWING */}
          <p className="text-xs text-gray-500">
            Showing{" "}
            <span className="font-medium text-gray-700">{contacts.length}</span> of{" "}
            <span className="font-medium text-gray-700">{totalContacts}</span>{" "}
            {totalContacts === 1 ? "contact" : "contacts"}
            {activeFilterCount > 0 && (
              <span className="ml-1">
                · {activeFilterCount}{" "}
                {activeFilterCount === 1 ? "filter" : "filters"} applied
              </span>
            )}
          </p>

          {/* PAGE INFO + PAGINATION */}
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-500">
              Page <span className="font-medium text-gray-700">{currentPage}</span> of{" "}
              <span className="font-medium text-gray-700">{totalPages}</span>
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || loading}
                  className="w-8 h-8 inline-flex items-center justify-center text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FiChevronLeft size={16} />
                </button>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || loading}
                  className="w-8 h-8 inline-flex items-center justify-center text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FiChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTACT FORM */}
      <ContactForm
        isOpen={showForm}
        onClose={handleCloseForm}
        onSubmit={handleSubmitContact}
        editingContact={editingContact}
        loading={saving}
        currentUser={user}
        assignableUsers={assignableUsers}
      />

      {/* DEAL FORM */}
      <DealForm
        isOpen={showDealForm}
        onClose={handleCloseDealForm}
        onSubmit={handleSubmitDeal}
        editingDeal={dealFormEditingData}
        loading={savingDeal}
        companies={dealCompanies}
        contacts={dealContacts}
        leads={dealLeads}
        users={dealUsers}
        user={user}
      />

      {/* VIEW CONTACT */}
      {viewContact && (
        <ViewContact
          contact={viewContact}
          onClose={() => setViewContact(null)}
        />
      )}

    </div>
  );
}

export default Contacts;
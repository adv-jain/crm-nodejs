import { useEffect, useState, useMemo } from "react";

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
} from "react-icons/fi";

function Contacts() {
  const { user } = useAuth();

  const [contacts, setContacts] = useState([]);

  // Search and Filters
  const [search, setSearch] = useState("");
  const [company, setCompany] = useState("");
  const [designation, setDesignation] = useState("");

  // Dropdown options
  const [companies, setCompanies] = useState([]);
  const [designations, setDesignations] = useState([]);

  // Assignable users
  const [assignableUsers, setAssignableUsers] = useState([]);

  // Deal dropdown data
  const [dealCompanies, setDealCompanies] = useState([]);
  const [dealContacts, setDealContacts] = useState([]);
  const [dealLeads, setDealLeads] = useState([]);
  const [dealUsers, setDealUsers] = useState([]);

  // Contact form states
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [viewContact, setViewContact] = useState(null);

  // Deal form states
  const [showDealForm, setShowDealForm] = useState(false);
  const [creatingDealContact, setCreatingDealContact] = useState(null);
  const [creatingDealId, setCreatingDealId] = useState(null);
  const [savingDeal, setSavingDeal] = useState(false);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Messages
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // ==========================================
  // FETCH CONTACTS
  // ==========================================
  const fetchContacts = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await api.get("/contacts", {
        params: {
          search,
          company,
          designation,
        },
      });

      setContacts(response.data.contacts || []);
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
      const response = await api.get("/contacts");

      const allContacts = response.data.contacts || [];

      // Companies
      const companyMap = new Map();

      allContacts.forEach((contact) => {
        if (contact.company?._id) {
          companyMap.set(contact.company._id, contact.company.name);
        }
      });

      setCompanies(
        Array.from(companyMap, ([id, name]) => ({
          id,
          name,
        }))
      );

      // Designations
      const uniqueDesignations = [
        ...new Set(
          allContacts
            .map((c) => c.designation)
            .filter(Boolean)
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

      const contactResponse = await api.get("/contacts");

      setDealContacts(contactResponse.data.contacts || []);

      const leadResponse = await api.get("/leads");

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
    fetchFilterOptions();
    fetchAssignableUsers();
    fetchDealData();
  }, [user]);

  useEffect(() => {
    fetchContacts();
  }, [search, company, designation]);

  // Auto-dismiss messages
  useEffect(() => {
    if (!successMessage && !errorMessage) return;

    const t = setTimeout(() => {
      setSuccessMessage("");
      setErrorMessage("");
    }, 4000);

    return () => clearTimeout(t);
  }, [successMessage, errorMessage]);

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
        await api.put(
          `/contacts/${editingContact._id}`,
          formData
        );

        setSuccessMessage("Contact updated successfully");
      } else {
        await api.post("/contacts", formData);

        setSuccessMessage("Contact created successfully");
      }

      setShowForm(false);
      setEditingContact(null);

      await fetchContacts();
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

      await fetchContacts();
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
        title: `${creatingDealContact.firstName || ""} ${
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

  // ==========================================
  // ACTIVE FILTER COUNT
  // ==========================================
  const activeFilterCount = useMemo(() => {
    return [search, company, designation].filter(Boolean).length;
  }, [search, company, designation]);

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1600px] mx-auto">
      {/* =========================
          PAGE HEADER
      ========================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
            Contacts
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Manage your contacts and customer information.
          </p>
        </div>

        <button
          onClick={handleAddContact}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg transition shadow-sm shadow-blue-600/20 w-full sm:w-auto"
        >
          <FiPlus size={18} />
          Add Contact
        </button>
      </div>

      {/* =========================
          SEARCH + FILTERS
      ========================= */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* SEARCH */}
          <div className="relative flex-1 min-w-[260px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <FiSearch size={18} />
            </span>

            <input
              type="text"
              placeholder="Search by name, email, or phone..."
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
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
              >
                <FiX size={14} />
              </button>
            )}
          </div>

          {/* COMPANY */}
          <select
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            style={{ height: "2.75rem" }}
            className="w-full sm:w-44 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition cursor-pointer"
          >
            <option value="">All Companies</option>

            {companies.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          {/* DESIGNATION */}
          <select
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            style={{ height: "2.75rem" }}
            className="w-full sm:w-44 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition cursor-pointer"
          >
            <option value="">All Designations</option>

            {designations.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          {/* CLEAR */}
          <button
            onClick={handleClearFilters}
            disabled={activeFilterCount === 0}
            title="Clear filters"
            style={{ height: "2.75rem" }}
            className="px-4 inline-flex items-center justify-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 hover:text-red-600 hover:bg-red-50 hover:border-red-200 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FiX size={16} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* =========================
          ALERTS
      ========================= */}
      {successMessage && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-lg">
          <FiCheckCircle
            className="flex-shrink-0 mt-0.5"
            size={18}
          />

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
          <FiAlertCircle
            className="flex-shrink-0 mt-0.5"
            size={18}
          />

          <p className="flex-1">{errorMessage}</p>

          <button
            onClick={() => setErrorMessage("")}
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
            {contacts.length}
          </span>{" "}
          {contacts.length === 1 ? "contact" : "contacts"}

          {activeFilterCount > 0 && (
            <span className="ml-1">
              · {activeFilterCount}{" "}
              {activeFilterCount === 1 ? "filter" : "filters"} applied
            </span>
          )}
        </p>
      </div>

      {/* =========================
          CONTACT TABLE CARD
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
              Loading contacts...
            </p>
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

      {/* =========================
          MODALS
      ========================= */}
      <ContactForm
        isOpen={showForm}
        onClose={handleCloseForm}
        onSubmit={handleSubmitContact}
        editingContact={editingContact}
        loading={saving}
        currentUser={user}
        assignableUsers={assignableUsers}
      />

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
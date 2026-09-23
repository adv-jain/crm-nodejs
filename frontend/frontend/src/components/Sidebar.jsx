import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiUser,
  FiBriefcase,
  FiUsers as FiCustomers,
  FiCheckSquare,
  FiActivity,
  FiX,
  FiSettings,
  FiChevronDown,
} from "react-icons/fi";

function Sidebar({ isOpen = false, onClose = () => {} }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // =====================================================
  // COLLAPSIBLE STATE
  // =====================================================
  const [moreOpen, setMoreOpen] = useState(() => {
    const saved = localStorage.getItem("sidebar_more_open");
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [adminOpen, setAdminOpen] = useState(() => {
    const saved = localStorage.getItem("sidebar_admin_open");
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Persist state
  useEffect(() => {
    localStorage.setItem("sidebar_more_open", JSON.stringify(moreOpen));
  }, [moreOpen]);

  useEffect(() => {
    localStorage.setItem("sidebar_admin_open", JSON.stringify(adminOpen));
  }, [adminOpen]);

  // Auto-open section if current page belongs to it
  useEffect(() => {
    const morePaths = ["/activities", "/customers", "/companies"];
    const adminPaths = ["/users"];

    if (morePaths.includes(location.pathname)) {
      setMoreOpen(true);
    }
    if (adminPaths.includes(location.pathname)) {
      setAdminOpen(true);
    }
  }, [location.pathname]);

  // =====================================================
  // NAV ITEMS
  // =====================================================
  const mainItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: <FiHome size={18} />,
    },
    {
      name: "Leads",
      path: "/leads",
      icon: <FiUsers size={18} />,
    },
    {
      name: "Contacts",
      path: "/contacts",
      icon: <FiUser size={18} />,
    },
    {
      name: "Deals",
      path: "/deals",
      icon: <FiBriefcase size={18} />,
    },
    {
      name: "Tasks",
      path: "/tasks",
      icon: <FiCheckSquare size={18} />,
    },
  ];

  const moreItems = [
    {
      name: "Activities",
      path: "/activities",
      icon: <FiActivity size={18} />,
    },
    {
      name: "Customers",
      path: "/customers",
      icon: <FiCustomers size={18} />,
    },
    {
      name: "Companies",
      path: "/companies",
      icon: <FiBriefcase size={18} />,
    },
  ];

  const adminItems = [
    {
      name: "Users",
      path: "/users",
      icon: <FiSettings size={18} />,
    },
  ];

  // Nav click
  const handleNavigate = (path) => {
    navigate(path);
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  // =====================================================
  // RENDER NAV ITEM
  // =====================================================
  const renderNavItem = (item) => {
    const isActive = location.pathname === item.path;

    return (
      <div
        key={item.path}
        onClick={() => handleNavigate(item.path)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer text-sm font-medium transition-colors duration-150 ${
          isActive
            ? "bg-blue-600 text-white"
            : "hover:bg-gray-800 hover:text-white"
        }`}
      >
        <span className="text-base">{item.icon}</span>
        <span>{item.name}</span>
      </div>
    );
  };

  // =====================================================
  // RENDER SECTION HEADER (collapsible)
  // =====================================================
  const renderSectionHeader = (label, isOpen, onToggle) => (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-300 transition-colors"
    >
      <span>{label}</span>
      <FiChevronDown
        size={14}
        className={`transition-transform duration-200 ${
          isOpen ? "rotate-180" : "rotate-0"
        }`}
      />
    </button>
  );

  return (
    <>
      {/* =====================================================
          OVERLAY — sirf mobile pe
      ===================================================== */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          aria-hidden="true"
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-64 bg-[#111827] text-gray-400
          flex flex-col z-40
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Logo + Close button */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex gap-[2px]">
              <span className="w-1 h-4 bg-blue-500 rounded-sm"></span>
              <span className="w-1 h-4 bg-blue-500 rounded-sm"></span>
              <span className="w-1 h-4 bg-blue-500 rounded-sm"></span>
            </div>
            <h2 className="text-white font-bold text-lg tracking-wide">
              Sales CRM
            </h2>
          </div>

          <button
            onClick={onClose}
            className="md:hidden text-gray-400 hover:text-white transition-colors"
            aria-label="Close sidebar"
          >
            <FiX size={22} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">

          {/* ============================================
              MAIN SECTION (always visible)
              ============================================ */}
          <div className="space-y-1">
            {mainItems.map(renderNavItem)}
          </div>

          {/* ============================================
              MORE SECTION (collapsible)
              ============================================ */}
          <div className="mt-4 pt-3 border-t border-gray-800">
            {renderSectionHeader("More", moreOpen, () =>
              setMoreOpen((prev) => !prev)
            )}

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                moreOpen ? "max-h-64 opacity-100 mt-1" : "max-h-0 opacity-0"
              }`}
            >
              <div className="space-y-1">
                {moreItems.map(renderNavItem)}
              </div>
            </div>
          </div>

          {/* ============================================
              ADMIN SECTION (collapsible, admin only)
              ============================================ */}
          {user?.role === "admin" && (
            <div className="mt-4 pt-3 border-t border-gray-800">
              {renderSectionHeader("Admin", adminOpen, () =>
                setAdminOpen((prev) => !prev)
              )}

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  adminOpen ? "max-h-64 opacity-100 mt-1" : "max-h-0 opacity-0"
                }`}
              >
                <div className="space-y-1">
                  {adminItems.map(renderNavItem)}
                </div>
              </div>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
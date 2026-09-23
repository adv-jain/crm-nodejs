import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import { useAuth } from "../context/AuthContext";
import {
  FiMenu,
  FiLogOut,
  FiChevronDown,
  FiBell,
} from "react-icons/fi";

// =====================================================
// PAGE TITLES MAP (based on route)
// =====================================================
const PAGE_TITLES = {
  "/": "Dashboard",
  "/leads": "Leads",
  "/contacts": "Contacts",
  "/deals": "Deals",
  "/tasks": "Tasks",
  "/companies": "Companies",
  "/customers": "Customers",
  "/activities": "Activities",
  "/users": "Users",
  "/notifications": "Notifications",
};

function Header({ user, onMenuClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // AUTO PAGE TITLE
  const pageTitle = PAGE_TITLES[location.pathname] || "Dashboard";

  // CLOSE DROPDOWN ON OUTSIDE CLICK
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  // LOGOUT
  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
    navigate("/login");
  };

  // NAVIGATE
  const handleNavigate = (path) => {
    setShowUserMenu(false);
    navigate(path);
  };

  // INITIALS
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((name) => name[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <header className="w-full bg-white border-b border-gray-200 px-4 sm:px-6 h-14">
      <div className="flex items-center justify-between gap-3 h-full">

        {/* LEFT SIDE */}
        <div className="flex items-center gap-2.5 min-w-0">

          {/* HAMBURGER — mobile only */}
          <button
            onClick={onMenuClick}
            className="md:hidden w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-md transition flex-shrink-0"
            aria-label="Open sidebar"
          >
            <FiMenu size={18} />
          </button>

          {/* PAGE TITLE */}
          <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight truncate">
            {pageTitle}
          </h1>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">

          {/* NOTIFICATION BELL */}
          <div className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition">
            <NotificationBell />
          </div>

          {/* USER MENU */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu((prev) => !prev)}
              className="flex items-center gap-1.5 pl-0.5 pr-1 py-0.5 rounded-md hover:bg-gray-50 transition"
              aria-label="User menu"
            >
              {/* AVATAR — muted/subtle */}
              <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 ring-1 ring-gray-200 flex items-center justify-center text-[11px] font-semibold flex-shrink-0">
                {initials}
              </div>

              {/* NAME — large screens only */}
              <span className="hidden lg:block text-sm font-medium text-gray-700 leading-tight max-w-[120px] truncate">
                {user?.name || "User"}
              </span>

              {/* CHEVRON */}
              <FiChevronDown
                size={13}
                className={`hidden lg:block text-gray-400 transition-transform ${
                  showUserMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* DROPDOWN MENU */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-gray-200 rounded-lg shadow-lg shadow-gray-200/60 z-50 overflow-hidden">

                {/* USER INFO HEADER */}
                <div className="px-3.5 py-2.5 border-b border-gray-100">
                  <p className="text-[13px] font-semibold text-gray-900 truncate">
                    {user?.name || "User"}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate mt-0.5">
                    {user?.email || "No email"}
                  </p>
                </div>

                {/* NOTIFICATIONS (mobile shortcut) */}
                <div className="py-0.5 lg:hidden">
                  <button
                    onClick={() => handleNavigate("/notifications")}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition"
                  >
                    <FiBell size={14} className="text-gray-400" />
                    Notifications
                  </button>
                </div>

                {/* LOGOUT */}
                <div className="border-t border-gray-100 py-0.5">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-[13px] text-red-600 hover:bg-red-50 transition"
                  >
                    <FiLogOut size={14} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
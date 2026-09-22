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
  FiBell,
  FiLogOut,
  FiX,
} from "react-icons/fi";

function Sidebar({ isOpen = false, onClose = () => {} }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Nav click — mobile pe sidebar close bhi karega
  const handleNavigate = (path) => {
    navigate(path);
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  // Menu items array
  const menuItems = [
    { name: "Dashboard", path: "/", icon: <FiHome size={18} /> },
    ...(user?.role === "admin"
      ? [{ name: "Users", path: "/users", icon: <FiUsers size={18} /> }]
      : []),
    { name: "Leads", path: "/leads", icon: <FiUsers size={18} /> },
    { name: "Contacts", path: "/contacts", icon: <FiUser size={18} /> },
    { name: "Deals", path: "/deals", icon: <FiBriefcase size={18} /> },
    { name: "Customers", path: "/customers", icon: <FiCustomers size={18} /> },
    { name: "Tasks", path: "/tasks", icon: <FiCheckSquare size={18} /> },
    { name: "Activities", path: "/activities", icon: <FiActivity size={18} /> },
    { name: "Notifications", path: "/notifications", icon: <FiBell size={18} /> },
  ];

  return (
    <>
      {/* =====================================================
          OVERLAY — sirf mobile pe, jab sidebar khula ho
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

          {/* Close button — sirf mobile pe */}
          <button
            onClick={onClose}
            className="md:hidden text-gray-400 hover:text-white transition-colors"
            aria-label="Close sidebar"
          >
            <FiX size={22} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <div
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-800 hover:text-white"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.name}</span>
              </div>
            );
          })}
        </nav>

        {/* Bottom — User Info + Logout */}
        <div className="border-t border-gray-800 p-4 flex-shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.name
                ? user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "U"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm text-white font-medium truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-gray-500 capitalize truncate">
                {user?.role || "guest"}
              </p>
            </div>
          </div>

          <button
  onClick={handleLogout}
  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-700 hover:border-gray-500 hover:bg-gray-800 text-gray-300 hover:text-white text-sm font-medium rounded-lg transition-colors"
>
  <FiLogOut size={16} />
  Logout
</button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
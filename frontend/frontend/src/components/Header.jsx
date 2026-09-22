import NotificationBell from "./NotificationBell";
import { FiMenu } from "react-icons/fi";

function Header({ user, onMenuClick }) {
  return (
    <header className="w-full bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sticky top-0 z-20">
      <div className="flex items-center justify-between gap-3 sm:gap-6">

        {/* =====================================================
            LEFT SIDE
        ===================================================== */}
        <div className="flex items-center gap-3 min-w-0">

          {/* HAMBURGER — sirf mobile pe (md se chhote screens) */}
          <button
            onClick={onMenuClick}
            className="md:hidden w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
            aria-label="Open sidebar"
          >
            <FiMenu size={22} />
          </button>

          {/* TITLE + WELCOME */}
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 tracking-tight truncate">
              Dashboard
            </h1>

            <p className="mt-0.5 text-xs sm:text-sm text-gray-500 truncate">
              Welcome back,{" "}
              <span className="font-semibold text-gray-700">
                {user?.name || "User"}
              </span>{" "}
              👋
            </p>
          </div>
        </div>

        {/* =====================================================
            RIGHT SIDE
        ===================================================== */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">

          {/* NOTIFICATION */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <NotificationBell />
          </div>

          {/* USER */}
          <div className="flex items-center gap-2 pl-1">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name
                ? user.name
                    .split(" ")
                    .map((name) => name[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "U"}
            </div>

            {/* Name + role — sirf large screens pe */}
            <div className="hidden lg:flex flex-col">
              <span className="text-sm font-semibold text-gray-800 leading-tight">
                {user?.name || "User"}
              </span>

              <span className="text-[11px] text-gray-400 capitalize">
                {user?.role || "user"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";

function DashboardLayout({ children }) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}
      <main className="md:ml-64 min-h-screen flex flex-col">

        {/* =================================================
            HEADER — HAR PAGE PAR VISIBLE
        ================================================= */}
        <Header
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* =================================================
            PAGE CONTENT
        ================================================= */}
        <div className="flex-1">
          {children}
        </div>

      </main>
    </div>
  );
}

export default DashboardLayout;
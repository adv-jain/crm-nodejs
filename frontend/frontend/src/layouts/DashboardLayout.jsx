import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";

function DashboardLayout({ children, showHeader = true }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="md:ml-64 min-h-screen flex flex-col">
        {showHeader && <Header user={user} />}
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}

export default DashboardLayout;

import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Contacts from "./pages/Contacts";
import Deals from "./pages/Deals";
import Users from "./pages/Users";
import Tasks from "./pages/Tasks";
import Activities from "./pages/Activities";
import Customers from "./pages/Customers";
import Notifications from "./components/Notifications";

import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import DashboardLayout from "./layouts/DashboardLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =====================================================
            PUBLIC ROUTES
        ===================================================== */}

        {/* LOGIN — no layout */}
        <Route
          path="/login"
          element={<LoginPage />}
        />

        {/* SIGNUP — no layout */}
        <Route
          path="/signup"
          element={<SignupPage />}
        />
        
        {/* FORGOT PASSWORD — no layout */}
<Route
  path="/forgot-password"
  element={<ForgotPasswordPage />}
/>

        {/* =====================================================
            PROTECTED ROUTES
        ===================================================== */}

        {/* DASHBOARD — with Header */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RoleRoute
                allowedRoles={["admin", "manager", "sales"]}
              >
                <DashboardLayout showHeader={true}>
                  <Dashboard />
                </DashboardLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* USERS — Admin only */}
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin"]}>
                <DashboardLayout showHeader={false}>
                  <Users />
                </DashboardLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* LEADS */}
        <Route
          path="/leads"
          element={
            <ProtectedRoute>
              <RoleRoute
                allowedRoles={["admin", "manager", "sales"]}
              >
                <DashboardLayout showHeader={false}>
                  <Leads />
                </DashboardLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* CONTACTS */}
        <Route
          path="/contacts"
          element={
            <ProtectedRoute>
              <RoleRoute
                allowedRoles={["admin", "manager", "sales"]}
              >
                <DashboardLayout showHeader={false}>
                  <Contacts />
                </DashboardLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* DEALS */}
        <Route
          path="/deals"
          element={
            <ProtectedRoute>
              <RoleRoute
                allowedRoles={["admin", "manager", "sales"]}
              >
                <DashboardLayout showHeader={false}>
                  <Deals />
                </DashboardLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* TASKS */}
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <RoleRoute
                allowedRoles={["admin", "manager", "sales"]}
              >
                <DashboardLayout showHeader={false}>
                  <Tasks />
                </DashboardLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* ACTIVITIES */}
        <Route
          path="/activities"
          element={
            <ProtectedRoute>
              <RoleRoute
                allowedRoles={["admin", "manager", "sales"]}
              >
                <DashboardLayout showHeader={false}>
                  <Activities />
                </DashboardLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* CUSTOMERS */}
        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <DashboardLayout showHeader={false}>
                <Customers />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* NOTIFICATIONS */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <RoleRoute
                allowedRoles={["admin", "manager", "sales"]}
              >
                <DashboardLayout showHeader={false}>
                  <Notifications />
                </DashboardLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;


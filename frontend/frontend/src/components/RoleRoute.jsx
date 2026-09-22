import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function RoleRoute({ allowedRoles, children }) {
  const { user } = useAuth();

  // User login nahi hai
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User ke paas required role nahi hai
  if (!allowedRoles.includes(user.role)) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "10px",
          fontFamily: "Arial, sans-serif"
        }}
      >
        <h1>Access Denied</h1>

        <p>
          You do not have permission to access this page.
        </p>

        <button
          onClick={() => {
            window.location.href = "/";
          }}
          style={{
            padding: "10px 18px",
            border: "none",
            borderRadius: "6px",
            background: "#111827",
            color: "#fff",
            cursor: "pointer"
          }}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return children;
}

export default RoleRoute;
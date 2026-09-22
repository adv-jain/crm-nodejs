import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FiX, FiAlertCircle } from "react-icons/fi";

const initialForm = {
  name: "",
  email: "",
  password: "",
  role: "sales",
  phone: "",
};

function UserForm({ isOpen, onClose, onSubmit, editingUser, loading }) {
  const [formData, setFormData] = useState(initialForm);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (editingUser) {
      setFormData({
        name: editingUser.name || "",
        email: editingUser.email || "",
        password: "",
        role: editingUser.role || "sales",
        phone: editingUser.phone || "",
      });
    } else {
      setFormData(initialForm);
    }
    setFormError("");
  }, [editingUser, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, loading, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Name is required");
      return;
    }
    if (!formData.email.trim()) {
      setFormError("Email is required");
      return;
    }
    if (!editingUser && !formData.password.trim()) {
      setFormError("Password is required");
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      setFormError(error.response?.data?.message || "Something went wrong");
    }
  };

  // Inline style helpers
  const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    zIndex: 99999,
    backgroundColor: "rgba(17, 24, 39, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    boxSizing: "border-box",
  };

  const modalStyle = {
    width: "100%",
    maxWidth: "520px",
    maxHeight: "88vh",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };

  const headerStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid #f3f4f6",
  };

  const bodyStyle = {
    flex: 1,
    overflowY: "auto",
    padding: "16px 20px",
  };

  const footerStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "8px",
    padding: "14px 20px",
    borderTop: "1px solid #f3f4f6",
    backgroundColor: "#fafafa",
  };

  const labelStyle = {
    display: "block",
    fontSize: "12px",
    fontWeight: 500,
    color: "#4b5563",
    marginBottom: "4px",
  };

  const inputStyle = {
    width: "100%",
    padding: "8px 12px",
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#1f2937",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  return createPortal(
    <div
      style={overlayStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div style={modalStyle}>
        {/* HEADER */}
        <div style={headerStyle}>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 600,
                color: "#111827",
              }}
            >
              {editingUser ? "Edit User" : "New User"}
            </h2>
            <p
              style={{
                margin: "2px 0 0 0",
                fontSize: "12px",
                color: "#6b7280",
              }}
            >
              {editingUser
                ? "Update user information"
                : "Create a new CRM user"}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "8px",
              border: "none",
              background: "transparent",
              color: "#9ca3af",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <FiX size={18} />
          </button>
        </div>

        {/* BODY */}
        <div style={bodyStyle}>
          {formError && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                fontSize: "12px",
                padding: "8px 12px",
                borderRadius: "8px",
                marginBottom: "16px",
              }}
            >
              <FiAlertCircle
                size={14}
                style={{ flexShrink: 0, marginTop: "2px" }}
              />
              <span>{formError}</span>
            </div>
          )}

          <form
            id="user-form"
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            {/* NAME */}
            <div>
              <label style={labelStyle}>
                Name <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Rahul Sharma"
                autoFocus
                style={inputStyle}
              />
            </div>

            {/* EMAIL */}
            <div>
              <label style={labelStyle}>
                Email <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="rahul@company.com"
                style={inputStyle}
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label style={labelStyle}>
                Password{" "}
                {!editingUser && <span style={{ color: "#ef4444" }}>*</span>}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={
                  editingUser
                    ? "Leave blank to keep current password"
                    : "Enter password"
                }
                style={inputStyle}
              />
            </div>

            {/* ROLE + PHONE */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <label style={labelStyle}>Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="sales">Sales</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  style={inputStyle}
                />
              </div>
            </div>
          </form>
        </div>

        {/* FOOTER */}
        <div style={footerStyle}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#374151",
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="user-form"
            disabled={loading}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: 600,
              color: "#ffffff",
              backgroundColor: "#2563eb",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              minWidth: "100px",
              fontFamily: "inherit",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Saving..." : editingUser ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default UserForm;
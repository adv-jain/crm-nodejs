import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBell,
  FiUser,
  FiRefreshCw,
  FiBookmark,
  FiClipboard,
  FiCheckCircle,
  FiBriefcase,
  FiAward,
  FiXCircle,
  FiStar,
  FiInbox,
  FiTrash2,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiCheckSquare,
} from "react-icons/fi";

const API_URL = "http://localhost:5000/api/notifications";

function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    total: 0,
  });

  const [unreadCount, setUnreadCount] = useState(0);

  const limit = 10;

  const getToken = () => localStorage.getItem("token");

  // ==========================================
  // FETCH NOTIFICATIONS
  // ==========================================
  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const token = getToken();
      if (!token) return;

      let url = `${API_URL}?page=${page}&limit=${limit}`;
      if (filter === "unread") url += "&unread=true";

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();

      setNotifications(data.notifications || []);
      setPagination({
        totalPages: data.pagination?.totalPages || 1,
        total: data.pagination?.total || 0,
      });
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Notification fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, filter]);

  // ==========================================
  // MARK AS READ
  // ==========================================
  const markAsRead = async (id) => {
    try {
      const token = getToken();

      const response = await fetch(`${API_URL}/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to mark as read");

      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      console.error("Mark as read error:", error);
    }
  };

  // ==========================================
  // MARK ALL AS READ
  // ==========================================
  const markAllAsRead = async () => {
    try {
      const token = getToken();

      const response = await fetch(`${API_URL}/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to mark all as read");

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      if (filter === "unread") setPage(1);
    } catch (error) {
      console.error("Mark all as read error:", error);
    }
  };

  // ==========================================
  // DELETE
  // ==========================================
  const deleteNotification = async (id) => {
    try {
      const token = getToken();

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to delete notification");

      const deleted = notifications.find((n) => n._id === id);

      setNotifications((prev) => prev.filter((n) => n._id !== id));

      if (deleted && !deleted.isRead) {
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      }
    } catch (error) {
      console.error("Delete notification error:", error);
    }
  };

  // ==========================================
  // ICON
  // ==========================================
  const getNotificationIcon = (type) => {
    const map = {
      LEAD_ASSIGNED: <FiUser size={16} />,
      LEAD_CONVERTED: <FiRefreshCw size={16} />,
      CONTACT_ASSIGNED: <FiBookmark size={16} />,
      TASK_ASSIGNED: <FiClipboard size={16} />,
      TASK_COMPLETED: <FiCheckCircle size={16} />,
      DEAL_ASSIGNED: <FiBriefcase size={16} />,
      DEAL_WON: <FiAward size={16} />,
      DEAL_LOST: <FiXCircle size={16} />,
      CUSTOMER_CREATED: <FiStar size={16} />,
    };
    return map[type] || <FiBell size={16} />;
  };

  // ==========================================
  // ICON COLOR
  // ==========================================
  const getIconColor = (type) => {
    const map = {
      LEAD_ASSIGNED: "bg-blue-50 text-blue-600 ring-blue-100",
      LEAD_CONVERTED: "bg-cyan-50 text-cyan-600 ring-cyan-100",
      CONTACT_ASSIGNED: "bg-pink-50 text-pink-600 ring-pink-100",
      TASK_ASSIGNED: "bg-indigo-50 text-indigo-600 ring-indigo-100",
      TASK_COMPLETED: "bg-green-50 text-green-600 ring-green-100",
      DEAL_ASSIGNED: "bg-purple-50 text-purple-600 ring-purple-100",
      DEAL_WON: "bg-emerald-50 text-emerald-600 ring-emerald-100",
      DEAL_LOST: "bg-red-50 text-red-600 ring-red-100",
      CUSTOMER_CREATED: "bg-amber-50 text-amber-600 ring-amber-100",
    };
    return map[type] || "bg-gray-50 text-gray-600 ring-gray-100";
  };

  // ==========================================
  // TIME FORMAT
  // ==========================================
  const formatTime = (date) => {
    if (!date) return "";
    const notificationDate = new Date(date);
    const now = new Date();
    const difference = now.getTime() - notificationDate.getTime();

    const seconds = Math.floor(difference / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return notificationDate.toLocaleDateString();
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1600px] mx-auto">

      {/* ============================================
          HEADER: TITLE | FILTER TOGGLE + MARK ALL
          ============================================ */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">

        {/* LEFT: TITLE */}
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight flex-shrink-0">
          Notifications
        </h1>

        {/* RIGHT: FILTER TOGGLE + MARK ALL */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">

          {/* FILTER TOGGLE */}
          <div className="inline-flex items-center bg-gray-100 rounded-lg p-0.5 h-9">
            <button
              type="button"
              onClick={() => handleFilterChange("all")}
              className={`px-3 h-8 text-sm font-medium rounded-md transition ${
                filter === "all"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange("unread")}
              className={`inline-flex items-center gap-1.5 px-3 h-8 text-sm font-medium rounded-md transition ${
                filter === "unread"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span
                  className={`inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[10px] font-semibold rounded-full ${
                    filter === "unread"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* MARK ALL AS READ */}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center justify-center gap-1.5 px-4 h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition shadow-sm whitespace-nowrap"
            >
              <FiCheckSquare size={14} />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* RESULT INFO */}
      {!loading && pagination.total > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <p>
            Showing <span className="font-medium text-gray-700">{notifications.length}</span> of{" "}
            <span className="font-medium text-gray-700">{pagination.total}</span>{" "}
            {pagination.total === 1 ? "notification" : "notifications"}
          </p>
          <p>
            Page <span className="font-medium text-gray-700">{page}</span> of{" "}
            <span className="font-medium text-gray-700">
              {pagination.totalPages}
            </span>
          </p>
        </div>
      )}

      {/* CONTENT */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-7 h-7 border-[3px] border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500">Loading notifications...</p>
          </div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <FiInbox size={24} className="text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-800">
            No notifications
          </h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">
            {filter === "unread"
              ? "You don't have any unread notifications."
              : "You're all caught up!"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`bg-white rounded-lg border p-4 flex items-start gap-3 transition ${
                !notification.isRead
                  ? "border-blue-200 bg-blue-50/30"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* ICON */}
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ring-1 ring-inset ${getIconColor(
                  notification.type
                )}`}
              >
                {getNotificationIcon(notification.type)}
              </div>

              {/* CONTENT */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {notification.title}
                    </h3>
                    {!notification.isRead && (
                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-100 text-blue-700 flex-shrink-0">
                        Unread
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {formatTime(notification.createdAt)}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  {notification.message}
                </p>

                {/* ACTIONS */}
                <div className="flex items-center gap-2 mt-2.5">
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead(notification._id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                    >
                      <FiCheck size={13} />
                      Mark as read
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification._id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <FiTrash2 size={13} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAGINATION */}
      {!loading && notifications.length > 0 && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {page} / {pagination.totalPages}
          </p>

          <div className="flex items-center gap-1.5">
            <button
              disabled={page === 1}
              onClick={() => setPage((prev) => prev - 1)}
              className="w-8 h-8 inline-flex items-center justify-center text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FiChevronLeft size={16} />
            </button>

            <span className="px-3 h-8 inline-flex items-center text-sm font-medium text-gray-700">
              {page}
            </span>

            <button
              disabled={page === pagination.totalPages}
              onClick={() => setPage((prev) => prev + 1)}
              className="w-8 h-8 inline-flex items-center justify-center text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications;
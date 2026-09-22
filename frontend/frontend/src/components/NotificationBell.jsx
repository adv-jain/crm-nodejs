import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
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
  FiArrowRight,
} from "react-icons/fi";

function NotificationBell() {
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef(null);

  // ==========================================
  // GET UNREAD COUNT
  // ==========================================
  const fetchUnreadCount = async () => {
    try {
      const response = await api.get(
        "/notifications/unread-count"
      );

      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error(
        "Unread count error:",
        error.response?.data || error.message
      );
    }
  };

  // ==========================================
  // GET NOTIFICATIONS
  // ==========================================
  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const response = await api.get("/notifications", {
        params: {
          page: 1,
          limit: 10,
        },
      });

      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error(
        "Notification fetch error:",
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // MARK SINGLE AS READ
  // ==========================================
  const markAsRead = async (notificationId) => {
    try {
      await api.put(
        `/notifications/${notificationId}/read`
      );

      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId
            ? { ...n, isRead: true }
            : n
        )
      );

      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      console.error(
        "Mark as read error:",
        error.response?.data || error.message
      );
    }
  };

  // ==========================================
  // MARK ALL AS READ
  // ==========================================
  const markAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "Mark all as read error:",
        error.response?.data || error.message
      );
    }
  };

  // ==========================================
  // DELETE NOTIFICATION
  // ==========================================
  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(
        `/notifications/${notificationId}`
      );

      const deleted = notifications.find(
        (n) => n._id === notificationId
      );

      setNotifications((prev) =>
        prev.filter((n) => n._id !== notificationId)
      );

      if (deleted && !deleted.isRead) {
        setUnreadCount((prev) =>
          Math.max(prev - 1, 0)
        );
      }
    } catch (error) {
      console.error(
        "Delete notification error:",
        error.response?.data || error.message
      );
    }
  };

  // ==========================================
  // NOTIFICATION NAVIGATION
  // ==========================================
  const handleNotificationClick = (notification) => {
    setIsOpen(false);

    switch (notification.type) {
      case "LEAD_ASSIGNED":
        navigate("/leads");
        break;

      case "LEAD_CONVERTED":
        navigate("/contacts");
        break;

      case "CONTACT_ASSIGNED":
        navigate("/contacts");
        break;

      case "TASK_ASSIGNED":
        navigate("/tasks");
        break;

      case "TASK_COMPLETED":
        navigate("/tasks");
        break;

      case "DEAL_ASSIGNED":
        navigate("/deals");
        break;

      case "DEAL_WON":
        navigate("/deals");
        break;

      case "DEAL_LOST":
        navigate("/deals");
        break;

      case "CUSTOMER_CREATED":
        navigate("/customers");
        break;

      default:
        break;
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================
  useEffect(() => {
    fetchUnreadCount();

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // ==========================================
  // CLICK OUTSIDE
  // ==========================================
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  // ==========================================
  // BELL CLICK
  // ==========================================
  const handleBellClick = () => {
    const nextState = !isOpen;

    setIsOpen(nextState);

    if (nextState) {
      fetchNotifications();
    }
  };

  // ==========================================
  // NOTIFICATION ICON
  // ==========================================
  const getNotificationIcon = (type) => {
    const iconMap = {
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

    return (
      iconMap[type] || <FiBell size={16} />
    );
  };

  // ==========================================
  // ICON COLOR
  // ==========================================
  const getIconColor = (type) => {
    const colorMap = {
      LEAD_ASSIGNED:
        "bg-blue-50 text-blue-600 ring-blue-100",

      LEAD_CONVERTED:
        "bg-cyan-50 text-cyan-600 ring-cyan-100",

      CONTACT_ASSIGNED:
        "bg-pink-50 text-pink-600 ring-pink-100",

      TASK_ASSIGNED:
        "bg-indigo-50 text-indigo-600 ring-indigo-100",

      TASK_COMPLETED:
        "bg-green-50 text-green-600 ring-green-100",

      DEAL_ASSIGNED:
        "bg-purple-50 text-purple-600 ring-purple-100",

      DEAL_WON:
        "bg-emerald-50 text-emerald-600 ring-emerald-100",

      DEAL_LOST:
        "bg-red-50 text-red-600 ring-red-100",

      CUSTOMER_CREATED:
        "bg-amber-50 text-amber-600 ring-amber-100",
    };

    return (
      colorMap[type] ||
      "bg-gray-50 text-gray-600 ring-gray-100"
    );
  };

  // ==========================================
  // FORMAT TIME
  // ==========================================
  const formatTime = (date) => {
    if (!date) return "";

    const notificationDate = new Date(date);
    const now = new Date();

    const difference =
      now.getTime() -
      notificationDate.getTime();

    const seconds = Math.floor(
      difference / 1000
    );

    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return notificationDate.toLocaleDateString();
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div
      className="relative"
      ref={dropdownRef}
    >
      {/* =====================================
          BELL BUTTON
      ====================================== */}
      <button
        type="button"
        onClick={handleBellClick}
        aria-label="Notifications"
        className="relative w-10 h-10 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
      >
        <FiBell size={20} />

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full ring-2 ring-white">
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </button>

      {/* =====================================
          DROPDOWN
      ====================================== */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl shadow-gray-900/10 border border-gray-200 overflow-hidden z-[999] animate-[fadeIn_.15s_ease-out]">

          {/* HEADER */}
          <div className="flex items-start justify-between gap-3 px-4 py-3.5 border-b border-gray-100">

            <div className="min-w-0">

              <h3 className="text-sm font-semibold text-gray-900">
                Notifications
              </h3>

              <p className="text-xs text-gray-500 mt-0.5">
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : "You're all caught up"}
              </p>

            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-md transition flex-shrink-0"
              >
                Mark all read
              </button>
            )}

          </div>

          {/* NOTIFICATION LIST */}
          <div className="max-h-[420px] overflow-y-auto">

            {loading ? (

              <div className="flex flex-col items-center justify-center py-12 gap-3">

                <svg
                  className="animate-spin h-5 w-5 text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>

                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>

                <p className="text-xs text-gray-500">
                  Loading notifications...
                </p>

              </div>

            ) : notifications.length === 0 ? (

              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">

                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <FiInbox
                    size={22}
                    className="text-gray-400"
                  />
                </div>

                <p className="text-sm font-medium text-gray-700">
                  No notifications
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  You're all caught up!
                </p>

              </div>

            ) : (

              <div className="divide-y divide-gray-100">

                {notifications.map(
                  (notification) => (

                    <div
                      key={notification._id}
                      onClick={() =>
                        handleNotificationClick(
                          notification
                        )
                      }
                      className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                        !notification.isRead
                          ? "bg-blue-50/40 hover:bg-blue-50"
                          : "hover:bg-gray-50"
                      }`}
                    >

                      {/* ICON */}
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ring-1 ring-inset ${getIconColor(
                          notification.type
                        )}`}
                      >
                        {getNotificationIcon(
                          notification.type
                        )}
                      </div>

                      {/* CONTENT */}
                      <div className="flex-1 min-w-0">

                        <div className="flex items-center gap-2">

                          <h4 className="text-sm font-medium text-gray-800 truncate flex-1">
                            {notification.title}
                          </h4>

                          {!notification.isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                          )}

                        </div>

                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>

                        <div className="flex items-center justify-between gap-2 mt-2">

                          <span className="text-[11px] text-gray-400">
                            {formatTime(
                              notification.createdAt
                            )}
                          </span>

                          {/* ACTIONS */}
                          <div className="flex items-center gap-1">

                            {!notification.isRead && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(
                                    notification._id
                                  );
                                }}
                                title="Mark as read"
                                className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                              >
                                <FiCheck size={13} />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(
                                  notification._id
                                );
                              }}
                              title="Delete"
                              className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                            >
                              <FiTrash2 size={13} />
                            </button>

                          </div>

                        </div>

                      </div>

                    </div>

                  )
                )}

              </div>
            )}

          </div>

          {/* FOOTER */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 bg-gray-50/60">

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/notifications");
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition"
              >
                View all notifications
                <FiArrowRight size={13} />
              </button>

            </div>
          )}

        </div>
      )}

      {/* Animation */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

    </div>
  );
}

export default NotificationBell;
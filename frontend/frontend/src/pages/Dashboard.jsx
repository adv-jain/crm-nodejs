import { useEffect, useMemo, useState } from "react";
import api from "../api";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  FiUsers,
  FiBriefcase,
  FiAlertCircle,
  FiTrendingUp,
  FiTrendingDown,
  FiPhone,
  FiMail,
  FiCheckCircle,
  FiCalendar,
} from "react-icons/fi";

import { TbCurrencyRupee } from "react-icons/tb";

function Dashboard() {
  // =====================================================
  // STATES
  // =====================================================
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    qualifiedLeads: 0,
    totalContacts: 0,
    totalDeals: 0,
    pipelineValue: 0,
    wonRevenue: 0,
  });

  const [pipeline, setPipeline] = useState([]);
  const [leadSources, setLeadSources] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // =====================================================
  // FETCH DASHBOARD DATA
  // =====================================================
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const [
        summaryResponse,
        pipelineResponse,
        sourcesResponse,
        recentResponse,
      ] = await Promise.all([
        api.get("/dashboard/summary"),
        api.get("/dashboard/pipeline"),
        api.get("/dashboard/lead-sources"),
        api.get("/dashboard/recent"),
      ]);

      setStats(
        summaryResponse.data.summary || {
          totalLeads: 0,
          newLeads: 0,
          qualifiedLeads: 0,
          totalContacts: 0,
          totalDeals: 0,
          pipelineValue: 0,
          wonRevenue: 0,
        }
      );

      setPipeline(pipelineResponse.data.pipeline || []);
      setLeadSources(sourcesResponse.data.sources || []);
      setRecentActivities(recentResponse.data.recentActivities || []);
      setUpcomingTasks(recentResponse.data.upcomingTasks || []);
    } catch (error) {
      console.error(
        "Dashboard error:",
        error.response?.data || error.message
      );
      setErrorMessage(
        error.response?.data?.message || "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // =====================================================
  // HELPERS
  // =====================================================
  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN")}`;
  };

  const formatDate = (date) => {
    if (!date) return "-";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "-";
    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatRelativeTime = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
    return d.toLocaleDateString("en-IN");
  };

  const getActivityRelatedName = (activity) => {
    if (activity?.lead) {
      return `${activity.lead.firstName || ""} ${
        activity.lead.lastName || ""
      }`.trim();
    }
    if (activity?.contact) {
      return `${activity.contact.firstName || ""} ${
        activity.contact.lastName || ""
      }`.trim();
    }
    if (activity?.company) return activity.company.name;
    if (activity?.deal) return activity.deal.title;
    return "General activity";
  };

  const getTaskRelatedName = (task) => {
    if (task?.relatedLead) {
      return `${task.relatedLead.firstName || ""} ${
        task.relatedLead.lastName || ""
      }`.trim();
    }
    if (task?.relatedContact) {
      return `${task.relatedContact.firstName || ""} ${
        task.relatedContact.lastName || ""
      }`.trim();
    }
    if (task?.relatedCompany) return task.relatedCompany.name;
    if (task?.relatedDeal) return task.relatedDeal.title;
    return "General task";
  };

  const maxPipelineValue = useMemo(() => {
    if (!pipeline.length) return 1;
    return Math.max(
      ...pipeline.map((item) => Number(item.totalValue || 0)),
      1
    );
  }, [pipeline]);

  // =====================================================
  // REVENUE CHART DATA (Mock for now)
  // =====================================================
  const revenueData = useMemo(() => {
    const baseValue = stats.wonRevenue || 100000;
    return [
      { name: "Week 1", revenue: baseValue * 0.3 },
      { name: "Week 2", revenue: baseValue * 0.45 },
      { name: "Week 3", revenue: baseValue * 0.6 },
      { name: "Week 4", revenue: baseValue * 0.75 },
      { name: "Week 5", revenue: baseValue * 0.85 },
      { name: "Week 6", revenue: baseValue * 1.0 },
    ];
  }, [stats.wonRevenue]);

  // =====================================================
  // STAT CARDS CONFIG
  // =====================================================
  const statCards = useMemo(() => {
    const sparkData = (trend = "up") => {
      if (trend === "up") {
        return [4, 6, 5, 8, 7, 10, 12];
      } else {
        return [10, 8, 9, 7, 6, 5, 4];
      }
    };

    return [
      {
        label: "Total Leads",
        value: stats.totalLeads,
        icon: <FiUsers size={20} />,
        color: "bg-blue-50 text-blue-600",
        trend: "up",
        change: 12,
        sparkline: sparkData("up"),
        sparkColor: "#2563eb",
      },
      {
        label: "Total Deals",
        value: stats.totalDeals,
        icon: <FiBriefcase size={20} />,
        color: "bg-green-50 text-green-600",
        trend: "up",
        change: 20,
        sparkline: sparkData("up"),
        sparkColor: "#16a34a",
      },
      {
  label: "Revenue (Expected)",
  value: formatCurrency(stats.pipelineValue),
  icon: <TbCurrencyRupee size={20} />,
  color: "bg-purple-50 text-purple-600",
  trend: "up",
  change: 18,
  sparkline: sparkData("up"),
  sparkColor: "#9333ea",
},
      {
        label: "Open Tasks",
        value: upcomingTasks.length,
        icon: <FiAlertCircle size={20} />,
        color: "bg-red-50 text-red-600",
        trend: "down",
        change: 5,
        sparkline: sparkData("down"),
        sparkColor: "#dc2626",
      },
    ];
  }, [stats, upcomingTasks]);

  // =====================================================
  // MINI SPARKLINE (SVG)
  // =====================================================
  const MiniSparkline = ({ data, color }) => {
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const width = 60;
    const height = 24;
    const step = width / (data.length - 1);

    const points = data
      .map((val, i) => {
        const x = i * step;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="flex-shrink-0"
      >
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">

      {/* ERROR */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {errorMessage}
        </div>
      )}

      {/* =================================================
          SUMMARY CARDS
      ================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.color}`}
              >
                {card.icon}
              </div>
              <MiniSparkline data={card.sparkline} color={card.sparkColor} />
            </div>

            <p className="text-sm text-gray-500 font-medium">{card.label}</p>

            <strong className="text-2xl font-bold text-gray-900 mt-1">
              {loading ? "..." : card.value}
            </strong>

            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold ${
                  card.trend === "up" ? "text-green-600" : "text-red-600"
                }`}
              >
                {card.trend === "up" ? (
                  <FiTrendingUp size={13} />
                ) : (
                  <FiTrendingDown size={13} />
                )}
                {card.change}%
              </span>
              <span className="text-xs text-gray-400">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* =================================================
          SALES PIPELINE + REVENUE OVERVIEW
      ================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* SALES PIPELINE — Bar chart */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sm:p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-gray-800">
                Sales Pipeline
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Deals by sales stage
              </p>
            </div>
            <select className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-700 cursor-pointer">
              <option>This Month</option>
            </select>
          </div>

          {loading ? (
            <div className="text-sm text-gray-400 py-16 text-center">
              Loading pipeline...
            </div>
          ) : pipeline.length === 0 ? (
            <div className="text-sm text-gray-400 py-16 text-center">
              No pipeline data available
            </div>
          ) : (
            <div className="flex items-end justify-between gap-2 h-[280px]">
              {pipeline.map((item, idx) => {
                const percentage = Math.round(
                  (Number(item.totalValue || 0) / maxPipelineValue) * 100
                );
                const colors = [
                  "bg-blue-500",
                  "bg-blue-400",
                  "bg-purple-500",
                  "bg-orange-500",
                  "bg-green-500",
                  "bg-red-500",
                ];
                const bgColor = colors[idx % colors.length];
                const heightPercent = Math.max(percentage, 8);

                return (
                  <div
                    key={item.stage}
                    className="flex-1 flex flex-col items-center h-full justify-end"
                  >
                    <span className="text-xs font-bold text-gray-700 mb-1.5">
                      {item.dealCount || 0}
                    </span>

                    <div
                      className={`w-[70%] ${bgColor} rounded-t-md transition-all duration-500 hover:opacity-90`}
                      style={{ height: `${heightPercent}%` }}
                    />

                    <div className="mt-3 text-center w-full">
                      <p className="text-[11px] font-medium text-gray-700 truncate">
                        {item.stage}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {percentage}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* REVENUE OVERVIEW — Area chart */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sm:p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-800">
                Revenue Overview
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <strong className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.wonRevenue)}
                </strong>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                  <FiTrendingUp size={13} />
                  18%
                </span>
              </div>
            </div>
            <select className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-700 cursor-pointer">
              <option>This Month</option>
            </select>
          </div>

          <div className="h-[220px] w-full -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f3f4f6"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* =================================================
          BOTTOM — 3 COLUMN LAYOUT
      ================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* SALES STAGES */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800">
              Sales Stages
            </h2>
            <button className="text-xs font-medium text-blue-600 hover:text-blue-700">
              View All
            </button>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="text-sm text-gray-400 py-8 text-center">
                Loading...
              </div>
            ) : pipeline.length === 0 ? (
              <div className="text-sm text-gray-400 py-8 text-center">
                No data available
              </div>
            ) : (
              <div className="space-y-3">
                {pipeline.slice(0, 5).map((item, idx) => {
                  const colors = [
                    "bg-blue-500",
                    "bg-blue-400",
                    "bg-purple-500",
                    "bg-orange-500",
                    "bg-green-500",
                  ];
                  return (
                    <div
                      key={item.stage}
                      className="flex items-center gap-3"
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          colors[idx % colors.length]
                        }`}
                      />
                      <span className="flex-1 text-sm text-gray-700">
                        {item.stage}
                      </span>
                      <span className="text-xs font-semibold text-gray-500">
                        {item.dealCount || 0}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* UPCOMING TASKS */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800">
              Upcoming Tasks
            </h2>
            <button className="text-xs font-medium text-blue-600 hover:text-blue-700">
              View All
            </button>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="text-sm text-gray-400 py-8 text-center">
                Loading...
              </div>
            ) : upcomingTasks.length === 0 ? (
              <div className="text-sm text-gray-400 py-8 text-center">
                No upcoming tasks
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.slice(0, 5).map((task) => {
                  const priority = String(
                    task.priority || "Medium"
                  ).toLowerCase();

                  const priorityClass =
                    priority === "high"
                      ? "bg-red-50 text-red-600"
                      : priority === "medium"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-green-50 text-green-600";

                  return (
                    <div
                      key={task._id}
                      className="flex items-start gap-3"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {task.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {getTaskRelatedName(task)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Due: {formatDate(task.dueDate)}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${priorityClass}`}
                      >
                        {task.priority || "Medium"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* RECENT ACTIVITIES */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800">
              Recent Activities
            </h2>
            <button className="text-xs font-medium text-blue-600 hover:text-blue-700">
              View All
            </button>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="text-sm text-gray-400 py-8 text-center">
                Loading...
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="text-sm text-gray-400 py-8 text-center">
                No recent activities
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.slice(0, 5).map((activity) => {
                  const type = activity.type?.toLowerCase() || "";
                  const iconMap = {
                    call: <FiPhone size={13} />,
                    email: <FiMail size={13} />,
                    meeting: <FiUsers size={13} />,
                    note: <FiAlertCircle size={13} />,
                    "follow-up": <FiCheckCircle size={13} />,
                  };
                  const colorMap = {
                    call: "bg-green-50 text-green-600",
                    email: "bg-purple-50 text-purple-600",
                    meeting: "bg-blue-50 text-blue-600",
                    note: "bg-amber-50 text-amber-600",
                    "follow-up": "bg-indigo-50 text-indigo-600",
                  };
                  const icon = iconMap[type] || <FiCheckCircle size={13} />;
                  const color =
                    colorMap[type] || "bg-gray-50 text-gray-600";

                  return (
                    <div
                      key={activity._id}
                      className="flex items-start gap-3"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}
                      >
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {getActivityRelatedName(activity)}
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">
                        {formatRelativeTime(
                          activity.activityDate || activity.createdAt
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
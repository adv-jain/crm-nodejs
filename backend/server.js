const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");

const connectDB = require("./config/db");

// Routes
const userRoutes = require("./routes/userRoutes");
const leadRoutes = require("./routes/leadRoutes");
const contactRoutes = require("./routes/contactRoutes");
const companyRoutes = require("./routes/companyRoutes");
const dealRoutes = require("./routes/dealRoutes");
const taskRoutes = require("./routes/taskRoutes");
const activityRoutes = require("./routes/activityRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const customerRoutes = require("./routes/customerRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

dotenv.config();

const app = express();


// ======================================================
// DATABASE
// ======================================================

connectDB();


// ======================================================
// MIDDLEWARE
// ======================================================

app.use(helmet());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true
  })
);

app.use(express.json());


// ======================================================
// API ROUTES
// ======================================================

app.use("/api/users", userRoutes);

app.use("/api/leads", leadRoutes);

app.use("/api/contacts", contactRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/deals", dealRoutes);

app.use("/api/tasks", taskRoutes);

app.use("/api/activities", activityRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/customers", customerRoutes);

app.use("/api/notifications", notificationRoutes);


// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Sales CRM API is running"
  });
});


// ======================================================
// 404 HANDLER
// ======================================================

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found"
  });
});


// ======================================================
// ERROR HANDLER
// ======================================================

app.use((err, req, res, next) => {
  console.error("Server error:", err);

  res.status(500).json({
    message: "Internal server error"
  });
});


// ======================================================
// SERVER
// ======================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");

// Load env vars
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logger (only in development)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/doctors", require("./routes/doctor.routes"));
app.use("/api/appointments", require("./routes/appointment.routes"));
app.use("/api/reports", require("./routes/report.routes"));
app.use("/api/ai", require("./routes/ai.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "MediFlow API is running 🚀", timestamp: new Date() });
});

// ─── Error Handling Middleware ────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🏥 MediFlow Server is running on port ${PORT}`);
});
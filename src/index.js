const express = require("express");
const dotenv = require("dotenv");
dotenv.config(); // load env BEFORE importing any routes/controllers
const cookieParser = require("cookie-parser");
const { connectDB } = require("./database/connectDB");
const matchRouter = require("./routes/matchRouter");

const cors = require("cors");

const authRouter = require("./routes/authRouter");
const profileRouter = require("./routes/profileRouter");
const imageRoutes = require("./routes/imageRouter");

const app = express();

const FRONTEND_ORIGINS = [
  "https://frontend-u92q.onrender.com",
  "http://localhost:5173",
  process.env.FRONTEND_ORIGIN, // Allow additional origins from env
]
  .filter(Boolean) // Remove any undefined values
  .filter((origin, index, self) => self.indexOf(origin) === index); // Remove duplicates

const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (FRONTEND_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(cookieParser());

// ✅ use app.use() to mount router
app.use("/user", authRouter);
app.use("/api", profileRouter);
console.log("Mounted /api/image to imageRoutes");
app.use("/api/image", imageRoutes);

app.use("/profile", profileRouter);
app.use("/api/match", matchRouter);

const InitializeConnection = async () => {
  try {
    await connectDB();
    console.log("Database connected successfully");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Database connection failed", err);
    process.exit(1);
  }
};

InitializeConnection();

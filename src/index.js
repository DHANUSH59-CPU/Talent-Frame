const express = require("express");
const dotenv = require("dotenv");
dotenv.config(); // load env BEFORE importing any routes/controllers
const cookieParser = require("cookie-parser");
const { connectDB } = require("./database/connectDB");

const cors = require("cors");

const authRouter = require("./routes/authRouter");
const profileRouter = require("./routes/profileRouter");
const imageRoutes = require("./routes/imageRouter");

const app = express();

const FRONTEND = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: FRONTEND, // must be specific when credentials: true
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
app.use("/api/image", imageRoutes);
app.use("/profile", profileRouter);

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

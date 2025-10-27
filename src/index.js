const express = require("express");

const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const { connectDB } = require("./database/connectDB");

const app = express();
dotenv.config();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

const InitializeConnection = async () => {
  try {
    await connectDB();
    console.log("Database connected successfully");
  } catch (err) {
    console.error("Database connection failed", err);
    process.exit(1);
  }
};

InitializeConnection();

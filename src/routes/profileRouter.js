const express = require("express");

const profileRouter = express.Router();

const {
  getProfile,
  EditProfile,
  getUserById,
} = require("../controllers/profile.controller");
const userMiddleware = require("../middleware/userMiddleware");

profileRouter.get("/profile/view", getProfile);
profileRouter.get("/user/:userId", getUserById);
profileRouter.put("/edit", userMiddleware, EditProfile);

module.exports = profileRouter;

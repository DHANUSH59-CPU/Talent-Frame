const express = require("express");

const profileRouter = express.Router();

const {
  getProfile,
  EditProfile,
} = require("../controllers/profile.controller");
const userMiddleware = require("../middleware/userMiddleware");

profileRouter.get("/profile/view", getProfile);
profileRouter.put("/edit", userMiddleware, EditProfile);

module.exports = profileRouter;

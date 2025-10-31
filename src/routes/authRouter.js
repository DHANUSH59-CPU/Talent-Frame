const authRouter = require("express").Router();

const {
  signup,
  checkAuth,
  login,
  logout,
} = require("../controllers/auth.controller.js");
const userMiddleware = require("../middleware/userMiddleware.js");

// Example route for user login

authRouter.get("/check-Auth", userMiddleware, checkAuth);

authRouter.post("/signup", signup);
authRouter.post("/login", login);
authRouter.post("/logout", logout);

module.exports = authRouter;

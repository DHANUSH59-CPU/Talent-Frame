const authRouter = require("express").Router();

const {
  signup,
  checkAuth,
  login,
  logout,
} = require("../controllers/auth.controller.js");

// Example route for user login

authRouter.get("/checkAuth", checkAuth);

authRouter.post("/signup", signup);
authRouter.post("/login", login);
authRouter.post("/logout", logout);

module.exports = authRouter;

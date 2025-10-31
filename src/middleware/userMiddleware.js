const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

const userMiddleware = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized - No token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!decoded) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - Invalid token" });
    }

    req.userId = decoded.userId;

    const result = await User.findById(req.userId);
    if (!result) {
      return res
        .status(401)
        .json({ success: false, message: "User not exists" });
    }

    req.result = result;
    next(); // ✅ Move to the next middleware or route
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized - Token error" });
  }
};

module.exports = userMiddleware;

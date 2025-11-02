const User = require("../models/User.model");

const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const {
  generateTokenAndSetCookie,
} = require("../utils/generateTokenAndSetCookie");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signup = async (req, res) => {
  // validate here (validate(req.body))

  const { userName, emailId, password, role } = req.body;

  console.log(req.body);

  try {
    if (!userName || !emailId || !password || !role) {
      return res.status(400).json({ message: "All fields are required!!" });
    }

    const userAlreadyExists = await User.findOne({ emailId });
    if (userAlreadyExists) {
      return res
        .status(409)
        .json({ message: "User already exists. Please login." });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = new User({
      userName,
      emailId,
      password: hashPassword,
      role,
    });

    await user.save();

    console.log("gjhgkg");

    generateTokenAndSetCookie(res, user._id, user.role);

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message || "Internal Server Error" });
  }
};

const login = async (req, res) => {
  // Implementation for login (not provided in the snippets)

  const { emailId, password } = req.body;

  try {
    if (!emailId || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ emailId });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log(user);

    // comparing the password
    console.log("Here");
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    generateTokenAndSetCookie(res, user._id, user.role);
    res.status(200).json({
      message: "Login successful",
      user: { ...user._doc, password: undefined },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message || "Internal Server Error" });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(400).json({ message: "No token found" });
    }

    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(0),
      sameSite: "none",
      secure: true,
    });
    return res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Google token is required" });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ message: "Email not provided by Google" });
    }

    // Check if user exists
    let user = await User.findOne({ emailId: email.toLowerCase() });

    if (user) {
      // Update existing user with Google ID if not already set
      if (!user.googleId) {
        user.googleId = googleId;
        if (picture && !user.profileImage) {
          user.profileImage = picture;
        }
        await user.save();
      }
    } else {
      // Create new user
      user = new User({
        userName: name || email.split("@")[0],
        emailId: email.toLowerCase(),
        googleId: googleId,
        profileImage: picture || "",
        role: "actor", // Default role
      });
      await user.save();
    }

    // Generate token and set cookie
    generateTokenAndSetCookie(res, user._id, user.role);

    return res.status(200).json({
      message: "Google authentication successful",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    return res
      .status(500)
      .json({ message: "Google authentication failed", error: error.message });
  }
};

const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ user });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { signup, login, logout, checkAuth, googleAuth };

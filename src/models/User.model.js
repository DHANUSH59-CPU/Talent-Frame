const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Basic info
    userName: { type: String, required: true, trim: true },
    emailId: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6, select: false },

    // Common profile fields
    profileImage: { type: String, default: "" },
    phone: { type: String },
    location: { type: String, default: "Not specified" },
    bio: { type: String, maxlength: 1000 },

    // Role-based system
    role: {
      type: String,
      enum: ["actor", "director", "admin"],
      default: "actor",
    },

    // Actor-specific fields
    actorProfile: {
      age: { type: Number },
      gender: { type: String, enum: ["Male", "Female", "Other"] },
      height: { type: Number },
      weight: { type: Number },
      skills: [{ type: String }],
      languages: [{ type: String }],
      portfolio: [{ type: String }], // image/video URLs
      embeddingId: { type: String }, // vector DB reference
    },

    // Director-specific fields
    directorProfile: {
      company: { type: String },
      experienceYears: { type: Number },
      pastProjects: [{ type: String }],
      castingPreferences: [{ type: String }], // e.g., "Comedy", "Thriller"
    },

    // Tokens (for login sessions)
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;

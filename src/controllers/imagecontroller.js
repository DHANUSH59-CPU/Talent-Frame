const fs = require("fs");
const cloudinary = require("cloudinary").v2;
const User = require("../models/User.model");

// Configure Cloudinary via environment variables
// CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET must be set
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload profile image to Cloudinary and persist URL on user.profileImage
exports.getImageEmbedding = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded" });
    }

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "avatars",
      resource_type: "image",
      public_id: req.userId ? `avatar_${req.userId}` : undefined,
      overwrite: true,
      transformation: [{ width: 512, height: 512, crop: "limit" }],
    });

    // Cleanup temporary file
    try {
      fs.unlinkSync(req.file.path);
    } catch (_) {}

    // Persist URL on the authenticated user
    if (!req.userId) {
      return res
        .status(401)
        .json({ error: "Unauthorized - user not identified for upload" });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { profileImage: uploadResult.secure_url },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      status: "success",
      url: uploadResult.secure_url,
      user,
    });
  } catch (error) {
    console.error("❌ Image upload error:", error.message);
    return res.status(500).json({ error: "Failed to upload image" });
  }
};

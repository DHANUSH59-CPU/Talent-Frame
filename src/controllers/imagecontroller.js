// controllers/imagecontroller.js
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const cloudinary = require("cloudinary").v2;
const User = require("../models/User.model");
const { upsertVector } = require("../lib/pineconeClient");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Python microservice endpoint that returns { embedding: [..512 floats..] }
const PYTHON_EMBEDDING_URL = process.env.PYTHON_EMBEDDING_URL || "http://localhost:5000/embed";
// Optional API key to protect the Python service
const PYTHON_API_KEY = process.env.PYTHON_API_KEY || null;

function cleanupTempFile(path) {
  try {
    if (path && fs.existsSync(path)) fs.unlinkSync(path);
  } catch (err) {
    console.warn("Failed to delete temp file:", path, err?.message || err);
  }
}

exports.getImageEmbedding = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file uploaded" });
  }
  if (!req.userId) {
    cleanupTempFile(req.file.path);
    return res
      .status(401)
      .json({ error: "Unauthorized - user not identified for upload" });
  }

  // 1) Send file to Python microservice (multipart/form-data)
  let embedding = null;
  try {
    const form = new FormData();
    form.append("image", fs.createReadStream(req.file.path));

    const headers = form.getHeaders();
    if (PYTHON_API_KEY) headers["Authorization"] = `Bearer ${PYTHON_API_KEY}`;

    const resp = await axios.post(PYTHON_EMBEDDING_URL, form, {
      headers,
      timeout: 30000,
    });

    if (!resp.data || !Array.isArray(resp.data.embedding)) {
      cleanupTempFile(req.file.path);
      return res
        .status(502)
        .json({ error: "Invalid response from embedding service" });
    }

    embedding = resp.data.embedding;
    if (!Array.isArray(embedding) || embedding.length !== 512) {
      cleanupTempFile(req.file.path);
      return res
        .status(502)
        .json({ error: "Embedding from service malformed" });
    }

    // ✅ 2) Store embedding in Pinecone before uploading to Cloudinary
    try {
      const vec = embedding.map(Number);
      const metadata = { mongoId: String(req.userId) };

      await upsertVector(req.userId, vec, metadata);
      console.log(`✅ Embedding stored in Pinecone for user ${req.userId}`);
    } catch (err) {
      console.error("❌ Pinecone upsert failed:", err.message || err);
      cleanupTempFile(req.file.path);
      return res
        .status(502)
        .json({ error: "Failed to store embedding in vector database" });
    }
  } catch (err) {
    console.error("Error calling Python embedding service:", err.message || err);
    cleanupTempFile(req.file.path);
    return res
      .status(502)
      .json({ error: "Failed to compute embedding", details: err.message });
  }

  // 3) Upload to Cloudinary only after Pinecone success
  let uploadResult;
  try {
    uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "avatars",
      resource_type: "image",
      public_id: `avatar_${req.userId}`,
      overwrite: true,
      transformation: [{ width: 512, height: 512, crop: "limit" }],
    });
  } catch (err) {
    console.error("Cloudinary upload failed:", err.message || err);
    cleanupTempFile(req.file.path);
    return res.status(500).json({ error: "Failed to upload image" });
  } finally {
    cleanupTempFile(req.file.path);
  }

  // 4) Persist user document with profileImage URL and embedding
  try {
    const update = {
      profileImage: uploadResult.secure_url,
      faceEmbedding: embedding,
      pineconeSynced: true,
    };

    const user = await User.findByIdAndUpdate(req.userId, update, {
      new: true,
    }).select("-password");

    if (!user) {
      console.warn("User not found when saving embedding:", req.userId);
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      status: "success",
      url: uploadResult.secure_url,
      user,
      embedded: true,
    });
  } catch (err) {
    console.error("Failed to persist user embedding:", err.message || err);
    return res
      .status(500)
      .json({ error: "Failed to save embedding to user profile" });
  }
};

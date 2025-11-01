// routes/matchRouter.js
const express = require("express");
const multer = require("multer");
const axios = require("axios");
const { Pinecone } = require("@pinecone-database/pinecone");
const User = require("../models/User.model");

const upload = multer({ dest: "uploads/" });
const router = express.Router();

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index(process.env.PINECONE_INDEX);

const PYTHON_EMBEDDING_URL = process.env.PYTHON_EMBEDDING_URL;
const PYTHON_API_KEY = process.env.PYTHON_API_KEY;

// POST /api/match/upload — find similar users
router.post("/upload", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image uploaded" });

  try {
    // Send image to Python for embedding
    const formData = new (require("form-data"))();
    formData.append("image", require("fs").createReadStream(req.file.path));

    const headers = formData.getHeaders();
    if (PYTHON_API_KEY) headers["Authorization"] = `Bearer ${PYTHON_API_KEY}`;

    const { data } = await axios.post(PYTHON_EMBEDDING_URL, formData, { headers });
    const embedding = data.embedding;

    // Query Pinecone for top-K similar vectors
    const results = await index.query({
      topK: 5,
      vector: embedding,
      includeMetadata: true,
    });

    // Map results to users
    const matches = await Promise.all(
      results.matches.map(async (m) => {
        const user = await User.findById(m.id).select("userName profileImage role");
        return {
          user,
          score: m.score,
        };
      })
    );

    res.json({ count: matches.length, matches });
  } catch (err) {
    console.error("❌ Match error:", err.message || err);
    res.status(500).json({ error: "Failed to match face" });
  } finally {
    require("fs").unlinkSync(req.file.path);
  }
});

module.exports = router;

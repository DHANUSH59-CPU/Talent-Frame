const express = require("express");
const multer = require("multer");
const { getImageEmbedding } = require("../controllers/imagecontroller");
const userMiddleware = require("../middleware/userMiddleware");

const imageRouter = express.Router();
const upload = multer({ dest: "uploads/" });

// POST /api/image/embed (protected)
imageRouter.post("/embed", userMiddleware, upload.single("image"), getImageEmbedding);

module.exports = imageRouter;

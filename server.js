// server.js
require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());

// Multer in-memory storage
const upload = multer();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
  }

  // For debugging
  console.log("Uploaded file info:", {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
  });

  // Decide if it's a PDF (via MIME type) or if user said "documents"
  const category = req.body.category || "other";
  const isPdf = req.file.mimetype.toLowerCase().includes("pdf");

  // Build a public ID with .pdf extension if it's recognized as PDF
  let publicIdBase = Date.now().toString(); // e.g. "1740785474647"
  if (isPdf) {
    publicIdBase += "-file.pdf";
  } else {
    // preserve extension for images, etc.
    const ext = path.extname(req.file.originalname); 
    publicIdBase += ext;
  }

  // If it's a PDF or user said "documents," use raw. Otherwise auto.
  let resourceType = "auto";
  if (isPdf || category === "documents") {
    resourceType = "raw";
  }

  cloudinary.uploader.upload_stream(
    {
      resource_type: resourceType,
      type: "upload", // <= IMPORTANT to allow public delivery
      public_id: publicIdBase, 
      overwrite: true,
    },
    (error, result) => {
      if (error) {
        console.error("Cloudinary Upload Error:", error);
        return res.status(500).json({ error: "Upload failed" });
      }
      console.log("Cloudinary result:", result);
      // e.g. result.secure_url => "https://res.cloudinary.com/.../raw/upload/v12345/1740785474647-file.pdf"
      return res.json({ url: result.secure_url });
    }
  ).end(req.file.buffer);
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Server running on port ${port}`));

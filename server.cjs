const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

// Data file for storing rotations
const ROTATIONS_FILE = path.join(__dirname, "rotations.json");

// Initialize rotations file if it doesn't exist
if (!fs.existsSync(ROTATIONS_FILE)) {
  console.log(`Creating new rotations file at: ${ROTATIONS_FILE}`);
  fs.writeFileSync(ROTATIONS_FILE, JSON.stringify({}), "utf8");
} else {
  console.log(`Using existing rotations file at: ${ROTATIONS_FILE}`);
  // Check if file is writeable
  try {
    fs.accessSync(ROTATIONS_FILE, fs.constants.W_OK);
    console.log("Rotations file is writeable");
  } catch (err) {
    console.error("WARNING: Cannot write to rotations file:", err);
  }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Get all rotations
app.get("/api/rotations", (req, res) => {
  try {
    const rotations = JSON.parse(fs.readFileSync(ROTATIONS_FILE, "utf8"));
    console.log("Sending rotations:", rotations);
    res.json(rotations);
  } catch (error) {
    console.error("Error reading rotations:", error);
    res.status(500).json({ error: "Failed to read rotations" });
  }
});

// Update rotation for a specific image
app.post("/api/rotations", (req, res) => {
  try {
    console.log("Received rotation update request:", req.body);
    const { imagePath, rotation } = req.body;

    if (!imagePath) {
      return res.status(400).json({ error: "Image path is required" });
    }

    const rotations = JSON.parse(fs.readFileSync(ROTATIONS_FILE, "utf8"));
    rotations[imagePath] = rotation;

    console.log("Saving updated rotations:", rotations);

    fs.writeFileSync(
      ROTATIONS_FILE,
      JSON.stringify(rotations, null, 2),
      "utf8"
    );

    // Verify the file was actually written
    const savedData = JSON.parse(fs.readFileSync(ROTATIONS_FILE, "utf8"));
    console.log("Verification - saved rotations:", savedData);

    res.json({ success: true, imagePath, rotation });
  } catch (error) {
    console.error("Error updating rotation:", error);
    res.status(500).json({ error: "Failed to update rotation" });
  }
});

// Serve the React app for any other routes (in production)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Function to start server with port fallback
const startServer = (port) => {
  try {
    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`API available at http://localhost:${port}/api/rotations`);
    });

    server.on("error", (e) => {
      if (e.code === "EADDRINUSE") {
        console.log(`Port ${port} is busy, trying port ${port + 1}`);
        startServer(port + 1);
      } else {
        console.error("Server error:", e);
      }
    });
  } catch (err) {
    console.error("Failed to start server:", err);
  }
};

// Start the server
startServer(PORT);

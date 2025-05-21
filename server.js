import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3001;

// ES modules don't have __dirname, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Data file for storing slide details
const SLIDE_DETAILS_FILE = path.join(__dirname, "slideDetails.json");

// Initialize slide details file if it doesn't exist
if (!fs.existsSync(SLIDE_DETAILS_FILE)) {
  console.log(`Creating new slide details file at: ${SLIDE_DETAILS_FILE}`);
  fs.writeFileSync(SLIDE_DETAILS_FILE, JSON.stringify({}), "utf8");
} else {
  console.log(`Using existing slide details file at: ${SLIDE_DETAILS_FILE}`);
  try {
    fs.accessSync(SLIDE_DETAILS_FILE, fs.constants.W_OK);
    console.log("Slide details file is writeable");
  } catch (err) {
    console.error("WARNING: Cannot write to slide details file:", err);
  }
}

// Data file for storing global theme
const GLOBAL_THEME_FILE = path.join(__dirname, "globalTheme.json");

// Initialize global theme file if it doesn't exist
if (!fs.existsSync(GLOBAL_THEME_FILE)) {
  console.log(`Creating new global theme file at: ${GLOBAL_THEME_FILE}`);
  // Default to null or a default theme object if you want
  fs.writeFileSync(GLOBAL_THEME_FILE, JSON.stringify(null), "utf8");
} else {
  console.log(`Using existing global theme file at: ${GLOBAL_THEME_FILE}`);
  try {
    fs.accessSync(GLOBAL_THEME_FILE, fs.constants.W_OK);
    console.log("Global theme file is writeable");
  } catch (err) {
    console.error("WARNING: Cannot write to global theme file:", err);
  }
}

// Data file for storing slide transition
const SLIDE_TRANSITION_FILE = path.join(__dirname, "slideTransition.json");

// Initialize slide transition file if it doesn't exist
if (!fs.existsSync(SLIDE_TRANSITION_FILE)) {
  console.log(
    `Creating new slide transition file at: ${SLIDE_TRANSITION_FILE}`
  );
  // Default to a standard fade transition or the first one in your list
  const defaultTransition = {
    name: "Fade",
    className: "transition-fade",
  };
  fs.writeFileSync(
    SLIDE_TRANSITION_FILE,
    JSON.stringify(defaultTransition, null, 2),
    "utf8"
  );
} else {
  console.log(
    `Using existing slide transition file at: ${SLIDE_TRANSITION_FILE}`
  );
  try {
    fs.accessSync(SLIDE_TRANSITION_FILE, fs.constants.W_OK);
    console.log("Slide transition file is writeable");
  } catch (err) {
    console.error("WARNING: Cannot write to slide transition file:", err);
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

// Get all slide details
app.get("/api/slide-details", (req, res) => {
  try {
    const details = JSON.parse(fs.readFileSync(SLIDE_DETAILS_FILE, "utf8"));
    console.log("Sending slide details:", details);
    res.json(details);
  } catch (error) {
    console.error("Error reading slide details:", error);
    res.status(500).json({ error: "Failed to read slide details" });
  }
});

// Update slide details for a specific image
app.post("/api/slide-details/:imagePath", (req, res) => {
  try {
    const imagePath = decodeURIComponent(req.params.imagePath);
    const { title, description, isHidden } = req.body;
    console.log(`Received slide details update for ${imagePath}:`, req.body);

    if (!imagePath) {
      return res.status(400).json({ error: "Image path is required" });
    }

    const details = JSON.parse(fs.readFileSync(SLIDE_DETAILS_FILE, "utf8"));

    if (!details[imagePath]) {
      details[imagePath] = {};
    }

    // Update only provided fields
    if (title !== undefined) details[imagePath].title = title;
    if (description !== undefined) details[imagePath].description = description;
    if (isHidden !== undefined) details[imagePath].isHidden = isHidden;
    // Allow removing fields by passing null
    if (title === null) delete details[imagePath].title;
    if (description === null) delete details[imagePath].description;
    if (isHidden === null) delete details[imagePath].isHidden;

    console.log("Saving updated slide details:", details);

    fs.writeFileSync(
      SLIDE_DETAILS_FILE,
      JSON.stringify(details, null, 2),
      "utf8"
    );

    const savedData = JSON.parse(fs.readFileSync(SLIDE_DETAILS_FILE, "utf8"));
    console.log("Verification - saved slide details:", savedData);

    res.json({ success: true, imagePath, updatedDetails: details[imagePath] });
  } catch (error) {
    console.error("Error updating slide details:", error);
    res.status(500).json({ error: "Failed to update slide details" });
  }
});

// Get global theme
app.get("/api/global-theme", (req, res) => {
  try {
    const theme = JSON.parse(fs.readFileSync(GLOBAL_THEME_FILE, "utf8"));
    res.json(theme);
  } catch (error) {
    console.error("Error reading global theme:", error);
    res.status(500).json({ error: "Failed to read global theme" });
  }
});

// Set global theme
app.post("/api/global-theme", (req, res) => {
  try {
    const theme = req.body;
    if (!theme || !theme.name || !theme.colors) {
      return res.status(400).json({ error: "Invalid theme object" });
    }
    fs.writeFileSync(GLOBAL_THEME_FILE, JSON.stringify(theme, null, 2), "utf8");
    res.json({ success: true, theme });
  } catch (error) {
    console.error("Error saving global theme:", error);
    res.status(500).json({ error: "Failed to save global theme" });
  }
});

// Get current slide transition
app.get("/api/slide-transition", (req, res) => {
  try {
    const transition = JSON.parse(
      fs.readFileSync(SLIDE_TRANSITION_FILE, "utf8")
    );
    res.json(transition);
  } catch (error) {
    console.error("Error reading slide transition:", error);
    res.status(500).json({ error: "Failed to read slide transition" });
  }
});

// Set slide transition
app.post("/api/slide-transition", (req, res) => {
  try {
    const transition = req.body;
    // Basic validation for the transition object
    if (
      !transition ||
      typeof transition.name !== "string" ||
      typeof transition.className !== "string"
    ) {
      return res.status(400).json({ error: "Invalid slide transition object" });
    }
    fs.writeFileSync(
      SLIDE_TRANSITION_FILE,
      JSON.stringify(transition, null, 2),
      "utf8"
    );
    res.json({ success: true, transition });
  } catch (error) {
    console.error("Error saving slide transition:", error);
    res.status(500).json({ error: "Failed to save slide transition" });
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

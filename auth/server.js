// Polyfill for Node versions that removed the deprecated `SlowBuffer`
require("buffer").SlowBuffer = require("buffer").SlowBuffer || require("buffer").Buffer;

const express = require("express");
const cors = require("cors");
const root = require("path").join(__dirname, "client", "build");
require("dotenv").config();

const app = express();

if (!process.env.JWT_SECRET) {
  console.warn("JWT_SECRET is not set: protected routes will reject every token.");
}

// Init middleware
// Only the configured front-end origin(s) may call this API from a browser
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000").split(",").map((o) => o.trim());
app.use(cors({ origin: allowedOrigins }));
app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/cities", require("./routes/cities"));
app.use("/api/users", require("./routes/users"));
app.use("/api/profile", require("./routes/profile"));

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  // Set static folder
  app.use(express.static(root));

  app.get("*", (req, res) => {
    res.sendFile("index.html", { root });
  });
} else {
  app.get("/", (req, res) => {
    res.send("Api running");
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));

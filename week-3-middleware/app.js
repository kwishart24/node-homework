const express = require("express");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
const imagesDir = path.join(__dirname, "public", "images");
const dogsRouter = require("./routes/dogs");
const { StatusCodes } = require("http-status-codes");

const app = express();

// Your middleware here

// Attach request ID to every request
app.use((req, res, next) => {
  req.requestId = uuidv4();
  res.setHeader("X-Request-Id", req.requestId);
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]: ${req.method} ${req.path} (${req.requestId})`);
  next();
});

//Check ever request if it's a POST request
app.use((req, res, next) => {
  if (req.method !== "POST") {
    next();
  } else {
    const contentType = req.get("Content-Type");
    if (!contentType || !contentType.includes("application/json")) {
      return res.status(400).json({
        error: "Content-Type must be application/json",
        requestId: req.requestId,
      });
    }
  }
  next();
});

// Add security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Add CORS headers
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Parse JSON body
app.use(express.json({ limit: "1mb" }));

// GET Request for dog images (I got this code from AirHub)
// Creates HTML page to show dog images
app.get("/images", (req, res, next) => {
  fs.readdir(imagesDir, (err, files) => {
    if (err) return next(err);

    // filter only image files
    const images = files.filter((f) => /\.(png|jpe?g|gif)$/i.test(f));

    // build a simple HTML string
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>Dog Gallery</title>
        <style>
          body { font-family: sans-serif; }
          .thumb { display: inline-block; margin: 10px; text-align: center; }
          .thumb img { max-width: 200px; display: block; }
        </style>
      </head>
      <body>
        <h1>Adoptable Dogs</h1>
        ${images
          .map(
            (file) => `
            <div class="thumb">
              <img src="/images/${file}" alt="${file}" />
              <div>${file}</div>
            </div>`,
          )
          .join("")}
      </body>
      </html>
    `;

    // send the HTML
    res.send(html);
    
  });
});

// For static image URLs
app.use("/images", express.static(imagesDir));

// Mount Routes
app.use("/", dogsRouter); // Do not remove this line

// 404 Handler for unmatched paths
app.use((req, res) => {
  res.status(404).json({ error: "Route not found", requestId: req.requestId });
});

//Error Handlers
app.use((err, req, res, next) => {
  // Determine the status code from the error
  const statusCode = err.statusCode || 500;

  // Log based on error type
  if (statusCode >= 400 && statusCode < 500) {
    // 4xx errors: client errors (use console.warn)
    // This includes ValidationError (400), UnauthorizedError (401), NotFoundError (404)
    console.warn(`WARN: ${err.name}: ${err.message}`);
  }

  // Send error response
  res.status(statusCode).json({
    error: statusCode >= 500 ? "Internal Server Error" : err.message,
    requestId: req.requestId,
  });
  next();
});

const server = app.listen(3000, () =>
  console.log("Server listening on port 3000, http://localhost:3000/"),
);

module.exports = server;

import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dns from "dns";

// Fix Node.js 17+ SRV lookup issue on Windows with Google DNS
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
  dns.setDefaultResultOrder("ipv4first");
} catch (e) {
  console.log("DNS config warning:", e);
}


import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import keyRoutes from "./routes/key.route.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT || 5001;

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/keys", keyRoutes);

// Health check route
app.get("/", (req, res) => {
  res.send("ChitChat Backend is Live 🚀");
});

// Set __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend (Vite/React build) statically if production or built
const frontendDistPath = path.join(__dirname, "../../frontend/dist");
app.use(express.static(frontendDistPath));

// Fallback for React Router single-page app (only for non-API routes)
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(frontendDistPath, "index.html"), (err) => {
    if (err) {
      res.status(404).send("Frontend build not found or running in dev mode.");
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log("server is running on PORT: " + PORT);
  connectDB();
});


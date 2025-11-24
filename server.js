import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ✅ API FIRST + PROTECT FROM FRONTEND OVERRIDE
app.get("/api/data", (req, res) => {
  return res.json({ status: "success" });
});

// ✅ MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

const clientPath = path.join(__dirname, "client");
app.use(express.static(clientPath));

// ✅ IMPORTANT FIX
app.get("/api/*", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

// ✅ Serve frontend LAST
app.get("*", (req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🔥 Server running on ${PORT}`));

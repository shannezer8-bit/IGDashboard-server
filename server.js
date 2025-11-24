import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

<<<<<<< HEAD
// ✅ Fix dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

=======
>>>>>>> f664bb6 (clean install and add dependencies)
const app = express();
app.use(cors());
app.use(express.json());

<<<<<<< HEAD
// ✅ Serve client UI (Render + Local)
const clientPath = path.join(__dirname, "client");
app.use(express.static(clientPath));

// ✅ Serve UI for browser
app.get("/", (req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
=======
// ✅ Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ MongoDB Connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// ✅ Serve Client Files
app.use(express.static(path.join(__dirname, "client")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "index.html"));
>>>>>>> f664bb6 (clean install and add dependencies)
});

// ✅ Example API route
app.get("/api/data", async (req, res) => {
  try {
    res.json({ status: "success", data: "Dashboard Data Loaded ✅" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

<<<<<<< HEAD
// ✅ Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🔥 API running on port ${PORT}`));
=======
// ✅ PORT for Render / Local
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🔥 API + Dashboard running on port ${PORT}`);
});
>>>>>>> f664bb6 (clean install and add dependencies)

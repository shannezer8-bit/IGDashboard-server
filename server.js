import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Serve client files
app.use(express.static(path.join(__dirname, "../client")));

// ✅ Root serves dashboard UI
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

// ✅ API
app.get("/api/data", (req, res) => {
  res.json({ status: "success", data: "Your dashboard data here" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 API running on port ${PORT}`));

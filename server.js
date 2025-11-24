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

// ✅ Serve client folder correctly on Render
const clientPath = path.join(__dirname, "client");
app.use(express.static(clientPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});

// ✅ API
app.get("/api/data", (req, res) => {
  res.json({ status: "success" });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🔥 API running on port ${PORT}`));

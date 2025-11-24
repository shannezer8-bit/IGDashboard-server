import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import User from "./models/User.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MongoDB Connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));


// ✅ LOGIN API
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, password });

  if (!user) return res.json({ success: false });

  res.json({
    success: true,
    followers: user.followers,
    engagement: user.engagement,
    saves: user.saves
  });
});


// ✅ Serve Client UI
const clientPath = path.join(__dirname, "client");
app.use(express.static(clientPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});


// ✅ Server Start
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🔥 Server running on ${PORT}`));

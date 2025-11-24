import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Render / Vercel / Local PORT handling
const PORT = process.env.PORT || 3000;

// ✅ TEST API ROUTE
app.get("/", (req, res) => {
  res.json({ message: "✅ Server is running successfully!" });
});

// ✅ Example API route (modify for your dashboard)
app.get("/api/data", async (req, res) => {
  try {
    res.json({ status: "success", data: "Your dashboard data here" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ START SERVER
app.listen(PORT, () => {
  console.log(`🔥 API running on port ${PORT}`);
});

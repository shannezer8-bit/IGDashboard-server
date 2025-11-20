import express from "express";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

// 🚀 FIX: Remove ngrok browser-warning
app.use((req, res, next) => {
  res.setHeader("ngrok-skip-browser-warning", "true");
  next();
});

// ------------------------------
// 🔥 WEBHOOK VERIFICATION
// ------------------------------
app.get("/auth/instagram/callback", (req, res) => {
  console.log("📥 Webhook Verification Request Received");

  const VERIFY_TOKEN = "ejswebhook123";

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✔️ Webhook verified successfully!");
    res.status(200).send(challenge); 
  } else {
    console.log("❌ Webhook verification FAILED");
    res.sendStatus(403);
  }
});

// ------------------------------
// 🔥 RECEIVE REAL-TIME UPDATES
// ------------------------------
app.post("/auth/instagram/callback", (req, res) => {
  console.log("📥 IG Event Received:", JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

app.listen(5000, () =>
  console.log("Backend running on http://localhost:5000")
);

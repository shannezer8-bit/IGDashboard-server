import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// Fix ngrok warning
app.use((req, res, next) => {
  res.setHeader("ngrok-skip-browser-warning", "true");
  next();
});

// ------------------------------
// INSTAGRAM WEBHOOK VERIFICATION
// ------------------------------
app.get("/auth/instagram/callback", (req, res) => {
  const VERIFY_TOKEN = "ejswebhook123";

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✔ Webhook Verified Successfully!");
    return res.status(200).send(challenge);
  }

  console.log("❌ Webhook verification failed");
  res.sendStatus(403);
});

// ------------------------------
// RECEIVE INSTAGRAM EVENTS
// ------------------------------
app.post("/auth/instagram/callback", (req, res) => {
  console.log("📥 IG Event Received:", JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

// ------------------------------
// PORT FIX FOR RENDER.COM
// ------------------------------
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});

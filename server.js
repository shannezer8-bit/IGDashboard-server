// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import fetch from "node-fetch";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 3000;

// --- Mongo user model ---
const { Schema } = mongoose;
const userSchema = new Schema({
  instagram_user_id: { type: String, required: true, unique: true },
  access_token: { type: String, required: true },
  username: String,
  createdAt: { type: Date, default: Date.now },
});
const User = mongoose.model("User", userSchema);

// --- Connect to MongoDB ---
async function connectDB() {
  if (!process.env.MONGODB_URI) {
    console.warn("MONGODB_URI not set. Multi-user login won't work without DB.");
    return;
  }
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("✅ MongoDB connected");
}
connectDB().catch(err => console.error("Mongo connect error:", err));

// --- Helper: sign JWT ---
function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || "dev_jwt_secret", { expiresIn: "7d" });
}

// --- Instagram OAuth start ---
app.get("/auth/instagram", (req, res) => {
  const redirect = encodeURIComponent(process.env.CALLBACK_URL);
  const url = `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${redirect}&scope=user_profile,user_media&response_type=code`;
  res.redirect(url);
});

// --- OAuth callback: exchange code -> long-lived token, save user, issue JWT and redirect to frontend ---
app.get("/auth/instagram/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing code");

  try {
    // exchange code for short-lived token
    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.INSTAGRAM_CLIENT_ID,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
        grant_type: "authorization_code",
        redirect_uri: process.env.CALLBACK_URL,
        code,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return res.status(500).send({ error: "No access token returned", tokenData });

    // tokenData contains access_token and user_id
    const shortToken = tokenData.access_token;
    const userId = tokenData.user_id;

    // Optionally convert to long-lived token (if needed) -- skip for now or implement:
    // exchange for long-lived token:
    const longRes = await fetch(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_CLIENT_SECRET}&access_token=${shortToken}`);
    const longData = await longRes.json();
    const accessToken = longData.access_token || shortToken;

    // fetch basic user profile to store username
    const profileRes = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`);
    const profile = await profileRes.json();

    // upsert user in DB
    let user;
    if (process.env.MONGODB_URI) {
      user = await User.findOneAndUpdate(
        { instagram_user_id: userId },
        { instagram_user_id: userId, access_token: accessToken, username: profile?.username || "" },
        { upsert: true, new: true }
      );
    } else {
      // no DB -> create ephemeral user object (not persisted)
      user = { instagram_user_id: userId, access_token: accessToken, username: profile?.username || "" };
    }

    // issue JWT for our app (contains instagram_user_id)
    const token = signToken({ instagram_user_id: user.instagram_user_id });

    // redirect to frontend with JWT (avoid exposing access_token in URL)
    const redirectTo = `${process.env.FRONTEND_URL || "/"}?token=${token}`;
    res.redirect(redirectTo);

  } catch (err) {
    console.error("OAuth callback error:", err);
    res.status(500).send("OAuth error");
  }
});

// --- Auth middleware (checks JWT in Authorization header or cookie) ---
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  let token = null;
  if (authHeader.startsWith("Bearer ")) token = authHeader.slice(7);
  if (!token && req.cookies?.token) token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_jwt_secret");
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// --- Protected dashboard endpoint: fetch user's IG data using saved access_token ---
app.get("/api/dashboard", authMiddleware, async (req, res) => {
  try {
    const igId = req.user.instagram_user_id;
    if (!igId) return res.status(400).json({ error: "No instagram id in token" });

    // find access token from DB
    let userDoc = null;
    if (process.env.MONGODB_URI) {
      userDoc = await User.findOne({ instagram_user_id: igId });
      if (!userDoc) return res.status(404).json({ error: "User not found" });
    } else {
      return res.status(500).json({ error: "Server not configured with DB" });
    }

    const accessToken = userDoc.access_token;
    // example: fetch basic media list + user profile
    const profileRes = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type&access_token=${accessToken}`);
    const profile = await profileRes.json();

    // fetch media (first 10)
    const mediaRes = await fetch(`https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,timestamp&limit=10&access_token=${accessToken}`);
    const media = await mediaRes.json();

    res.json({ status: "success", profile, media });

  } catch (err) {
    console.error("dashboard error:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- small health / test endpoints ---
app.get("/", (req, res) => {
  res.json({ message: "✅ Server is running successfully!" });
});

// --- Serve client static if present (optional) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// If you keep client inside repo root (sibling), adjust path accordingly.
// Here we assume client/ is sibling of server/ (i.e. ../client). If you keep inside server/client, set "client" instead.
const clientPath = path.join(__dirname, "../client");
app.use(express.static(clientPath));
app.get("*", (req, res) => {
  // serve index.html for any other route (SPA)
  res.sendFile(path.join(clientPath, "index.html"));
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`🔥 Dashboard + API running on ${PORT}`);
});

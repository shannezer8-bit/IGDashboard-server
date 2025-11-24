import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Static Hosting
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "client"))); 

// ✅ Home page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

// ✅ Instagram Login Redirect
app.get("/auth/instagram", (req, res) => {
  const redirect = encodeURIComponent(process.env.CALLBACK_URL);

  const url = `https://www.instagram.com/oauth/authorize
    ?client_id=${process.env.INSTAGRAM_CLIENT_ID}
    &redirect_uri=${redirect}
    &response_type=code
    &scope=user_profile,user_media`
    .replace(/\s+/g, "");

  res.redirect(url);
});

// ✅ OAuth Callback
app.get("/auth/instagram/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("❌ Missing code");

  try {
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

    if (tokenData.error_type) {
      return res.send("❌ Token Error: " + JSON.stringify(tokenData));
    }

    const accessToken = tokenData.access_token;
    const userId = tokenData.user_id;

    res.redirect(
      process.env.FRONTEND_URL +
        "/success.html?username=" +
        userId +
        "&access_token=" +
        accessToken
    );

  } catch (err) {
    res.send("❌ Server Error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🔥 Dashboard + API running on " + PORT));
);

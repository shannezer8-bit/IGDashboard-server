import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// =============================
// 1. Instagram OAuth Redirect
// =============================
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

// =============================
// 2. OAuth Callback → get CODE
// =============================
app.get("/auth/instagram/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("❌ Missing code");

  try {
    // =============================
    // 3. Exchange CODE → Access Token
    // =============================
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

    // =============================
    // 4. Fetch User Profile
    // =============================
    const profileRes = await fetch(
      `https://graph.instagram.com/${userId}?fields=id,username,account_type,media_count&access_token=${accessToken}`
    );

    const profile = await profileRes.json();

    // Redirect back to frontend with data
    res.redirect(
      process.env.FRONTEND_URL +
        "/success.html?username=" +
        profile.username +
        "&access_token=" +
        accessToken
    );

  } catch (err) {
    console.log("Error:", err);
    res.send("❌ Server Error");
  }
});

app.listen(process.env.PORT, () =>
  console.log("🔥 Server running on " + process.env.PORT)
);

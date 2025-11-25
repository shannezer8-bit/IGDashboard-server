import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import fetch from "node-fetch";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Fix dirname ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------- DATABASE ---------------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("DB Error:", err));

// ----------------- INSTAGRAM LOGIN ---------------------
app.get("/auth/instagram", (req,res) => {
  const url =
    `https://api.instagram.com/oauth/authorize?client_id=${process.env.IG_CLIENT_ID}` +
    `&redirect_uri=${process.env.IG_REDIRECT_URI}` +
    `&scope=user_profile,user_media` +
    `&response_type=code`;

  res.redirect(url);
});

app.get("/auth/instagram/callback", async (req,res)=>{
  const code = req.query.code;
  if (!code) return res.send("Missing code");

  try {
    const tokenRes = await fetch(`https://api.instagram.com/oauth/access_token`, {
      method: "POST",
      body: new URLSearchParams({
        client_id: process.env.IG_CLIENT_ID,
        client_secret: process.env.IG_CLIENT_SECRET,
        grant_type: "authorization_code",
        redirect_uri: process.env.IG_REDIRECT_URI,
        code
      })
    });

    const tokenData = await tokenRes.json();

    const jwtToken = jwt.sign(
      { access_token: tokenData.access_token },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.redirect(`/?token=${jwtToken}`);

  } catch (err) {
    console.log(err);
    res.send("Login error");
  }
});

// ----------------- DASHBOARD API ---------------------
app.get("/api/dashboard", async (req,res)=> {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error:"Missing token" });

  const token = auth.replace("Bearer ","");

  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    return res.json({
      success: true,
      message: "Dashboard data works!",
      instagram_token: data.access_token
    });
  } catch (e) {
    return res.status(401).json({ error:"Invalid token" });
  }
});

// ----------------- SERVE CLIENT ---------------------
app.use(express.static(path.join(__dirname, "client")));

app.get("*", (req,res)=> {
  res.sendFile(path.join(__dirname, "client", "index.html"));
});

// ----------------- SERVER START ---------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 IG Dashboard running on ${PORT}`));

import { Router } from "express";

const router = Router();

const FB_APP_ID = process.env.FACEBOOK_APP_ID || "";
const FB_APP_SECRET = process.env.FACEBOOK_APP_SECRET || "";
const IG_APP_ID = process.env.INSTAGRAM_APP_ID || "";
const IG_APP_SECRET = process.env.INSTAGRAM_APP_SECRET || "";
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

/**
 * FACEBOOK CONNECT
 */
router.get("/facebook", (req, res) => {
  if (!FB_APP_ID) {
    return res.status(400).json({ error: "Facebook App ID not configured" });
  }
  const redirectUrl =
    `https://www.facebook.com/v18.0/dialog/oauth` +
    `?client_id=${FB_APP_ID}` +
    `&redirect_uri=${BASE_URL}/api/auth/facebook/callback` +
    `&scope=pages_manage_posts,pages_read_engagement`;
  res.redirect(redirectUrl);
});

router.get("/facebook/callback", async (req, res) => {
  const code = req.query.code as string;
  if (!code) return res.status(400).send("No code received from Facebook");

  try {
    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token` +
      `?client_id=${FB_APP_ID}` +
      `&redirect_uri=${BASE_URL}/api/auth/facebook/callback` +
      `&client_secret=${FB_APP_SECRET}` +
      `&code=${code}`
    );
    const tokenData = await tokenRes.json() as { access_token?: string };
    (req.session as any).facebook = {
      connected: true,
      token: tokenData.access_token || "",
    };
    res.send(`<script>window.close();</script><p>Facebook Connected! You can close this window.</p>`);
  } catch (err) {
    req.log.error({ err }, "Facebook OAuth failed");
    res.status(500).send("Facebook connection failed");
  }
});

/**
 * INSTAGRAM (Graph API via Facebook)
 */
router.get("/instagram", (req, res) => {
  if (!IG_APP_ID) {
    return res.status(400).json({ error: "Instagram App ID not configured" });
  }
  res.redirect(
    `https://api.instagram.com/oauth/authorize` +
    `?client_id=${IG_APP_ID}` +
    `&redirect_uri=${BASE_URL}/api/auth/instagram/callback` +
    `&scope=user_profile,user_media` +
    `&response_type=code`
  );
});

router.get("/instagram/callback", async (req, res) => {
  const code = req.query.code as string;
  if (!code) return res.status(400).send("No code received from Instagram");

  try {
    const body = new URLSearchParams({
      client_id: IG_APP_ID,
      client_secret: IG_APP_SECRET,
      grant_type: "authorization_code",
      redirect_uri: `${BASE_URL}/api/auth/instagram/callback`,
      code,
    });
    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      body,
    });
    const tokenData = await tokenRes.json() as { access_token?: string };
    (req.session as any).instagram = {
      connected: true,
      token: tokenData.access_token || "",
    };
    res.send(`<script>window.close();</script><p>Instagram Connected! You can close this window.</p>`);
  } catch (err) {
    req.log.error({ err }, "Instagram OAuth failed");
    res.status(500).send("Instagram connection failed");
  }
});

/**
 * Status — which platforms are connected in this session
 */
router.get("/status", (req, res) => {
  const session = req.session as any;
  res.json({
    facebook: !!(session.facebook?.connected),
    instagram: !!(session.instagram?.connected),
    telegram: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    youtube: !!(process.env.YOUTUBE_API_KEY),
  });
});

/**
 * Disconnect a platform
 */
router.post("/disconnect/:platform", (req, res) => {
  const session = req.session as any;
  const { platform } = req.params;
  if (session[platform]) {
    delete session[platform];
  }
  res.json({ success: true, message: `${platform} disconnected` });
});

export default router;

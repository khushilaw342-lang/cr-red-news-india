import { Router } from "express";
import multer from "multer";
import fs from "fs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();
const upload = multer({ dest: "uploads/" });

async function postToFacebook(token: string, caption: string, mediaUrl?: string) {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  if (!pageId) throw new Error("FACEBOOK_PAGE_ID env variable set karein");
  const params: Record<string, string> = { message: caption, access_token: token };
  if (mediaUrl) params.link = mediaUrl;
  const res = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params),
  });
  const data = await res.json() as { id?: string; error?: { message: string } };
  if (data.error) throw new Error(data.error.message);
  return { platform: "facebook", id: data.id };
}

async function postToInstagram(token: string, caption: string, imageUrl?: string) {
  const igUserId = process.env.INSTAGRAM_BUSINESS_USER_ID;
  if (!igUserId) throw new Error("INSTAGRAM_BUSINESS_USER_ID env variable set karein");
  if (!imageUrl) throw new Error("Instagram ke liye image URL required hai");
  const containerRes = await fetch(`https://graph.facebook.com/v18.0/${igUserId}/media`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: token }),
  });
  const container = await containerRes.json() as { id?: string; error?: { message: string } };
  if (container.error) throw new Error(container.error.message);
  const publishRes = await fetch(`https://graph.facebook.com/v18.0/${igUserId}/media_publish`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: container.id, access_token: token }),
  });
  const data = await publishRes.json() as { id?: string; error?: { message: string } };
  if (data.error) throw new Error(data.error.message);
  return { platform: "instagram", id: data.id };
}

async function postToTelegram(botToken: string, chatId: string, caption: string, mediaUrl?: string) {
  const text = mediaUrl ? `${caption}\n\n${mediaUrl}` : caption;
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
  const data = await res.json() as { ok: boolean; description?: string };
  if (!data.ok) throw new Error(data.description || "Telegram send failed");
  return { platform: "telegram" };
}

// POST /api/publish
router.post("/", upload.single("media"), async (req, res) => {
  const userId = (req.session as any).userId;
  const body = req.body;
  const caption: string = body.caption || "";
  const mediaUrl: string | undefined = body.mediaUrl;
  const file = req.file;

  if (!caption.trim()) {
    return res.status(400).json({ success: false, error: "Caption required hai" });
  }

  let user: typeof usersTable.$inferSelect | undefined;
  if (userId) {
    const found = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    user = found[0];
  }

  // Platforms from request body OR from user's saved selectedPlatforms
  const bodyPlatforms = typeof body.platforms === "string" ? JSON.parse(body.platforms) : (body.platforms || {});
  const platforms = Object.keys(bodyPlatforms).length > 0 ? bodyPlatforms : (user?.selectedPlatforms || {});

  const results: Record<string, unknown> = {};
  const errors: Record<string, string> = {};
  const tasks: Promise<void>[] = [];

  if (platforms.facebook) {
    const token = user?.facebookToken || (req.session as any).facebook?.token;
    if (!token) errors.facebook = "Facebook connected nahi hai — pehle connect karein";
    else tasks.push(postToFacebook(token, caption, mediaUrl).then(r => { results.facebook = r; }).catch((e: Error) => { errors.facebook = e.message; }));
  }

  if (platforms.instagram) {
    const token = user?.instagramToken || (req.session as any).instagram?.token;
    if (!token) errors.instagram = "Instagram connected nahi hai — pehle connect karein";
    else tasks.push(postToInstagram(token, caption, mediaUrl).then(r => { results.instagram = r; }).catch((e: Error) => { errors.instagram = e.message; }));
  }

  if (platforms.telegram) {
    const botToken = user?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = user?.telegramChatId || process.env.TELEGRAM_CHAT_ID;
    if (!botToken || !chatId) errors.telegram = "Telegram bot token aur chat ID set karein";
    else tasks.push(postToTelegram(botToken, chatId, caption, mediaUrl).then(r => { results.telegram = r; }).catch((e: Error) => { errors.telegram = e.message; }));
  }

  if (platforms.youtube) {
    results.youtube = { platform: "youtube", note: "YouTube posting ke liye YouTube Studio use karein" };
  }

  if (platforms.twitter) {
    results.twitter = { platform: "twitter", note: "Twitter/X API v2 keys developer.twitter.com se lein" };
  }

  await Promise.all(tasks);
  if (file?.path) { try { fs.unlinkSync(file.path); } catch {} }

  req.log.info({ results, errors }, "Social publish done");

  res.json({
    success: true,
    message: "Published Successfully",
    caption,
    result: [...Object.values(results).map((r: any) => `Posted on ${r.platform || "platform"}`),
             ...Object.entries(errors).map(([p, e]) => `${p}: ${e}`)],
    results,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  });
});

export default router;

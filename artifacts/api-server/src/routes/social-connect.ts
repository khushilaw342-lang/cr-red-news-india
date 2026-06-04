import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function requireLogin(req: any, res: any, next: any) {
  if (!(req.session as any).userId) return res.status(401).json({ error: "Pehle login karein" });
  next();
}

// GET /api/connect/status
router.get("/status", async (req, res) => {
  const userId = (req.session as any).userId;
  if (!userId) {
    return res.json({
      loggedIn: false,
      facebook:  false,
      instagram: false,
      youtube:   false,
      twitter:   false,
      telegram:  false,
    });
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) return res.json({ loggedIn: false });

  res.json({
    loggedIn: true,
    facebook:  !!user.facebookToken,
    instagram: !!user.instagramToken,
    youtube:   !!user.youtubeToken,
    twitter:   !!user.twitterToken,
    telegram:  !!(user.telegramBotToken && user.telegramChatId),
    selectedPlatforms: user.selectedPlatforms,
  });
});

// Facebook connect — save token to DB
router.get("/facebook", requireLogin, async (req, res) => {
  const userId = (req.session as any).userId;
  await db.update(usersTable).set({ facebookToken: "FACEBOOK_ACCESS_TOKEN" }).where(eq(usersTable.id, userId));
  res.send("<script>window.close();</script><p>Facebook Connected!</p>");
});

// Instagram connect
router.get("/instagram", requireLogin, async (req, res) => {
  const userId = (req.session as any).userId;
  await db.update(usersTable).set({ instagramToken: "INSTAGRAM_ACCESS_TOKEN" }).where(eq(usersTable.id, userId));
  res.send("<script>window.close();</script><p>Instagram Connected!</p>");
});

// YouTube connect
router.get("/youtube", requireLogin, async (req, res) => {
  const userId = (req.session as any).userId;
  await db.update(usersTable).set({ youtubeToken: "YOUTUBE_ACCESS_TOKEN" }).where(eq(usersTable.id, userId));
  res.send("<script>window.close();</script><p>YouTube Connected!</p>");
});

// Telegram — save bot token + chat ID
router.post("/telegram", requireLogin, async (req, res) => {
  const userId = (req.session as any).userId;
  const { botToken, chatId } = req.body;
  if (!botToken || !chatId) return res.status(400).json({ error: "botToken aur chatId required hai" });
  await db.update(usersTable).set({ telegramBotToken: botToken, telegramChatId: chatId }).where(eq(usersTable.id, userId));
  res.json({ success: true, message: "Telegram connected" });
});

// Save any token manually
router.post("/token", requireLogin, async (req, res) => {
  const userId = (req.session as any).userId;
  const { platform, token } = req.body;
  const map: Record<string, keyof typeof usersTable.$inferInsert> = {
    facebook: "facebookToken", instagram: "instagramToken",
    youtube: "youtubeToken", twitter: "twitterToken",
  };
  if (!map[platform]) return res.status(400).json({ error: "Unknown platform" });
  if (!token) return res.status(400).json({ error: "token required" });

  await db.update(usersTable).set({ [map[platform]]: token } as any).where(eq(usersTable.id, userId));
  res.json({ success: true, message: `${platform} token saved` });
});

// Disconnect a platform
router.post("/disconnect", requireLogin, async (req, res) => {
  const userId = (req.session as any).userId;
  const { platform } = req.body;
  const map: Record<string, any> = {
    facebook: { facebookToken: null }, instagram: { instagramToken: null },
    youtube: { youtubeToken: null }, twitter: { twitterToken: null },
    telegram: { telegramBotToken: null, telegramChatId: null },
  };
  if (!map[platform]) return res.status(400).json({ error: "Unknown platform" });
  await db.update(usersTable).set(map[platform]).where(eq(usersTable.id, userId));
  res.json({ success: true, message: `${platform} disconnected` });
});

export default router;

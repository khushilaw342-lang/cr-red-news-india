import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email aur password required hai" });

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) return res.status(400).json({ error: "Yeh email pehle se registered hai" });

    const hashed = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({ email, password: hashed }).returning();

    (req.session as any).userId = user.id;
    res.status(201).json({ success: true, message: "Registration successful", userId: user.id, email: user.email });
  } catch (err) {
    req.log.error({ err }, "Register failed");
    res.status(500).json({ error: "Registration failed" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email aur password required hai" });

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) return res.status(401).json({ error: "Invalid Login — email ya password galat hai" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid Login — email ya password galat hai" });

    (req.session as any).userId = user.id;
    res.json({ success: true, message: "Login successful", userId: user.id, email: user.email });
  } catch (err) {
    req.log.error({ err }, "Login failed");
    res.status(500).json({ error: "Login failed" });
  }
});

// LOGOUT
router.post("/logout", (req, res) => {
  req.session.destroy(() => {});
  res.json({ success: true, message: "Logged out" });
});

// ME — current logged-in user info
router.get("/me", async (req, res) => {
  const userId = (req.session as any).userId;
  if (!userId) return res.status(401).json({ error: "Not logged in" });

  const [user] = await db.select({
    id: usersTable.id,
    email: usersTable.email,
    selectedPlatforms: usersTable.selectedPlatforms,
    facebookToken: usersTable.facebookToken,
    instagramToken: usersTable.instagramToken,
    youtubeToken: usersTable.youtubeToken,
    twitterToken: usersTable.twitterToken,
    telegramBotToken: usersTable.telegramBotToken,
    telegramChatId: usersTable.telegramChatId,
  }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (!user) return res.status(401).json({ error: "User not found" });
  res.json(user);
});

// UPDATE selected platforms
router.post("/platforms", async (req, res) => {
  const userId = (req.session as any).userId;
  if (!userId) return res.status(401).json({ error: "Not logged in" });

  const { selectedPlatforms } = req.body;
  const [updated] = await db
    .update(usersTable)
    .set({ selectedPlatforms })
    .where(eq(usersTable.id, userId))
    .returning();

  res.json({ success: true, selectedPlatforms: updated.selectedPlatforms });
});

export default router;

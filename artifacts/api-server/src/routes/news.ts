import { Router } from "express";
import { db, newsTable, tickerTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  ListNewsQueryParams,
  CreateNewsBody,
  UpdateNewsBody,
  GetNewsItemParams,
  UpdateNewsParams,
  DeleteNewsParams,
  UpdateTickerBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/news", async (req, res) => {
  try {
    const parsed = ListNewsQueryParams.safeParse(req.query);
    const type = parsed.success ? parsed.data.type : undefined;

    const items = type
      ? await db
          .select()
          .from(newsTable)
          .where(eq(newsTable.type, type as "live" | "youtube" | "video" | "photo"))
          .orderBy(desc(newsTable.createdAt))
      : await db.select().from(newsTable).orderBy(desc(newsTable.createdAt));

    res.json(items);
  } catch (err) {
    req.log.error({ err }, "Failed to list news");
    res.status(500).json({ error: "Failed to list news" });
  }
});

router.get("/news/latest", async (req, res) => {
  try {
    const allNews = await db.select().from(newsTable).orderBy(desc(newsTable.createdAt));

    const latest = {
      live: allNews.filter((n) => n.type === "live").slice(0, 3),
      youtube: allNews.filter((n) => n.type === "youtube").slice(0, 3),
      video: allNews.filter((n) => n.type === "video").slice(0, 3),
      photo: allNews.filter((n) => n.type === "photo").slice(0, 3),
    };

    res.json(latest);
  } catch (err) {
    req.log.error({ err }, "Failed to get latest news");
    res.status(500).json({ error: "Failed to get latest news" });
  }
});

router.get("/news/:id", async (req, res) => {
  try {
    const parsed = GetNewsItemParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

    const [item] = await db.select().from(newsTable).where(eq(newsTable.id, parsed.data.id));
    if (!item) return res.status(404).json({ error: "Not found" });

    res.json(item);
  } catch (err) {
    req.log.error({ err }, "Failed to get news item");
    res.status(500).json({ error: "Failed to get news item" });
  }
});

router.post("/news", async (req, res) => {
  try {
    const parsed = CreateNewsBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

    const { type, title, script, embedUrl, mediaUrl, isLive } = parsed.data;

    const [created] = await db
      .insert(newsTable)
      .values({ type, title, script, embedUrl, mediaUrl, isLive: isLive ?? false })
      .returning();

    res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, "Failed to create news");
    res.status(500).json({ error: "Failed to create news" });
  }
});

router.patch("/news/:id", async (req, res) => {
  try {
    const paramsParsed = UpdateNewsParams.safeParse({ id: Number(req.params.id) });
    if (!paramsParsed.success) return res.status(400).json({ error: "Invalid id" });

    const bodyParsed = UpdateNewsBody.safeParse(req.body);
    if (!bodyParsed.success) return res.status(400).json({ error: bodyParsed.error.message });

    const [updated] = await db
      .update(newsTable)
      .set(bodyParsed.data)
      .where(eq(newsTable.id, paramsParsed.data.id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Not found" });

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update news");
    res.status(500).json({ error: "Failed to update news" });
  }
});

router.delete("/news/:id", async (req, res) => {
  try {
    const parsed = DeleteNewsParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

    await db.delete(newsTable).where(eq(newsTable.id, parsed.data.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete news");
    res.status(500).json({ error: "Failed to delete news" });
  }
});

router.get("/ticker", async (req, res) => {
  try {
    const [ticker] = await db.select().from(tickerTable).limit(1);
    if (!ticker) return res.json({ id: 0, text: "खबर या विज्ञापन प्रकाशित कराने के लिए संपर्क करें | CR RED NEWS INDIA OFFICIAL TV" });
    res.json(ticker);
  } catch (err) {
    req.log.error({ err }, "Failed to get ticker");
    res.status(500).json({ error: "Failed to get ticker" });
  }
});

router.put("/ticker", async (req, res) => {
  try {
    const parsed = UpdateTickerBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

    const existing = await db.select().from(tickerTable).limit(1);
    let result;
    if (existing.length > 0) {
      [result] = await db
        .update(tickerTable)
        .set({ text: parsed.data.text })
        .where(eq(tickerTable.id, existing[0].id))
        .returning();
    } else {
      [result] = await db.insert(tickerTable).values({ text: parsed.data.text }).returning();
    }
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to update ticker");
    res.status(500).json({ error: "Failed to update ticker" });
  }
});

export default router;

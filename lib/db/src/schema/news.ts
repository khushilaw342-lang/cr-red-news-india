import { pgTable, text, serial, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const newsTypeEnum = pgEnum("news_type", ["live", "youtube", "video", "photo"]);

export const newsTable = pgTable("news", {
  id: serial("id").primaryKey(),
  type: newsTypeEnum("type").notNull(),
  title: text("title").notNull(),
  script: text("script"),
  embedUrl: text("embed_url"),
  mediaUrl: text("media_url"),
  isLive: boolean("is_live").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tickerTable = pgTable("ticker", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
});

export const insertNewsSchema = createInsertSchema(newsTable).omit({ id: true, createdAt: true });
export const updateNewsSchema = insertNewsSchema.partial();
export const insertTickerSchema = createInsertSchema(tickerTable).omit({ id: true });

export type InsertNews = z.infer<typeof insertNewsSchema>;
export type UpdateNews = z.infer<typeof updateNewsSchema>;
export type NewsItem = typeof newsTable.$inferSelect;
export type Ticker = typeof tickerTable.$inferSelect;

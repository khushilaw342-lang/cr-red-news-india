import { pgTable, text, serial, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),

  facebookToken: text("facebook_token"),
  instagramToken: text("instagram_token"),
  youtubeToken: text("youtube_token"),
  twitterToken: text("twitter_token"),
  telegramBotToken: text("telegram_bot_token"),
  telegramChatId: text("telegram_chat_id"),

  selectedPlatforms: jsonb("selected_platforms").$type<{
    facebook: boolean;
    instagram: boolean;
    youtube: boolean;
    twitter: boolean;
    telegram: boolean;
  }>().default({ facebook: false, instagram: false, youtube: false, twitter: false, telegram: false }),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });

export type User = typeof usersTable.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

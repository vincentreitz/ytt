import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const channelsTable = pgTable("channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  youtubeChannelId: text("youtube_channel_id").notNull().unique(),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChannelSchema = createInsertSchema(channelsTable).omit({ id: true, createdAt: true });
export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type Channel = typeof channelsTable.$inferSelect;

import { pgTable, serial, integer, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { channelsTable } from "./channels";

export const videoStatusEnum = pgEnum("video_status", ["pending", "watched", "skipped"]);

export const videosTable = pgTable("videos", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").notNull().references(() => channelsTable.id, { onDelete: "cascade" }),
  youtubeVideoId: text("youtube_video_id").notNull().unique(),
  title: text("title").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  durationSeconds: integer("duration_seconds").notNull(),
  status: videoStatusEnum("status").notNull().default("pending"),
  publishedAt: timestamp("published_at").notNull(),
  watchedAt: timestamp("watched_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVideoSchema = createInsertSchema(videosTable).omit({ id: true, createdAt: true, watchedAt: true });
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videosTable.$inferSelect;

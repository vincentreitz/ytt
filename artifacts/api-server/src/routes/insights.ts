import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { videosTable, channelsTable } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/insights", async (req, res) => {
  if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  try {
    const userId = req.session.userId;
    const rows = await db
      .select({
        channelId: channelsTable.id,
        channelName: channelsTable.name,
        thumbnailUrl: channelsTable.thumbnailUrl,
        totalVideos: sql<number>`count("videos"."id")::int`,
        watchedVideos: sql<number>`count("videos"."id") filter (where "videos"."status" = 'watched')::int`,
        skippedVideos: sql<number>`count("videos"."id") filter (where "videos"."status" = 'skipped')::int`,
        pendingVideos: sql<number>`count("videos"."id") filter (where "videos"."status" = 'pending')::int`,
        totalWatchedSeconds: sql<number>`coalesce(sum("videos"."duration_seconds") filter (where "videos"."status" = 'watched'), 0)::int`,
        avgDaysToWatch: sql<number | null>`avg(extract(epoch from ("videos"."watched_at" - "videos"."published_at")) / 86400) filter (where "videos"."status" = 'watched')`,
      })
      .from(channelsTable)
      .leftJoin(videosTable, eq(videosTable.channelId, channelsTable.id))
      .where(eq(channelsTable.userId, userId))
      .groupBy(channelsTable.id)
      .orderBy(sql`count("videos"."id") filter (where "videos"."status" = 'watched') desc`);

    const channels = rows.map(r => ({
      ...r,
      watchRatio: r.totalVideos > 0 ? r.watchedVideos / r.totalVideos : 0,
      avgDaysToWatch: r.avgDaysToWatch != null ? Number(Number(r.avgDaysToWatch).toFixed(1)) : null,
      recommendUnsubscribe: r.totalVideos >= 5 && (r.watchedVideos / r.totalVideos) < 0.3,
    }));

    const topChannels = [...channels]
      .sort((a, b) => b.totalWatchedSeconds - a.totalWatchedSeconds)
      .slice(0, 5);

    const unsubscribeRecommendations = channels.filter(c => c.recommendUnsubscribe);

    res.json({ channels, topChannels, unsubscribeRecommendations });
  } catch (err) {
    logger.error({ err }, "Failed to get insights");
    res.status(500).json({ error: "Failed to get insights" });
  }
});

export default router;

import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { videosTable, channelsTable } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { GetDailyStatsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stats/daily", async (req, res) => {
  if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  try {
    const query = GetDailyStatsQueryParams.parse(req.query);
    const days = query.days ?? 30;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const userId = req.session.userId;

    const dailyRows = await db
      .select({
        date: sql<string>`date_trunc('day', ${videosTable.watchedAt})::date::text`,
        watchedSeconds: sql<number>`sum(${videosTable.durationSeconds})::int`,
        watchedCount: sql<number>`count(*)::int`,
      })
      .from(videosTable)
      .innerJoin(channelsTable, eq(videosTable.channelId, channelsTable.id))
      .where(
        and(
          eq(channelsTable.userId, userId),
          sql`${videosTable.status} = 'watched' and ${videosTable.watchedAt} >= ${since}`
        )
      )
      .groupBy(sql`date_trunc('day', ${videosTable.watchedAt})::date`)
      .orderBy(sql`date_trunc('day', ${videosTable.watchedAt})::date`);

    const skippedByDay = await db
      .select({
        date: sql<string>`date_trunc('day', ${videosTable.watchedAt})::date::text`,
        skippedCount: sql<number>`count(*)::int`,
      })
      .from(videosTable)
      .innerJoin(channelsTable, eq(videosTable.channelId, channelsTable.id))
      .where(
        and(
          eq(channelsTable.userId, userId),
          sql`${videosTable.status} = 'skipped' and ${videosTable.watchedAt} >= ${since}`
        )
      )
      .groupBy(sql`date_trunc('day', ${videosTable.watchedAt})::date`)
      .orderBy(sql`date_trunc('day', ${videosTable.watchedAt})::date`);

    const skippedMap = new Map(skippedByDay.map(r => [r.date, r.skippedCount]));
    const dayStats = dailyRows.map(r => ({
      date: r.date,
      watchedSeconds: r.watchedSeconds,
      watchedCount: r.watchedCount,
      skippedCount: skippedMap.get(r.date) ?? 0,
    }));

    const [pendingAgg] = await db
      .select({
        totalPendingSeconds: sql<number>`sum(${videosTable.durationSeconds})::int`,
        totalPendingCount: sql<number>`count(*)::int`,
      })
      .from(videosTable)
      .innerJoin(channelsTable, eq(videosTable.channelId, channelsTable.id))
      .where(and(eq(channelsTable.userId, userId), eq(videosTable.status, "pending")));

    const totalWatchedSeconds = dayStats.reduce((s, d) => s + d.watchedSeconds, 0);
    const avgDailyWatchSeconds = dayStats.length > 0
      ? Math.round(totalWatchedSeconds / dayStats.length)
      : 0;

    res.json({
      days: dayStats,
      totalPendingSeconds: pendingAgg?.totalPendingSeconds ?? 0,
      totalPendingCount: pendingAgg?.totalPendingCount ?? 0,
      averageDailyWatchSeconds: avgDailyWatchSeconds,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get daily stats" });
  }
});

export default router;

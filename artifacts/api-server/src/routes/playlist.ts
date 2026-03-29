import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { videosTable, channelsTable } from "@workspace/db/schema";
import { eq, sql, and, inArray } from "drizzle-orm";
import { GenerateSmartPlaylistBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/playlist/smart", async (req, res) => {
  try {
    const body = GenerateSmartPlaylistBody.parse(req.body);
    const sessionSeconds = body.sessionMinutes * 60;

    const topChannelRows = await db
      .select({
        channelId: videosTable.channelId,
        totalWatched: sql<number>`count(*) filter (where ${videosTable.status} = 'watched')::int`,
      })
      .from(videosTable)
      .groupBy(videosTable.channelId)
      .orderBy(sql`count(*) filter (where ${videosTable.status} = 'watched') desc`);

    const topChannelIds = topChannelRows.map(r => r.channelId);

    const conditions = [eq(videosTable.status, "pending")];
    if (body.channelIds && body.channelIds.length > 0) {
      conditions.push(inArray(videosTable.channelId, body.channelIds));
    }

    const pendingVideos = await db
      .select({
        id: videosTable.id,
        channelId: videosTable.channelId,
        channelName: channelsTable.name,
        youtubeVideoId: videosTable.youtubeVideoId,
        title: videosTable.title,
        thumbnailUrl: videosTable.thumbnailUrl,
        durationSeconds: videosTable.durationSeconds,
        status: videosTable.status,
        publishedAt: videosTable.publishedAt,
        watchedAt: videosTable.watchedAt,
        createdAt: videosTable.createdAt,
      })
      .from(videosTable)
      .innerJoin(channelsTable, eq(videosTable.channelId, channelsTable.id))
      .where(and(...conditions))
      .orderBy(sql`${videosTable.publishedAt} asc`);

    let sorted = pendingVideos;
    if (body.prioritizeTopChannels !== false && topChannelIds.length > 0) {
      sorted = [...pendingVideos].sort((a, b) => {
        const rankA = topChannelIds.indexOf(a.channelId);
        const rankB = topChannelIds.indexOf(b.channelId);
        const ra = rankA === -1 ? 9999 : rankA;
        const rb = rankB === -1 ? 9999 : rankB;
        return ra - rb;
      });
    }

    const playlist: typeof sorted = [];
    let total = 0;
    for (const video of sorted) {
      if (total + video.durationSeconds <= sessionSeconds) {
        playlist.push(video);
        total += video.durationSeconds;
      }
    }

    res.json({
      videos: playlist,
      totalDurationSeconds: total,
      sessionMinutes: body.sessionMinutes,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate smart playlist" });
  }
});

export default router;

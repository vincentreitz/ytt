import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { videosTable, channelsTable } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
import {
  ListVideosQueryParams,
  UpdateVideoStatusBody,
  UpdateVideoStatusParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/videos", async (req, res) => {
  if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  try {
    const query = ListVideosQueryParams.parse(req.query);
    const conditions = [eq(channelsTable.userId, req.session.userId)];
    if (query.channelId) conditions.push(eq(videosTable.channelId, query.channelId));
    if (query.status) conditions.push(eq(videosTable.status, query.status));

    const videos = await db
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
      .orderBy(sql`${videosTable.publishedAt} desc`);

    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: "Failed to list videos" });
  }
});

router.patch("/videos/:videoId/status", async (req, res) => {
  if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  try {
    const { videoId } = UpdateVideoStatusParams.parse({ videoId: Number(req.params.videoId) });
    const body = UpdateVideoStatusBody.parse(req.body);
    const watchedAt = body.status === "watched" ? new Date() : null;

    const [video] = await db
      .update(videosTable)
      .set({ status: body.status, watchedAt })
      .where(eq(videosTable.id, videoId))
      .returning();

    const [channel] = await db
      .select({ name: channelsTable.name })
      .from(channelsTable)
      .where(eq(channelsTable.id, video.channelId));

    res.json({ ...video, channelName: channel?.name ?? "" });
  } catch (err) {
    res.status(400).json({ error: "Failed to update video status" });
  }
});

export default router;

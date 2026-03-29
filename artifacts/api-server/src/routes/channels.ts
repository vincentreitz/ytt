import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { channelsTable, videosTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { DeleteChannelParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/channels", async (req, res) => {
  if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  try {
    const channels = await db
      .select({
        id: channelsTable.id,
        name: channelsTable.name,
        youtubeChannelId: channelsTable.youtubeChannelId,
        thumbnailUrl: channelsTable.thumbnailUrl,
        createdAt: channelsTable.createdAt,
        videoCount: sql<number>`count(${videosTable.id})::int`,
        pendingCount: sql<number>`count(${videosTable.id}) filter (where ${videosTable.status} = 'pending')::int`,
      })
      .from(channelsTable)
      .leftJoin(videosTable, eq(videosTable.channelId, channelsTable.id))
      .where(eq(channelsTable.userId, req.session.userId))
      .groupBy(channelsTable.id)
      .orderBy(channelsTable.name);
    res.json(channels);
  } catch (err) {
    res.status(500).json({ error: "Failed to list channels" });
  }
});

router.delete("/channels/:channelId", async (req, res) => {
  if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  try {
    const { channelId } = DeleteChannelParams.parse({ channelId: Number(req.params.channelId) });
    await db.delete(channelsTable).where(
      sql`${channelsTable.id} = ${channelId} and ${channelsTable.userId} = ${req.session.userId}`
    );
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete channel" });
  }
});

export default router;

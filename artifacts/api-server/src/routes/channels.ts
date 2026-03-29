import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { channelsTable, videosTable } from "@workspace/db/schema";
import { eq, sql, count } from "drizzle-orm";
import {
  CreateChannelBody,
  DeleteChannelParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/channels", async (_req, res) => {
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
      .groupBy(channelsTable.id)
      .orderBy(channelsTable.name);

    res.json(channels);
  } catch (err) {
    res.status(500).json({ error: "Failed to list channels" });
  }
});

router.post("/channels", async (req, res) => {
  try {
    const body = CreateChannelBody.parse(req.body);
    const [channel] = await db
      .insert(channelsTable)
      .values(body)
      .returning();
    res.status(201).json({ ...channel, videoCount: 0, pendingCount: 0 });
  } catch (err) {
    req.log?.error({ err }, "Failed to create channel");
    res.status(400).json({ error: "Failed to create channel" });
  }
});

router.delete("/channels/:channelId", async (req, res) => {
  try {
    const { channelId } = DeleteChannelParams.parse({ channelId: Number(req.params.channelId) });
    await db.delete(channelsTable).where(eq(channelsTable.id, channelId));
    res.status(204).send();
  } catch (err) {
    req.log?.error({ err }, "Failed to delete channel");
    res.status(500).json({ error: "Failed to delete channel" });
  }
});

export default router;

import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, channelsTable, videosTable } from "@workspace/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getYoutubeClient, parseDuration } from "../lib/youtube";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/sync", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const userId = req.session.userId;

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const yt = await getYoutubeClient(user.accessToken, user.refreshToken);

    // 1. Fetch all subscriptions
    const subscriptions: { channelId: string; title: string; thumbnail: string | null }[] = [];
    let nextPageToken: string | undefined;

    do {
      const subRes = await yt.subscriptions.list({
        part: ["snippet"],
        mine: true,
        maxResults: 50,
        pageToken: nextPageToken,
      });
      for (const item of subRes.data.items ?? []) {
        const channelId = item.snippet?.resourceId?.channelId;
        const title = item.snippet?.title;
        if (channelId && title) {
          subscriptions.push({
            channelId,
            title,
            thumbnail: item.snippet?.thumbnails?.default?.url ?? null,
          });
        }
      }
      nextPageToken = subRes.data.nextPageToken ?? undefined;
    } while (nextPageToken && subscriptions.length < 300);

    logger.info({ count: subscriptions.length }, "Fetched subscriptions");

    // 2. Get uploads playlist IDs for each channel (batch of 50)
    const channelIdToPlaylist: Map<string, string> = new Map();
    for (let i = 0; i < subscriptions.length; i += 50) {
      const batch = subscriptions.slice(i, i + 50);
      const chanRes = await yt.channels.list({
        part: ["contentDetails"],
        id: batch.map(s => s.channelId),
        maxResults: 50,
      });
      for (const item of chanRes.data.items ?? []) {
        const pid = item.contentDetails?.relatedPlaylists?.uploads;
        if (item.id && pid) {
          channelIdToPlaylist.set(item.id, pid);
        }
      }
    }

    // 3. Upsert channels in DB
    for (const sub of subscriptions) {
      await db
        .insert(channelsTable)
        .values({
          userId,
          youtubeChannelId: sub.channelId,
          name: sub.title,
          thumbnailUrl: sub.thumbnail,
          uploadsPlaylistId: channelIdToPlaylist.get(sub.channelId) ?? null,
        })
        .onConflictDoUpdate({
          target: [channelsTable.youtubeChannelId, channelsTable.userId],
          set: {
            name: sub.title,
            thumbnailUrl: sub.thumbnail,
            uploadsPlaylistId: channelIdToPlaylist.get(sub.channelId) ?? null,
          },
        });
    }

    // Fetch DB channels for this user
    const dbChannels = await db
      .select()
      .from(channelsTable)
      .where(eq(channelsTable.userId, userId));

    // 4. Fetch recent videos for each channel
    let totalNewVideos = 0;
    for (const channel of dbChannels) {
      if (!channel.uploadsPlaylistId) continue;

      try {
        const plRes = await yt.playlistItems.list({
          part: ["snippet", "contentDetails"],
          playlistId: channel.uploadsPlaylistId,
          maxResults: 10,
        });

        const items = plRes.data.items ?? [];
        if (items.length === 0) continue;

        const videoIds = items
          .map(i => i.contentDetails?.videoId)
          .filter(Boolean) as string[];

        // Get durations
        const vidRes = await yt.videos.list({
          part: ["contentDetails"],
          id: videoIds,
        });

        const durationMap = new Map<string, number>();
        for (const v of vidRes.data.items ?? []) {
          if (v.id && v.contentDetails?.duration) {
            durationMap.set(v.id, parseDuration(v.contentDetails.duration));
          }
        }

        for (const item of items) {
          const videoId = item.contentDetails?.videoId;
          const title = item.snippet?.title;
          const publishedAt = item.snippet?.publishedAt;
          if (!videoId || !title || !publishedAt) continue;

          const duration = durationMap.get(videoId) ?? 0;
          if (duration < 60) continue; // skip shorts

          const thumbnail =
            item.snippet?.thumbnails?.medium?.url ??
            item.snippet?.thumbnails?.default?.url ??
            null;

          try {
            await db
              .insert(videosTable)
              .values({
                channelId: channel.id,
                youtubeVideoId: videoId,
                title,
                thumbnailUrl: thumbnail,
                durationSeconds: duration,
                status: "pending",
                publishedAt: new Date(publishedAt),
              })
              .onConflictDoNothing();
            totalNewVideos++;
          } catch {
            // skip duplicate videos
          }
        }
      } catch (err) {
        logger.warn({ err, channel: channel.name }, "Failed to fetch videos for channel");
      }
    }

    res.json({
      success: true,
      subscriptions: subscriptions.length,
      newVideos: totalNewVideos,
    });
  } catch (err) {
    logger.error({ err }, "Sync failed");
    res.status(500).json({ error: "Sync failed" });
  }
});

export default router;

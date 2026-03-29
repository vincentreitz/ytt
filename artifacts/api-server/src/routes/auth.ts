import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { getOAuthClient } from "../lib/youtube";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "openid",
  "email",
  "profile",
];

router.get("/auth/google", (_req, res) => {
  const oauth2Client = getOAuthClient();
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
  res.redirect(url);
});

router.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;
  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "Missing code" });
    return;
  }

  try {
    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = (await import("googleapis")).google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: profile } = await oauth2.userinfo.get();

    if (!profile.id || !profile.email || !profile.name) {
      res.status(400).json({ error: "Incomplete profile" });
      return;
    }

    const [user] = await db
      .insert(usersTable)
      .values({
        googleId: profile.id,
        email: profile.email,
        name: profile.name,
        picture: profile.picture ?? null,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token ?? null,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      })
      .onConflictDoUpdate({
        target: usersTable.googleId,
        set: {
          email: profile.email,
          name: profile.name,
          picture: profile.picture ?? null,
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token ?? null,
          tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        },
      })
      .returning();

    req.session.userId = user.id;
    req.session.save(() => {
      const domain = (process.env.REPLIT_DOMAINS ?? "").split(",")[0]?.trim();
      const successUrl = domain ? `https://${domain}/api/auth/success` : "/api/auth/success";
      res.redirect(successUrl);
    });
  } catch (err) {
    logger.error({ err }, "OAuth callback error");
    res.status(500).json({ error: "Authentication failed" });
  }
});

router.get("/auth/success", (_req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head><title>Connecté</title></head>
<body style="font-family:sans-serif;text-align:center;padding:40px;background:#0f0f0f;color:#fff;">
  <p>✅ Connecté avec succès !</p>
  <p style="font-size:13px;color:#aaa;">Cette fenêtre va se fermer automatiquement…</p>
  <script>
    if (window.opener) {
      window.opener.postMessage("auth_complete", "*");
      setTimeout(() => window.close(), 500);
    } else {
      window.location.href = "/";
    }
  </script>
</body>
</html>`);
});

router.get("/auth/me", async (req, res) => {
  if (!req.session.userId) {
    res.json({ user: null });
    return;
  }
  try {
    const [user] = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
        picture: usersTable.picture,
      })
      .from(usersTable)
      .where(eq(usersTable.id, req.session.userId));

    res.json({ user: user ?? null });
  } catch (err) {
    res.json({ user: null });
  }
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

export default router;

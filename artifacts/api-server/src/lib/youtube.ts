import { google } from "googleapis";

export function getOAuthClient() {
  const domain = (process.env.REPLIT_DOMAINS ?? "").split(",")[0]?.trim();
  const redirectUri = domain
    ? `https://${domain}/api/auth/google/callback`
    : "http://localhost:3000/api/auth/google/callback";

  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri,
  );
}

export async function getYoutubeClient(accessToken: string, refreshToken?: string | null) {
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken ?? undefined,
  });
  return google.youtube({ version: "v3", auth: oauth2Client });
}

export function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] ?? "0");
  const m = parseInt(match[2] ?? "0");
  const s = parseInt(match[3] ?? "0");
  return h * 3600 + m * 60 + s;
}

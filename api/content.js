import { isAuthenticated } from "./_auth.js";

const KEY = "retro95:site-content";
const MAX_BODY_SIZE = 200000;

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

async function redis(command) {
  const config = redisConfig();
  if (!config) throw new Error("Storage is not configured");
  const result = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command)
  });
  const payload = await result.json();
  if (!result.ok || payload.error) throw new Error(payload.error || "Storage request failed");
  return payload.result;
}

function cleanText(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

function cleanUrl(value) {
  const url = cleanText(value, 1000);
  if (!url || /^(https?:\/\/|\/)/i.test(url)) return url;
  throw new Error("URLs must begin with https://, http://, or /");
}

function cleanItems(items, type) {
  if (!Array.isArray(items)) return [];
  return items.slice(0, 50).map((item, index) => {
    const common = {
      id: cleanText(item.id || `${type}-${index}`, 80),
      title: cleanText(item.title, 160),
      visible: item.visible !== false
    };
    if (type === "project") return {
      ...common,
      description: cleanText(item.description, 500),
      image: cleanUrl(item.image),
      url: cleanUrl(item.url)
    };
    return {
      ...common,
      artist: cleanText(item.artist, 160),
      cover: cleanUrl(item.cover),
      audio: cleanUrl(item.audio)
    };
  });
}

function validate(input) {
  const profile = input?.profile || {};
  const appearance = input?.appearance || {};
  const socials = Array.isArray(input?.socials) ? input.socials.slice(0, 20) : [];
  return {
    version: 1,
    profile: {
      name: cleanText(profile.name, 120),
      role: cleanText(profile.role, 120),
      email: cleanText(profile.email, 200),
      availability: cleanText(profile.availability, 160),
      bio: cleanText(profile.bio, 1200),
      portrait: cleanUrl(profile.portrait),
      resumeUrl: cleanUrl(profile.resumeUrl)
    },
    appearance: { wallpaper: cleanUrl(appearance.wallpaper) },
    socials: socials.map((item, index) => ({
      id: cleanText(item.id || `social-${index}`, 80),
      label: cleanText(item.label, 100),
      url: cleanUrl(item.url)
    })),
    projects: cleanItems(input?.projects, "project"),
    tracks: cleanItems(input?.tracks, "track")
  };
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  try {
    if (request.method === "GET") {
      if (!redisConfig()) return response.status(200).json({ content: null, configured: false });
      const stored = await redis(["GET", KEY]);
      return response.status(200).json({ content: stored ? JSON.parse(stored) : null, configured: true });
    }
    if (request.method === "PUT") {
      if (!isAuthenticated(request)) return response.status(401).json({ error: "Unauthorized" });
      const raw = JSON.stringify(request.body || {});
      if (raw.length > MAX_BODY_SIZE) return response.status(413).json({ error: "Content is too large" });
      const content = validate(request.body);
      await redis(["SET", KEY, JSON.stringify(content)]);
      return response.status(200).json({ ok: true, content });
    }
    return response.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return response.status(500).json({ error: error.message || "Server error" });
  }
}

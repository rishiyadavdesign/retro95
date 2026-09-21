import { createSessionCookie, passwordMatches } from "./_auth.js";

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed" });
  const password = request.body?.password;
  if (!passwordMatches(password)) return response.status(401).json({ error: "Incorrect password" });
  response.setHeader("Set-Cookie", createSessionCookie());
  return response.status(200).json({ ok: true });
}


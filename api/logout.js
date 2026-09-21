import { clearSessionCookie } from "./_auth.js";

export default function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Set-Cookie", clearSessionCookie());
  return response.status(200).json({ ok: true });
}


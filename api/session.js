import { isAuthenticated } from "./_auth.js";

export default function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  return response.status(200).json({ authenticated: isAuthenticated(request) });
}


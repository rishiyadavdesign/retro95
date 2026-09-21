import crypto from "node:crypto";

const COOKIE_NAME = "retro95_admin";
const MAX_AGE = 60 * 60 * 24 * 7;

function secret() {
  return process.env.ADMIN_SECRET || "";
}

function sign(value) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

function safeEqual(left, right) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function passwordMatches(password) {
  const expected = process.env.ADMIN_PASSWORD || "";
  return Boolean(expected && secret() && safeEqual(String(password), expected));
}

export function createSessionCookie() {
  const expires = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  return `${COOKIE_NAME}=${expires}.${sign(expires)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${MAX_AGE}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export function isAuthenticated(request) {
  if (!secret()) return false;
  const header = request.headers.cookie || "";
  const match = header.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (!match) return false;
  const [expires, signature] = match[1].split(".");
  if (!expires || !signature || Number(expires) < Date.now() / 1000) return false;
  return safeEqual(signature, sign(expires));
}


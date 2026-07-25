// Shared by the route handlers in functions/api/. This file has no
// onRequest* exports, so Cloudflare Pages does not treat it as a route.

const PBKDF2_ITERATIONS = 100000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function bufferToHex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

export function newId() {
  return crypto.randomUUID();
}

export async function hashPassword(password, saltHex) {
  const salt = saltHex ? hexToBuffer(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return { hash: bufferToHex(bits), salt: bufferToHex(salt) };
}

export async function verifyPassword(password, saltHex, expectedHashHex) {
  const { hash } = await hashPassword(password, saltHex);
  if (hash.length !== expectedHashHex.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) {
    diff |= hash.charCodeAt(i) ^ expectedHashHex.charCodeAt(i);
  }
  return diff === 0;
}

export async function createSession(db, userId) {
  const token = bufferToHex(crypto.getRandomValues(new Uint8Array(32)));
  const now = Date.now();
  await db
    .prepare("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .bind(token, userId, now, now + SESSION_TTL_MS)
    .run();
  return { token, expiresAt: now + SESSION_TTL_MS };
}

export async function getUserFromSession(db, token) {
  if (!token) return null;
  const row = await db
    .prepare(
      "SELECT users.id as id, users.email as email, users.parent_id as parentId FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token = ? AND sessions.expires_at > ?"
    )
    .bind(token, Date.now())
    .first();
  return row || null;
}

// A child account's counters ARE the parent's counters — this is the one
// id every counter query/mutation should key off of.
export function ownerIdFor(user) {
  return user.parentId || user.id;
}

export function isChild(user) {
  return Boolean(user.parentId);
}

export async function deleteSession(db, token) {
  if (!token) return;
  await db.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
}

export function parseCookies(request) {
  const header = request.headers.get("Cookie") || "";
  const cookies = {};
  header.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx === -1) return;
    cookies[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  });
  return cookies;
}

// Same-origin (Pages Functions serve the API from the exact same domain
// as the static site), so SameSite=Lax is enough — no cross-site cookie
// sending is needed the way a separately-hosted Worker API would need.
export function sessionCookie(token, maxAgeSeconds) {
  return `session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export function clearedSessionCookie() {
  return "session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
}

export async function requireUser(request, env) {
  const cookies = parseCookies(request);
  return getUserFromSession(env.DB, cookies.session);
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function jsonWithCookie(data, status, cookie) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Set-Cookie": cookie },
  });
}

export function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

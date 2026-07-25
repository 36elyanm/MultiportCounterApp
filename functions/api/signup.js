import { newId, hashPassword, createSession, sessionCookie, jsonWithCookie, json, isValidEmail } from "../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  if (!body || !isValidEmail(body.email) || typeof body.password !== "string" || body.password.length < 8) {
    return json({ error: "Provide a valid email and a password of at least 8 characters." }, 400);
  }
  const email = body.email.trim().toLowerCase();

  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (existing) {
    return json({ error: "An account with that email already exists." }, 409);
  }

  const { hash, salt } = await hashPassword(body.password);
  const userId = newId();
  await env.DB.prepare(
    "INSERT INTO users (id, email, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(userId, email, hash, salt, Date.now())
    .run();

  const { token } = await createSession(env.DB, userId);
  return jsonWithCookie(
    { user: { id: userId, email, parentId: null } },
    201,
    sessionCookie(token, 30 * 24 * 60 * 60)
  );
}

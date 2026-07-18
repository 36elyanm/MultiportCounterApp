import { verifyPassword, createSession, sessionCookie, jsonWithCookie, json, isValidEmail } from "../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  if (!body || !isValidEmail(body.email) || typeof body.password !== "string") {
    return json({ error: "Provide an email and password." }, 400);
  }
  const email = body.email.trim().toLowerCase();

  const user = await env.DB.prepare(
    "SELECT id, email, password_hash, password_salt FROM users WHERE email = ?"
  )
    .bind(email)
    .first();
  if (!user) {
    return json({ error: "Incorrect email or password." }, 401);
  }
  const valid = await verifyPassword(body.password, user.password_salt, user.password_hash);
  if (!valid) {
    return json({ error: "Incorrect email or password." }, 401);
  }

  const { token } = await createSession(env.DB, user.id);
  return jsonWithCookie(
    { user: { id: user.id, email: user.email } },
    200,
    sessionCookie(token, 30 * 24 * 60 * 60)
  );
}

import { requireUser, isChild, isValidEmail, hashPassword, newId, json } from "../_lib/auth.js";

// Lists the current user's child accounts (email + when they were added).
// Not available to child accounts themselves — a child can't have children.
export async function onRequestGet({ request, env }) {
  const user = await requireUser(request, env);
  if (!user) return json({ error: "Not signed in." }, 401);
  if (isChild(user)) return json({ error: "Child accounts can't have children of their own." }, 403);

  const { results } = await env.DB.prepare(
    "SELECT id, email, created_at as createdAt FROM users WHERE parent_id = ? ORDER BY created_at ASC"
  )
    .bind(user.id)
    .all();
  return json({ children: results }, 200);
}

// Creates a child account under the current user. The child logs in with
// their own email/password and sees the parent's counters, but every
// mutating counter endpoint rejects requests from child accounts — that
// check lives server-side in functions/api/counters.js and
// functions/api/counters/[id].js, not just hidden in the UI.
export async function onRequestPost({ request, env }) {
  const user = await requireUser(request, env);
  if (!user) return json({ error: "Not signed in." }, 401);
  if (isChild(user)) return json({ error: "Child accounts can't have children of their own." }, 403);

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
  const childId = newId();
  const now = Date.now();
  await env.DB.prepare(
    "INSERT INTO users (id, email, password_hash, password_salt, parent_id, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(childId, email, hash, salt, user.id, now)
    .run();

  return json({ child: { id: childId, email, createdAt: now } }, 201);
}

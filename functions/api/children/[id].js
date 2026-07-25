import { requireUser, json } from "../../_lib/auth.js";

// A parent removing a child account. Sessions for that child are cascade
// deleted at the database level (sessions.user_id REFERENCES users(id)
// ON DELETE CASCADE), so any device that child was signed in on is
// immediately signed out too.
export async function onRequestDelete({ request, env, params }) {
  const user = await requireUser(request, env);
  if (!user) return json({ error: "Not signed in." }, 401);

  await env.DB.prepare("DELETE FROM users WHERE id = ? AND parent_id = ?").bind(params.id, user.id).run();
  return json({ ok: true }, 200);
}

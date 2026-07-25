import { requireUser, isChild, ownerIdFor, json, newId } from "../_lib/auth.js";

// GET is allowed for child accounts — they view their parent's counters —
// but every mutation below rejects child accounts outright.

export async function onRequestGet({ request, env }) {
  const user = await requireUser(request, env);
  if (!user) return json({ error: "Not signed in." }, 401);

  const { results } = await env.DB.prepare(
    "SELECT id, name, count, step, color, icon, sort_order FROM counters WHERE user_id = ? ORDER BY sort_order ASC, created_at ASC"
  )
    .bind(ownerIdFor(user))
    .all();
  return json({ counters: results }, 200);
}

export async function onRequestPut({ request, env }) {
  const user = await requireUser(request, env);
  if (!user) return json({ error: "Not signed in." }, 401);
  if (isChild(user)) return json({ error: "Child accounts are read-only." }, 403);

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.counters)) {
    return json({ error: "Expected { counters: [...] }." }, 400);
  }

  const now = Date.now();
  const statements = [env.DB.prepare("DELETE FROM counters WHERE user_id = ?").bind(user.id)];
  body.counters.forEach((c, index) => {
    statements.push(
      env.DB.prepare(
        "INSERT INTO counters (id, user_id, name, count, step, color, icon, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(
        typeof c.id === "string" ? c.id : newId(),
        user.id,
        String(c.name || "Untitled").slice(0, 60),
        Number.isFinite(c.count) ? c.count : 0,
        Number.isFinite(c.step) && c.step > 0 ? c.step : 1,
        typeof c.color === "string" ? c.color : "#007AFF",
        typeof c.icon === "string" ? c.icon : null,
        index,
        now,
        now
      )
    );
  });
  await env.DB.batch(statements);

  return json({ ok: true }, 200);
}

export async function onRequestDelete({ request, env }) {
  const user = await requireUser(request, env);
  if (!user) return json({ error: "Not signed in." }, 401);
  if (isChild(user)) return json({ error: "Child accounts are read-only." }, 403);

  await env.DB.prepare("DELETE FROM counters WHERE user_id = ?").bind(user.id).run();
  return json({ ok: true }, 200);
}

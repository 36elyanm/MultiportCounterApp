import { requireUser, json } from "../../_lib/auth.js";

export async function onRequestPatch({ request, env, params }) {
  const user = await requireUser(request, env);
  if (!user) return json({ error: "Not signed in." }, 401);

  const id = params.id;
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid body." }, 400);

  const existing = await env.DB.prepare("SELECT id FROM counters WHERE id = ? AND user_id = ?")
    .bind(id, user.id)
    .first();
  if (!existing) return json({ error: "Counter not found." }, 404);

  const fields = [];
  const values = [];
  for (const [key, column] of [
    ["name", "name"],
    ["count", "count"],
    ["step", "step"],
    ["color", "color"],
    ["icon", "icon"],
  ]) {
    if (key in body) {
      fields.push(`${column} = ?`);
      values.push(body[key]);
    }
  }
  if (fields.length === 0) return json({ error: "Nothing to update." }, 400);

  fields.push("updated_at = ?");
  values.push(Date.now(), id, user.id);

  await env.DB.prepare(`UPDATE counters SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`)
    .bind(...values)
    .run();

  return json({ ok: true }, 200);
}

export async function onRequestDelete({ request, env, params }) {
  const user = await requireUser(request, env);
  if (!user) return json({ error: "Not signed in." }, 401);

  await env.DB.prepare("DELETE FROM counters WHERE id = ? AND user_id = ?").bind(params.id, user.id).run();
  return json({ ok: true }, 200);
}

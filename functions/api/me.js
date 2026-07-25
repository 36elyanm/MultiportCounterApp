import { requireUser, isChild, json } from "../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const user = await requireUser(request, env);
  if (!user) return json({ user: null }, 200);

  if (isChild(user)) {
    const parent = await env.DB.prepare("SELECT email FROM users WHERE id = ?").bind(user.parentId).first();
    return json({ user: { ...user, parentEmail: parent ? parent.email : null } }, 200);
  }

  return json({ user }, 200);
}

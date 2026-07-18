import { requireUser, json } from "../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const user = await requireUser(request, env);
  return json({ user: user || null }, 200);
}

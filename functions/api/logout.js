import { parseCookies, deleteSession, clearedSessionCookie, jsonWithCookie } from "../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  const cookies = parseCookies(request);
  await deleteSession(env.DB, cookies.session);
  return jsonWithCookie({ ok: true }, 200, clearedSessionCookie());
}

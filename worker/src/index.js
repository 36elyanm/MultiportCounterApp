import {
  newId,
  hashPassword,
  verifyPassword,
  createSession,
  getUserFromSession,
  deleteSession,
  parseCookies,
  sessionCookie,
  clearedSessionCookie,
} from "./auth.js";

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(data, status, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(env) },
  });
}

function jsonWithCookie(data, status, env, cookie) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Set-Cookie": cookie, ...corsHeaders(env) },
  });
}

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function requireUser(request, env) {
  const cookies = parseCookies(request);
  return getUserFromSession(env.DB, cookies.session);
}

async function handleSignup(request, env) {
  const body = await request.json().catch(() => null);
  if (!body || !isValidEmail(body.email) || typeof body.password !== "string" || body.password.length < 8) {
    return json({ error: "Provide a valid email and a password of at least 8 characters." }, 400, env);
  }
  const email = body.email.trim().toLowerCase();

  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (existing) {
    return json({ error: "An account with that email already exists." }, 409, env);
  }

  const { hash, salt } = await hashPassword(body.password);
  const userId = newId();
  await env.DB.prepare(
    "INSERT INTO users (id, email, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(userId, email, hash, salt, Date.now())
    .run();

  const { token } = await createSession(env.DB, userId);
  return jsonWithCookie({ user: { id: userId, email } }, 201, env, sessionCookie(token, 30 * 24 * 60 * 60));
}

async function handleLogin(request, env) {
  const body = await request.json().catch(() => null);
  if (!body || !isValidEmail(body.email) || typeof body.password !== "string") {
    return json({ error: "Provide an email and password." }, 400, env);
  }
  const email = body.email.trim().toLowerCase();

  const user = await env.DB.prepare(
    "SELECT id, email, password_hash, password_salt FROM users WHERE email = ?"
  )
    .bind(email)
    .first();
  if (!user) {
    return json({ error: "Incorrect email or password." }, 401, env);
  }
  const valid = await verifyPassword(body.password, user.password_salt, user.password_hash);
  if (!valid) {
    return json({ error: "Incorrect email or password." }, 401, env);
  }

  const { token } = await createSession(env.DB, user.id);
  return jsonWithCookie({ user: { id: user.id, email: user.email } }, 200, env, sessionCookie(token, 30 * 24 * 60 * 60));
}

async function handleLogout(request, env) {
  const cookies = parseCookies(request);
  await deleteSession(env.DB, cookies.session);
  return jsonWithCookie({ ok: true }, 200, env, clearedSessionCookie());
}

async function handleMe(request, env) {
  const user = await requireUser(request, env);
  if (!user) return json({ user: null }, 200, env);
  return json({ user }, 200, env);
}

async function handleListCounters(request, env) {
  const user = await requireUser(request, env);
  if (!user) return json({ error: "Not signed in." }, 401, env);

  const { results } = await env.DB.prepare(
    "SELECT id, name, count, step, color, icon, sort_order FROM counters WHERE user_id = ? ORDER BY sort_order ASC, created_at ASC"
  )
    .bind(user.id)
    .all();
  return json({ counters: results }, 200, env);
}

async function handleReplaceCounters(request, env) {
  const user = await requireUser(request, env);
  if (!user) return json({ error: "Not signed in." }, 401, env);

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.counters)) {
    return json({ error: "Expected { counters: [...] }." }, 400, env);
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

  return json({ ok: true }, 200, env);
}

async function handleUpdateCounter(request, env, id) {
  const user = await requireUser(request, env);
  if (!user) return json({ error: "Not signed in." }, 401, env);

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid body." }, 400, env);

  const existing = await env.DB.prepare("SELECT id FROM counters WHERE id = ? AND user_id = ?")
    .bind(id, user.id)
    .first();
  if (!existing) return json({ error: "Counter not found." }, 404, env);

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
  if (fields.length === 0) return json({ error: "Nothing to update." }, 400, env);

  fields.push("updated_at = ?");
  values.push(Date.now(), id, user.id);

  await env.DB.prepare(`UPDATE counters SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`)
    .bind(...values)
    .run();

  return json({ ok: true }, 200, env);
}

async function handleDeleteCounter(request, env, id) {
  const user = await requireUser(request, env);
  if (!user) return json({ error: "Not signed in." }, 401, env);

  await env.DB.prepare("DELETE FROM counters WHERE id = ? AND user_id = ?").bind(id, user.id).run();
  return json({ ok: true }, 200, env);
}

async function handleDeleteAllCounters(request, env) {
  const user = await requireUser(request, env);
  if (!user) return json({ error: "Not signed in." }, 401, env);

  await env.DB.prepare("DELETE FROM counters WHERE user_id = ?").bind(user.id).run();
  return json({ ok: true }, 200, env);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    try {
      if (pathname === "/api/signup" && request.method === "POST") return await handleSignup(request, env);
      if (pathname === "/api/login" && request.method === "POST") return await handleLogin(request, env);
      if (pathname === "/api/logout" && request.method === "POST") return await handleLogout(request, env);
      if (pathname === "/api/me" && request.method === "GET") return await handleMe(request, env);

      if (pathname === "/api/counters" && request.method === "GET") return await handleListCounters(request, env);
      if (pathname === "/api/counters" && request.method === "PUT") return await handleReplaceCounters(request, env);
      if (pathname === "/api/counters" && request.method === "DELETE") return await handleDeleteAllCounters(request, env);

      const counterMatch = pathname.match(/^\/api\/counters\/([^/]+)$/);
      if (counterMatch && request.method === "PATCH") return await handleUpdateCounter(request, env, counterMatch[1]);
      if (counterMatch && request.method === "DELETE") return await handleDeleteCounter(request, env, counterMatch[1]);

      return json({ error: "Not found." }, 404, env);
    } catch (err) {
      return json({ error: "Internal error.", detail: String(err) }, 500, env);
    }
  },
};

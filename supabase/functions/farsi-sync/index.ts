import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set([
  "https://flesentine.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
]);
const MAX_LOGS = 12000;
const TARGET_STATE_CHARS = 1600000;
const MIN_LOGS = 4000;
const MAX_WRITE_ATTEMPTS = 4;

function cors(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "https://flesentine.github.io";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(req), "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function normalizeCode(value: unknown) {
  return String(value || "").replace(/[^0-9a-f]/gi, "").toLowerCase();
}

async function hashCode(code: string) {
  const bytes = new TextEncoder().encode(code);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function clone<T>(value: T): T {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function asTime(value: unknown) {
  const n = Date.parse(String(value || ""));
  return Number.isFinite(n) ? n : 0;
}

function emptyMemory() {
  return { version: 5, cards: {}, logs: [], reverseProgress: {}, createdAt: new Date().toISOString(), migratedFrom: null };
}

function latestLogTimes(memory: any) {
  const out: Record<string, number> = {};
  for (const row of memory?.logs || []) {
    if (!Array.isArray(row) || !row[1]) continue;
    const t = Number(row[0]) || 0;
    if (t > (out[row[1]] || 0)) out[row[1]] = t;
  }
  return out;
}

function mergeMemory(a: any, b: any) {
  if (!a && !b) return null;
  if (!a) return clone(b);
  if (!b) return clone(a);
  if (a.version !== 5 || b.version !== 5) {
    const at = Number(a?.logs?.at?.(-1)?.[0]) || 0;
    const bt = Number(b?.logs?.at?.(-1)?.[0]) || 0;
    return clone(at >= bt ? a : b);
  }

  const out: any = emptyMemory();
  out.createdAt = [a.createdAt, b.createdAt].filter(Boolean).sort()[0] || new Date().toISOString();
  out.migratedFrom = a.migratedFrom || b.migratedFrom || null;
  if (a.migratedAt || b.migratedAt) out.migratedAt = [a.migratedAt, b.migratedAt].filter(Boolean).sort().at(-1);

  const keys = new Set([...Object.keys(a.cards || {}), ...Object.keys(b.cards || {})]);
  for (const key of keys) {
    const ca = a.cards?.[key], cb = b.cards?.[key];
    if (!ca) { out.cards[key] = clone(cb); continue; }
    if (!cb) { out.cards[key] = clone(ca); continue; }
    const ta = asTime(ca.last_review), tb = asTime(cb.last_review);
    if (ta !== tb) out.cards[key] = clone(ta > tb ? ca : cb);
    else out.cards[key] = clone((Number(ca.reps) || 0) >= (Number(cb.reps) || 0) ? ca : cb);
  }

  const seen = new Set<string>();
  const logs: any[] = [];
  for (const row of [...(a.logs || []), ...(b.logs || [])]) {
    if (!Array.isArray(row)) continue;
    const key = JSON.stringify(row);
    if (seen.has(key)) continue;
    seen.add(key);
    logs.push(clone(row));
  }
  logs.sort((x, y) => (Number(x?.[0]) || 0) - (Number(y?.[0]) || 0));
  out.logs = logs.slice(-MAX_LOGS);

  const ta = latestLogTimes(a), tb = latestLogTimes(b);
  const words = new Set([...Object.keys(a.reverseProgress || {}), ...Object.keys(b.reverseProgress || {})]);
  for (const fa of words) {
    out.reverseProgress[fa] = (ta[fa] || 0) >= (tb[fa] || 0)
      ? Number(a.reverseProgress?.[fa]) || 0
      : Number(b.reverseProgress?.[fa]) || 0;
  }
  return out;
}

function sanitizedSide(side: any, resetAt: number) {
  if (!side) return null;
  if (resetAt && Number(side.savedAt || 0) < resetAt) return { ...side, memory: emptyMemory(), legacy: null };
  return side;
}

function mergePayload(a: any, b: any) {
  if (!a) return clone(b);
  if (!b) return clone(a);
  const resetAt = Math.max(Number(a.resetAt) || 0, Number(b.resetAt) || 0);
  const left = sanitizedSide(a, resetAt);
  const right = sanitizedSide(b, resetAt);
  const leftTime = Number(left?.savedAt) || 0;
  const rightTime = Number(right?.savedAt) || 0;
  return {
    version: 1,
    savedAt: Math.max(leftTime, rightTime),
    resetAt,
    memory: mergeMemory(left?.memory, right?.memory),
    legacy: clone(leftTime >= rightTime ? left?.legacy : right?.legacy),
    settings: clone(leftTime >= rightTime ? left?.settings : right?.settings) || { direction: "fa", hidePhonetics: false },
  };
}

function compactState(state: any) {
  const next = clone(state);
  if (!next?.memory || next.memory.version !== 5 || !Array.isArray(next.memory.logs)) return next;

  let keep = Math.min(next.memory.logs.length, MAX_LOGS);
  next.memory.logs = next.memory.logs.slice(-keep);
  let encoded = JSON.stringify(next);
  while (encoded.length > TARGET_STATE_CHARS && keep > MIN_LOGS) {
    keep = Math.max(MIN_LOGS, Math.floor(keep * 0.75));
    next.memory.logs = next.memory.logs.slice(-keep);
    encoded = JSON.stringify(next);
  }
  return next;
}

async function writeMergedState(db: any, syncHash: string, incoming: any) {
  for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt++) {
    const { data: current, error: readError } = await db
      .from("farsi_sync_state")
      .select("state,updated_at")
      .eq("sync_hash", syncHash)
      .maybeSingle();
    if (readError) throw readError;

    const merged = compactState(mergePayload(incoming, current?.state ?? null));
    const encoded = JSON.stringify(merged);
    if (encoded.length > 2_000_000) throw new Error("State too large after compaction");
    const now = new Date().toISOString();

    if (!current) {
      const { error } = await db.from("farsi_sync_state").insert({ sync_hash: syncHash, state: merged, updated_at: now });
      if (!error) return { state: merged, updated_at: now };
      if (error.code === "23505") continue;
      throw error;
    }

    const { data: updated, error: updateError } = await db
      .from("farsi_sync_state")
      .update({ state: merged, updated_at: now })
      .eq("sync_hash", syncHash)
      .eq("updated_at", current.updated_at)
      .select("updated_at")
      .maybeSingle();
    if (updateError) throw updateError;
    if (updated) return { state: merged, updated_at: updated.updated_at };
  }
  throw new Error("Sync contention; retry later");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  const origin = req.headers.get("origin") || "";
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json(req, { error: "Origin not allowed" }, 403);

  try {
    const body = await req.json();
    const action = String(body?.action || "");
    const code = normalizeCode(body?.code);
    if (!/^[0-9a-f]{32}$/.test(code)) return json(req, { error: "Invalid sync code" }, 400);

    const url = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const secretRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
    const secretKey = serviceRole || (secretRaw ? JSON.parse(secretRaw).default : "");
    if (!url || !secretKey) return json(req, { error: "Server configuration error" }, 500);

    const db = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const syncHash = await hashCode(code);

    if (action === "pull") {
      const { data, error } = await db
        .from("farsi_sync_state")
        .select("state,updated_at")
        .eq("sync_hash", syncHash)
        .maybeSingle();
      if (error) throw error;
      return json(req, { state: data?.state ?? null, updated_at: data?.updated_at ?? null });
    }

    if (action === "push") {
      if (!body?.state || typeof body.state !== "object" || Array.isArray(body.state)) {
        return json(req, { error: "Invalid state" }, 400);
      }
      const result = await writeMergedState(db, syncHash, body.state);
      return json(req, { ok: true, updated_at: result.updated_at });
    }

    return json(req, { error: "Unknown action" }, 400);
  } catch (error) {
    console.error(error);
    return json(req, { error: "Sync failed" }, 500);
  }
});

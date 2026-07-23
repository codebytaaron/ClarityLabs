const SUPABASE_URL = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export function configured() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

export async function supabase(path, options = {}) {
  if (!configured()) throw new Error("Supabase is not configured.");
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const message = data?.message || data?.hint || `Supabase request failed (${response.status}).`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
}

export function noStore(res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
}

export function cleanText(value, max) {
  return String(value || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function hostAuthorized(req) {
  const expected = String(process.env.PRESENTATION_HOST_KEY || "");
  const received = String(req.headers["x-presentation-key"] || "");
  if (!expected || expected.length !== received.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index++) {
    difference |= expected.charCodeAt(index) ^ received.charCodeAt(index);
  }
  return difference === 0;
}

const KV_URL = String(
  process.env.KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL ||
  ""
).replace(/\/+$/, "");

const KV_TOKEN =
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  "";

export function configured() {
  return Boolean(KV_URL && KV_TOKEN);
}

export async function kv(command) {
  if (!configured()) throw new Error("Vercel storage is not connected.");

  const response = await fetch(KV_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command),
    cache: "no-store"
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || data?.error) {
    const error = new Error(data?.error || `Vercel storage request failed (${response.status}).`);
    error.status = response.status || 500;
    throw error;
  }
  return data?.result;
}

export function noStore(res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
}

export function cleanText(value, max) {
  return String(value || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function hostAuthorized(req) {
  const expected = boardKey();
  const received = String(req.headers["x-presentation-key"] || "");
  if (!expected || expected.length !== received.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index++) {
    difference |= expected.charCodeAt(index) ^ received.charCodeAt(index);
  }
  return difference === 0;
}

export function boardConfigured() {
  return Boolean(boardKey());
}

function boardKey() {
  return String(process.env.AUDIENCE_BOARD_KEY || process.env.PRESENTATION_HOST_KEY || "");
}

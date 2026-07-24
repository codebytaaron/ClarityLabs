import { cleanText, configured, hostAuthorized, kv, noStore } from "./_kv.js";

const QUESTIONS_KEY = "clarity:audience:qna";
const RATE_KEY = clientId => `clarity:audience:qna:rate:${clientId}`;

function parseQuestions(values) {
  if (!Array.isArray(values)) return [];
  const items = [];
  for (let index = 0; index < values.length; index += 2) {
    try {
      const item = JSON.parse(values[index + 1]);
      if (item?.id && item?.question) items.push(item);
    } catch {}
  }
  return items
    .sort((a, b) => Number(a.answered) - Number(b.answered) || String(a.createdAt).localeCompare(String(b.createdAt)))
    .slice(0, 100);
}

export default async function handler(req, res) {
  noStore(res);
  if (!configured()) {
    res.status(503).json({ error: "Audience storage is not connected.", questions: [] });
    return;
  }

  try {
    if (req.method === "POST") {
      const clientId = cleanText(req.body?.clientId, 80).replace(/[^a-zA-Z0-9_-]/g, "");
      const question = cleanText(req.body?.question, 160);
      if (clientId.length < 8 || question.length < 3) {
        res.status(400).json({ error: "Please enter a complete question." });
        return;
      }

      const allowed = await kv(["SET", RATE_KEY(clientId), "1", "NX", "EX", "8"]);
      if (allowed !== "OK") {
        res.status(429).json({ error: "Please wait a few seconds before asking another question." });
        return;
      }

      const id = `q_${Date.now().toString(36)}_${clientId.slice(-8)}`;
      const item = { id, question, answered: false, createdAt: new Date().toISOString() };
      await kv(["HSET", QUESTIONS_KEY, id, JSON.stringify(item)]);
      res.status(200).json({ ok: true, id });
      return;
    }

    if (req.method === "GET") {
      const values = await kv(["HGETALL", QUESTIONS_KEY]);
      res.status(200).json({ questions: parseQuestions(values) });
      return;
    }

    if (!hostAuthorized(req)) {
      res.status(401).json({ error: "Admin key is missing or incorrect.", questions: [] });
      return;
    }

    if (req.method === "PATCH") {
      const id = cleanText(req.body?.id, 80).replace(/[^a-zA-Z0-9_-]/g, "");
      if (!id) {
        res.status(400).json({ error: "Question ID is required." });
        return;
      }
      const stored = await kv(["HGET", QUESTIONS_KEY, id]);
      if (!stored) {
        res.status(404).json({ error: "Question not found." });
        return;
      }
      const item = JSON.parse(stored);
      item.answered = Boolean(req.body?.answered);
      item.answeredAt = item.answered ? new Date().toISOString() : null;
      await kv(["HSET", QUESTIONS_KEY, id, JSON.stringify(item)]);
      res.status(200).json({ ok: true, question: item });
      return;
    }

    if (req.method === "DELETE") {
      const id = cleanText(req.query?.id, 80).replace(/[^a-zA-Z0-9_-]/g, "");
      if (id) await kv(["HDEL", QUESTIONS_KEY, id]);
      else await kv(["DEL", QUESTIONS_KEY]);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "Audience questions failed." });
  }
}

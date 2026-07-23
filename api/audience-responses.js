import { cleanText, configured, hostAuthorized, kv, noStore } from "./_kv.js";

const STATE_KEY = "clarity:audience:question";
const responsesKey = (questionId) => `clarity:audience:responses:${questionId}`;

function parseState(stored) {
  try { return stored ? JSON.parse(stored) : null; } catch { return null; }
}

function parseResponses(values) {
  if (!Array.isArray(values)) return [];
  const responses = [];
  for (let index = 0; index < values.length; index += 2) {
    try {
      const response = JSON.parse(values[index + 1]);
      if (response?.answer) responses.push(response);
    } catch {}
  }
  return responses.sort((a, b) => String(a.created_at).localeCompare(String(b.created_at))).slice(0, 80);
}

export default async function handler(req, res) {
  noStore(res);
  if (!configured()) {
    res.status(503).json({ error: "Presentation storage is not configured.", responses: [] });
    return;
  }

  try {
    if (req.method === "GET") {
      const questionId = cleanText(req.query?.questionId, 60).replace(/[^a-zA-Z0-9_-]/g, "");
      if (!questionId) {
        res.status(400).json({ error: "questionId is required.", responses: [] });
        return;
      }
      const values = await kv(["HGETALL", responsesKey(questionId)]);
      res.status(200).json({ responses: parseResponses(values) });
      return;
    }

    if (req.method === "POST") {
      const questionId = cleanText(req.body?.questionId, 60).replace(/[^a-zA-Z0-9_-]/g, "");
      const clientId = cleanText(req.body?.clientId, 80).replace(/[^a-zA-Z0-9_-]/g, "");
      const answer = cleanText(req.body?.answer, 100);
      if (!questionId || clientId.length < 8 || !answer) {
        res.status(400).json({ error: "A valid question, browser ID, and short answer are required." });
        return;
      }

      const state = parseState(await kv(["GET", STATE_KEY]));
      if (!state?.active || state?.questionId !== questionId) {
        res.status(409).json({ error: "That question is no longer active." });
        return;
      }

      const response = {
        id: clientId,
        answer,
        created_at: new Date().toISOString()
      };
      await kv(["HSET", responsesKey(questionId), clientId, JSON.stringify(response)]);
      res.status(200).json({ ok: true });
      return;
    }

    if (req.method === "DELETE") {
      if (!hostAuthorized(req)) {
        res.status(401).json({ error: "Control-board key is missing or incorrect." });
        return;
      }
      const questionId = cleanText(req.query?.questionId, 60).replace(/[^a-zA-Z0-9_-]/g, "");
      if (!questionId) {
        res.status(400).json({ error: "questionId is required." });
        return;
      }
      await kv(["DEL", responsesKey(questionId)]);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "Presentation responses failed." });
  }
}

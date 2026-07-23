import { cleanText, configured, hostAuthorized, kv, noStore } from "./_kv.js";

const EMPTY_STATE = { slide: 1, promptId: "", question: "", updatedAt: null };
const STATE_KEY = "clarity:presentation:state";

export default async function handler(req, res) {
  noStore(res);
  if (!configured()) {
    res.status(503).json({ error: "Presentation storage is not configured.", ...EMPTY_STATE });
    return;
  }

  try {
    if (req.method === "GET") {
      const stored = await kv(["GET", STATE_KEY]);
      let state = null;
      try { state = stored ? JSON.parse(stored) : null; } catch { state = null; }
      res.status(200).json(state || EMPTY_STATE);
      return;
    }

    if (req.method === "POST") {
      if (!hostAuthorized(req)) {
        res.status(401).json({ error: "Presenter key is missing or incorrect." });
        return;
      }
      const slide = Math.max(1, Math.min(30, Number(req.body?.slide) || 1));
      const promptId = cleanText(req.body?.promptId, 60).replace(/[^a-zA-Z0-9_-]/g, "");
      const question = promptId ? cleanText(req.body?.question, 180) : "";
      if (promptId && !question) {
        res.status(400).json({ error: "A question is required for an audience prompt." });
        return;
      }
      const state = { slide, promptId, question, updatedAt: new Date().toISOString() };
      await kv(["SET", STATE_KEY, JSON.stringify(state)]);
      res.status(200).json({ ok: true, ...state });
      return;
    }

    res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "Presentation state failed." });
  }
}

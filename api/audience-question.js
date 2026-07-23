import { cleanText, configured, hostAuthorized, kv, noStore } from "./_kv.js";

const EMPTY_STATE = { questionId: "", question: "", active: false, updatedAt: null };
const STATE_KEY = "clarity:audience:question";
const LEGACY_KEYS = [
  "clarity:presentation:state",
  "clarity:presentation:responses:challenge",
  "clarity:presentation:responses:value",
  "clarity:presentation:responses:questions"
];

async function removeLegacyPresentation() {
  await Promise.all(LEGACY_KEYS.map(key => kv(["DEL", key])));
}

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
        res.status(401).json({ error: "Control-board key is missing or incorrect." });
        return;
      }
      const questionId = cleanText(req.body?.questionId, 60).replace(/[^a-zA-Z0-9_-]/g, "");
      const question = cleanText(req.body?.question, 180);
      const active = Boolean(req.body?.active && questionId && question);
      if (req.body?.active && (!questionId || !question)) {
        res.status(400).json({ error: "A question is required before opening answers." });
        return;
      }
      const state = { questionId: active ? questionId : "", question: active ? question : "", active, updatedAt: new Date().toISOString() };
      await kv(["SET", STATE_KEY, JSON.stringify(state)]);
      await removeLegacyPresentation();
      res.status(200).json({ ok: true, ...state });
      return;
    }

    if (req.method === "DELETE") {
      if (!hostAuthorized(req)) {
        res.status(401).json({ error: "Control-board key is missing or incorrect." });
        return;
      }
      await removeLegacyPresentation();
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "Presentation state failed." });
  }
}

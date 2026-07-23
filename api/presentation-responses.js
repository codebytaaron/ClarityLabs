import { cleanText, configured, hostAuthorized, noStore, supabase } from "./_supabase.js";

export default async function handler(req, res) {
  noStore(res);
  if (!configured()) {
    res.status(503).json({ error: "Presentation storage is not configured.", responses: [] });
    return;
  }

  try {
    if (req.method === "GET") {
      const promptId = cleanText(req.query?.promptId, 60).replace(/[^a-zA-Z0-9_-]/g, "");
      if (!promptId) {
        res.status(400).json({ error: "promptId is required.", responses: [] });
        return;
      }
      const rows = await supabase(
        `presentation_responses?prompt_id=eq.${encodeURIComponent(promptId)}&select=id,answer,created_at&order=created_at.asc&limit=80`
      );
      res.status(200).json({ responses: Array.isArray(rows) ? rows : [] });
      return;
    }

    if (req.method === "POST") {
      const promptId = cleanText(req.body?.promptId, 60).replace(/[^a-zA-Z0-9_-]/g, "");
      const clientId = cleanText(req.body?.clientId, 80).replace(/[^a-zA-Z0-9_-]/g, "");
      const answer = cleanText(req.body?.answer, 100);
      if (!promptId || clientId.length < 8 || !answer) {
        res.status(400).json({ error: "A valid prompt, browser ID, and short answer are required." });
        return;
      }

      const states = await supabase("presentation_state?id=eq.main&select=prompt_id&limit=1");
      if (!Array.isArray(states) || states[0]?.prompt_id !== promptId) {
        res.status(409).json({ error: "That question is no longer active." });
        return;
      }

      await supabase("presentation_responses?on_conflict=prompt_id,client_id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ prompt_id: promptId, client_id: clientId, answer })
      });
      res.status(200).json({ ok: true });
      return;
    }

    if (req.method === "DELETE") {
      if (!hostAuthorized(req)) {
        res.status(401).json({ error: "Presenter key is missing or incorrect." });
        return;
      }
      const promptId = cleanText(req.query?.promptId, 60).replace(/[^a-zA-Z0-9_-]/g, "");
      if (!promptId) {
        res.status(400).json({ error: "promptId is required." });
        return;
      }
      await supabase(`presentation_responses?prompt_id=eq.${encodeURIComponent(promptId)}`, {
        method: "DELETE",
        headers: { Prefer: "return=minimal" }
      });
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "Presentation responses failed." });
  }
}

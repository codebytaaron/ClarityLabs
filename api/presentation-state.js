import { cleanText, configured, hostAuthorized, noStore, supabase } from "./_supabase.js";

const EMPTY_STATE = { slide: 1, promptId: "", question: "", updatedAt: null };

export default async function handler(req, res) {
  noStore(res);
  if (!configured()) {
    res.status(503).json({ error: "Presentation storage is not configured.", ...EMPTY_STATE });
    return;
  }

  try {
    if (req.method === "GET") {
      const rows = await supabase("presentation_state?id=eq.main&select=slide,prompt_id,question,updated_at&limit=1");
      const row = Array.isArray(rows) ? rows[0] : null;
      res.status(200).json(row ? {
        slide: row.slide,
        promptId: row.prompt_id || "",
        question: row.question || "",
        updatedAt: row.updated_at
      } : EMPTY_STATE);
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
      await supabase("presentation_state?on_conflict=id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          id: "main",
          slide,
          prompt_id: promptId || null,
          question: question || null,
          updated_at: new Date().toISOString()
        })
      });
      res.status(200).json({ ok: true, slide, promptId, question });
      return;
    }

    res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "Presentation state failed." });
  }
}

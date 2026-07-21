// Vercel serverless function — generates skincare guidance from detection results
// using Groq (OpenAI-compatible API). The key stays server-side.
//
// Required env var (Vercel → Settings → Environment Variables):
//   GROQ_API_KEY   your Groq API key (console.groq.com/keys)

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are a friendly, evidence-based skincare guide inside an acne-detection app.
You are given the blemish types and counts an AI vision model found in a user's photo, plus an overall severity.
Give practical, over-the-counter guidance a general audience can act on. You are NOT a doctor: never diagnose,
never prescribe prescription-only medication, and always keep an encouraging, non-alarming tone.

Respond ONLY with a JSON object in exactly this shape:
{
  "summary": "2-3 sentence plain-language read of what was found and what it means.",
  "routine": ["3 to 5 short, ordered steps (AM/PM, cleanse, treat, moisturize, SPF, etc.), tailored to the blemish types found"],
  "ingredients": [{"name": "ingredient", "why": "one short sentence on why it helps these specific blemishes"}],
  "derm": "one sentence on when they should see a dermatologist based on the severity"
}
Pick ingredients relevant to the detected types (e.g. salicylic acid for blackheads/whiteheads, benzoyl peroxide for
pustules/papules, adapalene for comedonal acne, niacinamide for redness, azelaic acid for dark spots, SPF always).
Keep every string concise. No markdown, no text outside the JSON.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server is missing GROQ_API_KEY. Add it in Vercel → Settings → Environment Variables." });
    return;
  }

  try {
    const { counts = {}, total = 0, severity = "unknown", score = 0 } = req.body || {};
    const breakdown = Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(", ") || "none";

    const userMsg = `Detection results:
- Total blemishes: ${total}
- Breakdown: ${breakdown}
- Overall severity: ${severity} (score ${score})
Give the JSON plan.`;

    const rf = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.5,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg }
        ]
      })
    });

    const data = await rf.json();
    if (!rf.ok) {
      const msg = (data && data.error && data.error.message) || `Groq error (${rf.status})`;
      res.status(rf.status).json({ error: msg });
      return;
    }

    const content = data.choices?.[0]?.message?.content || "{}";
    let plan;
    try { plan = JSON.parse(content); } catch { plan = null; }
    if (!plan || typeof plan !== "object") {
      res.status(502).json({ error: "Advice model returned an unexpected format." });
      return;
    }

    res.status(200).json({
      summary: plan.summary || "",
      routine: Array.isArray(plan.routine) ? plan.routine : [],
      ingredients: Array.isArray(plan.ingredients) ? plan.ingredients : [],
      derm: plan.derm || ""
    });
  } catch (e) {
    res.status(500).json({ error: e.message || "Unexpected server error" });
  }
}

// Vercel serverless function — generates skincare guidance from detection results
// using Groq (OpenAI-compatible API). The key stays server-side.
//
// Required env var (Vercel → Settings → Environment Variables):
//   GROQ_API_KEY   your Groq API key (console.groq.com/keys)

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are a friendly, evidence-based skincare guide inside an acne-detection app.
You receive the blemish types and counts an AI vision model found in a user's photo, plus an overall severity.
Give practical, over-the-counter guidance a general audience can act on. You are NOT a doctor: never diagnose,
never prescribe prescription-only medication, and keep an encouraging, non-alarming tone.

Recommend REAL, widely-available over-the-counter products, split into three price tiers. Use accurate,
realistic US prices. Tailor every pick to the blemish types actually found (e.g. salicylic acid for
blackheads/whiteheads, benzoyl peroxide for pustules/papules, adapalene for comedonal acne, niacinamide for
redness, azelaic acid or vitamin C for dark spots, and always a daily SPF).

Our users are mostly teenagers (13-18) with mild-to-moderate acne who have already tried some products.
If a name is provided, address them warmly by name in the summary. If they're a young teen, keep language simple and
encouraging, favor gentle/beginner-friendly routines, and remind them a parent can help pick products. Tailor picks to
their stated experience level (don't re-recommend basics to someone experienced) and their main concern.

Respond ONLY with a JSON object in exactly this shape:
{
  "summary": "2-3 sentence plain-language read of what was found and what it means, addressed to the user by name if given.",
  "routine": ["3 to 5 short ordered steps (cleanse, treat, moisturize, SPF, etc.) tailored to the findings"],
  "products": {
    "budget": [{"name":"Brand + product","targets":"which blemish type it helps","price":"$X","why":"one short sentence"}],
    "mid": [{"name":"...","targets":"...","price":"$X","why":"..."}],
    "premium": [{"name":"...","targets":"...","price":"$X","why":"..."}]
  },
  "derm": "one sentence on when to see a dermatologist given the severity"
}
Give 2 products per tier. Budget = drugstore, roughly under $20. Mid = roughly $20-45. Premium = roughly $45+.
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
    const { counts = {}, total = 0, severity = "unknown", score = 0, profile = null } = req.body || {};
    const breakdown = Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(", ") || "none";

    let who = "";
    if (profile && typeof profile === "object") {
      const parts = [];
      if (profile.name) parts.push(`Name: ${String(profile.name).slice(0, 40)}`);
      if (profile.age) parts.push(`Age: ${String(profile.age).slice(0, 6)}`);
      if (profile.experience) parts.push(`Product experience: ${String(profile.experience).slice(0, 40)}`);
      if (profile.concern) parts.push(`Main concern: ${String(profile.concern).slice(0, 60)}`);
      if (parts.length) who = `\nAbout the user:\n- ${parts.join("\n- ")}`;
    }

    const userMsg = `Detection results:
- Total blemishes: ${total}
- Breakdown: ${breakdown}
- Overall severity: ${severity} (score ${score})${who}
Give the JSON plan with tiered product recommendations.`;

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

    const products = plan.products && typeof plan.products === "object" ? plan.products : {};
    const tier = t => Array.isArray(products[t]) ? products[t] : [];

    res.status(200).json({
      summary: plan.summary || "",
      routine: Array.isArray(plan.routine) ? plan.routine : [],
      products: { budget: tier("budget"), mid: tier("mid"), premium: tier("premium") },
      derm: plan.derm || ""
    });
  } catch (e) {
    res.status(500).json({ error: e.message || "Unexpected server error" });
  }
}

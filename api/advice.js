// Vercel serverless function — generates image-grounded skincare guidance using
// Groq Vision plus Roboflow's structured detections. The image is forwarded for
// this request only; neither this function nor the app stores it.
//
// Required env var (Vercel → Settings → Environment Variables):
//   GROQ_API_KEY   your Groq API key (console.groq.com/keys)

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = process.env.GROQ_VISION_MODEL || "qwen/qwen3.6-27b";
const REPAIR_MODEL = process.env.GROQ_REPAIR_MODEL || "llama-3.3-70b-versatile";
const MAX_IMAGE_BASE64_LENGTH = 6_000_000;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const SYSTEM_PROMPT = `You are a friendly, evidence-based skincare guide inside an acne-detection app.
You receive the user's actual skin photo, Roboflow object detections, an app-computed visible-activity level, and an optional
user profile. Inspect the photo yourself, then reconcile what is visibly supported with the detector output.
Give practical over-the-counter guidance. You are NOT a doctor: never diagnose, never claim certainty from a
photo, never prescribe prescription-only medication, and keep an encouraging, non-alarming tone.

IMAGE-GROUNDING RULES:
- Make the response specific to this exact photo. Mention 2-4 concrete visible patterns such as where findings
  are concentrated, whether they appear mostly inflamed or comedonal, visible marks, and any image-quality limit.
- Treat Roboflow boxes/counts as the primary source for lesion classes and quantities. Do not invent lesion counts.
- If the photo and detector seem inconsistent, say the scan may be uncertain rather than choosing a diagnosis.
- Do not infer identity, ethnicity, gender, medical history, skin type, or anything not visibly supported.
- Do not call normal features medical conditions. Never assess attractiveness.
- Each routine treatment and product explanation must connect to a detected or visibly supported concern.
- Avoid generic filler and do not give the same default routine regardless of the findings.

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
  "summary": "2-3 sentence photo-specific read, addressed to the user by name if given.",
  "visualFindings": ["2 to 4 concise observations grounded in this photo and detector output"],
  "imageQuality": "one concise sentence about lighting, framing, or confidence limits; say good enough if appropriate",
  "routine": ["3 to 5 short ordered steps with timing/frequency, each tailored to the findings"],
  "products": {
    "budget": [{"name":"Brand + product","targets":"which visible/detected concern it helps","price":"$X","why":"one photo-specific short sentence"}],
    "mid": [{"name":"...","targets":"...","price":"$X","why":"..."}],
    "premium": [{"name":"...","targets":"...","price":"$X","why":"..."}]
  },
  "derm": "one calm sentence on when professional guidance may help, based on the visible findings"
}
Give 2 products per tier. Budget = drugstore, roughly under $20. Mid = roughly $20-45. Premium = roughly $45+.
Keep every string concise. No markdown, no text outside the JSON.`;

function cleanPredictions(predictions) {
  if (!Array.isArray(predictions)) return [];
  return predictions.slice(0, 250).map(p => ({
    class: String(p?.class || "unknown").slice(0, 40),
    confidence: Number.isFinite(Number(p?.confidence)) ? Number(p.confidence) : null,
    x: Number.isFinite(Number(p?.x)) ? Math.round(Number(p.x)) : null,
    y: Number.isFinite(Number(p?.y)) ? Math.round(Number(p.y)) : null,
    width: Number.isFinite(Number(p?.width)) ? Math.round(Number(p.width)) : null,
    height: Number.isFinite(Number(p?.height)) ? Math.round(Number(p.height)) : null
  }));
}

function parsePlanText(value) {
  if (value && typeof value === "object") return value;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1] || "";
  const afterThinking = trimmed.includes("</think>") ? trimmed.split("</think>").pop().trim() : "";
  const candidates = [
    trimmed,
    fenced,
    afterThinking,
    trimmed.slice(trimmed.indexOf("{"), trimmed.lastIndexOf("}") + 1)
  ];
  for (const candidate of candidates) {
    if (!candidate || !candidate.startsWith("{")) continue;
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {}
  }
  return null;
}

async function requestPlan(apiKey, messages) {
  const body = {
    model: MODEL,
    temperature: 0.1,
    max_completion_tokens: 1800,
    messages
  };

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify(body)
  });
  let data = null;
  try { data = await response.json(); } catch {}
  return { response, data };
}

async function repairPlan(apiKey, malformedText) {
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: REPAIR_MODEL,
      temperature: 0.05,
      max_completion_tokens: 1800,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Repair the supplied near-JSON into one valid JSON object. Preserve its meaning and fields. Return JSON only."
        },
        { role: "user", content: String(malformedText).slice(0, 20_000) }
      ]
    })
  });
  let data = null;
  try { data = await response.json(); } catch {}
  return { response, data };
}

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
    const {
      image,
      imageType = "image/jpeg",
      predictions = [],
      counts = {},
      total = 0,
      activity = req.body?.severity || "unknown",
      score = 0,
      profile = null
    } = req.body || {};
    if (typeof image !== "string" || !image.length) {
      res.status(400).json({ error: "The photo is required to build an image-grounded plan." });
      return;
    }
    if (image.length > MAX_IMAGE_BASE64_LENGTH) {
      res.status(413).json({ error: "The photo is too large. Choose a smaller image and try again." });
      return;
    }
    const safeImageType = ALLOWED_IMAGE_TYPES.has(imageType) ? imageType : "image/jpeg";
    const safePredictions = cleanPredictions(predictions);
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

    const userMsg = `Analyze the attached photo together with these detector results.

Roboflow detection summary:
- Total blemishes: ${total}
- Breakdown: ${breakdown}
- App-computed visible activity: ${activity} (internal pattern index ${score}; not a medical severity score)
- Detection boxes (pixel coordinates on this same image): ${JSON.stringify(safePredictions)}${who}

Return the requested JSON plan. Ground visualFindings in this photo, make the routine specific to those findings,
and clearly acknowledge any lighting/framing limitation.`;

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: userMsg },
          {
            type: "image_url",
            image_url: { url: `data:${safeImageType};base64,${image}` }
          }
        ]
      }
    ];

    // Avoid Groq's strict vision JSON validator: it can reject a useful answer
    // before we receive it. Parse tolerant vision output locally. Only when that
    // output is malformed do we ask a smaller text-only model to repair the text;
    // the image is never scanned twice.
    let { response: rf, data } = await requestPlan(apiKey, messages);
    const rawPlan = data?.choices?.[0]?.message?.content || data?.error?.failed_generation || "";
    let plan = parsePlanText(rawPlan);

    if (!plan && rawPlan) {
      ({ response: rf, data } = await repairPlan(apiKey, rawPlan));
      plan = parsePlanText(data?.choices?.[0]?.message?.content)
        || parsePlanText(data?.error?.failed_generation);
    }

    if (!plan || typeof plan !== "object") {
      if (rf.status === 429) {
        res.status(429).json({ error: "Personalized plans are busy right now. Please wait a moment and try again." });
        return;
      }
      res.status(502).json({ error: "We couldn't finish formatting your photo-specific plan. Please try again." });
      return;
    }

    const products = plan.products && typeof plan.products === "object" ? plan.products : {};
    const tier = t => Array.isArray(products[t]) ? products[t] : [];

    res.status(200).json({
      summary: plan.summary || "",
      visualFindings: Array.isArray(plan.visualFindings) ? plan.visualFindings.slice(0, 4) : [],
      imageQuality: plan.imageQuality || "",
      routine: Array.isArray(plan.routine) ? plan.routine : [],
      products: { budget: tier("budget"), mid: tier("mid"), premium: tier("premium") },
      derm: plan.derm || ""
    });
  } catch (e) {
    res.status(500).json({ error: e.message || "Unexpected server error" });
  }
}

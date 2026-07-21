// Vercel serverless function — proxies to Roboflow so the API key stays server-side.
// Set ROBOFLOW_API_KEY in your Vercel project (Settings → Environment Variables).

const WORKSPACE_MODEL = "acne-detection-zukbx-nvog3"; // model id
const VERSION = "1";
const HOST = "https://serverless.roboflow.com";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ROBOFLOW_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server is missing ROBOFLOW_API_KEY. Add it in Vercel → Settings → Environment Variables." });
    return;
  }

  try {
    const { image, confidence = 50, overlap = 50 } = req.body || {};
    if (!image) {
      res.status(400).json({ error: "No image provided." });
      return;
    }

    const params = new URLSearchParams({
      api_key: apiKey,
      confidence: String(confidence),
      overlap: String(overlap),
      format: "json"
    });

    const rfRes = await fetch(`${HOST}/${WORKSPACE_MODEL}/${VERSION}?${params.toString()}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: image // base64 string (no data: prefix)
    });

    const text = await rfRes.text();
    let data;
    try { data = JSON.parse(text); } catch { data = null; }

    if (!rfRes.ok) {
      res.status(rfRes.status).json({ error: (data && (data.message || data.error)) || `Roboflow error (${rfRes.status})` });
      return;
    }

    res.status(200).json({
      predictions: (data && data.predictions) || [],
      image: (data && data.image) || null
    });
  } catch (e) {
    res.status(500).json({ error: e.message || "Unexpected server error" });
  }
}

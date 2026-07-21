// Vercel serverless function — proxies to Roboflow so the API key stays server-side.
//
// Required env var (Vercel → Settings → Environment Variables):
//   ROBOFLOW_API_KEY   your Roboflow private API key (app.roboflow.com/settings/api)
//
// By default this calls the trained model directly, which returns clean detection
// boxes and honours the confidence/overlap sliders. Set USE_WORKFLOW=1 to route
// through the Roboflow Workflow instead (sliders won't apply); the response is
// parsed defensively so it works either way.

const HOST = "https://serverless.roboflow.com";
const WORKSPACE = "teddys-workspace-gkt3y";
const MODEL = "acne-detection-zukbx-nvog3"; // project slug
const VERSION = "1";
const WORKFLOW_ID = "acne-detection-vacne-detection-zukbx-nvog3-1-yolo26n-t1-logic";

// Recursively find the first array of Roboflow-style detections in a response,
// so we don't hard-code the workflow's output names.
function extractPredictions(node) {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    if (node.length && looksLikeDetection(node[0])) return node;
    for (const item of node) {
      const found = extractPredictions(item);
      if (found) return found;
    }
    return null;
  }
  if (Array.isArray(node.predictions) && (!node.predictions.length || looksLikeDetection(node.predictions[0]))) {
    return node.predictions;
  }
  for (const key of Object.keys(node)) {
    const found = extractPredictions(node[key]);
    if (found) return found;
  }
  return null;
}

function looksLikeDetection(o) {
  return o && typeof o === "object" &&
    typeof o.x === "number" && typeof o.y === "number" &&
    typeof o.width === "number" && typeof o.height === "number";
}

async function callModel(apiKey, image, confidence, overlap) {
  const params = new URLSearchParams({
    api_key: apiKey,
    confidence: String(confidence),
    overlap: String(overlap),
    format: "json"
  });
  const r = await fetch(`${HOST}/${MODEL}/${VERSION}?${params}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: image // base64 string, no data: prefix
  });
  return r;
}

async function callWorkflow(apiKey, image) {
  const r = await fetch(`${HOST}/${WORKSPACE}/workflows/${WORKFLOW_ID}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      inputs: { image: { type: "base64", value: image } }
    })
  });
  return r;
}

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

    const useWorkflow = process.env.USE_WORKFLOW === "1";
    const rfRes = useWorkflow
      ? await callWorkflow(apiKey, image)
      : await callModel(apiKey, image, confidence, overlap);

    const textBody = await rfRes.text();
    let data;
    try { data = JSON.parse(textBody); } catch { data = null; }

    if (!rfRes.ok) {
      const msg = (data && (data.message || data.error)) || `Roboflow error (${rfRes.status})`;
      res.status(rfRes.status).json({ error: msg });
      return;
    }

    const predictions = extractPredictions(data) || [];
    res.status(200).json({ predictions });
  } catch (e) {
    res.status(500).json({ error: e.message || "Unexpected server error" });
  }
}

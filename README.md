# Clarity Labs

A simple, polished web app around a Roboflow **YOLO26** acne-detection model
(`teddys-workspace-gkt3y/acne-detection-zukbx-nvog3`). Upload a photo, see every
blemish boxed and counted by type, get a **severity rating**, and receive a
**personalized skincare plan** generated from the results.

## Pages

- `index.html` — **landing page**: editorial hero, animated live-scan demo,
  scroll reveals, model stats, and a "Launch Tool" CTA.
- `app.html` — **the tool**: upload → detect → severity meter → AI plan.
  Thresholds are tuned so *every* detection surfaces for the patient (no sliders
  to fiddle with).
- `api/detect.js` — serverless proxy to Roboflow (keeps the API key server-side;
  parses predictions defensively).
- `api/advice.js` — serverless call to **Groq** that turns the detection results
  into a routine + ingredient guidance.

## Deploy (Vercel)

1. Import this repo at [vercel.com/new](https://vercel.com/new) (no build step —
   static + serverless).
2. Add **Environment Variables** (Settings → Environment Variables):
   | Name | Value | Where to get it |
   |------|-------|-----------------|
   | `ROBOFLOW_API_KEY` | your Roboflow private key | [app.roboflow.com/settings/api](https://app.roboflow.com/settings/api) |
   | `GROQ_API_KEY` | your Groq key | [console.groq.com/keys](https://console.groq.com/keys) |
3. Deploy, then **Redeploy** after adding the vars so they take effect.

### Optional
- Set `USE_WORKFLOW=1` to route detection through the Roboflow Workflow instead
  of the model directly.

## Local preview
`node dev-server.mjs` serves the pages + API on `http://localhost:4599`
(set the env vars in your shell first). This file is dev-only and not deployed.

---
For informational purposes only — not a medical diagnosis.

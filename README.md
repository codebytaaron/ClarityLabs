# Acne Detection UI

A simple web interface around a Roboflow **YOLO26** acne-detection model
(`teddys-workspace-gkt3y/acne-detection-zukbx-nvog3`). Upload a photo, run
detection, and see blemishes boxed and counted by type (blackheads, dark spot,
nodules, papules, pustules, whiteheads).

## How it works

- `index.html` — **Lumen** landing page: editorial hero, animated live-scan
  visual, scroll reveals, model stats, and a "Launch Tool" CTA.
- `app.html` — the detector (upload, canvas overlay, confidence/overlap
  sliders, per-class results). No build step.
- `api/detect.js` — a Vercel serverless function that calls Roboflow so the
  **API key stays server-side** and is never exposed in the browser.

## Deploy (cloud)

1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com/new), **Import** the repo (no build settings
   needed — it's static + serverless).
3. Add an Environment Variable:
   - **Name:** `ROBOFLOW_API_KEY`
   - **Value:** your Roboflow private API key
4. Deploy. That's it.

> For informational purposes only — not a medical diagnosis.

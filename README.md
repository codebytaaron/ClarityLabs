# Clarity Labs

Clarity Labs is a polished, browser-based skin analysis prototype that uses a trained computer-vision model to detect and classify visible blemishes from an uploaded photo.

Users can upload a clear photo, view detected blemishes with labels and bounding boxes, receive a neutral visible-activity summary, and generate a personalized skincare plan based on the analysis.

> Clarity Labs is an educational prototype and is not a medical diagnostic tool.

## Demo

[Launch Clarity Labs](https://anche-gamma.vercel.app)

## Features

- Upload and analyze a skin photo
- Detect blackheads, papules, pustules, whiteheads, nodules, and dark spots
- Display detected blemishes with labels and bounding boxes
- Count blemishes by type
- Summarize visible activity without presenting a medical severity rating
- Generate a personalized skincare routine
- Let an audience open one link, submit short answers, and see them appear on the presenter board
- Protect private API keys through serverless endpoints
- Work across desktop and mobile devices

## How It Works

### 1. Upload a Photo

Upload a clear, well-lit photo of the area you want to analyze.

### 2. Scan the Image

The computer-vision model scans the photo and identifies visible blemishes.

### 3. Review the Results

Clarity Labs displays each detected blemish, organizes the results by type, and summarizes visible activity.

### 4. Generate a Personalized Plan

Roboflow's detection counts, visible-activity summary, and the optional user profile are sent to Groq's
`llama-3.3-70b-versatile` model. Groq returns a concise routine and product suggestions at three price levels.
The uploaded image is not sent to Groq or saved by Clarity Labs.

The scan deployment requires `ROBOFLOW_API_KEY` and `GROQ_API_KEY`.

## Audience Board Setup

1. Create a free Supabase project.
2. Open Supabase **SQL Editor** and run `supabase-presentation.sql`.
3. Add these environment variables in Vercel for Production, Preview, and Development:
   - `SUPABASE_URL` — the project URL.
   - `SUPABASE_SECRET_KEY` — a new Supabase secret key. A legacy `SUPABASE_SERVICE_ROLE_KEY` also works.
   - `PRESENTATION_HOST_KEY` — a long random password you create for the presenter.
4. Redeploy the Vercel project.
5. Open the presenter deck once with `presentation.html?key=YOUR_PRESENTATION_HOST_KEY`. The key is saved for
   that browser tab and removed from the visible URL.
6. Share `audience.html`. There is no login, room code, nickname, or Join button.

The secret Supabase key is used only inside Vercel functions. It is never sent to the audience or presenter browser.

## Detected Classes

Clarity Labs is trained to identify:

- Blackheads
- Papules
- Pustules
- Whiteheads
- Nodules
- Dark spots

## Project Structure

```text
.
├── api
│   ├── _supabase.js
│   ├── advice.js
│   ├── detect.js
│   ├── presentation-responses.js
│   └── presentation-state.js
├── app.html
├── audience.html
├── IMG_6166.jpeg
├── index.html
├── presentation.html      # Unlisted presenter-only route
├── README.md
├── supabase-presentation.sql
└── vercel.json  

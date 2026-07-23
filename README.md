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

1. In Vercel Storage, connect an Upstash Redis database to this project. Vercel supplies
   `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically. The native Upstash names
   `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are also supported.
2. Add `AUDIENCE_BOARD_KEY` in Vercel — a long random password for the private control board.
3. Redeploy the Vercel project.
4. Present normally in Google Slides. Open the private control board once with
   `board.html?key=YOUR_AUDIENCE_BOARD_KEY`; the key is saved for that browser tab and removed from the URL.
5. Share `audience.html`, or let visitors use the Audience button on the homepage. There is no login,
   room code, nickname, or Join button.

The control board opens and closes one audience question at a time and shows submitted answers. It is not a
slideshow and is not linked from the public website. Open `wall.html` on the presentation screen to show audience
answers as they arrive.

The storage token and presenter key are used only inside Vercel functions.

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
│   ├── _kv.js
│   ├── advice.js
│   ├── audience-question.js
│   ├── audience-responses.js
│   └── detect.js
├── app.html
├── audience.html
├── board.html             # Unlisted audience control board
├── IMG_6166.jpeg
├── index.html
├── README.md
├── wall.html              # Full-screen audience response wall
└── vercel.json  

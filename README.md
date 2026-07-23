# Clarity Labs

Clarity Labs is a polished, browser-based skin analysis prototype that uses a trained computer-vision model to detect and classify visible blemishes from an uploaded photo.

Users can upload a clear photo, view detected blemishes with labels and bounding boxes, receive a neutral visible-activity summary, and generate a personalized skincare plan based on the analysis.

> Clarity Labs is an educational prototype and is not a medical diagnostic tool.

## Live Demo

[Launch Clarity Labs](https://anche-gamma.vercel.app)

## Features

- Upload and analyze a skin photo
- Detect blackheads, papules, pustules, whiteheads, nodules, and dark spots
- Display detected blemishes with labels and bounding boxes
- Count blemishes by type
- Summarize visible activity without presenting a medical severity rating
- Generate a personalized skincare routine
- Run a presenter-friendly guided deck with speaker-ready talk tracks
- Protect private API keys through serverless endpoints
- Work across desktop and mobile devices

## How It Works

### 1. Upload a Photo

Upload a clear, well-lit photo of the area you want to analyze.

### 2. Scan the Image

The computer-vision model scans the photo and identifies visible blemishes.

### 3. Review the Results

Clarity Labs displays each detected blemish, organizes the results by type, and summarizes visible activity.

### 4. Generate an Image-Grounded Plan

The same size-normalized photo and Roboflow detections are sent transiently to Groq Vision. Groq inspects the
visible distribution and image quality, reconciles those observations with the detector's classes and boxes, and
generates a photo-specific routine. The app does not save the uploaded image.

The deployment requires `ROBOFLOW_API_KEY` and `GROQ_API_KEY`. You can optionally set `GROQ_VISION_MODEL`; it
defaults to `qwen/qwen3.6-27b`.

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
│   ├── advice.js
│   └── detect.js
├── app.html
├── index.html
├── presentation.html
├── README.md
└── vercel.json  

# Clarity Labs

Clarity Labs is a polished, browser-based skin analysis prototype that uses a trained computer-vision model to detect and classify visible blemishes from an uploaded photo.

Users can upload a clear photo, view detected blemishes with labels and bounding boxes, receive an overall severity rating, and generate a personalized skincare plan based on the analysis.

> Clarity Labs is an educational prototype and is not a medical diagnostic tool.

## Live Demo

[Launch Clarity Labs](https://anche-gamma.vercel.app)

## Features

- Upload and analyze a skin photo
- Detect blackheads, papules, pustules, whiteheads, nodules, and dark spots
- Display detected blemishes with labels and bounding boxes
- Count blemishes by type
- Calculate an overall severity rating
- Generate a personalized skincare routine
- Protect private API keys through serverless endpoints
- Work across desktop and mobile devices

## How It Works

### 1. Upload a Photo

Upload a clear, well-lit photo of the area you want to analyze.

### 2. Scan the Image

The computer-vision model scans the photo and identifies visible blemishes.

### 3. Review the Results

Clarity Labs displays each detected blemish, organizes the results by type, and calculates an overall severity rating.

### 4. Generate a Plan

The detection results are used to generate a personalized skincare routine with ingredient and product-category guidance.

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
├── README.md
└── vercel.json  

# MediMatch

AI-powered medication and chronic illness companion.

## Overview

MediMatch helps people with chronic illnesses organize medications, track symptoms, and prepare for better conversations with healthcare providers.

## Tech stack

- Next.js frontend
- FastAPI backend
- PostgreSQL
- Docker

## Run locally

1. From the repo root, start Docker:
   ```bash
   docker compose up --build
   ```

2. Open the frontend at `http://localhost:3000` and backend at `http://localhost:8000`.

## Notes

- The app displays a health companion landing page.
- The backend exposes a simple `GET /api/health` endpoint.
- All AI-generated content pages include a disclaimer that this is educational information only and not medical advice.

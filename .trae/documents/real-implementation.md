# Real Implementation Guide

## Overview
- Frontend: React + Vite + shadcn UI
- Backend: Express server (`server/index.ts`) for hybrid image metadata analysis
- AI Provider: Groq (`meta-llama/llama-4-scout-17b-16e-instruct`)

## Environment
- Copy `.env.example` to `.env`
- Set `GROQ_API_KEY`

## Run
- Start backend: `node server/index.ts` (port 5000)
- Start frontend: `pnpm dev` (port 5173)

## Endpoint
- `POST /api/analyze-image`
  - Body: `multipart/form-data` with `image`
  - Returns: Final hybrid JSON envelope including `file_metadata`, `visual_analysis`, `summary`

## Authentication
- Server reads `GROQ_API_KEY` from environment; never hard-coded.

## Error Handling
- Validates presence of file and image mimetype
- Returns structured JSON errors with `success:false` and message

## Performance
- Streams Groq completions for responsive UX
- Limits frontend to max 5 images per run
- Uses `sharp` for efficient metadata extraction

## Frontend Integration
- `ImageExtraction.tsx` posts images to backend, maps final JSON into UI
- Accordion blocks render per-image and combined JSON with copy controls

## No Mocks
- All mock/fallback code paths removed; real calls only

## Notes
- For production, consider moving Groq calls to server only (already implemented) and adding rate limits.

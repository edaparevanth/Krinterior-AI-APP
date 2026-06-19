# KRINTERIOR AI – Product Requirements (Live)

## Overview
KRINTERIOR AI is a mobile-first interior design studio for Indian homes. Users upload
an empty room photo, pick a room type / budget / palette / requirements, and the app
returns a photorealistic furnished version, an Indian-rupee furniture estimate, a
space analysis, and a Vastu Shastra report with a 0–100 score.

## Stack
- Frontend: Expo SDK 54 (React Native) + Expo Router. Cream `#F2EBDD` background with Luxury Orange #FF7A00 accents.
- Typography: Playfair Display (serif) for headlines + Inter (sans) for body, loaded via @expo-google-fonts.
- Backend: FastAPI + MongoDB (motor) with JWT auth (bcrypt).
- AI:
  - Image generation/edit: Gemini Nano Banana (`gemini-3.1-flash-image-preview`) via Emergent LLM Key.
  - Text reasoning (cost / space / vastu): Gemini 2.5 Flash via Emergent LLM Key.

## Routes (frontend)
- `/(auth)/login`, `/(auth)/signup` – email/password
- `/(tabs)` – 5-slot tab bar: Home, Projects, [center create FAB], Ideas, Profile
- `/(tabs)/vastu` – Vastu screen (linked from home tile, hidden from tab bar)
- `/create` – 5-step wizard (Upload via camera/gallery → Room Type with image previews → Budget → Palette → Requirements → Generate)
- `/result` – Design Ready (before/after + furniture estimate + Vastu summary + Save)
- `/project/[id]` – Project detail (Design & Vastu tabs, rename/delete)

## Backend endpoints
- `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`, `PUT /api/auth/me`
- `POST /api/design/generate` – body: image_base64, room_type, budget, color_palette, requirements
- `POST /api/projects` – save
- `GET /api/projects` – list (no images, summary fields only)
- `GET /api/projects/{id}` – detail (incl images)
- `PATCH /api/projects/{id}` – rename
- `DELETE /api/projects/{id}`
- `POST /api/vastu/analyze` – body: project_id

## Models (Mongo)
- `users`: id, email (unique), password_hash, full_name, created_at
- `projects`: id, user_id, name, original_image (b64), generated_image (b64),
  room_type, budget, color_palette, requirements, furniture_estimate[], total_cost,
  vastu_score, vastu_report, space_analysis, created_at, updated_at

## Test credentials
See `/app/memory/test_credentials.md`.

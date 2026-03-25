# Everfracted Backend (Supabase)

## Setup
1. Install dependencies:
   - `npm install`
2. Create `.env` (see `.env.example`) with your Supabase keys.
3. In Supabase SQL editor, run `sql/schema.sql` to create tables.
4. Create a storage bucket named `uploads` (or update `SUPABASE_STORAGE_BUCKET`).

## Run
- `npm run dev`
- Backend runs at `http://localhost:8787`

## Endpoints
- `GET /health`
- `POST /uploads` (multipart form-data, field name `file`)
- `POST /blueprints` (JSON `{ name, data }`)
- `GET /blueprints`
- `POST /waitlist`
- `POST /contact`
- `POST /signup`

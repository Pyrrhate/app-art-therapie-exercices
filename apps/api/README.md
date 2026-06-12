# Art Thérapie API

Backend Next.js serverless. Voir le README racine du monorepo.

## Variables d'environnement

Copier `.env.example` vers `.env.local` et renseigner `HF_TOKEN`.

## Routes

- `GET /api/health`
- `POST /api/exercise/generate` — `{ impulse, technique }`
- `POST /api/reflection/analyze` — `{ imageBase64, impulse?, technique? }`

## Changer de provider IA

Définir `AI_PROVIDER=mistral` une fois `lib/ai/mistral.ts` implémenté.

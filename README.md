# Pastek Art — Art Thérapie

Application gratuite cross-platform (web, Android, iOS) pour un rituel créatif guidé par l'IA, avec stockage local-first.

## Fonctionnalités

- **Rituel** : impulsion → exercice IA + timer → capture & réflexion
- **4 amorces** : Ping-Pong, Palette intérieure, Explorateur émotionnel, Nuances
- **Fil créatif** : mémoire automatique des pratiques (export PDF, backup JSON)
- **Mode secours** : exercices et réflexions hors ligne si l'API est indisponible

## Démarrage rapide

```bash
npm install
cp apps/api/.env.example apps/api/.env.local
# HF_TOKEN dans apps/api/.env.local
cp apps/mobile/.env.example apps/mobile/.env
```

```bash
npm run dev          # API + mobile
npm run typecheck    # Vérification TypeScript
npm run test         # Tests unitaires (shared + API)
```

## Structure

| Dossier | Rôle |
|---------|------|
| `apps/mobile` | Expo + NativeWind (Expo Router) |
| `apps/api` | Next.js 15 — IA Hugging Face |
| `packages/shared` | Types, techniques, mots-clés partagés |

Voir [ARCHITECTURE.md](./ARCHITECTURE.md), [SUPPORT.md](./SUPPORT.md) (bouton soutien), [DEPLOY.md](./DEPLOY.md).

## CI

Chaque push sur `main` exécute typecheck, lint et tests (`.github/workflows/ci.yml`).

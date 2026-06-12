# Art Thérapie — MVP

Application gratuite et cross-platform (PC, Mac, Android, iOS) pour un rituel créatif guidé par l'IA, avec stockage 100 % local.

## Démarrage rapide

### Prérequis

- Node.js ≥ 20
- Compte [Hugging Face](https://huggingface.co/) avec token d'inférence

### Installation

```bash
npm install
cp apps/api/.env.example apps/api/.env.local
# Renseigner HF_TOKEN dans apps/api/.env.local
cp apps/mobile/.env.example apps/mobile/.env
# Renseigner EXPO_PUBLIC_API_URL (ex: http://localhost:3000)
```

### Lancer en développement

```bash
# Backend seul
npm run api

# App mobile seule
npm run mobile

# Les deux en parallèle
npm run dev
```

## Structure

Voir [ARCHITECTURE.md](./ARCHITECTURE.md) pour le schéma complet.

| App | Chemin | Rôle |
|-----|--------|------|
| Mobile | `apps/mobile` | Expo + NativeWind — 3 écrans du rituel |
| API | `apps/api` | Next.js serverless — IA + rate limiting |

## Écrans du rituel

1. **L'Impulsion** — saisie du thème + choix de la technique
2. **Exercice & Timer** — exercice IA + timer circulaire doux
3. **Capture & Réflexion** — photo, analyse empathique, sauvegarde locale

## API

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/health` | GET | Santé du backend |
| `/api/exercise/generate` | POST | Génère un exercice d'art-thérapie |
| `/api/reflection/analyze` | POST | Réflexion empathique sur l'œuvre |

## Licence

Projet personnel — MVP gratuit.

# Architecture — Art Thérapie (MVP)

## Vue d'ensemble

Application **local-first** de rituel créatif en 3 écrans, avec inférence IA déléguée à un backend serverless. Aucune base de données centralisée : tout le contenu utilisateur reste sur l'appareil.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENTS (Expo / React Native)                   │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────────┐   ┌─────────┐ │
│  │ Impulse  │ →  │ Exercice +   │ →  │ Capture +       │   │ Param.  │ │
│  │ (S1)     │    │ Timer (S2)   │    │ Réflexion (S3)  │   │ Soutien │ │
│  └──────────┘    └──────────────┘    └─────────────────┘   └─────────┘ │
│       │                  │                      │                       │
│       │    AsyncStorage / SQLite (local)        │                       │
│       └──────────────────┴──────────────────────┘                       │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ HTTPS (JSON)
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    BACKEND (Next.js App Router — Vercel)                │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────────┐ │
│  │ Rate Limiter    │  │ AI Provider      │  │ Fallbacks statiques     │ │
│  │ (IP / token)    │  │ (interface)      │  │ (exercices, réflexions) │ │
│  └────────┬────────┘  └────────┬─────────┘  └────────────┬────────────┘ │
│           │                    │                           │              │
│           └────────────────────┼───────────────────────────┘              │
│                                ▼                                          │
│                    ┌───────────────────────┐                              │
│                    │ HuggingFaceProvider   │  ← MVP (gratuit)             │
│                    │ (Llama-3, LLaVA)      │                              │
│                    └───────────────────────┘                              │
│                    ┌───────────────────────┐                              │
│                    │ MistralProvider       │  ← futur (payant, EU)        │
│                    │ (placeholder)         │                              │
│                    └───────────────────────┘                              │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
                    Hugging Face Inference API
                    (clé HF_TOKEN côté serveur uniquement)
```

## Structure monorepo

```
app-art-therapie-exercices/
├── package.json                 # workspaces npm
├── ARCHITECTURE.md
├── README.md
├── .env.example
├── apps/
│   ├── mobile/                  # Expo + NativeWind + Expo Router
│   │   ├── app/                 # routes file-based
│   │   ├── components/
│   │   ├── lib/                 # api client, storage, types
│   │   └── constants/
│   └── api/                     # Next.js 15 App Router
│       ├── app/api/
│       │   ├── exercise/generate/route.ts
│       │   ├── reflection/analyze/route.ts
│       │   └── health/route.ts
│       └── lib/
│           ├── ai/              # providers modulaires
│           ├── rate-limit.ts
│           └── fallbacks.ts
```

## Flux de données

### 1. Génération d'exercice (S1 → S2)

```
Mobile                          API                           HF
  │ POST /api/exercise/generate   │                             │
  │ { impulse, technique }        │                             │
  ├──────────────────────────────►│ rate limit OK?              │
  │                               ├────────────────────────────►│ text gen
  │                               │◄────────────────────────────┤
  │◄──────────────────────────────┤ { exercise, durationMin }   │
  │  ou fallback statique         │                             │
```

### 2. Réflexion sur l'œuvre (S3)

```
Mobile                          API                           HF
  │ POST /api/reflection/analyze  │                             │
  │ { imageBase64, context }      │                             │
  ├──────────────────────────────►│ rate limit OK?              │
  │                               ├────────────────────────────►│ vision LLM
  │◄──────────────────────────────┤ { reflection, questions }   │
```

### 3. Sauvegarde locale (S3)

Aucun appel réseau. `AsyncStorage` stocke : impulse, technique, exercice, photo URI, réflexion, date.

## Sécurité & robustesse

| Principe | Implémentation |
|----------|----------------|
| Clés API | `HF_TOKEN` uniquement dans `apps/api/.env` |
| Rate limiting | Map en mémoire par IP (MVP) ; Redis/Upstash en prod |
| Dégradation gracieuse | `fallbacks.ts` si quota HF ou erreur réseau |
| Modularité IA | Interface `AIProvider` → swap HF ↔ Mistral sans toucher les routes |

## Évolutions prévues

- **Monétisation** : composant `SupportButton` (mock) → Ko-fi / Stripe
- **IA payante** : implémenter `MistralProvider` dans `lib/ai/mistral.ts`
- **Persistance avancée** : migrer AsyncStorage → SQLite (`expo-sqlite`)
- **Déploiement API** : Vercel (défaut) ou Cloudflare Workers (adapter handlers)

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Mobile | Expo SDK 52, Expo Router, NativeWind 4, TypeScript |
| Backend | Next.js 15 App Router, TypeScript |
| Storage client | `@react-native-async-storage/async-storage` |
| Caméra | `expo-image-picker` |
| Audio timer | `expo-av` |
| IA MVP | Hugging Face Serverless Inference |

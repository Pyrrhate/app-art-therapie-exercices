# Déploiement web (Expo → Vercel)

L'app mobile et la **version web** partagent le même code (`apps/mobile`).  
L'**API** reste sur un projet Vercel séparé (`apps/api`).

## Architecture recommandée

| Service | Domaine | Projet Vercel | Root Directory |
|---------|---------|---------------|----------------|
| **App web** | `app.pastek-art.eu` ou `www.pastek-art.eu` | `art-therapie-web` | `apps/mobile` |
| **API** | `pastek-art.eu` | projet existant | `apps/api` |

> Pour mettre l'app sur **pastek-art.eu** à la racine, déplacez l'API sur `api.pastek-art.eu` puis attachez le domaine principal au projet web.

---

## 1. Nouveau projet Vercel (web)

1. Vercel → **Add New Project** → même repo GitHub
2. **Root Directory** : `apps/mobile`
3. Framework : **Other** (détecté via `vercel.json`)
4. **Output Directory** : `dist` (déjà dans `vercel.json`)
5. Ne pas modifier Install / Build Command (déjà dans `vercel.json`)

## 2. Variables d'environnement (projet web)

| Variable | Valeur |
|----------|--------|
| `EXPO_PUBLIC_API_URL` | `https://pastek-art.eu` |

## 3. Domaine

Vercel → projet web → **Settings → Domains** :

- `app.pastek-art.eu` (recommandé)

## 4. CORS côté API

Sur le **projet API** Vercel, mettre à jour `ALLOWED_ORIGINS` :

```
http://localhost:8081,http://localhost:8082,http://localhost:19006,https://pastek-art.eu,https://app.pastek-art.eu,https://www.pastek-art.eu
```

Redéployer l'API après modification.

## 5. Déployer

```cmd
git push origin main
```

Ou build local pour tester :

```cmd
cd C:\Users\guill\OneDrive\Documents\app-art-therapie-exercices
set EXPO_PUBLIC_API_URL=https://pastek-art.eu
npm run mobile:web:export
```

Les fichiers statiques sont dans `apps/mobile/dist/` — ouvrir `dist/index.html` ou servir avec `npx serve apps/mobile/dist`.

## 6. Vérifier

1. Ouvrir `https://app.pastek-art.eu` → écran d'accueil Art Thérapie
2. Paramètres → **Connexion API** → « Connecté »
3. Lancer un rituel complet (exercice + photo + réflexion)

---

## Dépannage

| Problème | Solution |
|----------|----------|
| Page blanche | Console navigateur ; vérifier que `dist/` contient `index.html` |
| API inaccessible | `EXPO_PUBLIC_API_URL` + `ALLOWED_ORIGINS` sur Vercel API |
| 404 en rafraîchissant une route | `rewrites` dans `apps/mobile/vercel.json` (déjà configuré) |
| Build échoue | Node 22 ; logs Vercel ; `npm run mobile:web:export` en local |

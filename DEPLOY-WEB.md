# Déploiement web (Expo → Vercel)

L'app mobile et la **version web** partagent le même code (`apps/mobile`).

## Architecture (domaines)

| Service | Domaine | Projet Vercel | Root Directory |
|---------|---------|---------------|----------------|
| **App web** | `pastek-art.eu` (+ `www`) | `art-therapie-web` | `apps/mobile` |
| **API** | `api.pastek-art.eu` | projet API existant | `apps/api` |

---

## 1. Projet Vercel — API (`apps/api`)

1. Projet existant → **Settings → Domains**
2. Retirer `pastek-art.eu` de l'API (si présent)
3. Ajouter **`api.pastek-art.eu`**
4. Mettre à jour **`ALLOWED_ORIGINS`** :

```
http://localhost:8081,http://localhost:8082,http://localhost:19006,https://pastek-art.eu,https://www.pastek-art.eu
```

5. Redéployer l'API

Test : `https://api.pastek-art.eu/api/health` → `{"status":"ok",...}`

---

## 2. Projet Vercel — Web (`apps/mobile`)

1. **Add New Project** → même repo GitHub
2. **Root Directory** : `apps/mobile`
3. Framework : **Other** (`vercel.json` gère le build)
4. Variable d'environnement :

| Variable | Valeur |
|----------|--------|
| `EXPO_PUBLIC_API_URL` | `https://api.pastek-art.eu` |

5. **Settings → Domains** :
   - `pastek-art.eu` (domaine principal)
   - `www.pastek-art.eu` → redirection vers `pastek-art.eu` (option Vercel)

6. Deploy

Test : `https://pastek-art.eu` → écran d'accueil Art Thérapie

---

## 3. DNS (chez votre registrar)

| Type | Nom | Valeur |
|------|-----|--------|
| CNAME | `api` | `cname.vercel-dns.com` (ou valeur indiquée par Vercel) |
| A / CNAME | `@` | Vercel (pour `pastek-art.eu`) |
| CNAME | `www` | `cname.vercel-dns.com` |

Les enregistrements exacts sont affichés dans Vercel → Domains pour chaque projet.

---

## 4. Déployer

```cmd
git push origin main
```

Build local :

```cmd
set EXPO_PUBLIC_API_URL=https://api.pastek-art.eu
npm run mobile:web:export
```

Fichiers générés : `apps/mobile/dist/`

---

## 5. Vérifier

1. `https://api.pastek-art.eu/api/health` → OK
2. `https://pastek-art.eu` → app web
3. Paramètres → **Connexion API** → « Connecté »
4. Rituel complet (exercice + photo + réflexion)

---

## Dépannage

| Problème | Solution |
|----------|----------|
| App OK mais API en échec | `EXPO_PUBLIC_API_URL=https://api.pastek-art.eu` sur le projet **web** |
| Erreur CORS | `ALLOWED_ORIGINS` sur le projet **API** doit inclure `https://pastek-art.eu` |
| `pastek-art.eu` affiche du JSON | Le domaine pointe encore vers l'API — le déplacer vers le projet web |
| 404 au refresh | `rewrites` dans `apps/mobile/vercel.json` (déjà configuré) |

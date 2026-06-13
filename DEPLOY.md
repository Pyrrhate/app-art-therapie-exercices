# Déploiement API (Vercel)

## 1. Prérequis

- Compte [Vercel](https://vercel.com)
- Repo GitHub connecté : `Pyrrhate/app-art-therapie-exercices`

## 2. Importer le projet

1. Vercel → **Add New Project** → sélectionner le repo
2. **Root Directory** : `apps/api` (important pour le monorepo)
3. Framework : Next.js (détecté automatiquement)

## 3. Variables d'environnement

Dans Vercel → Settings → Environment Variables :

| Variable | Valeur |
|----------|--------|
| `HF_TOKEN` | Votre token HF (permission Inference Providers) |
| `AI_PROVIDER` | `huggingface` |
| `HF_TEXT_MODEL` | `meta-llama/Llama-3.1-8B-Instruct` |
| `HF_VISION_MODEL` | `llava-hf/llava-1.5-7b-hf` |
| `ALLOWED_ORIGINS` | `*` pour le MVP, ou vos URLs Expo |

## 4. Déployer

Push sur `main` → déploiement automatique.

URL obtenue : `https://votre-projet.vercel.app`

## 5. Connecter l'app mobile

Dans `apps/mobile/.env` :

```env
EXPO_PUBLIC_API_URL=https://votre-projet.vercel.app
```

Relancez Expo (`npm run mobile`).

## 6. Vérifier

```powershell
Invoke-RestMethod -Uri "https://votre-projet.vercel.app/api/health"
```

Réponse attendue : `status: ok`

---

## Dépannage — erreur `404: NOT_FOUND` (Vercel)

Si vous voyez une page **grise Vercel** avec :

```
404: NOT_FOUND
Code: NOT_FOUND
ID: cdg1::...
```

Ce n'est **pas** un bug de l'app : **Vercel ne trouve aucun déploiement** pour ce domaine.

### Causes fréquentes

| Cause | Solution |
|-------|----------|
| **Root Directory incorrect** | Vercel → Project → Settings → General → **Root Directory** = `apps/api` |
| **Build échoué** | Vercel → Deployments → ouvrir le dernier → lire les **Build Logs** |
| **Domaine mal relié** | Vercel → Project → Settings → Domains → le domaine doit pointer **ce** projet |
| **Repo pas à jour** | Pousser le code sur GitHub (`git push`) pour redéployer |
| **Mauvaise URL testée** | Tester `/api/health` pas seulement la page d'accueil |

### Checklist Vercel (monorepo)

1. **Import** du repo `app-art-therapie-exercices`
2. **Root Directory** : `apps/api` ← **crucial**
3. **Framework Preset** : Next.js (détecté auto)
4. **Output Directory** : **laisser VIDE** (ne pas mettre `api` ni `.next`)
5. **Build Command** : laisser par défaut ou `npm run build` (voir `apps/api/vercel.json`)
6. **Install Command** : `cd ../.. && npm install`
7. **Environment Variables** : `HF_TOKEN`, etc.
8. **Deploy** → statut **Ready** (vert)
9. Tester : `https://VOTRE-DOMAINE/api/health`

### Erreur « No Output Directory named "api" »

Vercel cherche un dossier `api` qui n'existe pas. Cause : **Output Directory** mal renseigné dans les réglages.

**Correction :**
1. Vercel → Project → **Settings** → **Build & Deployment**
2. **Output Directory** → **Override** → effacer / laisser **vide**
3. **Root Directory** → `apps/api`
4. **Redeploy**

### Test rapide

- ✅ OK : `{"status":"ok","provider":"huggingface",...}`
- ❌ 404 Vercel gris : déploiement ou domaine mal configuré
- ❌ 500 : build OK mais erreur runtime (variables env manquantes)

---

# Test sur téléphone (réseau local)

Si l'API tourne sur votre PC (`npm run api`) :

1. Trouvez votre IP : `ipconfig` → IPv4 (ex. `192.168.1.42`)
2. `apps/mobile/.env` :

```env
EXPO_PUBLIC_API_URL=http://192.168.1.42:3000
```

3. `apps/api/.env.local` — ajoutez l'origine Expo :

```env
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006,exp://192.168.1.42:8081
```

4. PC et téléphone sur le **même Wi‑Fi**
5. Paramètres de l'app → **Connexion API** doit afficher « Connecté »

# Fix Vercel — erreur apps/api/apps/api

## Diagnostic

Erreur :
```
Next.js output directory "apps/api" was not found at
/vercel/path0/apps/api/apps/api
```

Le chemin est **doublé** : Vercel est déjà dans `apps/api` (Root Directory), puis cherche **encore** `apps/api` (Output Directory).

```
/vercel/path0/apps/api   ← Root Directory (OK)
              /apps/api  ← Output Directory (MAUVAIS — à supprimer)
```

---

## Réglages Vercel exacts

**Project → Settings → Build and Deployment**

| Paramètre | Valeur |
|-----------|--------|
| **Root Directory** | `apps/api` |
| **Framework Preset** | Next.js |
| **Output Directory** | **Override DÉSACTIVÉ** — champ **vide** |
| **Install Command** | Override activé → `cd ../.. && npm install` |
| **Build Command** | Override activé → `npm run build` |

### Important

- Ne mettez **jamais** `apps/api` dans **Output Directory**
- Ne mettez **pas** `.next` dans Output Directory (Next.js gère tout seul)
- Si un toggle **Override** est activé sur Output Directory → **désactivez-le**

Cliquez **Save**, puis **Deployments → Redeploy**.

---

## Variables d'environnement (Settings → Environment Variables)

```
HF_TOKEN=hf_...
AI_PROVIDER=huggingface
HF_TEXT_MODEL=meta-llama/Llama-3.1-8B-Instruct
HF_VISION_MODEL=Qwen/Qwen2.5-VL-7B-Instruct:fastest
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:8082,http://localhost:19006,https://pastek-art.eu,https://www.pastek-art.eu
```

---

## Test après deploy Ready (vert)

```
https://VOTRE-DOMAINE/api/health
```

Attendu : `{"status":"ok",...}`

---

## Si ça échoue encore — repartir propre

1. Vercel → **Add New Project** (nouveau projet, même repo)
2. À l'import, cliquer **Edit** à côté de Root Directory → `apps/api`
3. **Ne toucher à aucun autre champ** (surtout pas Output Directory)
4. Ajouter les variables env
5. Deploy

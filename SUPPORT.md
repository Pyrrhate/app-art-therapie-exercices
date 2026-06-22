# Soutien financier — Pastek Art

Le bouton **« Soutenir le projet »** (paramètres) ouvre une URL externe configurée par variable d'environnement.

## Option recommandée : Ko-fi

1. Créez un compte sur [ko-fi.com](https://ko-fi.com).
2. Choisissez une page (ex. `https://ko-fi.com/votrepseudo`).
3. Ajoutez dans `apps/mobile/.env` :

```env
EXPO_PUBLIC_SUPPORT_URL=https://ko-fi.com/votrepseudo
```

4. Sur **Vercel** (projet web) : ajoutez la même variable dans *Settings → Environment Variables*, puis redéployez.

5. Test local : relancez `npm run mobile:web` après modification du `.env`.

## Alternatives

| Service | URL type | Variable |
|---------|----------|----------|
| Buy Me a Coffee | `https://buymeacoffee.com/votrepseudo` | `EXPO_PUBLIC_SUPPORT_URL` |
| Stripe Payment Link | `https://buy.stripe.com/...` | idem |
| PayPal.me | `https://paypal.me/votrepseudo` | idem |

## Comportement

- Si `EXPO_PUBLIC_SUPPORT_URL` est **absente** : message d'information (pas de crash).
- **Mobile** : `Linking.openURL`.
- **Web** : nouvel onglet.

## Optionnel : `app.json`

Vous pouvez aussi définir `extra.supportUrl` dans `apps/mobile/app.json` pour les builds Expo sans `.env`.

```json
{
  "expo": {
    "extra": {
      "supportUrl": "https://ko-fi.com/votrepseudo"
    }
  }
}
```

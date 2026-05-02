# Roll in Love — Site officiel

Site vitrine + carte du coffee shop **Roll in Love** à Saint-Jean-de-Monts.
Stack légère, vanilla : HTML, CSS, JavaScript. Multilingue FR/EN. Admin via Decap CMS.

## 📁 Structure

```
Roll-in-love/
├── index.html              # Page principale
├── css/styles.css          # Styles (fonts, layout, responsive)
├── js/
│   ├── i18n.js             # Système de traduction FR/EN
│   ├── menu.js             # Charge data/menu.json et rend la carte
│   ├── testimonials.js     # Charge data/testimonials.json
│   └── main.js             # Tabs, animations, drag-scroll
├── lang/
│   ├── fr.json             # Toutes les chaînes UI en français
│   └── en.json             # Toutes les chaînes UI en anglais
├── data/
│   ├── menu.json           # Carte (FR + EN), éditable via admin
│   └── testimonials.json   # Avis clients, éditable via admin
├── admin/
│   ├── index.html          # Interface Decap CMS
│   └── config.yml          # Configuration des collections
├── assets/
│   ├── fonts/              # Scripter (woff + woff2)
│   └── images/             # Logos, photos, hero, stories
└── netlify.toml            # Config Netlify (headers, cache)
```

## 🚀 Lancer en local

Le site doit être servi par un serveur HTTP (les `fetch()` ne marchent pas en `file://`).

```bash
cd "/Users/louisonbobin/Desktop/Roll-in-love"

# Option 1 — Python (déjà installé sur macOS)
python3 -m http.server 8000

# Option 2 — Node
npx serve .

# Option 3 — Live Server (VS Code) → clic droit sur index.html > "Open with Live Server"
```

Puis ouvre [http://localhost:8000](http://localhost:8000).

## 🌍 Multilingue (FR / EN)

- Le sélecteur **FR / EN** est dans la barre de navigation.
- La langue est détectée à la première visite (browser) puis stockée en `localStorage`.
- Tous les textes statiques sont dans `lang/fr.json` et `lang/en.json`.
- Le menu est dans `data/menu.json` avec des champs `{ "fr": "...", "en": "..." }` pour chaque nom et description.

### Ajouter une chaîne traduite

1. Dans le HTML, ajouter `data-i18n="section.cle"` sur l'élément (ou `data-i18n-html` si la valeur contient du HTML).
2. Dans `lang/fr.json` et `lang/en.json`, ajouter la clé sous la section correspondante.

Exemple :
```html
<button data-i18n="hero.ctaCommander">Commander</button>
```
```json
// fr.json
"hero": { "ctaCommander": "Commander" }
// en.json
"hero": { "ctaCommander": "Order" }
```

## 🌐 Déploiement Vercel

### Étape 1 — Importer le repo dans Vercel

1. https://vercel.com/new → "Import Git Repository" → choisir `roll-n-love`
2. Framework preset : **Other** (site statique)
3. Root directory : `.`
4. **Deploy** → tu obtiens une URL `https://xxx.vercel.app`

Le `vercel.json` à la racine gère déjà :
- Headers de sécurité (X-Frame-Options, X-Content-Type-Options…)
- Cache long pour `/assets`, court pour `/data` et `/lang`
- Rewrite `/admin` → `/admin/index.html`

À chaque `git push` sur `main`, Vercel redéploie automatiquement.

### Étape 2 — Activer l'admin Decap CMS (OAuth GitHub)

L'admin est sur `https://ton-site.vercel.app/admin`. Pour qu'il fonctionne en prod, il faut authentifier l'utilisateur via GitHub OAuth.

**a. Créer une GitHub OAuth App**
1. Va sur https://github.com/settings/developers → "OAuth Apps" → "New OAuth App"
2. Application name : `Roll in Love Admin`
3. Homepage URL : `https://ton-site.vercel.app`
4. Authorization callback URL : `https://ton-site.vercel.app/api/callback`
5. "Register application" → tu obtiens un **Client ID** + tu peux générer un **Client Secret**

**b. Ajouter les variables d'env dans Vercel**
1. Vercel → ton projet → "Settings" → "Environment Variables"
2. Ajouter :
   - `OAUTH_CLIENT_ID` = ton Client ID GitHub
   - `OAUTH_CLIENT_SECRET` = ton Client Secret GitHub
3. Cocher tous les environnements (Production, Preview, Development)
4. **Save**, puis **Redeploy** depuis l'onglet Deployments

**c. Mettre à jour `admin/config.yml`**
Remplacer les 3 `REPLACE_ME.vercel.app` par ton vraie URL Vercel, puis :
```bash
git add admin/config.yml && git commit -m "wire admin to vercel url" && git push
```

**d. Tester l'admin**
1. Va sur `https://ton-site.vercel.app/admin`
2. Clique "Login with GitHub"
3. Tu autorises l'app → tu peux éditer la carte / avis / traductions !

### Comment marche l'OAuth

- `api/auth.js` redirige vers github.com/login/oauth/authorize avec ton Client ID
- GitHub renvoie l'utilisateur sur `api/callback.js?code=...`
- `callback.js` échange le code contre un access_token (avec ton Client Secret côté serveur)
- Le token est passé à Decap CMS via `postMessage`, qui l'utilise pour commit sur ton repo

Aucun secret n'est exposé côté client.

### Champs éditables via l'admin

- **La Carte** : nom/description/prix de chaque item (FR + EN), badges Bio, logo Vendée, image
- **Avis Clients** : ajouter/supprimer/modifier les témoignages
- **Traductions UI** : éditer les chaînes de l'interface

## 🔧 Personnalisation rapide

- **Couleurs** : variables CSS en haut de `css/styles.css` (`--cream`, `--brown`, etc.)
- **Police** : `assets/fonts/Scripter-Regular.woff2`
- **Images** : remplacer dans `assets/images/`
- **Horaires / téléphone / email** : `lang/fr.json` (clés `contact.*`) + JSON-LD dans `index.html`

## ✅ TODO si tu veux aller plus loin

- [ ] Optimiser les images (les PNG font 2 MB chacun → passer en WebP avec [squoosh.app](https://squoosh.app), gain ~10×)
- [ ] Acheter le domaine `roll-in-love.fr` et le brancher sur Vercel (Project Settings → Domains)
- [ ] Brancher un formulaire de contact via [Formspree](https://formspree.io) ou [Web3Forms](https://web3forms.com)

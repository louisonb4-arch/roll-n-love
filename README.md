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

## ✏️ Page admin (Decap CMS)

L'admin est sur `/admin`. Il permet de modifier la carte, les avis et les traductions sans toucher au code, **directement dans le navigateur**.

### Comment ça marche

- Decap CMS est un client JS (déjà chargé via CDN dans `admin/index.html`).
- Il commit les changements directement sur GitHub via Netlify Identity + Git Gateway.
- À chaque commit, Netlify redéploie automatiquement le site.

### Activer l'admin (étapes one-shot)

1. **Pousser le projet sur GitHub** :
   ```bash
   cd "/Users/louisonbobin/Desktop/Roll-in-love"
   git init
   git add .
   git commit -m "Initial commit — Roll in Love"
   gh repo create roll-in-love --public --source=. --push
   # ou manuellement : créer le repo sur github.com puis git remote add origin ... && git push
   ```

2. **Connecter à Netlify** :
   - Aller sur [app.netlify.com](https://app.netlify.com) → "Add new site" → "Import from Git"
   - Choisir le repo `roll-in-love`
   - Build settings : laisser vide (déjà géré par `netlify.toml`)
   - Deploy → tu obtiens une URL `https://xxx.netlify.app`

3. **Activer Netlify Identity** (pour l'auth admin) :
   - Dans Netlify → site → "Site configuration" → "Identity" → **Enable Identity**
   - "Registration preferences" → choisir **Invite only** (sinon n'importe qui peut s'inscrire)
   - "Services" → "Git Gateway" → **Enable Git Gateway**
   - Inviter ton email : "Identity" → "Invite users" → ton email

4. **Mettre à jour `admin/config.yml`** :
   - Remplacer `REPLACE_ME_OWNER/REPLACE_ME_REPO` par ton vrai repo GitHub (uniquement si tu utilises le mode `github` au lieu de `git-gateway`).
   - Mettre à jour `site_url` et `display_url` avec ton URL Netlify.
   - Commit + push.

5. **Ajouter le widget Identity dans index.html** (optionnel mais recommandé pour gérer l'invitation) :
   ```html
   <script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
   ```

6. **Aller sur `https://ton-site.netlify.app/admin`** :
   - Cliquer "Login with Netlify Identity"
   - Tu peux maintenant éditer la carte, les avis et les traductions.

### Champs éditables

- **La Carte** : modifier nom/description/prix de chaque item (FR + EN), badges Bio, logo Vendée, image de fond
- **Avis Clients** : ajouter/supprimer/modifier les témoignages des deux lignes
- **Traductions UI** : éditer les chaînes de l'interface (nav, boutons, titres, etc.)

## 🌐 Déploiement Netlify

Le `netlify.toml` configure tout :
- Le site est servi depuis la racine
- Headers de sécurité (X-Frame-Options, etc.)
- Cache long pour `/assets`, court pour `/data` et `/lang`

**Une fois connecté à GitHub** : chaque push sur `main` redéploie automatiquement.

## 🔧 Personnalisation rapide

- **Couleurs** : variables CSS en haut de `css/styles.css` (`--cream`, `--brown`, etc.)
- **Police** : `assets/fonts/Scripter-Regular.woff2`
- **Images** : remplacer dans `assets/images/`
- **Horaires / téléphone / email** : `lang/fr.json` (clés `contact.*`) + JSON-LD dans `index.html`

## ✅ TODO si tu veux aller plus loin

- [ ] Ajouter `<script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>` dans `index.html` pour gérer les invitations
- [ ] Optimiser les images (les PNG font 2 MB chacun → passer en WebP avec [squoosh.app](https://squoosh.app), gain ~10×)
- [ ] Brancher un formulaire de contact sur Netlify Forms (juste ajouter `data-netlify="true"` sur un `<form>`)
- [ ] Acheter le domaine `roll-in-love.fr` et le brancher sur Netlify

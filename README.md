# Roll in Love — Site officiel

Site vitrine + carte du coffee shop **Roll in Love**, 32 rue Neuve à Saint-Jean-de-Monts.
Statique, sans framework ni étape de build : HTML, CSS et JavaScript écrits à la main.

En ligne : <https://rollinlove.com>

## 📁 Structure

```
roll-n-love/
├── index.html              # Page d'accueil — SEULE SOURCE DE VÉRITÉ du contenu.
│                           # Styles dans un <style> en tête, scripts en bas de <body>,
│                           # police Scripter intégrée en base64 (évite un FOUT).
├── mentions-legales.html   # Pages légales, partagent legal.css
├── confidentialite.html
├── legal.css               # Styles des seules pages légales
├── css/intro.css           # Animation d'ouverture « Le O de ROLL »
├── js/intro.js             # idem — composant isolé, aucune dépendance
├── assets/
│   ├── fonts/              # Scripter (woff + woff2), utilisées par legal.css
│   └── images/             # Toutes les images du site, en WebP
│       ├── favicon-32.png  # icônes et image de partage : PNG/JPEG, pas WebP
│       ├── apple-touch-icon.png
│       ├── og-image.jpg    # 1200×630, sans transparence
│       └── src/            # sources non compressées, NON versionnées (voir plus bas)
├── robots.txt
├── sitemap.xml
└── vercel.json             # en-têtes de sécurité et de cache
```

## ⚠️ Où se modifie le contenu

**Tout est dans `index.html`.** La carte, les prix, les avis, les horaires et les textes y
sont écrits en dur. Il n'y a **ni back-office, ni fichier de données, ni système de
traduction** : ils ont existé, mais ne pilotaient rien et ont été retirés le 7 août 2026
(voir `LEGAL-TODO.md` § 5.2).

Concrètement :

- modifier un prix ou un produit → chercher son nom dans `index.html` ;
- ajouter un avis → dupliquer un bloc `.testi-card` dans la rangée voulue ;
- changer les horaires → deux endroits, le bloc visible **et** le JSON-LD en tête de page.

Le site est **monolingue (français)**. Il n'y a pas de sélecteur de langue.

## 🚀 Lancer en local

Aucune dépendance à installer. Un simple serveur HTTP suffit :

```bash
cd /Users/louisonbobin/roll-n-love
python3 -m http.server 8000
```

Puis <http://localhost:8000>.

L'animation d'ouverture ne joue **qu'une fois par session**. Pour la revoir :
ajouter `?intro` à l'URL, ou taper `RollInLoveIntro.replay()` dans la console.
Elle ne joue pas du tout si le système est réglé sur « animations réduites ».

Elle vise le O de ROLL imprimé sur la tasse de la photo d'accueil : ses coordonnées
dans `hero-bg.webp` (desktop) et `hero.webp` (mobile) sont écrites dans `MUG_O`,
en tête de `js/intro.js`. **Si l'une de ces photos change, remesurer ces valeurs**,
sinon la spirale se posera à côté. Après toute modification de `css/intro.css` ou
`js/intro.js`, changer le `?v=` de leurs deux références dans `index.html`
(`vercel.json` les garde 24 h en cache).

## 🖼️ Régénérer les images

Les sources non compressées vivent dans `assets/images/src/`, **volontairement hors git**
(elles pèsent 18 Mo). Elles restent récupérables dans l'historique :

```bash
git show a7feaa8~1:rolls.png > assets/images/src/rolls.png
```

Les WebP sont dimensionnés à environ **2× la largeur d'affichage réellement mesurée** dans
le navigateur, ce qui reste net sur écran haute densité sans transporter d'inutile. Les
largeurs cibles et la qualité par image sont documentées dans le commit `7bd32d2`.

> Les fichiers ne portent pas d'empreinte dans leur nom. `vercel.json` les met donc en
> cache **30 jours** et non un an : une image remplacée sous le même nom met au pire un
> mois à se propager. Pour un remplacement immédiat, changer aussi le nom du fichier.

## 🌐 Déploiement

Projet statique sur Vercel, aucune commande de build. À chaque `git push` sur `main`,
Vercel redéploie.

`vercel.json` gère les en-têtes de sécurité (`X-Frame-Options`, `X-Content-Type-Options`,
`Referrer-Policy`, `Permissions-Policy`) et le cache : un an immuable pour les polices,
30 jours pour les images, revalidation systématique pour le HTML.

## ✅ Ce qui reste à faire

- [ ] **Bloc hébergeur des mentions légales** — obligatoire (art. 6 III-1 LCEN), le site
      est en ligne et les quatre champs sont vides. Voir `LEGAL-TODO.md` § 1.2.
- [ ] **Capital social** et **directeur de la publication** — manquants, voir § 1.1.
- [ ] Licence de la webfont Scripter à obtenir, ou remplacer la police.
- [ ] `index.html` affiche « © 2025 » alors que les pages légales portent « © 2026 ».

## 🔒 CSP — scripts inline hashés

La `Content-Security-Policy` (dans `vercel.json`) autorise les deux scripts inline
d'`index.html` par **hash sha256**. Si on modifie le moindre caractère d'un
`<script>…</script>` inline, il faut recalculer son hash et le remplacer dans la CSP :

```bash
python3 -c "
import re, hashlib, base64
html = open('index.html', encoding='utf-8').read()
for m in re.finditer(r'<script(?![^>]*src=)([^>]*)>(.*?)</script>', html, re.S):
    if 'ld+json' in m.group(1): continue
    print('sha256-' + base64.b64encode(hashlib.sha256(m.group(2).encode()).digest()).decode())
"
```

Symptôme d'un hash périmé : onglets de la carte morts + erreur CSP dans la console.

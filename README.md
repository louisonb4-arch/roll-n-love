# Roll in Love — site unifié

Coffee shop & cinnamon rolls, 32 rue Neuve, 85160 Saint-Jean-de-Monts — https://rollinlove.com
Fusion de `roll-n-love` (site en ligne) et `roll-V2` (refonte « Le Glaçage »). Vanilla HTML/CSS/JS, aucune dépendance front, déployé sur Vercel.

## DA — « Le tourbillon »
- Le O du logo (coupe d'un cinnamon roll) est le signe : l'intro le fait atterrir dans le O du logo de la hero, où la vraie photo d'un roll s'ouvre.
- Palette marque : crème `#FFEEDC`, chocolat `#42200C`, caramel `#D89048` (décor uniquement), cannelle `#9A4E1C` (accent texte).
- Fraîcheur : couleurs réelles des boissons (ube `#C9B6EC`, ruby `#F6B9C6`, matcha `#BFD39A`, yuzu `#F8D56E`), une par famille de la carte.
- Typo : Scripter (titres, prix, annotations) + Karla variable (texte). Auto-hébergées, subset FR.
- Code Instagram : polaroïds et annotations manuscrites fléchées qui s'écrivent au trait.
- Mouvement : jamais de rebond, jamais de zoom sur une photo (clip-path, masques, translations).

## Contraste (WCAG)
Brun/crème 12,8 · texte secondaire `#6B4A36` 7,0 · cannelle 5,3 · brun sur ube/ruby/matcha/yuzu ≥ 7,8. Caramel jamais en texte sur crème (2,3).
axe-core : 0 violation sur toutes les pages (390 et 1440 px).

## Structure
```
src/*.html, src/_partials/   sources des pages (à modifier ici)
*.html                       pages GÉNÉRÉES (ne pas modifier)
assets/css/{commons,components,ui,modules}/  sources CSS → assets/css/site.css (généré, minifié)
assets/js/{core,ui,modules}/ JS, chargé à la demande (data-ui / data-module), 1:1 avec le CSS
tools/                       build, images, favicons/OG, serveur de dev
```

## Commandes
```bash
python3 tools/build.py          # après toute modif de src/, assets/css/ ou assets/js/
python3 tools/build-images.py   # après tout changement de photo (sources hors dépôt)
python3 tools/build-brand.py    # favicons + image de partage
node tools/dev-server.mjs 8790  # http://localhost:8790 (URL propres, 404)
```
Revoir l'intro : `?intro` dans l'URL (sinon une fois par session).

## Contact
Pas de réservation ni de formulaire : téléphone (02 59 15 26 97) et e-mail (roll.inlove@outlook.com) dans « Nous trouver », le menu et le pied de page.
Horaires : vendredi, samedi, dimanche 10h–18h (une seule source pour le statut en direct : `assets/js/core/hours.js`, à garder alignée avec les pages et le JSON-LD).

## Checklist livraison
RGPD (confidentialite) ✓ · CGU ✓ · mentions légales ✓ · images AVIF/WebP + srcset ✓ · Lighthouse mobile 94/97/100/100, desktop 99/94→100/100 ✓ · aucune clé ni API côté navigateur (le site n'en utilise pas) ✓ · contraste ✓ · HTTPS (HSTS + upgrade) ✓ · responsive 360→1440 ✓ · bandeau cookies (Accepter/Refuser égaux) ✓ · 404 ✓ · meta title/description ✓ · OG 1200×630 ✓ · favicons ✓ · sitemap/robots ✓ · alt ✓ · liens vérifiés ✓ · Vercel Web Analytics après consentement ✓ · un seul CTA (« Nous trouver », dans la hero) ✓ · formulaire retiré à la demande du client (pas d'anti-spam/validation à prévoir)

## À compléter (voir LEGAL-TODO.md)
Capital social, RCS, directrice de la publication, médiateur, crédits photos & droit à l'image, licence web Scripter, source/date des avis.

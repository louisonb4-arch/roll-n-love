# LEGAL-TODO — Roll in Love, coffee shop & cinnamon rolls

> **Ne pas mettre en ligne avant d'avoir traité la section 1.**
> État au 17 juillet 2026. Aucune donnée n'a été inventée : tout ce qui n'a pas pu être
> vérifié à une source est marqué `[à fournir]` et apparaît **en surbrillance rose sur le
> site lui-même**, exprès — pour qu'un trou se voie au lieu de se combler avec une
> supposition.

> ⚠️ **Ce site n'est pas comme les autres sites du lot.** Il **mesure réellement son
> audience** (Vercel Web Analytics) et il a un **back-office** avec authentification. Les
> formules « zéro cookie, zéro traceur, ce site ne sait rien de vous » employées ailleurs
> **ne s'appliquent pas ici** et n'ont pas été reprises. Voir § 1.3 et § 4.

---

## 1. Bloquant avant la mise en ligne

### 1.1 Identité de l'éditrice (`mentions-legales.html`)

| Donnée | État |
|---|---|
| Capital social | **manquant** — obligatoire pour une SARL, ne figure dans aucun registre public |
| RCS | **à confirmer** — « RCS La Roche-sur-Yon 995 367 380 » est la forme attendue (greffe compétent pour la Vendée), non vérifiée à la source. ⚠️ **Ce n'est pas Nantes.** |
| Directeur de la publication | **manquant** — la société a **deux gérantes** (Nelly Burgot, Héloïse Georgeaux) : laquelle assume la fonction ? |
| E-mail | **à confirmer** — `roll.inlove@outlook.com` est repris de la page Contact du site. Confirmer que c'est bien l'adresse de contact légal (elle sert aussi au bloc accessibilité et à l'exercice des droits RGPD). |
| Téléphone | **à confirmer** — `02 59 15 26 97`, repris de la page Contact du site. |

Le rattachement au registre est **solide** : dénomination `ROLL IN LOVE` + siège `32 rue Neuve,
85160 Saint-Jean-de-Monts` = adresse exacte de l'établissement affichée sur le site. Deux
gérantes, ce qui recoupe le « aventure mère-fille » de la section À Propos. Aucune ambiguïté
d'entité.

### 1.2 Hébergeur (article 6 III-1 LCEN — obligatoire)

Nom, adresse, téléphone et site de l'hébergeur. **Le site n'est pas déployé** (aucun dossier
`.vercel`, aucun domaine, `admin/config.yml` contient encore `https://REPLACE_ME.vercel.app`),
donc les quatre champs sont vides dans `mentions-legales.html`, et la durée de conservation des
journaux est vide dans `confidentialite.html`.

Le projet est **configuré pour Vercel** (`vercel.json`, `/api/`, `@vercel/analytics`), mais tant
que le déploiement n'a pas eu lieu, l'affirmer serait une supposition. **Conséquence en chaîne :
si l'hébergeur final n'est pas Vercel, toute la section « mesure d'audience » de
`confidentialite.html` tombe** (le script `/_vercel/insights/script.js` ne fonctionne que sur
Vercel) et doit être réécrite.

### 1.3 🔴 Vercel Web Analytics — le point à trancher, et il n'est pas mince

`index.html` charge `<script defer src="/_vercel/insights/script.js">`. **C'est un véritable
outil de mesure d'audience.** Il a été audité le 17 juillet 2026 en lisant le **script de
production réel** (2,5 Ko), et non la documentation.

**Ce qui est établi (vérifié dans le code) :**

- **aucun cookie**, aucun `localStorage`, `sessionStorage`, `indexedDB`, aucun canvas/WebGL ;
- script et endpoints **first-party** : `/_vercel/insights/script.js` et `/_vercel/insights/view`,
  même origine. Aucune requête vers un domaine tiers ;
- payload envoyé : `location.href` **complet** (query string incluse), `document.referrer`
  **complet** (et seulement si le référent est externe au site), horodatage, version du script ;
- l'**IP** et l'**User-Agent** ne sont pas dans le payload mais sont nécessairement reçus par
  Vercel avec la requête ; pays / ville / navigateur / OS en sont dérivés **côté serveur** ;
- **`enableCookie` n'est pas appelé** sur ce site → le mode cookie optionnel de Vercel est
  **inactif**. (À savoir : ce mode dépose `vc-session-id`, **Max-Age 400 jours ≈ 13,1 mois**,
  soit au-dessus du plafond CNIL de 13 mois. Une seule ligne de JS l'activerait.) ;
- **aucun événement personnalisé**, aucun paramètre UTM : seules les pages vues sont comptées.
  C'est la configuration la plus sobre possible de cet outil.

**Pourquoi ce n'est pas exempté « les yeux fermés » — les critères qui coincent :**

| Critère CNIL (outil d'auto-évaluation, juillet 2025) | Vercel Web Analytics |
|---|---|
| Empreinte : composante propre au site + composante temporelle | 🟢 **OK** — le domaine est un intrant (empreinte différente d'un site à l'autre), rotation quotidienne documentée. **C'est le point fort du dossier.** |
| **Référent limité au domaine (« host »)** | 🔴 `document.referrer` est transmis **en entier**, chemin et query compris |
| **IP pseudonymisée (au moins le dernier octet retiré)** | 🔴 **jamais documenté par Vercel** ; « not tied to an IP address » ≠ « IP tronquée » |
| **DPA art. 28 qualifiant le prestataire de sous-traitant** | 🔴 **le DPA Vercel ne s'applique qu'aux plans Pro et Enterprise — pas en Hobby** |
| **Aucune réutilisation pour le compte propre du prestataire** | 🔴 le DPA range les « Service-Generated Data » (usage data et metadata) hors sous-traitance et autorise Vercel à les utiliser pour « improve the Services », « benchmarking ». **Vercel ne dit nulle part si les données Web Analytics en font partie.** |
| Aucune mise en commun des données brutes entre clients | ⚪ non déclaré, non vérifiable |
| Données conservées ≤ 25 mois | 🔴 Vercel : « **may store your data for longer periods** » → **aucune durée maximale garantie** (Hobby : 1 mois consultable, Pro : 12 mois, Plus/Enterprise : 24 mois — mais c'est une fenêtre de *consultation*, pas de *conservation*) |
| Statistiques agrégées à la dizaine | 🔴 compteurs exacts, aucune analyse d'anonymat publiée |
| **Droit d'opposition sous forme de lien dans la politique de confidentialité** | 🔴 **aucun mécanisme fourni par Vercel — à construire** |

**Deux points de doctrine à ne pas se cacher :**

1. **« Pas de cookie » ≠ « hors article 82 ».** Les lignes directrices EDPB 2/2023 (§55, version
   finale d'octobre 2024) considèrent que la collecte d'une IP **provenant de l'équipement
   terminal** suffit à déclencher l'article 5(3) ePrivacy — dont l'article 82 LIL est la
   transposition — **sauf à démontrer le contraire**, ce qui est impossible à garantir en IPv6.
   Être dans le champ n'impose pas une bannière (§56 : l'exemption mesure d'audience reste
   ouverte), mais **déplace la question** : elle n'est pas « y a-t-il un cookie ? » mais « les
   critères d'exemption sont-ils réunis ? ».
2. **Anonymisation ou pseudonymisation ?** Vercel écrit « the recording of data points is
   anonymous ». Au regard de l'avis G29 05/2014 (WP216), un **hachage, même salé, est une
   pseudonymisation**, pas une anonymisation : l'empreinte permet l'*individualisation*
   (« singling out ») pendant 24 h, et Vercel, qui détient l'IP à la réception, peut la
   recalculer. Les données brutes restent donc des **données à caractère personnel** (ce que la
   CNIL confirme : délibération 2020-091 §52 — « les traitements de mesure d'audience sont des
   traitements de données à caractère personnel soumis à l'ensemble des dispositions du RGPD »).
   → **Le mot « anonyme » n'a volontairement pas été employé dans `confidentialite.html`.**

**🔴 Et le point de contexte le plus important :** depuis le **1er janvier 2026**, la CNIL **ne
publie plus** de liste de solutions exemptées (l'ancienne liste — Matomo configuré, AT
Internet/Piano, Wysistat… — a été supprimée). Le régime est désormais l'**auto-évaluation par le
fournisseur**, qui doit remettre une attestation à ses clients ; **en cas de contrôle, c'est
l'éditeur du site qui doit prouver la conformité de son outil**. Or **Vercel n'a publié aucune
auto-évaluation ni aucune attestation**, et ne documente pas les éléments nécessaires (sel de
l'empreinte, troncature IP, mise en commun). Vercel Web Analytics n'a par ailleurs **jamais**
figuré sur l'ancienne liste.

**➜ Décision à prendre par le client, pas par nous. Quatre options :**

1. **Passer le projet Vercel en plan Pro** (~20 $/mois) → débloque le **DPA art. 28** et les
   **clauses contractuelles types**. **C'est le correctif le moins cher et le plus décisif :
   en plan Hobby, il n'y a ni contrat de sous-traitance, ni encadrement du transfert vers les
   États-Unis.** À faire dans tous les cas si l'outil est conservé.
2. **Garder l'outil sans bannière**, en assumant l'intérêt légitime (art. 6.1.f) → il faut alors
   **ajouter un lien d'opposition** dans `confidentialite.html` (exigé par la grille CNIL 2025),
   documenter une balance des intérêts, et accepter une zone grise argumentée.
3. **Poser un dispositif de consentement** avant chargement du script (refus aussi simple que
   l'acceptation, rien avant consentement) → sécurise, mais dégrade la mesure et l'expérience.
4. **Retirer Vercel Web Analytics** (supprimer les deux `<script>` de `index.html` et la
   dépendance `@vercel/analytics`) → le site retombe alors à **zéro traceur**, et
   `confidentialite.html` peut être considérablement simplifiée. **C'est l'option la plus sûre**
   si la mesure d'audience n'a pas d'usage réel pour la maison.

> En l'état, `confidentialite.html` **décrit l'outil exactement, nomme Vercel, et écrit noir sur
> blanc que la base légale est à trancher**. Elle n'affirme aucune conformité. Ce texte est
> publiable tel quel, mais les `[à trancher]` doivent être résolus.

### 1.4 Police Scripter — licence non documentée

Le site utilise **une seule famille : Scripter**, déjà **auto-hébergée** (`Scripter-Regular.woff2`,
24 Ko, statique). **Aucun appel à Google Fonts nulle part** — vérifié, rien à rapatrier.

**Mais** : le fichier de police ne contient **aucune mention de licence** (champs `License` et
`License URL` absents du binaire). Métadonnées relevées :

- Famille : **Scripter** · Version 1.000
- Designer : **Alper Çakıcı** (`www.alpercakici.com`)
- Fonderie : **UmkaType** (`www.dribbble.com/alpercakici`)

Scripter **n'appartient pas au catalogue Google Fonts** : on ne peut donc pas présumer une SIL
OFL 1.1 comme pour les autres sites du lot. **Le droit d'incorporation sur un site commercial
(licence webfont) doit être vérifié auprès de la fonderie avant la mise en ligne.** Beaucoup de
polices de ce type sont distribuées en « free for personal use », ce qui ne couvrirait pas un
usage commercial. Marqué `[licence à confirmer]` dans `mentions-legales.html`.

### 1.5 Photographies — auteur inconnu

**Aucun crédit photo ne figure sur le site** et l'auteur des images (`apropos-1..7.jpg`, visuels
produits) n'est documenté nulle part. Marqué `[auteur à fournir]`. À préciser : qui a pris les
photos, et l'étendue des droits cédés (support, durée, territoire). Les personnes reconnaissables
doivent avoir donné leur autorisation au titre du droit à l'image.

> À noter : le fichier `631630406_17846686161684224_3822756230731339928_n.jpg` traîne à la racine
> — c'est un nom de fichier d'export **Instagram**. Il n'est utilisé par aucune page, mais il
> suggère que des visuels proviennent du compte Instagram : la provenance mérite d'être clarifiée.

### 1.6 Avis clients — article L111-7-2 du code de la consommation

La section « Avis Clients » affiche **une vingtaine de témoignages nominatifs** (« Zoé G. »,
« Carole G. »…) **codés en dur dans `index.html`**. Leur source et leur date ne sont indiquées
nulle part.

L'article L111-7-2 impose d'indiquer **si les avis font l'objet d'un contrôle, les modalités de
ce contrôle, et la date de publication de chaque avis**. S'ils sont repris de Google, il faut le
dire. Marqué `[source et date des avis à préciser]` dans `mentions-legales.html`.

### 1.7 Marques et logo « Produit de Vendée »

La carte cite **Kinder, Snickers, Oreo, KitKat, Dammann Frères, Seijaku** — traité par une
section « Marques citées » (citation informative, pas de partenariat allégué).

En revanche, le fichier `logovendee.png` **reproduit un logo** sur 4 produits de la carte
(Vendée Limonade, Vendée Cola, Vendée Diabolo, Le Vendéen). **Reproduire un logo n'est pas le
citer** : le droit d'usage ou la charte du titulaire doit être vérifié. Marqué
`[droit d'usage du logo à confirmer]`.

Le nom « Roll in Love » lui-même : **aucun dépôt INPI vérifié** → marqué
`[dépôt de marque à confirmer]`. Il est utilisé comme nom commercial, ce qui n'emporte pas
protection à titre de marque.

### 1.8 Pas de domaine → pas de `sitemap.xml`

**Aucun `sitemap.xml`, aucun `robots.txt`, aucune balise `canonical`, aucun `og:url` n'existe sur
ce site.** Le seul domaine évoqué est `roll-in-love.fr`, cité dans le `README.md` comme une
tâche **à faire** (« Acheter le domaine roll-in-love.fr et le brancher sur Vercel ») — **il n'est
pas déposé**.

**Aucun sitemap n'a donc été créé** : il aurait fallu inventer un domaine. À créer une fois le
domaine arrêté, en y incluant `mentions-legales.html` et `confidentialite.html` (`priority` 0.2,
`lastmod` 2026-07-17).

### 1.9 Vérifier avant publication

```bash
grep -rn "à fournir\|à confirmer\|à trancher\|à mettre en place" *.html   # ne doit plus rien renvoyer
```

---

## 2. Ce qui a été vérifié (et n'est donc pas à redemander)

Relevé le **17 juillet 2026** au registre national des entreprises via l'API publique
`recherche-entreprises.api.gouv.fr` :

- Dénomination : **ROLL IN LOVE**
- Forme : **SARL** (code INSEE 5499 — société à responsabilité limitée)
- Siège : **32 rue Neuve, 85160 Saint-Jean-de-Monts**
- SIREN : **995 367 380** · SIRET siège : **995 367 380 00012**
- TVA : **FR26995367380**
- APE : **56.10C — Restauration de type rapide**
- Immatriculation : **17 décembre 2025**
- Gérantes : **Nelly Burgot**, **Héloïse Georgeaux**
- Greffe compétent : **La Roche-sur-Yon** (Vendée)
- État administratif : **actif**

Repris du site lui-même (à confirmer, § 1.1) : téléphone **02 59 15 26 97**, e-mail
**roll.inlove@outlook.com**, horaires **tous les jours 10h–22h**.

**Pas de section « Vente d'alcool »** : la carte a été passée en revue (rolls, boissons chaudes,
boissons froides, sandwichs, glaces) — **aucune boisson alcoolisée**. La section n'a donc pas
lieu d'être. Une section **« Allergènes »** a été ajoutée à la place : elle, elle a un objet réel
(règlement UE 1169/2011).

---

## 3. Pages légales : ce qui a été créé, et ce qui ne l'a pas été

### Créées

| Page | Pourquoi |
|---|---|
| `mentions-legales.html` | Obligatoire (art. 6 III LCEN) pour tout site édité par une société. |
| `confidentialite.html` | **Ici, elle a un objet réel** : le site mesure son audience. Contient la section cookies (ancre `#cookies`) et la section audience (ancre `#audience`). |
| `legal.css` | Feuille de style des deux pages, dans la DA du site (crème/cannelle, Scripter, cœurs). `index.html` a son CSS en ligne et n'est pas touché. |
| `.vercelignore` | Voir § 5. |

### Volontairement non créées

| Page | Pourquoi pas |
|---|---|
| **CGV** | Ce site ne vend rien : ni panier, ni paiement, ni réservation. Les prix de la carte sont informatifs. Aucune CGV n'existe par ailleurs chez le client (pas d'ancien site). |
| **CGU** | Aucun compte visiteur, aucun contenu déposé par l'utilisateur, aucun service interactif. Sans objet. |
| **Droit de rétractation** | Pas de vente à distance depuis ce site. |
| **`sitemap.xml`** | Pas de domaine déposé — voir § 1.8. Aurait exigé d'inventer une donnée. |
| **Bannière de consentement** | Voir § 1.3 et § 4 : **question ouverte, pas une réponse**. |

---

## 4. Cookies, traceurs, données — le constat réel

### Ce que le site fait, mesuré le 17 juillet 2026

| | |
|---|---|
| Cookies déposés | **aucun** — vérifié dans le code du script de production ; `enableCookie` n'est pas appelé |
| Stockage local | **aucun** sur les pages publiques |
| **Mesure d'audience** | **OUI — Vercel Web Analytics** (pages vues uniquement). Voir § 1.3 |
| Requêtes vers des tiers **au chargement** | **aucune** — vérifié : les seules URL externes restantes dans `index.html` sont trois `href` (Instagram, Google Maps, Vokum), qui exigent un clic |
| Polices | **auto-hébergées** — aucun appel à `fonts.googleapis.com` / `fonts.gstatic.com` nulle part |
| Formulaires | **aucun** |
| Comptes utilisateurs (visiteurs) | **aucun** |
| Newsletter | **aucune** |
| Paiement | **aucun** |
| **Back-office** | **OUI — `/admin`, OAuth GitHub.** Voir § 6 |

### 🔴 Ce qui a été retiré : l'iframe Google Maps

`index.html` intégrait une **carte Google Maps en `<iframe>`** dans la section Contact. Une iframe
Maps transmet l'**IP du visiteur à Google dès l'ouverture de la page**, sans consentement — c'est
exactement le grief des sanctions « Google Fonts », et cela **imposait une bannière**.

Elle a été **remplacée par un lien sortant** « Ouvrir l'itinéraire » vers Google Maps
(`target="_blank" rel="noopener noreferrer"`), présenté dans une carte à la DA du site (crème,
bordure beige, coins arrondis, même ombre, même hauteur de 300 px). **Rien n'est chargé depuis
Google tant que le visiteur ne clique pas.** C'est ce qui permet d'écrire honnêtement « aucune
requête tierce au chargement ».

> **À signaler au client** : l'URL de l'ancienne iframe était de toute façon **douteuse** — son
> identifiant de lieu (`0x48028e3b9d9f4b6b:0x9e0e5a5a5a5a5a5a`, motif `5a5a5a…` répété)
> ressemble à un **placeholder**, et ses coordonnées (46.7947, -2.0547) tombent à **environ 1 km**
> du siège réel relevé au registre (46.7871, -2.0726). **La carte ne pointait probablement pas le
> bon endroit.** Le lien de remplacement utilise l'adresse postale, pas des coordonnées.
>
> **Si le client tient absolument à une carte intégrée**, il faut alors une bannière de
> consentement avec chargement différé de l'iframe. C'est un arbitrage à lui soumettre.

### Pourquoi il n'y a pas de bannière aujourd'hui

Parce que **rien n'est écrit ni lu dans le terminal du visiteur** : aucun cookie, aucun stockage
local, aucune ressource tierce. Ce n'est pas un oubli, c'est le résultat de choix techniques
(police auto-hébergée, iframe Maps retirée, aucun widget).

**Mais cette position n'est pas complète tant que le § 1.3 n'est pas tranché**, et
`confidentialite.html` le dit explicitement au lieu de le masquer. **Ne jamais écrire « aucun
traceur » ni « ce site ne sait rien de vous » sur ce site : ce serait faux.**

**Ce qui déclencherait l'obligation d'une bannière :**

- activer `window.va('enableCookie')` (cookie de 400 jours) ;
- **remettre l'iframe Google Maps** ;
- brancher un formulaire de contact via **Formspree** ou **Web3Forms** — ce que le `README.md`
  liste comme une tâche à venir. Ce jour-là, `confidentialite.html` devra décrire le formulaire,
  son sous-traitant, la base légale et la durée de conservation ;
- ajouter Google Analytics, un pixel Meta, une vidéo ou un widget Instagram ;
- recharger les polices depuis Google Fonts.

---

## 5. Anomalies techniques trouvées en chemin

### 5.1 `index_4.html` — maquette abandonnée, déployable, avec l'iframe Google

`index_4.html` (2 Mo) traîne à la racine, **est suivie par git**, n'est référencée par aucune
page, et **contient toujours l'iframe Google Maps**. Sans exclusion, elle serait servie
publiquement à `/index_4.html` : indexable, sans pages légales, et **transmettant l'IP des
visiteurs à Google** — contredisant ce qu'affirme `confidentialite.html`.

**Un `.vercelignore` a été créé** pour la retirer du déploiement. **Le fichier n'a pas été
supprimé.** À trancher : la supprimer proprement du dépôt, ou la garder hors ligne.

### 5.2 🟠 Le back-office ne pilote rien

`admin/config.yml` (Decap CMS) écrit dans `data/menu.json`, `data/testimonials.json` et
`lang/*.json`. **Or `index.html` ne lit aucun de ces fichiers** : la carte, les avis et les
traductions y sont **codés en dur**. Aucun `fetch()`, aucune référence à `css/styles.css` ni à
`js/*.js` — `index.html` est un fichier autonome où tout est inliné (y compris les images, en
base64, d'où ses 2 Mo).

**Conséquence : si la cliente modifie la carte depuis `/admin`, rien ne changera sur le site.**
Le `README.md` décrit une architecture (`css/`, `js/`, `lang/`, `data/`) qui **n'est plus celle du
site**. Ce n'est pas un problème juridique, mais c'est un problème réel à remonter.

### 5.3 🟠 Back-office non configuré, et un point de sécurité

- `admin/config.yml` contient encore `base_url: https://REPLACE_ME.vercel.app` et
  `site_url: https://REPLACE_ME.vercel.app` → **le back-office ne fonctionne pas en l'état**.
- `api/callback.js` transmet le jeton d'accès GitHub via
  `window.opener.postMessage(message, '*')` — **origine cible en joker**. Le jeton (scope
  `repo,user`, large) pourrait être lu par toute fenêtre ayant ouvert la page. **À restreindre à
  l'origine du site.** Ce n'est pas un manquement RGPD, c'est une faiblesse de sécurité.
- `api/callback.js` **ne pose aucun cookie de session** (vérifié : aucun `Set-Cookie`) — c'est ce
  qui est écrit dans `confidentialite.html`.
- `admin/index.html` charge Decap CMS depuis **`unpkg.com`** (CDN tiers). Cela ne concerne que
  `/admin` : **aucune page publique ne charge quoi que ce soit depuis unpkg**. Décrit comme tel
  dans `confidentialite.html`, sans le cacher.

### 5.4 Incohérences mineures

- **`index.html` affiche « © 2025 Roll in Love »** alors que la société est immatriculée en
  décembre 2025, que le site annonce « Ouverture 2026 » et que nous sommes en 2026. Les pages
  légales portent « © 2026 ». **Non corrigé** (contenu éditorial existant) — à trancher par le
  client, mais l'incohérence est visible entre les pages.
- Les images existent **en double** : à la racine (utilisées par `index.html`) et dans
  `assets/images/` (utilisées par personne). Idem pour la police. Poids mort, sans effet légal.
- `README.md` : « Optimiser les images (les PNG font 2 MB chacun) » — toujours d'actualité,
  `index.html` pèse 2 Mo.

---

## 6. Le back-office, du point de vue des données

Décrit honnêtement dans `confidentialite.html`, section « Le back-office ». En résumé :

- `/admin` est une interface **réservée à l'exploitante**, non destinée aux visiteurs ;
- l'authentification passe par **OAuth GitHub** (`/api/auth` → GitHub → `/api/callback`) : les
  identifiants sont saisis **chez GitHub**, jamais sur ce site ;
- **aucun cookie de session n'est posé par ce site** ;
- la page `/admin` est **publiquement atteignable** (elle se charge), mais l'accès au contenu
  suppose des droits sur le dépôt GitHub. Il ne faut donc pas écrire « inaccessible au public » —
  la formule retenue est « réservé à l'exploitante, non accessible au public », ce qui décrit
  l'autorisation, pas l'inatteignabilité de l'URL ;
- **`confidentialite.html` n'écrit pas « aucun compte utilisateur »** tout court, mais « aucun
  compte utilisateur **pour les visiteurs** ». La nuance est voulue.

---

## 7. À vérifier après la mise en ligne

- [ ] `grep -rn "à fournir\|à confirmer\|à trancher\|à mettre en place" *.html` ne renvoie plus rien
- [ ] **Le § 1.3 est tranché** et `confidentialite.html` est mise à jour en conséquence
- [ ] **Le projet Vercel est en plan Pro** (sinon : pas de DPA, pas de CCT — voir § 1.3)
- [ ] Le bloc hébergeur est rempli (art. 6 III-1 LCEN)
- [ ] La licence webfont de Scripter est obtenue ou la police est remplacée
- [ ] `sitemap.xml` et `robots.txt` créés, pointant le vrai domaine
- [ ] `admin/config.yml` : `REPLACE_ME` remplacé par l'URL réelle
- [ ] `api/callback.js` : `postMessage` restreint à l'origine du site
- [ ] `/index_4.html` renvoie bien **404** en production (test du `.vercelignore`)
- [ ] Onglet Réseau : aucune requête tierce au chargement de l'accueil
- [ ] `document.cookie` est vide sur l'accueil (⚠️ à tester **sur le site déployé** : en local,
      `/_vercel/insights/script.js` renvoie 404 et le script ne s'exécute pas. Noter aussi que le
      script **s'auto-désactive** si `navigator.webdriver` est vrai — un navigateur automatisé ne
      le verra jamais s'exécuter. Tester à la main.)
- [ ] Le site est déclaré dans Google Search Console
- [ ] La fiche Google Business est cohérente avec les horaires du site (10h–22h, tous les jours)

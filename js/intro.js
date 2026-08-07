/* ==========================================================================
   Roll in Love — Animation d'ouverture « Le roll se déroule »
   Composant isolé, sans dépendance : le projet est en HTML/CSS/JS vanilla
   (aucun framework, aucune librairie d'animation installée — package.json ne
   contient que @vercel/analytics). L'animation s'appuie donc sur CSS +
   requestAnimationFrame, conformément à la stack existante.

   Chargé en <head> SANS defer : la classe html.intro-active doit être posée
   avant le premier rendu, sinon la page apparaît une fraction de seconde
   avant l'overlay. Le pré-voile crème (css/intro.css) tient l'écran pendant
   que le DOM se construit ; l'overlay le remplace ensuite sans transition
   visible (même crème).

   Étapes : point → spirale dessinée dans le sens horaire → logo officiel
   révélé par masque vertical → cœur → signature → disque qui s'ouvre sur la
   hero (« la page s'ouvre depuis l'intérieur du roll »).
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ config
     frequency : 'session' (défaut) | 'daily' | 'always'
     speed     : multiplicateur global des durées (1 = référence)
     Rejouer manuellement : ajouter ?intro à l'URL, ou en console
     RollInLoveIntro.replay().

     ⚠️ confidentialite.html décrit nommément ce que ce fichier inscrit dans le
     navigateur du visiteur, et sur quel fondement (article 82, exception du
     service expressément demandé). En l'état, un seul marqueur est posé :
     rollinlove-intro-seen, dans le sessionStorage, effacé à la fermeture de
     l'onglet.

     Passer frequency à 'daily' bascule sur le localStorage, donc sur un
     stockage PERSISTANT — la page de confidentialité deviendrait fausse et
     devrait être mise à jour dans le même commit. 'always' n'écrit rien.
     -------------------------------------------------------------------------- */
  var CONFIG = {
    frequency: 'session',
    storageKey: 'rollinlove-intro-seen',
    speed: 1
  };

  /* ---------------------------------------------------------------- timeline
     `at` = départ en ms depuis le début, `dur` = durée de l'étape.
     Modifier une durée : changer la valeur ici (les transitions CSS lisent
     ces nombres via les variables --rl-d-*). Tout accélérer / ralentir :
     CONFIG.speed. Total actuel : ouverture terminée à 2 730 ms.
     -------------------------------------------------------------------------- */
  var TL = {
    seed:   { at:    0, dur:  260 },   /* le point de pâte apparaît          */
    spiral: { at:  140, dur: 1000 },   /* la spirale se dessine, sens horaire */
    settle: { at: 1140, dur:  300 },   /* stabilisation, sans rebond          */
    logo:   { at:  720, dur:  700 },   /* ROLL IN LOVE, masque vertical       */
    heart:  { at: 1150, dur:  450 },   /* petit cœur de l'identité            */
    sign:   { at: 1300, dur:  600 },   /* « Le roll fond, le cœur aussi. »    */
    open:   { at: 1950, dur:  780 },   /* le disque s'ouvre sur la hero       */
    end:    { at: 2850 }               /* overlay retiré du DOM               */
  };

  /* marges de sécurité autour du chargement de logo.png (voir play()) */
  var LOGO_WAIT_MAX = 700;      /* attente maximale de l'image      */
  var LOGO_MIN_VISIBLE = 500;   /* temps de lecture minimal du logo */

  var SPIRAL_PATH = 'M101.20 100.00 C101.46 100.08 101.72 100.22 101.94 100.41 C102.17 100.60 102.37 100.85 102.54 101.13 C102.70 101.41 102.82 101.74 102.88 102.09 C102.95 102.45 102.96 102.83 102.91 103.23 C102.86 103.63 102.75 104.04 102.57 104.45 C102.39 104.86 102.14 105.26 101.83 105.64 C101.52 106.01 101.14 106.37 100.70 106.68 C100.26 106.99 99.76 107.25 99.22 107.46 C98.67 107.67 98.07 107.81 97.44 107.88 C96.81 107.95 96.14 107.95 95.46 107.86 C94.78 107.77 94.09 107.60 93.40 107.33 C92.71 107.07 92.03 106.71 91.38 106.26 C90.73 105.81 90.11 105.28 89.55 104.65 C88.98 104.03 88.47 103.32 88.04 102.54 C87.61 101.76 87.25 100.91 86.98 100.00 C86.72 99.09 86.56 98.13 86.50 97.13 C86.44 96.13 86.50 95.10 86.67 94.07 C86.85 93.03 87.14 91.98 87.56 90.96 C87.98 89.94 88.52 88.94 89.18 87.99 C89.85 87.04 90.63 86.14 91.52 85.32 C92.42 84.50 93.42 83.76 94.52 83.13 C95.61 82.49 96.80 81.97 98.06 81.57 C99.32 81.18 100.65 80.91 102.02 80.79 C103.39 80.67 104.80 80.70 106.21 80.88 C107.63 81.06 109.05 81.40 110.45 81.91 C111.84 82.41 113.21 83.07 114.51 83.89 C115.81 84.71 117.04 85.68 118.18 86.79 C119.31 87.91 120.34 89.16 121.24 90.54 C122.15 91.92 122.91 93.41 123.52 95.00 C124.12 96.59 124.57 98.27 124.83 100.00 C125.09 101.73 125.17 103.52 125.06 105.33 C124.94 107.13 124.63 108.95 124.12 110.74 C123.61 112.53 122.90 114.29 122.00 115.98 C121.10 117.67 120.00 119.29 118.72 120.79 C117.45 122.30 115.99 123.68 114.38 124.91 C112.78 126.15 111.01 127.22 109.13 128.11 C107.25 129.00 105.25 129.70 103.17 130.18 C101.09 130.66 98.93 130.93 96.75 130.96 C94.56 131.00 92.34 130.80 90.14 130.36 C87.94 129.92 85.75 129.24 83.65 128.33 C81.54 127.41 79.50 126.26 77.59 124.89 C75.67 123.52 73.88 121.93 72.26 120.15 C70.65 118.37 69.20 116.39 67.96 114.26 C66.73 112.13 65.70 109.85 64.93 107.46 C64.15 105.06 63.62 102.56 63.35 100.00 C63.09 97.44 63.10 94.83 63.38 92.22 C63.67 89.61 64.24 87.00 65.08 84.45 C65.93 81.91 67.05 79.43 68.44 77.07 C69.83 74.71 71.48 72.48 73.37 70.43 C75.26 68.37 77.39 66.50 79.71 64.85 C82.03 63.21 84.55 61.79 87.22 60.65 C89.88 59.51 92.69 58.64 95.59 58.07 C98.49 57.50 101.48 57.24 104.49 57.29 C107.50 57.34 110.53 57.71 113.51 58.41 C116.50 59.10 119.44 60.12 122.26 61.44 C125.08 62.77 127.79 64.41 130.32 66.33 C132.85 68.25 135.19 70.45 137.29 72.90 C139.40 75.35 141.26 78.05 142.83 80.93 C144.40 83.81 145.68 86.89 146.63 90.09 C147.58 93.29 148.20 96.62 148.46 100.00 C148.72 103.38 148.63 106.82 148.17 110.24 C147.71 113.66 146.89 117.05 145.71 120.35 C144.53 123.65 142.99 126.85 141.12 129.87 C139.24 132.90 137.04 135.75 134.54 138.36 C132.03 140.96 129.24 143.32 126.20 145.38 C123.16 147.44 119.89 149.19 116.44 150.58 C112.99 151.98 109.36 153.02 105.64 153.68 C101.92 154.33 98.11 154.60 94.28 154.46 C90.45 154.32 86.60 153.78 82.83 152.83 C79.06 151.88 75.37 150.53 71.83 148.79 C68.29 147.05 64.91 144.93 61.78 142.45 C58.64 139.98 55.74 137.16 53.15 134.04 C50.56 130.92 48.28 127.51 46.37 123.88 C44.47 120.24 42.93 116.38 41.81 112.37 C40.69 108.36 39.99 104.21 39.72 100.00 C39.46 95.79 39.64 91.53 40.27 87.30 C40.90 83.08 41.98 78.89 43.50 74.84 C45.01 70.79 46.97 66.87 49.32 63.18 C51.68 59.49 54.44 56.02 57.56 52.86 C60.67 49.71 64.14 46.86 67.89 44.39 C71.64 41.92 75.68 39.83 79.91 38.18 C84.15 36.53 88.58 35.31 93.12 34.57 C97.66 33.83 102.31 33.56 106.96 33.79 C111.61 34.01 116.26 34.73 120.82 35.93 C125.37 37.13 129.83 38.83 134.08 40.98 C138.33 43.13 142.38 45.74 146.13 48.77 C149.88 51.79 153.34 55.23 156.41 59.01 C159.49 62.80 162.18 66.93 164.42 71.32 C166.66 75.71 168.45 80.36 169.75 85.17 C171.04 89.99 171.83 94.97 172.09 100.00 C172.35 105.03 172.09 110.12 171.29 115.15 C170.49 120.18 169.15 125.16 167.30 129.96 C165.45 134.77 163.08 139.40 160.24 143.76 C157.39 148.12 154.08 152.21 150.35 155.92 C146.62 159.63 142.48 162.96 138.02 165.84 C133.55 168.73 128.76 171.15 123.74 173.06 C118.72 174.97 113.47 176.35 108.11 177.18';

  var html = document.documentElement;
  var REDUCED = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------- fréquence d'affichage */
  function forced() {
    return /[?&]intro\b/.test(location.search);
  }

  function alreadySeen() {
    if (forced()) return false;
    try {
      if (CONFIG.frequency === 'always') return false;
      if (CONFIG.frequency === 'daily') {
        var today = new Date().toISOString().slice(0, 10);
        return window.localStorage.getItem(CONFIG.storageKey) === today;
      }
      return window.sessionStorage.getItem(CONFIG.storageKey) === '1';
    } catch (e) {
      return false;               /* stockage bloqué : on joue l'intro */
    }
  }

  function markSeen() {
    try {
      if (CONFIG.frequency === 'daily') {
        window.localStorage.setItem(CONFIG.storageKey,
          new Date().toISOString().slice(0, 10));
      } else if (CONFIG.frequency === 'session') {
        window.sessionStorage.setItem(CONFIG.storageKey, '1');
      }
    } catch (e) { /* stockage indisponible : sans effet */ }
  }

  window.RollInLoveIntro = {
    config: CONFIG,
    timeline: TL,
    replay: function () {
      try {
        window.sessionStorage.removeItem(CONFIG.storageKey);
        window.localStorage.removeItem(CONFIG.storageKey);
      } catch (e) { /* ignore */ }
      location.reload();
    }
  };

  /* Mouvement réduit, intro déjà vue, ou page sans hero : on ne joue rien.
     Aucun voile n'est posé, donc aucun flash possible. */
  if (REDUCED) { html.classList.add('intro-reduced'); return; }
  if (alreadySeen()) return;

  /* Pré-voile immédiat — avant même que <body> ne soit analysé. */
  html.classList.add('intro-active');

  var timers = [];
  var overlay = null;
  var finished = false;
  var scrollY = 0;

  function later(fn, ms) { timers.push(setTimeout(fn, ms * CONFIG.speed)); }

  /* --------------------------------------------------------------- scroll lock
     Verrou sans overflow:hidden ni padding compensatoire : aucune barre de
     défilement ne disparaît, donc aucun décalage de mise en page. */
  function block(e) { e.preventDefault(); }
  var KEYS = { 32: 1, 33: 1, 34: 1, 35: 1, 36: 1, 38: 1, 40: 1 };
  function blockKeys(e) { if (KEYS[e.keyCode]) e.preventDefault(); }
  function pin() { if (window.scrollY !== scrollY) window.scrollTo(0, scrollY); }

  function lockScroll() {
    scrollY = window.scrollY || 0;
    window.addEventListener('wheel', block, { passive: false });
    window.addEventListener('touchmove', block, { passive: false });
    window.addEventListener('keydown', blockKeys, { passive: false });
    window.addEventListener('scroll', pin, { passive: true });
  }

  function unlockScroll() {
    window.removeEventListener('wheel', block, { passive: false });
    window.removeEventListener('touchmove', block, { passive: false });
    window.removeEventListener('keydown', blockKeys, { passive: false });
    window.removeEventListener('scroll', pin);
  }

  /* -------------------------------------------------------------- construction */
  function build() {
    var el = document.createElement('div');
    el.className = 'rl-intro';
    el.id = 'rl-intro';
    el.setAttribute('aria-hidden', 'true');   /* purement décoratif */
    el.setAttribute('role', 'presentation');
    el.innerHTML =
      '<svg class="rl-intro-veil" aria-hidden="true" focusable="false">' +
        '<defs><mask id="rl-intro-hole" maskUnits="userSpaceOnUse">' +
          '<rect x="0" y="0" width="100%" height="100%" fill="#fff"></rect>' +
          '<circle class="rl-intro-hole" cx="50%" cy="50%" r="0" fill="#000"></circle>' +
        '</mask></defs>' +
        '<rect class="rl-intro-veil-fill" x="0" y="0" width="100%" height="100%" ' +
              'mask="url(#rl-intro-hole)"></rect>' +
      '</svg>' +
      '<div class="rl-intro-stage">' +
        '<span class="rl-intro-crown">' +
          '<svg class="rl-intro-spiral" viewBox="0 0 200 200" aria-hidden="true" focusable="false">' +
            '<g class="rl-intro-spiral-inner">' +
              '<path class="rl-intro-trail" d="' + SPIRAL_PATH + '"></path>' +
              '<path class="rl-intro-line" d="' + SPIRAL_PATH + '"></path>' +
              '<circle class="rl-intro-seed" cx="101.2" cy="100" r="2.6"></circle>' +
            '</g>' +
          '</svg>' +
          '<span class="rl-intro-heart"><img src="assets/images/coeurs.webp" alt="" aria-hidden="true"></span>' +
        '</span>' +
        '<span class="rl-intro-logo-frame"><span class="rl-intro-logo-mask">' +
          '<img class="rl-intro-logo" src="assets/images/logo.webp" alt="" aria-hidden="true">' +
        '</span></span>' +
        '<p class="rl-intro-sign">Le roll fond, le cœur aussi.</p>' +
      '</div>';

    /* durées de la timeline → variables CSS */
    var s = el.style;
    s.setProperty('--rl-d-seed',   TL.seed.dur   * CONFIG.speed + 'ms');
    s.setProperty('--rl-d-spiral', TL.spiral.dur * CONFIG.speed + 'ms');
    s.setProperty('--rl-d-logo',   TL.logo.dur   * CONFIG.speed + 'ms');
    s.setProperty('--rl-d-heart',  TL.heart.dur  * CONFIG.speed + 'ms');
    s.setProperty('--rl-d-sign',   TL.sign.dur   * CONFIG.speed + 'ms');
    s.setProperty('--rl-d-open',   TL.open.dur   * CONFIG.speed + 'ms');
    return el;
  }

  /* ------------------------------------------------------------------ nettoyage
     Idempotent : appelable à tout moment (fin normale, erreur, garde-fou). */
  function finish() {
    if (finished) return;
    finished = true;
    for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
    timers.length = 0;
    unlockScroll();
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
    html.classList.remove('intro-active', 'intro-running');
    /* la cascade de la hero se termine ~1,2 s après ; on retire ensuite la
       classe pour laisser le DOM strictement dans son état d'origine */
    setTimeout(function () { html.classList.remove('intro-done'); }, 1400);
    markSeen();
  }

  /* ------------------------------------------------------------------ ouverture
     Le disque du masque s'ouvre par transition CSS sur `r`. Si le moteur
     n'expose pas cette propriété géométrique, on retombe sur un fondu court :
     dans les deux cas la hero est révélée, jamais d'écran figé. */
  function reveal() {
    if (!overlay) return finish();

    var circle = overlay.querySelector('.rl-intro-hole');
    var canOpen = !!(circle && circle.style && 'r' in circle.style);

    /* Le disque naît du cœur de la spirale — pas du centre de l'écran — pour
       que la page paraisse s'ouvrir depuis l'intérieur du roll. Rayon = coin
       le plus éloigné de ce centre, quel que soit le format. */
    var spiral = overlay.querySelector('.rl-intro-spiral');
    if (canOpen && spiral && spiral.getBoundingClientRect) {
      var b = spiral.getBoundingClientRect();
      var cx = b.left + b.width / 2;
      var cy = b.top + b.height / 2;
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var r = Math.max(
        Math.sqrt(cx * cx + cy * cy),
        Math.sqrt((vw - cx) * (vw - cx) + cy * cy),
        Math.sqrt(cx * cx + (vh - cy) * (vh - cy)),
        Math.sqrt((vw - cx) * (vw - cx) + (vh - cy) * (vh - cy))
      ) + 8;
      circle.setAttribute('cx', Math.round(cx));
      circle.setAttribute('cy', Math.round(cy));
      overlay.style.setProperty('--rl-hole-r', Math.ceil(r) + 'px');
    }

    overlay.classList.add('is-opening');
    if (!canOpen) overlay.classList.add('is-fading');
    html.classList.remove('intro-active', 'intro-running');
    html.classList.add('intro-done');       /* déclenche la cascade hero */
    unlockScroll();

    later(finish, (canOpen ? TL.open.dur : 420) + 60);
  }

  function play() {
    overlay = build();
    document.body.appendChild(overlay);
    lockScroll();

    /* longueur exacte des tracés → variable CSS (voir css/intro.css) */
    var paths = overlay.querySelectorAll('.rl-intro-trail, .rl-intro-line');
    for (var i = 0; i < paths.length; i++) {
      if (typeof paths[i].getTotalLength !== 'function') continue;
      paths[i].style.setProperty('--rl-len', Math.ceil(paths[i].getTotalLength()));
    }

    /* l'overlay est en place : on rend la main au voile SVG. Les deux sont
       de la même crème, la bascule ne se voit pas. */
    void overlay.offsetWidth;
    html.classList.remove('intro-active');
    html.classList.add('intro-running');

    /* Le logo peut n'arriver qu'après son étape sur une connexion lente. On
       attend son chargement, plafonné, pour ne jamais révéler un cadre vide —
       sans jamais transformer l'intro en écran de chargement (le plafond et
       les garde-fous priment). Depuis le passage en WebP il pèse 46 ko contre
       788 ko auparavant : l'attente ne se déclenche donc plus qu'en cas de
       réseau très dégradé. */
    var logoImg = overlay.querySelector('.rl-intro-logo');
    var logoShownAt = 0;

    function showLogo() {
      if (!overlay || logoShownAt) return;
      overlay.classList.add('is-logo');
      logoShownAt = Date.now();
    }

    function logoStep() {
      if (!logoImg || logoImg.complete) return showLogo();
      logoImg.addEventListener('load', showLogo, { once: true });
      logoImg.addEventListener('error', showLogo, { once: true });
      later(showLogo, LOGO_WAIT_MAX);      /* plafond d'attente */
    }

    /* le logo doit rester lisible un minimum avant que le disque s'ouvre */
    function maybeReveal() {
      var seen = logoShownAt ? Date.now() - logoShownAt : LOGO_MIN_VISIBLE;
      if (seen < LOGO_MIN_VISIBLE) { later(reveal, LOGO_MIN_VISIBLE - seen); return; }
      reveal();
    }

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.add('is-seeded');
        later(function () { overlay.classList.add('is-drawing'); }, TL.spiral.at);
        later(logoStep,                                             TL.logo.at);
        later(function () { overlay.classList.add('is-settled'); }, TL.settle.at);
        later(function () { overlay.classList.add('is-heart'); },   TL.heart.at);
        later(function () { overlay.classList.add('is-sign'); },    TL.sign.at);
        later(maybeReveal, TL.open.at);
      });
    });

    /* garde-fou : quoi qu'il arrive, l'overlay disparaît */
    later(finish, TL.end.at + 1500);
  }

  function start() {
    try {
      if (!document.body) { finish(); return; }
      play();
    } catch (e) {
      finish();                       /* jamais d'écran bloqué sur erreur */
    }
    /* Dernier filet, armé au démarrage réel de l'intro et non au parse du
       <head> : play() n'a lieu qu'au DOMContentLoaded, or sur connexion lente
       le document peut mettre plusieurs secondes à arriver. Compté depuis le
       chargement du script, ce délai était consommé avant même l'apparition
       du premier point et coupait l'animation en cours de route. */
    setTimeout(finish, 8000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

  /* Filet absolu, indépendant de start() : couvre le cas où DOMContentLoaded
     ne se produirait jamais, sans quoi le pré-voile resterait à l'écran. */
  setTimeout(finish, 20000);
})();

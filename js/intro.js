/* ==========================================================================
   Roll in Love — Animation d'ouverture « Le O de ROLL »
   Composant isolé, sans dépendance (HTML/CSS/JS vanilla, comme le reste du
   site). Mouvement par Web Animations API, cascade de la hero en CSS.

   Chargé en <head> SANS defer : la classe html.intro-active doit être posée
   avant le premier rendu, sinon la page apparaît une fraction de seconde
   avant l'overlay. Le pré-voile chocolat (css/intro.css) tient l'écran
   pendant que le DOM se construit ; l'overlay le remplace sans transition
   visible (même chocolat).

   Idée : la spirale du O de ROLL — l'emblème du logo — remplit l'écran et
   tourne le temps que la page se prépare. Puis elle se rétracte en roulant
   et vient se poser exactement dans le O imprimé sur la tasse de la photo
   d'accueil. Le voile ne disparaît pas : il devient un détail de la photo,
   et la page entre en cascade autour de lui pendant sa course.
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
     Durées en ms. `hold` : la spirale tourne au moins `min`, au plus `max`,
     en attendant la photo d'accueil et la police. `page` et `melt` sont
     comptés depuis le départ de la course. Total, connexion normale : ~2,9 s.
     -------------------------------------------------------------------------- */
  var TL = {
    bloom: { dur: 1050 },              /* le O grandit jusqu'à remplir l'écran */
    hold:  { min: 1200, max: 2400 },   /* il tourne, la page se prépare        */
    land:  { dur: 1500 },              /* course jusqu'au O de la tasse        */
    page:  { at:   760 },              /* la page entre en cascade             */
    melt:  { at:  1380, dur: 380 }     /* la spirale se fond dans le O imprimé */
  };

  var EASE_LAND  = 'cubic-bezier(0.86, 0, 0.07, 1)';   /* départ lent, arrivée posée */
  var EASE_BLOOM = 'cubic-bezier(0.22, 1, 0.36, 1)';
  var EASE_PHOTO = 'cubic-bezier(0.19, 1, 0.22, 1)';
  var EASE_GROW  = 'cubic-bezier(0.7, 0, 0.2, 1)';
  var SPIN_MS = 7000;                 /* un tour pendant l'attente             */
  var ROLL_DEG = 220;                 /* rotation minimale pendant la course   */
  var PHOTO_ZOOM = 1.1;               /* la photo recule de 10 % autour du O   */

  /* Position du O de ROLL imprimé sur la tasse, en pixels de l'image source.
     Desktop (≥ 769 px) : fond de .hero-section (cover, 55 % center).
     Mobile  (≤ 768 px) : <img class="hero-img">.
     À remesurer si l'une de ces deux photos change. */
  var MUG_O = {
    desktop: { w: 1719, h: 915, x: 936, y: 492, r: 43 },
    mobile:  { w: 1200, h: 960, x: 312, y: 516, r: 69 }
  };
  var BREAKPOINT = 769;
  /* angle final de la spirale, pour qu'elle se pose dans l'axe de la tasse */
  var LANDED_ANGLE = 0;

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

  /* Mouvement réduit, intro déjà vue, ou navigateur sans Web Animations :
     on ne joue rien. Aucun voile n'est posé, donc aucun flash possible. */
  if (REDUCED) { html.classList.add('intro-reduced'); return; }
  if (alreadySeen()) return;
  if (typeof Element === 'undefined' || !Element.prototype.animate) return;

  /* Pré-voile immédiat — avant même que <body> ne soit analysé. */
  html.classList.add('intro-active');

  var timers = [];
  var anims = [];
  var restore = [];                   /* remises en état de la page, en fin */
  var overlay = null;
  var finished = false;
  var scrollY = 0;

  function ms(n) { return n * CONFIG.speed; }
  function later(fn, n) { timers.push(setTimeout(fn, ms(n))); }
  function animate(el, frames, opts) {
    var a = el.animate(frames, opts);
    anims.push(a);
    return a;
  }

  /* --------------------------------------------------------------- scroll lock
     Verrou sans overflow:hidden ni padding compensatoire : aucune barre de
     défilement ne disparaît, donc aucun décalage de mise en page — le O
     mesuré reste à sa place pendant toute la course. */
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

  /* ------------------------------------------------------------------ spirale
     Le O du logo : disque chocolat cerclé de caramel, ruban de pâte crème qui
     s'élargit en s'enroulant, ombré de caramel. Généré plutôt que figé dans
     un tracé : les proportions se règlent par ces quelques nombres.
     Repère 200 × 200, centre (100, 100), disque de rayon 100. */
  function ribbon(turns, rEnd, w0, w1, curve, steps) {
    var T = Math.PI * 2 * turns;
    var k = rEnd / T;
    var t0 = (w0 * 1.15) / k;          /* départ décollé du centre */
    var outer = [], inner = [];
    for (var i = 0; i <= steps; i++) {
      var t = t0 + (T - t0) * i / steps;
      var r = k * t;
      var w = w0 + (w1 - w0) * Math.pow((t - t0) / (T - t0), curve);
      var c = Math.cos(t), s = Math.sin(t);
      outer.push((100 + (r + w) * c).toFixed(2) + ' ' + (100 + (r + w) * s).toFixed(2));
      inner.push((100 + (r - w) * c).toFixed(2) + ' ' + (100 + (r - w) * s).toFixed(2));
    }
    return 'M' + outer.join('L') +
           'A' + w1 + ' ' + w1 + ' 0 0 1 ' + inner[steps] +
           'L' + inner.reverse().join('L') +
           'A' + w0 + ' ' + w0 + ' 0 0 1 ' + outer[0] + 'Z';
  }

  function swirlSVG() {
    var d = ribbon(2.6, 84, 2, 11, 1.2, 320);
    return '<svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">' +
             '<circle class="rl-o-rim" cx="100" cy="100" r="100"></circle>' +
             '<circle class="rl-o-disc" cx="100" cy="100" r="96"></circle>' +
             '<path class="rl-o-shade" d="' + d + '" transform="translate(0 3.5)"></path>' +
             '<path class="rl-o-dough" d="' + d + '"></path>' +
           '</svg>';
  }

  /* -------------------------------------------------------------- construction
     .rl-intro-panel : le voile, découpé par un cercle (clip-path) qui se
                       resserre sur le O de la tasse ;
     .rl-intro-swirl : course (translation + échelle) ;
     .rl-intro-bloom : éclosion ;
     .rl-intro-spin  : rotation.
     Une transformation par élément : aucune ne contrarie l'autre. */
  function build(radius) {
    var el = document.createElement('div');
    el.className = 'rl-intro';
    el.id = 'rl-intro';
    el.setAttribute('aria-hidden', 'true');   /* purement décoratif */
    el.setAttribute('role', 'presentation');
    el.innerHTML =
      '<div class="rl-intro-panel">' +
        '<div class="rl-intro-swirl"><div class="rl-intro-bloom"><div class="rl-intro-spin">' +
          swirlSVG() +
        '</div></div></div>' +
      '</div>';
    var swirl = el.querySelector('.rl-intro-swirl');
    swirl.style.width = swirl.style.height = (radius * 2) + 'px';
    swirl.style.marginLeft = swirl.style.marginTop = (-radius) + 'px';
    return el;
  }

  /* ------------------------------------------------------------------- cible
     Où se trouve le O de la tasse à l'écran, et l'élément qui porte la photo.
     null si la photo n'est pas là où on l'attend (mise en page modifiée,
     défilement restauré plus bas…) : la spirale se referme alors sur
     elle-même au centre, sans viser. */
  function findTarget() {
    var vw = window.innerWidth, vh = window.innerHeight;
    var t;

    if (vw >= BREAKPOINT) {
      var section = document.querySelector('.hero-section');
      if (!section) return null;
      if (getComputedStyle(section).backgroundImage.indexOf('hero-bg') === -1) return null;
      var b = section.getBoundingClientRect();
      var o = MUG_O.desktop;
      /* background-size: cover ; background-position: 55% center */
      var s = Math.max(b.width / o.w, b.height / o.h);
      var ox = (b.width - o.w * s) * 0.55;
      var oy = (b.height - o.h * s) * 0.5;
      t = { kind: 'desktop', el: section, box: b,
            x: b.left + ox + o.x * s, y: b.top + oy + o.y * s, r: o.r * s };
    } else {
      var img = document.querySelector('.hero-img');
      if (!img || !img.naturalWidth) return null;
      var r = img.getBoundingClientRect();
      var m = MUG_O.mobile;
      t = { kind: 'mobile', el: img, box: r,
            x: r.left + m.x * r.width / m.w, y: r.top + m.y * r.height / m.h,
            r: m.r * r.width / m.w };
    }

    if (t.r < 4 || t.x < 0 || t.x > vw || t.y < 0 || t.y > vh) return null;
    return t;
  }

  /* ------------------------------------------------------------------ attente
     La spirale sert aussi de chargement : elle tourne jusqu'à ce que la photo
     d'accueil soit décodée et la police posée (la hauteur du titre fixe celle
     de la hero, donc la position du O). Plafonné : jamais d'écran d'attente. */
  function ready() {
    var waits = [];
    if (document.fonts && document.fonts.ready) waits.push(document.fonts.ready);

    if (window.innerWidth >= BREAKPOINT) {
      var probe = new Image();
      probe.src = 'assets/images/hero-bg.webp';   /* déjà préchargée par le <head> */
      if (probe.decode) waits.push(probe.decode());
    } else {
      var img = document.querySelector('.hero-img');
      if (img && img.decode) waits.push(img.decode());
    }

    var all = Promise.all(waits.map(function (p) {
      return p.catch(function () {});     /* une image en erreur ne bloque pas */
    }));
    var cap = new Promise(function (resolve) { later(resolve, TL.hold.max); });
    return Promise.race([all, cap]);
  }

  /* -------------------------------------------------------- la photo recule
     Pendant la course, la photo d'accueil passe de 110 % à 100 % autour du
     O : ce point reste fixe, tout le reste recule. Desktop : la photo est un
     fond CSS, doublée le temps de l'animation dans un calque qu'on peut
     mettre à l'échelle. Mobile : on anime l'<img> elle-même. */
  function photoZoom(t) {
    var opts = { duration: ms(TL.land.dur), easing: EASE_PHOTO, fill: 'backwards' };

    if (t.kind === 'desktop') {
      var section = t.el;
      var cs = getComputedStyle(section);
      var layer = document.createElement('div');
      layer.className = 'rl-intro-photo';
      layer.setAttribute('aria-hidden', 'true');
      layer.style.backgroundImage = cs.backgroundImage;
      layer.style.backgroundPosition = cs.backgroundPosition;
      layer.style.backgroundSize = cs.backgroundSize;
      layer.style.backgroundRepeat = cs.backgroundRepeat;
      layer.style.transformOrigin =
        (t.x - t.box.left) + 'px ' + (t.y - t.box.top) + 'px';
      section.insertBefore(layer, section.firstChild);
      html.classList.add('intro-photo');
      animate(layer, [{ transform: 'scale(' + PHOTO_ZOOM + ')' }, { transform: 'scale(1)' }], opts);
      restore.push(function () {
        html.classList.remove('intro-photo');
        if (layer.parentNode) layer.parentNode.removeChild(layer);
      });
    } else {
      var img = t.el;
      var base = getComputedStyle(img).transform;
      if (!base || base === 'none') base = '';
      /* origine = le O dans le repère propre de l'image (avant transform) ;
         la translation du site, placée en tête, reste hors de l'échelle */
      var m = MUG_O.mobile;
      img.style.transformOrigin =
        (m.x * img.offsetWidth / m.w) + 'px ' + (m.y * img.offsetHeight / m.h) + 'px';
      animate(img, [
        { transform: (base + ' scale(' + PHOTO_ZOOM + ')').trim() },
        { transform: (base + ' scale(1)').trim() }
      ], opts);
      restore.push(function () { img.style.transformOrigin = ''; });
    }
  }

  /* -------------------------------------------------------- titre en lettres
     Le <h1> est découpé en lettres le temps de la cascade, puis rendu tel
     quel : le DOM retrouve exactement son état d'origine. Les mots restent
     insécables ; aria-label garde la phrase lisible d'un bloc. */
  function splitHeading() {
    var h1 = document.querySelector('.hero-heading');
    if (!h1) return;
    var original = h1.innerHTML;
    var label = h1.textContent.replace(/\s+/g, ' ').trim();
    var index = 0;

    function splitNode(node) {
      if (node.nodeType === 3) {
        var frag = document.createDocumentFragment();
        node.nodeValue.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var word = document.createElement('span');
          word.className = 'rl-word';
          Array.prototype.forEach.call(part, function (ch) {
            var c = document.createElement('span');
            c.className = 'rl-char';
            c.style.setProperty('--rl-i', index++);
            c.textContent = ch;
            word.appendChild(c);
          });
          frag.appendChild(word);
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1) {
        Array.prototype.slice.call(node.childNodes).forEach(splitNode);
      }
    }

    Array.prototype.slice.call(h1.childNodes).forEach(splitNode);
    h1.setAttribute('aria-label', label);
    restore.push(function () {
      h1.innerHTML = original;
      h1.removeAttribute('aria-label');
    });
  }

  function cascade() {
    html.classList.remove('intro-active', 'intro-running');
    html.classList.add('intro-done');
  }

  /* ------------------------------------------------------------------ nettoyage
     Idempotent : appelable à tout moment (fin normale, erreur, garde-fou). */
  function finish() {
    if (finished) return;
    finished = true;
    for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
    timers.length = 0;
    for (var j = 0; j < anims.length; j++) { try { anims[j].cancel(); } catch (e) {} }
    anims.length = 0;
    unlockScroll();
    window.removeEventListener('resize', finish);
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;

    var late = !html.classList.contains('intro-done');
    cascade();
    /* la cascade de la hero dure ~1,8 s (badge compris) ; on rend ensuite le
       DOM strictement dans son état d'origine */
    setTimeout(function () {
      html.classList.remove('intro-done');
      while (restore.length) { try { restore.pop()(); } catch (e) {} }
    }, late ? 1900 : 900);
    markSeen();
  }

  /* -------------------------------------------------------------------- course */
  function land(parts) {
    if (!overlay) return finish();
    var vw = window.innerWidth, vh = window.innerHeight;
    var cx = vw / 2, cy = vh / 2;
    var t = findTarget();
    var opts = { duration: ms(TL.land.dur), easing: EASE_LAND, fill: 'forwards' };

    /* arrivée : le O de la tasse, ou à défaut le centre (la spirale se ferme) */
    var tx = t ? t.x : cx, ty = t ? t.y : cy, tr = t ? t.r : 0;
    /* départ du cercle de découpe : jusqu'au coin le plus éloigné */
    var r0 = Math.ceil(Math.sqrt(cx * cx + cy * cy)) + 2;

    animate(parts.panel, [
      { clipPath: 'circle(' + r0 + 'px at ' + cx + 'px ' + cy + 'px)' },
      { clipPath: 'circle(' + tr + 'px at ' + tx + 'px ' + ty + 'px)' }
    ], opts);

    animate(parts.swirl, [
      { transform: 'translate(0px, 0px) scale(1)' },
      { transform: 'translate(' + (tx - cx) + 'px, ' + (ty - cy) + 'px) scale(' + (tr / parts.radius) + ')' }
    ], opts);

    /* La rotation continue s'arrête là où elle en est, puis la spirale roule
       encore d'au moins ROLL_DEG et se pose dans l'axe de celle de la tasse. */
    var a0 = 0;
    if (parts.spinAnim && parts.spinAnim.currentTime != null) {
      a0 = (parts.spinAnim.currentTime % SPIN_MS) / SPIN_MS * 360;
      parts.spinAnim.cancel();
    }
    var a1 = LANDED_ANGLE;
    while (a1 < a0 + ROLL_DEG) a1 += 360;
    animate(parts.spin, [
      { transform: 'rotate(' + a0 + 'deg)' },
      { transform: 'rotate(' + a1 + 'deg)' }
    ], opts);

    if (t) photoZoom(t);

    /* la page entre en cascade pendant que la spirale termine sa course */
    later(cascade, TL.page.at);

    /* la spirale se fond dans le O imprimé, puis le voile est retiré */
    later(function () {
      if (!overlay) return;
      var melt = animate(overlay, [{ opacity: 1 }, { opacity: 0 }],
        { duration: ms(TL.melt.dur), easing: 'ease-out', fill: 'forwards' });
      melt.onfinish = finish;
    }, TL.melt.at);
  }

  function play() {
    var vw = window.innerWidth, vh = window.innerHeight;
    /* spirale un peu plus grande que l'écran : ses bords restent hors champ */
    var radius = Math.ceil(Math.sqrt(vw * vw + vh * vh) / 2 * 1.15);

    overlay = build(radius);
    document.body.appendChild(overlay);
    lockScroll();
    window.addEventListener('resize', finish);   /* cible faussée : on coupe */

    var parts = {
      radius: radius,
      panel: overlay.querySelector('.rl-intro-panel'),
      swirl: overlay.querySelector('.rl-intro-swirl'),
      bloom: overlay.querySelector('.rl-intro-bloom'),
      spin:  overlay.querySelector('.rl-intro-spin'),
      spinAnim: null
    };

    /* l'overlay est en place : on rend la main au voile. Même chocolat. */
    void overlay.offsetWidth;
    html.classList.remove('intro-active');
    html.classList.add('intro-running');

    /* éclosion : le O naît petit au centre, cerclé de caramel, puis grandit
       au-delà des bords (son disque a la couleur du voile : seul le ruban et
       le liseré se détachent) */
    animate(parts.bloom, [
      { opacity: 0, transform: 'scale(0.05)', easing: EASE_BLOOM },
      { opacity: 1, transform: 'scale(0.13)', offset: 0.16, easing: EASE_GROW },
      { opacity: 1, transform: 'scale(1)' }
    ], { duration: ms(TL.bloom.dur), fill: 'backwards' });

    parts.spinAnim = animate(parts.spin, [
      { transform: 'rotate(0deg)' },
      { transform: 'rotate(360deg)' }
    ], { duration: SPIN_MS, iterations: Infinity });

    var startedAt = Date.now();
    splitHeading();

    ready().then(function () {
      if (finished) return;
      var wait = ms(TL.hold.min) - (Date.now() - startedAt);
      if (wait > 0) timers.push(setTimeout(function () { land(parts); }, wait));
      else land(parts);
    });

    /* garde-fou : quoi qu'il arrive, l'overlay disparaît */
    later(finish, TL.hold.max + TL.land.dur + TL.melt.dur + 1500);
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
       le document peut mettre plusieurs secondes à arriver. */
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

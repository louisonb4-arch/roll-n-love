/* ==========================================================================
   Roll in Love — script de tête. Chargé SANS defer, avant le premier rendu.
   · html.--js                 : le JS tourne
   · html.--js-inview-enabled  : la chorégraphie peut masquer ses états initiaux
                                 (jamais en mouvement réduit)
   · html.intro-active         : pré-voile chocolat de l'ouverture (accueil,
                                 une fois par session)
   Filet : si le script principal n'a pas démarré après 7 s, on retire tout ce
   qui masque — le contenu reste lisible quoi qu'il arrive.
   ========================================================================== */
(function () {
  'use strict';
  var html = document.documentElement;
  html.classList.add('--js');

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;
  html.classList.add('--js-inview-enabled');

  var seen = false;
  try { seen = window.sessionStorage.getItem('rollinlove-intro-seen') === '1'; } catch (e) { /* stockage bloqué */ }
  if (/[?&]intro\b/.test(location.search)) seen = false;
  var home = html.getAttribute('data-page') === 'home';
  var canAnimate = typeof Element !== 'undefined' && !!Element.prototype.animate;
  if (home && !seen && canAnimate) html.classList.add('intro-active');

  setTimeout(function () {
    if (window.__rlBooted) return;
    html.classList.remove('--js-inview-enabled', 'intro-active', 'intro-running');
  }, 7000);
})();

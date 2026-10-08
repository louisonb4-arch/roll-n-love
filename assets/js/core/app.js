/* ==========================================================================
   Roll in Love — point d'entrée (module).
   Charge à la demande les composants déclarés dans le HTML :
     data-ui="site-header"      → assets/js/ui/site-header.js
     data-module="carte"        → assets/js/modules/carte.js
   (fichier JS ↔ fichier CSS du même nom, 1:1), puis lance l'ouverture :
   l'intro si elle doit jouer, sinon la cascade dès que fontes et image du
   héro sont prêtes.
   La version (?v=…) de ce fichier est propagée à tous les imports : une mise
   en ligne change toutes les URL, le cache ne sert jamais de vieux fichiers.
   ========================================================================== */

const V = new URL(import.meta.url).search;
const html = document.documentElement;
const load = (path) => import(`../${path}.js${V}`);

window.__rlBooted = true;

const [motion, hours] = await Promise.all([load('core/motion'), load('core/hours')]);
const ctx = { V, motion, hours, load };

// le découpage change la hauteur des titres : avant toute mesure
document.querySelectorAll('[data-split]').forEach(motion.splitWords);

const jobs = [];
document.querySelectorAll('[data-module],[data-ui]').forEach((el) => {
  const isUI = !!el.dataset.ui;
  (isUI ? el.dataset.ui : el.dataset.module).split(',').forEach((name) => {
    jobs.push(
      load(`${isUI ? 'ui' : 'modules'}/${name.trim()}`)
        .then(({ default: Mod }) => new Mod(el, ctx).init())
        .catch((err) => console.warn(`[roll] composant « ${name.trim()} » indisponible`, err)),
    );
  });
});
await Promise.all(jobs);

hours.mountStatus();

const startPage = (fromIntro) => {
  motion.reveal({ base: fromIntro ? 0 : 150, step: innerWidth < 760 ? 90 : 130 });
  document.dispatchEvent(new CustomEvent('rl:page', { detail: { fromIntro } }));
};

if (html.classList.contains('intro-active')) {
  try {
    const { default: Intro } = await load('ui/site-intro');
    new Intro(ctx).play({ onPage: () => startPage(true) });
  } catch (err) {
    html.classList.remove('intro-active', 'intro-running');
    startPage(false);
  }
} else if (html.classList.contains('--js-inview-enabled')) {
  await motion.ready([...document.querySelectorAll('.hero img')].slice(0, 2), 1200);
  startPage(false);
} else {
  startPage(false);
}

/* ==========================================================================
   Motion runtime — vanilla, zéro dépendance (principes MILL3, réimplémentés)
   moduleDelays() calcule les délais des seuls blocs visibles au chargement ;
   l'IntersectionObserver pose .is-inview sur tout le reste. Les deux systèmes
   s'ignorent.
   ========================================================================== */

export const motionReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const inViewport = (el) => {
  const r = el.getBoundingClientRect();
  return r.top < innerHeight && r.bottom > 0 && r.left < innerWidth && r.right > 0;
};

/* Délais croissants sur les blocs visibles ; les autres passent à "false". */
export const moduleDelays = (step = 130, base = 120, target = document) => {
  const els = [...target.querySelectorAll('[data-module-delay]')];
  const visibility = els.map(inViewport);          // lecture en lot
  let delay = base;
  els.forEach((el, i) => {                         // écriture en lot
    el.setAttribute('data-module-delay', visibility[i]);
    if (!visibility[i]) return;
    el.style.setProperty('--module-delay', `${delay}ms`);
    delay += el.dataset.moduleDelayIncrement ? parseInt(el.dataset.moduleDelayIncrement, 10) : step;
  });
};

/* Titres : un masque par mot, le mot monte dedans. */
export const splitWords = (el) => {
  if (el.dataset.splitDone) return;
  // les <br> de la source sont des retours voulus : on les garde
  const lines = el.innerHTML.split(/<br\s*\/?>/i).map((l) => {
    const t = document.createElement('span');
    t.innerHTML = l;
    return t.textContent.trim().replace(/\s+/g, ' ');
  });
  const esc = (w) => w.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let i = 0;
  // la phrase entière reste lisible d'un bloc (texte masqué) ; les mots
  // découpés sont purement visuels. Pas d'aria-label : interdit sur <p>.
  el.innerHTML = `<span class="visually-hidden">${esc(lines.join(' '))}</span>`
    + lines.map((line) => line.split(' ').filter(Boolean).map((word) =>
      `<span class="word" aria-hidden="true" style="--word-index:${i++}"><span class="word__inner">${esc(word)}</span></span>`
    ).join(' ')).join('<br aria-hidden="true">');
  el.dataset.splitDone = 'true';
};

let observer = null;
export const observe = (root = document) => {
  if (motionReduced) return;
  observer ||= new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-inview');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
  root.querySelectorAll('[data-reveal]:not(.is-inview), [data-split]:not(.is-inview)')
    .forEach((el) => observer.observe(el));
};

/* Ouverture : délais, puis .is-inview sur ce qui est visible, puis l'observer. */
export const reveal = ({ base = 120, step = 130 } = {}) => {
  moduleDelays(step, base);
  document.querySelectorAll(
    '[data-module-delay="true"][data-reveal],' +
    '[data-module-delay="true"] [data-reveal],' +
    '[data-module-delay="true"][data-split],' +
    '[data-module-delay="true"] [data-split]'
  ).forEach((el) => el.classList.add('is-inview'));
  observe();
};

/* Attend fontes + image LCP, plafonné — jamais window.load (trop tard). */
export const ready = (imgs = [], cap = 1400) => {
  const waits = [];
  if (document.fonts && document.fonts.ready) waits.push(document.fonts.ready);
  imgs.forEach((img) => { if (img && img.decode) waits.push(img.decode().catch(() => {})); });
  return Promise.race([
    Promise.all(waits),
    new Promise((resolve) => setTimeout(resolve, cap)),
  ]);
};

/* Un seul requestAnimationFrame pour tout le site. */
const tasks = new Set();
let running = false;
const tick = () => {
  tasks.forEach((fn) => fn());
  running = tasks.size > 0;
  if (running) requestAnimationFrame(tick);
};
export const addRaf = (fn) => {
  tasks.add(fn);
  if (!running) { running = true; requestAnimationFrame(tick); }
};
export const removeRaf = (fn) => tasks.delete(fn);

export const lerp = (a, b, t = 0.1) => a + (b - a) * t;

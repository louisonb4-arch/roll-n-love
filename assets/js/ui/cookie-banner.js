/* ==========================================================================
   Consentement — une seule finalité : la mesure d'audience (Vercel Web
   Analytics). Rien n'est chargé avant « Accepter ». Le choix est gardé
   6 mois dans le localStorage (« rollinlove-consent »), puis redemandé.
   « Gérer les cookies » (pied de page) rouvre le bandeau à tout moment.
   Décrit dans confidentialite.html — toute modification ici doit y être
   reportée.
   ========================================================================== */

const KEY = 'rollinlove-consent';
const MAX_AGE = 1000 * 60 * 60 * 24 * 182;      // ~6 mois

const read = () => {
  try {
    const c = JSON.parse(window.localStorage.getItem(KEY) || 'null');
    if (!c || typeof c.analytics !== 'boolean' || Date.now() - c.at > MAX_AGE) return null;
    return c;
  } catch (e) { return null; }
};
const write = (analytics) => {
  try { window.localStorage.setItem(KEY, JSON.stringify({ analytics, at: Date.now() })); } catch (e) { /* stockage bloqué */ }
};

let loaded = false;
const loadAnalytics = () => {
  if (loaded) return;
  loaded = true;
  window.va = window.va || function va() { (window.vaq = window.vaq || []).push(arguments); };
  const s = document.createElement('script');
  s.defer = true;
  s.src = '/_vercel/insights/script.js';
  document.head.appendChild(s);
};

export default class CookieBanner {
  constructor(el) {
    this.el = el;
    this._onClick = this._onClick.bind(this);
    this._show = this._show.bind(this);
  }

  init() {
    const choice = read();
    if (choice && choice.analytics) loadAnalytics();
    document.addEventListener('click', this._onClick);
    if (choice) return;
    // jamais par-dessus l'ouverture : après elle, ou une seconde après la page
    if (document.documentElement.classList.contains('intro-active') || document.documentElement.classList.contains('intro-running')) {
      document.addEventListener('rl:intro-done', () => setTimeout(this._show, 700), { once: true });
    } else {
      setTimeout(this._show, 1100);
    }
  }

  destroy() { document.removeEventListener('click', this._onClick); }

  _show() {
    this.el.hidden = false;
    requestAnimationFrame(() => this.el.classList.add('is-open'));
  }

  _hide() {
    this.el.classList.remove('is-open');
  }

  _onClick(e) {
    if (e.target.closest('[data-consent-open]')) { e.preventDefault(); this._show(); return; }
    const btn = e.target.closest('[data-consent]');
    if (!btn || !this.el.contains(btn)) return;
    const yes = btn.dataset.consent === 'accept';
    write(yes);
    this._hide();
    if (yes) loadAnalytics();
    else if (loaded) window.location.reload();     // retrait : on décharge le script
  }
}

/* ==========================================================================
   La carte — onglets accessibles (motif ARIA « tabs »).
   Sans JS : les onglets sont des ancres et toutes les familles s'affichent.
   Avec JS : une famille à la fois, flèches gauche/droite, Début/Fin,
   et un lien #carte-glace ouvre directement la bonne famille.
   ========================================================================== */

export default class Carte {
  constructor(el) {
    this.el = el;
    this.list = el.querySelector('.carte__tablist');
    this.tabs = [...el.querySelectorAll('.carte__tab')];
    this.panels = this.tabs.map((t) => document.getElementById(t.getAttribute('href').slice(1)));
    this._onClick = this._onClick.bind(this);
    this._onKey = this._onKey.bind(this);
    this._onHash = this._onHash.bind(this);
  }

  init() {
    if (!this.list || this.panels.some((p) => !p)) return;
    this.list.setAttribute('role', 'tablist');
    this.list.setAttribute('aria-label', 'Familles de la carte');
    this.tabs.forEach((tab, i) => {
      const panel = this.panels[i];
      tab.setAttribute('role', 'tab');
      tab.id = tab.id || `${panel.id}-tab`;
      tab.setAttribute('aria-controls', panel.id);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      panel.setAttribute('tabindex', '0');
    });
    this.list.addEventListener('click', this._onClick);
    this.list.addEventListener('keydown', this._onKey);
    window.addEventListener('hashchange', this._onHash);
    const fromHash = this.panels.findIndex((p) => `#${p.id}` === location.hash);
    this.select(fromHash >= 0 ? fromHash : 0, { focus: false, scroll: false });
  }

  destroy() {
    this.list.removeEventListener('click', this._onClick);
    this.list.removeEventListener('keydown', this._onKey);
    window.removeEventListener('hashchange', this._onHash);
  }

  select(index, { focus = true, scroll = true } = {}) {
    this.tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute('aria-selected', String(on));
      tab.setAttribute('tabindex', on ? '0' : '-1');
      this.panels[i].hidden = !on;
    });
    const tab = this.tabs[index];
    if (focus) tab.focus({ preventScroll: true });
    // garder l'onglet actif visible dans la barre qui défile
    const lb = this.list.getBoundingClientRect();
    const tb = tab.getBoundingClientRect();
    if (tb.left < lb.left || tb.right > lb.right) {
      this.list.scrollTo({ left: this.list.scrollLeft + tb.left - lb.left - 16, behavior: 'smooth' });
    }
    // si on a changé de famille en bas d'une longue liste, remonter au début
    if (scroll) {
      const top = this.panels[index].getBoundingClientRect().top;
      if (top < 0) this.panels[index].scrollIntoView({ block: 'start' });
    }
  }

  _onClick(e) {
    const tab = e.target.closest('.carte__tab');
    if (!tab) return;
    e.preventDefault();
    this.select(this.tabs.indexOf(tab));
  }

  _onKey(e) {
    const i = this.tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const last = this.tabs.length - 1;
    const next = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    this.select(next);
  }

  _onHash() {
    const i = this.panels.findIndex((p) => `#${p.id}` === location.hash);
    if (i >= 0) this.select(i, { focus: false, scroll: false });
  }
}

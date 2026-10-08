/* ==========================================================================
   En-tête — menu mobile (s'ouvre en cercle depuis le burger), retrait au
   défilement vers le bas, retour vers le haut, lien de la section en cours.
   ========================================================================== */

export default class SiteHeader {
  constructor(el) {
    this.el = el;
    this.html = document.documentElement;
    this.burger = el.querySelector('.burger');
    this.menu = document.getElementById('site-menu');
    this.links = [...el.querySelectorAll('.site-header__link')];
    this.lastY = window.scrollY;
    this.ticking = false;
    this._onScroll = this._onScroll.bind(this);
    this._onKey = this._onKey.bind(this);
    this._toggle = this._toggle.bind(this);
    this._onMenuClick = this._onMenuClick.bind(this);
  }

  init() {
    window.addEventListener('scroll', this._onScroll, { passive: true });
    if (this.burger && this.menu) {
      this.burger.addEventListener('click', this._toggle);
      this.menu.addEventListener('click', this._onMenuClick);
    }
    this._spy();
  }

  destroy() {
    window.removeEventListener('scroll', this._onScroll);
    if (this.burger) this.burger.removeEventListener('click', this._toggle);
    if (this.menu) this.menu.removeEventListener('click', this._onMenuClick);
    document.removeEventListener('keydown', this._onKey);
    if (this.spy) this.spy.disconnect();
  }

  /* ----------------------------------------------------------------- défilement */
  _onScroll() {
    if (this.ticking) return;
    this.ticking = true;
    requestAnimationFrame(() => {
      this.ticking = false;
      const y = window.scrollY;
      const open = this.html.classList.contains('menu-open');
      this.el.classList.toggle('is-scrolled', y > 8);
      if (!open) {
        const down = y > this.lastY + 4;
        const up = y < this.lastY - 4;
        if (down && y > 240) this.el.classList.add('is-hidden');
        else if (up || y < 120) this.el.classList.remove('is-hidden');
      }
      this.lastY = y;
    });
  }

  /* --------------------------------------------------------------------- menu */
  _toggle() {
    this.html.classList.contains('menu-open') ? this._close() : this._open();
  }

  _open() {
    const r = this.burger.getBoundingClientRect();
    this.menu.style.setProperty('--mx', `${r.left + r.width / 2}px`);
    this.menu.style.setProperty('--my', `${r.top + r.height / 2}px`);
    this.menu.removeAttribute('inert');
    this.menu.setAttribute('aria-hidden', 'false');
    this.html.classList.add('menu-open');
    this.burger.setAttribute('aria-expanded', 'true');
    this.burger.setAttribute('aria-label', 'Fermer le menu');
    document.addEventListener('keydown', this._onKey);
    const first = this.menu.querySelector('a');
    if (first) setTimeout(() => first.focus({ preventScroll: true }), 350);
  }

  _close(restoreFocus = true) {
    this.html.classList.remove('menu-open');
    this.menu.setAttribute('inert', '');
    this.menu.setAttribute('aria-hidden', 'true');
    this.burger.setAttribute('aria-expanded', 'false');
    this.burger.setAttribute('aria-label', 'Ouvrir le menu');
    document.removeEventListener('keydown', this._onKey);
    if (restoreFocus) this.burger.focus({ preventScroll: true });
  }

  _onKey(e) {
    if (e.key === 'Escape') { this._close(); return; }
    if (e.key !== 'Tab') return;
    // garde le focus dans le panneau (et le burger, pour pouvoir fermer)
    const items = [this.burger, ...this.menu.querySelectorAll('a, button')];
    const i = items.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
    else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
  }

  _onMenuClick(e) {
    if (e.target.closest('a')) this._close(false);
  }

  /* -------------------------------------------------------- section en cours */
  _spy() {
    const map = new Map();
    this.links.forEach((a) => {
      const id = (a.getAttribute('href') || '').split('#')[1];
      const sec = id && document.getElementById(id);
      if (sec) map.set(sec, a);
    });
    if (!map.size) return;
    this.spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const link = map.get(entry.target);
        if (!link) return;
        if (entry.isIntersecting) {
          this.links.forEach((l) => l.removeAttribute('aria-current'));
          link.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, sec) => this.spy.observe(sec));
  }
}

/* ==========================================================================
   Menu loader — Renders data/menu.json into the carte panels.
   Re-renders when language changes.
   ========================================================================== */

const MENU = {
  data: null,

  async init() {
    try {
      const res = await fetch('data/menu.json');
      this.data = await res.json();
      this.render();
    } catch (e) {
      console.error('menu load failed', e);
    }
    document.addEventListener('i18n:applied', () => this.render());
  },

  render() {
    if (!this.data) return;
    const lang = window.I18N?.current || 'fr';

    Object.entries(this.data).forEach(([category, payload]) => {
      const panel = document.getElementById(`tab-${category}`);
      if (!panel) return;

      const imgEl = panel.querySelector('.carte-img-nuage-large img');
      if (imgEl && payload.image) imgEl.src = payload.image;

      const cols = panel.querySelector('.menu-cols');
      if (!cols) return;

      cols.innerHTML = payload.sections.map(section => {
        const title = section.title?.[lang] || section.title?.fr || '';
        const itemsHtml = section.items.map(item => this.renderItem(item, lang)).join('');
        return `
          <div class="menu-section-title">${this.escape(title)}</div>
          ${itemsHtml}
        `;
      }).join('');
    });
  },

  renderItem(item, lang) {
    const name = item.name?.[lang] || item.name?.fr || '';
    const desc = item.desc?.[lang] || item.desc?.fr || '';
    const price = item.price || '';

    const badges = (item.badges || []).map(b => {
      if (b === 'bio') {
        return `<span class="badge badge-bio">
          <svg viewBox="0 0 24 24" width="10" height="10"><path fill="currentColor" d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/></svg>BIO
        </span>`;
      }
      return '';
    }).join('');

    const vendeeLogo = item.vendee
      ? `<img src="assets/images/logovendee.png" alt="Produit de Vendée" class="logo-vendee">`
      : '';

    return `
      <div class="menu-item">
        <div class="menu-item-left">
          <div class="menu-item-name">${this.escape(name)}${badges}${vendeeLogo}</div>
          ${desc ? `<div class="menu-item-desc">${this.escape(desc)}</div>` : ''}
        </div>
        ${price ? `<div class="menu-item-price">${this.escape(price)}</div>` : ''}
      </div>
    `;
  },

  escape(str) {
    return String(str).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }
};

window.MENU = MENU;

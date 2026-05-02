/* ==========================================================================
   i18n — Loads FR/EN translations and applies them to elements with data-i18n
   ==========================================================================
   Usage in HTML:
     <span data-i18n="nav.accueil">Accueil</span>           -> textContent
     <p data-i18n-html="hero.sub">fallback</p>              -> innerHTML (allows <br>)
     <input data-i18n-attr="placeholder:contact.namePh"/>   -> attribute
*/

const I18N = {
  current: 'fr',
  translations: {},

  async init() {
    const saved = localStorage.getItem('roll-lang');
    const browser = navigator.language?.startsWith('en') ? 'en' : 'fr';
    this.current = saved || browser;

    await this.load(this.current);
    this.apply();
    this.setupSwitcher();
  },

  async load(lang) {
    if (this.translations[lang]) return;
    try {
      const res = await fetch(`lang/${lang}.json`);
      this.translations[lang] = await res.json();
    } catch (e) {
      console.error('i18n load failed', lang, e);
    }
  },

  t(key) {
    const dict = this.translations[this.current] || {};
    return key.split('.').reduce((o, k) => (o ? o[k] : undefined), dict) ?? key;
  },

  apply() {
    document.documentElement.lang = this.current;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const value = this.t(key);
      if (value !== key) el.textContent = value;
    });

    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      const value = this.t(key);
      if (value !== key) el.innerHTML = value;
    });

    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      const pairs = el.getAttribute('data-i18n-attr').split(',');
      pairs.forEach(pair => {
        const [attr, key] = pair.split(':').map(s => s.trim());
        const value = this.t(key);
        if (value !== key) el.setAttribute(attr, value);
      });
    });

    document.dispatchEvent(new CustomEvent('i18n:applied', { detail: { lang: this.current } }));
  },

  async setLang(lang) {
    if (lang === this.current) return;
    await this.load(lang);
    this.current = lang;
    localStorage.setItem('roll-lang', lang);
    this.apply();
    this.updateSwitcherUI();
  },

  setupSwitcher() {
    const switcher = document.querySelector('.lang-switch');
    if (!switcher) return;
    switcher.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => this.setLang(btn.dataset.lang));
    });
    this.updateSwitcherUI();
  },

  updateSwitcherUI() {
    document.querySelectorAll('.lang-switch button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === this.current);
    });
  }
};

window.I18N = I18N;

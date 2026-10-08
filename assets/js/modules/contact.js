/* ==========================================================================
   Nous écrire — formulaire de contact (pas de réservation chez Roll in Love).
   Validation dans le navigateur (confort) ET sur le serveur (sécurité :
   api/contact.js refait tous les contrôles). Aucune clé ni adresse e-mail
   dans ce fichier. Anti-spam : champ piège + délai minimal de remplissage
   (+ limite de fréquence côté serveur).
   ========================================================================== */

const HINTS = {
  question: '',
  box: '(quelle box, pour quand, combien)',
  autre: '',
};

export default class Contact {
  constructor(el) {
    this.el = el;
    this.form = el.querySelector('form');
    this.status = el.querySelector('.form__status');
    this.submit = this.form && this.form.querySelector('[type="submit"]');
    this.loadedAt = Date.now();
    this._onSubmit = this._onSubmit.bind(this);
    this._onChange = this._onChange.bind(this);
    this._onPreset = this._onPreset.bind(this);
    this._onInput = this._onInput.bind(this);
  }

  init() {
    if (!this.form) return;
    this.form.noValidate = true;          // nos messages, pas ceux du navigateur
    this.form.addEventListener('submit', this._onSubmit);
    this.form.addEventListener('change', this._onChange);
    this.form.addEventListener('input', this._onInput);
    document.addEventListener('click', this._onPreset);
    this._onChange();
  }

  destroy() {
    this.form.removeEventListener('submit', this._onSubmit);
    this.form.removeEventListener('change', this._onChange);
    this.form.removeEventListener('input', this._onInput);
    document.removeEventListener('click', this._onPreset);
  }

  /* Un lien « Écrivez-nous » près des box présélectionne le sujet. */
  _onPreset(e) {
    const a = e.target.closest('[data-sujet]');
    if (!a) return;
    const radio = this.form.querySelector(`input[name="sujet"][value="${a.dataset.sujet}"]`);
    if (radio) { radio.checked = true; this._onChange(); }
  }

  _onChange() {
    const r = this.form.querySelector('input[name="sujet"]:checked');
    const hint = this.el.querySelector('[data-hint]');
    if (hint) hint.textContent = HINTS[r ? r.value : 'question'] || '';
  }

  _onInput(e) {
    if (e.target.getAttribute('aria-invalid') === 'true') this._check(e.target.name);
  }

  /* ---------------------------------------------------------------- contrôles */
  _rule(name) {
    const f = this.form.elements;
    const v = (n) => (f[n] && f[n].value ? f[n].value.trim() : '');
    switch (name) {
      case 'nom': return v('nom').length < 2 ? 'Indiquez votre nom.' : '';
      case 'email':
        if (!v('email')) return 'Une adresse pour vous répondre.';
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('email')) ? '' : 'Adresse e-mail invalide.';
      case 'tel': {
        const t = v('tel').replace(/[\s.\-()]/g, '');
        if (!t) return '';
        return /^(?:\+33|0033|0)[1-9]\d{8}$/.test(t) || /^\+\d{8,15}$/.test(t) ? '' : 'Numéro invalide (ex. 06 12 34 56 78).';
      }
      case 'message':
        if (v('message').length < 10) return 'Quelques mots de plus (10 caractères minimum).';
        return v('message').length > 1500 ? '1500 caractères maximum.' : '';
      default: return '';
    }
  }

  _check(name) {
    const msg = this._rule(name);
    const field = this.form.elements[name];
    const err = this.form.querySelector(`[data-error="${name}"]`);
    if (field) field.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) err.textContent = msg;
    return !msg;
  }

  _validate() {
    const bad = ['nom', 'email', 'tel', 'message'].filter((n) => !this._check(n));
    if (bad.length) this.form.elements[bad[0]].focus();
    return !bad.length;
  }

  /* ------------------------------------------------------------------- envoi */
  _say(text, state) {
    this.status.dataset.state = state;
    this.status.textContent = text;
  }

  async _onSubmit(e) {
    e.preventDefault();
    this._say('', '');
    if (!this._validate()) return;

    const data = Object.fromEntries(new FormData(this.form).entries());
    data.elapsed = Date.now() - this.loadedAt;          // un humain met plus de 3 s

    this.submit.disabled = true;
    this._say('Envoi en cours…', 'pending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        this.form.reset();
        this._onChange();
        this._say('Merci ! Votre message est bien parti, on vous répond très vite.', 'ok');
        return;
      }
      if (res.status === 400 && body.errors) {
        Object.entries(body.errors).forEach(([name, msg]) => {
          const err = this.form.querySelector(`[data-error="${name}"]`);
          if (err) err.textContent = msg;
        });
        this._say('Quelques champs sont à corriger.', 'error');
        return;
      }
      if (res.status === 429) {
        this._say('Trop de messages depuis votre connexion. Réessayez dans quelques minutes, ou appelez-nous au 02 59 15 26 97.', 'error');
        return;
      }
      throw new Error(String(res.status));
    } catch (err) {
      this._say('L\'envoi n\'a pas abouti. Appelez-nous au 02 59 15 26 97 ou écrivez à roll.inlove@outlook.com.', 'error');
    } finally {
      this.submit.disabled = false;
      this.status.focus();
    }
  }
}

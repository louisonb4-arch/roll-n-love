/* ==========================================================================
   Horaires — une seule source de vérité côté navigateur.
   Doit rester identique au bloc « Horaires » des pages et au JSON-LD de
   index.html (openingHoursSpecification).
   Tous les jours, 10h00 – 22h00, heure de Paris.
   ========================================================================== */

export const HOURS = { open: 10 * 60, close: 22 * 60 };   // minutes depuis minuit

/* Heure et minute à Paris, quel que soit le fuseau du visiteur. */
const parisNow = () => {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (t) => parseInt(parts.find((p) => p.type === t).value, 10);
  return get('hour') * 60 + get('minute');
};

const fmt = (m) => `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}`;

export const status = () => {
  const now = parisNow();
  const open = now >= HOURS.open && now < HOURS.close;
  if (open) {
    const left = HOURS.close - now;
    return {
      open: true,
      text: left <= 60 ? `Ouvert · ferme à ${fmt(HOURS.close)}` : 'Ouvert maintenant',
      detail: `jusqu'à ${fmt(HOURS.close)}`,
    };
  }
  return {
    open: false,
    text: 'Fermé pour le moment',
    detail: `ouvre ${now < HOURS.open ? "aujourd'hui" : 'demain'} à ${fmt(HOURS.open)}`,
  };
};

/* Remplit tous les [data-status] de la page, puis chaque minute. */
export const mountStatus = (root = document) => {
  const els = [...root.querySelectorAll('[data-status]')];
  if (!els.length) return;
  const paint = () => {
    const s = status();
    els.forEach((el) => {
      el.dataset.open = String(s.open);
      const t = el.querySelector('[data-status-text]');
      const d = el.querySelector('[data-status-detail]');
      if (t) t.textContent = s.text;
      if (d) d.textContent = s.detail;
    });
  };
  paint();
  setInterval(paint, 60 * 1000);
};

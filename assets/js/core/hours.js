/* ==========================================================================
   Horaires — une seule source de vérité côté navigateur.
   Doit rester identique aux blocs « Horaires » des pages et au JSON-LD de
   index.html (openingHoursSpecification).
   Vendredi, samedi, dimanche : 10h00 – 18h00, heure de Paris.
   Fermé du lundi au jeudi.
   ========================================================================== */

// 0 = dimanche … 6 = samedi ; minutes depuis minuit
export const HOURS = {
  5: [10 * 60, 18 * 60],
  6: [10 * 60, 18 * 60],
  0: [10 * 60, 18 * 60],
};

const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

/* Jour et minute à Paris, quel que soit le fuseau du visiteur. */
const parisNow = () => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { day, min: parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10) };
};

const fmt = (m) => `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}`;

/* Prochaine ouverture, aujourd'hui compris si l'heure n'est pas passée. */
const nextOpening = (day, min) => {
  for (let i = 0; i < 8; i++) {
    const d = (day + i) % 7;
    const h = HOURS[d];
    if (!h) continue;
    if (i === 0 && min >= h[0]) continue;
    const when = i === 0 ? "aujourd'hui" : i === 1 ? 'demain' : DAYS[d];
    return `ouvre ${when} à ${fmt(h[0])}`;
  }
  return '';
};

export const status = () => {
  const { day, min } = parisNow();
  const h = HOURS[day];
  if (h && min >= h[0] && min < h[1]) {
    const left = h[1] - min;
    return {
      open: true,
      text: left <= 60 ? `Ouvert · ferme à ${fmt(h[1])}` : 'Ouvert maintenant',
      detail: `jusqu'à ${fmt(h[1])}`,
    };
  }
  return { open: false, text: 'Fermé pour le moment', detail: nextOpening(day, min) };
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

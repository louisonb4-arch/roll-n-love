/* ==========================================================================
   POST /api/contact — fonction serveur Vercel (Node 20+, sans dépendance)

   Reçoit le message du formulaire « Nous écrire » (pas de réservation chez
   Roll in Love), le revalide entièrement (le navigateur n'est jamais cru sur
   parole), filtre les robots, puis l'envoie par e-mail à la maison via l'API
   d'un prestataire d'envoi. La clé reste ici, côté serveur.

   Variables d'environnement (Vercel → Settings → Environment Variables) :
     MAIL_PROVIDER  « brevo » (défaut, société française, données dans l'UE)
                    ou « resend » (société américaine)
     BREVO_API_KEY  clé API Brevo   — si MAIL_PROVIDER=brevo
     RESEND_API_KEY clé API Resend  — si MAIL_PROVIDER=resend
     CONTACT_TO     destinataire    — ex. roll.inlove@outlook.com
     CONTACT_FROM   expéditeur vérifié chez le prestataire
                    — ex. contact@rollinlove.com
   Sans clé, destinataire ou expéditeur : réponse 503, et le formulaire
   propose d'appeler. Aucun message n'est perdu en silence.
   ⚠️ Changer de prestataire = mettre à jour confidentialite.html#formulaire.

   Anti-spam : champ piège (« site »), délai minimal de remplissage (3 s),
   contrôle d'origine, taille maximale, 5 envois / 10 min par IP (mémoire de
   l'instance : un frein, pas une garantie). Rien n'est stocké ici.
   ========================================================================== */

const ALLOWED_ORIGINS = ['https://rollinlove.com', 'https://www.rollinlove.com'];
const SUBJECTS = { question: 'Question', box: 'Commande de box', autre: 'Autre' };
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map();

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
};

const readBody = async (req) => {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 12_000) throw new Error('too-large');
  }
  return raw ? JSON.parse(raw) : {};
};

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const clean = (s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function validate(input) {
  const errors = {};
  const d = {
    sujet: str(input.sujet, 16),
    nom: clean(str(input.nom, 80)).replace(/\s+/g, ' '),
    email: str(input.email, 120),
    tel: str(input.tel, 20).replace(/[\s.\-()]/g, ''),
    message: clean(str(input.message, 1500)),
  };
  if (!SUBJECTS[d.sujet]) d.sujet = 'question';
  if (d.nom.length < 2) errors.nom = 'Indiquez votre nom.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) errors.email = 'Adresse e-mail invalide.';
  if (d.tel && !(/^(?:\+33|0033|0)[1-9]\d{8}$/.test(d.tel) || /^\+\d{8,15}$/.test(d.tel))) errors.tel = 'Numéro invalide.';
  if (d.message.length < 10) errors.message = 'Quelques mots de plus (10 caractères minimum).';
  if ((d.message.match(/https?:\/\//g) || []).length > 2) errors.message = 'Trop de liens dans le message.';
  return { data: d, errors };
}

const limited = (ip) => {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();           // garde-fou mémoire
  return list.length > MAX_PER_WINDOW;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'method' });
  }

  // origine : le site lui-même (production, aperçus Vercel) — sinon refus
  const origin = req.headers.origin || '';
  const host = req.headers.host || '';
  let originHost = '';
  try { originHost = origin ? new URL(origin).host : ''; } catch (e) { originHost = 'invalide'; }
  const trusted = !origin || ALLOWED_ORIGINS.includes(origin) || originHost === host || /\.vercel\.app$/.test(originHost);
  if (!trusted) return json(res, 403, { error: 'origin' });
  if (!/application\/json/.test(req.headers['content-type'] || '')) return json(res, 415, { error: 'type' });

  let input;
  try { input = await readBody(req); } catch (e) { return json(res, 400, { error: 'body' }); }
  if (!input || typeof input !== 'object') return json(res, 400, { error: 'body' });

  // robots : piège rempli ou formulaire envoyé en moins de 3 s → on fait
  // semblant d'accepter, sans rien envoyer (ne pas leur apprendre la règle)
  const elapsed = Number(input.elapsed);
  if (str(input.site, 200) || !Number.isFinite(elapsed) || elapsed < 3000) return json(res, 200, { ok: true });

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  if (limited(ip)) return json(res, 429, { error: 'rate' });

  const { data, errors } = validate(input);
  if (Object.keys(errors).length) return json(res, 400, { errors });

  const provider = (process.env.MAIL_PROVIDER || 'brevo').toLowerCase();
  const key = provider === 'resend' ? process.env.RESEND_API_KEY : process.env.BREVO_API_KEY;
  const to = process.env.CONTACT_TO;
  const fromEmail = process.env.CONTACT_FROM;
  if (!key || !to || !fromEmail) return json(res, 503, { error: 'unconfigured' });

  const lines = [
    ['Sujet', SUBJECTS[data.sujet]],
    ['Nom', data.nom],
    ['E-mail', data.email],
    ['Téléphone', data.tel || '—'],
    ['Message', data.message],
  ];
  const subject = `${SUBJECTS[data.sujet]} — ${data.nom} (site rollinlove.com)`;
  const text = `${lines.map(([k, v]) => `${k} : ${v}`).join('\n')}\n\nRépondre directement à cet e-mail répond à ${data.email}.`;
  const html = `<h2 style="font-family:sans-serif">${escapeHtml(SUBJECTS[data.sujet])} — message du site</h2><table style="font-family:sans-serif;font-size:15px;border-collapse:collapse">${
    lines.map(([k, v]) => `<tr><td style="padding:6px 14px 6px 0;color:#6B4A36;vertical-align:top">${escapeHtml(k)}</td><td style="padding:6px 0"><b>${escapeHtml(v).replace(/\n/g, '<br>')}</b></td></tr>`).join('')
  }</table><p style="font-family:sans-serif;color:#6B4A36">Répondre directement à cet e-mail répond à ${escapeHtml(data.email)}.</p>`;

  const request = provider === 'resend'
    ? {
      url: 'https://api.resend.com/emails',
      headers: { Authorization: `Bearer ${key}` },
      body: { from: `Roll in Love — site <${fromEmail}>`, to: [to], reply_to: data.email, subject, text, html },
    }
    : {
      url: 'https://api.brevo.com/v3/smtp/email',
      headers: { 'api-key': key, accept: 'application/json' },
      body: {
        sender: { name: 'Roll in Love — site', email: fromEmail },
        to: [{ email: to }],
        replyTo: { email: data.email, name: data.nom },
        subject,
        textContent: text,
        htmlContent: html,
      },
    };

  try {
    const r = await fetch(request.url, {
      method: 'POST',
      headers: { ...request.headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(request.body),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return json(res, 502, { error: 'send' });
  } catch (e) {
    return json(res, 502, { error: 'send' });
  }
  return json(res, 200, { ok: true });
}

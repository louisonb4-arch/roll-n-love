/* ==========================================================================
   Ouverture « Le O de ROLL »
   L'écran est chocolat. Le O du logo — la coupe d'un roll — naît petit au
   centre, grandit au-delà des bords et tourne le temps que la page se
   prépare. Puis il se rétracte en roulant et se pose exactement sur le O
   dessiné du grand logo de la hero ; la page entre en cascade autour de lui
   pendant sa course. À l'arrivée, il se fond dans le dessin, la vraie photo
   d'un roll s'ouvre en cercle et les lettres se déroulent depuis le O.
   Le voile ne disparaît pas : il devient le logo.

   Web Animations API, aucune dépendance. Une fois par session
   (sessionStorage « rollinlove-intro-seen », décrit dans confidentialite.html).
   Rejouer : ?intro dans l'URL. Jamais en mouvement réduit (core/head.js).
   ========================================================================== */

const STORAGE_KEY = 'rollinlove-intro-seen';

const TL = {
  bloom: 1050,              // le O grandit jusqu'à remplir l'écran
  holdMin: 1200,            // il tourne au moins ce temps…
  holdMax: 2400,            // …et jamais plus, même si la page traîne
  land: 1500,               // course jusqu'au O du logo
  page: 760,                // depuis le départ de la course : cascade de la page
  melt: 1380,               // depuis le départ de la course : fonte dans le dessin
  meltDur: 380,
};

const EASE_LAND = 'cubic-bezier(0.86, 0, 0.07, 1)';
const EASE_BLOOM = 'cubic-bezier(0.22, 1, 0.36, 1)';
const EASE_GROW = 'cubic-bezier(0.7, 0, 0.2, 1)';
const SPIN_MS = 7000;
const ROLL_DEG = 220;
/* rotation finale : aligne la spirale générée sur celle du logo (bout du
   ruban à « 10 h ») */
const LANDED_ANGLE = 20;

/* Le O dessiné dans le logo détouré (1348 × 648) : centre et rayon, en
   fractions de la largeur/hauteur de .hero__mark */
const LOGO_O = { cx: 546.5 / 1348, cy: 247.5 / 648, r: 261.5 / 1348 };

/* Le ruban de pâte : spirale d'Archimède qui s'élargit en s'enroulant.
   Repère 200 × 200, disque de rayon 100. */
function ribbon(turns, rEnd, w0, w1, curve, steps) {
  const T = Math.PI * 2 * turns;
  const k = rEnd / T;
  const t0 = (w0 * 1.15) / k;
  const outer = [];
  const inner = [];
  for (let i = 0; i <= steps; i++) {
    const t = t0 + (T - t0) * i / steps;
    const r = k * t;
    const w = w0 + (w1 - w0) * Math.pow((t - t0) / (T - t0), curve);
    const c = Math.cos(t);
    const s = Math.sin(t);
    outer.push(`${(100 + (r + w) * c).toFixed(2)} ${(100 + (r + w) * s).toFixed(2)}`);
    inner.push(`${(100 + (r - w) * c).toFixed(2)} ${(100 + (r - w) * s).toFixed(2)}`);
  }
  return `M${outer.join('L')}A${w1} ${w1} 0 0 1 ${inner[steps]}L${inner.reverse().join('L')}A${w0} ${w0} 0 0 1 ${outer[0]}Z`;
}

function swirlSVG() {
  const d = ribbon(2.6, 84, 2, 11, 1.2, 320);
  return '<svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">'
    + '<circle class="o-rim" cx="100" cy="100" r="100"></circle>'
    + '<circle class="o-disc" cx="100" cy="100" r="95"></circle>'
    + `<path class="o-shade" d="${d}" transform="translate(0 3.5)"></path>`
    + `<path class="o-dough" d="${d}"></path>`
    + '</svg>';
}

export default class SiteIntro {
  constructor(ctx) {
    this.ctx = ctx;
    this.html = document.documentElement;
    this.timers = [];
    this.anims = [];
    this.el = null;
    this.finished = false;
    this.scrollY = 0;
    this._block = (e) => e.preventDefault();
    this._keys = (e) => { if ([' ', 'PageUp', 'PageDown', 'End', 'Home', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault(); };
    this._pin = () => { if (window.scrollY !== this.scrollY) window.scrollTo(0, this.scrollY); };
    this._finish = this._finish.bind(this);
  }

  /* ------------------------------------------------------------- utilitaires */
  _later(fn, ms) { this.timers.push(setTimeout(fn, ms)); }
  _animate(el, frames, opts) { const a = el.animate(frames, opts); this.anims.push(a); return a; }

  _lock() {
    this.scrollY = window.scrollY || 0;
    window.addEventListener('wheel', this._block, { passive: false });
    window.addEventListener('touchmove', this._block, { passive: false });
    window.addEventListener('keydown', this._keys);
    window.addEventListener('scroll', this._pin, { passive: true });
  }

  _unlock() {
    window.removeEventListener('wheel', this._block, { passive: false });
    window.removeEventListener('touchmove', this._block, { passive: false });
    window.removeEventListener('keydown', this._keys);
    window.removeEventListener('scroll', this._pin);
  }

  _markSeen() {
    try { window.sessionStorage.setItem(STORAGE_KEY, '1'); } catch (e) { /* sans effet */ }
  }

  /* ------------------------------------------------------------------ cible */
  _target() {
    const mark = document.querySelector('.hero__mark');
    if (!mark) return null;
    const b = mark.getBoundingClientRect();
    const t = { x: b.left + b.width * LOGO_O.cx, y: b.top + b.height * LOGO_O.cy, r: b.width * LOGO_O.r };
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (t.r < 6 || t.x < 0 || t.x > vw || t.y < 0 || t.y > vh) return null;
    return t;
  }

  /* -------------------------------------------------------------- construction */
  _build(radius) {
    const el = document.createElement('div');
    el.className = 'site-intro';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<div class="site-intro__panel"><div class="site-intro__swirl">'
      + `<div class="site-intro__bloom"><div class="site-intro__spin">${swirlSVG()}</div></div>`
      + '</div></div>';
    const swirl = el.querySelector('.site-intro__swirl');
    swirl.style.width = swirl.style.height = `${radius * 2}px`;
    swirl.style.marginLeft = swirl.style.marginTop = `${-radius}px`;
    return el;
  }

  /* ------------------------------------------------------------------- jouer */
  play({ onPage }) {
    this.onPage = onPage;
    try {
      this._play();
    } catch (e) {
      this._finish();
    }
    this._later(this._finish, TL.holdMax + TL.land + TL.meltDur + 1800);   // garde-fou
  }

  _play() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const radius = Math.ceil(Math.sqrt(vw * vw + vh * vh) / 2 * 1.15);

    this.el = this._build(radius);
    document.body.appendChild(this.el);
    this._lock();
    window.addEventListener('resize', this._finish);

    this.parts = {
      radius,
      panel: this.el.querySelector('.site-intro__panel'),
      swirl: this.el.querySelector('.site-intro__swirl'),
      bloom: this.el.querySelector('.site-intro__bloom'),
      spin: this.el.querySelector('.site-intro__spin'),
    };

    // l'overlay est en place : il prend le relais du pré-voile (même chocolat)
    void this.el.offsetWidth;
    this.html.classList.remove('intro-active');
    this.html.classList.add('intro-running');

    this._animate(this.parts.bloom, [
      { opacity: 0, transform: 'scale(0.05)', easing: EASE_BLOOM },
      { opacity: 1, transform: 'scale(0.13)', offset: 0.16, easing: EASE_GROW },
      { opacity: 1, transform: 'scale(1)' },
    ], { duration: TL.bloom, fill: 'backwards' });

    this.spinAnim = this._animate(this.parts.spin,
      [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
      { duration: SPIN_MS, iterations: Infinity });

    // la spirale sert aussi de chargement : logo et photo du O décodés, fontes posées
    const startedAt = performance.now();
    const imgs = [...document.querySelectorAll('.hero__mark img')];
    this.ctx.motion.ready(imgs, TL.holdMax).then(() => {
      if (this.finished) return;
      const wait = TL.holdMin - (performance.now() - startedAt);
      if (wait > 0) this._later(() => this._land(), wait);
      else this._land();
    });
  }

  _land() {
    if (!this.el || this.finished) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cx = vw / 2;
    const cy = vh / 2;
    const t = this._target();
    const tx = t ? t.x : cx;
    const ty = t ? t.y : cy;
    const tr = t ? t.r : 0;
    const r0 = Math.ceil(Math.sqrt(cx * cx + cy * cy)) + 2;
    const opts = { duration: TL.land, easing: EASE_LAND, fill: 'forwards' };
    const { panel, swirl, spin, radius } = this.parts;

    this._animate(panel, [
      { clipPath: `circle(${r0}px at ${cx}px ${cy}px)` },
      { clipPath: `circle(${tr}px at ${tx}px ${ty}px)` },
    ], opts);

    this._animate(swirl, [
      { transform: 'translate(0px, 0px) scale(1)' },
      { transform: `translate(${tx - cx}px, ${ty - cy}px) scale(${tr / radius})` },
    ], opts);

    // la rotation continue s'arrête où elle en est, puis la spirale roule
    // encore d'au moins ROLL_DEG et se pose dans l'axe du dessin
    let a0 = 0;
    if (this.spinAnim && this.spinAnim.currentTime != null) {
      a0 = (this.spinAnim.currentTime % SPIN_MS) / SPIN_MS * 360;
      this.spinAnim.cancel();
    }
    let a1 = LANDED_ANGLE;
    while (a1 < a0 + ROLL_DEG) a1 += 360;
    this._animate(spin, [{ transform: `rotate(${a0}deg)` }, { transform: `rotate(${a1}deg)` }], opts);

    // la page entre en cascade pendant la fin de course
    this._later(() => {
      this.html.classList.remove('intro-active', 'intro-running');
      if (this.onPage) this.onPage();
    }, TL.page);

    // arrivée : fonte dans le dessin du logo, la photo s'ouvre, les lettres se déroulent
    this._later(() => {
      document.dispatchEvent(new CustomEvent('rl:landed'));
      if (!this.el) return;
      const melt = this._animate(this.el, [{ opacity: 1 }, { opacity: 0 }],
        { duration: TL.meltDur, easing: 'ease-out', fill: 'forwards' });
      melt.onfinish = this._finish;
    }, TL.melt);
  }

  /* ---------------------------------------------------------------- nettoyage
     Idempotent : fin normale, erreur, redimensionnement ou garde-fou. */
  _finish() {
    if (this.finished) return;
    this.finished = true;
    this.timers.forEach(clearTimeout);
    this.anims.forEach((a) => { try { a.cancel(); } catch (e) { /* déjà fini */ } });
    this._unlock();
    window.removeEventListener('resize', this._finish);
    if (this.el) this.el.remove();
    this.el = null;
    const late = this.html.classList.contains('intro-active') || this.html.classList.contains('intro-running');
    this.html.classList.remove('intro-active', 'intro-running');
    if (late && this.onPage) this.onPage();
    document.dispatchEvent(new CustomEvent('rl:landed'));
    document.dispatchEvent(new CustomEvent('rl:intro-done'));
    this._markSeen();
  }
}

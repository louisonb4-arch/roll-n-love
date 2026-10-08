/* ==========================================================================
   Hero — le logo se déroule depuis son O, la photo du roll s'y ouvre en
   cercle, puis le roll tourne doucement au fil du défilement.
   Avec l'intro : à l'atterrissage (« rl:landed »). Sans : au délai du bloc.
   ========================================================================== */

export default class Hero {
  constructor(el, ctx) {
    this.el = el;
    this.ctx = ctx;
    this.mark = el.querySelector('.hero__mark');
    this.photo = el.querySelector('.hero__o-photo');
    this.ticking = false;
    this._unroll = this._unroll.bind(this);
    this._onPage = this._onPage.bind(this);
    this._onScroll = this._onScroll.bind(this);
    this._paint = this._paint.bind(this);
  }

  init() {
    if (!this.mark) return;
    const html = document.documentElement;
    if (!html.classList.contains('--js-inview-enabled')) {
      this.mark.classList.add('is-unrolled');
      return;
    }
    document.addEventListener('rl:landed', this._unroll);
    document.addEventListener('rl:page', this._onPage);
    if (this.photo) {
      window.addEventListener('scroll', this._onScroll, { passive: true });
      this._paint();
    }
  }

  destroy() {
    document.removeEventListener('rl:landed', this._unroll);
    document.removeEventListener('rl:page', this._onPage);
    window.removeEventListener('scroll', this._onScroll);
  }

  _onPage(e) {
    if (e.detail && e.detail.fromIntro) return;      // l'intro donnera le signal
    const d = parseFloat(getComputedStyle(this.el).getPropertyValue('--module-delay')) || 0;
    setTimeout(this._unroll, d + 80);
  }

  _unroll() { this.mark.classList.add('is-unrolled'); }

  _onScroll() {
    if (this.ticking) return;
    this.ticking = true;
    requestAnimationFrame(this._paint);
  }

  /* un quart de degré par pixel : le roll roule avec la page, puis s'arrête
     une fois la hero passée */
  _paint() {
    this.ticking = false;
    const y = Math.min(window.scrollY, window.innerHeight * 1.5);
    this.photo.style.setProperty('--o-turn', `${(y * 0.25).toFixed(1)}deg`);
  }
}

/* ==========================================================================
   Avis — points de progression du défilement horizontal (mobile).
   ========================================================================== */

export default class Avis {
  constructor(el) {
    this.el = el;
    this.track = el.querySelector('.avis__track');
    this.dots = el.querySelector('.avis__dots');
  }

  init() {
    if (!this.track || !this.dots) return;
    const cards = [...this.track.children];
    this.dots.innerHTML = cards.map(() => '<span></span>').join('');
    const marks = [...this.dots.children];
    this.io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.intersectionRatio < 0.6) return;
        const i = cards.indexOf(entry.target);
        marks.forEach((m, j) => m.classList.toggle('is-active', j === i));
      });
    }, { root: this.track, threshold: [0.6] });
    cards.forEach((c) => this.io.observe(c));
    marks[0].classList.add('is-active');
  }

  destroy() { if (this.io) this.io.disconnect(); }
}

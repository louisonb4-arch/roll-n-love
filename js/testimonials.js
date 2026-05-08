/* ==========================================================================
   Testimonials loader — renders 2 scrolling rows from data/testimonials.json
   ========================================================================== */

const TESTIMONIALS = {
  async init() {
    try {
      const res = await fetch('data/testimonials.json');
      const data = await res.json();
      this.render(data);
    } catch (e) {
      console.error('testimonials load failed', e);
    }
  },

  render(data) {
    const row1 = document.querySelector('.testimonials-track.row-1');
    const row2 = document.querySelector('.testimonials-track.row-2');
    if (!row1 || !row2) return;

    row1.innerHTML = this.duplicate(data.row1);
    row2.innerHTML = this.duplicate(data.row2);
  },

  duplicate(items) {
    const html = items.map(t => this.card(t)).join('');
    return html + html;
  },

  card(t) {
    const stars = '★'.repeat(t.stars || 5);
    return `
      <div class="testi-card">
        <div class="testi-stars">${stars}</div>
        <div class="testi-text">« ${this.escape(t.text)} »</div>
        <div class="testi-divider"></div>
        <div class="testi-author">${this.escape(t.author)}</div>
      </div>
    `;
  },

  escape(str) {
    return String(str).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }
};

window.TESTIMONIALS = TESTIMONIALS;

/* ==========================================================================
   Roll in Love — Main interactions
   - Tab switching
   - Wave ripple on buttons
   - Stories drag-scroll
   - Fade-up scroll observer
   - Mobile nav toggle
   ========================================================================== */

(async function bootstrap() {
  await window.I18N.init();
  await window.MENU.init();
  await window.TESTIMONIALS.init();
})();

/* ── TABS ── */
function showTab(tabId) {
  document.querySelectorAll('.carte-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById('tab-' + tabId);
  if (panel) panel.classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(b => {
    if (b.dataset.tab === tabId) b.classList.add('active');
  });
}
window.showTab = showTab;

document.addEventListener('click', e => {
  const tab = e.target.closest('.tab-btn[data-tab]');
  if (tab) showTab(tab.dataset.tab);

  const cat = e.target.closest('.cat-card[data-tab]');
  if (cat) {
    document.getElementById('carte').scrollIntoView({ behavior: 'smooth' });
    showTab(cat.dataset.tab);
  }
});

/* ── SCROLL FADE-UP ── */
(function() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(el => {
      if (el.isIntersecting) {
        el.target.classList.add('visible');
        observer.unobserve(el.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
})();

/* ── WAVE RIPPLE on buttons ── */
(function() {
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-primary,.btn-outline,.btn-commander,.btn-cat,.tab-btn,.btn-envoyer');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.sqrt(rect.width * rect.width + rect.height * rect.height) * 2.2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const color = (btn.classList.contains('btn-outline') || (btn.classList.contains('tab-btn') && !btn.classList.contains('active')))
      ? 'rgba(66,32,12,0.18)'
      : 'rgba(255,238,220,0.55)';
    const r = document.createElement('span');
    r.className = 'wave-ripple';
    r.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;background:${color};`;
    btn.appendChild(r);
    setTimeout(() => r.remove(), 650);
  });
})();

/* ── STORIES DRAG SCROLL ── */
(function() {
  const track = document.getElementById('storiesTrack');
  if (!track) return;
  let isDown = false, startX = 0, scrollLeft = 0;

  track.addEventListener('mousedown', e => {
    isDown = true;
    track.classList.add('is-dragging');
    startX = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
  });
  window.addEventListener('mouseup', () => {
    isDown = false;
    track.classList.remove('is-dragging');
  });
  track.addEventListener('mousemove', e => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    track.scrollLeft = scrollLeft - (x - startX);
  });
  track.addEventListener('touchstart', e => {
    startX = e.touches[0].pageX;
    scrollLeft = track.scrollLeft;
  }, { passive: true });
  track.addEventListener('touchmove', e => {
    const x = e.touches[0].pageX;
    track.scrollLeft = scrollLeft - (x - startX);
  }, { passive: true });
})();

/* ── MOBILE NAV TOGGLE ── */
(function() {
  const burger = document.querySelector('.hamburger');
  const links = document.querySelector('.nav-links');
  if (!burger || !links) return;
  burger.addEventListener('click', () => links.classList.toggle('mobile-open'));
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => links.classList.remove('mobile-open'));
  });
})();

(function(){"use strict";

var FW = window.FeedbackWidget || {};
window.FeedbackWidget = FW;

(function init() {
  var scripts = document.querySelectorAll("script[data-widget-id]");
  scripts.forEach(function (script) {
    var widgetId = script.getAttribute("data-widget-id");
    if (!widgetId || FW["_loaded_" + widgetId]) return;
    FW["_loaded_" + widgetId] = true;

    var container = document.getElementById("fw-" + widgetId);
    if (!container) {
      container = document.createElement("div");
      container.id = "fw-" + widgetId;
      script.parentNode.insertBefore(container, script.nextSibling);
    }

    var shadow = container.attachShadow({ mode: "open" });
    var wrapper = document.createElement("div");
    wrapper.className = "fw-root";
    shadow.appendChild(wrapper);

    var styleEl = document.createElement("style");
    styleEl.textContent = FW_STYLES;
    shadow.appendChild(styleEl);

    var baseUrl = script.src.replace(/\/embed\/widget\.js.*$/, "").replace(/\/widget\.js.*$/, "");
    if (!baseUrl || baseUrl === script.src) {
      baseUrl = window.location.origin;
    }

    fetch(baseUrl + "/api/widget/" + widgetId)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        renderWidget(wrapper, data);
        // Track impression
        navigator.sendBeacon && navigator.sendBeacon(
          baseUrl + "/api/widget/" + widgetId + "?impression=1"
        );
      })
      .catch(function (err) {
        console.error("[FeedbackWidget] Failed to load:", err);
      });
  });
})();

function renderWidget(container, data) {
  var widget = data.widget;
  var testimonials = data.testimonials || [];
  var showWatermark = data.showWatermark;

  if (!testimonials.length) {
    container.innerHTML = '<p class="fw-empty">No testimonials yet</p>';
    return;
  }

  var theme = widget.theme || {};
  if (theme.backgroundColor) container.style.setProperty("--fw-bg", theme.backgroundColor);
  if (theme.textColor) container.style.setProperty("--fw-text", theme.textColor);
  if (theme.accentColor) container.style.setProperty("--fw-accent", theme.accentColor);

  var layout = (widget.layout || "GRID").toUpperCase();
  var html = "";

  switch (layout) {
    case "MASONRY":
      html = renderMasonry(testimonials, widget);
      break;
    case "CAROUSEL":
      html = renderCarousel(testimonials, widget);
      break;
    case "LIST":
      html = renderList(testimonials, widget);
      break;
    case "MARQUEE":
      html = renderMarquee(testimonials, widget);
      break;
    default:
      html = renderGrid(testimonials, widget);
  }

  if (showWatermark) {
    html += '<div class="fw-watermark"><a href="https://feedbackwidget.io" target="_blank" rel="noopener">Powered by FeedbackWidget</a></div>';
  }

  container.innerHTML = html;

  if (layout === "CAROUSEL") initCarousel(container);
  if (layout === "MARQUEE") initMarquee(container);
}

function renderCard(t, widget) {
  var html = '<div class="fw-card">';
  if (widget.showAvatar !== false && t.customerAvatar) {
    html += '<img class="fw-avatar" src="' + escapeHtml(t.customerAvatar) + '" alt="" />';
  }
  html += '<div class="fw-card-body">';
  if (widget.showRating !== false && t.rating) {
    html += '<div class="fw-stars">' + renderStars(t.rating) + '</div>';
  }
  if (t.content) {
    html += '<p class="fw-content">' + escapeHtml(t.content) + '</p>';
  }
  html += '<div class="fw-author">';
  html += '<span class="fw-name">' + escapeHtml(t.customerName) + '</span>';
  if (t.customerTitle) {
    html += '<span class="fw-title">' + escapeHtml(t.customerTitle) + '</span>';
  }
  html += '</div></div></div>';
  return html;
}

function renderStars(count) {
  var html = "";
  for (var i = 0; i < 5; i++) {
    html += '<svg class="fw-star' + (i < count ? " fw-star-filled" : "") + '" viewBox="0 0 24 24" width="16" height="16"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
  }
  return html;
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

var FW_STYLES = `
.fw-root {
  --fw-bg: #ffffff;
  --fw-text: #1a1a1a;
  --fw-accent: #7c3aed;
  --fw-border: #e5e7eb;
  --fw-muted: #6b7280;
  --fw-radius: 12px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: var(--fw-text);
  line-height: 1.5;
}

.fw-card {
  background: var(--fw-bg);
  border: 1px solid var(--fw-border);
  border-radius: var(--fw-radius);
  padding: 24px;
  display: flex;
  gap: 16px;
  transition: box-shadow 0.2s;
}

.fw-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.fw-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.fw-card-body {
  flex: 1;
  min-width: 0;
}

.fw-stars {
  display: flex;
  gap: 2px;
  margin-bottom: 8px;
}

.fw-star {
  fill: var(--fw-border);
  stroke: none;
}

.fw-star-filled {
  fill: #facc15;
}

.fw-content {
  margin: 0 0 12px;
  font-size: 15px;
  line-height: 1.6;
  color: var(--fw-text);
}

.fw-author {
  display: flex;
  flex-direction: column;
}

.fw-name {
  font-weight: 600;
  font-size: 14px;
}

.fw-title {
  font-size: 13px;
  color: var(--fw-muted);
}

.fw-empty {
  text-align: center;
  color: var(--fw-muted);
  padding: 48px 24px;
}

.fw-watermark {
  text-align: center;
  margin-top: 16px;
  padding: 8px;
}

.fw-watermark a {
  font-size: 12px;
  color: var(--fw-muted);
  text-decoration: none;
}

.fw-watermark a:hover {
  text-decoration: underline;
}

/* Grid Layout */
.fw-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

/* Masonry Layout */
.fw-masonry {
  columns: 3;
  column-gap: 16px;
}

.fw-masonry .fw-card {
  break-inside: avoid;
  margin-bottom: 16px;
  display: block;
}

@media (max-width: 768px) {
  .fw-masonry { columns: 2; }
  .fw-grid { grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); }
}

@media (max-width: 480px) {
  .fw-masonry { columns: 1; }
  .fw-grid { grid-template-columns: 1fr; }
}

/* Carousel Layout */
.fw-carousel {
  position: relative;
  overflow: hidden;
}

.fw-carousel-track {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 4px;
}

.fw-carousel-track::-webkit-scrollbar {
  display: none;
}

.fw-carousel .fw-card {
  flex: 0 0 320px;
  scroll-snap-align: start;
}

.fw-carousel-nav {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
}

.fw-carousel-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--fw-border);
  background: var(--fw-bg);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.fw-carousel-btn:hover {
  background: var(--fw-border);
}

/* List Layout */
.fw-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Marquee Layout */
.fw-marquee {
  overflow: hidden;
  position: relative;
}

.fw-marquee-track {
  display: flex;
  gap: 16px;
  animation: fw-scroll 30s linear infinite;
  width: max-content;
}

.fw-marquee .fw-card {
  flex: 0 0 320px;
}

@keyframes fw-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
`;

function renderGrid(testimonials, widget) {
  var html = '<div class="fw-grid">';
  testimonials.forEach(function (t) {
    html += renderCard(t, widget);
  });
  html += '</div>';
  return html;
}

function renderMasonry(testimonials, widget) {
  var html = '<div class="fw-masonry">';
  testimonials.forEach(function (t) {
    html += renderCard(t, widget);
  });
  html += '</div>';
  return html;
}

function renderCarousel(testimonials, widget) {
  var html = '<div class="fw-carousel">';
  html += '<div class="fw-carousel-track">';
  testimonials.forEach(function (t) {
    html += renderCard(t, widget);
  });
  html += '</div>';
  html += '<div class="fw-carousel-nav">';
  html += '<button class="fw-carousel-btn fw-prev" aria-label="Previous">&#8249;</button>';
  html += '<button class="fw-carousel-btn fw-next" aria-label="Next">&#8250;</button>';
  html += '</div></div>';
  return html;
}

function initCarousel(container) {
  var track = container.querySelector('.fw-carousel-track');
  var prev = container.querySelector('.fw-prev');
  var next = container.querySelector('.fw-next');
  if (!track || !prev || !next) return;

  var scrollAmount = 336;

  prev.addEventListener('click', function () {
    track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  });

  next.addEventListener('click', function () {
    track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });
}

function renderList(testimonials, widget) {
  var html = '<div class="fw-list">';
  testimonials.forEach(function (t) {
    html += renderCard(t, widget);
  });
  html += '</div>';
  return html;
}

function renderMarquee(testimonials, widget) {
  var html = '<div class="fw-marquee">';
  html += '<div class="fw-marquee-track">';
  // Duplicate items for seamless loop
  var items = testimonials.concat(testimonials);
  items.forEach(function (t) {
    html += renderCard(t, widget);
  });
  html += '</div></div>';
  return html;
}

function initMarquee(container) {
  var track = container.querySelector('.fw-marquee-track');
  if (!track) return;

  container.addEventListener('mouseenter', function () {
    track.style.animationPlayState = 'paused';
  });
  container.addEventListener('mouseleave', function () {
    track.style.animationPlayState = 'running';
  });
}

})();
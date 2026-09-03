"use strict";

var FW = window.Testimoni || {};
window.Testimoni = FW;

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
        console.error("[Testimoni] Failed to load:", err);
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
    // UTM-tagged so we can attribute traffic from embedded widgets
    // on customer sites separately from the hosted wall path.
    html += '<div class="fw-watermark"><a href="https://testimoni.io/?utm_source=widget&utm_medium=embed&utm_campaign=powered_by" target="_blank" rel="noopener">Powered by Testimoni</a></div>';
  }

  container.innerHTML = html;

  if (layout === "CAROUSEL") initCarousel(container);
  if (layout === "MARQUEE") initMarquee(container);
}

// Same palette + hash the wall page uses so a person gets the same
// color everywhere they appear.
var LETTER_BG = [
  "#7c3aed", "#0891b2", "#059669", "#d97706", "#dc2626",
  "#db2777", "#4f46e5", "#0284c7", "#65a30d", "#c2410c"
];
function pickLetterColor(name) {
  var s = name || "";
  var idx = 0;
  for (var i = 0; i < s.length; i++) idx = (idx + s.charCodeAt(i)) % LETTER_BG.length;
  return LETTER_BG[idx];
}
function firstLetter(name) {
  var t = (name || "").trim();
  var c = t.charAt(0);
  // Only ASCII letters/digits get a letter circle. Emoji-only or
  // symbol-only names fall through — the caller skips the avatar
  // entirely rather than rendering "?" on a colored disc.
  if (!c || !/[A-Za-z0-9]/.test(c)) return "";
  return c.toUpperCase();
}

function renderCard(t, widget) {
  var html = '<div class="fw-card">';
  html += '<div class="fw-card-body">';
  if (widget.showRating !== false && t.rating) {
    html += '<div class="fw-stars">' + renderStars(t.rating) + '</div>';
  }
  if (t.content) {
    html += '<p class="fw-content">' + escapeHtml(t.content) + '</p>';
  }
  html += '<div class="fw-author">';
  if (widget.showAvatar !== false) {
    if (t.customerAvatar) {
      html += '<img class="fw-avatar" src="' + escapeHtml(t.customerAvatar) + '" alt="" />';
    } else {
      var letter = firstLetter(t.customerName || "");
      if (letter) {
        var bg = pickLetterColor(t.customerName || "");
        html += '<span class="fw-letter" style="background:' + bg + '">' + letter + '</span>';
      }
    }
  }
  html += '<div class="fw-author-text">';
  html += '<span class="fw-name">' + escapeHtml(t.customerName) + '</span>';
  if (t.customerTitle) {
    html += '<span class="fw-title">' + escapeHtml(t.customerTitle) + '</span>';
  }
  html += '</div></div></div></div>';
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

"use strict";

var FC = window.Testimoni || {};
window.Testimoni = FC;

(function collectInit() {
  var scripts = document.querySelectorAll("script[data-form-id]");
  scripts.forEach(function (script) {
    var formId = script.getAttribute("data-form-id");
    if (!formId || FC["_collect_" + formId]) return;
    FC["_collect_" + formId] = true;

    var container = document.createElement("div");
    container.id = "fc-" + formId;
    script.parentNode.insertBefore(container, script.nextSibling);

    var shadow = container.attachShadow({ mode: "open" });

    var styleEl = document.createElement("style");
    styleEl.textContent = FC_STYLES;
    shadow.appendChild(styleEl);

    var baseUrl = script.src
      .replace(/\/embed\/collect\.js.*$/, "")
      .replace(/\/collect\.js.*$/, "");
    if (!baseUrl || baseUrl === script.src) {
      baseUrl = window.location.origin;
    }

    fetch(baseUrl + "/api/collect/" + formId)
      .then(function (r) {
        if (!r.ok) throw new Error("Form not found");
        return r.json();
      })
      .then(function (config) {
        renderTrigger(shadow, config, baseUrl, formId);
      })
      .catch(function (err) {
        console.error("[Testimoni Collect] Failed to load:", err);
      });
  });
})();

function renderTrigger(shadow, config, baseUrl, formId) {
  var btn = document.createElement("button");
  btn.className = "fc-trigger";
  btn.innerHTML =
    '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
    "Leave a Review";
  shadow.appendChild(btn);

  btn.addEventListener("click", function () {
    openModal(shadow, config, baseUrl, formId);
  });
}

function openModal(shadow, config, baseUrl, formId) {
  if (shadow.querySelector(".fc-backdrop")) return;

  var selectedRating = 0;

  var backdrop = document.createElement("div");
  backdrop.className = "fc-backdrop";
  shadow.appendChild(backdrop);

  var modal = document.createElement("div");
  modal.className = "fc-modal";

  var headerHtml =
    '<div class="fc-modal-header">' +
    "<h2>" + fcEscape(config.headline || "Share your experience") + "</h2>" +
    '<button class="fc-close">&times;</button>' +
    "</div>";

  var descHtml = config.description
    ? '<p class="fc-modal-desc">' + fcEscape(config.description) + "</p>"
    : "";

  var starsHtml = "";
  if (config.allowRating !== false) {
    starsHtml =
      '<div class="fc-field">' +
      "<label>Rating</label>" +
      '<div class="fc-stars-row">';
    for (var i = 1; i <= 5; i++) {
      starsHtml +=
        '<span class="fc-star" data-value="' + i + '">' +
        '<svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>' +
        "</span>";
    }
    starsHtml += "</div></div>";
  }

  modal.innerHTML =
    headerHtml +
    descHtml +
    '<div class="fc-form">' +
    starsHtml +
    '<div class="fc-field">' +
    "<label>Your testimonial *</label>" +
    '<textarea class="fc-content" placeholder="What did you love about working with us?"></textarea>' +
    "</div>" +
    '<div class="fc-field">' +
    "<label>Your name *</label>" +
    '<input type="text" class="fc-name" placeholder="Jane Smith" />' +
    "</div>" +
    '<div class="fc-field">' +
    "<label>Email (optional)</label>" +
    '<input type="email" class="fc-email" placeholder="jane@example.com" />' +
    "</div>" +
    '<p class="fc-error" style="display:none"></p>' +
    '<button class="fc-submit">Submit</button>' +
    "</div>" +
    '<div class="fc-powered"><a href="https://testimoni.io" target="_blank" rel="noopener">Powered by Testimoni</a></div>';

  shadow.appendChild(modal);

  // Close handlers
  backdrop.addEventListener("click", function () {
    closeModal(shadow);
  });
  modal.querySelector(".fc-close").addEventListener("click", function () {
    closeModal(shadow);
  });

  // Star rating
  var stars = modal.querySelectorAll(".fc-star");
  stars.forEach(function (star) {
    star.addEventListener("mouseenter", function () {
      var val = parseInt(star.getAttribute("data-value"));
      stars.forEach(function (s) {
        var sv = parseInt(s.getAttribute("data-value"));
        if (sv <= val) s.classList.add("hover");
        else s.classList.remove("hover");
      });
    });
    star.addEventListener("mouseleave", function () {
      stars.forEach(function (s) {
        s.classList.remove("hover");
      });
    });
    star.addEventListener("click", function () {
      selectedRating = parseInt(star.getAttribute("data-value"));
      stars.forEach(function (s) {
        var sv = parseInt(s.getAttribute("data-value"));
        if (sv <= selectedRating) s.classList.add("active");
        else s.classList.remove("active");
      });
    });
  });

  // Submit
  modal.querySelector(".fc-submit").addEventListener("click", function () {
    var nameVal = modal.querySelector(".fc-name").value.trim();
    var contentVal = modal.querySelector(".fc-content").value.trim();
    var emailVal = modal.querySelector(".fc-email").value.trim();
    var errorEl = modal.querySelector(".fc-error");

    if (!nameVal) {
      errorEl.textContent = "Name is required.";
      errorEl.style.display = "block";
      return;
    }
    if (!contentVal && !selectedRating) {
      errorEl.textContent = "Please write a testimonial or select a rating.";
      errorEl.style.display = "block";
      return;
    }

    errorEl.style.display = "none";
    var submitBtn = modal.querySelector(".fc-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    var payload = {
      formId: formId,
      customerName: nameVal,
      content: contentVal || undefined,
      rating: selectedRating || undefined,
    };
    if (emailVal) payload.customerEmail = emailVal;

    fetch(baseUrl + "/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (r) {
        if (!r.ok) throw new Error("Submission failed");
        return r.json();
      })
      .then(function () {
        // Show success
        modal.innerHTML =
          '<div class="fc-success">' +
          '<div class="fc-success-icon"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg></div>' +
          "<h3>Thank you!</h3>" +
          "<p>" + fcEscape(config.thankYouMessage || "Your feedback has been received.") + "</p>" +
          "</div>";

        setTimeout(function () {
          closeModal(shadow);
        }, 3000);
      })
      .catch(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit";
        errorEl.textContent = "Something went wrong. Please try again.";
        errorEl.style.display = "block";
      });
  });
}

function closeModal(shadow) {
  var backdrop = shadow.querySelector(".fc-backdrop");
  var modal = shadow.querySelector(".fc-modal");
  if (backdrop) backdrop.remove();
  if (modal) modal.remove();
}

function fcEscape(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

(function(){var FC_STYLES = `
:host {
  all: initial;
}

.fc-trigger {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 2147483647;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #7c3aed;
  color: #fff;
  border: none;
  border-radius: 50px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);
  transition: transform 0.2s, box-shadow 0.2s;
}

.fc-trigger:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.5);
}

.fc-trigger svg {
  width: 18px;
  height: 18px;
  fill: #fff;
}

.fc-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2147483646;
  background: rgba(0, 0, 0, 0.5);
  animation: fc-fadeIn 0.2s ease;
}

.fc-modal {
  position: fixed;
  z-index: 2147483647;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 460px;
  max-height: 90vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  animation: fc-slideUp 0.3s ease;
}

.fc-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
}

.fc-modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
}

.fc-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #6b7280;
  font-size: 20px;
  line-height: 1;
  border-radius: 6px;
  transition: background 0.15s;
}

.fc-close:hover {
  background: #f3f4f6;
  color: #1a1a1a;
}

.fc-modal-desc {
  padding: 4px 24px 0;
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.fc-form {
  padding: 20px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.fc-field label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

.fc-field input,
.fc-field textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  color: #1a1a1a;
  background: #fff;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}

.fc-field input:focus,
.fc-field textarea:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.fc-field textarea {
  resize: vertical;
  min-height: 80px;
}

.fc-stars-row {
  display: flex;
  gap: 4px;
}

.fc-star {
  cursor: pointer;
  transition: transform 0.1s;
}

.fc-star:hover {
  transform: scale(1.15);
}

.fc-star svg {
  width: 28px;
  height: 28px;
  fill: #d1d5db;
  stroke: none;
  transition: fill 0.15s;
}

.fc-star.active svg,
.fc-star.hover svg {
  fill: #facc15;
}

.fc-submit {
  width: 100%;
  padding: 12px;
  background: #7c3aed;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
}

.fc-submit:hover {
  background: #6d28d9;
}

.fc-submit:disabled {
  background: #a78bfa;
  cursor: not-allowed;
}

.fc-error {
  color: #dc2626;
  font-size: 13px;
  margin: 0;
}

.fc-success {
  padding: 40px 24px;
  text-align: center;
}

.fc-success-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  background: #dcfce7;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fc-success-icon svg {
  width: 28px;
  height: 28px;
  fill: none;
  stroke: #16a34a;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.fc-success h3 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
}

.fc-success p {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.fc-powered {
  text-align: center;
  padding: 0 24px 16px;
  font-size: 11px;
  color: #9ca3af;
}

.fc-powered a {
  color: #7c3aed;
  text-decoration: none;
}

.fc-powered a:hover {
  text-decoration: underline;
}

@keyframes fc-fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fc-slideUp {
  from { opacity: 0; transform: translate(-50%, -45%); }
  to { opacity: 1; transform: translate(-50%, -50%); }
}
`;

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

})();
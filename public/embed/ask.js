(function () {
  "use strict";
  // Ask My Wall — embeddable AI chatbot bubble.
  //
  // Usage: <script src="https://testimoni.io/embed/ask.js"
  //          data-workspace="acme-corp"></script>
  //
  // Renders a floating bubble in the corner. Click opens a chat
  // panel; questions POST to /api/ask-my-wall/<workspace> which
  // answers using Claude Haiku grounded on the workspace's real
  // testimonials.
  var TAG = "[Testimoni Ask]";
  var s = document.currentScript;
  if (!s) return;
  var workspaceSlug = s.getAttribute("data-workspace");
  if (!workspaceSlug) {
    console.error(TAG, "data-workspace attribute required");
    return;
  }

  // Detect base URL from the script src so it works on both
  // testimoni.io and localhost dev.
  var baseUrl = s.src.replace(/\/embed\/ask\.js.*$/, "");
  if (!baseUrl) baseUrl = window.location.origin;

  var host = document.createElement("div");
  host.setAttribute("id", "testimoni-ask-" + workspaceSlug);
  document.body.appendChild(host);
  var root = host.attachShadow({ mode: "open" });

  var style = document.createElement("style");
  style.textContent = [
    ":host { all: initial; }",
    "* { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }",
    ".bubble { position: fixed; bottom: 20px; right: 20px; width: 56px; height: 56px; border-radius: 50%; background: #4f46e5; color: white; border: none; cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; font-size: 24px; z-index: 999999; transition: transform 0.15s; }",
    ".bubble:hover { transform: scale(1.05); }",
    ".panel { position: fixed; bottom: 90px; right: 20px; width: 360px; max-width: calc(100vw - 40px); height: 480px; max-height: calc(100vh - 120px); background: white; border-radius: 16px; box-shadow: 0 8px 40px rgba(0,0,0,0.2); display: none; flex-direction: column; overflow: hidden; z-index: 999999; }",
    ".panel.open { display: flex; }",
    ".head { padding: 14px 16px; border-bottom: 1px solid #eee; background: #4f46e5; color: white; }",
    ".head h3 { margin: 0; font-size: 15px; font-weight: 600; }",
    ".head p { margin: 2px 0 0; font-size: 12px; opacity: 0.85; }",
    ".msgs { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px; }",
    ".msg { padding: 10px 12px; border-radius: 12px; max-width: 85%; font-size: 14px; line-height: 1.4; white-space: pre-wrap; }",
    ".msg.user { align-self: flex-end; background: #4f46e5; color: white; border-bottom-right-radius: 4px; }",
    ".msg.bot { align-self: flex-start; background: #f4f4f5; color: #18181b; border-bottom-left-radius: 4px; }",
    ".msg.err { background: #fef2f2; color: #991b1b; }",
    ".ref { align-self: flex-start; font-size: 11px; color: #6b7280; padding: 4px 10px; background: #fafafa; border: 1px solid #eee; border-radius: 8px; margin-top: -6px; max-width: 85%; }",
    ".ref a { color: #4f46e5; text-decoration: none; }",
    ".form { padding: 10px; border-top: 1px solid #eee; display: flex; gap: 6px; }",
    ".form input { flex: 1; padding: 8px 12px; border: 1px solid #d4d4d8; border-radius: 8px; font-size: 14px; outline: none; }",
    ".form input:focus { border-color: #4f46e5; }",
    ".form button { padding: 8px 12px; background: #4f46e5; color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; }",
    ".form button:disabled { opacity: 0.5; cursor: not-allowed; }",
    ".foot { text-align: center; padding: 4px; font-size: 10px; color: #a1a1aa; }",
    ".foot a { color: #a1a1aa; }",
  ].join("\n");
  root.appendChild(style);

  var bubble = document.createElement("button");
  bubble.className = "bubble";
  bubble.setAttribute("aria-label", "Ask about our customers");
  bubble.innerHTML = "&#128172;";
  root.appendChild(bubble);

  var panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML =
    '<div class="head"><h3>Ask about our customers</h3><p>Answers grounded on real testimonials.</p></div>' +
    '<div class="msgs" id="tm-msgs"></div>' +
    '<form class="form" id="tm-form"><input type="text" placeholder="e.g. how fast is onboarding?" required maxlength="500" /><button type="submit">Ask</button></form>' +
    '<div class="foot">Powered by <a href="https://testimoni.io" target="_blank" rel="noopener">Testimoni</a></div>';
  root.appendChild(panel);

  var msgs = panel.querySelector("#tm-msgs");
  var form = panel.querySelector("#tm-form");
  var input = form.querySelector("input");
  var button = form.querySelector("button");
  var greeted = false;

  function addMsg(text, cls) {
    var m = document.createElement("div");
    m.className = "msg " + cls;
    m.textContent = text;
    msgs.appendChild(m);
    msgs.scrollTop = msgs.scrollHeight;
    return m;
  }

  function addRef(refs) {
    if (!refs || refs.length === 0) return;
    var wrap = document.createElement("div");
    wrap.className = "ref";
    var parts = refs.map(function (r) {
      var label = "— " + r.author;
      return r.url ? '<a href="' + r.url + '" target="_blank" rel="noopener">' + label + "</a>" : label;
    });
    wrap.innerHTML = "Based on: " + parts.join(" · ");
    msgs.appendChild(wrap);
    msgs.scrollTop = msgs.scrollHeight;
  }

  bubble.addEventListener("click", function () {
    panel.classList.toggle("open");
    if (panel.classList.contains("open") && !greeted) {
      greeted = true;
      addMsg("Hi! Ask me anything about our customers' feedback.", "bot");
      input.focus();
    }
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var q = input.value.trim();
    if (!q) return;
    addMsg(q, "user");
    input.value = "";
    button.disabled = true;

    fetch(baseUrl + "/api/ask-my-wall/" + encodeURIComponent(workspaceSlug), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q }),
    })
      .then(function (r) {
        return r.json().then(function (d) {
          return { ok: r.ok, data: d };
        });
      })
      .then(function (res) {
        if (!res.ok) {
          addMsg(res.data.message || "Sorry, I couldn't answer that.", "err");
          return;
        }
        addMsg(res.data.answer, "bot");
        addRef(res.data.references);
      })
      .catch(function () {
        addMsg("Network error — please try again.", "err");
      })
      .finally(function () {
        button.disabled = false;
        input.focus();
      });
  });
})();

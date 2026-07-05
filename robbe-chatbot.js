/*!
 * Robbe Chatbot Widget
 * Self-contained Chat-Widget fuer robbe-consulting.de
 * Andockt an den n8n-Webhook "Robbe Chatbot".
 *
 * EINBINDUNG:
 *   <script src="/robbe-chatbot.js" defer></script>
 * (Datei auf IONOS in das Webroot legen, z. B. neben index.html)
 *
 * Vor dem Live-Gang nur die CONFIG unten anpassen (Webhook-URL!).
 */
(function () {
  "use strict";

  // ===== CONFIG =================================================
  var CONFIG = {
    // Webhook-URL aus deiner n8n-Instanz (Production-URL des Webhook-Node).
    // Beispiel: https://n8n.deine-domain.de/webhook/robbe-chatbot
    WEBHOOK_URL: "https://n8n.srv1047901.hstgr.cloud/webhook/robbe-chatbot",
    TITLE: "Robbe KI-Assistent",
    SUBTITLE: "Fragen zu KI & Vertrieb? Frag mich.",
    ACCENT: "#B3000E",
    DATENSCHUTZ_URL: "https://www.robbe-consulting.de/datenschutz",
    KONTAKT_URL: "https://www.robbe-consulting.de/kontakt",
    GREETING:
      "Hallo! Ich bin der KI-Assistent von Robbe Sales & AI Consulting. " +
      "Ich beantworte dir gern Fragen zu KI-Beratung, Schulungen, Vertriebscoaching und unseren Angeboten. Womit kann ich helfen?",
    INACTIVITY_END_MS: 5 * 60 * 1000 // nach 5 Min Inaktivitaet gilt der Chat als beendet
  };
  // ==============================================================

  if (window.__robbeChatbotLoaded) return;
  window.__robbeChatbotLoaded = true;

  var sessionId =
    "s_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9);
  var startedAt = new Date().toISOString();
  var history = []; // [{role:'user'|'assistant', content:'...'}]
  var endSent = false;
  var inactivityTimer = null;
  var ACCENT = CONFIG.ACCENT;

  // ---------- Styles ----------
  var css =
    "#rc-btn{position:fixed;bottom:24px;right:24px;width:60px;height:60px;border-radius:50%;background:" +
    ACCENT +
    ";color:#fff;border:none;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.25);z-index:2147483000;display:flex;align-items:center;justify-content:center;transition:transform .15s}" +
    "#rc-btn:hover{transform:scale(1.06)}" +
    "#rc-btn svg{width:28px;height:28px}" +
    "#rc-panel{position:fixed;bottom:96px;right:24px;width:380px;max-width:calc(100vw - 32px);height:560px;max-height:calc(100vh - 120px);background:#fff;border-radius:16px;box-shadow:0 12px 48px rgba(0,0,0,.28);z-index:2147483000;display:none;flex-direction:column;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}" +
    "#rc-panel.rc-open{display:flex}" +
    "#rc-head{background:" +
    ACCENT +
    ";color:#fff;padding:16px 18px;display:flex;align-items:center;justify-content:space-between}" +
    "#rc-head h3{margin:0;font-size:15px;font-weight:700}" +
    "#rc-head p{margin:2px 0 0;font-size:12px;opacity:.9}" +
    "#rc-close{background:none;border:none;color:#fff;font-size:22px;cursor:pointer;line-height:1;padding:0 4px}" +
    "#rc-msgs{flex:1;overflow-y:auto;padding:16px;background:#F8F7F4}" +
    ".rc-msg{margin-bottom:12px;display:flex}" +
    ".rc-msg.rc-user{justify-content:flex-end}" +
    ".rc-bubble{max-width:80%;padding:10px 13px;border-radius:14px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word}" +
    ".rc-bot .rc-bubble{background:#fff;color:#1a1a1a;border:1px solid #ececec;border-bottom-left-radius:4px}" +
    ".rc-user .rc-bubble{background:" +
    ACCENT +
    ";color:#fff;border-bottom-right-radius:4px}" +
    ".rc-bubble a{color:inherit;text-decoration:underline}" +
    ".rc-bot .rc-bubble a{color:" +
    ACCENT +
    "}" +
    ".rc-typing{display:inline-flex;gap:4px;padding:4px 2px}" +
    ".rc-typing span{width:7px;height:7px;border-radius:50%;background:#bbb;animation:rc-bounce 1.2s infinite}" +
    ".rc-typing span:nth-child(2){animation-delay:.2s}.rc-typing span:nth-child(3){animation-delay:.4s}" +
    "@keyframes rc-bounce{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-5px);opacity:1}}" +
    "#rc-foot{border-top:1px solid #ececec;padding:10px;background:#fff}" +
    "#rc-form{display:flex;gap:8px;align-items:flex-end}" +
    "#rc-input{flex:1;border:1px solid #ddd;border-radius:10px;padding:10px;font-size:14px;resize:none;max-height:90px;font-family:inherit;outline:none}" +
    "#rc-input:focus{border-color:" +
    ACCENT +
    "}" +
    "#rc-send{background:" +
    ACCENT +
    ";color:#fff;border:none;border-radius:10px;width:42px;height:42px;cursor:pointer;flex:none;display:flex;align-items:center;justify-content:center}" +
    "#rc-send:disabled{opacity:.5;cursor:default}" +
    "#rc-send svg{width:20px;height:20px}" +
    "#rc-legal{font-size:10px;color:#999;text-align:center;margin:6px 0 0}" +
    "#rc-legal a{color:#999}";

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ---------- DOM ----------
  var btn = document.createElement("button");
  btn.id = "rc-btn";
  btn.setAttribute("aria-label", "Chat öffnen");
  btn.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>';

  var panel = document.createElement("div");
  panel.id = "rc-panel";
  panel.innerHTML =
    '<div id="rc-head"><div><h3>' +
    esc(CONFIG.TITLE) +
    "</h3><p>" +
    esc(CONFIG.SUBTITLE) +
    '</p></div><button id="rc-close" aria-label="Schließen">&times;</button></div>' +
    '<div id="rc-msgs"></div>' +
    '<div id="rc-foot"><form id="rc-form">' +
    '<textarea id="rc-input" rows="1" placeholder="Nachricht schreiben..."></textarea>' +
    '<button id="rc-send" type="submit" aria-label="Senden"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg></button>' +
    "</form>" +
    '<p id="rc-legal">KI-Assistent &middot; kann Fehler machen. <a href="' +
    CONFIG.DATENSCHUTZ_URL +
    '" target="_blank" rel="noopener">Datenschutz</a></p></div>';

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  var msgsEl = panel.querySelector("#rc-msgs");
  var formEl = panel.querySelector("#rc-form");
  var inputEl = panel.querySelector("#rc-input");
  var sendEl = panel.querySelector("#rc-send");
  var greeted = false;

  // ---------- Helpers ----------
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  // wandelt URLs in Links um (auf Basis von bereits escaptem Text)
  function linkify(s) {
    var t = esc(s);
    var store = [];
    // 1) Markdown-Links [Text](URL) -> echter Link (Text bleibt sichtbar)
    //    tolerant ggü. Leerzeichen/Umbruch zwischen ] und (
    t = t.replace(/\[([^\]]+)\]\s*\(\s*(https?:\/\/[^\s)]+)\s*\)/g, function (_, text, url) {
      url = url.replace(/[.,;:!?)]+$/, "");
      var token = "@@RCLINK" + store.length + "@@";
      store.push(
        '<a href="' + url + '" target="_blank" rel="noopener">' + text + "</a>"
      );
      return token;
    });
    // 2) uebrige nackte URLs verlinken; Satzzeichen/Klammer am Ende NICHT mitverlinken
    t = t.replace(/(https?:\/\/[^\s<]+)/g, function (u) {
      var trail = "";
      var m = u.match(/[.,;:!?)\]]+$/);
      if (m) {
        trail = m[0];
        u = u.slice(0, -trail.length);
      }
      return (
        '<a href="' + u + '" target="_blank" rel="noopener">' + u + "</a>" + trail
      );
    });
    // 3) gesicherte Markdown-Links wieder einsetzen
    t = t.replace(/@@RCLINK(\d+)@@/g, function (_, i) {
      return store[i];
    });
    return t;
  }
  function scrollDown() {
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }
  function addBubble(role, text) {
    var wrap = document.createElement("div");
    wrap.className = "rc-msg " + (role === "user" ? "rc-user" : "rc-bot");
    wrap.innerHTML =
      '<div class="rc-bubble">' + linkify(text) + "</div>";
    msgsEl.appendChild(wrap);
    scrollDown();
    return wrap;
  }
  function showTyping() {
    var wrap = document.createElement("div");
    wrap.className = "rc-msg rc-bot";
    wrap.id = "rc-typing-row";
    wrap.innerHTML =
      '<div class="rc-bubble"><span class="rc-typing"><span></span><span></span><span></span></span></div>';
    msgsEl.appendChild(wrap);
    scrollDown();
  }
  function hideTyping() {
    var t = document.getElementById("rc-typing-row");
    if (t) t.remove();
  }
  function bumpInactivity() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(sendEnd, CONFIG.INACTIVITY_END_MS);
  }

  function openPanel() {
    // Wurde die vorige Unterhaltung bereits als beendet gemeldet, frische Session starten
    if (endSent) resetSession();
    panel.classList.add("rc-open");
    if (!greeted) {
      greeted = true;
      addBubble("assistant", CONFIG.GREETING);
      history.push({ role: "assistant", content: CONFIG.GREETING });
    }
    inputEl.focus();
    bumpInactivity();
  }
  function closePanel() {
    panel.classList.remove("rc-open");
    // Schließen des Fensters gilt als Ende des Gesprächs -> Protokoll senden
    sendEnd();
  }

  // ---------- Senden ----------
  function send(text) {
    text = (text || "").trim();
    if (!text) return;
    addBubble("user", text);
    history.push({ role: "user", content: text });
    inputEl.value = "";
    inputEl.style.height = "auto";
    sendEl.disabled = true;
    showTyping();
    bumpInactivity();

    fetch(CONFIG.WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "message",
        sessionId: sessionId,
        message: text,
        history: history.slice(0, -1), // ohne die gerade gesendete Nachricht
        page: location.href,
        startedAt: startedAt
      })
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        hideTyping();
        var reply =
          (data && (data.reply || data.output || data.text)) ||
          "Entschuldigung, da ist etwas schiefgelaufen. Bitte versuche es erneut oder nutze unser [Kontaktformular](" +
            CONFIG.KONTAKT_URL +
            ").";
        addBubble("assistant", reply);
        history.push({ role: "assistant", content: reply });
      })
      .catch(function () {
        hideTyping();
        addBubble(
          "assistant",
          "Verbindung fehlgeschlagen. Bitte versuche es später erneut oder schreib uns über unser [Kontaktformular](" +
            CONFIG.KONTAKT_URL +
            ")."
        );
      })
      .finally(function () {
        sendEl.disabled = false;
        inputEl.focus();
        bumpInactivity();
      });
  }

  // ---------- Session-Ende (Protokoll an n8n) ----------
  function sendEnd() {
    if (endSent) return;
    // nur senden, wenn es echten Inhalt gibt (mind. eine User-Nachricht)
    var hasUser = history.some(function (m) {
      return m.role === "user";
    });
    if (!hasUser) {
      endSent = true;
      return;
    }
    endSent = true;
    var endedAt = new Date().toISOString();
    var durationSeconds = Math.round(
      (Date.now() - new Date(startedAt).getTime()) / 1000
    );
    var payload = JSON.stringify({
      type: "end",
      sessionId: sessionId,
      transcript: history,
      page: location.href,
      startedAt: startedAt,
      endedAt: endedAt,
      durationSeconds: durationSeconds
    });
    // fetch mit keepalive ist CORS-konform (mit Preflight) UND überlebt das
    // Schließen der Seite. sendBeacon scheidet aus, weil es cross-origin mit
    // application/json vom Browser blockiert wird (kein Preflight möglich).
    try {
      fetch(CONFIG.WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
        mode: "cors"
      }).catch(function () {});
    } catch (e) {
      /* ignore */
    }
  }

  // Startet eine frische Session (z. B. nach erneutem Öffnen des Chats)
  function resetSession() {
    sessionId =
      "s_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9);
    startedAt = new Date().toISOString();
    history = [];
    endSent = false;
  }

  // ---------- Events ----------
  btn.addEventListener("click", function () {
    if (panel.classList.contains("rc-open")) closePanel();
    else openPanel();
  });
  panel.querySelector("#rc-close").addEventListener("click", closePanel);
  formEl.addEventListener("submit", function (e) {
    e.preventDefault();
    send(inputEl.value);
  });
  inputEl.addEventListener("input", function () {
    inputEl.style.height = "auto";
    inputEl.style.height = Math.min(inputEl.scrollHeight, 90) + "px";
    bumpInactivity();
  });
  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(inputEl.value);
    }
  });
  // Chat als beendet melden, wenn der Besucher die Seite verlaesst
  window.addEventListener("pagehide", sendEnd);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      // Beacon beim Tab-Wechsel/Schliessen; bei Rueckkehr laeuft die Session weiter
      // (endSent verhindert Doppel-Mails)
    }
  });
})();

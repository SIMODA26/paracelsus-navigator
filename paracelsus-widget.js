/**
 * Paracelsus Kliniken — Universal Embeddable Widget
 * Version: 3.5.0 (Multi-Lingual, Accessibility & Zuweiser Portal)
 * 
 * Einbindung auf jeder beliebigen Website (Typo3, WordPress, Webflow, Custom):
 * <script src="https://simonda26.github.io/paracelsus-navigator/paracelsus-widget.js" defer></script>
 */

(function () {
  "use strict";

  if (window.ParacelsusWidgetLoaded) return;
  window.ParacelsusWidgetLoaded = true;

  const currentScript = document.currentScript;
  const baseUrl = currentScript ? currentScript.src.substring(0, currentScript.src.lastIndexOf("/")) : "";

  function loadStyleSheet(url) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    document.head.appendChild(link);
  }

  if (baseUrl) {
    loadStyleSheet(`${baseUrl}/src/widget.css`);
  }

  const widgetHtml = `
  <div id="paracelsusWidgetRoot">
    <!-- Floating Launcher Button -->
    <button class="paracelsus-chat-launcher" id="pcLauncherBtn" aria-label="Klinik-Wegweiser öffnen" aria-expanded="false" aria-controls="pcChatDrawer">
      <div class="launcher-icon-wrap">
        <img src="${baseUrl}/assets/bildmarke_p.png" alt="Paracelsus">
      </div>
      <div class="launcher-text-wrap">
        <span class="launcher-label">Klinik-Wegweiser</span>
        <span class="launcher-sublabel">Fachbereich finden &bull; Online</span>
      </div>
    </button>

    <!-- Chat Drawer Window -->
    <div class="paracelsus-chat-window closed" id="pcChatDrawer" role="dialog" aria-modal="false" aria-labelledby="pcHeaderTitle" aria-hidden="true">
      <div class="pc-header">
        <div class="pc-header-brand">
          <div class="pc-brand-p">
            <img src="${baseUrl}/assets/bildmarke_p.png" alt="Paracelsus">
          </div>
          <div class="pc-header-info">
            <h4 id="pcHeaderTitle">Paracelsus Wegweiser</h4>
            <span>Digitaler Lotsendienst</span>
          </div>
        </div>
        <div class="pc-header-controls">
          <button class="pc-font-btn" id="pcFontBtn" title="Schrift vergrößern">A+</button>
          <div class="pc-lang-picker" title="Sprache auswählen">
            <span class="pc-lang-globe" aria-hidden="true">🌐</span>
            <select class="pc-lang-select" id="pcLangSelect" aria-label="Sprache auswählen">
              <option value="de" selected>DE</option>
              <option value="en">EN</option>
              <option value="tr">TR</option>
              <option value="uk">UK</option>
            </select>
          </div>
          <button class="pc-close-btn" id="pcCloseBtn" aria-label="Schließen">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>

      <div class="pc-safety-banner">
        <div class="pc-safety-left">
          <span class="pc-legal-badge" title="Reiner Orientierungsdienst ohne medizinische Diagnostik. Keine Klarnamen erfassen. DSGVO Art. 9 & MDR konform.">
            🔒 Reiner Lotsendienst &bull; Keine Diagnostik
          </span>
        </div>
        <a href="tel:112" class="pc-emergency-badge">🚨 Notruf 112</a>
      </div>

      <div class="pc-messages-area" id="pcDrawerMessages" role="log" aria-live="polite">
        <div class="pc-msg bot">
          Guten Tag! Ich bin der digitale Wegweiser der Paracelsus Kliniken. Ich helfe Ihnen, direkt den richtigen Fachbereich, den passenden Klinikstandort oder Ihren Ansprechpartner zu finden.
          <br><br>
          <strong>Wobei dürfen wir Ihnen behilflich sein?</strong>
          <div class="pc-chips">
            <button class="pc-chip" data-query="Parkinson & Bewegungsstörungen"><span>🧠</span> Parkinson</button>
            <button class="pc-chip" data-query="Prostata & Urologie"><span>🔬</span> Urologie</button>
            <button class="pc-chip" data-query="Gelenke, Knie & Hüfte"><span>🦴</span> Orthopädie</button>
            <button class="pc-chip" data-query="Zentrale Notaufnahme"><span>🚑</span> Notaufnahme</button>
            <button class="pc-chip" data-query="Checkliste für die Aufnahme"><span>📋</span> Kofferliste</button>
            <button class="pc-chip" data-query="Zuweiser und Ärzteportal"><span>🩺</span> Zuweiser</button>
          </div>
        </div>
      </div>

      <form class="pc-input-bar" id="pcDrawerForm">
        <label for="pcDrawerInput" class="visually-hidden">Ihre Frage an den Paracelsus Wegweiser</label>
        <input 
          type="text" 
          id="pcDrawerInput" 
          placeholder="Frage oder Thema eingeben..." 
          autocomplete="off"
          autocorrect="off"
          autocapitalize="sentences"
          enterkeyhint="send"
          aria-label="Suchanfrage eingeben"
        >
        <button type="button" class="pc-dock-btn pc-voice-btn" id="pcVoiceBtn" title="Spracheingabe starten" aria-label="Spracheingabe starten">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        </button>
        <button type="submit" class="pc-send-btn" aria-label="Senden">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </form>
    </div>
  </div>
  `;

  function ensureDependency(url, globalCheck, callback) {
    if (window[globalCheck]) {
      callback();
      return;
    }
    const script = document.createElement("script");
    script.src = url;
    script.onload = callback;
    document.head.appendChild(script);
  }

  function init() {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = widgetHtml;
    document.body.appendChild(wrapper);

    ensureDependency(`${baseUrl}/data/standorte.js`, "PARACELSUS_STANDORTE", () => {
      ensureDependency(`${baseUrl}/src/bot-engine.js`, "ParacelsusBotEngine", () => {
        const engine = new window.ParacelsusBotEngine(window.PARACELSUS_STANDORTE || []);
        attachListeners(engine);
      });
    });
  }

  function speakText(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/<[^>]*>?/gm, "").replace(/[•*#]/g, "");
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = "de-DE";
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }

  function attachListeners(engine) {
    const drawer = document.getElementById("pcChatDrawer");
    const launcher = document.getElementById("pcLauncherBtn");
    const closeBtn = document.getElementById("pcCloseBtn");
    const form = document.getElementById("pcDrawerForm");
    const input = document.getElementById("pcDrawerInput");
    const messages = document.getElementById("pcDrawerMessages");
    const voiceBtn = document.getElementById("pcVoiceBtn");
    const fontBtn = document.getElementById("pcFontBtn");

    let fontCycleIndex = 0;
    fontBtn.addEventListener("click", () => {
      fontCycleIndex = (fontCycleIndex + 1) % 3;
      drawer.classList.remove("font-size-large", "font-size-xlarge");
      if (fontCycleIndex === 1) {
        drawer.classList.add("font-size-large");
        fontBtn.innerText = "A++";
      } else if (fontCycleIndex === 2) {
        drawer.classList.add("font-size-xlarge");
        fontBtn.innerText = "A";
      } else {
        fontBtn.innerText = "A+";
      }
    });

    const langSelect = document.getElementById("pcLangSelect");
    if (langSelect) {
      langSelect.addEventListener("change", (e) => {
        const lang = e.target.value;
        engine.setLanguage(lang);
        const welcomeTexts = {
          de: "Sprache auf Deutsch umgestellt. Wie kann ich Ihnen helfen?",
          en: "Switched to English. How can we help you today?",
          tr: "Türkçe diline geçildi. Size nasıl yardımcı olabiliriz?",
          uk: "Мову змінено на українську. Чим ми можемо вам допомогти?"
        };
        renderResponse({ type: "info", title: "Language", message: welcomeTexts[lang] || welcomeTexts.de, chips: ["Urologie (Düsseldorf)", "Parkinson (Kassel)", "Orthopädie (Bremen)"] });
      });
    }

    function toggleChat(force) {
      if (typeof force === "boolean") {
        if (force) drawer.classList.remove("closed");
        else drawer.classList.add("closed");
      } else {
        drawer.classList.toggle("closed");
      }
      const isOpen = !drawer.classList.contains("closed");
      launcher.classList.toggle("chat-open", isOpen);
      launcher.setAttribute("aria-expanded", isOpen ? "true" : "false");
      drawer.setAttribute("aria-hidden", isOpen ? "false" : "true");
      if (isOpen) {
        setTimeout(() => input.focus(), 250);
      }
    }

    // Modern Web Guidance: IME-safe enter-to-submit check (prevents premature submit during character conversion)
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        if (event.isComposing || event.keyCode === 229) {
          return;
        }
      }
    });

    launcher.addEventListener("click", () => toggleChat());
    closeBtn.addEventListener("click", () => toggleChat(false));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !drawer.classList.contains("closed")) {
        toggleChat(false);
      }
    });

    messages.addEventListener("click", (e) => {
      const chip = e.target.closest(".pc-chip");
      if (chip && chip.dataset.query) {
        input.value = chip.dataset.query;
        handleSend();
        return;
      }

      const ttsBtn = e.target.closest(".pc-tts-btn");
      if (ttsBtn && ttsBtn.dataset.tts) {
        speakText(ttsBtn.dataset.tts);
        return;
      }

      const calBtn = e.target.closest(".pc-cal-btn");
      if (calBtn && calBtn.dataset.clinicId) {
        downloadCalendar(calBtn.dataset.clinicId);
        return;
      }

      const fbBtn = e.target.closest(".pc-feedback-btn");
      if (fbBtn && fbBtn.dataset.rating) {
        if (engine.analytics && engine.analytics.recordFeedback) {
          engine.analytics.recordFeedback(fbBtn.dataset.rating);
        }
        const bar = fbBtn.closest(".pc-feedback-bar");
        if (bar) {
          bar.innerHTML = '<span class="pc-feedback-thanks">✓ Vielen Dank für Ihre Rückmeldung!</span>';
        }
      }
    });

    function downloadCalendar(clinicId) {
      const standorte = window.PARACELSUS_STANDORTE || [];
      const clinic = standorte.find(c => c.id === clinicId);
      if (!clinic) return;
      const getIcs = (typeof createCalendarEventContent === "function") 
        ? createCalendarEventContent 
        : (window.createCalendarEventContent || null);
      if (!getIcs) return;
      const ics = getIcs(clinic);
      if (!ics) return;
      if (engine.analytics && engine.analytics.recordCalendarDownload) {
        engine.analytics.recordCalendarDownload();
      }
      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `paracelsus-${clinic.id}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function getFeedbackBarHtml() {
      return `
        <div class="pc-feedback-bar">
          <span>War das hilfreich?</span>
          <button type="button" class="pc-feedback-btn" data-rating="ja">Ja</button>
          <span>&bull;</span>
          <button type="button" class="pc-feedback-btn" data-rating="maessig">Mäßig</button>
          <span>&bull;</span>
          <button type="button" class="pc-feedback-btn" data-rating="nein">Nein</button>
        </div>
      `;
    }

    let recognition = null;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.lang = "de-DE";
      recognition.interimResults = false;
      recognition.onstart = () => {
        voiceBtn.classList.add("recording");
        input.placeholder = "Ich höre zu...";
      };
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        input.value = transcript;
        handleSend(true);
      };
      recognition.onerror = () => {
        voiceBtn.classList.remove("recording");
        input.placeholder = "Beschwerde oder Fachbereich eingeben...";
      };
      recognition.onend = () => {
        voiceBtn.classList.remove("recording");
        input.placeholder = "Beschwerde oder Fachbereich eingeben...";
      };

      voiceBtn.addEventListener("click", () => {
        try {
          recognition.start();
        } catch (err) {
          recognition.stop();
        }
      });
    } else {
      voiceBtn.style.display = "none";
    }

    function escapeHtml(str) {
      return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function appendMsg(content, type = "bot", extraClass = "") {
      const div = document.createElement("div");
      div.className = `pc-msg ${type} ${extraClass}`.trim();
      if (type === "user") {
        div.textContent = content;
      } else {
        div.innerHTML = content;
      }
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    function handleSend(isVoice = false) {
      const text = input.value.trim();
      if (!text) return;

      appendMsg(text, "user");
      input.value = "";

      setTimeout(() => {
        const res = engine.processQuery(text, isVoice);
        renderResponse(res);
      }, 300);
    }

    function renderResponse(res) {
      if (res.type === "emergency") {
        const ttsText = `${res.message}. ${res.guidance}`;
        const html = `
          <div class="pc-emergency-head">🚨 ${escapeHtml(res.alertTitle)}</div>
          <p style="font-weight: 700; font-size: 15px; margin-bottom: 6px;">${escapeHtml(res.message)}</p>
          <p style="font-size: 13px; line-height: 1.4; margin-bottom: 10px;">${escapeHtml(res.guidance)}</p>
          <a href="tel:${escapeHtml(res.emergencyCall)}" class="pc-emergency-call-btn">☎️ ${escapeHtml(res.actionText)}</a>
          <button type="button" class="pc-tts-btn" data-tts="${escapeHtml(ttsText)}">🔊 Vorlesen</button>
          <p style="font-size: 11px; margin-top: 10px; opacity: 0.85;">${escapeHtml(res.secondaryNotice)}</p>
        `;
        appendMsg(html, "bot", "emergency-box");
        return;
      }

      if (res.type === "unsupported") {
        let html = `<strong>${escapeHtml(res.title)}</strong><br>${escapeHtml(res.message)}<br><br>${escapeHtml(res.recommendation)}`;
        html += `<br><a href="tel:116117" class="pc-hotline-btn">📞 Ärztlicher Bereitschaftsdienst: 116 117</a>`;
        if (res.chips && res.chips.length > 0) {
          html += `<div class="pc-chips">`;
          res.chips.forEach(c => {
            html += `<button class="pc-chip" data-query="${escapeHtml(c)}">${escapeHtml(c)}</button>`;
          });
          html += `</div>`;
        }
        html += getFeedbackBarHtml();
        appendMsg(html, "bot", "unsupported-box");
        return;
      }

      if (res.type === "zuweiser") {
        let html = `<strong>🩺 ${escapeHtml(res.title)}</strong><br>${escapeHtml(res.message)}`;
        html += `<div style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px;">`;
        (res.zuweiserContacts || []).forEach(z => {
          html += `
            <div class="pc-zuweiser-card">
              <div class="pc-zuweiser-clinic">${escapeHtml(z.clinic)}</div>
              <div style="font-size: 11px; color: #555;">${escapeHtml(z.note)}</div>
              <div class="pc-zuweiser-details">
                <span>📞 Tel: <a href="tel:${escapeHtml(z.phone)}" style="color: var(--gruen); font-weight: 700;">${escapeHtml(z.phone)}</a></span>
                <span>📠 Fax: ${escapeHtml(z.fax)}</span>
              </div>
            </div>
          `;
        });
        html += `</div>`;
        if (res.chips && res.chips.length > 0) {
          html += `<div class="pc-chips">`;
          res.chips.forEach(c => {
            html += `<button class="pc-chip" data-query="${escapeHtml(c)}">${escapeHtml(c)}</button>`;
          });
          html += `</div>`;
        }
        html += getFeedbackBarHtml();
        appendMsg(html, "bot");
        return;
      }

      if (res.type === "checklist") {
        let html = `<strong>📋 ${escapeHtml(res.title)}</strong><br>${escapeHtml(res.message)}<ul class="pc-clinic-highlights" style="margin-top: 10px;">`;
        (res.checklistItems || []).forEach(item => {
          html += `<li>${escapeHtml(item)}</li>`;
        });
        html += `</ul>`;
        if (res.chips && res.chips.length > 0) {
          html += `<div class="pc-chips">`;
          res.chips.forEach(c => {
            html += `<button class="pc-chip" data-query="${escapeHtml(c)}">${escapeHtml(c)}</button>`;
          });
          html += `</div>`;
        }
        html += getFeedbackBarHtml();
        appendMsg(html, "bot");
        return;
      }

      if (res.type === "visiting") {
        let html = `<strong>🕐 ${escapeHtml(res.title || "Besuchszeiten & Anfahrt")}</strong><br>${escapeHtml(res.message)}`;
        if (res.standorteList && res.standorteList.length > 0) {
          html += `<div style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px;">`;
          res.standorteList.forEach(s => {
            html += `
              <div class="pc-zuweiser-card">
                <div class="pc-zuweiser-clinic">${escapeHtml(s.name)} (📍 ${escapeHtml(s.city)})</div>
                <div style="font-size: 11.5px; color: #3b5758; margin-top: 2px;">🕒 <strong>Besuchszeiten:</strong> ${escapeHtml(s.hours || "Keine Einschränkung")}</div>
                <div class="pc-zuweiser-details">
                  ${s.phone ? `<span>📞 <a href="tel:${escapeHtml(s.phone)}" style="color: var(--gruen); font-weight: 700;">${escapeHtml(s.phone)}</a></span>` : ""}
                  ${s.mapsUrl ? `<span>🗺️ <a href="${escapeHtml(s.mapsUrl)}" target="_blank" rel="noopener noreferrer" style="color: var(--gruen); font-weight: 700;">Anfahrt (Maps)</a></span>` : ""}
                </div>
              </div>
            `;
          });
          html += `</div>`;
        }
        const ttsVisiting = `${res.title || ""}. ${res.message || ""}`;
        html += `<button type="button" class="pc-tts-btn" data-tts="${escapeHtml(ttsVisiting)}">🔊 Vorlesen</button>`;
        if (res.chips && res.chips.length > 0) {
          html += `<div class="pc-chips">`;
          res.chips.forEach(c => {
            html += `<button class="pc-chip" data-query="${escapeHtml(c)}">${escapeHtml(c)}</button>`;
          });
          html += `</div>`;
        }
        html += getFeedbackBarHtml();
        appendMsg(html, "bot");
        return;
      }

      let html = `<strong>${escapeHtml(res.title || "Paracelsus Wegweiser")}</strong><br>${res.message || ""}`;

      if (res.clinic) {
        html += `
          <div class="pc-clinic-card">
            <div class="pc-clinic-header">
              <span class="pc-clinic-badge">Empfohlenes Fachzentrum</span>
              <span class="pc-clinic-name">${escapeHtml(res.clinic.name)}</span>
              <span class="pc-clinic-location">📍 ${escapeHtml(res.clinic.city)} &bull; ${escapeHtml(res.clinic.type)}</span>
            </div>
            <ul class="pc-clinic-highlights">
              ${res.clinic.specialties ? res.clinic.specialties.slice(0, 3).map(s => `<li>${escapeHtml(s)}</li>`).join("") : ""}
            </ul>
            <div class="pc-clinic-actions">
              <a href="${escapeHtml(res.clinic.url)}" target="_blank" rel="noopener noreferrer" class="pc-btn-primary">Klinikseite & Termin &rarr;</a>
              <button type="button" class="pc-cal-btn" data-clinic-id="${escapeHtml(res.clinic.id)}">📅 Im Kalender merken</button>
              <a href="tel:${escapeHtml(res.clinic.phone)}" class="pc-phone-label">📞 ${escapeHtml(res.clinic.phone)}</a>
              ${res.clinic.mapsUrl ? `<a href="${escapeHtml(res.clinic.mapsUrl)}" target="_blank" rel="noopener noreferrer" class="pc-maps-link" title="Route in Google Maps">🗺️ Route</a>` : ""}
            </div>
          </div>
        `;
      }

      if (res.links && res.links.length > 0) {
        html += `<ul style="margin-top: 10px; padding-left: 18px; font-size: 13px;">`;
        res.links.forEach(l => {
          html += `<li><a href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer" style="color: var(--gruen); font-weight: 700;">${escapeHtml(l.label)}</a></li>`;
        });
        html += `</ul>`;
      }

      const ttsStd = `${res.title || ""} ${(res.message || "").replace(/[*_]/g, "")}`;
      html += `<button type="button" class="pc-tts-btn" data-tts="${escapeHtml(ttsStd)}">🔊 Vorlesen</button>`;

      if (res.chips && res.chips.length > 0) {
        html += `<div class="pc-chips">`;
        res.chips.forEach(c => {
          html += `<button class="pc-chip" data-query="${escapeHtml(c)}">${escapeHtml(c)}</button>`;
        });
        html += `</div>`;
      }

      html += getFeedbackBarHtml();

      appendMsg(html, "bot");
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      handleSend();
    });

    window.ParacelsusWidget = {
      open: () => toggleChat(true),
      close: () => toggleChat(false),
      search: (q) => {
        toggleChat(true);
        input.value = q;
        handleSend();
      }
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

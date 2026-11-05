/**
 * Paracelsus Klinik-Wegweiser — Universal Embed & Live Injector
 * Ermöglicht die nahtlose Einbindung auf https://www.paracelsus-kliniken.de
 * oder jeder beliebigen Partner-Website mit einer einzigen Zeile Code.
 */
(function() {
  if (document.getElementById("paracelsus-navigator-root")) {
    console.log("Paracelsus Navigator ist bereits geladen.");
    if (typeof window.toggleChat === "function") window.toggleChat(true);
    return;
  }

  const BASE_URL = "https://simoda26.github.io/paracelsus-navigator";

  // 1. CSS einbinden
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = BASE_URL + "/src/widget.css?v=" + Date.now();
  document.head.appendChild(link);

  // 2. Skripte sequentiell nachladen
  function loadScript(src, cb) {
    const s = document.createElement("script");
    s.src = src;
    s.onload = cb;
    document.body.appendChild(s);
  }

  loadScript(BASE_URL + "/data/standorte.js", function() {
    loadScript(BASE_URL + "/src/bot-engine.js", function() {
      initWidget();
    });
  });

  function initWidget() {
    const root = document.createElement("div");
    root.id = "paracelsus-navigator-root";
    root.innerHTML = `
      <!-- Launcher Button -->
      <button class="paracelsus-chat-launcher" id="chatLauncher" onclick="window.toggleChat()" aria-label="Wegweiser öffnen" aria-expanded="false" aria-controls="chatWindow">
        <div class="launcher-icon-wrap">
          <img src="${BASE_URL}/assets/bildmarke_p.png" alt="Paracelsus P">
        </div>
        <div class="launcher-text-wrap">
          <span class="launcher-label">Klinik-Wegweiser</span>
          <span class="launcher-sublabel">Fachbereich finden &bull; Online</span>
        </div>
      </button>

      <!-- Chat Window Drawer (Frosted Glass Popup) -->
      <div class="paracelsus-chat-window closed" id="chatWindow" role="dialog" aria-modal="false" aria-labelledby="chatHeaderTitle" aria-hidden="true">
        <div class="pc-header">
          <div class="pc-header-brand">
            <div class="pc-brand-p">
              <img src="${BASE_URL}/assets/bildmarke_p.png" alt="P">
            </div>
            <div class="pc-header-info">
              <h4 id="chatHeaderTitle">Paracelsus Wegweiser</h4>
              <span>Digitaler Lotsendienst</span>
            </div>
          </div>
          
          <div class="pc-header-controls">
            <button class="pc-font-btn" id="pcFontBtn" onclick="window.cycleFontSize()" title="Schriftgröße anpassen">A+</button>
            <div class="pc-lang-picker" title="Sprache auswählen">
              <span class="pc-lang-globe" aria-hidden="true">🌐</span>
              <select class="pc-lang-select" id="pcLangSelect" onchange="window.switchLanguage(this.value)" aria-label="Sprache auswählen">
                <option value="de" selected>DE</option>
                <option value="en">EN</option>
                <option value="tr">TR</option>
                <option value="uk">UK</option>
              </select>
            </div>
            <button class="pc-close-btn" onclick="window.toggleChat(false)" aria-label="Schließen">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>

        <div class="pc-safety-banner">
          <div class="pc-safety-left">
            <span class="pc-legal-badge" title="Reiner Orientierungsdienst ohne medizinische Diagnostik. DSGVO Art. 9 & MDR konform.">
              🔒 Reiner Lotsendienst &bull; Keine Diagnostik
            </span>
          </div>
          <a href="tel:112" class="pc-emergency-badge" onclick="window.engine.analytics.recordClick('emergency', '112')">🚨 Notruf 112</a>
        </div>

        <div class="pc-messages-area" id="pcMessages" role="log" aria-live="polite">
          <div class="pc-msg bot">
            Guten Tag! Ich bin der digitale Wegweiser der Paracelsus Kliniken. Ich helfe Ihnen, direkt den richtigen Fachbereich, den passenden Klinikstandort oder Ihren Ansprechpartner zu finden.
            <br><br>
            <strong>Wobei können wir Ihnen heute helfen?</strong>
            <div class="pc-chips">
              <button class="pc-chip" data-query="Parkinson &amp; Bewegungsstörungen"><span>🧠</span> Parkinson</button>
              <button class="pc-chip" data-query="Prostata &amp; Urologie"><span>🔬</span> Urologie</button>
              <button class="pc-chip" data-query="Gelenke, Knie &amp; Hüfte"><span>🦴</span> Orthopädie</button>
              <button class="pc-chip" data-query="Zentrale Notaufnahme"><span>🚑</span> Notaufnahme</button>
              <button class="pc-chip" data-query="Checkliste für den Klinikaufenthalt"><span>📋</span> Kofferliste</button>
              <button class="pc-chip" data-query="Zuweiser und Ärzteportal"><span>🩺</span> Zuweiser</button>
            </div>
          </div>
        </div>

        <form class="pc-input-bar" id="pcForm" onsubmit="window.handleFormSubmit(event)">
          <label for="pcInput" class="visually-hidden">Ihre Frage an den Paracelsus Wegweiser</label>
          <input 
            type="text" 
            id="pcInput" 
            placeholder="Frage oder Thema eingeben..." 
            autocomplete="off"
            autocorrect="off"
            autocapitalize="sentences"
            enterkeyhint="send"
            aria-label="Suchanfrage eingeben"
          >
          <button type="submit" class="pc-send-btn" aria-label="Senden">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(root);

    // Initialisierung Engine & Controller
    window.engine = new ParacelsusBotEngine(window.PARACELSUS_STANDORTE || []);
    const chatWindow = document.getElementById("chatWindow");
    const messagesArea = document.getElementById("pcMessages");
    const chatInput = document.getElementById("pcInput");

    let fontCycleIndex = 0;
    window.cycleFontSize = function() {
      fontCycleIndex = (fontCycleIndex + 1) % 3;
      chatWindow.classList.remove("font-size-large", "font-size-xlarge");
      const btn = document.getElementById("pcFontBtn");
      if (fontCycleIndex === 1) {
        chatWindow.classList.add("font-size-large");
        if (btn) btn.innerText = "A++";
      } else if (fontCycleIndex === 2) {
        chatWindow.classList.add("font-size-xlarge");
        if (btn) btn.innerText = "A";
      } else {
        if (btn) btn.innerText = "A+";
      }
    };

    window.switchLanguage = function(lang) {
      window.engine.setLanguage(lang);
      const select = document.getElementById("pcLangSelect");
      if (select && select.value !== lang) select.value = lang;
      const welcomeTexts = {
        de: "Sprache auf Deutsch umgestellt. Wie kann ich Ihnen helfen?",
        en: "Switched to English. How can we help you today?",
        tr: "Türkçe diline geçildi. Size nasıl yardımcı olabiliriz?",
        uk: "Мову змінено на українську. Чим ми можемо вам допомогти?"
      };
      window.appendBotResponse({ type: "info", title: "Language", message: welcomeTexts[lang] || welcomeTexts.de, chips: ["Urologie (Düsseldorf)", "Parkinson (Kassel)", "Orthopädie (Bremen)"] });
    };

    window.toggleChat = function(forceState) {
      const launcher = document.getElementById("chatLauncher");
      if (typeof forceState === "boolean") {
        if (forceState) chatWindow.classList.remove("closed");
        else chatWindow.classList.add("closed");
      } else {
        chatWindow.classList.toggle("closed");
      }
      const isOpen = !chatWindow.classList.contains("closed");
      if (launcher) {
        launcher.classList.toggle("chat-open", isOpen);
        launcher.setAttribute("aria-expanded", isOpen ? "true" : "false");
      }
      chatWindow.setAttribute("aria-hidden", isOpen ? "false" : "true");
      if (isOpen) {
        setTimeout(() => chatInput && chatInput.focus(), 250);
      }
    };

    function escapeHtml(str) {
      return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }
    window.escapeHtml = escapeHtml;

    if (messagesArea) {
      messagesArea.addEventListener("click", (e) => {
        const chip = e.target.closest(".pc-chip");
        if (chip && chip.dataset.query) {
          if (chatInput) {
            chatInput.value = chip.dataset.query;
            window.handleFormSubmit();
          }
          return;
        }

        const ttsBtn = e.target.closest(".pc-tts-btn");
        if (ttsBtn && ttsBtn.dataset.tts) {
          window.speakText(ttsBtn.dataset.tts);
          return;
        }

        const calBtn = e.target.closest(".pc-cal-btn");
        if (calBtn && calBtn.dataset.clinicId) {
          window.downloadClinicCalendar(calBtn.dataset.clinicId);
          return;
        }

        const fbBtn = e.target.closest(".pc-feedback-btn");
        if (fbBtn && fbBtn.dataset.rating) {
          window.sendFeedback(fbBtn, fbBtn.dataset.rating);
          return;
        }
      });
    }

    if (chatInput) {
      chatInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          if (event.isComposing || event.keyCode === 229) {
            return;
          }
        }
      });
    }

    window.printChecklist = function() {
      window.print();
    };

    window.handleChipClick = function(chipText) {
      if (!chatInput) return;
      chatInput.value = chipText;
      window.handleFormSubmit();
    };

    window.appendUserMessage = function(text) {
      const msg = document.createElement("div");
      msg.className = "pc-msg user";
      msg.textContent = text;
      messagesArea.appendChild(msg);
      messagesArea.scrollTop = messagesArea.scrollHeight;
    };

    window.speakText = function(text) {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const clean = text.replace(/<[^>]*>?/gm, "").replace(/[•*#]/g, "");
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = "de-DE";
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    };

    window.sendFeedback = function(btn, rating) {
      window.engine.analytics.recordFeedback(rating);
      const bar = btn.closest(".pc-feedback-bar");
      if (bar) {
        bar.innerHTML = `<span class="pc-feedback-thanks">✓ Vielen Dank für Ihre Rückmeldung!</span>`;
      }
    };

    window.getFeedbackBarHtml = function() {
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
    };

    window.downloadClinicCalendar = function(clinicId) {
      const standorte = window.PARACELSUS_STANDORTE || [];
      const clinic = standorte.find(c => c.id === clinicId);
      if (!clinic) return;
      const ics = typeof createCalendarEventContent === "function" ? createCalendarEventContent(clinic) : null;
      if (!ics) return;
      window.engine.analytics.recordCalendarDownload();
      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `paracelsus-${clinic.id}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    window.appendBotResponse = function(res) {
      const msg = document.createElement("div");

      // Notfall
      if (res.type === "emergency") {
        msg.className = "pc-msg emergency-box";
        const ttsText = `${res.message}. ${res.guidance}`;
        msg.innerHTML = `
          <div class="pc-emergency-head">🚨 ${escapeHtml(res.alertTitle)}</div>
          <p style="font-weight: 700; font-size: 15px; margin-bottom: 6px;">${escapeHtml(res.message)}</p>
          <p style="font-size: 13px; line-height: 1.45; margin-bottom: 10px;">${escapeHtml(res.guidance)}</p>
          <a href="tel:${escapeHtml(res.emergencyCall)}" class="pc-emergency-call-btn" onclick="window.engine.analytics.recordClick('emergency', '${escapeHtml(res.emergencyCall)}')">☎️ ${escapeHtml(res.actionText)}</a>
          <button type="button" class="pc-tts-btn" data-tts="${escapeHtml(ttsText)}">🔊 Vorlesen</button>
          <p style="font-size: 11px; margin-top: 10px; opacity: 0.85;">${escapeHtml(res.secondaryNotice)}</p>
        `;
        messagesArea.appendChild(msg);
        messagesArea.scrollTop = messagesArea.scrollHeight;
        return;
      }

      // Unsupported
      if (res.type === "unsupported") {
        msg.className = "pc-msg unsupported-box";
        let html = `<strong>${escapeHtml(res.title)}</strong><br>${escapeHtml(res.message)}<br><br>${escapeHtml(res.recommendation)}`;
        html += `<br><a href="tel:116117" class="pc-hotline-btn" onclick="window.engine.analytics.recordClick('hotline', '116117')">📞 Ärztlicher Bereitschaftsdienst: 116 117</a>`;
        if (res.chips && res.chips.length > 0) {
          html += `<div class="pc-chips">`;
          res.chips.forEach(c => { html += `<button class="pc-chip" data-query="${escapeHtml(c)}">${escapeHtml(c)}</button>`; });
          html += `</div>`;
        }
        html += window.getFeedbackBarHtml();
        msg.innerHTML = html;
        messagesArea.appendChild(msg);
        messagesArea.scrollTop = messagesArea.scrollHeight;
        return;
      }

      // Zuweiser- & Facharztportal
      if (res.type === "zuweiser") {
        msg.className = "pc-msg bot";
        let html = `<strong>🩺 ${escapeHtml(res.title || "Zuweiserportal")}</strong><br>${escapeHtml(res.message)}`;
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
          res.chips.forEach(c => { html += `<button class="pc-chip" data-query="${escapeHtml(c)}">${escapeHtml(c)}</button>`; });
          html += `</div>`;
        }
        html += window.getFeedbackBarHtml();
        msg.innerHTML = html;
        messagesArea.appendChild(msg);
        messagesArea.scrollTop = messagesArea.scrollHeight;
        return;
      }

      // Checkliste
      if (res.type === "checklist") {
        msg.className = "pc-msg bot";
        const total = (res.checklistItems || []).length;
        let html = `<strong>📋 ${escapeHtml(res.title)}</strong><br>${escapeHtml(res.message)}`;
        html += `
          <div class="pc-checklist-wrapper" id="checklistWrapper">
            <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: var(--salbei);">
              <span>Pack-Fortschritt</span>
              <span id="packProgressText">0 von ${total} erledigt</span>
            </div>
            <div class="pc-checklist-progress-bar">
              <div class="pc-checklist-progress-fill" id="packProgressBar"></div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
        `;
        (res.checklistItems || []).forEach((item, idx) => {
          html += `
            <label class="pc-check-item" id="checkLabel_${idx}">
              <input type="checkbox" onchange="window.updateChecklistProgress(${idx}, ${total})">
              <span>${escapeHtml(item)}</span>
            </label>
          `;
        });
        html += `
            </div>
            <div class="pc-checklist-complete-badge" id="packCelebration" style="display: none;">✨ Alles erledigt! Sie sind bestens auf Ihren Aufenthalt vorbereitet.</div>
          </div>
          <div style="margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
            <button type="button" class="pc-print-btn" onclick="window.printChecklist()">🖨️ Packliste drucken / PDF</button>
            <button type="button" class="pc-tts-btn" data-tts="${escapeHtml(res.message)}">🔊 Vorlesen</button>
          </div>
        `;
        if (res.chips && res.chips.length > 0) {
          html += `<div class="pc-chips">`;
          res.chips.forEach(c => { html += `<button class="pc-chip" data-query="${escapeHtml(c)}">${escapeHtml(c)}</button>`; });
          html += `</div>`;
        }
        html += window.getFeedbackBarHtml();
        msg.innerHTML = html;
        messagesArea.appendChild(msg);
        messagesArea.scrollTop = messagesArea.scrollHeight;
        return;
      }

      // Besuchszeiten & Anfahrt
      if (res.type === "visiting") {
        msg.className = "pc-msg bot";
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
          res.chips.forEach(c => { html += `<button class="pc-chip" data-query="${escapeHtml(c)}">${escapeHtml(c)}</button>`; });
          html += `</div>`;
        }
        html += window.getFeedbackBarHtml();
        msg.innerHTML = html;
        messagesArea.appendChild(msg);
        messagesArea.scrollTop = messagesArea.scrollHeight;
        return;
      }

      // Standard Klinik-Matching / Info / Fallback
      msg.className = "pc-msg bot";
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
              <a href="${escapeHtml(res.clinic.url)}" target="_blank" rel="noopener noreferrer" class="pc-btn-primary" onclick="window.engine.analytics.recordClick('clinic_url', '${escapeHtml(res.clinic.id)}')">Klinikseite & Termin &rarr;</a>
              <button type="button" class="pc-cal-btn" data-clinic-id="${escapeHtml(res.clinic.id)}">📅 Im Kalender merken</button>
              <a href="tel:${escapeHtml(res.clinic.phone)}" class="pc-phone-label" onclick="window.engine.analytics.recordClick('phone', '${escapeHtml(res.clinic.id)}')">📞 ${escapeHtml(res.clinic.phone)}</a>
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
        res.chips.forEach(c => { html += `<button class="pc-chip" data-query="${escapeHtml(c)}">${escapeHtml(c)}</button>`; });
        html += `</div>`;
      }
      html += window.getFeedbackBarHtml();
      msg.innerHTML = html;
      messagesArea.appendChild(msg);
      messagesArea.scrollTop = messagesArea.scrollHeight;
    };

    window.updateChecklistProgress = function(idx, total) {
      const label = document.getElementById(`checkLabel_${idx}`);
      if (!label) return;
      const checkbox = label.querySelector("input[type='checkbox']");
      if (checkbox && checkbox.checked) label.classList.add("checked");
      else label.classList.remove("checked");

      const checkedCount = document.querySelectorAll("#checklistWrapper input[type='checkbox']:checked").length;
      const progressText = document.getElementById("packProgressText");
      const progressBar = document.getElementById("packProgressBar");
      const celebration = document.getElementById("packCelebration");
      if (progressText && progressBar) {
        progressText.innerText = `${checkedCount} von ${total} erledigt`;
        progressBar.style.width = `${Math.round((checkedCount / total) * 100)}%`;
        if (celebration) celebration.style.display = checkedCount === total ? "block" : "none";
      }
    };

    window.handleFormSubmit = function(e) {
      if (e) e.preventDefault();
      const text = chatInput ? chatInput.value.trim() : "";
      if (!text) return;
      window.appendUserMessage(text);
      chatInput.value = "";
      setTimeout(() => {
        const result = window.engine.processQuery(text);
        window.appendBotResponse(result);
      }, 300);
    };

    console.log("Paracelsus Navigator erfolgreich initialisiert!");
  }
})();


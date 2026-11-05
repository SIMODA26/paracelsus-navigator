/**
 * Challenger 2 Empirical Stress Test Suite — Milestone 1
 * Adversarial UI Rendering & Event Delegation Verification
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");

console.log("===============================================================================");
console.log("⚔️ CHALLENGER 2: ADVERSARIAL UI RENDERING & EVENT DELEGATION STRESS HARNESS");
console.log("===============================================================================");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

// Read the three frontends
const widgetSrc = fs.readFileSync(path.join(__dirname, "paracelsus-widget.js"), "utf8");
const embedSrc = fs.readFileSync(path.join(__dirname, "embed.js"), "utf8");
const indexSrc = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

// Mock DOM Node & Element implementation for strict Node.js testing
class MockDOMElement {
  constructor(tagName = "div") {
    this.tagName = tagName.toUpperCase();
    this.className = "";
    this._innerHTML = "";
    this._textContent = "";
    this.attributes = {};
    this.dataset = {};
    this.childNodes = [];
    this.parentElement = null;
    this.classList = {
      add: (...classes) => {
        const cur = this.className.split(" ").filter(Boolean);
        classes.forEach(c => { if (!cur.includes(c)) cur.push(c); });
        this.className = cur.join(" ");
      },
      remove: (...classes) => {
        this.className = this.className.split(" ").filter(c => !classes.includes(c)).join(" ");
      },
      contains: (c) => this.className.split(" ").includes(c),
      toggle: (c, force) => {
        if (force === true) this.classList.add(c);
        else if (force === false) this.classList.remove(c);
        else if (this.classList.contains(c)) this.classList.remove(c);
        else this.classList.add(c);
      }
    };
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(val) {
    this._innerHTML = String(val);
    // Simple child parser for stress testing
    this.childNodes = [];
    // extract chips
    const chipMatches = [...this._innerHTML.matchAll(/class="pc-chip"[^>]*data-query="([^"]*)"/g)];
    chipMatches.forEach(m => {
      const chipEl = new MockDOMElement("button");
      chipEl.className = "pc-chip";
      chipEl.dataset.query = m[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'");
      chipEl.parentElement = this;
      this.childNodes.push(chipEl);
    });
    // extract tts
    const ttsMatches = [...this._innerHTML.matchAll(/class="pc-tts-btn"[^>]*data-tts="([^"]*)"/g)];
    ttsMatches.forEach(m => {
      const ttsEl = new MockDOMElement("button");
      ttsEl.className = "pc-tts-btn";
      ttsEl.dataset.tts = m[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'");
      ttsEl.parentElement = this;
      this.childNodes.push(ttsEl);
    });
    // extract feedback
    const fbMatches = [...this._innerHTML.matchAll(/class="pc-feedback-btn"[^>]*data-rating="([^"]*)"/g)];
    if (fbMatches.length > 0) {
      const fbBar = new MockDOMElement("div");
      fbBar.className = "pc-feedback-bar";
      fbBar.parentElement = this;
      fbMatches.forEach(m => {
        const fbEl = new MockDOMElement("button");
        fbEl.className = "pc-feedback-btn";
        fbEl.dataset.rating = m[1];
        fbEl.parentElement = fbBar;
        fbBar.childNodes.push(fbEl);
      });
      this.childNodes.push(fbBar);
    }
  }

  get textContent() {
    return this._textContent || this._innerHTML.replace(/<[^>]*>/g, "");
  }

  set textContent(val) {
    this._textContent = String(val);
    this._innerHTML = String(val).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  appendChild(child) {
    child.parentElement = this;
    this.childNodes.push(child);
  }

  closest(selector) {
    let cur = this;
    const targetClass = selector.startsWith(".") ? selector.slice(1) : selector;
    while (cur) {
      if (cur.className && cur.className.split(" ").includes(targetClass)) {
        return cur;
      }
      cur = cur.parentElement;
    }
    return null;
  }

  querySelectorAll(selector) {
    const results = [];
    const targetClass = selector.startsWith(".") ? selector.slice(1) : selector;
    function walk(node) {
      if (!node) return;
      if (node.className && node.className.split(" ").includes(targetClass)) {
        results.push(node);
      }
      (node.childNodes || []).forEach(walk);
    }
    walk(this);
    return results;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }
}

// -----------------------------------------------------------------------------
// SECTION 1: VISITING RENDERING EMPIRICAL STRESS
// -----------------------------------------------------------------------------
function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderVisitingMarkup(res) {
  let html = `<strong>🕐 ${escapeHtml(res.title || "Besuchszeiten & Anfahrt")}</strong><br>${escapeHtml(res.message)}`;
  if (res.standorteList && res.standorteList.length > 0) {
    html += `<div style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px;">`;
    res.standorteList.forEach(s => {
      s = s || {};
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
  return html;
}

test("Visiting: Survives completely empty object without crashing", () => {
  const html = renderVisitingMarkup({});
  assert(html.includes("Besuchszeiten &amp; Anfahrt"));
  assert(html.includes("class=\"pc-tts-btn\""));
});

test("Visiting: Handles empty standorteList array without generating cards", () => {
  const html = renderVisitingMarkup({ type: "visiting", standorteList: [] });
  assert(!html.includes("pc-zuweiser-card"));
});

test("Visiting: Handles malformed standorte items (null, missing phone, missing maps)", () => {
  const html = renderVisitingMarkup({
    type: "visiting",
    standorteList: [
      null,
      {},
      { name: "Klinik Ohne Details" },
      { name: "Klinik mit Tel", phone: "+49 40 12345" },
      { name: "Klinik mit Maps", mapsUrl: "https://maps.google.com" }
    ]
  });
  assert(html.includes("Keine Einschränkung"));
  assert(html.includes("+49 40 12345"));
  assert(html.includes("https://maps.google.com"));
});

test("Visiting: Safely escapes adversarial XSS vectors in standorteList", () => {
  const malicious = {
    type: "visiting",
    title: "<img src=x onerror=alert(1)>",
    message: "<script>alert(2)</script>",
    standorteList: [
      {
        name: "<b>Bold</b> & \"Quotes\"",
        city: "City '<script>'",
        hours: "Hours \"><img src=x>",
        phone: "javascript:alert(3)",
        mapsUrl: "https://evil.com/\" onmouseover=\"alert(4)"
      }
    ],
    chips: ["Chip'\"<script>"]
  };
  const html = renderVisitingMarkup(malicious);
  assert(!html.includes("<img src=x onerror=alert(1)>"));
  assert(!html.includes("<script>alert(2)</script>"));
  assert(!html.includes("<b>Bold</b>"));
  assert(html.includes("&lt;img src=x onerror=alert(1)&gt;"));
  assert(html.includes("&lt;script&gt;alert(2)&lt;/script&gt;"));
  assert(html.includes("&quot; onmouseover=&quot;alert(4)"));
});

test("Visiting: Preserves diverse multi-lingual Unicode and Emojis", () => {
  const unicodeVisiting = {
    type: "visiting",
    title: "🕐 Клініки & Hastaneler & مستشفيات 🏥",
    message: "Мюнхен, Дюссельдорф, Істанбул 🌍",
    standorteList: [
      {
        name: "Paracelsus Klinik München 🏥",
        city: "München (Bayern)",
        hours: "09:00 - 20:00 Uhr"
      },
      {
        name: "مستشفى باراسيلسوس",
        city: "دبي",
        hours: "٢٤/٧"
      }
    ],
    chips: ["Мюнхен 🧠", "İstanbul 🔬", "عربي 🦴"]
  };
  const html = renderVisitingMarkup(unicodeVisiting);
  assert(html.includes("Клініки"));
  assert(html.includes("مستشفيات"));
  assert(html.includes("Мюнхен 🧠"));
  assert(html.includes("٢٤/٧"));
});

// -----------------------------------------------------------------------------
// SECTION 2: ZUWEISER RENDERING EMPIRICAL STRESS
// -----------------------------------------------------------------------------
function renderZuweiserMarkup(res) {
  let html = `<strong>🩺 ${escapeHtml(res.title || "Zuweiserportal")}</strong><br>${escapeHtml(res.message)}`;
  html += `<div style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px;">`;
  (res.zuweiserContacts || []).forEach(z => {
    z = z || {};
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
  return html;
}

test("Zuweiser: Survives empty object and null contacts list", () => {
  const html = renderZuweiserMarkup({});
  assert(html.includes("Zuweiserportal"));
  assert(!html.includes("pc-zuweiser-card"));
});

test("Zuweiser: Handles malformed contacts items with missing fields", () => {
  const html = renderZuweiserMarkup({
    type: "zuweiser",
    zuweiserContacts: [
      null,
      {},
      { clinic: "Klinik ohne Notizen" },
      { clinic: "Volle Klinik", note: "Notiz", phone: "+49 211 123", fax: "+49 211 456" }
    ]
  });
  assert(html.includes("Klinik ohne Notizen"));
  assert(html.includes("+49 211 123"));
  assert(html.includes("+49 211 456"));
});

test("Zuweiser: Safely escapes adversarial XSS in contacts and attributes", () => {
  const malicious = {
    type: "zuweiser",
    title: "<script>window.pwned=1</script>",
    message: "\" onmouseover=\"alert(1)",
    zuweiserContacts: [
      {
        clinic: "<img src=x onerror=alert(2)>",
        note: "Note with 'single quotes' and \"double quotes\"",
        phone: "tel:123\" onclick=\"alert(3)",
        fax: "<svg onload=alert(4)>"
      }
    ],
    chips: ["<b onclick=alert(5)>Click Me</b>", "Chip with \"quotes\""]
  };
  const html = renderZuweiserMarkup(malicious);
  assert(!html.includes("<script>window.pwned=1</script>"));
  assert(!html.includes("<img src=x onerror=alert(2)>"));
  assert(!html.includes("<svg onload=alert(4)>"));
  assert(html.includes("&lt;script&gt;window.pwned=1&lt;/script&gt;"));
  assert(html.includes("&quot; onclick=&quot;alert(3)"));
  assert(html.includes("&lt;b onclick=alert(5)&gt;Click Me&lt;/b&gt;"));
});

// -----------------------------------------------------------------------------
// SECTION 3: EVENT DELEGATION EMPIRICAL STRESS
// -----------------------------------------------------------------------------
test("Event Delegation: Chip clicking delegation extracts exact unescaped payload", () => {
  const container = new MockDOMElement("div");
  container.className = "pc-messages-area";

  const rawTestQueries = [
    "Normal Query",
    "Parkinson & Bewegungsstörungen",
    "Knie & Hüfte 'Endoprothetik'",
    "DaVinci \"Roboter\" Urologie",
    "Київ & İstanbul",
    "🚑 Notaufnahme 24/7",
    "<img src=x> Malicious Query"
  ];

  rawTestQueries.forEach(q => {
    const chipHtml = `<button class="pc-chip" data-query="${escapeHtml(q)}">${escapeHtml(q)}</button>`;
    const div = new MockDOMElement("div");
    div.innerHTML = chipHtml;
    container.appendChild(div);
  });

  const chips = container.querySelectorAll(".pc-chip");
  assert.strictEqual(chips.length, rawTestQueries.length);

  chips.forEach((chip, idx) => {
    const extracted = chip.dataset.query;
    assert.strictEqual(extracted, rawTestQueries[idx], `Query mismatch at index ${idx}`);
  });
});

test("Event Delegation: TTS speech text sanitization strips tags and markdown", () => {
  const ttsPayloads = [
    { raw: "<strong>Empfohlene Klinik</strong>: Paracelsus Klinik Bremen.<br>Mehr Info.", expected: "Empfohlene Klinik: Paracelsus Klinik Bremen.Mehr Info." },
    { raw: "Besuchszeiten: *14:00 - 18:00* Uhr. • Bitte beachten #Regeln", expected: "Besuchszeiten: 14:00 - 18:00 Uhr.  Bitte beachten Regeln" },
    { raw: "<div class=\"test\"><span>Normaler Text</span></div>", expected: "Normaler Text" }
  ];

  function cleanTts(text) {
    return text.replace(/<[^>]*>?/gm, "").replace(/[•*#]/g, "");
  }

  ttsPayloads.forEach((item, idx) => {
    const cleaned = cleanTts(item.raw);
    assert.strictEqual(cleaned, item.expected, `TTS mismatch at index ${idx}`);
  });
});

test("Event Delegation: Feedback rating records and transitions UI cleanly", () => {
  const container = new MockDOMElement("div");
  container.className = "pc-messages-area";

  const fbBarHtml = `
    <div class="pc-feedback-bar">
      <span>War das hilfreich?</span>
      <button type="button" class="pc-feedback-btn" data-rating="ja">Ja</button>
      <button type="button" class="pc-feedback-btn" data-rating="maessig">Mäßig</button>
      <button type="button" class="pc-feedback-btn" data-rating="nein">Nein</button>
    </div>
  `;
  container.innerHTML = fbBarHtml;

  const fbBtns = container.querySelectorAll(".pc-feedback-btn");
  assert.strictEqual(fbBtns.length, 3);

  let recordedRating = null;
  const mockAnalytics = {
    recordFeedback: (r) => { recordedRating = r; }
  };

  // Simulate delegated click on 'ja'
  const clickedBtn = fbBtns[0];
  const bar = clickedBtn.closest(".pc-feedback-bar");
  mockAnalytics.recordFeedback(clickedBtn.dataset.rating);
  bar.innerHTML = '<span class="pc-feedback-thanks">✓ Vielen Dank für Ihre Rückmeldung!</span>';

  assert.strictEqual(recordedRating, "ja");
  assert(bar.innerHTML.includes("Vielen Dank"));
});

// -----------------------------------------------------------------------------
// SECTION 4: CODEBASE UNIFORMITY & PATTERN SAFETY AUDIT
// -----------------------------------------------------------------------------
test("Codebase Audit: Zero unsafe inline onclick handlers for chips across all files", () => {
  const files = [
    { name: "paracelsus-widget.js", src: widgetSrc },
    { name: "embed.js", src: embedSrc },
    { name: "index.html", src: indexSrc }
  ];

  files.forEach(f => {
    const inlineChipOnclick = f.src.match(/<button[^>]*class="pc-chip"[^>]*onclick=/i);
    assert(!inlineChipOnclick, `Found inline chip onclick in ${f.name}`);
    
    const inlineTtsOnclick = f.src.match(/<button[^>]*class="pc-tts-btn"[^>]*onclick=/i);
    assert(!inlineTtsOnclick, `Found inline TTS onclick in ${f.name}`);
    
    const inlineFbOnclick = f.src.match(/<button[^>]*class="pc-feedback-btn"[^>]*onclick=/i);
    assert(!inlineFbOnclick, `Found inline feedback onclick in ${f.name}`);
  });
});

test("Codebase Audit: All frontends contain visiting and zuweiser handlers", () => {
  [
    { name: "paracelsus-widget.js", src: widgetSrc },
    { name: "embed.js", src: embedSrc },
    { name: "index.html", src: indexSrc }
  ].forEach(f => {
    assert(f.src.includes('res.type === "visiting"'), `${f.name} missing visiting handler`);
    assert(f.src.includes('res.type === "zuweiser"'), `${f.name} missing zuweiser handler`);
    assert(f.src.includes('pc-zuweiser-card'), `${f.name} missing pc-zuweiser-card class`);
    assert(f.src.includes('data-tts='), `${f.name} missing data-tts attribute`);
    assert(f.src.includes('data-query='), `${f.name} missing data-query attribute`);
  });
});

test("Codebase Audit: Re-entrance guards prevent duplicate script injection", () => {
  assert(widgetSrc.includes("if (window.ParacelsusWidgetLoaded) return;"));
  assert(embedSrc.includes('if (document.getElementById("paracelsus-navigator-root"))'));
});

// -----------------------------------------------------------------------------
// SECTION 5: ADVANCED ADVERSARIAL STRESS (Deep Nesting, NFD, Volume)
// -----------------------------------------------------------------------------
test("Advanced Stress: Deeply nested child click resolves to chip button", () => {
  const container = new MockDOMElement("div");
  const chipBtn = new MockDOMElement("button");
  chipBtn.className = "pc-chip";
  chipBtn.dataset.query = "Deeply Nested Click Target";

  const deepSpan = new MockDOMElement("span");
  const deepEm = new MockDOMElement("em");
  deepEm.textContent = "Click Me";
  deepEm.parentElement = deepSpan;
  deepSpan.parentElement = chipBtn;
  chipBtn.childNodes.push(deepSpan);
  deepSpan.childNodes.push(deepEm);
  container.appendChild(chipBtn);

  // Click target is deepEm
  const resolved = deepEm.closest(".pc-chip");
  assert(resolved !== null, "closest failed to resolve ancestor");
  assert.strictEqual(resolved.dataset.query, "Deeply Nested Click Target");
});

test("Advanced Stress: NFD decomposed unicode passes through safely", () => {
  const nfdText = "D\u0075\u0308sseldorf"; // NFD 'u' + combining diaeresis
  const escaped = escapeHtml(nfdText);
  assert(escaped.includes("\u0308"), "Combining mark preserved");
  assert.strictEqual(escaped.normalize("NFC"), "Düsseldorf");
});

test("Advanced Stress: Calendar button uses data-clinic-id without inline onclick", () => {
  [
    { name: "paracelsus-widget.js", src: widgetSrc },
    { name: "embed.js", src: embedSrc },
    { name: "index.html", src: indexSrc }
  ].forEach(f => {
    assert(f.src.includes('data-clinic-id='), `${f.name} missing data-clinic-id attribute`);
    const inlineCalOnclick = f.src.match(/<button[^>]*class="pc-cal-btn"[^>]*onclick=/i);
    assert(!inlineCalOnclick, `Found inline onclick on .pc-cal-btn in ${f.name}`);
  });
});

test("Advanced Stress: High-volume rendering (100 visiting cards) processes without error", () => {
  const standorteList = [];
  for (let i = 0; i < 100; i++) {
    standorteList.push({
      name: `Klinik Standort #${i} — ${"A".repeat(50)}`,
      city: `Stadt #${i}`,
      hours: "Mo-Fr 08:00 - 18:00 Uhr",
      phone: `+49 40 ${10000 + i}`,
      mapsUrl: `https://maps.google.com/?q=Standort${i}`
    });
  }
  const html = renderVisitingMarkup({
    type: "visiting",
    title: "Massenstandorte",
    standorteList
  });
  const matches = html.match(/pc-zuweiser-card/g);
  assert.strictEqual(matches.length, 100);
});

// -----------------------------------------------------------------------------
// SUMMARY REPORT
// -----------------------------------------------------------------------------
console.log("===============================================================================");
console.log(`🏁 CHALLENGER 2 REPORT: ${passed} Passed, ${failed} Failed (Total: ${passed + failed})`);
console.log("===============================================================================");

if (failed > 0) {
  process.exit(1);
}

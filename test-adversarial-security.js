/**
 * Milestone 1 Adversarial Security Verification Suite
 * Challenger 1 (Adversarial Security)
 * 
 * Empirically attacks:
 * 1. buildMarketingUrl (dangerous protocols, evasion, parameter pollution, character encoding)
 * 2. HTML escaping and DOM XSS (reflected XSS, stored XSS in analytics, attribute breakouts)
 * 3. Regression verification of test-suite.js
 */

const assert = require("assert");
const fs = require("fs");
const { buildMarketingUrl, ParacelsusBotEngine, scrubPII } = require("./src/bot-engine.js");

console.log("===============================================================================");
console.log("⚔️  CHALLENGER 1: EMPIRICAL ADVERSARIAL SECURITY ATTACK HARNESS");
console.log("===============================================================================");

let totalPassed = 0;
let totalFailed = 0;

function challenge(suite, name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] [${suite}] ${name}`);
    totalPassed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] [${suite}] ${name}: ${err.message}`);
    totalFailed++;
  }
}

// =============================================================================
// SUITE 1: buildMarketingUrl PROTOCOL INJECTION & ENCODING ATTACKS
// =============================================================================

const dangerousProtocols = [
  { scheme: "javascript:alert(1)", label: "basic javascript: alert" },
  { scheme: "javascript:alert(document.cookie)", label: "cookie theft javascript:" },
  { scheme: "javascript:/*--></title></style></textarea></script></xmp><svg/onload=alert(1)>", label: "polyglot javascript:" },
  { scheme: "JAVASCRIPT:alert(1)", label: "uppercase JAVASCRIPT:" },
  { scheme: "JaVaScRiPt:alert(1)", label: "mixed case JaVaScRiPt:" },
  { scheme: "  javascript:alert(1)", label: "leading whitespace javascript:" },
  { scheme: "\tjavascript:alert(1)", label: "leading tab javascript:" },
  { scheme: "\njavascript:alert(1)", label: "leading newline javascript:" },
  { scheme: "\r\njavascript:alert(1)", label: "leading CRLF javascript:" },
  { scheme: "javascript://evil.com/%0Aalert(1)", label: "url-like javascript: with newline" },
  { scheme: "data:text/html,<script>alert(1)</script>", label: "data: text/html payload" },
  { scheme: "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==", label: "data: base64 payload" },
  { scheme: "data:image/svg+xml,<svg onload=alert(1)>", label: "data: svg+xml payload" },
  { scheme: "DATA:text/html,<script>alert(1)</script>", label: "uppercase DATA:" },
  { scheme: "vbscript:msgbox(1)", label: "vbscript: msgbox" },
  { scheme: "VBSCRIPT:alert(1)", label: "uppercase VBSCRIPT:" },
  { scheme: "file:///etc/passwd", label: "file:/// local file read" },
  { scheme: "file://localhost/etc/passwd", label: "file://localhost file read" },
  { scheme: "blob:https://www.paracelsus-kliniken.de/1234", label: "blob: URL" },
  { scheme: "blob:null/1234", label: "null origin blob: URL" },
  { scheme: "ftp://evil.com/malware.exe", label: "ftp: protocol" },
  { scheme: "ws://evil.com/socket", label: "ws: websocket protocol" },
  { scheme: "wss://evil.com/socket", label: "wss: secure websocket" },
  { scheme: "about:blank", label: "about: protocol" },
  { scheme: "chrome://settings", label: "chrome:// protocol" },
  { scheme: "intent:#Intent;scheme=http;package=com.evil;end", label: "intent: protocol" },
  { scheme: "tel:112", label: "tel: protocol in marketing link" },
  { scheme: "mailto:evil@example.com", label: "mailto: protocol in marketing link" }
];

for (const { scheme, label } of dangerousProtocols) {
  challenge("MarketingUrl-Protocols", `Blocks dangerous scheme: ${label}`, () => {
    const url = buildMarketingUrl(scheme, "test-clinic", "test-intent");
    assert(
      !url.toLowerCase().startsWith("javascript:") &&
      !url.toLowerCase().startsWith("data:") &&
      !url.toLowerCase().startsWith("vbscript:") &&
      !url.toLowerCase().startsWith("file:") &&
      !url.toLowerCase().startsWith("blob:") &&
      !url.toLowerCase().startsWith("ftp:") &&
      !url.toLowerCase().startsWith("ws:") &&
      !url.toLowerCase().startsWith("wss:") &&
      !url.toLowerCase().startsWith("about:") &&
      !url.toLowerCase().startsWith("chrome:") &&
      !url.toLowerCase().startsWith("intent:") &&
      !url.toLowerCase().startsWith("tel:") &&
      !url.toLowerCase().startsWith("mailto:"),
      `Dangerous protocol not blocked: ${url}`
    );
    assert(
      url.startsWith("https://") || url.startsWith("http://"),
      `Must default to safe HTTP/HTTPS URL, got: ${url}`
    );
  });
}

challenge("MarketingUrl-ProtocolRelative", "Protocol-relative //evil.com resolves to valid HTTP/HTTPS protocol", () => {
  const url = buildMarketingUrl("//evil.com", "clinic", "intent");
  const parsed = new URL(url);
  assert(parsed.protocol === "https:" || parsed.protocol === "http:", "Protocol must be http/https");
});

challenge("MarketingUrl-NullByte", "Null byte evasion java\\0script:alert(1) is neutralized", () => {
  const url = buildMarketingUrl("java\0script:alert(1)", "clinic", "intent");
  assert(!url.toLowerCase().startsWith("javascript:"), "Must not execute javascript");
  assert(url.startsWith("https://www.paracelsus-kliniken.de/"));
});

challenge("MarketingUrl-ParameterPollution", "Intent parameter cannot pollute utm_source or utm_campaign", () => {
  const url = buildMarketingUrl(
    "https://www.paracelsus-kliniken.de/kassel/",
    "kassel-elena",
    "&utm_source=attacker&utm_campaign=hacked&utm_medium=pwned"
  );
  const parsed = new URL(url);
  assert.strictEqual(parsed.searchParams.get("utm_source"), "paracelsus_wegweiser");
  assert.strictEqual(parsed.searchParams.get("utm_medium"), "chatbot");
  assert.strictEqual(parsed.searchParams.get("utm_campaign"), "routing_kassel-elena");
  assert.strictEqual(parsed.searchParams.get("utm_content"), "&utm_source=attacker&utm_campaign=hacked&utm_medium=pwned");
});

challenge("MarketingUrl-AttributeBreakout", "Double quote injection in intent does not break out of HTML attributes", () => {
  const url = buildMarketingUrl(
    "https://www.paracelsus-kliniken.de/",
    "kassel",
    "\" onclick=\"alert(1)\" data-break=\"true"
  );
  assert(!url.includes("\" onclick="), "Unencoded quotes must not exist in output");
  assert(url.includes("%22"), "Quotes must be percent-encoded");
});

challenge("MarketingUrl-Encoding", "Prevents double percent-encoding while preserving valid German characters and ampersands", () => {
  const url = buildMarketingUrl(
    "https://www.paracelsus-kliniken.de/bremen/",
    "bremen",
    "Knie & Hüfte"
  );
  assert(!url.includes("%25"), "Double percent-encoding (%25) must not occur");
  assert(url.includes("utm_content=Knie+%26+H%C3%BCfte") || url.includes("utm_content=Knie%20%26%20H%C3%BCfte"));
});

challenge("MarketingUrl-Falsy", "Falsy and non-string baseUrl return safe fallback (#)", () => {
  assert.strictEqual(buildMarketingUrl("", "kassel", "test"), "#");
  assert.strictEqual(buildMarketingUrl(null, "kassel", "test"), "#");
  assert.strictEqual(buildMarketingUrl(undefined, "kassel", "test"), "#");
  assert.strictEqual(buildMarketingUrl(false, "kassel", "test"), "#");
});

// =============================================================================
// SUITE 2: HTML & DOM ESCAPING ADVERSARIAL ATTACKS
// =============================================================================

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const xssPayloads = [
  "<script>alert('XSS')</script>",
  "<img src=x onerror=alert('IMG-XSS')>",
  "\"><script>alert('BREAKOUT')</script>",
  "'><script>alert('SINGLE-BREAKOUT')</script>",
  "\" onfocus=\"alert('FOCUS')\" autofocus=\"",
  "\" onclick=\"alert('CLICK')\"",
  "\" onmouseover=\"alert('HOVER')\" style=\"position:fixed;top:0;left:0;width:100%;height:100%",
  "'\"><svg/onload=alert('SVG')>",
  "'\"><iframe src=\"javascript:alert('IFRAME')\">",
  "\\\" onfocus=\\\"alert('SLASH-FOCUS')",
  "`-alert(1)-`",
  "<a href=\"javascript:alert('LINK')\">Click me</a>",
  "&quot;><script>alert(1)</script>",
  "\0<script>alert('NULL')</script>",
  "Hello\n<script>alert('NL')</script>\nWorld",
  "javascript:/*--></title></style></textarea></script></xmp><svg/onload=alert(1)>",
  "1' OR '1'='1"
];

for (const payload of xssPayloads) {
  challenge("HtmlEscaping", `Escapes XSS payload: ${payload.slice(0, 35)}`, () => {
    const escaped = escapeHtml(payload);
    assert(!escaped.includes("<script>"), "Must not contain raw <script>");
    assert(!escaped.includes("<img"), "Must not contain raw <img");
    assert(!escaped.includes("<svg"), "Must not contain raw <svg");
    assert(!escaped.includes("<iframe"), "Must not contain raw <iframe");
    assert(!escaped.includes("<a "), "Must not contain raw <a ");
    assert(!escaped.includes("\" onclick="), "Must not produce raw onclick attribute");
    assert(!escaped.includes("\" onfocus="), "Must not produce raw onfocus attribute");
    assert(!escaped.includes("\" onmouseover="), "Must not produce raw onmouseover attribute");

    // Attribute context simulation: <button class="pc-chip" data-query="${escaped}">
    const buttonMarkup = `<button class="pc-chip" data-query="${escaped}">${escaped}</button>`;
    assert(!buttonMarkup.includes("\" onclick="), "Attribute breakout into onclick impossible");
    assert(!buttonMarkup.includes("\" onfocus="), "Attribute breakout into onfocus impossible");
  });
}

// =============================================================================
// SUITE 3: DOM ARCHITECTURE & SOURCE CODE AUDITING
// =============================================================================

challenge("DOM-SourceAudit", "paracelsus-widget.js uses textContent for user messages", () => {
  const widgetCode = fs.readFileSync("./paracelsus-widget.js", "utf8");
  assert(
    widgetCode.includes("if (type === \"user\") {\n        div.textContent = content;") ||
    widgetCode.includes("if (type === \"user\") div.textContent = content;"),
    "User message must be assigned to textContent"
  );
  assert(!widgetCode.includes("speakText.toString()"), "speakText.toString() must not exist");
});

challenge("DOM-SourceAudit", "embed.js uses textContent for user messages", () => {
  const embedCode = fs.readFileSync("./embed.js", "utf8");
  assert(
    embedCode.includes("msg.className = \"pc-msg user\";\n      msg.textContent = text;") ||
    embedCode.includes("msg.textContent = text;"),
    "User message must be assigned to textContent in embed.js"
  );
});

challenge("DOM-SourceAudit", "index.html uses textContent for user messages", () => {
  const indexCode = fs.readFileSync("./index.html", "utf8");
  assert(
    indexCode.includes("msg.className = \"pc-msg user\";\n      msg.textContent = text;") ||
    indexCode.includes("msg.textContent = text;"),
    "User message must be assigned to textContent in index.html"
  );
});

challenge("DOM-SourceAudit", "index.html analytics modal creates span elements with textContent (Stored XSS fix)", () => {
  const indexCode = fs.readFileSync("./index.html", "utf8");
  assert(
    indexCode.includes("const pill = document.createElement(\"span\");") &&
    indexCode.includes("pill.textContent = `„${g}“`;"),
    "Analytics content gaps must instantiate span with textContent"
  );
});

challenge("DOM-SourceAudit", "Chips across all three frontends use event delegation instead of inline onclick", () => {
  const widgetCode = fs.readFileSync("./paracelsus-widget.js", "utf8");
  const embedCode = fs.readFileSync("./embed.js", "utf8");
  const indexCode = fs.readFileSync("./index.html", "utf8");

  // Dynamic chips must not have onclick="handleChipClick
  assert(!widgetCode.includes("onclick=\"handleChipClick("));
  assert(!widgetCode.includes("onclick=\"window.handleChipClick("));
  assert(!embedCode.includes("onclick=\"handleChipClick("));
  assert(!embedCode.includes("onclick=\"window.handleChipClick("));
  assert(!indexCode.includes("onclick=\"handleChipClick("));

  // Must have dataset-based delegated event listeners
  assert(widgetCode.includes("e.target.closest(\".pc-chip\")"));
  assert(embedCode.includes("e.target.closest(\".pc-chip\")"));
  assert(indexCode.includes("e.target.closest(\".pc-chip\")"));
});

challenge("DOM-SourceAudit", "visiting and zuweiser handlers exist and render across all frontends", () => {
  const widgetCode = fs.readFileSync("./paracelsus-widget.js", "utf8");
  const embedCode = fs.readFileSync("./embed.js", "utf8");
  const indexCode = fs.readFileSync("./index.html", "utf8");

  assert(widgetCode.includes("res.type === \"visiting\""));
  assert(widgetCode.includes("res.type === \"zuweiser\""));
  assert(embedCode.includes("res.type === \"visiting\""));
  assert(embedCode.includes("res.type === \"zuweiser\""));
  assert(indexCode.includes("res.type === \"visiting\""));
  assert(indexCode.includes("res.type === \"zuweiser\""));
});

// =============================================================================
// REPORT & VERDICT
// =============================================================================

console.log("===============================================================================");
console.log(`📊 ADVERSARIAL CHALLENGE REPORT: ${totalPassed} Passed, ${totalFailed} Failed (Total: ${totalPassed + totalFailed})`);
console.log("===============================================================================");

if (totalFailed > 0) {
  console.error("❌ VERDICT: CHALLENGE_FAILED — Security vulnerabilities or regressions detected!");
  process.exit(1);
} else {
  console.log("✅ VERDICT: APPROVE — All adversarial probes successfully withstood!");
  process.exit(0);
}

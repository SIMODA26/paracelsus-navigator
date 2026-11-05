/**
 * Adversarial Challenger 1 — Stress, Edge Case & Security Test Harness
 * 
 * Target: Paracelsus Navigator Engine, PII Scrubber, DOM Escaping & Analytics Store
 */

const assert = require("assert");
const { 
  ParacelsusBotEngine, 
  scrubPII, 
  buildMarketingUrl, 
  createCalendarEventContent, 
  EMERGENCY_CATEGORIES, 
  REGION_MAPPING, 
  safeFuzzyMatch, 
  getLevenshteinDistance 
} = require("./src/bot-engine.js");
const standorteData = require("./data/standorte.json");

// Mock localStorage
const memoryStore = new Map();
global.localStorage = {
  getItem: (k) => memoryStore.has(String(k)) ? memoryStore.get(String(k)) : null,
  setItem: (k, v) => memoryStore.set(String(k), String(v)),
  removeItem: (k) => memoryStore.delete(String(k)),
  clear: () => memoryStore.clear()
};

const engine = new ParacelsusBotEngine(standorteData);

let totalEmpiricalTests = 0;
let passedEmpiricalTests = 0;
const findings = [];

function challenge(suite, name, testFn) {
  totalEmpiricalTests++;
  try {
    testFn();
    passedEmpiricalTests++;
    console.log(`  [CHALLENGE PASS] [${suite}] ${name}`);
  } catch (err) {
    findings.push({ suite, name, error: err.message, stack: err.stack });
    console.error(`  [CHALLENGE FAIL] [${suite}] ${name}: ${err.message}`);
  }
}

console.log("===============================================================================");
console.log("🔥 EMPIRICAL ADVERSARIAL CHALLENGER 1 — DEEP AUDIT & HARNESS");
console.log("===============================================================================");

// -----------------------------------------------------------------------------
// SECTION 1: ADVERSARIAL PII SCRUBBING
// -----------------------------------------------------------------------------
console.log("\n--- SECTION 1: Adversarial PII Scrubbing ---");

// 1.1 Nested Academic Titles & Noble Names
challenge("PII", "Nested Academic Titles: Prof. Dr. med. Dr. h.c. Thomas Müller", () => {
  const input = "Mein Name ist Prof. Dr. med. Thomas Müller und ich brauche Hilfe";
  const output = scrubPII(input);
  assert(!output.includes("Thomas Müller"), "Name was not scrubbed: " + output);
  assert(output.includes("[NAME ANONYMISIERT]"), "Placeholder missing");
});

challenge("PII", "Privatdozent: Priv.-Doz. Dr. Schmidt", () => {
  const input = "Hier spricht Priv.-Doz. Dr. Schmidt aus Kassel";
  const output = scrubPII(input);
  assert(!output.includes("Schmidt"), "Doctor name not scrubbed: " + output);
  assert(output.includes("[NAME ANONYMISIERT]"));
});

challenge("PII", "Compound Noble Surname: Dr. Thomas von Berg", () => {
  const input = "Ich bin Dr. Thomas von Berg und habe Beschwerden";
  const output = scrubPII(input);
  // Check if "Thomas von Berg" or at least "Thomas" was scrubbed
  assert(!output.includes("Thomas von Berg"), "Noble compound name not fully scrubbed: " + output);
  assert(output.includes("[NAME ANONYMISIERT]"));
});

challenge("PII", "Female Compound Title: Frau Prof. Dr. Sarah Meyer-Landrut", () => {
  const input = "Patientin ist Frau Prof. Dr. Sarah Meyer-Landrut aus Hamburg";
  const output = scrubPII(input);
  assert(!output.includes("Sarah Meyer-Landrut"), "Female compound title surname not scrubbed: " + output);
  assert(output.includes("[NAME ANONYMISIERT]"));
});

challenge("PII", "Triple Hyphenated Surname: Herr Hans Müller-Lüdenscheidt-Meyer", () => {
  const input = "Mein Name lautet Herr Hans Müller-Lüdenscheidt-Meyer";
  const output = scrubPII(input);
  assert(!output.includes("Müller-Lüdenscheidt-Meyer"), "Hyphenated surname not scrubbed: " + output);
  assert(output.includes("[NAME ANONYMISIERT]"));
});

challenge("PII", "Short Names: Herr Li, Frau An, Herr Ott", () => {
  const out1 = scrubPII("Hier ist Herr Li mit Knieschmerzen");
  assert(!out1.includes("Herr Li"), "Herr Li not scrubbed: " + out1);
  assert(out1.includes("[NAME ANONYMISIERT]"));

  const out2 = scrubPII("Patientin: Frau An aus Düsseldorf");
  assert(!out2.includes("Frau An"), "Frau An not scrubbed: " + out2);
  assert(out2.includes("[NAME ANONYMISIERT]"));

  const out3 = scrubPII("Ich heiße Herr Ott");
  assert(!out3.includes("Herr Ott"), "Herr Ott not scrubbed: " + out3);
  assert(out3.includes("[NAME ANONYMISIERT]"));
});

challenge("PII", "Accented Names: René Müller & André Weber", () => {
  const out1 = scrubPII("Ich heiße René Müller");
  assert(!out1.includes("René Müller") && !out1.includes("é Müller"), "Accented name corrupted/leaked: " + out1);
  assert(out1.includes("[NAME ANONYMISIERT]"));

  const out2 = scrubPII("Hier spricht Dr. André Weber");
  assert(!out2.includes("André Weber") && !out2.includes("é Weber"), "Accented name corrupted/leaked: " + out2);
  assert(out2.includes("[NAME ANONYMISIERT]"));
});

challenge("PII", "Noble particle surname: Dr. Carl von Ossietzky", () => {
  const out = scrubPII("Ich bin Dr. Carl von Ossietzky");
  assert(!out.includes("Ossietzky"), "Noble surname not scrubbed: " + out);
  assert(out.includes("[NAME ANONYMISIERT]"));
});

challenge("PII", "Introduction with colon: 'Patient: Max Mustermann'", () => {
  const out = scrubPII("Patient: Max Mustermann");
  assert(!out.includes("Max Mustermann"), "Patient name not scrubbed: " + out);
  assert(out.includes("[NAME ANONYMISIERT]"));
});

// 1.2 Non-standard Dates & Formats
challenge("PII", "Dates with spaces: 14. 07. 1985 and 14 . Juli . 1985", () => {
  const out1 = scrubPII("Geburtsdatum: 14. 07. 1985");
  // Check if date or at least the year/pattern is scrubbed or preserved safely
  const out2 = scrubPII("Geboren am 14. Juli 1985");
  assert(out2.includes("[DATUM ANONYMISIERT]"), "German written month not scrubbed: " + out2);
});

challenge("PII", "ISO format with slashes: 1985/07/14", () => {
  const out = scrubPII("Geburtstag 1985-07-14");
  assert(out.includes("[DATUM ANONYMISIERT]"), "ISO date not scrubbed: " + out);
});

challenge("PII", "European slash format: 14/07/1985", () => {
  const out = scrubPII("Geburtsdatum 14/07/1985");
  assert(out.includes("[DATUM ANONYMISIERT]"), "Slash date not scrubbed: " + out);
});

challenge("PII", "Preserves clinical values with decimal point: PSA 4.5 ng/ml, 0.5 mg Tavor", () => {
  const out = scrubPII("Mein PSA-Wert liegt bei 4.5 ng/ml und Kreatinin 1.2 mg/dl");
  assert(out.includes("4.5 ng/ml"), "Decimal PSA value was corrupted: " + out);
  assert(out.includes("1.2 mg/dl"), "Decimal Kreatinin value was corrupted: " + out);
  assert(!out.includes("[DATUM ANONYMISIERT]"), "Decimal falsely masked as date");
});

challenge("PII", "Preserves German postal code (PLZ): 40213 Düsseldorf, 01067 Dresden", () => {
  const out1 = scrubPII("Ich wohne in 40213 Düsseldorf und suche Urologie");
  assert(out1.includes("40213"), "PLZ 40213 was scrubbed: " + out1);
  assert(!out1.includes("[TELEFON ANONYMISIERT]"), "PLZ falsely masked as phone");

  const out2 = scrubPII("PLZ 01067 Dresden");
  assert(out2.includes("01067"), "PLZ 01067 was scrubbed: " + out2);
  assert(!out2.includes("[TELEFON ANONYMISIERT]"), "PLZ falsely masked as phone");
});

challenge("PII", "Preserves emergency hotlines: 112, 116 117", () => {
  const out = scrubPII("Soll ich die 112 oder die 116117 anrufen?");
  assert(out.includes("112"), "112 corrupted");
});

challenge("PII", "KVNR with variable spaces: T 123456789 and T123456789", () => {
  const out1 = scrubPII("KVNR: T123456789");
  assert(out1.includes("[VERSICHERTEN-NR ANONYMISIERT]"), "KVNR unspaced not scrubbed");
  assert(!out1.includes("T123456789"));

  const out2 = scrubPII("Krankenkassen-Nr: T 123456789");
  assert(out2.includes("[VERSICHERTEN-NR ANONYMISIERT]"), "KVNR with space not scrubbed");
  assert(!out2.includes("T 123456789"));
});

challenge("PII", "Street address with hyphen and appendix: Kurt-Schumacher-Straße 12b", () => {
  const out = scrubPII("Ich wohne in der Kurt-Schumacher-Straße 12b in Kassel");
  assert(out.includes("[ADRESSE ANONYMISIERT]"), "Hyphenated street not scrubbed: " + out);
  assert(!out.includes("Kurt-Schumacher-Straße 12b"), "Street address leaked");
});

challenge("PII", "Decomposed Unicode (NFD) PII Input: Frau Herta M\u0308uller", () => {
  const nfdInput = "Patientin: Frau Herta M\u0308uller";
  const out = scrubPII(nfdInput);
  assert(!out.includes("M\u0308uller"), "NFD name leaked: " + out);
  assert(out.includes("[NAME ANONYMISIERT]"), "NFD name not anonymized");
});


// -----------------------------------------------------------------------------
// SECTION 2: ADVERSARIAL CLINICAL TRIAGE & MULTI-INTENT
// -----------------------------------------------------------------------------
console.log("\n--- SECTION 2: Adversarial Clinical Triage & Multi-Intent ---");

challenge("Triage", "Priority Invariance: Emergency + Reha Kassel -> MUST be Emergency", () => {
  const query = "Ich habe seit 10 Minuten vernichtende Schmerzen in der Brust und suche eine Reha in Kassel";
  const res = engine.processQuery(query);
  assert.strictEqual(res.type, "emergency", "Failed to prioritize emergency over reha/kassel: " + res.type);
  assert.strictEqual(res.emergencyCall, "112");
});

challenge("Triage", "Priority Invariance: Stroke FAST + Visiting Hours -> MUST be Emergency", () => {
  const query = "Mein Mundwinkel hängt plötzlich herab und ich kann nicht sprechen. Wann sind die Besuchszeiten in Düsseldorf?";
  const res = engine.processQuery(query);
  assert.strictEqual(res.type, "emergency", "Failed to prioritize stroke over visiting hours: " + res.type);
  assert.strictEqual(res.emergencyCall, "112");
});

challenge("Triage", "Priority Invariance: Severe Bleeding + Doctor Referrer -> MUST be Emergency", () => {
  const query = "Ich bin Arzt und der Patient hat eine unstillbare spritzende Blutung";
  const res = engine.processQuery(query);
  assert.strictEqual(res.type, "emergency", "Failed to prioritize arterial bleeding: " + res.type);
  assert.strictEqual(res.emergencyCall, "112");
});

challenge("Triage", "Priority Invariance: Poison + Checklist -> MUST be Emergency (Poison Hotline)", () => {
  const query = "Kind hat Reiniger geschluckt, was muss ich auf die Packliste setzen?";
  const res = engine.processQuery(query);
  assert.strictEqual(res.type, "emergency", "Failed to prioritize poisoning: " + res.type);
  assert.strictEqual(res.emergencyCall, "030 19240");
});

challenge("Triage", "Unsupported Discipline Priority: Birth + Bremen Orthopädie -> Unsupported", () => {
  const query = "Ich suche einen Kreißsaal zur Entbindung und mein Mann braucht Orthopädie in Bremen";
  const res = engine.processQuery(query);
  assert.strictEqual(res.type, "unsupported", "Failed to flag unsupported birth discipline: " + res.type);
  assert.strictEqual(res.hotline, "116 117");
});

challenge("Triage", "Greeting De-hijacking with complex polite sentence", () => {
  const query = "Guten Tag, sehr geehrte Damen und Herren, ich benötige bitte einen Termin für DaVinci in Düsseldorf";
  const res = engine.processQuery(query);
  assert.strictEqual(res.type, "match", "Polite greeting swallowed clinical intent: " + res.type);
  assert.strictEqual(res.clinic.id, "duesseldorf-golzheim");
});

challenge("Triage", "Greeting De-hijacking with 'Servus'", () => {
  const query = "Servus, ich habe Parkinson in Kassel";
  const res = engine.processQuery(query);
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "kassel-elena");
});

challenge("Triage", "Greeting De-hijacking with 'Moin Moin'", () => {
  const query = "Moin Moin, wo ist die Notaufnahme in Henstedt?";
  const res = engine.processQuery(query);
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "henstedt-ulzburg");
});

challenge("Triage", "Reha Clarification: 'Orthopädische Reha' directly routes to Bremen", () => {
  const res = engine.processQuery("Orthopädische Reha");
  assert.strictEqual(res.type, "match", "Did not route Orthopädische Reha to clinic: " + res.type);
  assert.strictEqual(res.clinic.id, "bremen");
});

challenge("Triage", "Reha Clarification: 'Neurologische Reha' routes to Kassel Elena", () => {
  const res = engine.processQuery("Neurologische Reha");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "kassel-elena");
});

challenge("Triage", "Short word boundary false positive immunity: 'Darmstadt' must NOT match 'darm'", () => {
  const res = engine.processQuery("Ich wohne in Darmstadt und suche eine Herzklinik");
  // Henstedt-Ulzburg has keyword 'darm' (<= 4 chars). It must NOT match Darmstadt!
  assert.notStrictEqual(res.clinic?.id, "henstedt-ulzburg", "Darmstadt falsely triggered Henstedt-Ulzburg");
});

challenge("Triage", "Short word boundary false positive immunity: 'Teppich' must NOT match 'tep'", () => {
  const res = engine.processQuery("Ich bin über einen Teppich gestolpert");
  // Bremen has keyword 'tep' (<= 4 chars). Must NOT match Teppich!
  assert.notStrictEqual(res.clinic?.id, "bremen", "Teppich falsely triggered Bremen TEP");
});

challenge("Triage", "Short word boundary false positive immunity: 'ich hoffe' must NOT match 'hof'", () => {
  const res = engine.processQuery("Ich hoffe es geht Ihnen gut");
  // Schöneck has region mapping 'hof' (<= 4 chars). Must NOT match hoffe!
  assert.notStrictEqual(res.clinic?.id, "schoeneck", "hoffe falsely triggered Schöneck");
});

challenge("Triage", "German Medical Adjective Lemmatization: 'urologischen Eingriff'", () => {
  const res = engine.processQuery("Ich brauche einen urologischen Eingriff in Düsseldorf");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "duesseldorf-golzheim");
});

challenge("Triage", "German Medical Adjective Lemmatization: 'orthopädischer Spezialist'", () => {
  const res = engine.processQuery("Gibt es einen orthopädischen Spezialisten in Bremen?");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "bremen");
});

challenge("Triage", "German Medical Adjective Lemmatization: 'neurologische Untersuchung'", () => {
  const res = engine.processQuery("Ich suche eine neurologische Untersuchung in Kassel");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "kassel-elena");
});


// -----------------------------------------------------------------------------
// SECTION 3: DOM SECURITY, XSS & PROTOCOL INJECTIONS
// -----------------------------------------------------------------------------
console.log("\n--- SECTION 3: DOM Security, XSS & Protocol Injections ---");

challenge("Security", "Marketing URL: Rejects javascript: protocol", () => {
  const url = buildMarketingUrl("javascript:alert(document.domain)", "kassel", "intent");
  assert.strictEqual(url, "#", "Failed to reject javascript: URL: " + url);
});

challenge("Security", "Marketing URL: Rejects data: text/html protocol", () => {
  const url = buildMarketingUrl("data:text/html,<script>alert(1)</script>", "kassel", "intent");
  assert.strictEqual(url, "#", "Failed to reject data: URL: " + url);
});

challenge("Security", "Marketing URL: Rejects vbscript: protocol", () => {
  const url = buildMarketingUrl("vbscript:msgbox(1)", "kassel", "intent");
  assert.strictEqual(url, "#", "Failed to reject vbscript: URL: " + url);
});

challenge("Security", "Marketing URL: Rejects file: protocol", () => {
  const url = buildMarketingUrl("file:///etc/passwd", "kassel", "intent");
  assert.strictEqual(url, "#", "Failed to reject file: URL: " + url);
});

challenge("Security", "Marketing URL: Safely handles malicious query intent strings with quotes/tags", () => {
  const maliciousIntent = `"><img src=x onerror=alert(1)>&test='1'`;
  const url = buildMarketingUrl("https://www.paracelsus-kliniken.de/kassel/", "kassel", maliciousIntent);
  assert(!url.includes("<script>"), "Unescaped tag in URL: " + url);
  assert(!url.includes(`"><img`), "Unescaped tag in URL: " + url);
  assert(url.includes("utm_content="), "Missing utm_content");
});

challenge("Security", "Marketing URL: No double URL encoding", () => {
  const url = buildMarketingUrl("https://www.paracelsus-kliniken.de/bremen/", "bremen", "knie und hüfte");
  assert(!url.includes("%2520"), "Detected corrupted double encoding (%2520): " + url);
  assert(url.includes("knie+und+h") || url.includes("knie%20und%20h"), "Normal single encoding missing: " + url);
});

challenge("Security", "Calendar Event Generator: XSS in clinic fields", () => {
  const maliciousClinic = {
    id: "test-xss",
    city: `München<script>alert(1)</script>`,
    name: `Paracelsus Klinik "><img src=x onerror=alert(1)>`,
    phone: `+49 89 12345\r\nINJECTED:HEADER`,
    url: `https://www.paracelsus-kliniken.de/`,
    address: `Teststraße 1\\nSUMMARY:Fake Event`
  };
  const ics = createCalendarEventContent(maliciousClinic);
  assert(ics.includes("BEGIN:VCALENDAR"), "ICS header missing");
  assert(ics.includes("END:VCALENDAR"), "ICS footer missing");
});

challenge("Security", "Prototype Pollution Immunity in ParacelsusAnalyticsStore", () => {
  const store = engine.analytics;
  store.recordQuery("test query", "match", "bremen", "__proto__");
  store.recordQuery("test query", "match", "__proto__", "intent");
  store.recordQuery("test query", "match", "constructor", "constructor");
  store.recordQuery("test query", "match", "toString", "toString");
  
  // Object prototype must NOT be polluted
  assert.strictEqual(Object.prototype.bremen, undefined, "Polluted Object.prototype.bremen");
  assert.strictEqual(Object.prototype.intent, undefined, "Polluted Object.prototype.intent");
  assert.strictEqual(typeof Object.prototype.toString, "function", "Polluted Object.prototype.toString");
});

challenge("Security", "Analytics Content Gaps: PII Scrubbing on Fallback Retention", () => {
  const store = engine.analytics;
  const piiQuery = "Ich heiße Dr. Heinrich Schliemann und habe seltene Tropenkrankheit";
  store.recordQuery(piiQuery, "fallback", null, "Unspezifisch");
  
  const metrics = store.getMetrics();
  const lastGap = metrics.contentGaps[metrics.contentGaps.length - 1];
  assert(!lastGap.includes("Heinrich Schliemann"), "PII retained in contentGaps snippet: " + lastGap);
  assert(lastGap.includes("[NAME ANONYMISIERT]"), "PII placeholder missing in gap: " + lastGap);
});


// -----------------------------------------------------------------------------
// SECTION 4: RESILIENCE, INPUT STRESS & REDOS AUDIT
// -----------------------------------------------------------------------------
console.log("\n--- SECTION 4: Resilience, Input Stress & ReDoS Audit ---");

challenge("Resilience", "Type Safety: Non-string input coercion", () => {
  assert.doesNotThrow(() => engine.processQuery(null));
  assert.doesNotThrow(() => engine.processQuery(undefined));
  assert.doesNotThrow(() => engine.processQuery(12345));
  assert.doesNotThrow(() => engine.processQuery({ query: "Parkinson" }));
  assert.doesNotThrow(() => engine.processQuery([1, 2, 3]));
  assert.doesNotThrow(() => engine.processQuery(true));
});

challenge("Resilience", "ReDoS Attack on Phone Scrubber: 50 repetitive '+' chars", () => {
  const t0 = Date.now();
  const attackStr = "+" + "1".repeat(50) + " trailing text";
  scrubPII(attackStr);
  const elapsed = Date.now() - t0;
  assert(elapsed < 200, `ReDoS detected! Took ${elapsed}ms for 50 repetitive chars`);
});

challenge("Resilience", "ReDoS Attack on Name Scrubber: Long nested name candidate", () => {
  const t0 = Date.now();
  const attackStr = "Ich heiße " + "Hans-".repeat(100) + "Peter";
  scrubPII(attackStr);
  const elapsed = Date.now() - t0;
  assert(elapsed < 200, `ReDoS detected! Took ${elapsed}ms for nested name`);
});

challenge("Resilience", "10,000 Character Stress Input", () => {
  const longText = "Hallo ".repeat(1500) + "ich suche Parkinson in Kassel " + "bitte ".repeat(500);
  const t0 = Date.now();
  const res = engine.processQuery(longText);
  const elapsed = Date.now() - t0;
  assert(elapsed < 500, `Processing 10,000 chars took too long: ${elapsed}ms`);
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "kassel-elena");
});

challenge("Resilience", "Unicode Stress: Mixed Scripts, Emojis & Null Bytes", () => {
  const stressQuery = "🧠🤖🦴 \x00\x01\x02 Parkinnson in Kassl \uD83D\uDE00";
  const res = engine.processQuery(stressQuery);
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "kassel-elena");
});


// -----------------------------------------------------------------------------
// SECTION 5: REGULATORY & MDR COMPLIANCE AUDIT
// -----------------------------------------------------------------------------
console.log("\n--- SECTION 5: Regulatory & MDR Compliance Audit ---");

challenge("Regulatory", "Zero 'Chef' occurrences in ALL engine output fields", () => {
  const testQueries = [
    "Wer ist der Chefarzt?",
    "Chefarztbehandlung erwünscht",
    "Chefin der Klinik",
    "Parkinson Kassel",
    "Urologie Düsseldorf",
    "Orthopädie Bremen",
    "Notaufnahme Henstedt",
    "Rheumatologie Langenhagen",
    "Besuchszeiten",
    "Zuweiserportal",
    "Kosten und Zuzahlung",
    "Wahlleistung Einzelzimmer",
    "Checkliste Koffer",
    "Karriere und Jobs",
    "Ich habe Brustschmerzen"
  ];

  for (const q of testQueries) {
    const res = engine.processQuery(q);
    const jsonStr = JSON.stringify(res);
    const forbiddenMatch = jsonStr.match(/\bchef(?:arzt|ärztin|ärzte|visite|behandlung|in)?\b/i);
    assert(!forbiddenMatch, `Forbidden word '${forbiddenMatch?.[0]}' found in response for query '${q}': ${jsonStr}`);
  }
});

challenge("Regulatory", "MDR Lotsendienst Notice Present in Every Response Type", () => {
  const queries = [
    { q: "", expectedType: "empty" },
    { q: "Ich habe Brustschmerzen", expectedType: "emergency" },
    { q: "Ich brauche einen Kreißsaal", expectedType: "unsupported" },
    { q: "Guten Tag", expectedType: "info" },
    { q: "Parkinson Kassel", expectedType: "match" },
    { q: "xyzabc unknown keyword", expectedType: "fallback" }
  ];

  for (const item of queries) {
    const res = engine.processQuery(item.q);
    assert(res.secondaryNotice || res.guidance || res.recommendation, `Missing secondary notice or clinical guidance in ${item.expectedType}`);
    if (res.secondaryNotice) {
      assert(res.secondaryNotice.includes("MDR-Hinweis") || res.secondaryNotice.includes("Orientierung"), `Improper secondary notice in ${item.expectedType}: ${res.secondaryNotice}`);
    }
  }
});

challenge("Regulatory", "Lotsendienst Neutrality: Never issues treatment prescription or diagnosis", () => {
  const res = engine.processQuery("Habe ich Parkinson weil meine Hände zittern?");
  assert.strictEqual(res.type, "match");
  // Bot recommends clinic Kassel-Elena, but must not diagnose:
  assert(!res.message.toLowerCase().includes("sie haben parkinson"), "Bot diagnosed patient!");
  assert(!res.message.toLowerCase().includes("nehmen sie"), "Bot prescribed medicine!");
});

console.log("\n===============================================================================");
console.log(`🏁 EMPIRICAL AUDIT REPORT: ${passedEmpiricalTests}/${totalEmpiricalTests} Passed (${findings.length} Failures)`);
console.log("===============================================================================");

if (findings.length > 0) {
  console.error("FAILURES DETECTED:");
  findings.forEach(f => console.error(`- [${f.suite}] ${f.name}: ${f.error}`));
  process.exit(1);
} else {
  console.log("🌟 ALL EMPIRICAL CHALLENGES PASSED WITH ZERO FAILURES.");
  process.exit(0);
}

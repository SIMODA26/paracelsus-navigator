/**
 * Paracelsus Kliniken - Comprehensive Automated Verification Test Suite v3.5
 * Senior Developer Audit (Clinical Safety, MDR, DSGVO Art. 9, Multi-Lingual, Zuweiser)
 */

const assert = require("assert");
const { ParacelsusBotEngine, scrubPII, buildMarketingUrl, createCalendarEventContent, EMERGENCY_CATEGORIES } = require("./src/bot-engine.js");
const standorteData = require("./data/standorte.json");

console.log("=================================================");
console.log("🏥 STARTING PARACELSUS CLINICAL & QA TEST SUITE v3.5");
console.log("=================================================");

const engine = new ParacelsusBotEngine(standorteData);
let testsPassed = 0;
let testsFailed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    testsFailed++;
  }
}

// 1. PII SCRUBBING TESTS (DSGVO Art. 9)
runTest("PII Scrubber: Strips Names with titles", () => {
  const input = "Mein Name ist Dr. Thomas Müller und ich brauche Hilfe";
  const output = scrubPII(input);
  assert(!output.includes("Thomas"), "Name was not removed");
  assert(output.includes("[NAME ANONYMISIERT]"), "Placeholder missing");
});

runTest("PII Scrubber: Strips Phone Numbers", () => {
  const input = "Rückruf unter 0171-4567890 oder +49 40 12345678";
  const output = scrubPII(input);
  assert(!output.includes("0171"), "Phone was not removed");
  assert(output.includes("[TELEFON ANONYMISIERT]"), "Placeholder missing");
});

runTest("PII Scrubber: Strips Email Addresses", () => {
  const input = "Senden Sie den Befund an patient.test@web.de danke";
  const output = scrubPII(input);
  assert(!output.includes("patient.test@web.de"), "Email was not removed");
  assert(output.includes("[E-MAIL ANONYMISIERT]"), "Placeholder missing");
});

runTest("PII Scrubber: Strips Health Insurance Number (Versichertennummer)", () => {
  const input = "Meine Kassen-Nummer lautet A123456789";
  const output = scrubPII(input);
  assert(!output.includes("A123456789"), "Insurance number was not removed");
  assert(output.includes("[VERSICHERTEN-NR ANONYMISIERT]"), "Placeholder missing");
});

// 2. EMERGENCY RED FLAG TRIAGE TESTS (112 / Crisis)
runTest("Emergency Triage: Heart Attack", () => {
  const res = engine.processQuery("Ich habe seit 20 Minuten stechende Brustschmerzen und Engegefühl");
  assert.strictEqual(res.type, "emergency");
  assert.strictEqual(res.emergencyCall, "112");
  assert(res.alertTitle.includes("HERZINFARKT"));
});

runTest("Emergency Triage: FAST Stroke Symptoms", () => {
  const res = engine.processQuery("Mein Mann hat plötzlich einen herabhängenden Mundwinkel und Sprachstörung");
  assert.strictEqual(res.type, "emergency");
  assert.strictEqual(res.emergencyCall, "112");
  assert(res.alertTitle.includes("SCHLAGANFALL"));
});

runTest("Emergency Triage: Severe Poisoning", () => {
  const res = engine.processQuery("Kind hat versehentlich Badreiniger geschluckt und Vergiftung");
  assert.strictEqual(res.type, "emergency");
  assert.strictEqual(res.emergencyCall, "030 19240");
});

runTest("Emergency Triage: Mental Health Crisis / Suicide", () => {
  const res = engine.processQuery("Ich bin lebensmüde und habe Suizidgedanken");
  assert.strictEqual(res.type, "emergency");
  assert.strictEqual(res.emergencyCall, "0800 111 0 111");
});

// 3. MULTI-LINGUAL SUPPORT TESTS
runTest("Multi-Lingual: English Emergency & Hospital Matching", () => {
  engine.setLanguage("en");
  const em = engine.processQuery("I have severe chest pain and cannot breathe");
  assert.strictEqual(em.type, "emergency");
  assert.strictEqual(em.emergencyCall, "112");
  assert(em.alertTitle.includes("HEART ATTACK") || em.alertTitle.includes("RESPIRATORY"));

  const match = engine.processQuery("Where can I find specialists for Parkinson disease?");
  assert.strictEqual(match.type, "match");
  assert(match.title.includes("Recommended Hospital") || match.title.includes("Elena-Klinik"));
  engine.setLanguage("de"); // reset
});

runTest("Multi-Lingual: Turkish Hospital Matching", () => {
  engine.setLanguage("tr");
  const match = engine.processQuery("Parkinson tedavisi için hastane arıyorum");
  assert.strictEqual(match.type, "match");
  assert(match.title.includes("Önerilen Uzmanlık Kliniği") || match.title.includes("Elena-Klinik"));
  engine.setLanguage("de"); // reset
});

// 4. NEGATIVE CATALOG & REFERRALS (116 117)
runTest("Negative Catalog: Obstetrics / Kreißsaal", () => {
  const res = engine.processQuery("Gibt es bei Ihnen einen Kreißsaal für die Geburt unseres Babys?");
  assert.strictEqual(res.type, "unsupported");
  assert(res.title.includes("Geburtshilfe"));
  assert.strictEqual(res.hotline, "116 117");
});

runTest("Negative Catalog: Pediatrics / Kinderklinik", () => {
  const res = engine.processQuery("Haben Sie eine Kinderklinik für meinen 4-jährigen Sohn?");
  assert.strictEqual(res.type, "unsupported");
  assert(res.title.includes("Kinder"));
  assert.strictEqual(res.hotline, "116 117");
});

// 5. ZUWEISER & ARZTPORTAL TESTS
runTest("Zuweiser Portal: Direct Chefarzt & Admission Contacts", () => {
  const res = engine.processQuery("Ich bin niedergelassener Urologe und möchte einen Patienten einweisen");
  assert.strictEqual(res.type, "zuweiser");
  assert(res.zuweiserContacts.length >= 3);
  assert(res.zuweiserContacts.some(z => z.clinic.includes("Golzheim")));
});

// 6. CLINICAL SPECIALTY & ROUTING TESTS
runTest("Clinical Routing: DaVinci Prostate in Düsseldorf", () => {
  const res = engine.processQuery("Ich suche ein DaVinci Roboter Zentrum für Prostatakrebs in Düsseldorf");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "duesseldorf-golzheim");
  assert(res.clinic.url.includes("utm_source=paracelsus_wegweiser"));
});

runTest("Clinical Routing: Parkinson in Kassel", () => {
  const res = engine.processQuery("Meine Mutter leidet an Parkinson und starkem Zittern, gibt es Spezialisten in Kassel?");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "kassel-elena");
  assert(res.clinic.phone.includes("561"), "Phone number does not match Kassel area code");
});

runTest("Clinical Routing: Joint & Orthopedics in Bremen", () => {
  const res = engine.processQuery("Brauche ein neues Kniegelenk oder Hüft-Endoprothese in Bremen");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "bremen");
});

runTest("Clinical Routing: Emergency Surgery Henstedt-Ulzburg", () => {
  const res = engine.processQuery("Wo ist die Zentrale Notaufnahme in Henstedt-Ulzburg?");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "henstedt-ulzburg");
});

// 7. PATIENT JOURNEY: CHECKLISTS & VISITING HOURS
runTest("Patient Journey: Koffer-Checkliste", () => {
  const res = engine.processQuery("Was muss ich zur stationären Aufnahme alles mitbringen?");
  assert.strictEqual(res.type, "checklist");
  assert(res.checklistItems.length >= 4);
});

// 8. MARKETING & UTM BUILDER
runTest("Marketing: UTM Builder creates compliant query params", () => {
  const url = buildMarketingUrl("https://www.paracelsus-kliniken.de/duesseldorf/", "duesseldorf-golzheim", "davinci");
  assert(url.includes("utm_source=paracelsus_wegweiser"));
  assert(url.includes("utm_medium=chatbot"));
  assert(url.includes("utm_campaign=routing_duesseldorf-golzheim"));
});

// 9. CALENDAR ICS EVENT GENERATION
runTest("Calendar: Generates valid iCalendar (.ics) string with clinic details", () => {
  const duesseldorf = standorteData.find(c => c.id === "duesseldorf-golzheim");
  assert(duesseldorf, "Clinic not found");
  const ics = createCalendarEventContent(duesseldorf);
  assert(ics.includes("BEGIN:VCALENDAR"), "VCALENDAR header missing");
  assert(ics.includes("END:VCALENDAR"), "VCALENDAR footer missing");
  assert(ics.includes("BEGIN:VEVENT"), "VEVENT missing");
  assert(ics.includes("SUMMARY:Paracelsus Klinik Düsseldorf"), "Summary title incorrect");
  assert(ics.includes("LOCATION:"), "Location missing");
  assert(ics.includes(duesseldorf.phone), "Phone contact missing in calendar event");
});

// 10. SUBTLE FEEDBACK & CONVERSION METRICS
runTest("Analytics: Records discreet feedback (Ja, Mäßig, Nein) and calendar downloads", () => {
  const analytics = engine.analytics;
  const initialJa = analytics.data.feedback.ja || 0;
  const initialDownloads = analytics.data.calendarDownloads || 0;

  analytics.recordFeedback("ja");
  analytics.recordFeedback("maessig");
  analytics.recordFeedback("nein");
  analytics.recordCalendarDownload();

  assert.strictEqual(analytics.data.feedback.ja, initialJa + 1);
  assert.strictEqual(analytics.data.feedback.maessig, 1);
  assert.strictEqual(analytics.data.feedback.nein, 1);
  assert.strictEqual(analytics.data.calendarDownloads, initialDownloads + 1);
});

// 11. REGIONAL METROPOLREGION MAPPING
runTest("Regional Mapping: Surrounding cities route to nearest center", () => {
  const resKoeln = engine.processQuery("Ich suche eine Prostata-Klinik im Raum Köln oder Dortmund");
  assert.strictEqual(resKoeln.type, "match");
  assert.strictEqual(resKoeln.clinic.id, "duesseldorf-golzheim");

  const resHamburg = engine.processQuery("Wo ist die nächste Paracelsus Notaufnahme von Hamburg aus?");
  assert.strictEqual(resHamburg.type, "match");
  assert.strictEqual(resHamburg.clinic.id, "henstedt-ulzburg");
});

// 12. FUZZY MATCHING & TYPO TOLERANCE
runTest("Fuzzy Matching: Tolerates typos in medical and clinic terms", () => {
  const resTypoParkinson = engine.processQuery("Spezialbehandlung bei Párkinnson Erkrankung");
  assert.strictEqual(resTypoParkinson.type, "match");
  assert.strictEqual(resTypoParkinson.clinic.id, "kassel-elena");

  const resLaypersonKnie = engine.processQuery("Ich brauche dringend ein künstliches Knie");
  assert.strictEqual(resLaypersonKnie.type, "match");
  assert(resLaypersonKnie.clinic.id === "bremen" || resLaypersonKnie.clinic.id === "langenhagen-silbersee");
});

console.log("=================================================");
console.log(`🏁 TEST RESULT: ${testsPassed} Passed, ${testsFailed} Failed`);
console.log("=================================================");

if (testsFailed > 0) {
  process.exit(1);
}

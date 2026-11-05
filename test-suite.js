/**
 * Paracelsus Kliniken - Comprehensive Automated Verification & QA Test Suite v4.0
 * Umfassende Test-Suite: Klinische Triage, MDR-Konformität, DSGVO Art. 9, Metropolen-Routing,
 * Laien-Synonyme, Tippfehler-Toleranz, Mehrsprachigkeit, Zuweiser-Portal, Kalender, XSS & Edge Cases.
 */

const assert = require("assert");
const { ParacelsusBotEngine, scrubPII, buildMarketingUrl, createCalendarEventContent, EMERGENCY_CATEGORIES, REGION_MAPPING, fuzzyContains } = require("./src/bot-engine.js");
const standorteData = require("./data/standorte.json");

console.log("===============================================================================");
console.log("🏥 STARTING EXTENSIVE PARACELSUS CLINICAL & FUNCTIONAL QA TEST SUITE v4.0");
console.log("===============================================================================");

const engine = new ParacelsusBotEngine(standorteData);
let testsPassed = 0;
let testsFailed = 0;

function runTest(category, name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] [${category}] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] [${category}] ${name}: ${err.message}`);
    testsFailed++;
  }
}

// =============================================================================
// 1. PII SCRUBBING & PRIVACY (DSGVO Art. 9 Gesundheitsdaten)
// =============================================================================
runTest("PII", "Strips doctor title with full name", () => {
  const input = "Mein Name ist Dr. Thomas Müller und ich habe Rückenschmerzen";
  const output = scrubPII(input);
  assert(!output.includes("Thomas Müller"), "Name was not stripped");
  assert(output.includes("[NAME ANONYMISIERT]"), "Placeholder missing");
});

runTest("PII", "Strips 'Frau' prefix with full name", () => {
  const input = "Patientin ist Frau Sarah Schmidt";
  const output = scrubPII(input);
  assert(!output.includes("Sarah Schmidt"), "Female name was not stripped");
  assert(output.includes("[NAME ANONYMISIERT]"));
});

runTest("PII", "Strips German mobile phone numbers (017x)", () => {
  const input = "Rückruf bitte unter 0171-4567890 tagsüber";
  const output = scrubPII(input);
  assert(!output.includes("0171-4567890"), "Mobile number not stripped");
  assert(output.includes("[TELEFON ANONYMISIERT]"));
});

runTest("PII", "Strips German landline with area code (040 Hamburg)", () => {
  const input = "Meine Festnetznummer ist 040 12345678";
  const output = scrubPII(input);
  assert(!output.includes("12345678"), "Landline not stripped");
  assert(output.includes("[TELEFON ANONYMISIERT]"));
});

runTest("PII", "Strips international phone numbers (+49)", () => {
  const input = "Erreichbar unter +49 89 98765432";
  const output = scrubPII(input);
  assert(!output.includes("98765432"), "International phone not stripped");
  assert(output.includes("[TELEFON ANONYMISIERT]"));
});

runTest("PII", "Strips complex email addresses with subdomains", () => {
  const input = "Senden Sie den Bericht an simon.dallel@sub.klinik-test.de danke";
  const output = scrubPII(input);
  assert(!output.includes("simon.dallel@sub.klinik-test.de"), "Email not stripped");
  assert(output.includes("[E-MAIL ANONYMISIERT]"));
});

runTest("PII", "Strips Statutory Health Insurance Number (Versichertennummer: 1 Letter + 9 Digits)", () => {
  const input = "Kassennummer X123456789 zur Abrechnung";
  const output = scrubPII(input);
  assert(!output.includes("X123456789"), "Insurance number not stripped");
  assert(output.includes("[VERSICHERTEN-NR ANONYMISIERT]"));
});

runTest("PII", "Strips date of birth (Geburtsdatum DD.MM.YYYY)", () => {
  const input = "Geboren am 14.07.1985 in Bremen";
  const output = scrubPII(input);
  assert(!output.includes("14.07.1985"), "Birth date not stripped");
  assert(output.includes("[DATUM ANONYMISIERT]"));
});

// =============================================================================
// 2. EMERGENCY RED-FLAG TRIAGE (112, Giftnotruf, Krisendienst)
// =============================================================================
runTest("Emergency", "Acute myocardial infarction (Herzinfarkt / Brustenge)", () => {
  const res = engine.processQuery("Ich habe seit 20 Minuten schwere, vernichtende Brustschmerzen und Engegefühl");
  assert.strictEqual(res.type, "emergency");
  assert.strictEqual(res.emergencyCall, "112");
  assert(res.alertTitle.includes("HERZINFARKT"));
});

runTest("Emergency", "Pain radiating to left arm (Ausstrahlung in den linken Arm)", () => {
  const res = engine.processQuery("Starke Schmerzen in der Brust die in den linken Arm ausstrahlen");
  assert.strictEqual(res.type, "emergency");
  assert.strictEqual(res.emergencyCall, "112");
});

runTest("Emergency", "Stroke / FAST test symptoms (Mundwinkel hängt, Sprachverlust)", () => {
  const res = engine.processQuery("Mein Mann hat plötzlich einen herabhängenden Mundwinkel und lallende Aussprache");
  assert.strictEqual(res.type, "emergency");
  assert.strictEqual(res.emergencyCall, "112");
  assert(res.alertTitle.includes("SCHLAGANFALL"));
});

runTest("Emergency", "Acute respiratory failure (Akute Atemnot / Erstickungsangst)", () => {
  const res = engine.processQuery("Ich bekomme keine Luft mehr, akute Atemnot und blaue Lippen");
  assert.strictEqual(res.type, "emergency");
  assert.strictEqual(res.emergencyCall, "112");
});

runTest("Emergency", "Severe accidental chemical poisoning (Giftnotruf)", () => {
  const res = engine.processQuery("Kleinkind hat versehentlich Rohrreiniger geschluckt und Vergiftung");
  assert.strictEqual(res.type, "emergency");
  assert.strictEqual(res.emergencyCall, "030 19240");
  assert(res.alertTitle.includes("VERGIFTUNG"));
});

runTest("Emergency", "Massive arterial bleeding (Starke spritzende Blutung)", () => {
  const res = engine.processQuery("Nach Schnittwunde starke unstillbare Blutung und Blutverlust");
  assert.strictEqual(res.type, "emergency");
  assert.strictEqual(res.emergencyCall, "112");
});

runTest("Emergency", "Mental health crisis / Suicidal ideation (Telefonseelsorge)", () => {
  const res = engine.processQuery("Ich sehe keinen Ausweg mehr und habe Suizidgedanken");
  assert.strictEqual(res.type, "emergency");
  assert.strictEqual(res.emergencyCall, "0800 111 0 111");
  assert(res.alertTitle.includes("KRISE") || res.alertTitle.includes("SEELSORGE"));
});

runTest("Emergency", "Non-emergency safety: Chronic pain must NOT trigger red flag 112", () => {
  const res = engine.processQuery("Ich habe seit 3 Wochen leichte Rückenschmerzen beim Sitzen");
  assert.notStrictEqual(res.type, "emergency", "Chronic pain incorrectly flagged as emergency");
  assert.strictEqual(res.type, "match");
});

// =============================================================================
// 3. NEGATIVE CATALOG & 116 117 REFERRALS (MDR Compliance)
// =============================================================================
runTest("NegativeCatalog", "Obstetrics / Kreißsaal / Geburt", () => {
  const res = engine.processQuery("Haben Sie einen Kreißsaal für die Entbindung meines Kindes?");
  assert.strictEqual(res.type, "unsupported");
  assert(res.title.includes("Geburtshilfe"));
  assert.strictEqual(res.hotline, "116 117");
});

runTest("NegativeCatalog", "Pediatrics / Kinderklinik", () => {
  const res = engine.processQuery("Suchen eine stationäre Kinderklinik für unseren 5-jährigen Sohn");
  assert.strictEqual(res.type, "unsupported");
  assert(res.title.includes("Kinder"));
  assert.strictEqual(res.hotline, "116 117");
});

runTest("NegativeCatalog", "Ophthalmology / Augenklinik / Grauer Star", () => {
  const res = engine.processQuery("Führen Sie Augenoperationen bei Grauer Star durch?");
  assert.strictEqual(res.type, "unsupported");
  assert(res.title.includes("Augen"));
  assert.strictEqual(res.hotline, "116 117");
});

runTest("NegativeCatalog", "Dentistry / Zahnklinik / Kieferchirurgie", () => {
  const res = engine.processQuery("Muss mir die Weisheitszähne in der Zahnklinik ziehen lassen");
  assert.strictEqual(res.type, "unsupported");
  assert(res.title.includes("Zahn"));
  assert.strictEqual(res.hotline, "116 117");
});

runTest("NegativeCatalog", "Dermatology / Hautklinik / Schuppenflechte", () => {
  const res = engine.processQuery("Gibt es eine Hautklinik für schwere Neurodermitis und Dermatologie?");
  assert.strictEqual(res.type, "unsupported");
  assert(res.title.includes("Dermatologie"));
  assert.strictEqual(res.hotline, "116 117");
});

// =============================================================================
// 4. CLINICAL ROUTING & SPECIALTY MATCHING (Alle 7 Standorte)
// =============================================================================
runTest("Routing", "Elena-Klinik Kassel: Morbus Parkinson Spezialzentrum", () => {
  const res = engine.processQuery("Wir suchen die führende Fachklinik für Morbus Parkinson in Hessen");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "kassel-elena");
  assert(res.clinic.name.includes("Elena-Klinik"));
});

runTest("Routing", "Elena-Klinik Kassel: Atypische Parkinsonsyndrome (PSP, MSA)", () => {
  const res = engine.processQuery("Behandlung bei progressiver supranukleärer Blickparese PSP");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "kassel-elena");
});

runTest("Routing", "Klinik Golzheim Düsseldorf: DaVinci Roboter Urologie", () => {
  const res = engine.processQuery("Zertifiziertes Prostatakarzinomzentrum mit DaVinci Xi Roboter");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "duesseldorf-golzheim");
});

runTest("Routing", "Klinik Golzheim Düsseldorf: Nierentumor & Fusionsbiopsie", () => {
  const res = engine.processQuery("MRT Fusionsbiopsie der Prostata und Nierenteilresektion");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "duesseldorf-golzheim");
});

runTest("Routing", "Klinik Bremen: Endoprothetikzentrum Knie & Hüfte", () => {
  const res = engine.processQuery("Zertifizierte Knie-Endoprothetik und Hüft-TEP Operation");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "bremen");
});

runTest("Routing", "Klinik Bremen: Wirbelsäulenchirurgie & Bandscheibe", () => {
  const res = engine.processQuery("Bandscheibenvorfall LWS Operation und Wirbelsäulentherapie in Bremen");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "bremen");
});

runTest("Routing", "Klinik Henstedt-Ulzburg: 24/7 Zentrale Notaufnahme (ZNA)", () => {
  const res = engine.processQuery("Wo ist die Zentrale Notaufnahme ZNA in Henstedt-Ulzburg?");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "henstedt-ulzburg");
});

runTest("Routing", "Klinik Henstedt-Ulzburg: Viszeralchirurgie & Allgemeinchirurgie", () => {
  const res = engine.processQuery("Minimalinvasive Allgemeinchirurgie und Bauchchirurgie Henstedt-Ulzburg");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "henstedt-ulzburg");
});

runTest("Routing", "Klinik am Silbersee Langenhagen: Internistische Rheumatologie", () => {
  const res = engine.processQuery("Fachabteilung für chronische Polyarthritis und internistische Rheumatologie");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "langenhagen-silbersee");
});

runTest("Routing", "Klinik am Silbersee Langenhagen: Multimodale Schmerztherapie", () => {
  const res = engine.processQuery("Stationäre multimodale Schmerztherapie bei chronischen Schmerzen");
  assert.strictEqual(res.type, "match");
  assert(res.clinic.id === "langenhagen-silbersee" || res.clinic.id === "bremen");
});

runTest("Routing", "Paracelsus Klinik Schöneck: Innere Medizin & Kardiologie", () => {
  const res = engine.processQuery("Innere Medizin und Herzuntersuchung in der Klinik Schöneck");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "schoeneck");
});

runTest("Routing", "Paracelsus Klinik München: Sporttraumatologie & Kreuzband", () => {
  const res = engine.processQuery("Kreuzbandriss und Sportorthopädie in München");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "muenchen");
});

// =============================================================================
// 5. METROPOLEN- & REGIONALES UMLAND-ROUTING
// =============================================================================
runTest("RegionalMapping", "Köln / Cologne routes to Düsseldorf Golzheim", () => {
  const res = engine.processQuery("Ich wohne in Köln und suche eine Spezialklinik für Urologie");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "duesseldorf-golzheim");
});

runTest("RegionalMapping", "Bonn routes to Düsseldorf Golzheim", () => {
  const res = engine.processQuery("Beste Klinik für DaVinci Roboter Prostata von Bonn aus");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "duesseldorf-golzheim");
});

runTest("RegionalMapping", "Dortmund & Ruhrgebiet route to Düsseldorf Golzheim", () => {
  const res = engine.processQuery("Suche Prostatakrebs-Zentrum im Ruhrgebiet / Dortmund");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "duesseldorf-golzheim");
});

runTest("RegionalMapping", "Essen & Duisburg route to Düsseldorf Golzheim", () => {
  const res = engine.processQuery("Urologe empfiehlt Klinik bei Essen oder Duisburg");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "duesseldorf-golzheim");
});

runTest("RegionalMapping", "Hamburg & Norderstedt route to Henstedt-Ulzburg", () => {
  const res = engine.processQuery("Nächste Paracelsus Klinik von Hamburg Norderstedt aus");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "henstedt-ulzburg");
});

runTest("RegionalMapping", "Kiel & Neumünster route to Henstedt-Ulzburg", () => {
  const res = engine.processQuery("Chirurgie und Notfallversorgung aus dem Raum Kiel Neumünster");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "henstedt-ulzburg");
});

runTest("RegionalMapping", "Hannover & Celle route to Langenhagen am Silbersee", () => {
  const res = engine.processQuery("Rheumatologe im Raum Hannover oder Celle gesucht");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "langenhagen-silbersee");
});

runTest("RegionalMapping", "Göttingen & Fulda route to Kassel Elena-Klinik", () => {
  const res = engine.processQuery("Parkinson Spezialsprechstunde für Patienten aus Göttingen oder Fulda");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "kassel-elena");
});

runTest("RegionalMapping", "Chemnitz & Plauen route to Paracelsus Klinik Schöneck", () => {
  const res = engine.processQuery("Innere Medizin und Bauchchirurgie nahe Plauen / Chemnitz");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "schoeneck");
});

runTest("RegionalMapping", "Augsburg routes to Paracelsus Klinik München", () => {
  const res = engine.processQuery("Orthopädische Gelenkoperation von Augsburg aus");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "muenchen");
});

// =============================================================================
// 6. ALLTAGSSPRACHE & LAIEN-SYNONYME (Patientenverständnis)
// =============================================================================
runTest("Layperson", "'künstliches Knie' routes to Endoprothetik", () => {
  const res = engine.processQuery("Ich brauche ein künstliches Knie und eine Reha-Beratung");
  assert.strictEqual(res.type, "match");
  assert(res.clinic.id === "bremen" || res.clinic.id === "langenhagen-silbersee" || res.clinic.id === "muenchen");
});

runTest("Layperson", "'neue Hüfte' routes to Endoprothetik", () => {
  const res = engine.processQuery("Mein Orthopäde sagt ich brauche eine neue Hüfte");
  assert.strictEqual(res.type, "match");
  assert(res.clinic.id === "bremen" || res.clinic.id === "langenhagen-silbersee" || res.clinic.id === "muenchen");
});

runTest("Layperson", "'Händezittern' routes to Parkinson Zentrum Kassel", () => {
  const res = engine.processQuery("Meine Mutter hat starkes Händezittern und verlangsamte Bewegungen");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "kassel-elena");
});

runTest("Layperson", "'Schwierigkeiten beim Wasserlassen' routes to Urologie", () => {
  const res = engine.processQuery("Starke Schmerzen und Schwierigkeiten beim Wasserlassen seit Wochen");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "duesseldorf-golzheim");
});

runTest("Layperson", "'Gallenblasenentzündung' routes to Allgemeinchirurgie", () => {
  const res = engine.processQuery("Verdacht auf Gallensteine und Gallenblasenentzündung");
  assert.strictEqual(res.type, "match");
  assert(res.clinic.id === "henstedt-ulzburg" || res.clinic.id === "schoeneck");
});

runTest("Layperson", "'Blinddarmentzündung' routes to Notfall Henstedt-Ulzburg", () => {
  const res = engine.processQuery("Akute Blinddarmentzündung mit Schmerzen im rechten Unterbauch");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "henstedt-ulzburg");
});

runTest("Layperson", "'eingeklemmter Ischiasnerv' routes to Wirbelsäule Bremen oder Langenhagen", () => {
  const res = engine.processQuery("Eingeklemmter Ischiasnerv strahlt ins Bein aus");
  assert.strictEqual(res.type, "match");
  assert(res.clinic.id === "bremen" || res.clinic.id === "langenhagen-silbersee");
});

// =============================================================================
// 7. FUZZY MATCHING & TIPPEFEHLER-TOLERANZ (Levenshtein)
// =============================================================================
runTest("Fuzzy", "Tolerates typo 'Párkinnson' with umlaut and double n", () => {
  const res = engine.processQuery("Behandlung bei Párkinnson");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "kassel-elena");
});

runTest("Fuzzy", "Tolerates typo 'Prostata-Opperation'", () => {
  const res = engine.processQuery("Termin für Prostata-Opperation");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "duesseldorf-golzheim");
});

runTest("Fuzzy", "Tolerates city typo 'Düsseldorff'", () => {
  const res = engine.processQuery("Urologische Fachabteilung in Düsseldorff");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "duesseldorf-golzheim");
});

runTest("Fuzzy", "Tolerates typo 'Elena-Klink Kassl'", () => {
  const res = engine.processQuery("Wo ist die Elena-Klink in Kassl?");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "kassel-elena");
});

runTest("Fuzzy", "Tolerates typo 'Rheumathologie'", () => {
  const res = engine.processQuery("Termin für Rheumathologie am Silbersee");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "langenhagen-silbersee");
});

// =============================================================================
// 8. MULTI-LINGUAL SUPPORT (EN, TR, UK)
// =============================================================================
runTest("MultiLingual", "English: Emergency Heart Attack triggers 112", () => {
  engine.setLanguage("en");
  const res = engine.processQuery("I have severe chest pain and breathlessness");
  assert.strictEqual(res.type, "emergency");
  assert.strictEqual(res.emergencyCall, "112");
  engine.setLanguage("de");
});

runTest("MultiLingual", "English: Specialist Parkinson matching", () => {
  engine.setLanguage("en");
  const res = engine.processQuery("Looking for hospital specializing in Parkinson disease");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "kassel-elena");
  engine.setLanguage("de");
});

runTest("MultiLingual", "Turkish: Parkinson hospital matching", () => {
  engine.setLanguage("tr");
  const res = engine.processQuery("Parkinson tedavisi için en iyi hastane");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "kassel-elena");
  engine.setLanguage("de");
});

runTest("MultiLingual", "Ukrainian: General hospital matching", () => {
  engine.setLanguage("uk");
  const res = engine.processQuery("Паркінсон лікування лікарня");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "kassel-elena");
  engine.setLanguage("de");
});

// =============================================================================
// 9. ZUWEISER & ÄRZTEPORTAL
// =============================================================================
runTest("Zuweiser", "General physician query triggers direct department contacts", () => {
  const res = engine.processQuery("Ich bin niedergelassener Arzt und möchte einen Patienten einweisen");
  assert.strictEqual(res.type, "zuweiser");
  assert(res.zuweiserContacts.length >= 3);
});

runTest("Zuweiser", "Referrer contacts contain telephone, fax and clinic name", () => {
  const res = engine.processQuery("Zuweiserportal ärztliche Einweisung");
  assert.strictEqual(res.type, "zuweiser");
  const first = res.zuweiserContacts[0];
  assert(first.clinic && first.phone && first.fax, "Contact missing phone or fax");
});

runTest("Zuweiser", "Urologist referrer query routes with Golzheim representation", () => {
  const res = engine.processQuery("Urologische Einweisung für Klinik Golzheim");
  assert.strictEqual(res.type, "zuweiser");
  assert(res.zuweiserContacts.some(c => c.clinic.includes("Golzheim")));
});

// =============================================================================
// 10. PATIENT JOURNEY SERVICES (Checkliste, Kalender, Analytics, UTM)
// =============================================================================
runTest("PatientJourney", "Koffer-Checkliste returns at least 5 structured items", () => {
  const res = engine.processQuery("Was muss ich zur stationären Aufnahme alles in den Koffer packen?");
  assert.strictEqual(res.type, "checklist");
  assert(res.checklistItems.length >= 5);
  assert(res.checklistItems.some(item => item.includes("Einweisung") || item.includes("Versichertenkarte")));
});

runTest("PatientJourney", "iCalendar generator creates valid RFC 5545 format", () => {
  const clinic = standorteData[0];
  const ics = createCalendarEventContent(clinic);
  assert(ics.includes("BEGIN:VCALENDAR"));
  assert(ics.includes("VERSION:2.0"));
  assert(ics.includes("BEGIN:VEVENT"));
  assert(ics.includes("SUMMARY:"));
  assert(ics.includes("END:VCALENDAR"));
});

runTest("PatientJourney", "UTM Builder appends valid tracking parameters", () => {
  const url = buildMarketingUrl("https://www.paracelsus-kliniken.de/kassel/", "kassel-elena", "parkinson");
  assert(url.includes("utm_source=paracelsus_wegweiser"));
  assert(url.includes("utm_medium=chatbot"));
  assert(url.includes("utm_campaign=routing_kassel-elena"));
  assert(url.includes("utm_content=parkinson"));
});

runTest("PatientJourney", "Anonymous feedback metrics recording (Ja, Mäßig, Nein)", () => {
  const store = engine.analytics;
  const initialJa = store.data.feedback.ja || 0;
  store.recordFeedback("ja");
  store.recordFeedback("maessig");
  store.recordFeedback("nein");
  assert.strictEqual(store.data.feedback.ja, initialJa + 1);
});

// =============================================================================
// 11. SECURITY, XSS & EDGE CASES
// =============================================================================
runTest("Security", "XSS injection attempt (<script>alert(1)</script>) handled safely", () => {
  const res = engine.processQuery("<script>alert('XSS-TEST')</script> DaVinci Roboter");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "duesseldorf-golzheim");
});

runTest("Security", "SQL injection pattern (' OR '1'='1) does not crash engine", () => {
  const res = engine.processQuery("' OR '1'='1' -- Parkinson Spezialist");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "kassel-elena");
});

runTest("Security", "Empty and whitespace query returns graceful guidance", () => {
  const res = engine.processQuery("     ");
  assert.strictEqual(res.type, "empty");
  assert(res.message && res.message.length > 0);
});

runTest("Security", "Excessively long query (> 800 characters) processes without timeout", () => {
  const longQuery = "Parkinson ".repeat(80) + "in Kassel";
  const start = Date.now();
  const res = engine.processQuery(longQuery);
  const elapsed = Date.now() - start;
  assert(elapsed < 200, `Processing took too long: ${elapsed}ms`);
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "kassel-elena");
});

runTest("Security", "Emoji-only and punctuation input handled safely", () => {
  const res = engine.processQuery("🩺🤖❓❓❓");
  assert(res.type === "fallback" || res.type === "general" || res.type === "match");
});

// =============================================================================
// SUMMARY REPORT
// =============================================================================
console.log("===============================================================================");
console.log(`🏁 FINAL TEST REPORT: ${testsPassed} Passed, ${testsFailed} Failed (Total: ${testsPassed + testsFailed})`);
console.log("===============================================================================");

if (testsFailed > 0) {
  process.exit(1);
}

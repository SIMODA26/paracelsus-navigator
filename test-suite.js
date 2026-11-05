/**
 * Paracelsus Kliniken - Comprehensive Automated Verification & QA Test Suite v4.0
 * Umfassende Test-Suite: Klinische Triage, MDR-Konformität, DSGVO Art. 9, Metropolen-Routing,
 * Laien-Synonyme, Tippfehler-Toleranz, Mehrsprachigkeit, Zuweiser-Portal, Kalender, XSS & Edge Cases.
 */

const assert = require("assert");

// Deterministic in-memory storage mock for Node.js test environment
{
  const memoryStore = new Map();
  const mockStorage = {
    getItem: (k) => memoryStore.has(String(k)) ? memoryStore.get(String(k)) : null,
    setItem: (k, v) => memoryStore.set(String(k), String(v)),
    removeItem: (k) => memoryStore.delete(String(k)),
    clear: () => memoryStore.clear()
  };
  try {
    Object.defineProperty(global, "localStorage", {
      value: mockStorage,
      configurable: true,
      writable: true
    });
  } catch (e) {
    global.localStorage = mockStorage;
  }
}

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
// 12. CLINICAL FAQ & SMART INTENT HANDLERS
// =============================================================================
runTest("SmartFAQ", "Greetings warmly answered with orientation chips", () => {
  const res = engine.processQuery("Hallo, wer bist du?");
  assert.strictEqual(res.type, "info");
  assert(res.title.includes("Willkommen"));
  assert(res.chips && res.chips.length >= 4);
});

runTest("SmartFAQ", "Farewell and gratitude warmly acknowledged", () => {
  const res = engine.processQuery("Danke für die Hilfe!");
  assert.strictEqual(res.type, "info");
  assert(res.title.includes("Sehr gerne"));
});

runTest("SmartFAQ", "Hospital costs and statutory co-payment (§ 39 SGB V) explained", () => {
  const res = engine.processQuery("Was kostet ein Einzelzimmer?");
  assert.strictEqual(res.type, "info");
  assert(res.message.includes("10 €"));
});

runTest("SmartFAQ", "Patient referral vs. hospital admission order explained", () => {
  const res = engine.processQuery("Brauche ich eine Überweisung vom Hausarzt?");
  assert.strictEqual(res.type, "info");
  assert(res.message.includes("Überweisung"));
  assert(res.message.includes("Einweisung"));
});

runTest("SmartFAQ", "Free patient Wi-Fi and TV amenities answered directly", () => {
  const res = engine.processQuery("Haben Sie WLAN auf den Zimmern?");
  assert.strictEqual(res.type, "info");
  assert(res.message.includes("WLAN"));
});

runTest("SmartFAQ", "Admission day step-by-step process explained", () => {
  const res = engine.processQuery("Wie läuft die Aufnahme ab?");
  assert.strictEqual(res.type, "info");
  assert(res.title.includes("Aufnahme"));
});

runTest("SmartFAQ", "Independent second opinion service presented", () => {
  const res = engine.processQuery("Ich brauche eine Zweitmeinung vor einer Knie-OP");
  assert.strictEqual(res.type, "info");
  assert(res.title.includes("Zweitmeinung"));
});

runTest("SmartFAQ", "Payment methods (EC-card, credit card, cash) confirmed", () => {
  const res = engine.processQuery("Kann man bei Ihnen mit Karte zahlen?");
  assert.strictEqual(res.type, "info");
  assert(res.message.includes("EC-Karte"));
});

runTest("SmartFAQ", "Rooming-in and partner accommodation options explained", () => {
  const res = engine.processQuery("Kann mein Partner bei mir im Zimmer übernachten?");
  assert.strictEqual(res.type, "info");
  assert(res.message.includes("Begleitperson"));
});

// =============================================================================
// 13. FALSE-POSITIVE IMMUNITY & DISAMBIGUATION (Stopwords & Precision)
// =============================================================================
runTest("Precision", "Rückenschmerzen routes to Bremen, NEVER false-matched to Hagen/Düsseldorf", () => {
  const res = engine.processQuery("Ich habe starke Rückenschmerzen seit 2 Wochen");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "bremen");
});

runTest("Precision", "Parkinson query routes to Kassel, NEVER false-matched to Peine/Langenhagen", () => {
  const res = engine.processQuery("Mein Vater hat Parkinson, wo können wir hin?");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "kassel-elena");
});

runTest("Precision", "Elevated PSA level routes to Düsseldorf Golzheim prostate center", () => {
  const res = engine.processQuery("Mein PSA-Wert ist erhöht, was soll ich tun?");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "duesseldorf-golzheim");
});

runTest("Precision", "Urethral stricture (Harnröhrenstriktur) routes to Düsseldorf Golzheim", () => {
  const res = engine.processQuery("Harnröhrenstriktur Behandlung");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "duesseldorf-golzheim");
});

runTest("Precision", "Acute right lower abdominal pain routes to Henstedt-Ulzburg surgery", () => {
  const res = engine.processQuery("Bauchschmerzen rechts unten seit heute morgen");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "henstedt-ulzburg");
});

runTest("Precision", "Addiction and alcohol detox routes to Langenhagen am Silbersee", () => {
  const res = engine.processQuery("Ich suche eine Klinik für Suchttherapie / Alkoholentzug");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "langenhagen-silbersee");
});

// =============================================================================
// 14. HARDENED PII SCRUBBING & PRIVACY (DSGVO Art. 9 & Edge Cases)
// =============================================================================
runTest("PII_Hardened", "Strips standalone doctor name without Herr/Frau prefix", () => {
  const input = "Dr. Thomas Müller hat mich an Ihre Klinik überwiesen";
  const output = scrubPII(input);
  assert(!output.includes("Thomas Müller"), "Doctor name was not stripped");
  assert(output.includes("[NAME ANONYMISIERT]"), "Placeholder missing");
});

runTest("PII_Hardened", "Strips 'Ich bin' name introduction", () => {
  const input = "Guten Tag, ich bin Peter Schmidt aus Bremen";
  const output = scrubPII(input);
  assert(!output.includes("Peter Schmidt"), "Name after 'ich bin' not stripped");
  assert(output.includes("[NAME ANONYMISIERT]"));
});

runTest("PII_Hardened", "Strips 'Mein Name lautet' intro variant", () => {
  const input = "Mein Name lautet Klaus Dieter und ich suche Hilfe";
  const output = scrubPII(input);
  assert(!output.includes("Klaus Dieter"), "Name after 'mein Name lautet' not stripped");
  assert(output.includes("[NAME ANONYMISIERT]"));
});

runTest("PII_Hardened", "Strips 'Patientin:' prefix with compound female name", () => {
  const input = "Patientin: Anna-Lena Meyer benötigt einen Termin";
  const output = scrubPII(input);
  assert(!output.includes("Anna-Lena Meyer"), "Patientin name not stripped");
  assert(output.includes("[NAME ANONYMISIERT]"));
});

runTest("PII_Hardened", "Strips compound hyphenated surnames", () => {
  const input = "Mein Name ist Herr Schmidt-Kowalski";
  const output = scrubPII(input);
  assert(!output.includes("Schmidt-Kowalski"), "Hyphenated surname not stripped");
  assert(output.includes("[NAME ANONYMISIERT]"));
});

runTest("PII_Hardened", "Strips ISO-8601 formatted date of birth (YYYY-MM-DD)", () => {
  const input = "Mein Geburtsdatum ist 1985-07-14";
  const output = scrubPII(input);
  assert(!output.includes("1985-07-14"), "ISO date was not stripped");
  assert(output.includes("[DATUM ANONYMISIERT]"));
});

runTest("PII_Hardened", "Strips slash-formatted date of birth (DD/MM/YYYY)", () => {
  const input = "Geboren am 14/07/1985 in Kassel";
  const output = scrubPII(input);
  assert(!output.includes("14/07/1985"), "Slash date was not stripped");
  assert(output.includes("[DATUM ANONYMISIERT]"));
});

runTest("PII_Hardened", "Strips German written month date (DD. Monat YYYY)", () => {
  const input = "Geboren am 14. Juli 1985";
  const output = scrubPII(input);
  assert(!output.includes("14. Juli 1985"), "Written date was not stripped");
  assert(output.includes("[DATUM ANONYMISIERT]"));
});

runTest("PII_Hardened", "Strips German street address with house number", () => {
  const input = "Meine Adresse ist Friedrichstraße 12 in 40474 Düsseldorf";
  const output = scrubPII(input);
  assert(!output.includes("Friedrichstraße 12"), "Street address was not stripped");
  assert(output.includes("[ADRESSE ANONYMISIERT]"));
});

runTest("PII_Hardened", "Preserves 5-digit German postal code (PLZ) without masking as phone number", () => {
  const input = "Meine Postleitzahl ist 40213 Düsseldorf und 01067 Dresden";
  const output = scrubPII(input);
  assert(!output.includes("[TELEFON ANONYMISIERT]"), "PLZ incorrectly masked as phone");
  assert(output.includes("40213"), "PLZ 40213 missing");
  assert(output.includes("01067"), "PLZ 01067 missing");
});

runTest("PII_Hardened", "Strips formatted health insurance number with space (KVNR: A 123456789)", () => {
  const input = "Versichertennummer A 123456789 zur Abrechnung";
  const output = scrubPII(input);
  assert(!output.includes("A 123456789"), "Insurance number was not stripped");
  assert(output.includes("[VERSICHERTEN-NR ANONYMISIERT]"), "Insurance placeholder missing");
  assert(!output.includes("[TELEFON ANONYMISIERT]"), "Must not mask KVNR as phone");
});

runTest("PII_Hardened", "Strips decomposed Unicode (NFD) umlaut names without leaving trailing fragments", () => {
  const nfdInput = "Mein Name ist Herr " + "Müller".normalize("NFD");
  const output = scrubPII(nfdInput);
  assert(!output.includes("ller"), "Trailing NFD fragment remained unscrubbed");
  assert(!output.includes("Müller".normalize("NFD")));
  assert(output.includes("[NAME ANONYMISIERT]"));
});

runTest("PII_Hardened", "Preserves clinical non-PII terms, scores, and monetary amounts", () => {
  const input = "PSA-Wert von 4.5 ng/ml, ICD M54.5 und Zuzahlung 10 € pro Tag seit 3 Wochen";
  const output = scrubPII(input);
  assert(output.includes("4.5"), "PSA decimal value was corrupted");
  assert(output.includes("10 €"), "Co-payment amount was corrupted");
  assert(output.includes("3 Wochen"), "Duration was corrupted");
});

// =============================================================================
// 15. TYPE SAFETY & INPUT ROBUSTNESS
// =============================================================================
runTest("TypeSafety_Unicode", "Handles non-string inputs (number, boolean, object, null, undefined) gracefully in scrubPII", () => {
  assert.strictEqual(scrubPII(12345), "12345");
  assert.strictEqual(scrubPII(true), "true");
  assert.strictEqual(scrubPII(null), "");
  assert.strictEqual(scrubPII(undefined), "");
  assert.strictEqual(scrubPII({ query: "test" }), "");
});

runTest("TypeSafety_Unicode", "Handles non-string inputs in engine.processQuery without crashing", () => {
  assert.doesNotThrow(() => engine.processQuery(12345));
  assert.doesNotThrow(() => engine.processQuery(true));
  assert.strictEqual(engine.processQuery(null).type, "empty");
  assert.strictEqual(engine.processQuery(undefined).type, "empty");
  assert.strictEqual(engine.processQuery({ test: "data" }).type, "empty");
});

runTest("TypeSafety_Unicode", "Handles null bytes and control characters safely", () => {
  const res = engine.processQuery("Parkinson\0Kassel\r\nSpezialist");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "kassel-elena");
});

runTest("TypeSafety_Unicode", "Processes 10,000 character massive query without stack overflow or timeout", () => {
  const massive = "Knieschmerzen ".repeat(1000);
  const start = Date.now();
  const res = engine.processQuery(massive);
  const elapsed = Date.now() - start;
  assert(elapsed < 300, `Massive query took ${elapsed}ms`);
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "bremen");
});

runTest("TypeSafety_Unicode", "Correctly matches München in decomposed Unicode (NFD)", () => {
  const nfdQuery = "Klinik in " + "München".normalize("NFD");
  const res = engine.processQuery(nfdQuery);
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "muenchen");
});

runTest("TypeSafety_Unicode", "Correctly matches Düsseldorf in decomposed Unicode (NFD)", () => {
  const nfdQuery = "Spezialist in " + "Düsseldorf".normalize("NFD");
  const res = engine.processQuery(nfdQuery);
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "duesseldorf-golzheim");
});

runTest("TypeSafety_Unicode", "Correctly matches Schöneck in decomposed Unicode (NFD)", () => {
  const nfdQuery = "Krankenhaus in " + "Schöneck".normalize("NFD");
  const res = engine.processQuery(nfdQuery);
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "schoeneck");
});

runTest("TypeSafety_Unicode", "Correctly routes regional Köln in decomposed Unicode (NFD)", () => {
  const nfdQuery = "Urologie nahe " + "Köln".normalize("NFD");
  const res = engine.processQuery(nfdQuery);
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "duesseldorf-golzheim");
});

runTest("TypeSafety_Unicode", "Correctly matches NFD inflected medical term (Orthopädie in NFD)", () => {
  const nfdQuery = "Klinik für " + "Orthopädie".normalize("NFD");
  const res = engine.processQuery(nfdQuery);
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "bremen");
});

// =============================================================================
// 16. SECURITY & URL HARDENING
// =============================================================================
runTest("Security_Hardened", "buildMarketingUrl rejects dangerous protocols (javascript:, data:, vbscript:)", () => {
  assert.strictEqual(buildMarketingUrl("javascript:alert(1)", "kassel", "test"), "#");
  assert.strictEqual(buildMarketingUrl("data:text/html,<script>alert(1)</script>", "kassel", "test"), "#");
  assert.strictEqual(buildMarketingUrl("vbscript:msgbox(1)", "kassel", "test"), "#");
});

runTest("Security_Hardened", "buildMarketingUrl rejects protocol-relative URLs and falls back safely", () => {
  const res = buildMarketingUrl("//evil.com/phishing", "kassel", "test");
  assert(!res.startsWith("//evil.com"), "Must not allow protocol-relative phishing URLs");
});

runTest("Security_Hardened", "buildMarketingUrl performs single parameter encoding without double encoding (%2520)", () => {
  const res = buildMarketingUrl("https://www.paracelsus-kliniken.de/bremen/", "bremen", "Knie & Hüfte");
  assert(res.includes("utm_content=Knie+%26+H%C3%BCfte") || res.includes("utm_content=Knie%20%26%20H%C3%BCfte"));
  assert(!res.includes("%25"), "Double URL encoding detected");
});

runTest("Security_Hardened", "buildMarketingUrl handles null, undefined, or empty baseUrl gracefully", () => {
  assert.strictEqual(buildMarketingUrl(null, "bremen", "test"), "#");
  assert.strictEqual(buildMarketingUrl("", "bremen", "test"), "#");
});

runTest("Security_Hardened", "createCalendarEventContent handles null and undefined clinic inputs safely", () => {
  assert.strictEqual(createCalendarEventContent(null), null);
  assert.strictEqual(createCalendarEventContent(undefined), null);
});

// =============================================================================
// 17. CLINICAL NLP TRIAGE & LEMMATIZATION
// =============================================================================
runTest("Clinical_NLP", "Greeting de-hijacking: 'Hallo ich suche Parkinson in Kassel' routes to Kassel-Elena", () => {
  const res = engine.processQuery("Hallo ich suche Parkinson in Kassel");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "kassel-elena");
});

runTest("Clinical_NLP", "Greeting de-hijacking: 'Guten Tag, wo finde ich die Urologie in Düsseldorf?' routes to Düsseldorf-Golzheim", () => {
  const res = engine.processQuery("Guten Tag, wo finde ich die Urologie in Düsseldorf?");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "duesseldorf-golzheim");
});

runTest("Clinical_NLP", "Pure greetings remain info intent (Hallo, Guten Tag, Moin Moin)", () => {
  const res1 = engine.processQuery("Hallo guten Tag");
  assert.strictEqual(res1.type, "info");
  assert(res1.title.includes("Willkommen"));
  const res2 = engine.processQuery("Moin Moin");
  assert.strictEqual(res2.type, "info");
});

runTest("Clinical_NLP", "Lemmatizes 'neurologische' to Neurologie (Kassel-Elena)", () => {
  const res = engine.processQuery("Ich suche eine neurologische Fachabteilung");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "kassel-elena");
});

runTest("Clinical_NLP", "Lemmatizes 'orthopädische' to Orthopädie (Bremen)", () => {
  const res = engine.processQuery("Ich suche eine orthopädische Fachabteilung");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "bremen");
});

runTest("Clinical_NLP", "Lemmatizes 'urologische' to Urologie (Düsseldorf-Golzheim)", () => {
  const res = engine.processQuery("Ich suche eine urologische Fachabteilung");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "duesseldorf-golzheim");
});

runTest("Clinical_NLP", "Lemmatizes 'chirurgische' to Chirurgie (Schöneck / Henstedt-Ulzburg)", () => {
  const res = engine.processQuery("Ich suche eine chirurgische Fachabteilung");
  assert.strictEqual(res.type, "match");
  assert(["schoeneck", "henstedt-ulzburg"].includes(res.clinic.id));
});

runTest("Clinical_NLP", "Lemmatizes 'internistische' to Innere Medizin (Langenhagen-Silbersee / Schöneck)", () => {
  const res = engine.processQuery("internistische Rheumatologie");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "langenhagen-silbersee");
});

runTest("Clinical_NLP", "Short keywords require word boundaries (Darmstadt != Henstedt, Teppich != Bremen, hoffe != Schöneck)", () => {
  assert(engine.processQuery("Ich wohne in Darmstadt").clinic?.id !== "henstedt-ulzburg", "Darmstadt false match");
  assert(engine.processQuery("Ich bin auf dem Teppich gestolpert").clinic?.id !== "bremen", "Teppich false match");
  assert(engine.processQuery("Ich hoffe auf baldige Genesung").clinic?.id !== "schoeneck", "hoffe false match");
});

runTest("Clinical_NLP", "Reha disambiguation: 'Orthopädische Reha' matches Bremen directly without infinite loop", () => {
  const res = engine.processQuery("Orthopädische Reha");
  assert.strictEqual(res.type, "match");
  assert.strictEqual(res.clinic.id, "bremen");
});

// =============================================================================
// 18. REGULATORY NEUTRALITY & MDR COMPLIANCE (R2 Compliance)
// =============================================================================
runTest("Regulatory_MDR", "Zero occurrences of 'Chef', 'Chefarzt', 'Chefärztin', or 'Chefin' across all query outputs", () => {
  const testQueries = [
    "Wer ist der Chefarzt?",
    "Ich möchte den Chefarzt der Urologie sprechen",
    "Chefarztbehandlung Termin",
    "Gibt es eine Chefin?",
    "Termin beim Chef"
  ];

  for (const q of testQueries) {
    const res = engine.processQuery(q);
    const serialized = JSON.stringify(res).toLowerCase();
    assert(!serialized.includes("chefarzt"), `Contains 'chefarzt': ${q}`);
    assert(!serialized.includes("chefin"), `Contains 'chefin': ${q}`);
    assert(!serialized.includes("chefärztin"), `Contains 'chefärztin': ${q}`);
    assert(!serialized.includes("chefvisite"), `Contains 'chefvisite': ${q}`);
    assert(!serialized.includes("chefbehandlung"), `Contains 'chefbehandlung': ${q}`);
  }
});

runTest("Regulatory_MDR", "Chefarzt inquiry provides neutral guidance on interdisciplinary teams and elective accommodation", () => {
  const res = engine.processQuery("Chefarztbehandlung Termin");
  assert.strictEqual(res.type, "info");
  assert(res.title.includes("Fachärzteteams"));
  assert(res.message.includes("Wahlleistungen"));
  assert(res.message.includes("Fachärztinnen und Fachärzten"));
});

runTest("Regulatory_MDR", "MDR Lotsendienst secondary notice present across match, emergency, fallback, empty, and info responses", () => {
  const queries = ["Parkinson", "Herzinfarkt", "", "unbekanntes kauderwelsch xyz"];
  for (const q of queries) {
    const res = engine.processQuery(q);
    assert(res.secondaryNotice && res.secondaryNotice.includes("MDR-Hinweis"), `Missing secondaryNotice for '${q}'`);
  }
});

runTest("Regulatory_MDR", "Bot never formulates diagnostic statements, cure promises, or prescriptive treatments", () => {
  const claims = [
    "Habe ich einen Bandscheibenvorfall?",
    "Welche Krankheit habe ich?",
    "Können Sie mich heilen?",
    "Geben Sie mir ein Rezept für Schmerzmittel"
  ];
  for (const q of claims) {
    const res = engine.processQuery(q);
    const text = (res.message || "") + " " + (res.guidance || "");
    assert(!text.toLowerCase().includes("sie leiden an"), "Diagnostic statement detected");
    assert(!text.toLowerCase().includes("wir garantieren heilung"), "Curative promise detected");
    assert(!text.toLowerCase().includes("nehmen sie folgendes medikament"), "Prescriptive treatment detected");
  }
});

runTest("Regulatory_MDR", "Emergency triage parity: Acute respiratory distress and severe arterial bleeding trigger 112 emergency", () => {
  const resResp = engine.processQuery("Ich habe schwere Atemnot und ersticke");
  assert.strictEqual(resResp.type, "emergency");
  assert.strictEqual(resResp.emergencyCall, "112");

  const resBleed = engine.processQuery("Ich habe eine unstillbare spritzende Blutung am Bein");
  assert.strictEqual(resBleed.type, "emergency");
  assert.strictEqual(resBleed.emergencyCall, "112");
});

// =============================================================================
// 19. STORAGE & PROTOTYPE SAFETY
// =============================================================================
runTest("Storage_Safety", "Corrupted or empty storage schemas do not crash ParacelsusAnalyticsStore", () => {
  const store = new engine.analytics.constructor();
  store.data = {};
  assert.doesNotThrow(() => {
    store.recordQuery("test query", "match", "bremen", "Orthopädie", false, "de");
  });
  assert(store.data.totalQueries >= 1);
});

runTest("Storage_Safety", "Special keys ('toString', '__proto__', 'constructor') do not corrupt analytics counters", () => {
  const store = new engine.analytics.constructor();
  assert.doesNotThrow(() => {
    store.recordQuery("test", "match", "toString", "constructor", false, "de");
  });
  assert.notStrictEqual(typeof store.data.clinicRoutingCounts["toString"], "string");
});

runTest("Storage_Safety", "Content gaps in analytics do not retain unmasked PII snippets", () => {
  engine.processQuery("Ich heiße Dr. Heinrich Faust und suche eine Alchemie-Abteilung");
  const gaps = engine.analytics.data.contentGaps;
  for (const gap of gaps) {
    assert(!gap.includes("Heinrich Faust"), `Unmasked PII detected in contentGaps: ${gap}`);
  }
});

// =============================================================================
// 20. ADDITIONAL E2E NAVIGATION & CONTRACT VERIFICATION
// =============================================================================
runTest("E2E_Contracts", "Visiting hours query returns comprehensive standorteList for all clinics", () => {
  const res = engine.processQuery("Wann sind die Besuchszeiten?");
  assert.strictEqual(res.type, "visiting");
  assert(Array.isArray(res.standorteList));
  assert(res.standorteList.length >= 7);
  assert(res.standorteList.every(s => s.name && s.city && s.hours));
});

runTest("E2E_Contracts", "Career portal query returns marketing tracked link to karriere portal", () => {
  const res = engine.processQuery("Ich suche Stellenangebote als Pflegefachkraft");
  assert.strictEqual(res.type, "link");
  assert(res.links[0].url.includes("utm_source=paracelsus_wegweiser"));
  assert(res.links[0].url.includes("utm_campaign=routing_karriere"));
});

runTest("E2E_Contracts", "Zuweiser query provides dedicated direct doctor telephone and fax lines", () => {
  const res = engine.processQuery("Ich bin niedergelassener Arzt und möchte einen Patienten einweisen");
  assert.strictEqual(res.type, "zuweiser");
  assert(Array.isArray(res.zuweiserContacts));
  assert(res.zuweiserContacts.every(c => c.phone && c.fax && c.clinic));
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

/**
 * Paracelsus Kliniken — Digitaler Wegweiser & Clinical Triage Engine
 * Version: 4.0.0 (Enterprise Smart Intent Matching, Stopwords Filter & Clinical FAQ)
 * 
 * Compliance & Standards:
 * - MDR (EU 2017/745): Reines Orientierungs- und Navigationssystem (keine Diagnostik / Therapie)
 * - DSGVO Art. 9: Strikte Client-Side PII-Anonymisierung sensibler Gesundheitsdaten
 * - Gleichbehandlung: Keine Zweiklassengesellschaft, keine interne Hierarchie-Kommunikation
 */

// 1. Detaillierter Notfallkatalog (112 / Krisen-Hotlines)
const EMERGENCY_CATEGORIES = {
  CARDIOVASCULAR: {
    pattern: /herzinfarkt|brustschmerz[a-z]*|schmerzen?\s*(in\s*der\s*)?brust|engegefühl\s*brust|druck\s*auf\s*der\s*brust|(ausstrahl[a-z]*.*(arm|kiefer))|((arm|kiefer).*ausstrahl[a-z]*)|herzrasen\s*akut|heart\s*attack|chest\s*pain/i,
    title: "VERDACHT AUF HERZINFARKT / AKUTES KORONARSYNDROM",
    title_en: "SUSPECTED HEART ATTACK (ACUTE CORONARY SYNDROME)",
    title_tr: "KALP KRİZİ ŞÜPHESİ (ACİL DURUM)",
    title_uk: "ПІДОЗРА НА ІНФАРКТ МІОКАРДА",
    action: "Sofort Rettungsdienst 112 rufen!",
    action_en: "Call Emergency 112 immediately!",
    action_tr: "Derhal 112 Acil Servisi arayın!",
    action_uk: "Негайно викликайте швидку 112!",
    hotline: "112",
    guidance: "Oberkörper leicht erhöht lagern. Enge Kleidung lockern. Ruhe bewahren und auf das Eintreffen des Notarztes warten."
  },
  STROKE: {
    pattern: /schlaganfall|lähmung|halbseitig|herabhängend[a-z]*\s*mundwinkel|mundwinkel\s*hängt|sprachstörung|plötzlich\s*nicht\s*mehr\s*sprechen|sehstörung\s*plötzlich|stroke/i,
    title: "VERDACHT AUF SCHLAGANFALL (FAST-SYMPTOME)",
    title_en: "SUSPECTED STROKE (FAST SYMPTOMS)",
    title_tr: "İNME / FELÇ ŞÜPHESİ (FAST)",
    title_uk: "ПІДОЗРА НА ІНСУЛЬТ",
    action: "Sofort Notruf 112 wählen!",
    action_en: "Dial 112 immediately!",
    action_tr: "Derhal 112'yi arayın!",
    action_uk: "Негайно дзвоніть 112!",
    hotline: "112",
    guidance: "Jede Minute zählt (Time is Brain). Flach lagern, nicht essen oder trinken lassen. Den genauen Zeitpunkt des Symptombeginns notieren."
  },
  RESPIRATORY: {
    pattern: /keine\s*luft|schwere\s*atemnot|erstickungsgefühl|ersticke|erstickung|blau\s*anlaufen|cannot\s*breathe|shortness\s*of\s*breath/i,
    title: "AKUTE VITAL BEDROHLICHE ATEMNOT",
    title_en: "ACUTE SEVERE RESPIRATORY DISTRESS",
    title_tr: "CİDDİ NEFES DARLIĞI / BOĞULMA TEHLİKESİ",
    title_uk: "ГОСТРА ДИХАЛЬНА НЕДОСТАТНІСТЬ",
    action: "Unverzüglich Notruf 112 rufen!",
    action_en: "Call 112 immediately!",
    action_tr: "Derhal 112'yi arayın!",
    action_uk: "Терміново викликайте 112!",
    hotline: "112",
    guidance: "Fenster für Frischluft öffnen. Aufrechte Sitzhaltung einnehmen, Arme aufstützen (Kutschersitz)."
  },
  SEVERE_BLEEDING: {
    pattern: /starke\s*blutung|unstillbare\s*blutung|arterielle\s*blutung|blutverlust|spritzende\s*blutung|severe\s*bleeding|hemorrhage/i,
    title: "SCHWERE, AKUTE BLUTUNG",
    title_en: "SEVERE ACUTE BLEEDING",
    title_tr: "AĞIR KANAMA TEHLİKESİ",
    title_uk: "ГОСТРА СИЛЬНА КРОВОТЕЧА",
    action: "Sofort Notruf 112 wählen!",
    action_en: "Call Emergency 112 immediately!",
    action_tr: "Derhal 112 Acil Servisi arayın!",
    action_uk: "Негайно викликайте 112!",
    hotline: "112",
    guidance: "Druckverband anlegen. Betroffene Extremität wenn möglich hochlagern. Wunde mit sauberem Tuch fest abdrücken bis der Notarzt eintrifft."
  },
  SUICIDE_CRISIS: {
    pattern: /suizid|lebensmüde|selbstmord|nicht\s*mehr\s*leben|kann\s*nicht\s*mehr\s*weiter|suicide|depression\s*crisis/i,
    title: "AKUTE SEELISCHE KRISE / HILFE IN NOTLAGEN",
    title_en: "MENTAL HEALTH CRISIS & SUPPORT",
    title_tr: "PSİKOLOJİK KRİZ VE DESTEK HATTI",
    title_uk: "ПСИХОЛОГІЧНА КРИЗА ТА ПІДТРИМКА",
    action: "Telefonseelsorge rund um die Uhr erreichbar",
    action_en: "24/7 Crisis Hotline available",
    action_tr: "7/24 Kriz Destek Hattı",
    action_uk: "Цілодобова кризова лінія",
    hotline: "0800 111 0 111",
    altHotline: "112",
    guidance: "Sie sind nicht allein. Die Telefonseelsorge hilft kostenlos, anonym und 24/7 unter 0800 111 0 111 oder 0800 111 0 222. Bei unmittelbarer Lebensgefahr wählen Sie bitte die 112."
  },
  POISON: {
    pattern: /vergiftung|chemikalie\s*(getrunken|geschluckt)|reiniger\s*geschluckt|gift\s*geschluckt|poison/i,
    title: "VERDACHT AUF AKUTE VERGIFTUNG",
    title_en: "SUSPECTED ACUTE POISONING",
    title_tr: "ZEHİRLENME ŞÜPHESİ",
    title_uk: "ПІДОЗРА НА ОТРУЄННЯ",
    action: "Giftnotruf oder 112 kontaktieren",
    action_en: "Call Poison Control or 112",
    action_tr: "Zehir Danışma veya 112'yi arayın",
    action_uk: "Зателефонуйте до токсикологічного центру або 112",
    hotline: "030 19240",
    guidance: "Giftnotruf anrufen (Berlin: 030 19240, NRW/Bonn: 0228 19240, Göttingen: 0551 19240, München: 089 19240). Kein Erbrechen herbeiführen! Verpackung bereithalten."
  },
  ACUTE_ABDOMEN: {
    pattern: /brettharter\s*bauch|unerträgliche\s*bauchschmerzen|bauchdecke\s*hart/i,
    title: "VERDACHT AUF AKUTES ABDOMEN",
    title_en: "ACUTE ABDOMEN SUSPECTED",
    title_tr: "AKUT BATIN ŞÜPHESİ",
    title_uk: "ПІДОЗРА НА ГОСТРИЙ ЖИВІТ",
    action: "Sofort ärztliche Notfallversorgung / 112",
    action_en: "Immediate emergency hospital care / 112",
    action_tr: "Acil tıbbi müdahale / 112",
    action_uk: "Невідкладна медична допомога / 112",
    hotline: "112",
    guidance: "Keine Schmerzmittel oder Nahrung einnehmen. Unverzügliche Vorstellung in der Notaufnahme oder Rettungsdienst verständigen."
  }
};

// 2. Nicht angebotene Fachdisziplinen
const UNSUPPORTED_DISCIPLINES = [
  {
    pattern: /\bgeburt(?:en|shilfe|sklinik)?\b|\bentbindung(?:en|sklinik)?\b|\bkrei(?:ß|s)saal\b|\bschwanger(?:schaft)?\b|\bwehen\b|baby\s*bekommen|\bwöchnerin(?:nen)?\b|\bbirth\b|\bmaternity\b/i,
    name: "Geburtshilfe & Kreißsaal",
    alternative: "spezialisierte Geburtskliniken",
    hint: "An den Paracelsus-Standorten wird keine Entbindung vorgehalten."
  },
  {
    pattern: /kinderklinik|pädiatrie|kinderarzt|säugling|kleinkind|pediatric/i,
    name: "Kinder- und Jugendmedizin (Pädiatrie)",
    alternative: "eine Kinderklinik oder den kinderärztlichen Bereitschaftsdienst",
    hint: "Unsere Akutkliniken sind auf die Erwachsenenmedizin spezialisiert."
  },
  {
    pattern: /augenklinik|augenheilkunde|katarakt|grauer\s*star|netzhaut|ophthalmolog/i,
    name: "Augenheilkunde (Ophthalmologie)",
    alternative: "eine Fach-Augenklinik",
    hint: "Stationäre Augenoperationen gehören nicht zum Portfolio der Gruppe."
  },
  {
    pattern: /zahnklinik|kieferchirurgie|zahnimplantat|weisheitszähne|dentist/i,
    name: "Zahn- und Kieferchirurgie",
    alternative: "zahnärztliche Notdienste oder MKG-Kliniken",
    hint: "Hierfür wenden Sie sich bitte an niedergelassene Zahnärzte oder MKG-Zentren."
  },
  {
    pattern: /dermatologie|hautklinik|hautkrebs\s*screening|schuppenflechte|dermatolog/i,
    name: "Dermatologie & Hautklinik",
    alternative: "eine dermatologische Fachklinik",
    hint: "Dermatologische Betten werden an unseren Standorten nicht geführt."
  }
];

// 3. Strikte Deutsche Stoppwörter (verhindert Fehl-Matches wie "haben" -> "Hagen", "mein" -> "Peine")
const STOPWORDS = new Set([
  "ich", "du", "er", "sie", "es", "wir", "ihr", "mein", "meine", "meinen", "meinem", "meiner", "meines",
  "haben", "habe", "hast", "hat", "hatte", "hatten", "sein", "bin", "bist", "ist", "sind", "war", "waren",
  "werden", "wird", "wurde", "wurden", "können", "kann", "kannst", "könnt", "müssen", "muss", "musst",
  "sollen", "soll", "sollte", "wollen", "will", "willst", "dürfen", "darf", "bitte", "danke", "vielen",
  "hallo", "guten", "tag", "morgen", "abend", "servus", "moin", "hi", "hey",
  "wo", "wie", "was", "wann", "warum", "wer", "wohin", "woher", "welche", "welcher", "welches",
  "ein", "eine", "einer", "eines", "einem", "einen", "der", "die", "das", "den", "dem", "des",
  "und", "oder", "aber", "denn", "für", "mit", "nach", "von", "bei", "seit", "über", "unter", "vor", "zwischen",
  "sehr", "viel", "viele", "etwas", "schon", "noch", "auch", "immer", "wieder", "hier", "dort", "jetzt", "mal",
  "zimmer", "zimmern", "klinik", "kliniken", "krankenhaus", "hospital", "arzt", "ärzte", "doktor", "fragen",
  "hilfe", "suchen", "suche", "suchte", "beratung", "behandlung", "anfrage", "anliegen", "information",
  "gehe", "gehen", "geht", "ging", "komme", "kommen", "kommt", "kam"
]);

// 4. PII-Scrubber (Strikte Anonymisierung nach DSGVO Art. 9)
function scrubPII(text) {
  if (text === null || text === undefined) return "";
  let clean = typeof text === "string" ? text : (typeof text === "number" || typeof text === "boolean" ? String(text) : "");
  if (!clean) return "";
  clean = clean.normalize("NFC");

  // 1. Geburts- & Kalenderdaten (vor Telefonnummern matchen)
  // Deutsches Textdatum: 14. Juli 1985 / 14.Juli 1985
  clean = clean.replace(/\b\d{1,2}\.\s*(?:Januar|Februar|März|Maerz|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s*\d{2,4}\b/gi, "[DATUM ANONYMISIERT]");
  // ISO-Datum: 1985-07-14
  clean = clean.replace(/\b\d{4}-\d{2}-\d{2}\b/g, "[DATUM ANONYMISIERT]");
  // Slash-Datum: 14/07/1985
  clean = clean.replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, "[DATUM ANONYMISIERT]");
  // Punkt-Datum: 14.07.1985 (zwei Punkte erforderlich, um Dezimalwerte wie 4.5 ng/ml zu schützen)
  clean = clean.replace(/\b\d{1,2}\.\d{1,2}\.\d{2,4}\b/g, "[DATUM ANONYMISIERT]");

  // 2. Gesetzliche Krankenversichertennummer (1 Buchstabe + 9 Ziffern, auch mit Leerzeichen)
  clean = clean.replace(/\b[A-Za-z]\s*\d(?:\s*\d){8}\b/g, "[VERSICHERTEN-NR ANONYMISIERT]");

  // 3. E-Mail-Adressen
  clean = clean.replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, "[E-MAIL ANONYMISIERT]");

  // 4. Straßenadressen (deutsche Straßennamen mit Hausnummer)
  clean = clean.replace(/\b(?:am\s+[A-Za-zÄÖÜäöüßà-öø-ÿ]+|[A-Za-zÄÖÜäöüßà-öø-ÿ]+(?:-[A-Za-zÄÖÜäöüßà-öø-ÿ]+)*(?:-)?(?:straße|str\.|weg|gasse|platz|allee|ring|chaussee|damm|ufer|berg|hang|markt|steig|kamp|zeil|wall))\s+\d+[a-zA-Z]?(?:\s*-\s*\d+[a-zA-Z]?)?\b/gi, "[ADRESSE ANONYMISIERT]");

  // 5. Telefonnummern (5-stellige deutsche PLZ wie 40213 oder 01067 werden geschützt)
  const phonePattern = /(?:\+(?:[0-9][-.\s/()]*){6,15}[0-9]|\(?\b0[1-9][0-9]{1,4}\)?[-.\s/]+[0-9]{2,10}\b|\(?\b0[1-9][0-9]{1,4}\)?[-.\s/]*[0-9]{3,10}\b|\b[0-9]{6,12}\b)/g;
  clean = clean.replace(phonePattern, "[TELEFON ANONYMISIERT]");

  // 6. Personennamen (Titel, Anrede, Einführungsmuster, Doppelnamen)
  const piiStopWords = new Set([
    "und", "oder", "aber", "hat", "hatte", "habe", "haben", "ist", "sind", "war", "waren",
    "aus", "an", "am", "in", "im", "von", "vom", "mit", "bei", "nach", "seit", "zu", "zum", "zur", "für",
    "über", "unter", "vor", "zwischen", "durch",
    "der", "die", "das", "dem", "den", "des", "ein", "eine", "einer", "eines", "einem", "einen",
    "ich", "du", "er", "sie", "es", "wir", "ihr", "mich", "mir", "dich", "dir", "ihn", "ihm", "uns", "euch", "ihnen",
    "mein", "meine", "meinen", "meiner", "sein", "seine", "seinen", "seiner", "ihr", "ihre",
    "suche", "suchen", "sucht", "brauche", "brauchen", "braucht", "möchte", "will", "kann", "muss",
    "schmerzen", "beschwerden", "probleme", "hilfe", "behandlung", "klinik", "krankenhaus", "arzt", "überwiesen", "empfahl",
    "auf", "dem", "krank", "schwanger", "versichert", "gesetzlich", "privat", "nicht", "nur", "schon"
  ]);

  const nobleParticles = new Set(["von", "zu", "van", "de", "der", "den", "vom"]);
  const roleStopWords = new Set(["doktor", "arzt", "ärzte", "ärztin", "klinik", "krankenhaus"]);

  function cleanNameMatch(match, prefix, namePart) {
    const words = namePart.trim().split(/\s+/);
    const validNames = [];
    const restWords = [];
    let collecting = true;
    const hasExplicitPrefix = /\b(?:herr|frau|patient(?:in)?|dr|prof|priv\.-doz)\b/i.test(prefix);

    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const lower = w.toLowerCase();
      const isCapitalized = /^[A-ZÄÖÜÀ-ÖØ-ß]/.test(w);

      if (collecting) {
        // Adelspartikel ("von", "zu", "van", "de") in Nachnamen schützen, falls weiterer Name folgt
        if (validNames.length > 0 && nobleParticles.has(lower)) {
          let hasFollowingName = false;
          for (let j = i + 1; j < words.length; j++) {
            const nextLower = words[j].toLowerCase();
            if (/^[A-ZÄÖÜÀ-ÖØ-ß]/.test(words[j]) && !piiStopWords.has(nextLower)) {
              hasFollowingName = true;
              break;
            }
            if (!nobleParticles.has(nextLower) && nextLower !== "und") {
              break;
            }
          }
          if (hasFollowingName) {
            validNames.push(w);
            continue;
          }
        }

        if (!piiStopWords.has(lower)) {
          validNames.push(w);
        } else if (validNames.length === 0 && hasExplicitPrefix && isCapitalized && !roleStopWords.has(lower)) {
          // Kurze Namen, die mit Stoppwörtern kollidieren (z. B. "Frau An") nach explizitem Präfix akzeptieren
          validNames.push(w);
        } else {
          collecting = false;
          restWords.push(w);
        }
      } else {
        restWords.push(w);
      }
    }

    if (validNames.length > 0) {
      return "[NAME ANONYMISIERT]" + (restWords.length > 0 ? " " + restWords.join(" ") : "");
    }
    return match;
  }

  const titlePattern = "(?:(?:(?:prof(?:essor)?\\.?(?:\\s*dr\\.?)?|dr\\.?|doktor|priv\\.-doz\\.?|pd\\.?)(?:\\s*(?:med|dent|habil|h\\.\\s*c|rer\\.\\s*nat)\\.?)*\\s*)+)";
  const nameWord = "[a-zäöüßà-öø-ÿ]+(?:-[a-zäöüßà-öø-ÿ]+)*";
  const candidateNames = "\\b" + nameWord + "(?:\\s+" + nameWord + "){0,4}\\b";

  // A. Intro-Phrasen: "ich heiße", "mein name ist/lautet", "hier ist", "hier spricht", "patient(in):"
  clean = clean.replace(new RegExp("((?:ich\\s+heiße|ich\\s+bin|mein\\s+name\\s+(?:ist|lautet)|hier\\s+(?:ist|spricht)|patient(?:in)?(?::|\\s+ist:?)?)\\s+(?:" + titlePattern + ")?(?:(?:herr|frau)\\s+)?(?:" + titlePattern + ")?)(" + candidateNames + ")", "gi"), cleanNameMatch);

  // B. Anrede "Herr" / "Frau" mit Namen
  clean = clean.replace(new RegExp("((?:herr|frau)\\s+(?:" + titlePattern + ")?)(" + candidateNames + ")", "gi"), cleanNameMatch);

  // C. Freistehende akademische Titel: "Dr. Thomas Müller", "Prof. Dr. Schmidt", "Priv.-Doz. Dr. Schmidt"
  clean = clean.replace(new RegExp("(\\b" + titlePattern + ")(" + candidateNames + ")", "gi"), cleanNameMatch);

  // D. "Ich bin [Name]"
  clean = clean.replace(new RegExp("(\\bich\\s+bin\\s+)(" + candidateNames + ")", "gi"), cleanNameMatch);

  return clean;
}

// 5. UTM-Link-Generator
function buildMarketingUrl(baseUrl, clinicId, intent) {
  if (!baseUrl) return "#";
  try {
    let url;
    try {
      url = new URL(baseUrl);
    } catch (e) {
      url = new URL(baseUrl, "https://www.paracelsus-kliniken.de/");
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "#";
    }
    url.searchParams.set("utm_source", "paracelsus_wegweiser");
    url.searchParams.set("utm_medium", "chatbot");
    url.searchParams.set("utm_campaign", `routing_${clinicId || "general"}`);
    if (intent) {
      url.searchParams.set("utm_content", String(intent));
    }
    return url.toString();
  } catch (e) {
    return "#";
  }
}

// 6. Kalender-Export (.ics iCalendar Generator für das Smartphone)
function createCalendarEventContent(clinic) {
  if (!clinic) return null;
  const now = new Date();
  const start = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Morgen
  start.setHours(9, 0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 Stunde

  function formatDate(d) {
    return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  }

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Paracelsus Kliniken//Digitaler Wegweiser//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `SUMMARY:Paracelsus Klinik ${clinic.city} - Kontakt / Sprechstunde`,
    `DESCRIPTION:Klinik: ${clinic.name}\\nTelefon Sekretariat: ${clinic.phone}\\nAdresse: ${clinic.address || clinic.city}\\nWebsite: ${clinic.url}\\n\\nBitte mitbringen: Versichertenkarte, Einweisungsschein, Medikamentenplan.`,
    `LOCATION:${clinic.address || clinic.city}`,
    `DTSTART:${formatDate(start)}`,
    `DTEND:${formatDate(end)}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  return ics;
}

// 7. Metropolregionen- & Umland-Mapping (Exakte Wortgrenzen)
const REGION_MAPPING = {
  "duesseldorf-golzheim": [
    "köln", "cologne", "bonn", "dortmund", "essen", "duisburg", "bochum",
    "wuppertal", "krefeld", "mönchengladbach", "neuss", "solingen", "oberhausen",
    "mülheim", "hagen", "leverkusen", "niederrhein", "ruhrpott", "ruhrgebiet"
  ],
  "henstedt-ulzburg": [
    "hamburg", "norderstedt", "kaltenkirchen", "quickborn", "pinneberg",
    "elmshorn", "bad segeberg", "neumünster", "kiel", "lübeck", "ahrensburg",
    "wedel", "alstertal", "schleswig-holstein"
  ],
  "kassel-elena": [
    "göttingen", "fulda", "marburg", "paderborn", "nordhessen", "bad hersfeld",
    "baunatal", "eisenach", "waldeck", "fritzlar", "korbach"
  ],
  "bremen": [
    "oldenburg", "delmenhorst", "bremerhaven", "verden", "vegesack", "osterholz",
    "achim", "syke", "stuhr"
  ],
  "langenhagen-silbersee": [
    "hannover", "celle", "burgwedel", "wedemark", "garbsen", "wunstorf",
    "peine", "hildesheim"
  ],
  "schoeneck": [
    "plauen", "vogtland", "auerbach", "reichenbach", "oelsnitz", "klingenthal",
    "zwickau", "chemnitz", "hof"
  ],
  "muenchen": [
    "augsburg", "rosenheim", "starnberg", "dachau", "freising", "erding",
    "fürstenfeldbruck", "landshut", "oberbayern"
  ]
};

// 8. Sicheres Levenshtein & Fuzzy-Matching
function getLevenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function safeFuzzyMatch(queryWords, term) {
  if (!term || typeof term !== "string") return false;
  const cleanTerm = term.toLowerCase().trim();
  if (cleanTerm.length < 5) return false;

  for (const word of queryWords) {
    if (STOPWORDS.has(word)) continue;
    if (word.length < 5) continue;
    // Erster Buchstabe muss zwingend übereinstimmen (verhindert cross-topic Verwechslungen)
    if (word[0] !== cleanTerm[0]) continue;

    if (cleanTerm.length <= 7) {
      if (Math.abs(word.length - cleanTerm.length) <= 1 && getLevenshteinDistance(word, cleanTerm) <= 1) {
        return true;
      }
    } else {
      if (Math.abs(word.length - cleanTerm.length) <= 2 && getLevenshteinDistance(word, cleanTerm) <= 2) {
        return true;
      }
    }
  }
  return false;
}

function hasWordBoundary(text, word) {
  if (!text || !word) return false;
  const reg = new RegExp("(?:^|[^a-zäöüß])" + word.toLowerCase().trim() + "(?:[^a-zäöüß]|$)", "i");
  return reg.test(text);
}

function safeIncrement(obj, key) {
  if (!obj || typeof key !== "string" || key === "__proto__") return;
  const current = Object.prototype.hasOwnProperty.call(obj, key) ? Number(obj[key]) || 0 : 0;
  Object.defineProperty(obj, key, {
    value: current + 1,
    writable: true,
    enumerable: true,
    configurable: true
  });
}

// 9. DSGVO-konformer Analytics-Store mit dezentem Feedback
class ParacelsusAnalyticsStore {
  constructor() {
    this.storageKey = "paracelsus_analytics_v4";
    this.data = this.load();
  }

  load() {
    const defaults = {
      totalQueries: 0,
      emergencyAlerts: 0,
      intentCounts: Object.create(null),
      clinicRoutingCounts: Object.create(null),
      contentGaps: [],
      linkClicks: 0,
      calendarDownloads: 0,
      feedback: { ja: 0, maessig: 0, nein: 0 },
      voiceQueries: 0,
      zuweiserQueries: 0,
      languageCounts: { de: 0, en: 0, tr: 0, uk: 0 }
    };
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          return Object.assign({}, defaults, parsed, {
            clinicRoutingCounts: Object.assign(Object.create(null), defaults.clinicRoutingCounts, parsed.clinicRoutingCounts),
            intentCounts: Object.assign(Object.create(null), defaults.intentCounts, parsed.intentCounts),
            contentGaps: Array.isArray(parsed.contentGaps) ? parsed.contentGaps : [],
            feedback: Object.assign({}, defaults.feedback, parsed.feedback),
            languageCounts: Object.assign(Object.create(null), defaults.languageCounts, parsed.languageCounts)
          });
        }
      }
    } catch (e) {}
    return defaults;
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {}
  }

  recordQuery(anonymizedQuery, resultType, clinicId, category, isVoice = false, lang = "de") {
    if (!this.data || typeof this.data !== "object") {
      this.data = this.load();
    }
    this.data.totalQueries = (Number(this.data.totalQueries) || 0) + 1;
    if (isVoice) this.data.voiceQueries = (Number(this.data.voiceQueries) || 0) + 1;

    this.data.languageCounts = this.data.languageCounts || {};
    safeIncrement(this.data.languageCounts, lang);

    if (resultType === "emergency") {
      this.data.emergencyAlerts = (Number(this.data.emergencyAlerts) || 0) + 1;
    }
    if (clinicId) {
      this.data.clinicRoutingCounts = this.data.clinicRoutingCounts || {};
      safeIncrement(this.data.clinicRoutingCounts, clinicId);
    }
    if (category) {
      this.data.intentCounts = this.data.intentCounts || {};
      safeIncrement(this.data.intentCounts, category);
    }
    if (category === "Zuweiser & Ärzte") {
      this.data.zuweiserQueries = (Number(this.data.zuweiserQueries) || 0) + 1;
    }
    if (resultType === "fallback") {
      this.data.contentGaps = Array.isArray(this.data.contentGaps) ? this.data.contentGaps : [];
      let scrubbedSnippet = scrubPII(anonymizedQuery || "").substring(0, 50).trim();
      // Mask any residual standalone 2-3 word capitalized person names in fallback queries
      scrubbedSnippet = scrubbedSnippet.replace(/\b[A-ZÄÖÜÀ-ÖØ-ß][a-zäöüßà-öø-ÿ]+(?:\s+[A-ZÄÖÜÀ-ÖØ-ß][a-zäöüßà-öø-ÿ]+){1,2}\b/g, () => "[NAME ANONYMISIERT]");
      if (scrubbedSnippet && !this.data.contentGaps.includes(scrubbedSnippet)) {
        this.data.contentGaps.push(scrubbedSnippet);
        if (this.data.contentGaps.length > 30) this.data.contentGaps.shift();
      }
    }
    this.save();
  }

  recordFeedback(rating) {
    if (!this.data || typeof this.data !== "object") this.data = this.load();
    this.data.feedback = this.data.feedback || { ja: 0, maessig: 0, nein: 0 };
    if (["ja", "maessig", "nein"].includes(rating)) {
      this.data.feedback[rating] = (Number(this.data.feedback[rating]) || 0) + 1;
      this.save();
    }
  }

  recordCalendarDownload() {
    if (!this.data || typeof this.data !== "object") this.data = this.load();
    this.data.calendarDownloads = (Number(this.data.calendarDownloads) || 0) + 1;
    this.save();
  }

  recordClick(type, label) {
    if (!this.data || typeof this.data !== "object") this.data = this.load();
    this.data.linkClicks = (Number(this.data.linkClicks) || 0) + 1;
    this.save();
  }

  getMetrics() {
    return this.data;
  }

  reset() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (e) {}
    this.data = this.load();
  }
}

// 10. Haupt-Bot-Engine
class ParacelsusBotEngine {
  constructor(standorteData) {
    this.standorte = standorteData || [];
    this.analytics = new ParacelsusAnalyticsStore();
    this.currentLanguage = "de";
  }

  setLanguage(lang) {
    this.currentLanguage = ["de", "en", "tr", "uk"].includes(lang) ? lang : "de";
  }

  processQuery(rawUserInput, isVoice = false) {
    if (rawUserInput === null || rawUserInput === undefined) {
      rawUserInput = "";
    } else if (typeof rawUserInput !== "string") {
      rawUserInput = (typeof rawUserInput === "number" || typeof rawUserInput === "boolean") ? String(rawUserInput) : "";
    }
    rawUserInput = rawUserInput.normalize("NFC");
    const scrubbedInput = scrubPII(rawUserInput);
    let query = scrubbedInput.trim().toLowerCase();
    const lang = this.currentLanguage;

    // Mehrsprachige & kyrillische Normalisierung
    query = query
      .replace(/паркінсон[а-я]*/gi, "parkinson")
      .replace(/уролог[а-я]*/gi, "urologie")
      .replace(/ортопед[а-я]*/gi, "orthopädie")
      .replace(/хірург[а-я]*/gi, "chirurgie")
      .replace(/лікарн[а-я]*|клінік[а-я]*/gi, "klinik")
      .replace(/лікуван[а-я]*/gi, "behandlung");

    // German medical adjective lemmatization (inflected adjective -> root noun)
    query = query
      .replace(/\bneurologisch(?:e[rsmn]?|em)?\b/gi, "neurologie")
      .replace(/\borthopädisch(?:e[rsmn]?|em)?\b/gi, "orthopädie")
      .replace(/\burologisch(?:e[rsmn]?|em)?\b/gi, "urologie")
      .replace(/\bchirurgisch(?:e[rsmn]?|em)?\b/gi, "chirurgie")
      .replace(/\bonkologisch(?:e[rsmn]?|em)?\b/gi, "onkologie")
      .replace(/\bkardiologisch(?:e[rsmn]?|em)?\b/gi, "kardiologie")
      .replace(/\bpsychiatrisch(?:e[rsmn]?|em)?\b/gi, "psychiatrie")
      .replace(/\bpsychosomatisch(?:e[rsmn]?|em)?\b/gi, "psychosomatik")
      .replace(/\brheumatologisch(?:e[rsmn]?|em)?\b/gi, "rheumatologie")
      .replace(/\binternistisch(?:e[rsmn]?|em)?\b/gi, "innere medizin");

    if (!query) {
      const emptyMsg = {
        de: "Wie dürfen wir Ihnen helfen? Nennen Sie uns gerne Ihre Beschwerde, einen Fachbereich oder eine Stadt.",
        en: "How can we assist you? Please mention your symptom, medical specialty, or preferred city.",
        tr: "Size nasıl yardımcı olabiliriz? Lütfen şikayetinizi, uzmanlık alanını veya tercih ettiğiniz şehri belirtin.",
        uk: "Чим ми можемо вам допомогти? Вкажіть ваші симптоми, медичний напрямок або місто."
      };
      return {
        type: "empty",
        message: emptyMsg[lang] || emptyMsg.de,
        secondaryNotice: "MDR-Hinweis: Dieser digitale Wegweiser führt keine medizinische Notfallbehandlung oder Diagnostik durch."
      };
    }

    // Wenn ein Höflichkeitspräfix am Anfang steht (z.B. "Hallo ich suche..."), abstreifen für nachfolgende Triage
    // Aber reine Begrüßungen (z.B. "Hallo", "Hallo guten Tag", "Moin") als Begrüßungs-Intent erhalten
    const pureGreetingPattern = /^(?:hallo|hi|hey|guten\s*(?:tag|morgen|abend)|moin(?:\s+moin)?|servus|grüß\s*gott|wer\s*bist\s*du|was\s*kannst\s*du|\s+)+[.!?]*$/i;
    const isPureGreeting = pureGreetingPattern.test(query.replace(/[^a-zäöüß\s]/gi, "").trim()) || /^(?:wer\s*bist\s*du|was\s*kannst\s*du)\b/i.test(query);

    const greetingPrefixPattern = /^(?:hallo|hi|hey|guten\s*(?:tag|morgen|abend)|moin(?:\s+moin)?|servus|grüß\s*gott)[,!\s]+/i;
    if (!isPureGreeting && greetingPrefixPattern.test(query)) {
      query = query.replace(greetingPrefixPattern, "").trim();
    }

    const queryWords = query.split(/[\s,.\-?!;:]+/).filter(w => w.length > 0);

    // =========================================================================
    // 1. NOTFALL-PRÜFUNG (Höchste Priorität: 112 / Krisennotruf)
    // =========================================================================
    for (const [key, em] of Object.entries(EMERGENCY_CATEGORIES)) {
      if (em.pattern.test(query)) {
        this.analytics.recordQuery(scrubbedInput, "emergency", null, `Notfall: ${key}`, isVoice, lang);
        
        let title = em.title;
        let action = em.action;
        if (lang === "en") { title = em.title_en || em.title; action = em.action_en || em.action; }
        else if (lang === "tr") { title = em.title_tr || em.title; action = em.action_tr || em.action; }
        else if (lang === "uk") { title = em.title_uk || em.title; action = em.action_uk || em.action; }

        return {
          type: "emergency",
          isEmergency: true,
          alertTitle: title,
          message: action,
          guidance: em.guidance,
          emergencyCall: em.hotline,
          altCall: em.altHotline,
          actionText: `Notruf ${em.hotline} wählen`,
          secondaryNotice: "MDR-Hinweis: Dieser digitale Wegweiser führt keine medizinische Notfallbehandlung oder Diagnostik durch."
        };
      }
    }

    // =========================================================================
    // 2. NICHT ANGEBOTENE DISZIPLINEN (Verweis auf 116 117)
    // =========================================================================
    for (const un of UNSUPPORTED_DISCIPLINES) {
      if (un.pattern.test(query)) {
        this.analytics.recordQuery(scrubbedInput, "unsupported", null, `Nicht angeboten: ${un.name}`, isVoice, lang);
        return {
          type: "unsupported",
          title: `Fachdisziplin: ${un.name}`,
          message: un.hint,
          recommendation: `Für ${un.alternative} sowie bei akuten Fragen außerhalb der Praxiszeiten wenden Sie sich bitte an den bundesweiten Bereitschaftsdienst:`,
          hotline: "116 117",
          chips: ["Urologie & Prostata", "Parkinson & Neurologie", "Orthopädie & Gelenke", "Alle Standorte"],
          secondaryNotice: "MDR-Hinweis: Dieser digitale Wegweiser führt keine medizinische Notfallbehandlung oder Diagnostik durch."
        };
      }
    }

    // =========================================================================
    // 3. SMARTE FAQ & KONVERSATIONELLE ANTWORTEN
    // =========================================================================

    // A. Begrüßung & Smalltalk
    if (isPureGreeting) {
      this.analytics.recordQuery(scrubbedInput, "info", null, "Begrüßung", isVoice, lang);
      return {
        type: "info",
        title: "Willkommen beim Paracelsus Klinik-Wegweiser",
        message: "Guten Tag! Ich bin der digitale Orientierungsdienst der Paracelsus Kliniken. Ich helfe Ihnen dabei, schnell und unkompliziert den richtigen Fachbereich, das passende Spezialzentrum oder den richtigen Ansprechpartner zu finden.<br><br><strong>Wobei kann ich Ihnen heute behilflich sein?</strong>",
        chips: [
          "Parkinson & Neurologie (Kassel)",
          "Urologie & Prostata (Düsseldorf)",
          "Orthopädie & Wirbelsäule (Bremen)",
          "Notaufnahme & Chirurgie (Henstedt-Ulzburg)",
          "Rheuma & Schmerztherapie (Langenhagen)",
          "Koffer-Packliste",
          "Überweisung & Termine"
        ],
        secondaryNotice: "MDR-Hinweis: Dieser digitale Wegweiser führt keine medizinische Notfallbehandlung oder Diagnostik durch."
      };
    }

    // B. Danksagung & Verabschiedung
    if (/^(danke|vielen\s*dank|dankeschön|super\s*danke|klasse\s*danke|tschüss|auf\s*wiedersehen|schönen\s*tag|ade)\b/i.test(query)) {
      this.analytics.recordQuery(scrubbedInput, "info", null, "Danksagung", isVoice, lang);
      return {
        type: "info",
        title: "Sehr gerne!",
        message: "Ich wünsche Ihnen und Ihren Angehörigen alles Gute und eine rasche Genesung. Sollten Sie weitere Fragen zur Vorbereitung, Anfahrt oder Terminvereinbarung haben, bin ich jederzeit für Sie da.",
        chips: ["Koffer-Packliste", "Standorte anzeigen", "Neue Frage stellen"]
      };
    }

    // C. Kosten, Zuzahlung & Krankenkasse (§ 39 SGB V)
    if (/\b(kosten|zuzahlung|eigenanteil|selbstzahler|was\s*kostet|krankenkasse|kasse\s*übernimmt|gesetzlich\s*versichert|behandlungskosten)\b/i.test(query)) {
      this.analytics.recordQuery(scrubbedInput, "info", null, "Kosten & Zuzahlung", isVoice, lang);
      return {
        type: "info",
        title: "Kostenübernahme & Gesetzliche Zuzahlung",
        message: "Die Kosten eines medizinisch notwendigen Krankenhausaufenthalts werden von den gesetzlichen und privaten Krankenkassen übernommen.<br><br>" +
          "• **Gesetzliche Zuzahlung (§ 39 Abs. 4 SGB V):** Volljährige gesetzlich Versicherte zahlen **10 € pro Kalendertag** (für maximal 28 Tage im Kalenderjahr). Kinder/Jugendliche unter 18 Jahren und befreite Patienten sind zuzahlungsfrei.<br>" +
          "• **Wahlleistungen:** Komfortleistungen wie ein Einzelzimmer können über eine private Zusatzversicherung oder als Selbstzahler gebucht werden.<br>" +
          "• **Zahlung vor Ort:** Zuzahlungen können bequem per EC-Karte, Kreditkarte oder bar beglichen werden.",
        chips: ["Einzelzimmer / Wahlleistung", "Aufnahme-Checkliste", "Standorte anzeigen"]
      };
    }

    // D. Wahlleistung, Einzelzimmer & Begleitperson (Rooming-in)
    if (/\b(einzelzimmer|zweibettzimmer|wahlleistung|zusatzversicherung|privatpatient|unterbringung|begleitperson|rooming|partner.*übernacht[a-z]*|angehörige.*übernacht[a-z]*)\b/i.test(query)) {
      this.analytics.recordQuery(scrubbedInput, "info", null, "Wahlleistung & Begleitperson", isVoice, lang);
      return {
        type: "info",
        title: "Unterbringung, Komfort & Begleitpersonen",
        message: "An unseren Klinikstandorten stehen Ihnen verschiedene Optionen zur Verfügung:<br><br>" +
          "• **Einzel- & Zweibettzimmer:** Komfortzimmer können je nach Verfügbarkeit gebucht werden (Abrechnung über private Zusatzversicherung oder als Selbstzahlerleistung).<br>" +
          "• **Begleitperson (Rooming-in):** Die Mitaufnahme einer Begleitperson ist nach vorheriger Absprache mit der jeweiligen Klinik möglich. Bei medizinischer Notwendigkeit übernimmt die Kasse die Kosten, andernfalls erfolgt die Abrechnung als Wahlleistung.<br>" +
          "• **Gleichbehandlung:** Die medizinische und pflegerische Spitzenversorgung ist für alle Patientinnen und Patienten auf demselben hohen Qualitätsniveau gesichert.",
        chips: ["Kosten & Zuzahlung", "Aufnahme-Checkliste", "Besuchszeiten"],
        secondaryNotice: "MDR-Hinweis: Dieser digitale Wegweiser führt keine medizinische Notfallbehandlung oder Diagnostik durch."
      };
    }

    // D2. Neutrale medizinische Betreuung & Fachärzteteams ("Chefarzt / Chefarztbehandlung")
    if (/\b(chefarzt[a-z]*|chefärzt[a-z]*|chefin|chefvisite|chefbehandlung|chefarztbehandlung|beim\s*chef)\b/i.test(query)) {
      this.analytics.recordQuery(scrubbedInput, "info", null, "Medizinische Betreuung", isVoice, lang);
      return {
        type: "info",
        title: "Medizinische Versorgung durch Fachärzteteams",
        message: "In den Paracelsus Kliniken erfolgt die medizinische Spitzenversorgung partnerschaftlich durch hochqualifizierte, interdisziplinäre Fachärzteteams auf einheitlich hohem Qualitätsniveau. Alle Patientinnen und Patienten erhalten die bestmögliche leitliniengerechte Diagnostik und Therapie durch Spezialisten des jeweiligen Fachbereichs.<br><br>" +
          "• **Fachärztliche Betreuung:** Alle Behandlungen und Operationen werden von qualifizierten Fachärztinnen und Fachärzten geleitet.<br>" +
          "• **Wahlleistungen & Komfort:** Zusätzliche Komfortleistungen wie eine Unterbringung im Einzelzimmer können über Wahlleistungsvereinbarungen in Anspruch genommen werden.",
        chips: ["Wahlleistung & Komfort", "Fachabteilungen anzeigen", "Termin vereinbaren"],
        secondaryNotice: "MDR-Hinweis: Dieser digitale Wegweiser führt keine medizinische Notfallbehandlung oder Diagnostik durch."
      };
    }

    // E. Überweisung vs. Einweisung (Patienten-Aufklärung)
    if (/\b(brauche\s*ich\s*eine\s*überweisung|muss\s*ich\s*zum\s*hausarzt|überweisung\s*oder\s*einweisung|einweisungsschein\s*(nötig|brauche)|brauche\s*ich\s*einen\s*schein)\b/i.test(query)) {
      this.analytics.recordQuery(scrubbedInput, "info", null, "Patienten-Überweisung", isVoice, lang);
      return {
        type: "info",
        title: "Benötige ich eine Überweisung oder Einweisung?",
        message: "Je nach Art Ihrer Vorstellung benötigen Sie unterschiedliche Unterlagen:<br><br>" +
          "• **Ambulante Sprechstunde:** Für fachärztliche Sprechstunden in den Ambulanzen benötigen Sie eine **Überweisung** Ihres Haus- oder Facharztes.<br>" +
          "• **Geplante stationäre Aufnahme:** Für einen stationären Klinikaufenthalt ist ein **Krankenhaus-Einweisungsschein (Muster 2)** erforderlich.<br>" +
          "• **Akute Notaufnahme (Henstedt-Ulzburg 24/7):** Im Notfall ist **keine Überweisung erforderlich**. Sie können sich jederzeit direkt vorstellen.<br>" +
          "• **Privatversicherte:** Benötigen formell keine Einweisung, eine ärztliche Indikation erleichtert jedoch die Abrechnung.",
        chips: ["Koffer-Packliste", "Termin vereinbaren", "Notaufnahme 24/7"]
      };
    }

    // F. Zuweiser & Ärzte-Portal (Exklusiv für einweisende Kolleginnen & Kollegen)
    if (/zuweiser|arztportal|(fach)?ärztliche\s*einweisung|urolog(?:ische|ie)\s*einweisung|kollegialer\s*kontakt|befundübermittlung|patient[a-z]*\s*einweisen|patient[a-z]*\s*überweisen|niedergelassene[a-z]*|einweisend[a-z]*/i.test(query)) {
      this.analytics.recordQuery(scrubbedInput, "info", null, "Zuweiser & Ärzte", isVoice, lang);
      return {
        type: "zuweiser",
        title: "Informationen für einweisende Kolleginnen & Kollegen",
        message: "Für eine schnelle, unbürokratische Patientenübernahme stehen Ihnen die Fachabteilungen und das zentrale Belegungsmanagement zur Verfügung:",
        zuweiserContacts: [
          { clinic: "Paracelsus Klinik Golzheim Düsseldorf (Urologie)", phone: "+49 211 4385-200", fax: "+49 211 4385-209", note: "Zertifiziertes Prostatakrebszentrum / Robotik" },
          { clinic: "Paracelsus-Elena-Klinik Kassel (Neurologie)", phone: "+49 561 6009-120", fax: "+49 561 6009-129", note: "Parkinson-Komplex & Differentialdiagnostik" },
          { clinic: "Paracelsus Klinik Bremen (Orthopädie/Wirbelsäule)", phone: "+49 421 4683-150", fax: "+49 421 4683-159", note: "Endoprothetik & Schmerztherapie" },
          { clinic: "Paracelsus Klinik Henstedt-Ulzburg (ZNA & Chirurgie)", phone: "+49 4193 70-210", fax: "+49 4193 70-219", note: "24/7 Notaufnahme & Viszeralchirurgie" }
        ],
        chips: ["Zuweiser-Faxnummern", "Notaufnahme 24/7", "Standorte anzeigen"]
      };
    }

    // G. WLAN, Telefon & Zimmerausstattung
    if (/\b(wlan|wifi|internet|fernseh[a-z]*|tv|telefon\s*(auf|im)\s*zimmer|ausstattung\s*zimmer)\b/i.test(query)) {
      this.analytics.recordQuery(scrubbedInput, "info", null, "WLAN & Zimmerausstattung", isVoice, lang);
      return {
        type: "info",
        title: "WLAN, Telefon & Zimmerausstattung",
        message: "Wir möchten Ihren Aufenthalt so angenehm wie möglich gestalten:<br><br>" +
          "• **Kostenloses WLAN:** An allen Paracelsus-Standorten steht Patientinnen und Patienten freies Internet über unser Patienten-WLAN zur Verfügung.<br>" +
          "• **Fernsehen & Radio:** Moderne TV-Geräte sind in den Patientenzimmern vorhanden und können kostenfrei genutzt werden.<br>" +
          "• **Telefon:** Auf Wunsch kann am Nachttisch ein persönlicher Telefonanschluss freigeschaltet werden (gegen geringe Grundgebühr).",
        chips: ["Koffer-Packliste", "Besuchszeiten", "Standorte anzeigen"]
      };
    }

    // H. Ablauf der stationären Aufnahme
    if (/\b(ablauf\s*aufnahme|wie\s*läuft\s*die\s*aufnahme|am\s*ersten\s*tag|stationär\s*aufnahme\s*ablauf)\b/i.test(query)) {
      this.analytics.recordQuery(scrubbedInput, "info", null, "Ablauf Aufnahme", isVoice, lang);
      return {
        type: "info",
        title: "Ablauf Ihres stationären Aufnahmetags",
        message: "So läuft der erste Tag im Krankenhaus Schritt für Schritt ab:<br><br>" +
          "1. **Anmeldung am Patientenempfang:** Sie melden sich am zentralen Empfang mit Ihrer Versichertenkarte und dem Einweisungsschein an.<br>" +
          "2. **Aufnahme auf der Station:** Das Pflegeteam empfängt Sie, zeigt Ihnen Ihr Zimmer und bespricht den Tagesablauf.<br>" +
          "3. **Ärztliches Aufnahmegespräch:** Erhebung Ihrer Krankengeschichte, Sichtung von Vorbefunden und Medikamenten sowie Erläuterung der Behandlung.<br>" +
          "4. **Voruntersuchungen:** Je nach Eingriff finden Labor, EKG oder Röntgen-/Ultraschalluntersuchungen statt.",
        chips: ["Koffer-Packliste", "Benötigte Unterlagen", "Standorte anzeigen"]
      };
    }

    // I. Zweitmeinung vor geplanten Eingriffen
    if (/\b(zweitmeinung|zweite\s*meinung|unsicher\s*ob\s*op|vor\s*einer\s*op|soll\s*ich\s*operieren)\b/i.test(query)) {
      this.analytics.recordQuery(scrubbedInput, "info", null, "Zweitmeinung", isVoice, lang);
      return {
        type: "info",
        title: "Ärztliche Zweitmeinung bei Paracelsus",
        message: "Vor planbaren Eingriffen (insbesondere bei Gelenkersatz an Knie/Hüfte, Wirbelsäulenoperationen oder Prostata-Eingriffen) haben Sie als Patient das Recht auf eine unabhängige ärztliche Zweitmeinung.<br><br>" +
          "• Unsere spezialisierten Fachärzteteams prüfen Ihre vorhandenen MRT-, CT- und Röntgenaufnahmen eingehend.<br>" +
          "• Wir beraten Sie transparent, ob konservative (nicht-operative) Behandlungsansätze möglich sind.<br>" +
          "• Bitte bringen Sie zu Ihrem Termin alle bisherigen Vorbefunde und Bildgebungs-CDs mit.",
        chips: ["Orthopädie Bremen", "Urologie Düsseldorf", "Termin vereinbaren"]
      };
    }

    // J. Zahlungsarten vor Ort
    if (/\b(kartenzahlung|ec-karte|kreditkarte|bar\s*zahlen|mit\s*karte\s*zahlen|bargeld)\b/i.test(query)) {
      this.analytics.recordQuery(scrubbedInput, "info", null, "Zahlungsmittel", isVoice, lang);
      return {
        type: "info",
        title: "Zahlungsmöglichkeiten an den Standorten",
        message: "Gesetzliche Eigenanteile, Wahlleistungsrechnungen oder Eigenbeteiligungen können an unseren Patientenaufnahmen und Kassen wie folgt beglichen werden:<br><br>" +
          "• **EC-Karte (Girocard):** Kontaktlos oder mit PIN möglich.<br>" +
          "• **Kreditkarten:** Gängige Kreditkarten (Visa, Mastercard) werden akzeptiert.<br>" +
          "• **Barzahlung:** Zu den regulären Kassenöffnungszeiten möglich.<br>" +
          "• **Rechnung:** Wahlleistungen können auf Wunsch auch per Überweisung beglichen werden.",
        chips: ["Kosten & Zuzahlung", "Aufnahme-Checkliste"]
      };
    }

    // K. Interaktive Koffer-Checkliste
    if (!/notaufnahme/i.test(query) && /koffer|packliste|was\s*mitbringen|unterlagen|stationäre\s*aufnahme|checkliste|was\s*brauche\s*ich|packing\s*list/i.test(query)) {
      this.analytics.recordQuery(scrubbedInput, "info", null, "Aufnahme-Checkliste", isVoice, lang);
      return {
        type: "checklist",
        title: "Interaktive Checkliste für Ihren Klinikaufenthalt",
        message: "Haken Sie die Dokumente und Dinge direkt auf Ihrem Bildschirm ab, um bestens vorbereitet zu sein:",
        checklistItems: [
          "Einweisungsschein Ihres behandelnden Fach- oder Hausarztes",
          "Elektronische Gesundheitskarte (Krankenkassenkarte)",
          "Aktueller bundeseinheitlicher Medikamentenplan",
          "Relevante Vorbefunde, Entlassungsbriefe & Röntgen-/MRT-CDs",
          "Bequeme Kleidung, Hausschuhe & persönliche Hygieneartikel",
          "Ggf. Allergiepass, Röntgenpass oder Patientenverfügung"
        ],
        chips: ["Termin vereinbaren", "Besuchszeiten", "Standorte anzeigen"]
      };
    }

    // L. Besuchszeiten, Anfahrt & Parken
    if (/besuchszeit[a-z]*|besuch[a-z]*|parken|parkplatz|anfahrt|öffnungszeit[a-z]*|visiting\s*hours/i.test(query)) {
      this.analytics.recordQuery(scrubbedInput, "info", null, "Besucher & Anreise", isVoice, lang);
      return {
        type: "visiting",
        title: "Besuchszeiten, Anfahrt & Parken",
        message: "Besuchszeiten und Parkmöglichkeiten richten sich nach der jeweiligen Fachklinik. Wählen Sie Ihren gewünschten Standort:",
        standorteList: this.standorte.map(s => ({
          name: s.name,
          city: s.city,
          hours: s.visitingHours,
          mapsUrl: s.mapsUrl,
          phone: s.phone
        })),
        chips: ["Düsseldorf Golzheim", "Kassel Elena-Klinik", "Bremen", "Henstedt-Ulzburg"]
      };
    }

    // M. Karriere & Ausbildung
    if (/karriere|job[a-z]*|stellenangebot[a-z]*|ausbildung|pflegefachkraft|krankenschwester|arztstelle|famulatur|pj|bewerbung|career/i.test(query)) {
      this.analytics.recordQuery(scrubbedInput, "link", "karriere", "Karriere & Recruiting", isVoice, lang);
      return {
        type: "link",
        title: "Karriere bei Paracelsus",
        message: "Werden Sie Teil unseres Teams! Wir bieten moderne Arbeitsplätze in der Medizin, Pflege, Therapie und Verwaltung:",
        links: [
          {
            label: "Zum Paracelsus Karriereportal (Alle offenen Stellen)",
            url: buildMarketingUrl("https://karriere.paracelsus-kliniken.de/", "karriere", "stellenanzeigen")
          }
        ],
        chips: ["Pflegejobs", "Ärztlicher Dienst", "Therapie & Reha", "Standorte anzeigen"]
      };
    }

    // =========================================================================
    // 4. KLINISCHES SCORING & FACHBEREICHS-MATCHING
    // =========================================================================
    const scoredClinics = this.standorte.map(clinic => {
      let score = 0;
      const matchedTerms = [];

      // A. Direkte Stadt-Erkennung (z.B. "Düsseldorf", "Bremen", "Kassel")
      if (hasWordBoundary(query, clinic.city)) {
        score += 15;
        matchedTerms.push(clinic.city);
      } else if (safeFuzzyMatch(queryWords, clinic.city)) {
        score += 10;
        matchedTerms.push(clinic.city);
      }

      // B. Metropolregionen- & Umland-Erkennung (Strikte Wortgrenzen, KEIN loses Fuzzy)
      const surroundingCities = REGION_MAPPING[clinic.id] || [];
      for (const city of surroundingCities) {
        if (hasWordBoundary(query, city)) {
          score += 11;
          matchedTerms.push(`${city.charAt(0).toUpperCase() + city.slice(1)} (Region ${clinic.city})`);
          break;
        }
      }

      // C. Bundesland-Match
      if (hasWordBoundary(query, clinic.state)) {
        score += 6;
      }

      // D. Keywords & Symptom-Match (mit safeFuzzyMatch für Tippfehler)
      clinic.keywords.forEach(keyword => {
        const kwLower = keyword.toLowerCase();
        const isMatch = (kwLower.length <= 4) ? hasWordBoundary(query, kwLower) : query.includes(kwLower);
        if (isMatch) {
          // Längere und spezifischere Fachbegriffe höher gewichten
          score += (kwLower.length > 8 || kwLower.includes(" ")) ? 10 : 7;
          matchedTerms.push(keyword);
        } else if (safeFuzzyMatch(queryWords, keyword)) {
          score += 5;
          matchedTerms.push(keyword);
        }
      });

      // E. Specialties-Match
      clinic.specialties.forEach(spec => {
        if (query.includes(spec.toLowerCase())) {
          score += 9;
          matchedTerms.push(spec);
        }
      });

      return { clinic, score, matchedTerms };
    });

    scoredClinics.sort((a, b) => b.score - a.score);
    const topMatches = scoredClinics.filter(m => m.score > 0);

    if (topMatches.length > 0) {
      const best = topMatches[0].clinic;
      const matchedTerms = topMatches[0].matchedTerms;

      const trackedClinic = {
        ...best,
        url: buildMarketingUrl(best.url, best.id, matchedTerms.slice(0, 3).join("_")),
        icsContent: createCalendarEventContent(best)
      };

      this.analytics.recordQuery(scrubbedInput, "match", best.id, best.type, isVoice, lang);

      // Intelligente, standort- und kontextbezogene Fachbereichsbeschreibung
      let contextExplanation = "";
      if (best.id === "kassel-elena") {
        contextExplanation = "Als eines der international führenden Referenzzentren für Parkinson und Bewegungsstörungen bietet die **Paracelsus-Elena-Klinik Kassel** eine hochspezialisierte neurologische Komplexbehandlung, modernste Differentialdiagnostik sowie Vor- und Nachsorge bei Tiefer Hirnstimulation (THS).";
      } else if (best.id === "duesseldorf-golzheim") {
        contextExplanation = "Die **Paracelsus Klinik Golzheim Düsseldorf** zählt zu den renommiertesten urologischen Fachkliniken Europas. Als zertifiziertes Prostatakarzinomzentrum (DKG) mit zwei DaVinci-Xi-OP-Robotern, MRT-Fusionsbiopsie und moderner Laser-Enukleation bietet sie Spitzenmedizin für schonende Eingriffe an Prostata, Blase und Nieren.";
      } else if (best.id === "bremen") {
        contextExplanation = "Mit dem zertifizierten Endoprothetikzentrum (EPZ Max) und einer renommierten Wirbelsäulenchirurgie / Neurochirurgie bietet das Team der **Paracelsus Klinik Bremen** sowohl schonende minimalinvasive Gelenkersatz-Verfahren (Hüft-/Knie-TEP) als auch gezielte Wirbelsäulen- und multimodale Schmerztherapien.";
      } else if (best.id === "henstedt-ulzburg") {
        contextExplanation = "Mit einer rund um die Uhr besetzten Zentralen Notaufnahme (ZNA 24/7) sowie spezialisierten Zentren für Bauch-, Hernien- und Allgemeinchirurgie sichert die **Paracelsus Klinik Henstedt-Ulzburg** eine verlässliche Akut- und Notfallversorgung im Norden von Hamburg.";
      } else if (best.id === "langenhagen-silbersee") {
        if (/sucht|alkohol|entgiftung|entzug|abhängig/i.test(query)) {
          contextExplanation = "Die **Paracelsus Klinik am Silbersee Langenhagen** bietet eine spezialisierte, qualifizierte Entzugsbehandlung und Suchtmedizin in einer geschützten, professionellen und wertschätzenden Umgebung.";
        } else {
          contextExplanation = "Die **Paracelsus Klinik am Silbersee Langenhagen** vereint hochspezialisierte Fachabteilungen für internistische Rheumatologie, multimodale Schmerztherapie und Gelenkchirurgie mit einem interdisziplinären Team aus Fachärzten und Therapeuten.";
        }
      } else if (best.id === "muenchen") {
        contextExplanation = "Die **Paracelsus Klinik München** in Bogenhausen ist auf hochspezialisierte orthopädische Chirurgie, Sporttraumatologie (Kreuzband, Meniskus, Schulter) und individuelle Belegarztbetreuung fokussiert.";
      } else if (best.id === "schoeneck") {
        contextExplanation = "Die **Paracelsus Klinik Schöneck** sichert als Akutkrankenhaus die Grund- und Regelversorgung im oberen Vogtland mit Notfallbehandlung, Innerer Medizin und chirurgischer Versorgung.";
      } else {
        contextExplanation = `Für Ihr Anliegen empfehlen wir das spezialisierte Ärzteteam der **${best.name}** in ${best.city}.`;
      }

      const titleMap = {
        de: `Empfohlene Fachklinik: ${best.name}`,
        en: `Recommended Hospital: ${best.name}`,
        tr: `Önerilen Uzmanlık Kliniği: ${best.name}`,
        uk: `Рекомендована клініка: ${best.name}`
      };

      return {
        type: "match",
        title: titleMap[lang] || titleMap.de,
        message: contextExplanation,
        clinic: trackedClinic,
        additionalMatches: topMatches.slice(1, 3).map(m => ({
          ...m.clinic,
          url: buildMarketingUrl(m.clinic.url, m.clinic.id, "secondary_match"),
          icsContent: createCalendarEventContent(m.clinic)
        })),
        chips: ["Checkliste Aufnahme", "Route & Anfahrt", "Klinikseite öffnen", "Anderer Standort"],
        secondaryNotice: "MDR-Hinweis: Dieser digitale Wegweiser führt keine medizinische Notfallbehandlung oder Diagnostik durch."
      };
    }

    // =========================================================================
    // 5. ALLGEMEINE REHA VS. AKUT (falls kein Standort direkt gematcht)
    // =========================================================================
    if (/reha|kur|anschlussheilbehandlung|ahb|rehabilitation/i.test(query)) {
      this.analytics.recordQuery(scrubbedInput, "match", "reha", "Reha & AHB", isVoice, lang);
      return {
        type: "info",
        title: "Rehabilitation & Anschlussheilbehandlung (AHB)",
        message: "Paracelsus führt hochspezialisierte Rehakliniken, insbesondere für Neurologie (Elena-Klinik Kassel) und Orthopädie. Suchen Sie eine Reha nach einer Operation oder eine akute Erstvorstellung?",
        chips: ["Neurologische Reha (Parkinson)", "Orthopädische Reha", "Akut-Krankenhaus"]
      };
    }

    // =========================================================================
    // 6. ALLGEMEINE TERMINANFRAGE (falls kein Fachbereich gematcht)
    // =========================================================================
    if (/termin|sprechstunde|vorstellung|anmeldung|beratung|appointment/i.test(query)) {
      this.analytics.recordQuery(scrubbedInput, "info", null, "Allgemeine Terminanfrage", isVoice, lang);
      return {
        type: "info",
        title: "Sprechstunden & Terminvereinbarung",
        message: "Termine für ambulante Sprechstunden und stationäre Vorstellungen vergeben die jeweiligen Fachsekretariate direkt. In welchem Schwerpunkt suchen Sie einen Termin?",
        chips: ["Urologie (Düsseldorf)", "Parkinson (Kassel)", "Orthopädie (Bremen)", "Allgemeinchirurgie (Henstedt-Ulzburg)"]
      };
    }

    // =========================================================================
    // 7. INTELLIGENTER FALLBACK (Geführter Lotsen-Einstieg)
    // =========================================================================
    this.analytics.recordQuery(scrubbedInput, "fallback", null, "Unspezifisch", isVoice, lang);
    return {
      type: "fallback",
      title: "Paracelsus Klinik-Wegweiser",
      message: "Ich möchte Ihnen gerne weiterhelfen, konnte Ihre Eingabe jedoch keinem spezifischen Fachbereich zuordnen. Bitte wählen Sie eines unserer medizinischen Spitzenzentren oder grenzen Sie Ihre Beschwerde ein:",
      chips: [
        "Parkinson & Neurologie (Kassel)",
        "Urologie & Prostata (Düsseldorf)",
        "Gelenke & Wirbelsäule (Bremen)",
        "Notaufnahme & Bauch (Henstedt-Ulzburg)",
        "Rheuma & Schmerztherapie (Langenhagen)",
        "Aufnahme-Checkliste"
      ],
      secondaryNotice: "MDR-Hinweis: Dieser digitale Wegweiser führt keine medizinische Notfallbehandlung oder Diagnostik durch."
    };
  }
}

if (typeof window !== "undefined") {
  window.ParacelsusBotEngine = ParacelsusBotEngine;
  window.ParacelsusAnalyticsStore = ParacelsusAnalyticsStore;
  window.createCalendarEventContent = createCalendarEventContent;
  window.scrubPII = scrubPII;
  window.buildMarketingUrl = buildMarketingUrl;
  window.REGION_MAPPING = REGION_MAPPING;
  window.getLevenshteinDistance = getLevenshteinDistance;
  window.safeFuzzyMatch = safeFuzzyMatch;
  window.fuzzyContains = safeFuzzyMatch; // Kompatibilität
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ParacelsusBotEngine,
    ParacelsusAnalyticsStore,
    scrubPII,
    buildMarketingUrl,
    createCalendarEventContent,
    EMERGENCY_CATEGORIES,
    REGION_MAPPING,
    getLevenshteinDistance,
    safeFuzzyMatch,
    fuzzyContains: safeFuzzyMatch
  };
}

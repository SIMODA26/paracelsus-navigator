/**
 * Paracelsus Kliniken — Digitaler Wegweiser & Clinical Triage Engine
 * Version: 3.0.0 (Enterprise Healthcare & Executive Ready)
 * 
 * Compliance & Standards:
 * - MDR (EU 2017/745): Reines Orientierungs- und Navigationssystem (keine Diagnostik / Therapie)
 * - DSGVO Art. 9: Strikte Client-Side PII-Anonymisierung sensibler Gesundheitsdaten
 * - DIN EN ISO 13485 Leitplanken: Deterministic Safety-First Routing
 */

// 1. Detaillierter Notfallkatalog mit differenzierten Notruf- und Krisenkontakten
const EMERGENCY_CATEGORIES = {
  CARDIOVASCULAR: {
    pattern: /herzinfarkt|brustschmerz|engegefühl\s*brust|druck\s*auf\s*der\s*brust|ausstrahlung\s*(linker\s*arm|kiefer)|herzrasen\s*akut/i,
    title: "VERDACHT AUF HERZINFARKT / AKUTES KORONARSYNDROM",
    action: "Sofort Rettungsdienst 112 rufen!",
    hotline: "112",
    guidance: "Setzen Sie sich mit leicht erhöhtem Oberkörper hin. Enge Kleidung lockern. Versuchen Sie ruhig zu atmen und warten Sie auf den Notarzt."
  },
  STROKE: {
    pattern: /schlaganfall|lähmung|halbseitig|herabhängend[a-z]*\s*mundwinkel|mundwinkel\s*hängt|sprachstörung|plötzlich\s*nicht\s*mehr\s*sprechen|sehstörung\s*plötzlich/i,
    title: "VERDACHT AUF SCHLAGANFALL (FAST-SYMPTOME)",
    action: "Sofort Notruf 112 wählen!",
    hotline: "112",
    guidance: "Jede Minute zählt (Time is Brain). Flach lagern, nicht essen oder trinken lassen. Genau den Zeitpunkt des Symptombeginns notieren."
  },
  RESPIRATORY: {
    pattern: /keine\s*luft|schwere\s*atemnot|erstickungsgefühl|ersticke|erstickung|blau\s*anlaufen/i,
    title: "AKUTE VITAL BEDROHLICHE ATEMNOT",
    action: "Unverzüglich Notruf 112 rufen!",
    hotline: "112",
    guidance: "Fenster öffnen für Frischluft. Aufrechte Sitzhaltung einnehmen, Arme aufstützen (Kutschersitz)."
  },
  SUICIDE_CRISIS: {
    pattern: /suizid|lebensmüde|selbstmord|nicht\s*mehr\s*leben|kann\s*nicht\s*mehr\s*weiter/i,
    title: "AKUTE SEELISCHE KRISE / HILFE IN NOTLAGEN",
    action: "Telefonseelsorge rund um die Uhr erreichbar",
    hotline: "0800 111 0 111",
    altHotline: "112",
    guidance: "Sie sind nicht allein. Die Telefonseelsorge hilft kostenlos, anonym und 24/7 unter 0800 111 0 111 oder 0800 111 0 222. Bei unmittelbarer Lebensgefahr wählen Sie bitte die 112."
  },
  POISON: {
    pattern: /vergiftung|chemikalie\s*(getrunken|geschluckt)|reiniger\s*geschluckt|gift\s*geschluckt/i,
    title: "VERDACHT AUF AKUTE VERGIFTUNG",
    action: "Giftnotruf oder 112 kontaktieren",
    hotline: "030 19240",
    guidance: "Giftnotrufzentrale anrufen (z. B. Berlin 030 19240 / Bonn 0228 19240) oder sofort 112. Kein Erbrechen herbeiführen! Verpackung der Substanz bereithalten."
  },
  ACUTE_ABDOMEN: {
    pattern: /brettharter\s*bauch|unerträgliche\s*bauchschmerzen|bauchdecke\s*hart/i,
    title: "VERDACHT AUF AKUTES ABDOMEN",
    action: "Sofort ärztliche Notfallversorgung / 112",
    hotline: "112",
    guidance: "Keine Schmerzmittel oder Nahrung einnehmen. Unverzügliche Vorstellung in der Notaufnahme oder Rettungsdienst verständigen."
  }
};

// 2. Nicht angebotene Fachdisziplinen (Klares Negativ-Routing)
const UNSUPPORTED_DISCIPLINES = [
  {
    pattern: /geburt|entbindung|kreißsaal|schwanger|wehen|baby\s*bekommen|wöchnerin/i,
    name: "Geburtshilfe & Kreißsaal",
    alternative: "spezialisierte Geburtskliniken",
    hint: "An den Paracelsus-Standorten wird keine Entbindung vorgehalten."
  },
  {
    pattern: /kinderklinik|pädiatrie|kinderarzt|säugling|kleinkind/i,
    name: "Kinder- und Jugendmedizin (Pädiatrie)",
    alternative: "eine Kinderklinik oder den kinderärztlichen Bereitschaftsdienst",
    hint: "Unsere Akutkliniken sind auf die Erwachsenenmedizin spezialisiert."
  },
  {
    pattern: /augenklinik|augenheilkunde|katarakt|grauer\s*star|netzhaut/i,
    name: "Augenheilkunde (Ophthalmologie)",
    alternative: "eine Fach-Augenklinik",
    hint: "Stationäre Augenoperationen gehören nicht zum Portfolio der Gruppe."
  },
  {
    pattern: /zahnklinik|kieferchirurgie|zahnimplantat|weisheitszähne/i,
    name: "Zahn- und Kieferchirurgie",
    alternative: "zahnärztliche Notdienste oder MKG-Kliniken",
    hint: "Hierfür wenden Sie sich bitte an niedergelassene Zahnärzte oder MKG-Zentren."
  },
  {
    pattern: /dermatologie|hautklinik|hautkrebs\s*screening|schuppenflechte/i,
    name: "Dermatologie & Hautklinik",
    alternative: "eine dermatologische Fachklinik",
    hint: "Dermatologische Betten werden an unseren Standorten nicht geführt."
  }
];

// 3. PII-Scrubber (Strikte Anonymisierung nach DSGVO Art. 9)
function scrubPII(text) {
  if (!text) return "";
  let clean = text;
  // 1. Versichertennummer ZUERST (vor generischen Zahlenfolgen)
  clean = clean.replace(/\b[A-Za-z]\d{9}\b/g, "[VERSICHERTEN-NR ANONYMISIERT]");
  // 2. Telefonnummern & Handynummern
  clean = clean.replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,9}/g, "[TELEFON ANONYMISIERT]");
  // 3. E-Mails
  clean = clean.replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, "[E-MAIL ANONYMISIERT]");
  // 4. Namen (gezielt bis zu 2 Wörter nach Einleitung, inkl. optionaler Titel)
  clean = clean.replace(/(?:ich heiße|mein name ist|patient:?)\s+(?:dr\.?\s+)?[a-zäöüß]+(?:\s+[a-zäöüß]+)?/gi, "[NAME ANONYMISIERT]");
  clean = clean.replace(/(?:herr|frau)\s+(?:dr\.?\s+)?[a-zäöüß]+(?:\s+[a-zäöüß]+)?/gi, "[NAME ANONYMISIERT]");
  // 5. Geburtsdaten
  clean = clean.replace(/\b\d{1,2}\.\d{1,2}\.\d{2,4}\b/g, "[DATUM ANONYMISIERT]");
  return clean;
}

// 4. UTM-Link-Generator für Kampagnen-Tracking
function buildMarketingUrl(baseUrl, clinicId, intent) {
  if (!baseUrl) return "#";
  try {
    const url = new URL(baseUrl);
    url.searchParams.set("utm_source", "paracelsus_wegweiser");
    url.searchParams.set("utm_medium", "chatbot");
    url.searchParams.set("utm_campaign", `routing_${clinicId || "general"}`);
    if (intent) {
      url.searchParams.set("utm_content", encodeURIComponent(intent));
    }
    return url.toString();
  } catch (e) {
    return baseUrl;
  }
}

// 5. DSGVO-konformer Analytics-Store (Lokale Zähler ohne Personenbezug)
class ParacelsusAnalyticsStore {
  constructor() {
    this.storageKey = "paracelsus_analytics_v2";
    this.data = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      totalQueries: 0,
      emergencyAlerts: 0,
      intentCounts: {},
      clinicRoutingCounts: {},
      contentGaps: [],
      linkClicks: 0,
      voiceQueries: 0
    };
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {}
  }

  recordQuery(anonymizedQuery, resultType, clinicId, category, isVoice = false) {
    this.data.totalQueries++;
    if (isVoice) this.data.voiceQueries++;
    if (resultType === "emergency") {
      this.data.emergencyAlerts++;
    }
    if (clinicId) {
      this.data.clinicRoutingCounts[clinicId] = (this.data.clinicRoutingCounts[clinicId] || 0) + 1;
    }
    if (category) {
      this.data.intentCounts[category] = (this.data.intentCounts[category] || 0) + 1;
    }
    if (resultType === "fallback") {
      const snippet = anonymizedQuery.substring(0, 50).trim();
      if (snippet && !this.data.contentGaps.includes(snippet)) {
        this.data.contentGaps.push(snippet);
        if (this.data.contentGaps.length > 30) this.data.contentGaps.shift();
      }
    }
    this.save();
  }

  recordClick(type, label) {
    this.data.linkClicks++;
    this.save();
  }

  getMetrics() {
    return this.data;
  }

  reset() {
    localStorage.removeItem(this.storageKey);
    this.data = this.load();
  }
}

// 6. Haupt-Bot-Engine
class ParacelsusBotEngine {
  constructor(standorteData) {
    this.standorte = standorteData || [];
    this.analytics = new ParacelsusAnalyticsStore();
    this.currentLanguage = "de";
  }

  setLanguage(lang) {
    this.currentLanguage = lang || "de";
  }

  processQuery(rawUserInput, isVoice = false) {
    // Strikte Anonymisierung
    const scrubbedInput = scrubPII(rawUserInput || "");
    const query = scrubbedInput.trim().toLowerCase();

    if (!query) {
      return {
        type: "empty",
        message: "Wie dürfen wir Ihnen helfen? Nennen Sie uns gerne Ihre Beschwerde, einen Fachbereich oder eine Stadt."
      };
    }

    // 1. Notfall-Prüfung (Höchste Priorität)
    for (const [key, em] of Object.entries(EMERGENCY_CATEGORIES)) {
      if (em.pattern.test(query)) {
        this.analytics.recordQuery(scrubbedInput, "emergency", null, `Notfall: ${key}`, isVoice);
        return {
          type: "emergency",
          isEmergency: true,
          alertTitle: em.title,
          message: em.action,
          guidance: em.guidance,
          emergencyCall: em.hotline,
          altCall: em.altHotline,
          actionText: `Notruf ${em.hotline} wählen`,
          secondaryNotice: "MDR-Hinweis: Dieser digitale Wegweiser führt keine medizinische Notfallbehandlung oder Diagnostik durch."
        };
      }
    }

    // 2. Nicht angebotene Fachdisziplinen
    for (const un of UNSUPPORTED_DISCIPLINES) {
      if (un.pattern.test(query)) {
        this.analytics.recordQuery(scrubbedInput, "unsupported", null, `Nicht angeboten: ${un.name}`, isVoice);
        return {
          type: "unsupported",
          title: `Fachdisziplin: ${un.name}`,
          message: un.hint,
          recommendation: `Für ${un.alternative} sowie bei akuten Fragen außerhalb der Praxiszeiten wenden Sie sich bitte an den bundesweiten Bereitschaftsdienst:`,
          hotline: "116 117",
          chips: ["Urologie & Prostata", "Parkinson & Neurologie", "Orthopädie & Gelenke", "Alle Standorte"]
        };
      }
    }

    // 3. Aufnahme & Koffer-Checkliste (Exklusive Notaufnahme)
    if (!/notaufnahme/i.test(query) && /koffer|mitbringen|unterlagen|stationäre\s*aufnahme|checkliste|einweisung|was\s*brauche\s*ich/i.test(query)) {
      this.analytics.recordQuery(scrubbedInput, "info", null, "Aufnahme-Checkliste", isVoice);
      return {
        type: "checklist",
        title: "Checkliste für Ihren Klinikaufenthalt",
        message: "Für eine reibungslose Aufnahme bringen Sie bitte folgende Dokumente und persönliche Gegenstände mit:",
        checklistItems: [
          "Einweisungsschein Ihres Fach- oder Hausarztes",
          "Elektronische Gesundheitskarte (Krankenkassenkarte)",
          "Aktueller bundeseinheitlicher Medikamentenplan",
          "Relevante Vorbefunde, Entlassungsbriefe & Röntgen-/MRT-CDs",
          "Bequeme Kleidung, Hausschuhe & persönliche Hygieneartikel",
          "Ggf. Allergiepass, Röntgenpass oder Patientenverfügung"
        ],
        chips: ["Termin vereinbaren", "Besuchszeiten", "Standorte anzeigen"]
      };
    }

    // 4. Besuchszeiten & Parken
    if (/besuchszeit|besuch|angehörige|parken|parkplatz|anfahrt|öffnungszeit/i.test(query)) {
      this.analytics.recordQuery(scrubbedInput, "info", null, "Besucher & Anreise", isVoice);
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

    // 5. Karriere & Ausbildung
    if (/karriere|job|stellenangebot|ausbildung|pflegefachkraft|krankenschwester|arztstelle|famulatur|pj|bewerbung/i.test(query)) {
      this.analytics.recordQuery(scrubbedInput, "link", "karriere", "Karriere & Recruiting", isVoice);
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

    // 6. Reha vs. Akut
    if (/reha|kur|anschlussheilbehandlung|ahb|rehabilitation/i.test(query)) {
      this.analytics.recordQuery(scrubbedInput, "match", "reha", "Reha & AHB", isVoice);
      return {
        type: "info",
        title: "Rehabilitation & Anschlussheilbehandlung (AHB)",
        message: "Paracelsus führt hochspezialisierte Rehakliniken, insbesondere für Neurologie (Elena-Klinik Kassel) und Orthopädie. Suchen Sie eine Reha nach einer Operation oder eine akute Erstvorstellung?",
        chips: ["Neurologische Reha (Parkinson)", "Orthopädische Reha", "Akut-Krankenhaus"]
      };
    }

    // 7. Terminvereinbarung & Sprechstunden
    if (/termin|sprechstunde|vorstellung|anmeldung|beratung/i.test(query)) {
      this.analytics.recordQuery(scrubbedInput, "info", null, "Terminanfrage", isVoice);
      return {
        type: "info",
        title: "Sprechstunden & Terminvereinbarung",
        message: "Termine für ambulante Sprechstunden und stationäre Vorstellungen vergeben die jeweiligen Fachsekretariate direkt. In welchem Schwerpunkt suchen Sie einen Termin?",
        chips: ["Urologie (Düsseldorf)", "Parkinson (Kassel)", "Orthopädie (Bremen)", "Allgemeinchirurgie (Henstedt-Ulzburg)"]
      };
    }

    // 8. Intelligentes Klinik- & Symptom-Matching
    const scoredClinics = this.standorte.map(clinic => {
      let score = 0;
      const matchedTerms = [];

      // Stadt-Match
      if (query.includes(clinic.city.toLowerCase())) {
        score += 15;
        matchedTerms.push(clinic.city);
      }
      // Bundesland-Match
      if (query.includes(clinic.state.toLowerCase())) {
        score += 8;
      }
      // ID-Match
      if (query.includes(clinic.id.split("-")[0])) {
        score += 10;
      }

      // Keyword- & Indikations-Match
      clinic.keywords.forEach(keyword => {
        if (query.includes(keyword.toLowerCase())) {
          score += 7;
          matchedTerms.push(keyword);
        }
      });

      // Specialties-Match
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
      const trackedClinic = {
        ...best,
        url: buildMarketingUrl(best.url, best.id, topMatches[0].matchedTerms.join("_"))
      };

      this.analytics.recordQuery(scrubbedInput, "match", best.id, best.type, isVoice);

      return {
        type: "match",
        title: `Empfohlene Fachklinik: ${best.name}`,
        message: `Für Ihr Anliegen empfehlen wir das Spezialistenteam der **${best.name}** in ${best.city}.`,
        clinic: trackedClinic,
        additionalMatches: topMatches.slice(1, 3).map(m => ({
          ...m.clinic,
          url: buildMarketingUrl(m.clinic.url, m.clinic.id, "secondary_match")
        })),
        chips: ["Checkliste Aufnahme", "Route & Anfahrt", "Klinikseite öffnen", "Anderer Standort"]
      };
    }

    // 9. Fallback & Content-Gap Aufzeichnung
    this.analytics.recordQuery(scrubbedInput, "fallback", null, "Unspezifisch", isVoice);
    return {
      type: "fallback",
      title: "Paracelsus Klinik-Wegweiser",
      message: "Ich konnte Ihre Anfrage keinem direkten Spezialbereich zuordnen. Bitte wählen Sie eines unserer medizinischen Spitzenzentren oder nennen Sie Ihre Region:",
      chips: [
        "Parkinson & Neurologie (Kassel)",
        "Urologie & Prostata (Düsseldorf)",
        "Gelenke & Orthopädie (Bremen)",
        "Notfallversorgung (Henstedt-Ulzburg)",
        "Alle Standorte im Überblick"
      ]
    };
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { ParacelsusBotEngine, ParacelsusAnalyticsStore, scrubPII, buildMarketingUrl, EMERGENCY_CATEGORIES };
}

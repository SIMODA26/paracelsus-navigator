/**
 * Paracelsus Kliniken — Digitaler Wegweiser & Clinical Triage Engine
 * Version: 3.5.0 (Enterprise Multi-Lingual, Accessibility & Clinical Decision Trees)
 * 
 * Compliance & Standards:
 * - MDR (EU 2017/745): Reines Orientierungs- und Navigationssystem (keine Diagnostik / Therapie)
 * - DSGVO Art. 9: Strikte Client-Side PII-Anonymisierung sensibler Gesundheitsdaten
 * - BITV 2.0 / WCAG 2.1 AAA: Barrierefreiheit, Text-to-Speech & Senioren-Modus
 */

// 1. Detaillierter Notfallkatalog mit differenzierten Notruf- und Krisenkontakten
const EMERGENCY_CATEGORIES = {
  CARDIOVASCULAR: {
    pattern: /herzinfarkt|brustschmerz|engegefühl\s*brust|druck\s*auf\s*der\s*brust|ausstrahlung\s*(linker\s*arm|kiefer)|herzrasen\s*akut|heart\s*attack|chest\s*pain/i,
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

// 2. Nicht angebotene Fachdisziplinen (Klares Negativ-Routing)
const UNSUPPORTED_DISCIPLINES = [
  {
    pattern: /geburt|entbindung|kreißsaal|schwanger|wehen|baby\s*bekommen|wöchnerin|birth|maternity/i,
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

// 3. PII-Scrubber (Strikte Anonymisierung nach DSGVO Art. 9)
function scrubPII(text) {
  if (!text) return "";
  let clean = text;
  // 1. Versichertennummer ZUERST
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
    this.storageKey = "paracelsus_analytics_v3";
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
      voiceQueries: 0,
      zuweiserQueries: 0,
      languageCounts: { de: 0, en: 0, tr: 0, uk: 0 }
    };
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {}
  }

  recordQuery(anonymizedQuery, resultType, clinicId, category, isVoice = false, lang = "de") {
    this.data.totalQueries++;
    if (isVoice) this.data.voiceQueries++;
    if (this.data.languageCounts) {
      this.data.languageCounts[lang] = (this.data.languageCounts[lang] || 0) + 1;
    }
    if (resultType === "emergency") {
      this.data.emergencyAlerts++;
    }
    if (clinicId) {
      this.data.clinicRoutingCounts[clinicId] = (this.data.clinicRoutingCounts[clinicId] || 0) + 1;
    }
    if (category) {
      this.data.intentCounts[category] = (this.data.intentCounts[category] || 0) + 1;
    }
    if (category === "Zuweiser & Ärzte") {
      this.data.zuweiserQueries = (this.data.zuweiserQueries || 0) + 1;
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
    this.currentLanguage = ["de", "en", "tr", "uk"].includes(lang) ? lang : "de";
  }

  processQuery(rawUserInput, isVoice = false) {
    const scrubbedInput = scrubPII(rawUserInput || "");
    const query = scrubbedInput.trim().toLowerCase();
    const lang = this.currentLanguage;

    if (!query) {
      const emptyMsg = {
        de: "Wie dürfen wir Ihnen helfen? Nennen Sie uns gerne Ihre Beschwerde, einen Fachbereich oder eine Stadt.",
        en: "How can we assist you? Please mention your symptom, medical specialty, or preferred city.",
        tr: "Size nasıl yardımcı olabiliriz? Lütfen şikayetinizi, uzmanlık alanını veya tercih ettiğiniz şehri belirtin.",
        uk: "Чим ми можемо вам допомогти? Вкажіть ваші симптоми, медичний напрямок або місто."
      };
      return {
        type: "empty",
        message: emptyMsg[lang] || emptyMsg.de
      };
    }

    // 1. Notfall-Prüfung (Höchste Priorität)
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

    // 2. Nicht angebotene Fachdisziplinen
    for (const un of UNSUPPORTED_DISCIPLINES) {
      if (un.pattern.test(query)) {
        this.analytics.recordQuery(scrubbedInput, "unsupported", null, `Nicht angeboten: ${un.name}`, isVoice, lang);
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

    // 3. Zuweiser & Ärzte-Portal (Niedergelassene Haus- & Fachärzte)
    if (/zuweiser|arztportal|ärztliche\s*einweisung|kollegialer\s*kontakt|chefarztsekretariat|befundübermittlung|patient[a-z]*\s*einweisen|patient[a-z]*\s*überweisen|niedergelassene[a-z]*|facharzt|hausarzt/i.test(query)) {
      this.analytics.recordQuery(scrubbedInput, "info", null, "Zuweiser & Ärzte", isVoice, lang);
      return {
        type: "zuweiser",
        title: "Informationen für einweisende Kolleginnen & Kollegen",
        message: "Für eine schnelle, unbürokratische Patientenübernahme stehen Ihnen die Chefarztsekretariate und das zentrale Belegungsmanagement zur Verfügung:",
        zuweiserContacts: [
          { clinic: "Paracelsus Klinik Golzheim Düsseldorf (Urologie)", phone: "+49 211 4385-200", fax: "+49 211 4385-209", note: "Zertifiziertes Prostatakrebszentrum / Robotik" },
          { clinic: "Paracelsus-Elena-Klinik Kassel (Neurologie)", phone: "+49 561 6009-120", fax: "+49 561 6009-129", note: "Parkinson-Komplex & Differentialdiagnostik" },
          { clinic: "Paracelsus Klinik Bremen (Orthopädie/Wirbelsäule)", phone: "+49 421 4683-150", fax: "+49 421 4683-159", note: "Endoprothetik & Schmerztherapie" },
          { clinic: "Paracelsus Klinik Henstedt-Ulzburg (ZNA & Chirurgie)", phone: "+49 4193 70-210", fax: "+49 4193 70-219", note: "24/7 Notaufnahme & Viszeralchirurgie" }
        ],
        chips: ["Zuweiser-Faxnummern", "Notaufnahme 24/7", "Standorte anzeigen"]
      };
    }

    // 4. Aufnahme & Koffer-Checkliste (Exklusive Notaufnahme)
    if (!/notaufnahme/i.test(query) && /koffer|mitbringen|unterlagen|stationäre\s*aufnahme|checkliste|einweisung|was\s*brauche\s*ich|packing\s*list/i.test(query)) {
      this.analytics.recordQuery(scrubbedInput, "info", null, "Aufnahme-Checkliste", isVoice, lang);
      return {
        type: "checklist",
        title: "Interaktive Checkliste für Ihren Klinikaufenthalt",
        message: "Haken Sie die Dokumente und Dinge direkt auf Ihrem Bildschirm ab, um nichts zu vergessen:",
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

    // 5. Besuchszeiten & Parken
    if (/besuchszeit|besuch|angehörige|parken|parkplatz|anfahrt|öffnungszeit|visiting\s*hours/i.test(query)) {
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

    // 6. Karriere & Ausbildung
    if (/karriere|job|stellenangebot|ausbildung|pflegefachkraft|krankenschwester|arztstelle|famulatur|pj|bewerbung|career/i.test(query)) {
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

    // 7. Reha vs. Akut
    if (/reha|kur|anschlussheilbehandlung|ahb|rehabilitation/i.test(query)) {
      this.analytics.recordQuery(scrubbedInput, "match", "reha", "Reha & AHB", isVoice, lang);
      return {
        type: "info",
        title: "Rehabilitation & Anschlussheilbehandlung (AHB)",
        message: "Paracelsus führt hochspezialisierte Rehakliniken, insbesondere für Neurologie (Elena-Klinik Kassel) und Orthopädie. Suchen Sie eine Reha nach einer Operation oder eine akute Erstvorstellung?",
        chips: ["Neurologische Reha (Parkinson)", "Orthopädische Reha", "Akut-Krankenhaus"]
      };
    }

    // 8. Terminvereinbarung & Sprechstunden
    if (/termin|sprechstunde|vorstellung|anmeldung|beratung|appointment/i.test(query)) {
      this.analytics.recordQuery(scrubbedInput, "info", null, "Terminanfrage", isVoice, lang);
      return {
        type: "info",
        title: "Sprechstunden & Terminvereinbarung",
        message: "Termine für ambulante Sprechstunden und stationäre Vorstellungen vergeben die jeweiligen Fachsekretariate direkt. In welchem Schwerpunkt suchen Sie einen Termin?",
        chips: ["Urologie (Düsseldorf)", "Parkinson (Kassel)", "Orthopädie (Bremen)", "Allgemeinchirurgie (Henstedt-Ulzburg)"]
      };
    }

    // 9. Intelligentes Klinik- & Symptom-Matching
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

      this.analytics.recordQuery(scrubbedInput, "match", best.id, best.type, isVoice, lang);

      const titleMap = {
        de: `Empfohlene Fachklinik: ${best.name}`,
        en: `Recommended Hospital: ${best.name}`,
        tr: `Önerilen Uzmanlık Kliniği: ${best.name}`,
        uk: `Рекомендована клініка: ${best.name}`
      };

      const msgMap = {
        de: `Für Ihr Anliegen empfehlen wir das Spezialistenteam der **${best.name}** in ${best.city}.`,
        en: `For your medical condition, we recommend the specialist team at **${best.name}** in ${best.city}.`,
        tr: `Şikayetiniz için **${best.name}** (${best.city}) uzman ekibini öneriyoruz.`,
        uk: `Для вирішення вашого медичного питання рекомендуємо фахівців **${best.name}** у м. ${best.city}.`
      };

      return {
        type: "match",
        title: titleMap[lang] || titleMap.de,
        message: msgMap[lang] || msgMap.de,
        clinic: trackedClinic,
        additionalMatches: topMatches.slice(1, 3).map(m => ({
          ...m.clinic,
          url: buildMarketingUrl(m.clinic.url, m.clinic.id, "secondary_match")
        })),
        chips: ["Checkliste Aufnahme", "Route & Anfahrt", "Klinikseite öffnen", "Anderer Standort"]
      };
    }

    // 10. Fallback & Content-Gap Aufzeichnung
    this.analytics.recordQuery(scrubbedInput, "fallback", null, "Unspezifisch", isVoice, lang);
    return {
      type: "fallback",
      title: "Paracelsus Klinik-Wegweiser",
      message: "Ich konnte Ihre Anfrage keinem direkten Spezialbereich zuordnen. Bitte wählen Sie eines unserer medizinischen Spitzenzentren oder nutzen Sie unseren geführten Symptom-Lotsen:",
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

"""
Paracelsus Kliniken - Digitaler Wegweiser API (FastAPI Enterprise Backend)
Region: Europe (Frankfurt) - DSGVO Art. 9 & MDR-konform
"""

import re
import unicodedata
from typing import Optional, List, Dict, Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="Paracelsus Kliniken Wegweiser API",
    version="3.0.0",
    description="DSGVO-konformes Routing, PII-Scrubbing und Clinical Triage für Paracelsus Kliniken"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Notfallkatalog
EMERGENCY_RULES = [
    {
        "pattern": re.compile(r"herzinfarkt|brustschmerz|engegefühl\s*brust|druck\s*auf\s*der\s*brust", re.I),
        "title": "VERDACHT AUF HERZINFARKT",
        "action": "Sofort Notruf 112 wählen!",
        "hotline": "112",
        "guidance": "Oberkörper leicht erhöht lagern, enge Kleidung lockern, ruhig atmen."
    },
    {
        "pattern": re.compile(r"schlaganfall|lähmung|halbseitig|herabhängend[a-z]*\s*mundwinkel|sprachstörung", re.I),
        "title": "VERDACHT AUF SCHLAGANFALL (FAST)",
        "action": "Sofort Notruf 112 rufen!",
        "hotline": "112",
        "guidance": "Jede Minute zählt. Flach lagern, nicht essen oder trinken lassen."
    },
    {
        "pattern": re.compile(r"keine\s*luft|schwere\s*atemnot|erstickungsgefühl|ersticke|erstickung|blau\s*anlaufen|cannot\s*breathe|shortness\s*of\s*breath", re.I),
        "title": "AKUTE VITAL BEDROHLICHE ATEMNOT",
        "action": "Unverzüglich Notruf 112 rufen!",
        "hotline": "112",
        "guidance": "Fenster für Frischluft öffnen. Aufrechte Sitzhaltung einnehmen, Arme aufstützen (Kutschersitz)."
    },
    {
        "pattern": re.compile(r"starke\s*blutung|unstillbare\s*blutung|arterielle\s*blutung|blutverlust|spritzende\s*blutung|severe\s*bleeding|hemorrhage", re.I),
        "title": "SCHWERE, AKUTE BLUTUNG",
        "action": "Sofort Notruf 112 wählen!",
        "hotline": "112",
        "guidance": "Druckverband anlegen. Betroffene Extremität wenn möglich hochlagern. Wunde mit sauberem Tuch fest abdrücken bis der Notarzt eintrifft."
    },
    {
        "pattern": re.compile(r"suizid|lebensmüde|selbstmord|nicht\s*mehr\s*leben|kann\s*nicht\s*mehr\s*weiter", re.I),
        "title": "SEELISCHE NOTLAGE / KRISENHILFE",
        "action": "Telefonseelsorge rund um die Uhr",
        "hotline": "0800 111 0 111",
        "guidance": "Kostenlos, anonym und 24/7 erreichbar unter 0800 111 0 111."
    },
    {
        "pattern": re.compile(r"vergiftung|chemikalie|reiniger\s*geschluckt|gift\s*geschluckt", re.I),
        "title": "VERDACHT AUF VERGIFTUNG",
        "action": "Giftnotruf 030 19240 oder 112",
        "hotline": "030 19240",
        "guidance": "Kein Erbrechen herbeiführen! Verpackung der Substanz bereithalten."
    }
]

def scrub_pii(text: str) -> str:
    if not text:
        return ""
    text = unicodedata.normalize("NFC", str(text))
    # 1. Geburtsdaten & Kalenderdaten
    text = re.sub(r"\b\d{1,2}\.\s*(?:Januar|Februar|März|Maerz|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s*\d{2,4}\b", "[DATUM ANONYMISIERT]", text, flags=re.I)
    text = re.sub(r"\b\d{4}-\d{2}-\d{2}\b", "[DATUM ANONYMISIERT]", text)
    text = re.sub(r"\b\d{1,2}/\d{1,2}/\d{2,4}\b", "[DATUM ANONYMISIERT]", text)
    text = re.sub(r"\b\d{1,2}\.\d{1,2}\.\d{2,4}\b", "[DATUM ANONYMISIERT]", text)

    # 2. Versichertennummer (1 Buchstabe + 9 Ziffern, auch formatiert)
    text = re.sub(r"\b[A-Za-z]\s*\d(?:\s*\d){8}\b", "[VERSICHERTEN-NR ANONYMISIERT]", text)

    # 3. E-Mails
    text = re.sub(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", "[E-MAIL ANONYMISIERT]", text)

    # 4. Straßenadressen (deutsche Straßennamen mit Hausnummer)
    text = re.sub(
        r"\b(?:am\s+[A-Za-zÄÖÜäöüßà-öø-ÿ]+|[A-Za-zÄÖÜäöüßà-öø-ÿ]+(?:-[A-Za-zÄÖÜäöüßà-öø-ÿ]+)*(?:-)?(?:straße|str\.|weg|gasse|platz|allee|ring|chaussee|damm|ufer|berg|hang|markt|steig|kamp|zeil|wall))\s+\d+[a-zA-Z]?(?:\s*-\s*\d+[a-zA-Z]?)?\b",
        "[ADRESSE ANONYMISIERT]",
        text,
        flags=re.I
    )

    # 5. Telefonnummern (5-stellige deutsche PLZ geschützt)
    phone_pattern = re.compile(r"(?:\+(?:[0-9][-.\s/()]*){6,15}[0-9]|\(?\b0[1-9][0-9]{1,4}\)?[-.\s/]+[0-9]{2,10}\b|\(?\b0[1-9][0-9]{1,4}\)?[-.\s/]*[0-9]{3,10}\b|\b[0-9]{6,12}\b)")
    text = phone_pattern.sub("[TELEFON ANONYMISIERT]", text)

    # 6. Personennamen
    pii_stop_words = {
        "und", "oder", "aber", "hat", "hatte", "habe", "haben", "ist", "sind", "war", "waren",
        "aus", "an", "am", "in", "im", "von", "vom", "mit", "bei", "nach", "seit", "zu", "zum", "zur", "für",
        "über", "unter", "vor", "zwischen", "durch",
        "der", "die", "das", "dem", "den", "des", "ein", "eine", "einer", "eines", "einem", "einen",
        "ich", "du", "er", "sie", "es", "wir", "ihr", "mich", "mir", "dich", "dir", "ihn", "ihm", "uns", "euch", "ihnen",
        "mein", "meine", "meinen", "meiner", "sein", "seine", "seinen", "seiner", "ihr", "ihre",
        "suche", "suchen", "sucht", "brauche", "brauchen", "braucht", "möchte", "will", "kann", "muss",
        "schmerzen", "beschwerden", "probleme", "hilfe", "behandlung", "klinik", "krankenhaus", "arzt", "überwiesen", "empfahl",
        "auf", "dem", "krank", "schwanger", "versichert", "gesetzlich", "privat", "nicht", "nur", "schon"
    }

    noble_particles = {"von", "zu", "van", "de", "der", "den", "vom"}
    role_stop_words = {"doktor", "arzt", "ärzte", "ärztin", "klinik", "krankenhaus"}

    def clean_name_match(match):
        prefix = match.group(1)
        name_part = match.group(2)
        words = name_part.strip().split()
        valid_names = []
        rest_words = []
        collecting = True
        has_explicit_prefix = bool(re.search(r"\b(?:herr|frau|patient(?:in)?|dr|prof|priv\.-doz)\b", prefix, re.I))

        for i, w in enumerate(words):
            lower = w.lower()
            is_capitalized = bool(re.match(r"^[A-ZÄÖÜÀ-ÖØ-ß]", w))

            if collecting:
                if valid_names and lower in noble_particles:
                    has_following_name = False
                    for j in range(i + 1, len(words)):
                        next_lower = words[j].lower()
                        if re.match(r"^[A-ZÄÖÜÀ-ÖØ-ß]", words[j]) and next_lower not in pii_stop_words:
                            has_following_name = True
                            break
                        if next_lower not in noble_particles and next_lower != "und":
                            break
                    if has_following_name:
                        valid_names.append(w)
                        continue

                if lower not in pii_stop_words:
                    valid_names.append(w)
                elif not valid_names and has_explicit_prefix and is_capitalized and lower not in role_stop_words:
                    valid_names.append(w)
                else:
                    collecting = False
                    rest_words.append(w)
            else:
                rest_words.append(w)

        if valid_names:
            rest = (" " + " ".join(rest_words)) if rest_words else ""
            return "[NAME ANONYMISIERT]" + rest
        return match.group(0)

    title_pat = r"(?:(?:(?:prof(?:essor)?\.?(?:\s*dr\.?)?|dr\.?|doktor|priv\.-doz\.?|pd\.?)(?:\s*(?:med|dent|habil|h\.\s*c|rer\.\s*nat)\.?)*\s*)+)"
    name_word = r"[a-zäöüßà-öø-ÿ]+(?:-[a-zäöüßà-öø-ÿ]+)*"
    cand_names = r"\b" + name_word + r"(?:\s+" + name_word + r"){0,4}\b"

    text = re.sub(r"((?:ich\s+heiße|ich\s+bin|mein\s+name\s+(?:ist|lautet)|hier\s+(?:ist|spricht)|patient(?:in)?(?::|\s+ist:?)?)\s+(?:" + title_pat + r")?(?:(?:herr|frau)\s+)?(?:" + title_pat + r")?)(" + cand_names + r")", clean_name_match, text, flags=re.I)
    text = re.sub(r"((?:herr|frau)\s+(?:" + title_pat + r")?)(" + cand_names + r")", clean_name_match, text, flags=re.I)
    text = re.sub(r"(\b" + title_pat + r")(" + cand_names + r")", clean_name_match, text, flags=re.I)
    text = re.sub(r"(\bich\s+bin\s+)(" + cand_names + r")", clean_name_match, text, flags=re.I)

    return text

ANALYTICS_DATA = {
    "total_queries": 0,
    "emergency_count": 0,
    "intent_counts": {},
    "clinic_counts": {},
    "content_gaps": []
}

class QueryRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    type: str
    is_emergency: bool = False
    title: Optional[str] = None
    message: str
    alert_title: Optional[str] = None
    action_text: Optional[str] = None
    emergency_call: Optional[str] = None
    guidance: Optional[str] = None
    clinic: Optional[Dict[str, Any]] = None
    links: Optional[List[Dict[str, str]]] = None
    chips: Optional[List[str]] = None
    secondary_notice: Optional[str] = "MDR-Hinweis: Dieser digitale Wegweiser führt keine medizinische Notfallbehandlung oder Diagnostik durch."

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "paracelsus-navigator-api",
        "version": "3.0.0",
        "region": "europe-west3 (Frankfurt, Germany)",
        "compliance": ["DSGVO Art. 9", "EU-MDR 2017/745 Class Non-Medical"]
    }

@app.post("/api/query", response_model=QueryResponse)
def query_bot(req: QueryRequest):
    ANALYTICS_DATA["total_queries"] += 1
    scrubbed = scrub_pii(req.query.strip())
    
    # 1. Notfall-Prüfung
    for rule in EMERGENCY_RULES:
        if rule["pattern"].search(scrubbed):
            ANALYTICS_DATA["emergency_count"] += 1
            return QueryResponse(
                type="emergency",
                is_emergency=True,
                alert_title=rule["title"],
                message=rule["action"],
                guidance=rule["guidance"],
                emergency_call=rule["hotline"],
                action_text=f"Notruf {rule['hotline']} wählen"
            )

    # 2. Fachklinik Düsseldorf (Urologie & DaVinci)
    if re.search(r"prostata|urologie|blase|niere|stein|da vinci|düsseldorf", scrubbed, re.I):
        ANALYTICS_DATA["clinic_counts"]["duesseldorf-golzheim"] = ANALYTICS_DATA["clinic_counts"].get("duesseldorf-golzheim", 0) + 1
        return QueryResponse(
            type="match",
            title="Empfohlene Fachklinik: Paracelsus Klinik Golzheim Düsseldorf",
            message="Für urologische Spitzenmedizin und robotische Eingriffe (DaVinci) empfehlen wir die Paracelsus Klinik Golzheim Düsseldorf.",
            clinic={
                "id": "duesseldorf-golzheim",
                "name": "Paracelsus Klinik Golzheim Düsseldorf",
                "city": "Düsseldorf",
                "phone": "+49 211 4385-0",
                "url": "https://www.paracelsus-kliniken.de/duesseldorf/?utm_source=paracelsus_wegweiser&utm_medium=chatbot&utm_campaign=routing_duesseldorf-golzheim"
            },
            chips=["Checkliste Aufnahme", "Route & Anfahrt", "Klinikseite öffnen"]
        )

    # 3. Fachklinik Kassel (Parkinson & Neurologie)
    if re.search(r"parkinson|zittern|tremor|bewegungsstörung|kassel|dystonie", scrubbed, re.I):
        ANALYTICS_DATA["clinic_counts"]["kassel-elena"] = ANALYTICS_DATA["clinic_counts"].get("kassel-elena", 0) + 1
        return QueryResponse(
            type="match",
            title="Empfohlene Fachklinik: Paracelsus-Elena-Klinik Kassel",
            message="Die Paracelsus-Elena-Klinik Kassel ist Deutschlands traditionsreichstes neurologisches Kompetenzzentrum für Parkinson und Bewegungsstörungen.",
            clinic={
                "id": "kassel-elena",
                "name": "Paracelsus-Elena-Klinik Kassel",
                "city": "Kassel",
                "phone": "+49 561 6009-0",
                "url": "https://www.paracelsus-kliniken.de/kassel-elena/?utm_source=paracelsus_wegweiser&utm_medium=chatbot&utm_campaign=routing_kassel-elena"
            },
            chips=["Checkliste Aufnahme", "Route & Anfahrt", "Klinikseite öffnen"]
        )

    # 4. Fallback
    safe_gap = scrub_pii(scrubbed)[:50].strip()
    safe_gap = re.sub(r"\b[A-ZÄÖÜÀ-ÖØ-ß][a-zäöüßà-öø-ÿ]+(?:\s+[A-ZÄÖÜÀ-ÖØ-ß][a-zäöüßà-öø-ÿ]+){1,2}\b", "[NAME ANONYMISIERT]", safe_gap)
    if len(safe_gap) > 3 and safe_gap not in ANALYTICS_DATA["content_gaps"]:
        ANALYTICS_DATA["content_gaps"].append(safe_gap)
        if len(ANALYTICS_DATA["content_gaps"]) > 30:
            ANALYTICS_DATA["content_gaps"].pop(0)

    return QueryResponse(
        type="fallback",
        title="Paracelsus Klinik-Wegweiser",
        message="Bitte wählen Sie ein Spezialzentrum oder nennen Sie Ihre Stadt:",
        chips=["Parkinson (Kassel)", "Urologie (Düsseldorf)", "Orthopädie (Bremen)", "Notaufnahme (Henstedt-Ulzburg)"]
    )

@app.get("/api/analytics")
def get_analytics():
    return ANALYTICS_DATA

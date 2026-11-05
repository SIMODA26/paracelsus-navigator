"""
Paracelsus Kliniken - Digitaler Wegweiser API (FastAPI Enterprise Backend)
Region: Europe (Frankfurt) - DSGVO Art. 9 & MDR-konform
"""

import re
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
        "pattern": re.compile(r"suizid|lebensmüde|selbstmord", re.I),
        "title": "SEELISCHE NOTLAGE / KRISENHILFE",
        "action": "Telefonseelsorge rund um die Uhr",
        "hotline": "0800 111 0 111",
        "guidance": "Kostenlos, anonym und 24/7 erreichbar unter 0800 111 0 111."
    },
    {
        "pattern": re.compile(r"vergiftung|chemikalie|reiniger\s*geschluckt", re.I),
        "title": "VERDACHT AUF VERGIFTUNG",
        "action": "Giftnotruf 030 19240 oder 112",
        "hotline": "030 19240",
        "guidance": "Kein Erbrechen herbeiführen! Verpackung der Substanz bereithalten."
    }
]

def scrub_pii(text: str) -> str:
    # 1. Versichertennummer
    text = re.sub(r"\b[A-Za-z]\d{9}\b", "[VERSICHERTEN-NR ANONYMISIERT]", text)
    # 2. Telefonnummern
    text = re.sub(r"(\+?\d{1,3}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,9}", "[TELEFON ANONYMISIERT]", text)
    # 3. E-Mails
    text = re.sub(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", "[E-MAIL ANONYMISIERT]", text)
    # 4. Namen
    text = re.sub(r"(?:ich heiße|mein name ist|patient:?)\s+(?:dr\.?\s+)?[a-zäöüß]+(?:\s+[a-zäöüß]+)?", "[NAME ANONYMISIERT]", text, flags=re.I)
    text = re.sub(r"(?:herr|frau)\s+(?:dr\.?\s+)?[a-zäöüß]+(?:\s+[a-zäöüß]+)?", "[NAME ANONYMISIERT]", text, flags=re.I)
    # 5. Geburtsdaten
    text = re.sub(r"\b\d{1,2}\.\d{1,2}\.\d{2,4}\b", "[DATUM ANONYMISIERT]", text)
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
    if len(scrubbed) > 3 and scrubbed not in ANALYTICS_DATA["content_gaps"]:
        ANALYTICS_DATA["content_gaps"].append(scrubbed[:50])
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

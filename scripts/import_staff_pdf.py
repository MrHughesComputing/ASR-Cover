import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path
import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PDF = Path(r"C:\Users\mrpau\Downloads\Staff 26Aug.pdf")
IMPORT_JSON = ROOT / "data" / "imports" / "staff-26aug.json"
SRC_IMPORT_JSON = ROOT / "src" / "db" / "imported" / "staff-26aug.json"
REPORT_MD = ROOT / "docs" / "import-validation-2026-08-26.md"
SOURCE_TS = ROOT / "src" / "db" / "imported-timetable-data.ts"
PERIODS = [
    {"id":"REG","label":"Registration","dayOrder":0,"startTime":"07:30","endTime":"07:55","coverRelevant":True},
    {"id":"L1","label":"Lesson 1","dayOrder":1,"startTime":"07:55","endTime":"08:40","coverRelevant":True},
    {"id":"L2","label":"Lesson 2","dayOrder":2,"startTime":"08:40","endTime":"09:25","coverRelevant":True},
    {"id":"L3","label":"Lesson 3","dayOrder":3,"startTime":"09:25","endTime":"10:10","coverRelevant":True},
    {"id":"BRK","label":"Break","dayOrder":4,"startTime":"10:10","endTime":"10:30","coverRelevant":False},
    {"id":"L4","label":"Lesson 4","dayOrder":5,"startTime":"10:30","endTime":"11:15","coverRelevant":True},
    {"id":"L5","label":"Lesson 5","dayOrder":6,"startTime":"11:15","endTime":"12:00","coverRelevant":True},
    {"id":"L6A","label":"Lesson 6A","dayOrder":7,"startTime":"12:00","endTime":"12:45","coverRelevant":True},
    {"id":"L6B","label":"Lesson 6B","dayOrder":8,"startTime":"12:45","endTime":"13:30","coverRelevant":True},
    {"id":"L7","label":"Lesson 7","dayOrder":9,"startTime":"13:30","endTime":"14:15","coverRelevant":True},
    {"id":"L8","label":"Lesson 8","dayOrder":10,"startTime":"14:15","endTime":"15:00","coverRelevant":True},
    {"id":"CCA","label":"CCA","dayOrder":11,"startTime":"15:05","endTime":"16:00","coverRelevant":True},
]
DAYS = [("SUNDAY",120,202),("MONDAY",205,292),("TUESDAY",295,377),("WEDNESDAY",380,465),("THURSDAY",468,552)]
RAW_COLUMNS = [(100,147,"REG"),(148,196,"L1"),(197,244,"L2"),(245,292,"L3"),(293,341,"BRK"),(342,390,"L4"),(391,438,"L5"),(439,487,"L5"),(488,535,"L6A"),(536,584,"L6A"),(585,632,"L6B"),(633,681,"L6B"),(682,729,"L7"),(730,778,"L8"),(779,826,"CCA")]
KNOWN_CODES = {"SLT","SEN","PLM","STM","MTM","ETM","ASM","B2 DR"}
VACANT_POSTS = {"Arabic 1","Arabic 2","Arabic HOD","Arabic LS"}
IGNORED_RESOURCES = {"Duty Team"}
SUBJECT_NAMES = {"COMP":"Computing","MAT":"Maths","MATH":"Maths","DRA":"Drama","PE":"PE","ARA":"Arabic","AR":"Arabic","SCI":"Science","ENG":"English","HUM":"Humanities","ART":"Art","MUS":"Music","FRE":"French","SPA":"Spanish","ISL":"Islamic","LS":"Learning Support"}

def slug(value):
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-") or "unknown"

def dedupe_owner(owner):
    parts = owner.split()
    if len(parts) % 2 == 0 and parts[:len(parts)//2] == parts[len(parts)//2:]:
        return " ".join(parts[:len(parts)//2])
    return owner.strip()

def owner_from_words(words):
    title_words = [w["text"] for w in words if w.get("upright") and 20 <= w["top"] <= 70 and 250 <= w["x0"] <= 650]
    return dedupe_owner(" ".join(title_words).strip())

def cell_lines(words, y0, y1, x0, x1):
    selected = [w for w in words if w.get("upright") and y0 <= w["top"] <= y1 and x0 <= ((w["x0"] + w["x1"]) / 2) <= x1 and w["x0"] > 80]
    rows = defaultdict(list)
    for w in selected:
        rows[round(w["top"] / 7) * 7].append(w)
    return [" ".join(w["text"] for w in sorted(rows[top], key=lambda item:item["x0"])).strip() for top in sorted(rows) if rows[top]]

def parse_subject(lines):
    first = lines[0] if lines else ""
    m = re.search(r"\bY(?P<year>\d{1,2})\s+(?P<code>[A-Z]{2,5})\b", first)
    if not m:
        return None, None, None
    code = m.group("code")
    return code, SUBJECT_NAMES.get(code, code.title()), m.group("year")

def parse_classes(text):
    vals = re.findall(r"Year\s+\d+[A-Z]?", text)
    vals += re.findall(r"\bY\d+[A-Z]\b", text)
    if re.search(r"\bEYFS\b", text, re.I): vals.append("EYFS")
    if re.search(r"\bNursery\b", text, re.I): vals.append("Nursery")
    if re.search(r"\bReception\b", text, re.I): vals.append("Reception")
    return sorted(set(vals))

def parse_group(text):
    m = re.search(r"\bGroup\s+\d+\b", text, re.I)
    return m.group(0) if m else None

def classify(lines, period_id):
    source = " ".join(lines).strip()
    if not source: return "UNCLASSIFIED", None
    upper = source.upper()
    if "LUNCH" in upper: return "LUNCH", None
    for code in sorted(KNOWN_CODES, key=len, reverse=True):
        if re.search(r"(^|\s)" + re.escape(code) + r"($|\s)", source): return "MEETING", code
    if period_id == "REG": return "REGISTRATION", None
    if period_id == "CCA": return "CCA", None
    if parse_subject(lines)[0]: return "TEACHING", None
    if re.fullmatch(r"[A-Z0-9 ]{2,10}", source): return "PROTECTED", source
    return "OTHER_COMMITMENT", None

def merge_columns(raw_cells):
    by_period = defaultdict(list)
    for period_id, lines in raw_cells:
        by_period[period_id].extend(lines)
    return {period["id"]: by_period.get(period["id"], []) for period in PERIODS}

def phase_from_refs(refs, registration):
    joined = " ".join(refs + ([registration] if registration else []))
    if re.search(r"EYFS|Nursery|Reception", joined, re.I): return "EYFS"
    if re.search(r"Year [1-6]|\bY[1-6][A-Z]?\b", joined): return "PRIMARY"
    if re.search(r"Year [7-9]|\bY[7-9][A-Z]?\b", joined): return "SECONDARY"
    return "CROSS_PHASE"

def role_from_subjects(codes):
    if codes & {"ARA","AR","PE","COMP","DRA","MUS","ART","FRE","SPA","LS"}: return "SPECIALIST_TEACHER"
    return "OTHER"

def build_lunches(people, entries):
    lunches, unresolved = [], []
    by_person_day = defaultdict(list)
    for e in entries:
        if e.get("personId"): by_person_day[(e["personId"], e["day"])].append(e)
        if e["status"] == "LUNCH" and e.get("personId"):
            lunches.append({"personId":e["personId"],"day":e["day"],"periodId":e["periodId"],"source":"PDF","notes":e["sourceText"]})
    for p in people:
        for day,_,_ in DAYS:
            taught = {e["periodId"] for e in by_person_day[(p["id"], day)] if e["status"] == "TEACHING"}
            if p["phase"] == "EYFS":
                lunches.append({"personId":p["id"],"day":day,"periodId":"L5","source":"ROLE_RULE","notes":"EYFS working lunch"})
            elif p["phase"] == "PRIMARY" and p["roleType"] != "SPECIALIST_TEACHER":
                lunches.append({"personId":p["id"],"day":day,"periodId":"L6A","source":"ROLE_RULE","notes":"Primary lunch starts 12:00"})
                lunches.append({"personId":p["id"],"day":day,"periodId":"L6B","source":"ROLE_RULE","notes":"Primary lunch protected until 13:00"})
            elif p["roleType"] == "SPECIALIST_TEACHER":
                if "L6A" in taught and "L6B" not in taught:
                    lunches.append({"personId":p["id"],"day":day,"periodId":"L6B","source":"SPECIALIST_RULE","notes":"Teaches L6A; L6B allocated lunch"})
                elif "L6B" in taught and "L6A" not in taught:
                    lunches.append({"personId":p["id"],"day":day,"periodId":"L6A","source":"SPECIALIST_RULE","notes":"Teaches L6B; L6A allocated lunch"})
                elif "L6A" in taught and "L6B" in taught:
                    unresolved.append({"personId":p["id"],"displayName":p["displayName"],"day":day,"reason":"Teaches both L6A and L6B"})
                else:
                    unresolved.append({"personId":p["id"],"displayName":p["displayName"],"day":day,"reason":"Teaches neither L6A nor L6B"})
    return lunches, unresolved

def build_import(pdf_path):
    people, entries, ignored, owner_pages = [], [], [], []
    posts = [{"id":f"post-{slug(n)}","name":n,"status":"VACANT","phase":"CROSS_PHASE","roleType":"LEADERSHIP" if n=="Arabic HOD" else "SPECIALIST_TEACHER","subject":"Arabic","sourcePage":None} for n in ["Arabic 1","Arabic 2","Arabic HOD","Arabic LS"]]
    with pdfplumber.open(pdf_path) as pdf:
        for page_no, page in enumerate(pdf.pages, 1):
            words = page.extract_words(x_tolerance=1, y_tolerance=3)
            owner = owner_from_words(words)
            owner_pages.append({"page":page_no,"owner":owner})
            if owner in IGNORED_RESOURCES:
                ignored.append({"name":owner,"page":page_no,"reason":"Duty Team resource intentionally ignored"}); continue
            kind = "VACANT_POST" if owner in VACANT_POSTS else "PERSON"
            owner_id = f"post-{slug(owner)}" if kind == "VACANT_POST" else f"person-{slug(owner)}"
            if kind == "VACANT_POST":
                for post in posts:
                    if post["name"] == owner: post["sourcePage"] = page_no
            else:
                parts = owner.split()
                people.append({"id":owner_id,"firstName":parts[1] if parts and parts[0] in {"Mr","Mrs","Ms"} and len(parts)>1 else parts[0],"lastName":parts[-1],"displayName":owner,"active":True,"phase":"CROSS_PHASE","roleType":"OTHER","subjects":[],"coverEligible":True,"coverPriority":"NORMAL","registrationGroupId":None,"sourcePage":page_no})
            subject_codes, refs, reg = set(), [], None
            for day,y0,y1 in DAYS:
                raw = [(period_id, cell_lines(words,y0,y1,x0,x1)) for x0,x1,period_id in RAW_COLUMNS]
                for period_id, lines in merge_columns(raw).items():
                    source = " | ".join(lines)
                    status, commitment = classify(lines, period_id)
                    code, subject, year = parse_subject(lines)
                    classes = parse_classes(source)
                    group = parse_group(source)
                    if code: subject_codes.add(code)
                    refs.extend(classes)
                    if period_id == "REG" and status == "REGISTRATION": reg = classes[0] if classes else source
                    entries.append({"id":f"entry-{slug(owner)}-{day.lower()}-{period_id.lower()}","timetableVersionId":"staff-timetable-2026-08-26","day":day,"periodId":period_id,"personId":owner_id if kind=="PERSON" else None,"postId":owner_id if kind=="VACANT_POST" else None,"teachingEventId":None,"subject":subject,"sourceSubjectCode":code,"classCodes":classes,"yearGroup":year,"groupCode":group,"room":lines[-1] if len(lines)>=3 else None,"commitmentCode":commitment,"status":status,"sourceFile":pdf_path.name,"sourcePage":page_no,"sourceOwner":owner,"sourceText":source,"ambiguous":status in {"UNCLASSIFIED","PROTECTED","OTHER_COMMITMENT"}})
            if kind == "PERSON":
                people[-1]["subjects"] = sorted(SUBJECT_NAMES.get(c,c.title()) for c in subject_codes)
                people[-1]["roleType"] = role_from_subjects(subject_codes)
                people[-1]["phase"] = phase_from_refs(refs, reg)
                people[-1]["registrationGroupId"] = reg
    event_map, events = {}, []
    for e in entries:
        if e["status"] not in {"TEACHING","REGISTRATION","CCA"}: continue
        key = json.dumps({"day":e["day"],"periodId":e["periodId"],"status":e["status"],"subject":e["subject"],"classes":e["classCodes"],"group":e["groupCode"],"room":e["room"] if e["status"]=="TEACHING" else None}, sort_keys=True)
        if key not in event_map:
            event_map[key] = f"event-{len(event_map)+1:04d}"
            events.append({"id":event_map[key],"day":e["day"],"periodId":e["periodId"],"subject":e["subject"],"classCodes":e["classCodes"],"yearGroup":e["yearGroup"],"groupCode":e["groupCode"],"room":e["room"],"assignedPersonIds":[],"assignedPostIds":[],"sourcePages":[]})
        e["teachingEventId"] = event_map[key]
        ev = next(item for item in events if item["id"] == event_map[key])
        if e.get("personId") and e["personId"] not in ev["assignedPersonIds"]: ev["assignedPersonIds"].append(e["personId"])
        if e.get("postId") and e["postId"] not in ev["assignedPostIds"]: ev["assignedPostIds"].append(e["postId"])
        if e["sourcePage"] not in ev["sourcePages"]: ev["sourcePages"].append(e["sourcePage"])
    lunches, unresolved = build_lunches(people, entries)
    issues = []
    for e in entries:
        if e["status"] == "UNCLASSIFIED": issues.append({"severity":"WARNING","type":"UNCLASSIFIED_PERIOD","message":f"{e['sourceOwner']} {e['day']} {e['periodId']}"})
        elif e["ambiguous"]: issues.append({"severity":"WARNING","type":"AMBIGUOUS_ENTRY","message":f"{e['sourceOwner']} {e['day']} {e['periodId']}: {e['sourceText']}"})
        if e["status"] == "TEACHING" and not e["classCodes"]: issues.append({"severity":"WARNING","type":"MISSING_CLASS","message":e["id"]})
    for lunch in unresolved: issues.append({"severity":"WARNING","type":"UNRESOLVED_SPECIALIST_LUNCH","message":f"{lunch['displayName']} {lunch['day']}: {lunch['reason']}"})
    no_reg = [p["displayName"] for p in people if not p["registrationGroupId"]]
    multi = [ev for ev in events if len(ev["assignedPersonIds"])+len(ev["assignedPostIds"])>1]
    summary = {"timetableVersion":"Staff Timetable 26 Aug 2026","namedStaffImported":len(people),"activeStaff":len(people),"vacantPosts":len(posts),"ignoredResources":[i["name"] for i in ignored],"registrationAssigned":len(people)-len(no_reg),"noRegistration":len(no_reg),"staffWithoutRegistration":no_reg,"teachingEvents":len(events),"timetableEntries":len(entries),"entriesByWeekday":dict(Counter(e["day"] for e in entries)),"multiTeacherEvents":len(multi),"setGroupTeachingEvents":len([ev for ev in events if ev.get("groupCode")]),"protectedCommitments":len([e for e in entries if e["status"]=="MEETING"]),"unresolvedLunches":len(unresolved),"unclassifiedPeriods":len([e for e in entries if e["status"]=="UNCLASSIFIED"]),"validationErrors":0,"validationWarnings":len(issues),"validationIssues":issues,"ownerPages":owner_pages}
    return {"timetableVersion":{"id":"staff-timetable-2026-08-26","name":"Staff Timetable 26 Aug 2026","effectiveFrom":"2026-08-26","active":True},"schoolPeriods":PERIODS,"commitmentCodes":[{"code":c,"label":f"{c} meeting","category":"MEETING","coverEligible":False,"protected":True} for c in sorted(KNOWN_CODES)],"people":people,"posts":posts,"ignoredResources":ignored,"teachingEvents":events,"timetableEntries":entries,"lunchAllocations":lunches,"coverLoads":{p["id"]:{"today":0,"week":0,"term":0,"minutes":0} for p in people},"summary":summary,"validationIssues":issues}

def write_outputs(data):
    IMPORT_JSON.parent.mkdir(parents=True, exist_ok=True); SRC_IMPORT_JSON.parent.mkdir(parents=True, exist_ok=True); REPORT_MD.parent.mkdir(parents=True, exist_ok=True); SOURCE_TS.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(data, indent=2)
    IMPORT_JSON.write_text(payload, encoding="utf-8")
    SRC_IMPORT_JSON.write_text(payload, encoding="utf-8")
    SOURCE_TS.write_text('import importedTimetableData from "./imported/staff-26aug.json";\n\nexport default importedTimetableData;\n', encoding="utf-8")
    s = data["summary"]
    machine = {k:s[k] for k in ["timetableVersion","namedStaffImported","vacantPosts","ignoredResources","registrationAssigned","noRegistration","teachingEvents","timetableEntries","multiTeacherEvents","protectedCommitments","unresolvedLunches","unclassifiedPeriods","validationErrors","validationWarnings"]}
    report = ["# Staff Timetable 26 Aug 2026 Import Validation", "", "## Machine Summary", "", "```json", json.dumps(machine, indent=2), "```", "", "## Staff Without Registration", "", *(f"- {n}" for n in s["staffWithoutRegistration"]), "", "## Import Exclusions", "", *(f"- {i['name']}: {i['reason']}" for i in data["ignoredResources"]), "", "## Validation Issues", "", *(f"- {i['severity']} / {i['type']}: {i['message']}" for i in data["validationIssues"][:700])]
    REPORT_MD.write_text("\n".join(report)+"\n", encoding="utf-8")


def summary_for_console(summary):
    keys = ["timetableVersion","namedStaffImported","activeStaff","vacantPosts","ignoredResources","registrationAssigned","noRegistration","staffWithoutRegistration","teachingEvents","timetableEntries","entriesByWeekday","multiTeacherEvents","setGroupTeachingEvents","protectedCommitments","unresolvedLunches","unclassifiedPeriods","validationErrors","validationWarnings"]
    return {key: summary[key] for key in keys}
def main():
    pdf_path = Path(" ".join(sys.argv[1:]).strip('"') or DEFAULT_PDF)
    if not pdf_path.exists(): raise SystemExit(f"PDF not found: {pdf_path}")
    data = build_import(pdf_path); write_outputs(data); print(json.dumps(summary_for_console(data["summary"]), indent=2))
if __name__ == "__main__": main()




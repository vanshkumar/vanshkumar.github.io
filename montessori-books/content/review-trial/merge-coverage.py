"""Join saved coverage into one editorial queue. Never infer meaning or approval."""
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FULL = '--full' in sys.argv
OUT = ROOT / ('content/editorial/coverage' if FULL else 'content/review-trial')
AGES = ['0-3', '3-6', '6-9', '9-12', '12-18', '18-24', '24-36']

def load(name):
    text = (ROOT / name).read_text()
    return [json.loads(line) for line in text.splitlines() if line] if name.endswith('.jsonl') else json.loads(text)

def sha(name):
    return hashlib.sha256((ROOT / name).read_bytes()).hexdigest()

# Explicit latest saved mappings; historical revisions remain untouched.
inputs = [
    ('content/pilots/revisions/r08/COVERAGE_RECONCILIATION.jsonl', 'pilot-stage'),
    ('tmp/birth-6/root/coverage-working.json', 'draft'),
    ('tmp/birth-6/root/coverage-pending.json', 'pending'),
    ('content/birth-6/authoring/activities-COVERAGE_SUGGESTIONS-r01.json', 'suggestion'),
    ('content/birth-6/authoring/care-coverage-decisions-r01.json', 'draft'),
    ('content/6-18/drafts/baby-play/COVERAGE-r03.jsonl', 'draft'),
    ('content/6-18/drafts/shared-placements/COVERAGE_PARENT_INTENTS.jsonl', 'draft'),
    ('content/6-18/drafts/baby-care/draft-r02.json', 'provenance'),
    ('content/18-36/source-work/play-COVERAGE-r01.jsonl', 'draft'),
    ('content/18-36/source-work/care-author/COVERAGE-r02.jsonl', 'draft'),
    ('content/18-36/source-work/family-author/COVERAGE-r02.jsonl', 'draft'),
    ('content/18-36/source-work/root-context-decisions-r01.json', 'draft'),
    ('content/18-36/source-work/root-family-MAPPING-r01.json', 'suggestion'),
    ('content/18-36/source-work/root-no-performance-MAPPING-r01.json', 'suggestion'),
]
if FULL:
    inputs.append(('content/editorial/COVERAGE_DECISIONS-r01.json', 'editor-decision'))
    inputs.append(('content/editorial/COVERAGE_DECISIONS-r02.json', 'editor-decision'))
    inputs.append(('content/editorial/COVERAGE_DECISIONS-r03.json', 'editor-decision'))
    for owner, revision in load('content/editorial/ACTIVE_REVISIONS.json').items():
        manifest = load(f'content/{owner}/revisions/{revision}/MANIFEST.json')
        for source in manifest['sources']:
            inputs.append((source['path'], 'provenance'))
ledger = {}
sources = []
for book, source_id in [('baby', 'baby-2021'), ('toddler', 'toddler-2019')]:
    name = f'research/{book}/COVERAGE_LEDGER.jsonl'
    records = load(name)
    sources.append({'path': name, 'sha256': sha(name), 'ideas': len(records)})
    for line, row in enumerate(records, 1):
        assert row['id'] not in ledger
        ledger[row['id']] = {'sourceIdeaId': row['id'], 'sourceId': source_id,
                             'sourceRecord': {'path': name, 'line': line}, 'mappings': []}
assert len(ledger) == 1309
imported, unknown = [], []
for name, state in inputs:
    data = load(name)
    if state == 'provenance':
        rows = [dict(row, targetIds=[row['entryId']],
                     placementIds=[p['id'] for p in data.get('placements', []) if p['entryId'] == row['entryId']],
                     ageIds=[p['ageId'] for p in data.get('placements', []) if p['entryId'] == row['entryId']])
                for row in data.get('provenance', [])]
    else:
        rows = data.get('decisions', data.get('entries', data)) if isinstance(data, dict) else data
    if isinstance(rows, dict):
        rows = [dict(value, sourceIdeaId=key) for key, value in rows.items()]
    imported.append({'path': name, 'sha256': sha(name), 'records': len(rows), 'state': state})
    for index, row in enumerate(rows):
        ids = row.get('sourceIdeaIds') or [row.get('sourceIdeaId')]
        for idea in ids:
            if idea is None and state == 'provenance':
                continue  # Frozen-reuse provenance can contain no coverage claim.
            if idea not in ledger:
                unknown.append({'path': name, 'index': index, 'sourceIdeaId': idea})
                continue
            # Keep authored meaning/qualifications, with no promotion of draft targets.
            fields = ['variant', 'entryId', 'ages', 'ageId', 'ageIds', 'disposition', 'dispositionSuggestion',
                      'reason', 'targetIds', 'suggestedTargets', 'placementIds', 'contextTargets',
                      'heldDetails', 'heldInterpretation', 'sourceHolds', 'baseTargets',
                      'baseDisposition', 'baseReason', 'evidenceAge', 'contextUse',
                      'authorRecord', 'evidenceIds', 'allocation']
            mapping = {key: row[key] for key in fields if key in row}
            mapping.update(origin={'path': name, 'recordIndex': index}, state=state)
            ledger[idea]['mappings'].append(mapping)
assert not unknown, f'Unknown source IDs: {unknown[:5]}'
unassigned = conflicts = 0
for row in ledger.values():
    by_age = {age: [] for age in AGES}
    for mapping in row['mappings']:
        for age in mapping.get('ageIds', mapping.get('ages', [mapping.get('ageId')])):
            if age in by_age:
                by_age[age].append(mapping)
    row['agesWithoutExplicitMapping'] = [age for age, values in by_age.items() if not values]
    row['possibleConflicts'] = []
    for age, values in by_age.items():
        variants = {}
        for value in values:
            if value['state'] in ['suggestion', 'pending', 'provenance']:
                continue
            key = json.dumps(value.get('variant'), sort_keys=True)
            signature = json.dumps([value.get('disposition'), sorted(value.get('targetIds', [])),
                                    sorted(value.get('placementIds', []))], sort_keys=True)
            variants.setdefault(key, set()).add(signature)
        if any(len(signatures) > 1 for signatures in variants.values()):
            row['possibleConflicts'].append(age)
    unassigned += len(row['agesWithoutExplicitMapping'])
    conflicts += len(row['possibleConflicts'])
OUT.mkdir(exist_ok=True)
(OUT / 'COVERAGE.jsonl').write_text(''.join(json.dumps(row, ensure_ascii=False) + '\n' for row in ledger.values()))
summary = {'sourceIdeas': len(ledger), 'sourceLedgers': sources, 'inputs': imported,
           'mappingRecords': sum(len(row['mappings']) for row in ledger.values()),
           'ageCellsWithoutExplicitMapping': unassigned, 'possibleConflictCells': conflicts,
           'unknownSourceIds': unknown, 'publication': False,
           'boundary': ('Raw historical editorial queue. Stage omissions and differing valid targets are retained, not treated as missing content. RESOLVED_COVERAGE.jsonl contains the editor-selected meanings; actual age qualifications remain in AGE_PLACEMENT_INDEX.json. This queue is never an approval.' if FULL else 'An editorial queue, not a completeness verdict. Missing age mappings need applicability decisions; possible conflicts need interpretation. Drafts and suggestions are never approvals. Only trial-linked meanings are resolved in this run.')}
(OUT / 'COVERAGE_SUMMARY.json').write_text(json.dumps(summary, indent=2) + '\n')
print(json.dumps({key: value for key, value in summary.items() if key not in ['inputs', 'sourceLedgers']}))

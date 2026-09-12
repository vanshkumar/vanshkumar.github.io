"""Join the editor's explicit decisions and retained authored mappings. No text verdicts."""
import hashlib
import json
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'content/editorial/coverage'
def read(path):
    return json.loads((ROOT / path).read_text())
def sha(path):
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()
def write(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

entries, placements, provenance = {}, {}, {}
for owner, revision in read('content/editorial/ACTIVE_REVISIONS.json').items():
    base = f'content/{owner}/revisions/{revision}'
    manifest = read(f'{base}/MANIFEST.json')
    payload = read(f'{base}/payload.json')
    for entry in payload['entries']:
        assert entry['id'] not in entries or entries[entry['id']] == entry
        entries[entry['id']] = entry
    for placement in payload['placements']:
        assert placement['id'] not in placements or placements[placement['id']] == placement
        placements[placement['id']] = placement
    for source in manifest['sources']:
        for evidence in read(source['path']).get('placementEvidence', []):
            provenance[evidence['placementId']] = {'path': source['path'], 'sha256': sha(source['path']), 'evidence': evidence}
pilot = read('content/pilots/revisions/r08/MANIFEST.json')
for snapshot in pilot['snapshots']:
    provenance.setdefault(snapshot['placementId'], {'path': snapshot['path'], 'sha256': sha(snapshot['path']), 'boundary': 'Frozen pilot age evidence and exact approvals retained through its integration receipt.'})
assert len(entries) == 174 and len(placements) == 645
assert set(provenance) == set(placements)
def entry_target(target):
    # One saved author mixed exact placement IDs with body IDs in targetIds.
    # Resolve only an actually present identifier; never guess by string slicing.
    return target if target in entries else placements.get(target, {}).get('entryId')
write('AGE_PLACEMENT_INDEX.json', {'boundary': 'Actual current presentation and its private age/readiness evidence. Target presence is not a claim that every source variant applies at every target age.', 'placements': [{'placement': p, 'ageEvidence': provenance[p['id']]} for p in placements.values()]})

research = {r['id']: r for book in ['baby', 'toddler'] for r in map(json.loads, (ROOT / f'research/{book}/COVERAGE_LEDGER.jsonl').read_text().splitlines())}
queue = list(map(json.loads, (OUT / 'COVERAGE.jsonl').read_text().splitlines()))
resolved, missing, invalid = [], [], []
for row in queue:
    source = research[row['sourceIdeaId']]
    authored = [m for m in row['mappings'] if m['state'] not in ['pending', 'suggestion', 'provenance'] and m.get('reason') and m.get('disposition')]
    editor = [m for m in authored if m['state'] == 'editor-decision']
    # Editorial policy: explicit latest root correction governs its source idea.
    # Otherwise preserve authored positive/context treatments with real bodies;
    # an earlier stage's omission never cancels a later authored treatment.
    retained = [m for m in authored if m['disposition'] in ['included', 'combined', 'context-only'] and any(entry_target(t) for t in m.get('targetIds', []))]
    selected = editor[-1:] or retained
    if selected:
        for m in selected:
            if m['disposition'] in ['included', 'combined']:
                invalid.extend({'idea': row['sourceIdeaId'], 'target': t, 'origin': m['origin']} for t in m.get('targetIds', []) if not entry_target(t))
        positive = [m for m in selected if m['disposition'] in ['included', 'combined']]
        primary = (positive or selected)[0]
        disposition, reason = primary['disposition'], primary['reason']
        target_ids = sorted({entry_target(t) for m in selected for t in m.get('targetIds', []) if entry_target(t)})
        basis = 'Explicit root decision' if editor else 'Retained authored mappings; target text and each age presentation reviewed separately'
    elif source['disposition'] in ['context-only', 'excluded']:
        disposition, reason, target_ids = source['disposition'], source['reason'], []
        basis = 'Original audited research scope decision; source-idea/evidence crosslinks retained below'
    else:
        missing.append(row['sourceIdeaId'])
        continue
    holds = []
    for m in row['mappings']:
        for key in ['heldDetails', 'heldInterpretation', 'sourceHolds']:
            if m.get(key):
                item = {'origin': m['origin'], 'kind': key, 'value': m[key]}
                if item not in holds:
                    holds.append(item)
    resolved.append({'sourceIdeaId': row['sourceIdeaId'], 'sourceId': row['sourceId'], 'sourceRecord': row['sourceRecord'],
        'disposition': disposition, 'reason': reason, 'targetIds': target_ids, 'decisionBasis': basis,
        'retainedTreatments': selected,
        'targetPresentations': [p['id'] for p in placements.values() if p['entryId'] in target_ids],
        'sourceScope': {k: source[k] for k in ['sourceIdea', 'disposition', 'reason', 'targetIds', 'evidenceIds', 'openQuestions', 'unresolvedQuestions'] if k in source},
        'heldDetails': holds,
        'historicalMappings': {'path': 'content/editorial/coverage/COVERAGE.jsonl', 'sourceIdeaId': row['sourceIdeaId']},
        'boundary': 'Only the retained treatment is claimed. Source ages, variants and held details are not inferred from the browse band; see exact AGE_PLACEMENT_INDEX records. Coverage joins do not issue review approvals.'})
assert not missing, missing
assert not invalid, {'count': len(invalid), 'first': invalid[:4]}
assert len(resolved) == len(research) == 1309
(OUT / 'RESOLVED_COVERAGE.jsonl').write_text(''.join(json.dumps(r, ensure_ascii=False) + '\n' for r in resolved))
summary = {'sourceIdeas': len(resolved), 'dispositions': dict(Counter(r['disposition'] for r in resolved)), 'entries': len(entries), 'placements': len(placements), 'unresolvedSourceIdeas': missing, 'invalidIncludedTargets': invalid, 'publication': False,
    'boundary': 'Editorial allocation complete. Independent exact text, illustration and final integration checks remain separate blocking gates.',
    'files': [{'path': f'content/editorial/coverage/{name}', 'sha256': sha(f'content/editorial/coverage/{name}')} for name in ['COVERAGE.jsonl', 'RESOLVED_COVERAGE.jsonl', 'AGE_PLACEMENT_INDEX.json']]}
write('RESOLUTION_SUMMARY.json', summary)
print(json.dumps({k: v for k, v in summary.items() if k != 'files'}))

"""Expose existing age evidence in unreviewed contexts; no new source claims."""
import json
from pathlib import Path
import hashlib
import sys

owner, current, next_revision = sys.argv[1:]
read = lambda name: json.loads(Path(name).read_text())
manifest = read(f'content/{owner}/revisions/{current}/MANIFEST.json')
payload = read(f'content/{owner}/revisions/{current}/payload.json')
entries = {entry['id']: entry for entry in payload['entries']}
verdicts = {'source': {}, 'tone': {}}
# Explicit chronological decisions preserve already-approved exact contexts.
if owner == 'birth-6':
    for stem in ['trial', 'early-play-a', 'early-play-b']:
        for revision in ['r01', 'r02']:
            for role in verdicts:
                path = f'content/{owner}/reviews/decisions/{stem}-{role}-{revision}.json'
                if Path(path).exists():
                    for decision in read(path)['decisions']:
                        for pid in decision['placementIds']:
                            verdicts[role][pid] = decision['verdict']
approved = {pid for pid, verdict in verdicts['source'].items()
            if verdict == 'pass' and verdicts['tone'].get(pid) == 'pass'}

def pages(refs):
    result = {}
    for ref in refs:
        result.setdefault(ref['sourceId'], set()).update(
            p for span in ref['pdfPages'] for p in range(span['start'], span['end'] + 1))
    return result

def ranges(values):
    runs = []
    for value in sorted(values):
        if runs and runs[-1][-1] + 1 == value:
            runs[-1].append(value)
        else:
            runs.append([value])
    return ', '.join(str(run[0]) if len(run) == 1 else f'{run[0]}–{run[-1]}' for run in runs)

inputs, changes = [], []
directory = Path(f'content/{owner}/drafts/editorial-{next_revision}')
directory.mkdir(parents=True, exist_ok=True)
for index, source in enumerate(manifest['sources']):
    draft = read(source['path'])
    evidence = {e['placementId']: e for e in draft.get('placementEvidence', [])}
    changed = False
    for placement in draft.get('placements', []):
        pid = placement['id']
        if pid in approved or not placement.get('ageContext'):
            continue
        age = evidence[pid]
        refs = [ref for key in ['sourceAge', 'readiness', 'editorialPlacement']
                for ref in age.get(key, {}).get('references', [])]
        required = pages(refs)
        visible = pages(entries[placement['entryId']]['references'])
        missing = {book: values - visible.get(book, set()) for book, values in required.items()}
        labels = [f'{"The Montessori Baby" if book == "baby-2021" else "The Montessori Toddler"}, PDF pp. {ranges(values)}'
                  for book, values in missing.items() if values]
        if not labels:
            continue
        before = placement['ageContext'].get('note', '')
        addition = 'Age and readiness sources: ' + '; '.join(labels) + '.'
        if addition in before:
            continue
        placement['ageContext']['note'] = (before + ' ' + addition).strip()
        changes.append({'placementId': pid, 'before': before, 'after': placement['ageContext']['note']})
        changed = True
    if changed:
        draft['author'] = {'task': '/root', 'reasoning': 'xhigh', 'priorAuthor': draft['author'],
                           'editorialAmendment': 'Expose existing structured age/readiness page references; no canonical body edits.'}
        target = directory / f'{index + 1:02d}.json'
        with target.open('x') as file:
            file.write(json.dumps(draft, indent=2, ensure_ascii=False) + '\n')
        inputs.append(str(target))
    else:
        inputs.append(source['path'])
record = {'owner': owner, 'revision': f'content/{owner}/revisions/{next_revision}',
          'priorManifest': {'path': f'content/{owner}/revisions/{current}/MANIFEST.json',
                            'sha256': hashlib.sha256(Path(f'content/{owner}/revisions/{current}/MANIFEST.json').read_bytes()).hexdigest()},
          'inputs': inputs, 'changes': changes, 'approvedPlacementsPreserved': sorted(approved)}
Path(f'content/editorial/{owner}-{next_revision}-citations.json').write_text(json.dumps(record, indent=2, ensure_ascii=False) + '\n')
print(json.dumps({'owner': owner, 'changedContexts': len(changes), 'alreadyApprovedUntouched': len(approved)}))

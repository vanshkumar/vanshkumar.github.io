"""Recover a paused author's unfinished builder; never assert borrowed reading."""
from pathlib import Path
import hashlib

source = Path('tmp/6-18/toddler-overlap/build-draft.py')
text = source.read_text()
output = Path('content/6-18/drafts/toddler-overlap')
output.mkdir(parents=True, exist_ok=True)
assert not (output / 'draft-r01.json').exists()
text = text.replace("DATE = '2026-09-10'", "DATE = '2026-09-12'")
text = text.replace("not part of this entry.'])))", "not part of this entry.']))")
text = text.replace("put('READ_LOG.json',", "put('RECOVERED_AUTHOR_NOTES.json',")
text = text.replace('content/6-18/drafts/toddler-overlap/READ_LOG.json',
                    'content/6-18/drafts/toddler-overlap/RECOVERED_AUTHOR_NOTES.json')
text = text.replace("'mode':'full-text'", "'mode':'unverified-recovered-author-note'")
text = text.replace("'mode':'visual'", "'mode':'unverified-recovered-author-note'")
origin = {'path': str(source), 'sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
          'originalWriter': '/root/s6_toddler_overlap_author',
          'boundary': 'Recovered unfinished draft. Original writer reading claims are unverified notes, not editor reads or content approval.'}
text = text.replace("put('draft-r01.json',draft)",
                    "draft['author']={'task':'/root','reasoning':'xhigh','recoveredFrom':" + repr(origin) + "}\nput('draft-r01.json',draft)")
# One global ledger replaces the original builder's three-age full-book copy.
text = text.split('# Full identity-preserving coverage')[0]
exec(compile(text, str(source), 'exec'))
print('Recovered unreviewed draft and source-unit intentions.')

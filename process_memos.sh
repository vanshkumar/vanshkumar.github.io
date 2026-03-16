#!/bin/zsh
set -euo pipefail

# ── Configuration ──────────────────────────────────────────────
VAULT_DIR="$(cd "$(dirname "$0")" && pwd)/vault"
MEMOS_DIR="$HOME/Library/Group Containers/group.com.apple.VoiceMemos.shared/Recordings"
VOICE_INBOX="${VAULT_DIR}/voice inbox"
LEDGER="${VOICE_INBOX}/.processed"

# ── Helpers ────────────────────────────────────────────────────
die() { echo "error: $1" >&2; exit 1; }

check_deps() {
  command -v claude >/dev/null || die "claude not found"
  command -v python3 >/dev/null || die "python3 not found"
  command -v fswatch >/dev/null || die "fswatch not found (brew install fswatch)"
  if ! command -v whisper >/dev/null; then
    echo "warning: whisper not found, will only use Apple transcripts" >&2
  fi
}

is_processed() {
  [[ -f "$LEDGER" ]] && grep -qFx "$1" "$LEDGER"
}

mark_processed() {
  echo "$1" >> "$LEDGER"
}

# Extract Apple's built-in transcript from the tsrp atom in an m4a file
extract_apple_transcript() {
  python3 -c "
import struct, json, sys

def extract(filename):
    with open(filename, 'rb') as f:
        file_size = f.seek(0, 2)
        f.seek(0)
        end = file_size
        for target in ['moov', 'trak', 'udta', 'tsrp']:
            found = False
            while f.tell() < end:
                pos = f.tell()
                header = f.read(8)
                if len(header) < 8: return ''
                size = struct.unpack('>I', header[:4])[0]
                atype = header[4:8].decode('ascii', errors='ignore')
                if size == 1: size = struct.unpack('>Q', f.read(8))[0]
                if size == 0: return ''
                if atype == target:
                    end = pos + size
                    found = True
                    break
                f.seek(pos + size)
            if not found: return ''
        data = f.read(end - f.tell())
        obj = json.loads(data.decode('utf-8'))
        runs = obj.get('attributedString', {})
        if isinstance(runs, dict): runs = runs.get('runs', [])
        return ''.join(r for r in runs if isinstance(r, str))

print(extract(sys.argv[1]))
" "$1"
}

# True if no .md files in the voice inbox (suggestions cleared)
inbox_is_clear() {
  local count
  count=$(find "$VOICE_INBOX" -maxdepth 1 -name '*.md' 2>/dev/null | wc -l)
  [[ $count -eq 0 ]]
}

wait_for_clear_inbox() {
  if inbox_is_clear; then return; fi
  echo "⏳ waiting for pending suggestions in voice inbox to be reviewed..."
  while ! inbox_is_clear; do
    fswatch -1 --event Removed --event Renamed "$VOICE_INBOX" >/dev/null 2>&1
  done
  echo "✅ inbox clear, continuing."
}

build_vault_index() {
  # Lightweight index: path | title | wikilinks | first ~200 chars
  find "$VAULT_DIR" -name '*.md' ! -path '*/voice inbox/*' | sort | while read -r f; do
    local rel="${f#$VAULT_DIR/}"
    local title
    title=$(head -5 "$f" | grep -m1 '^#' | sed 's/^#* *//' || basename "$f" .md)
    local links
    links=$(grep -oE '\[\[[^]]+\]\]' "$f" 2>/dev/null | tr '\n' ' ' || true)
    local summary
    summary=$(head -20 "$f" | tail -15 | tr '\n' ' ' | cut -c1-200)
    echo "- **${rel}** | ${title} | links: ${links}| ${summary}"
  done
}

process_one() {
  local memo="$1"
  local name
  name=$(basename "$memo")

  if is_processed "$name"; then
    echo "  skipping (already processed): $name"
    return
  fi

  wait_for_clear_inbox

  # Extract transcript inline
  local transcript
  transcript=$(extract_apple_transcript "$memo" 2>/dev/null || true)
  if [[ -z "$transcript" ]]; then
    if command -v whisper >/dev/null; then
      echo "  no Apple transcript, using Whisper: $name" >&2
      transcript=$(whisper "$memo" --model small --output_format txt --output_dir /tmp 2>/dev/null && cat "/tmp/$(basename "$memo" .m4a).txt" && rm -f "/tmp/$(basename "$memo" .m4a).txt")
    else
      echo "  skipping (no Apple transcript and whisper not installed): $name" >&2
      return
    fi
  else
    echo "  extracted Apple transcript: $name" >&2
  fi

  if [[ -z "$transcript" ]]; then
    echo "  skipping (empty transcript): $name" >&2
    return
  fi

  echo ""
  echo "building vault index..."
  local vault_index
  vault_index=$(build_vault_index)

  local stem
  stem=$(basename "$memo" .m4a)
  local outfile="${VOICE_INBOX}/${stem}-suggestions.md"

  echo "sending to claude (with tool use)..."
  echo "  output → $outfile"
  echo ""

  local prompt="You are a routing agent for a personal research vault in Obsidian.
Your job: extract ideas from a voice memo transcript, find where they belong in the vault, and suggest placements.

The vault is at: ${VAULT_DIR}

=== VAULT TAXONOMY ===
The vault is organized into these categories:

- **traces/** — Atomic notes. Declarative-statement titles (e.g. 'Learning is brain-wide network reorganization, not local rewiring'). 100-400 words, densely wikilinked to other traces. Building blocks of thinking. Not published on the site.
- **probes/** — Evergreen questions. Titles are open questions (e.g. 'What does it mean to understand the brain?'). 400-1500 words, synthesize multiple traces. Living documents that grow over time.
- **writing inbox/** — Rough drafts, stubs, partially developed ideas. Staging area before something becomes a trace or probe. Has subdirectories by topic (e.g. \`neuro/\`, \`ml/\`). New raw ideas usually start here.
- **attractors/** — Polished projects and essays with narrative arc. The 'publications'. Rarely the right target for raw memo content.
- **logs/** — Day-by-day working journals tied to specific attractors. Only route here if the content is directly about progress on an ongoing attractor project.
- **pages/** — Site infrastructure (about, now, etc.). Do not route here.

Routing heuristic:
- A crisp atomic insight → \`writing inbox/<topic>/\` (it needs development before becoming a trace)
- An open question or research direction → \`probes/\`
- Progress notes on an active attractor project → \`logs/\` (check attractors/ first to confirm the project exists)
- If the idea clearly fits an existing note → APPEND to that note

=== VAULT INDEX ===
Each entry: path | title | wikilinks | snippet

${vault_index}

=== TRANSCRIPT: ${stem} ===
${transcript}

=== INSTRUCTIONS ===
1. Extract every discrete idea, question, or insight from the transcript. Voice memos ramble — pull out the actual intellectual content.
2. For each extracted idea, use the Glob and Grep tools to search the vault for related notes, then use the Read tool to read the full contents of any that seem relevant. Read as many as you need — it's better to read a note and rule it out than to miss a connection. You MUST read before suggesting.
3. After reading, for each idea suggest ONE of:
   - **APPEND** to [[folder/Note title]]: quote the section where it fits, and explain why.
   - **CREATE** [[folder/Note title]]: draft content with wikilinks to related existing notes.
   - **REVISE** [[folder/Note title]]: when the memo contradicts, supersedes, or significantly refines something already in the vault. Quote the specific passage that's in tension with the new idea and explain the conflict. Do NOT draft the rewrite — just flag the tension clearly so I can decide how to resolve it.
4. Always reference notes as Obsidian wikilinks. Do NOT use backtick code paths.
   - For **existing** notes, use just the note name: [[Do I want to do a formal PhD program?]]. Obsidian resolves unique names automatically.
   - For **new** notes (CREATE), include the full path so Obsidian creates the file in the right folder: [[writing inbox/neuro/Some new idea]].
5. Quote the relevant part of the transcript for each suggestion.
6. If an idea connects multiple existing notes, say so and explain the connection.

Be direct. No filler. No preamble."

  echo "$prompt" | claude -p --allowedTools Read,Grep,Glob | tee "$outfile"

  mark_processed "$name"
  echo ""
  echo "✅ processed: $name → $outfile"
}

# ── Main ───────────────────────────────────────────────────────
check_deps
mkdir -p "$VOICE_INBOX"
touch "$LEDGER"

# Manual mode: process specific files and exit
if [[ $# -gt 0 ]]; then
  for memo in "$@"; do
    process_one "$memo"
  done
  exit 0
fi

# Watcher mode: process existing unprocessed memos, then watch for new ones
echo "🎙️  memo watcher started"
echo "   watching: $MEMOS_DIR"
echo "   output:   $VOICE_INBOX"
echo ""

# Process any existing unprocessed memos first
for memo in "$MEMOS_DIR"/*.m4a(N); do
  process_one "$memo"
done

echo ""
echo "👀 watching for new memos..."

# Watch for new files
fswatch -0 --event Created "$MEMOS_DIR" | while IFS= read -r -d '' event; do
  if [[ "$event" == *.m4a ]]; then
    echo ""
    echo "📝 new memo detected: $(basename "$event")"
    process_one "$event"
    echo ""
    echo "👀 watching for new memos..."
  fi
done

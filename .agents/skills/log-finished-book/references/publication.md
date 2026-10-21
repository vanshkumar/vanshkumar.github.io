# Validate and publish through GitHub

Repository: `vanshkumar/vanshkumar.github.io`; branch: `main`.
Public log: `https://vanshkumar.net/shelf#reading-log`.
Stats: `https://vanshkumar.net/shelf/stats`.

## Prepare and validate

Use an isolated cloud checkout of current `main`; fetch the current branch and
record its commit SHA and tree SHA. A cached environment or stale chat workspace
is not authoritative. If the existing workspace contains unrelated changes,
preserve them and use a clean checkout instead of resetting, cleaning, or broadly
staging it. Read repository instructions from the refreshed revision.

Discover available GitHub read/write tools and research capabilities before
promising publication. If this cloud environment lacks required authentication,
network access, Node 24, or tools, keep the enriched result in chat and state the
missing capability. Do not silently switch to the reader's Mac or an API service.

Apply the validated payload with the helper. Review the diff: an ordinary capture
changes only the intended `vault/reading-log/*.md` file. A genuinely new learning
required by repository instructions may also be included as an explicitly reviewed
`LEARNINGS.md` change; do not write a routine learning per book. Never include
temporary payloads, generated `src/content/`, test fixtures, Shelf membership, or
unrelated working-tree changes.

Run both, waiting for their exit status:

```sh
npm test
npm run build
```

The full root build includes content sync, Astro, and post-build verification.
Astro's own success line is not enough. Any failure blocks publication. Do not
weaken checks, skip a failing step, or make unrelated code changes during capture.

## Publish the exact validated tree

Use connected GitHub tools with an expected-head conditional update. Discover
their current names/schema; the GitHub plugin provides `fetch`, `create_tree`,
`create_commit`, and `update_ref`.

1. Read `https://api.github.com/repos/vanshkumar/vanshkumar.github.io/git/ref/heads/main`.
   The branch head must still equal the validated base SHA.
2. Create a tree with `base_tree_sha` set to that base commit's tree SHA. Supply
   only explicit intended paths, exact validated UTF-8 contents, mode `100644`,
   and type `blob`. Never omit the base tree (that would remove other files).
3. Create a commit with the validated base as its sole parent and a clear message
   such as `Log <title> finished <date>`.
4. Update `main` with `expected_sha` equal to the validated base and `force: false`.
   Do not use an unconditional contents write or force-push.
5. A stale head means refresh, re-inspect the work, reapply the intended payload,
   and rerun **both** checks on the new base. A concurrent identical submission
   becomes `already-logged`. After two races, retain the result and report the
   contention instead of looping indefinitely.
6. If the update's outcome is unknown, read the ref, commit ancestry, and target
   file before retrying. Recognize an already-applied commit and avoid duplicates.

If these tools are unavailable or permission is denied, stop before publication,
retain the validated record in chat, and explain how to reconnect GitHub. Do not
assume this desktop chat's permissions exist in a different cloud environment.

## Verify deployment

Find the **push** run for the actual new commit in `.github/workflows/deploy.yml`.
The generic GitHub fetch tool can read:

`https://api.github.com/repos/vanshkumar/vanshkumar.github.io/actions/workflows/deploy.yml/runs?head_sha=<COMMIT>&event=push`

Some convenience workflow tools only report pull-request runs, so an empty result
from those tools is not evidence about Pages deployment. Inspect the exact run
and its jobs; require workflow success and the Pages deploy job's success. A build
job alone, older successful run, or accepted branch update does not prove this
record deployed. Poll with reasonable spacing and keep the reader informed.

For a queued/running run, say **committed; deployment pending**, with the commit
and run link. For a failed run, say **committed; deployment failed**, with the
failure and next action. Never revert other changes to repair deployment. If a
newer commit cancels this run, verify the descendant still contains the record
and that its deployment succeeds before reporting published.

After deployment, fetch the live Shelf and stats pages and verify the intended
record/date and intact statistics. Do not compare against a permanently fixed
book count. If live verification is unavailable, state that limit explicitly.
Only then confirm the book, exact completion date, and public log link as published.

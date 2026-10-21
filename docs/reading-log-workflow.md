# Finished books from mobile Codex

The normal message in the dedicated **Reading log** Codex Cloud chat is a book
and completion date, for example `Piranesi — finished October 20, 2026`.
Examples are not reading records. The repository-owned
[`log-finished-book`](../.agents/skills/log-finished-book/SKILL.md) skill resolves
the work, researches metadata, validates it, and publishes an actual completion.
It asks about consequential ambiguity or conflicting completion dates, not every
print edition. Unknown metadata stays absent.

## Cloud environment setup

Create a private (Only me) Codex Cloud environment attached to
`vanshkumar/vanshkumar.github.io`, starting from `main`. Use **Sign in with ChatGPT**
and the account's available Codex model/allowance. Do not configure a model API
key, billed API fallback, or a hosted service.

Install Node 24 and run `npm ci` at the repository root in the environment's setup.
Enable the research access needed to open publisher and catalog pages. Verify
that the environment can research, fetch current GitHub main, run `npm test` and
the complete `npm run build`, and access GitHub's conditional branch-write and
Actions status tools. A working GitHub connection on another device is not proof
that this environment has those capabilities.

Create and pin a chat named **Reading log** in that environment with this standing
instruction:

> For each actual book and completion date I send, use this repository's
> `.agents/skills/log-finished-book/SKILL.md`. Research and enrich it, resolve only
> consequential ambiguity, run all required checks, and publish the validated
> content to main through the connected GitHub tools. Routine completed entries
> do not need another editorial approval. Interpret today/yesterday in
> America/New_York. Use ChatGPT-authenticated Codex and my available allowance;
> pause rather than switch to paid API usage. Preserve unresolved results in chat.
> Report published only after Pages deployment and live verification succeed.
> Refresh the repository from current main for every capture. Do not treat
> examples as actual completions or modify curated Shelf membership.

Before enabling publication, verify those capabilities inside this specific cloud
environment. The first actual phone submission with the Mac asleep is the final
end-to-end check; a desktop test cannot establish that result.

## Repository helper

The reader does not fill out JSON. Codex prepares the enriched payload described
in the skill's [payload reference](../.agents/skills/log-finished-book/references/payload.md).

```sh
npm run log-book -- --list
npm run log-book -- --input /tmp/finished-book.json --dry-run
npm run log-book -- --input /tmp/finished-book.json --write
npm test
npm run build
```

The helper shares `src/lib/reading-record.mjs` with Astro's content schema. New
captures require exact valid completion dates, required identity, provenance,
and sources. Historical partial/unknown dates remain supported. It preserves
quoted identifiers, existing notes, and unmentioned fields; an update requires
a fresh content digest. It writes only within `vault/reading-log/` and never
commits, pushes, deploys, or calls a model.

Publication follows the skill's [publication reference](../.agents/skills/log-finished-book/references/publication.md):
validate against current main, publish only intended paths, reject stale updates,
and verify the exact Pages run. A successful write is local; a successful commit
may still have deployment pending. Authentication/quota failures preserve the
result for resumption without purchasing API usage.

## Acceptance checks

Automated fixtures cover duplicate no-ops, unfinished updates, conflicting dates,
missing print pages, multiple authors, leading-zero identifiers, invalid dates,
unsafe paths, symlinks, stale file digests, and concurrent helper locks. Existing
reading-log/statistics tests and the complete root build check the site.

Cloud acceptance additionally requires a real phone capture with the Mac asleep,
an ambiguous-work clarification/resumption, and verified access to research,
GitHub writes, and deployment status. Stale branch updates must refresh and
revalidate; failed builds, expired authentication, and failed deployments must
never be reported as publication. Do not create fake public books for testing.

Official setup references: [Mobile access](https://learn.chatgpt.com/docs/mobile),
[Cloud environments](https://learn.chatgpt.com/docs/environments/cloud-environments),
and [Authentication](https://learn.chatgpt.com/docs/auth).

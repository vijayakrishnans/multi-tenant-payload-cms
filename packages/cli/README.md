# `@saas/cli`

`multi-tenant-payload-cms` — first-class TypeScript CLI for the Multi Tenant Payload Cms control
plane. Wraps `@saas/sdk` (the only transport allowed) and surfaces a
small set of read-only commands today; write commands land in Task 0101.

## Install (workspace)

This package is internal to the `multi-tenant-payload-cms` monorepo and is not
published. Build the binary with:

```sh
pnpm --filter @saas/cli build
node packages/cli/dist/cli.js --help
```

## Commands

Auth (Task 0100):

```
multi-tenant-payload-cms login    [--api-url=URL] [--token=BEARER]
multi-tenant-payload-cms logout
multi-tenant-payload-cms whoami
```

Reads (Task 0100):

```
multi-tenant-payload-cms org list
multi-tenant-payload-cms org use <org-id>
multi-tenant-payload-cms org members
multi-tenant-payload-cms project list
```

Writes (Task 0101):

```
multi-tenant-payload-cms org invite <email> [--role=ROLE] [--idempotency-key=KEY] [--org=ORG_ID]
multi-tenant-payload-cms project create <name> [--idempotency-key=KEY]
multi-tenant-payload-cms env create <project-id> <name> [--idempotency-key=KEY]
multi-tenant-payload-cms api-key create <name> [--scope=SCOPE] [--idempotency-key=KEY]
multi-tenant-payload-cms webhook create <url> [--event=EVENT[,EVENT2,...]] [--idempotency-key=KEY]
```

Cross-resource reads (Task 0101):

```
multi-tenant-payload-cms usage summary    [--metric=METRIC] [--from=ISO] [--to=ISO]
multi-tenant-payload-cms billing summary
multi-tenant-payload-cms audit list       [--limit=N] [--cursor=CURSOR] [--category=CAT] [--all]
```

All commands accept `--output=human|json`. JSON mode emits one document
per invocation; on error, `{ "error": { "code", "message", "requestId? } }`.

### Exit codes (`src/errors.ts`)

| Code | Meaning |
|------|---------|
| 0    | Success |
| 1    | Generic / unexpected error |
| 2    | Usage error (missing/invalid args or flags) |
| 3    | Not authenticated (no stored credential) |
| 4    | API error (4xx/5xx surfaced from the SDK) |
| 5    | No active organization context |
| 6    | Idempotency replay rejected by api-edge |

### Idempotency

`--idempotency-key=KEY` is forwarded **verbatim** to the API on every
write — Stripe parity. The CLI never auto-generates a key. When you omit
the flag, no `Idempotency-Key` header is sent and the api-edge worker
falls through without replay protection (still safe for read-after-write
flows; required for retry-safe writes).

For `webhook create --event=A,B`, each child subscription gets a
deterministic suffixed key (`KEY:sub:0`, `KEY:sub:1`, …) so the whole
command remains retry-safe under partial failure.

### Active organization

Most write/cross-read commands resolve the org from the persisted
context (`multi-tenant-payload-cms org use <org-id>`). Only `org invite` accepts an
explicit `--org=ORG_ID` override; the others throw "no active
organization" (exit 5) when context is unset.

### Audit pagination

`audit list` without flags returns the first page; `--all` walks every
page until the server returns `cursor: null`. In `--all --output=json`
mode the CLI emits one JSON document per page (JSON Lines) so a
downstream pipeline can stream without buffering.

## Auth

The shipped V1 is **token-paste**: `multi-tenant-payload-cms login` prompts for a
Bearer token, validates it via `client.organizations.list()`, and stores
it. Switching to a device-flow grant once api-edge ships
`/v1/auth/device/{start,poll}` is a one-line dispatch in
`src/auth/login.ts`.

Token storage:
- `KeychainTokenStore` (preferred): macOS Keychain / Windows Credential
  Vault / Secret Service via `keytar` (lazy import; in
  `optionalDependencies`).
- `FileTokenStore` fallback: `~/.config/multi-tenant-payload-cms/credentials.json`,
  mode **0600**, parent directory mode **0700**.

Active organization context lives at
`~/.config/multi-tenant-payload-cms/config.json` (mode 0644, not a secret). Override
both via `MULTI_TENANT_PAYLOAD_CMS_CONFIG_DIR` (used by tests).

## Output stability

JSON output is deterministic given a deterministic SDK response. The CLI
adds **no** timestamps to JSON envelopes. `formatOutput()` is the only
emission path and is fully covered by tests.

## Hazards / constraints

- Zero hazards under `packages/cli/**`. The hazard set is the same as
  the rest of the monorepo: disabled-eslint comments, ts-ignore,
  ts-expect-error, and force-cast escape hatches via `as` chains.
- The package index (`src/index.ts`) is loadable in non-Node hosts; the
  keychain adapter dynamic-imports `keytar` only when needed.
- Idempotency-Key is **caller-owned**. Task 0101 wires `--idempotency-key`
  through to the SDK; the CLI never auto-mints a key.

## Testing

```sh
pnpm --filter @saas/cli typecheck
pnpm --filter @saas/cli lint
pnpm --filter @saas/cli test
pnpm --filter @saas/cli build
```

## Related

- `specs/components/13-cli-and-sdk.md` — surface contract.
- `packages/sdk` — the only allowed transport.
- Task 0101 — write commands + remaining read-only fan-out.

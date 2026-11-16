# web-console-next — retired to a redirect

This was the Multi Tenant Payload Cms web console (Next.js on Workers). The console is
now the **Payload admin** (`apps/cms`, specs/epics/multi-tenant-payload-cms-console), and
this component keeps only the old URL alive:
`multi-tenant-payload-cms-web-console-next-<env>.vijayakrishnan12994.workers.dev` answers every
request with a `308` to the same page's place in the CMS of the same
environment, so bookmarks, old links and old OAuth returns land in Payload.

The console's UI, its models and its tests were removed in PX4. The models
the admin still uses were copied into `apps/cms/src/lib/multi-tenant-payload-cms/models/` with
their tests; the rest is in git history.

- [Overview](docs/overview.md)
- [Architecture](docs/architecture.md)
- [Runbook](docs/runbook.md)

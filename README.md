# South East London Care — Staff Portal

A secure, invitation-only staff and administration portal for South East London Care.

## Approved technical direction

- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase Auth and PostgreSQL (service project and UK region to be configured)
- Vercel hosting and GitHub-based deployments
- Private object storage for staff documents (provider and data-location arrangements to be confirmed)

## Planned first milestone

1. SELC-branded responsive application shell
2. Invitation-only account activation
3. Email verification and password recovery
4. Server-enforced role-based access control
5. Staff and administrator dashboards
6. Database schema, migrations, and automated tests

## Security rules

- No public self-registration.
- Deny access by default; enforce authorization server-side and at the database layer.
- Never commit secrets, service-role keys, tokens, or real staff data.
- Use synthetic data in development and preview environments.
- Health, DBS, identity, equality-monitoring, and payroll information require separately approved purposes, lawful bases, access rules, and retention schedules.
- Production launch requires security, privacy, backup, and recovery validation.

See [docs/architecture.md](docs/architecture.md) for the initial design.

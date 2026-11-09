# SELC Staff Portal — Architecture

## Approved stack
- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase Auth + PostgreSQL
- Vercel hosting and GitHub deployments
- Private object storage for staff documents (provider and data residency to be confirmed)

## Scaffold included
- SELC-branded responsive sign-in screen.
- Supabase password sign-in integration.
- Session refresh middleware.
- Protected dashboard route and sign-out.
- No public self-registration route.

## Required environment variables
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY (or current Supabase publishable key)

The Supabase project URL is supplied in .env.example. Add the publishable/anon key to local .env.local and Vercel environment variables. Never commit secret keys.

## Not yet production complete
Invitation creation and redemption, password recovery pages, server-side role resolution, database migrations and RLS policies, audit events, automated tests, and security review remain outstanding.

## Roles to implement
Super Administrator, HR Manager, Department Manager, Compliance Officer, Staff Member. Role assignments must never be self-selected. Enforce permissions in server actions/API handlers and PostgreSQL RLS.

## Data protection
Do not use actual staff health, DBS, identity, equality-monitoring, safeguarding, or payroll data in development. Document purpose, lawful basis, access matrix, retention schedule, processor agreements, and international transfer controls before production collection.

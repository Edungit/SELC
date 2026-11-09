# Supabase setup checklist

1. Confirm the project region and review Supabase's data processing terms before using real UK employee data.
2. In Authentication → URL Configuration, set the Site URL to the Vercel deployment URL during setup.
3. Add redirect URLs for:
   - `http://localhost:3000/auth/callback`
   - Your Vercel preview URL pattern, as supported by Supabase
   - Your final staff portal domain, e.g. `https://staff.southeastlondoncare.co.uk/auth/callback`
4. Configure SMTP/custom email delivery before sending staff invitations or recovery messages at scale.
5. Set the password policy and email verification requirements.
6. Configure the Vercel environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or the current publishable key)
7. Never place the Supabase `service_role` key in a `NEXT_PUBLIC_` variable or Git repository.

## Current application routes

- `/login`: password sign-in
- `/forgot-password`: request a password recovery email
- `/auth/callback`: exchange the one-time auth code for a session
- `/update-password`: set a new password after recovery

Invitation issuance/redemption and role provisioning are separate server-side features and are not yet complete.


## SELC Vercel deployment URL

Current deployment URL supplied by the project owner:

`https://selc-git-main-selc1.vercel.app`

Configure Supabase Authentication → URL Configuration with:

- Site URL: `https://selc-git-main-selc1.vercel.app`
- Redirect URL: `https://selc-git-main-selc1.vercel.app/auth/callback`
- Local development callback: `http://localhost:3000/auth/callback`

When the custom domain is connected, also add:

- `https://staff.southeastlondoncare.co.uk/auth/callback`

Do not remove any other required preview redirect patterns without checking the team's deployment workflow. The Vercel URL was supplied by the project owner; the live deployment and authentication flow still need browser testing.


## Open registration and administrator approval

Apply the migration:

`supabase/migrations/202611090002_open_registration_approval.sql`

It creates the `pending_review` account state and a trusted database trigger that creates a minimal applicant profile and assigns only the ordinary `staff_member` role. Applicants cannot select privileged roles.

Public registration is available at `/register`. Email confirmation must be enabled in Supabase Auth. After the applicant confirms their email, the auth callback attempts to notify the administrator. Applicants remain blocked from the staff dashboard until an authorised Super Administrator or HR Manager approves them in `/admin/applications`.

### Email notification configuration

The initial administrator notification address is `edunhabeeb@gmail.com`. It is configurable and should be replaced later using:

- `ADMIN_APPROVAL_EMAIL`
- `RESEND_API_KEY`
- `SELC_EMAIL_FROM` (a verified sender address/domain in Resend)

Add these as server-side Vercel environment variables. Do not use a `NEXT_PUBLIC_` prefix for any of them. Without a configured Resend API key and verified sender, the registration and approval workflow can still be used, but email notifications will not be delivered.

Applicant approval/rejection emails use the same Resend configuration. Administrative decisions are made inside the authenticated portal; the notification email is not itself an approval link.

### Required production checks

- Confirm Supabase Auth → Providers → Email has email confirmations enabled.
- Add the Vercel URL `https://selc-git-main-selc1.vercel.app/auth/callback` to allowed redirect URLs.
- Set the three email environment variables in Vercel and redeploy.
- Test with a synthetic applicant email before inviting real staff.
- Confirm a newly registered account is `pending_review`, cannot open `/dashboard`, and receives no role beyond `staff_member`.
- Confirm an authorised administrator can approve/reject it and that the applicant receives the outcome email.

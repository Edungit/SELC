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

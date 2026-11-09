# First Super Administrator bootstrap

The first Super Administrator cannot be created through public registration. Bootstrap the first administrator through a controlled, one-time procedure.

1. In Supabase Authentication → Users, create or invite the nominated company administrator using a company-controlled email.
2. Verify the email and copy the Auth user UUID.
3. Confirm the person is authorised by SELC management.
4. In the Supabase SQL Editor, run the statement below, replacing the UUID and email with the verified values:

```sql
insert into public.staff_profiles (user_id, work_email, account_status)
values ('REPLACE-WITH-VERIFIED-AUTH-USER-UUID', 'admin@your-company-domain.co.uk', 'active')
on conflict (user_id) do update set account_status = 'active';

insert into public.user_role_assignments (user_id, role, assigned_by)
values ('REPLACE-WITH-VERIFIED-AUTH-USER-UUID', 'super_administrator', 'REPLACE-WITH-VERIFIED-AUTH-USER-UUID')
on conflict do nothing;
```

5. Sign in as that administrator and confirm access to the invitation screen.
6. Record the bootstrap in the company's access-control register and secure any temporary setup credentials.

Do not use a guessed UUID or a personal email. Do not share the Supabase service-role key. The bootstrap SQL is a privileged operation and must be performed only by an authorised project owner.

## Invitation endpoint

The initial invitation endpoint requires `SUPABASE_SERVICE_ROLE_KEY` as a server-only Vercel environment variable. It also requires the inviter to have a Super Administrator or HR Manager role. HR Managers can invite Staff Members only; Super Administrators can assign all five roles.

Before production use, complete tests for duplicate invitations, resend/revoke, invitation expiry, rate limiting, email deliverability, audit integrity, and transactional rollback. The invitation expiry stored in the SELC invitation table must be enforced by the final activation workflow; Supabase Auth invitation expiry must also be configured and verified.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedRoles = [
  "super_administrator",
  "hr_manager",
  "department_manager",
  "compliance_officer",
  "staff_member"
] as const;

export async function POST(request: Request) {
  try {
    const sessionClient = await createClient();
    const { data: { user } } = await sessionClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const { data: assignments, error: roleError } = await sessionClient
      .from("user_role_assignments")
      .select("role")
      .eq("user_id", user.id);

    if (roleError) return NextResponse.json({ error: "Unable to verify administrator permissions." }, { status: 403 });

    const roles = (assignments ?? []).map((item) => item.role);
    const isSuperAdmin = roles.includes("super_administrator");
    const isHrManager = roles.includes("hr_manager");
    if (!isSuperAdmin && !isHrManager) {
      return NextResponse.json({ error: "You are not authorised to invite staff." }, { status: 403 });
    }

    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const role = typeof body.role === "string" ? body.role : "";
    const departmentId = typeof body.departmentId === "string" && body.departmentId ? body.departmentId : null;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (!allowedRoles.includes(role as (typeof allowedRoles)[number])) {
      return NextResponse.json({ error: "Select a valid staff role." }, { status: 400 });
    }
    if (!isSuperAdmin && (role === "super_administrator" || role === "hr_manager")) {
      return NextResponse.json({ error: "Only a Super Administrator can invite Super Administrators or HR Managers." }, { status: 403 });
    }

    const admin = createAdminClient();
    const origin = new URL(request.url).origin;
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/update-password`,
      data: { invited_by: user.id }
    });

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message ?? "Invitation could not be created." }, { status: 400 });
    }

    const newUserId = data.user.id;
    const { error: profileError } = await admin.from("staff_profiles").upsert({
      user_id: newUserId,
      work_email: email,
      department_id: departmentId,
      account_status: "invited"
    });
    if (profileError) {
      await admin.auth.admin.deleteUser(newUserId);
      return NextResponse.json({ error: "Invitation setup failed while creating the staff profile." }, { status: 500 });
    }

    const { error: assignmentError } = await admin.from("user_role_assignments").insert({
      user_id: newUserId,
      role,
      department_id: departmentId,
      assigned_by: user.id
    });
    if (assignmentError) {
      await admin.auth.admin.deleteUser(newUserId);
      return NextResponse.json({ error: "Invitation setup failed while assigning the role." }, { status: 500 });
    }

    await admin.from("audit_events").insert({
      actor_user_id: user.id,
      event_type: "staff_invitation_created",
      target_user_id: newUserId,
      metadata: { role, department_id: departmentId }
    });

    return NextResponse.json({ success: true, message: "Invitation created and sent.", userId: newUserId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
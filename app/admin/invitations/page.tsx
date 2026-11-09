import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import InvitationForm from "./invitation-form";

export default async function InvitationsPage() {
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/login");
  const {data:assignments}=await supabase.from("user_role_assignments").select("role").eq("user_id",user.id);
  const roles=(assignments??[]).map(x=>x.role);
  const isSuperAdmin=roles.includes("super_administrator");
  const isHrManager=roles.includes("hr_manager");
  if(!isSuperAdmin&&!isHrManager) redirect("/dashboard");
  return <main className="min-h-screen px-5 py-10"><div className="mx-auto max-w-2xl">
    <Link href="/dashboard" className="text-sm font-semibold text-selc-blue hover:underline">← Back to dashboard</Link>
    <p className="mt-8 text-xs font-bold uppercase tracking-[.18em] text-selc-red">Staff administration</p>
    <h1 className="mt-2 text-3xl font-bold text-selc-navy">Invite a staff member</h1>
    <p className="mt-3 text-sm leading-6 text-slate-600">An invitation email will be sent to the staff member. They will set their password through the secure activation link. Public registration is disabled.</p>
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-panel sm:p-8"><InvitationForm canGrantAdminRoles={isSuperAdmin}/></section>
    <p className="mt-5 text-xs leading-5 text-slate-500">Only Super Administrators can grant Super Administrator or HR Manager access. HR Managers can invite staff, Department Managers and Compliance Officers.</p>
  </div></main>;
}
import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import AnnouncementComposer from "./announcement-composer";
export default async function CommunicationsPage(){
 const session=await createClient();const {data:{user}}=await session.auth.getUser();if(!user)redirect("/login?next=%2Fadmin%2Fcommunications");
 const {data:roles}=await session.from("user_role_assignments").select("role").eq("user_id",user.id);
 if(!roles?.some(r=>["super_administrator","hr_manager"].includes(r.role)))redirect("/dashboard");
 const admin=createAdminClient();
 const [{data:staff},{data:announcements}]=await Promise.all([
  admin.from("staff_profiles").select("user_id,first_name,last_name,work_email,application_track,account_status").eq("account_status","active"),
  admin.from("staff_announcements").select("*").order("created_at",{ascending:false}).limit(100)
 ]);
 return <main className="min-h-screen bg-[#f4f6fa] px-4 py-8 sm:px-8"><div className="mx-auto max-w-6xl"><Link href="/dashboard" className="text-sm font-semibold text-selc-blue">← Dashboard</Link><p className="mt-7 text-xs font-bold uppercase tracking-[.18em] text-selc-red">People operations</p><h1 className="mt-2 text-3xl font-bold text-selc-navy">Staff communications</h1><p className="mt-2 text-sm text-slate-600">Publish official announcements to all active staff, Carers or Nurses. Published notices appear in the staff portal; email delivery is recorded separately.</p><AnnouncementComposer staff={staff??[]} announcements={announcements??[]}/></div></main>;
}
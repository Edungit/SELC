import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import ApplicationList from "./application-list";
export default async function ApplicationsPage(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:roles}=await supabase.from("user_role_assignments").select("role").eq("user_id",user.id);
 if(!roles?.some(x=>x.role==="super_administrator"||x.role==="hr_manager"))redirect("/dashboard");
 return <main className="min-h-screen px-5 py-10"><div className="mx-auto max-w-4xl"><Link href="/dashboard" className="text-sm font-semibold text-selc-blue">← Back to dashboard</Link><p className="mt-8 text-xs font-bold uppercase tracking-[.18em] text-selc-red">Recruitment administration</p><h1 className="mt-2 text-3xl font-bold text-selc-navy">Staff applications</h1><p className="mt-2 text-sm text-slate-600">Review new registrations and approve or reject access to the staff portal.</p><ApplicationList/></div></main>;
}
import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import ApplicationList from "./application-list";

export default async function ApplicationsPage(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login?next=%2Fadmin%2Fapplications");

 const {data:roles,error}=await supabase.from("user_role_assignments").select("role").eq("user_id",user.id);
 if(error||!roles?.some(x=>x.role==="super_administrator"||x.role==="hr_manager")){
  return <main className="flex min-h-screen items-center justify-center px-5 py-10">
   <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
    <p className="text-xs font-bold uppercase tracking-[.18em] text-selc-red">South East London Care</p>
    <h1 className="mt-3 text-2xl font-bold text-selc-navy">Administrator access required</h1>
    <p className="mt-3 text-sm leading-6 text-slate-600">You are signed in, but this page is restricted to Super Administrators and HR Managers. Sign out and sign in with an authorised administrator account.</p>
    <div className="mt-6 flex flex-wrap gap-3">
     <Link href="/dashboard" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-selc-navy">Return to dashboard</Link>
     <Link href="/login?next=%2Fadmin%2Fapplications" className="rounded-xl bg-selc-navy px-4 py-2.5 text-sm font-semibold text-white">Go to administrator login</Link>
    </div>
   </section>
  </main>;
 }
 return <main className="min-h-screen px-5 py-10"><div className="mx-auto max-w-4xl"><Link href="/dashboard" className="text-sm font-semibold text-selc-blue">← Back to dashboard</Link><p className="mt-8 text-xs font-bold uppercase tracking-[.18em] text-selc-red">Recruitment administration</p><h1 className="mt-2 text-3xl font-bold text-selc-navy">Staff applications</h1><p className="mt-2 text-sm text-slate-600">Review new registrations and approve or reject access to the staff portal.</p><ApplicationList/></div></main>;
}

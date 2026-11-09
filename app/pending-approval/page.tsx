import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
export default async function PendingApprovalPage(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:profile}=await supabase.from("staff_profiles").select("account_status,first_name").eq("user_id",user.id).maybeSingle();
 if(profile?.account_status==="active"||profile?.account_status==="invited")redirect("/dashboard");
 const rejected=profile?.account_status==="rejected";
 return <main className="flex min-h-screen items-center justify-center p-5"><section className="max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-panel"><p className="text-xs font-bold uppercase tracking-[.18em] text-selc-red">South East London Care</p><h1 className="mt-3 text-2xl font-bold text-selc-navy">{rejected?"Application update":"Application received"}</h1><p className="mt-3 text-sm leading-6 text-slate-600">{rejected?"Your application has not been approved. Please contact South East London Care for further information.":("Thank you"+(profile?.first_name?", "+profile.first_name:"")+". Your email must be verified and your application approved by an SELC administrator before staff portal access is enabled.")}</p>{!rejected&&<p className="mt-3 text-sm text-slate-600">You will be notified by email when a decision is recorded. You can return here after approval.</p>}<Link href="/login" className="mt-6 inline-block font-semibold text-selc-blue">Return to sign in</Link></section></main>;
}
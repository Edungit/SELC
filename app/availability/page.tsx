import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import AvailabilityEditor from "./availability-editor";
export default async function AvailabilityPage(){
 const s=await createClient();const {data:{user}}=await s.auth.getUser();if(!user)redirect("/login?next=%2Favailability");
 const {data:profile}=await s.from("staff_profiles").select("account_status").eq("user_id",user.id).maybeSingle();if(profile?.account_status!=="active")redirect("/pending-approval");
 const {data:rows,error}=await s.from("staff_availability").select("id,day_of_week,slot_number,available_from,available_until,unavailable,ends_next_day,notes").eq("user_id",user.id).order("day_of_week").order("slot_number");
 return <main className="min-h-screen bg-[#f4f6fa] px-4 py-8 sm:px-8"><div className="mx-auto max-w-5xl"><Link href="/dashboard" className="text-sm font-semibold text-selc-blue">← Dashboard</Link><p className="mt-7 text-xs font-bold uppercase tracking-[.18em] text-selc-red">Staff workspace</p><h1 className="mt-2 text-3xl font-bold text-selc-navy">Weekly availability</h1><p className="mt-2 text-sm text-slate-600">Tell your manager when you can normally work. You can set up to two availability windows per day, including overnight availability.</p>{error?<p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">Could not load availability. Please try again later.</p>:<AvailabilityEditor initialRows={rows??[]} userId={user.id}/>}</div></main>;
}
import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import RotaComposer from "./rota-composer";
export default async function RotaManagement(){
 const s=await createClient();const {data:{user}}=await s.auth.getUser();if(!user)redirect("/login?next=%2Fadmin%2Frota");
 const {data:roles}=await s.from("user_role_assignments").select("role,department_id").eq("user_id",user.id);const rs=roles??[];const all=rs.some(x=>["super_administrator","hr_manager"].includes(x.role));const deptIds=[...new Set(rs.filter(x=>x.role==="department_manager"&&x.department_id).map(x=>x.department_id))];if(!all&&!deptIds.length)redirect("/dashboard");
 const admin=createAdminClient();let dq=admin.from("departments").select("id,name").eq("is_active",true).order("name");if(!all)dq=dq.in("id",deptIds);const {data:departments}=await dq;
 let sq=admin.from("staff_profiles").select("user_id,first_name,last_name,work_email,application_track,department_id").eq("account_status","active").order("last_name").limit(500);if(!all)sq=sq.in("department_id",deptIds);const {data:staff}=await sq;
 const {data:shifts}=await admin.from("staff_shifts").select("id,title,shift_date,start_time,end_time,ends_next_day,status,department_id,application_track").order("shift_date",{ascending:false}).limit(100);
 return <main className="min-h-screen bg-[#f4f6fa] px-4 py-8 sm:px-8"><div className="mx-auto max-w-7xl"><Link href="/dashboard" className="text-sm font-semibold text-selc-blue">← Dashboard</Link><p className="mt-7 text-xs font-bold uppercase tracking-[.18em] text-selc-red">People operations</p><h1 className="mt-2 text-3xl font-bold text-selc-navy">Shift rota management</h1><p className="mt-2 text-sm text-slate-600">Create shifts and assign active Carers or Nurses within authorised departments.</p><RotaComposer departments={departments??[]} staff={staff??[]} shifts={shifts??[]}/></div></main>;
}
import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import LeaveReview from "./leave-review";
export default async function LeaveManagement(){
 const s=await createClient();const {data:{user}}=await s.auth.getUser();if(!user)redirect("/login?next=%2Fadmin%2Fleave");
 const {data:roles}=await s.from("user_role_assignments").select("role,department_id").eq("user_id",user.id);
 const rows=roles??[];const all=rows.some(x=>["super_administrator","hr_manager"].includes(x.role));const deptIds=rows.filter(x=>x.role==="department_manager"&&x.department_id).map(x=>x.department_id);
 if(!all&&!deptIds.length)redirect("/dashboard");
 const admin=createAdminClient();let q=admin.from("staff_leave_requests").select("*").order("created_at",{ascending:false}).limit(300);if(!all)q=q.in("department_id",deptIds);
 const {data:requests,error}=await q;if(error)throw new Error("Unable to load leave requests: "+error.message);
 const ids=[...new Set((requests??[]).map(x=>x.user_id))];const {data:profiles}=ids.length?await admin.from("staff_profiles").select("user_id,first_name,last_name,work_email,application_track,staff_number").in("user_id",ids):{data:[]};
 const items=(requests??[]).map(x=>({...x,staff_name:[profiles?.find(p=>p.user_id===x.user_id)?.first_name,profiles?.find(p=>p.user_id===x.user_id)?.last_name].filter(Boolean).join(" ")||"Staff member",work_email:profiles?.find(p=>p.user_id===x.user_id)?.work_email||"",application_track:profiles?.find(p=>p.user_id===x.user_id)?.application_track||""}));
 return <main className="min-h-screen bg-[#f4f6fa] px-4 py-8 sm:px-8"><div className="mx-auto max-w-7xl"><Link href="/dashboard" className="text-sm font-semibold text-selc-blue">← Dashboard</Link><p className="mt-7 text-xs font-bold uppercase tracking-[.18em] text-selc-red">People operations</p><h1 className="mt-2 text-3xl font-bold text-selc-navy">Leave approvals</h1><p className="mt-2 text-sm text-slate-600">Review staff leave and absence requests. Department Managers are limited to their assigned departments.</p><LeaveReview requests={items}/></div></main>;
}
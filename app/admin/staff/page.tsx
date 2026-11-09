import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import StaffDirectory from "./staff-directory";
export default async function StaffDirectoryPage(){
 const session=await createClient();const {data:{user}}=await session.auth.getUser();if(!user)redirect("/login?next=%2Fadmin%2Fstaff");
 const {data:assignments,error}=await session.from("user_role_assignments").select("role,department_id").eq("user_id",user.id);
 if(error)redirect("/dashboard");
 const roles=assignments??[];const isSuper=roles.some(x=>x.role==="super_administrator");const isHr=roles.some(x=>x.role==="hr_manager");const isDept=roles.some(x=>x.role==="department_manager");
 if(!isSuper&&!isHr&&!isDept)redirect("/dashboard");
 const departmentIds=[...new Set(roles.filter(x=>x.role==="department_manager"&&x.department_id).map(x=>x.department_id))];
 if(!isSuper&&!isHr&&departmentIds.length===0)redirect("/dashboard");
 const admin=createAdminClient();let query=admin.from("staff_profiles").select("user_id,staff_number,first_name,last_name,preferred_name,work_email,department_id,account_status,created_at,application_track").order("last_name",{ascending:true}).limit(500);
 if(!isSuper&&!isHr)query=query.in("department_id",departmentIds);
 const {data:profiles,error:profileError}=await query;if(profileError)throw new Error("Could not load staff directory: "+profileError.message);
 const deptIds=[...new Set((profiles??[]).map(x=>x.department_id).filter(Boolean))];
 const {data:departments}=deptIds.length?await admin.from("departments").select("id,name").in("id",deptIds):{data:[]};
 const {data:roleRows}=await admin.from("user_role_assignments").select("user_id,role").in("user_id",(profiles??[]).map(x=>x.user_id));
 const items=(profiles??[]).map(p=>({...p,department_name:departments?.find(d=>d.id===p.department_id)?.name??"Unassigned",roles:(roleRows??[]).filter(r=>r.user_id===p.user_id).map(r=>r.role)}));
 return <main className="min-h-screen bg-[#f4f6fa] px-4 py-8 sm:px-8"><div className="mx-auto max-w-7xl"><Link href="/dashboard" className="text-sm font-semibold text-selc-blue">← Dashboard</Link><p className="mt-7 text-xs font-bold uppercase tracking-[.18em] text-selc-red">People operations</p><h1 className="mt-2 text-3xl font-bold text-selc-navy">Staff directory</h1><p className="mt-2 text-sm text-slate-600">Find staff members and view their current portal status, department and assigned role.</p><StaffDirectory staff={items} canViewAll={isSuper||isHr}/></div></main>;
}
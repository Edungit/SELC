import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
export async function PATCH(req:Request){
 const s=await createClient();const {data:{user}}=await s.auth.getUser();if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 const {data:roles}=await s.from("user_role_assignments").select("role,department_id").eq("user_id",user.id);const rs=roles??[];const privileged=rs.some(x=>["super_administrator","hr_manager"].includes(x.role));const departments=rs.filter(x=>x.role==="department_manager"&&x.department_id).map(x=>x.department_id);if(!privileged&&!departments.length)return NextResponse.json({error:"Not authorised to review leave."},{status:403});
 try{const b=await req.json();if(typeof b.id!=="string"||!["approved","rejected"].includes(b.decision)||typeof (b.note??"")!=="string"||(b.note??"").length>1000)return NextResponse.json({error:"Invalid review decision."},{status:400});
 const admin=createAdminClient();let q=admin.from("staff_leave_requests").select("id,user_id,department_id,status").eq("id",b.id).eq("status","pending");const {data:target,error}=await q.maybeSingle();if(error||!target)return NextResponse.json({error:"Pending leave request not found."},{status:404});if(!privileged&&!departments.includes(target.department_id))return NextResponse.json({error:"This request is outside your assigned department."},{status:403});
 const {data:updated,error:updateError}=await admin.from("staff_leave_requests").update({status:b.decision,manager_note:(b.note as string).trim()||null,reviewed_by:user.id,reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",b.id).eq("status","pending").select("id").maybeSingle();if(updateError||!updated)return NextResponse.json({error:"The request could not be updated; it may already have been reviewed."},{status:409});
 await admin.from("audit_events").insert({actor_user_id:user.id,event_type:b.decision==="approved"?"staff_leave_approved":"staff_leave_rejected",target_user_id:target.user_id,metadata:{leave_request_id:b.id,manager_note:(b.note as string).trim()||null}});
 return NextResponse.json({success:true});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unable to review request."},{status:500});}
}
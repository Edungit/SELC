import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
async function authorised(){
 const session=await createClient();const {data:{user}}=await session.auth.getUser();if(!user)return {user:null,ok:false};
 const {data:roles,error}=await session.from("user_role_assignments").select("role").eq("user_id",user.id);
 return {user,ok:!error&&!!roles?.some(x=>x.role==="super_administrator"||x.role==="hr_manager")};
}
export async function GET(){
 const auth=await authorised();if(!auth.user)return NextResponse.json({error:"Authentication required."},{status:401});if(!auth.ok)return NextResponse.json({error:"Not authorised."},{status:403});
 const {data,error}=await createAdminClient().from("staff_profiles").select("user_id,first_name,last_name,work_email,account_status,application_submitted_at").eq("account_status","pending_review").order("application_submitted_at",{ascending:false});
 if(error)return NextResponse.json({error:"Could not load pending applications."},{status:500});
 return NextResponse.json({applications:data??[]});
}
export async function PATCH(request:Request){
 const auth=await authorised();if(!auth.user)return NextResponse.json({error:"Authentication required."},{status:401});if(!auth.ok)return NextResponse.json({error:"Not authorised."},{status:403});
 const body=await request.json();const userId=typeof body.userId==="string"?body.userId:"";const decision=body.decision;
 if(!userId||!(decision==="approve"||decision==="reject"))return NextResponse.json({error:"Invalid application decision."},{status:400});
 const admin=createAdminClient();const {data:target,error:lookupError}=await admin.from("staff_profiles").select("user_id,work_email,account_status").eq("user_id",userId).maybeSingle();
 if(lookupError||!target||target.account_status!=="pending_review")return NextResponse.json({error:"This application is no longer pending."},{status:409});
 const status=decision==="approve"?"active":"rejected";
 const {data:updated,error:updateError}=await admin.from("staff_profiles").update({account_status:status}).eq("user_id",userId).eq("account_status","pending_review").select("user_id").maybeSingle();
 if(updateError||!updated)return NextResponse.json({error:"Unable to update application status."},{status:500});
 await admin.from("audit_events").insert({actor_user_id:auth.user.id,event_type:decision==="approve"?"staff_application_approved":"staff_application_rejected",target_user_id:userId,metadata:{email:target.work_email}});
 const key=process.env.RESEND_API_KEY;const from=process.env.SELC_EMAIL_FROM;
 if(key&&from&&target.work_email){
  const subject=decision==="approve"?"Your South East London Care application has been approved":"Update on your South East London Care application";
  const html=decision==="approve"?"<p>Your SELC staff application has been approved. You can now sign in to the staff portal.</p>":"<p>Your SELC staff application has not been approved at this time. Please contact the company if you require further information.</p>";
  try{await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({from,to:[target.work_email],subject,html})});}catch{}
 }
 return NextResponse.json({success:true,status});
}
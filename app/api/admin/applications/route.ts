import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";

async function authorised(){
 const session=await createClient();
 const {data:{user}}=await session.auth.getUser();
 if(!user)return {user:null,ok:false};
 const {data:roles,error}=await session.from("user_role_assignments").select("role").eq("user_id",user.id);
 return {user,ok:!error&&!!roles?.some(x=>x.role==="super_administrator"||x.role==="hr_manager")};
}
function escapeHtml(value:string){
 return value.replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]??char));
}
async function sendAdminAlert(userId:string){
 const admin=createAdminClient();
 const {data:target,error}=await admin.from("staff_profiles").select("user_id,first_name,last_name,work_email,account_status").eq("user_id",userId).maybeSingle();
 if(error||!target||target.account_status!=="pending_review")return {ok:false,error:"Pending application was not found."};
 const key=process.env.RESEND_API_KEY;
 const from=process.env.SELC_EMAIL_FROM;
 if(!key||!from){
  const message="Missing RESEND_API_KEY or SELC_EMAIL_FROM environment variable.";
  await admin.from("staff_profiles").update({admin_notification_status:"failed",admin_notification_error:message}).eq("user_id",userId);
  return {ok:false,error:message};
 }
 const adminEmail=process.env.ADMIN_APPROVAL_EMAIL||"edunhabeeb@gmail.com";
 const name=[target.first_name,target.last_name].filter(Boolean).join(" ")||"New applicant";
 try{
  const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({
   from,to:[adminEmail],subject:"New SELC staff application awaiting review",
   html:"<div style='font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#172033'><h2>New staff application</h2><p>A staff applicant is awaiting review.</p><p><strong>Applicant:</strong> "+escapeHtml(name)+"<br/><strong>Email:</strong> "+escapeHtml(target.work_email||"Not provided")+"</p><p><a href='https://selc-six.vercel.app/admin/applications'>Open SELC application review</a></p></div>"
  })});
  const result=await response.json().catch(()=>({}));
  if(!response.ok){
   const message=String(result?.message||result?.error||("Resend API returned HTTP "+response.status)).slice(0,1000);
   await admin.from("staff_profiles").update({admin_notification_status:"failed",admin_notification_error:message}).eq("user_id",userId);
   return {ok:false,error:message};
  }
  const {error:updateError}=await admin.from("staff_profiles").update({admin_notification_status:"sent",admin_notification_sent_at:new Date().toISOString(),admin_notification_error:null}).eq("user_id",userId);
  if(updateError)return {ok:false,error:"Email accepted by Resend, but notification status could not be saved: "+updateError.message};
  return {ok:true};
 }catch(error){
  const message=error instanceof Error?error.message:"Unknown Resend delivery error";
  await admin.from("staff_profiles").update({admin_notification_status:"failed",admin_notification_error:message.slice(0,1000)}).eq("user_id",userId);
  return {ok:false,error:message};
 }
}
export async function GET(){
 const auth=await authorised();
 if(!auth.user)return NextResponse.json({error:"Authentication required."},{status:401});
 if(!auth.ok)return NextResponse.json({error:"Not authorised."},{status:403});
 const {data,error}=await createAdminClient().from("staff_profiles").select("user_id,first_name,last_name,work_email,account_status,application_submitted_at,admin_notification_status,admin_notification_error").eq("account_status","pending_review").order("application_submitted_at",{ascending:false});
 if(error)return NextResponse.json({error:"Could not load pending applications."},{status:500});
 return NextResponse.json({applications:data??[]});
}
export async function POST(request:Request){
 const auth=await authorised();
 if(!auth.user)return NextResponse.json({error:"Authentication required."},{status:401});
 if(!auth.ok)return NextResponse.json({error:"Not authorised."},{status:403});
 const body=await request.json();
 const userId=typeof body.userId==="string"?body.userId:"";
 if(!userId)return NextResponse.json({error:"Applicant ID is required."},{status:400});
 const result=await sendAdminAlert(userId);
 return result.ok?NextResponse.json({success:true,message:"Administrator notification accepted by Resend."}):NextResponse.json({error:result.error},{status:502});
}
export async function PATCH(request:Request){
 const auth=await authorised();
 if(!auth.user)return NextResponse.json({error:"Authentication required."},{status:401});
 if(!auth.ok)return NextResponse.json({error:"Not authorised."},{status:403});
 const body=await request.json();
 const userId=typeof body.userId==="string"?body.userId:"";
 const decision=body.decision;
 if(!userId||!(decision==="approve"||decision==="reject"))return NextResponse.json({error:"Invalid application decision."},{status:400});
 const admin=createAdminClient();
 const {data:target,error:lookupError}=await admin.from("staff_profiles").select("user_id,work_email,account_status").eq("user_id",userId).maybeSingle();
 if(lookupError||!target||target.account_status!=="pending_review")return NextResponse.json({error:"This application is no longer pending."},{status:409});
 const status=decision==="approve"?"active":"rejected";
 const {data:updated,error:updateError}=await admin.from("staff_profiles").update({account_status:status}).eq("user_id",userId).eq("account_status","pending_review").select("user_id").maybeSingle();
 if(updateError||!updated)return NextResponse.json({error:"Unable to update application status."},{status:500});
 const {error:auditError}=await admin.from("audit_events").insert({actor_user_id:auth.user.id,event_type:decision==="approve"?"staff_application_approved":"staff_application_rejected",target_user_id:userId,metadata:{email:target.work_email}});
 if(auditError)console.error("SELC application decision audit write failed:",auditError.message);
 const key=process.env.RESEND_API_KEY;
 const from=process.env.SELC_EMAIL_FROM;
 if(key&&from&&target.work_email){
  const subject=decision==="approve"?"Your South East London Care application has been approved":"Update on your South East London Care application";
  const html=decision==="approve"?"<p>Your SELC staff application has been approved. You can now sign in to the staff portal.</p>":"<p>Your SELC staff application has not been approved at this time. Please contact the company if you require further information.</p>";
  try{
   const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({from,to:[target.work_email],subject,html})});
   if(!response.ok)console.error("SELC applicant decision email failed:",response.status,await response.text());
  }catch(error){console.error("SELC applicant decision email request failed:",error);}
 }
 return NextResponse.json({success:true,status});
}

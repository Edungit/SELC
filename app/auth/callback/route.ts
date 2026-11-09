import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";

function escapeHtml(value:string){
 return value.replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]??char));
}

async function notifyAdministrator(userId:string,email:string|null,firstName:string|null,lastName:string|null){
 const admin=createAdminClient();
 const adminEmail=process.env.ADMIN_APPROVAL_EMAIL||"edunhabeeb@gmail.com";
 const apiKey=process.env.RESEND_API_KEY;
 const from=process.env.SELC_EMAIL_FROM;
 if(!apiKey||!from){
  const reason="Missing RESEND_API_KEY or SELC_EMAIL_FROM environment variable.";
  await admin.from("staff_profiles").update({admin_notification_status:"failed",admin_notification_error:reason}).eq("user_id",userId);
  console.error("SELC admin notification configuration error:",reason);
  return;
 }
 const name=[firstName,lastName].filter(Boolean).join(" ")||"New applicant";
 try{
  const response=await fetch("https://api.resend.com/emails",{
   method:"POST",
   headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},
   body:JSON.stringify({
    from,to:[adminEmail],
    subject:"New SELC staff application awaiting review",
    html:"<div style='font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#172033'><h2>New staff application</h2><p>A new applicant has verified their email address and is awaiting review.</p><p><strong>Applicant:</strong> "+escapeHtml(name)+"<br/><strong>Email:</strong> "+escapeHtml(email||"Not provided")+"</p><p><a href='https://selc-six.vercel.app/admin/applications'>Open SELC application review</a></p></div>"
   })
  });
  const result=await response.json().catch(()=>({}));
  if(!response.ok){
   const reason=String(result?.message||result?.error||("Resend API returned HTTP "+response.status)).slice(0,1000);
   await admin.from("staff_profiles").update({admin_notification_status:"failed",admin_notification_error:reason}).eq("user_id",userId);
   console.error("SELC admin notification rejected by Resend:",response.status,reason);
   return;
  }
  const {error:updateError}=await admin.from("staff_profiles").update({
   admin_notification_status:"sent",
   admin_notification_sent_at:new Date().toISOString(),
   admin_notification_error:null
  }).eq("user_id",userId);
  if(updateError)console.error("SELC notification sent but database status update failed:",updateError.message);
 }catch(error){
  const reason=error instanceof Error?error.message:"Unknown Resend delivery error";
  await admin.from("staff_profiles").update({admin_notification_status:"failed",admin_notification_error:reason.slice(0,1000)}).eq("user_id",userId);
  console.error("SELC admin notification request failed:",reason);
 }
}

export async function GET(request:Request){
 const url=new URL(request.url);
 const code=url.searchParams.get("code");
 const next=url.searchParams.get("next")??"/dashboard";
 const safeNext=next.startsWith("/")&&!next.startsWith("//")?next:"/dashboard";
 if(!code)return NextResponse.redirect(new URL("/login?error=recovery_link_invalid",url.origin));
 const supabase=await createClient();
 const {error}=await supabase.auth.exchangeCodeForSession(code);
 if(error){
  console.error("SELC auth callback code exchange failed:",error.message);
  return NextResponse.redirect(new URL("/login?error=recovery_link_invalid",url.origin));
 }
 const {data:{user}}=await supabase.auth.getUser();
 if(user?.email_confirmed_at){
  const admin=createAdminClient();
  const {data:profile,error:profileError}=await admin.from("staff_profiles")
   .select("user_id,first_name,last_name,work_email,account_status,admin_notification_status,admin_notification_sent_at")
   .eq("user_id",user.id).maybeSingle();
  if(profileError)console.error("SELC applicant profile lookup failed:",profileError.message);
  if(profile?.account_status==="pending_review"&&profile.admin_notification_status!=="sent"){
   await notifyAdministrator(user.id,profile.work_email||user.email||null,profile.first_name,profile.last_name);
  }
 }
 return NextResponse.redirect(new URL(safeNext,url.origin));
}

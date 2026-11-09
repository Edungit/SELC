import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";

export async function GET(request:Request){
 const url=new URL(request.url);const code=url.searchParams.get("code");
 const next=url.searchParams.get("next")??"/dashboard";
 const safeNext=next.startsWith("/")&&!next.startsWith("//")?next:"/dashboard";
 if(code){
  const supabase=await createClient();
  const {error}=await supabase.auth.exchangeCodeForSession(code);
  if(!error){
   const {data:{user}}=await supabase.auth.getUser();
   if(user?.email_confirmed_at){
    const admin=createAdminClient();
    const {data:profile}=await admin.from("staff_profiles").select("user_id,first_name,last_name,work_email,account_status,admin_notification_sent_at").eq("user_id",user.id).maybeSingle();
    const apiKey=process.env.RESEND_API_KEY;const from=process.env.SELC_EMAIL_FROM;
    const adminEmail=process.env.ADMIN_APPROVAL_EMAIL||"edunhabeeb@gmail.com";
    if(profile?.account_status==="pending_review"&&!profile.admin_notification_sent_at&&apiKey&&from){
     const name=[profile.first_name,profile.last_name].filter(Boolean).join(" ")||"New applicant";
     try{
      const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},body:JSON.stringify({from,to:[adminEmail],subject:"New SELC staff application awaiting review",html:"<p>A new staff application has been submitted and the applicant has verified their email address.</p><p><strong>Applicant:</strong> "+name.replace(/[&<>"]/g,"")+"<br/><strong>Email:</strong> "+String(profile.work_email||user.email||"").replace(/[&<>"]/g,"")+"</p><p>Sign in to the SELC Staff Portal and open Review Applications to approve or reject this application.</p>"})});
      if(response.ok)await admin.from("staff_profiles").update({admin_notification_sent_at:new Date().toISOString()}).eq("user_id",user.id);
     }catch(error){console.error("SELC admin notification email failed",error);}
    }
   }
   return NextResponse.redirect(new URL(safeNext,url.origin));
  }
 }
 return NextResponse.redirect(new URL("/login?error=recovery_link_invalid",url.origin));
}

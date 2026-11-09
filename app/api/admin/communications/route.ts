import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
function esc(s:string){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]??c));}
export async function POST(req:Request){
 const session=await createClient();const {data:{user}}=await session.auth.getUser();if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 const {data:roles}=await session.from("user_role_assignments").select("role").eq("user_id",user.id);if(!roles?.some(r=>["super_administrator","hr_manager"].includes(r.role)))return NextResponse.json({error:"Only HR Managers and Super Administrators can publish announcements."},{status:403});
 try{
 const b=await req.json();const title=typeof b.title==="string"?b.title.trim():"";const body=typeof b.body==="string"?b.body.trim():"";const audience=b.audience;
 if(title.length<3||title.length>180||!body||body.length>12000||!["all_staff","carer","nurse"].includes(audience))return NextResponse.json({error:"Check the title, message and audience."},{status:400});
 const admin=createAdminClient();const {data:recipients,error:lookup}=await admin.from("staff_profiles").select("user_id,work_email,first_name,last_name").eq("account_status","active").not("work_email","is",null).match(audience==="all_staff"?{}:{application_track:audience});
 if(lookup)return NextResponse.json({error:"Could not identify announcement recipients: "+lookup.message},{status:500});
 const eligible=(recipients??[]).filter(x=>x.work_email);
 const {data:announcement,error}=await admin.from("staff_announcements").insert({title,body,audience,published:true,created_by:user.id,published_at:new Date().toISOString(),email_status:"not_sent"}).select("*").single();
 if(error||!announcement)return NextResponse.json({error:"Could not publish announcement: "+(error?.message||"unknown error")},{status:500});
 const key=process.env.RESEND_API_KEY;const from=process.env.SELC_EMAIL_FROM;let sent=0;let failed=0;let failureReason="";
 if(!key||!from){failed=eligible.length;failureReason="Email service is not configured (RESEND_API_KEY or SELC_EMAIL_FROM missing).";}
 else{
  for(let i=0;i<eligible.length;i+=50){
   const batch=eligible.slice(i,i+50);
   try{const response=await fetch("https://api.resend.com/emails/batch",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify(batch.map(x=>({from,to:[x.work_email],subject:"South East London Care: "+title,html:"<div style='font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#172033'><h2 style='color:#102746'>"+esc(title)+"</h2><p style='white-space:pre-wrap;line-height:1.65'>"+esc(body)+"</p><hr/><p style='font-size:12px;color:#667085'>South East London Care · Staff communications</p><p><a href='https://selc-six.vercel.app/dashboard'>Open staff portal</a></p></div>"})))});const result=await response.json().catch(()=>({}));if(response.ok)sent+=batch.length;else{failed+=batch.length;failureReason=String(result?.message||"Email provider returned HTTP "+response.status).slice(0,500);}}
   catch(e){failed+=batch.length;failureReason=e instanceof Error?e.message:"Email delivery request failed.";}}
 }
 const emailStatus=failed===0?"sent":sent===0?"failed":"partial";
 const {error:updateError}=await admin.from("staff_announcements").update({email_status:emailStatus,email_sent_count:sent}).eq("id",announcement.id);
 await admin.from("audit_events").insert({actor_user_id:user.id,event_type:"staff_announcement_published",metadata:{announcement_id:announcement.id,audience,recipient_count:eligible.length,email_sent_count:sent,email_failed_count:failed}});
 return NextResponse.json({success:true,announcement:{...announcement,email_status:emailStatus,email_sent_count:sent},message:updateError?"Published, but email delivery status could not be saved.":failed?("Published to portal; "+sent+" email(s) accepted and "+failed+" failed. "+failureReason):("Published to portal and "+sent+" email(s) accepted by Resend.")});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unable to publish announcement."},{status:500});}
}
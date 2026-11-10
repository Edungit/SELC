import {NextResponse} from "next/server";
import {createAdminClient} from "@/lib/supabase/admin";
function londonToday(){const p=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/London",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());return p;}
function daysUntil(date:string,today:string){return Math.round((Date.parse(date+"T12:00:00Z")-Date.parse(today+"T12:00:00Z"))/86400000);}
function esc(s:string){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]??c));}
export async function GET(req:Request){
 const secret=process.env.CRON_SECRET;if(!secret||req.headers.get("authorization")!=="Bearer "+secret)return NextResponse.json({error:"Unauthorised."},{status:401});
 const key=process.env.RESEND_API_KEY,from=process.env.SELC_EMAIL_FROM;if(!key||!from)return NextResponse.json({error:"Email service is not configured."},{status:503});
 const admin=createAdminClient(),today=londonToday();
 const [{data:profiles,error:pErr},{data:docs,error:dErr},{data:nurses,error:nErr},{data:training,error:tErr},{data:requirements,error:rErr},{data:refs,error:refErr}]=await Promise.all([
  admin.from("staff_profiles").select("user_id,first_name,last_name,work_email,application_track,account_status").eq("account_status","active").not("work_email","is",null),
  admin.from("staff_document_records").select("id,user_id,document_type,expiry_date,review_status,application_track").in("review_status",["accepted","pending"]),
  admin.from("nurse_professional_details").select("user_id,registration_expiry,indemnity_expiry,registration_number,professional_body,indemnity_insurance"),
  admin.from("staff_training_records").select("id,user_id,course_name,expiry_date,verification_status").in("verification_status",["verified","pending"]),
  admin.from("staff_compliance_requirements").select("id,application_track,requirement_type,document_type,mandatory").eq("active",true).eq("mandatory",true),
  admin.from("staff_referees").select("user_id")
 ]);
 const err=pErr||dErr||nErr||tErr||rErr||refErr;if(err)return NextResponse.json({error:"Could not retrieve compliance data: "+err.message},{status:500});
 const candidates:any[]=[];const windows=[90,60,30,14,7,0];
 const add=(userId:string,type:string,id:string,due:string|null,stage:string)=>candidates.push({user_id:userId,source_type:type,source_id:id, due_date:due,alert_stage:stage});
 const profilesById=new Map((profiles??[]).map(x=>[x.user_id,x]));
 for(const d of docs??[]){if(!d.expiry_date)continue;const days=daysUntil(d.expiry_date,today);const stage=days<0?"overdue":windows.includes(days)?String(days)+"_days":null;if(stage)add(d.user_id,"document",d.id,d.expiry_date,stage);}
 for(const n of nurses??[]){for(const [field,type] of [["registration_expiry","nurse_registration"],["indemnity_expiry","nurse_indemnity"]] as const){const due=(n as any)[field];if(!due)continue;const days=daysUntil(due,today);const stage=days<0?"overdue":windows.includes(days)?String(days)+"_days":null;if(stage)add(n.user_id,type,n.user_id,due,stage);}}
 for(const t of training??[]){if(!t.expiry_date)continue;const days=daysUntil(t.expiry_date,today);const stage=days<0?"overdue":windows.includes(days)?String(days)+"_days":null;if(stage)add(t.user_id,"training",t.id,t.expiry_date,stage);}
 for(const profile of profiles??[]){const reqs=(requirements??[]).filter(x=>x.application_track===profile.application_track);for(const req of reqs){let present=false;if(req.requirement_type==="document")present=(docs??[]).some(d=>d.user_id===profile.user_id&&d.document_type===req.document_type&&d.review_status!=="rejected");else present=(refs??[]).filter(x=>x.user_id===profile.user_id).length>=2;if(!present){add(profile.user_id,"missing_requirement",req.id,null,"missing");}}}
 const unique=new Map<string,any>();for(const x of candidates)unique.set([x.user_id,x.source_type,x.source_id,x.alert_stage].join("|"),x);
 let created=0,sent=0,failed=0;
 for(const item of unique.values()){
  const {data:alert,error:insertErr}=await admin.from("staff_compliance_alerts").upsert(item,{onConflict:"user_id,source_type,source_id,alert_stage",ignoreDuplicates:true}).select("id,user_id,source_type,source_id,alert_stage,due_date,staff_email_status,hr_email_status").maybeSingle();
  if(insertErr){failed++;continue;}if(!alert)continue;created++;
  const profile=profilesById.get(item.user_id);if(!profile?.work_email)continue;
  let subject="South East London Care: compliance action required",message="";
  if(item.source_type==="missing_requirement"){subject+=" – missing information";message="Our records indicate that a mandatory recruitment or compliance item is missing from your staff portal. Please sign in and review your profile and document checklist.";}
  else {const label=item.source_type==="document"?"a staff document":item.source_type==="training"?"a training certificate":item.source_type==="nurse_registration"?"your professional registration":"your indemnity insurance";message="Our records indicate that "+label+" "+(item.alert_stage==="overdue"?"has passed its recorded expiry date.":"is due to expire on "+item.due_date+".")+" Please review the record and upload updated evidence where required.";}
  const html="<div style='font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#172033'><h2 style='color:#102746'>Compliance reminder</h2><p>Hello "+esc(profile.first_name||"colleague")+",</p><p>"+esc(message)+"</p><p><a href='https://selc-six.vercel.app/profile'>Open your staff profile</a></p><hr/><p style='font-size:12px;color:#667085'>South East London Care · This is an automated reminder. Contact HR if you believe this information is incorrect.</p></div>";
  if(alert.staff_email_status!=="sent"){try{const res=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({from,to:[profile.work_email],subject,html})});if(res.ok){await admin.from("staff_compliance_alerts").update({staff_email_status:"sent",staff_sent_at:new Date().toISOString(),staff_email:profile.work_email,updated_at:new Date().toISOString()}).eq("id",alert.id);sent++;}else{const body=await res.text();await admin.from("staff_compliance_alerts").update({staff_email_status:"failed",failure_reason:body.slice(0,500),staff_email:profile.work_email}).eq("id",alert.id);failed++;}}catch(e){failed++;await admin.from("staff_compliance_alerts").update({staff_email_status:"failed",failure_reason:String(e).slice(0,500)}).eq("id",alert.id);}}
 }
 return NextResponse.json({success:true,date:today,candidates:unique.size,alertsCreated:created,emailsAccepted:sent,failures:failed});
}
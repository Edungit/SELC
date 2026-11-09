import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
export async function PATCH(request:Request){
 const session=await createClient();const {data:{user}}=await session.auth.getUser();if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 const {data:roles,error:roleError}=await session.from("user_role_assignments").select("role").eq("user_id",user.id);
 if(roleError||!roles?.some(r=>["super_administrator","hr_manager","compliance_officer"].includes(r.role)))return NextResponse.json({error:"Not authorised to review compliance documents."},{status:403});
 try{const body=await request.json();const documentId=typeof body.documentId==="string"?body.documentId:"";const decision=body.decision;const reviewNote=typeof body.reviewNote==="string"?body.reviewNote.slice(0,2000):"";const expiryDate=body.expiryDate||null;
 if(!documentId||!(decision==="accepted"||decision==="rejected"))return NextResponse.json({error:"Invalid document review request."},{status:400});
 if(expiryDate&&!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate))return NextResponse.json({error:"Expiry date must be a valid date."},{status:400});
 const admin=createAdminClient();const {data:updated,error}=await admin.from("staff_document_records").update({review_status:decision,reviewed_by:user.id,reviewed_at:new Date().toISOString(),review_note:reviewNote||null,expiry_date:expiryDate}).eq("id",documentId).select("id").maybeSingle();
 if(error||!updated)return NextResponse.json({error:error?.message||"Document record not found."},{status:400});
 await admin.from("audit_events").insert({actor_user_id:user.id,event_type:decision==="accepted"?"staff_document_accepted":"staff_document_rejected",metadata:{document_id:documentId,expiry_date:expiryDate}});
 return NextResponse.json({success:true});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unable to review document."},{status:500});}
}
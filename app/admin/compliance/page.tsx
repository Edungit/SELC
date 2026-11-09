import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import DocumentReviewList from "./document-review-list";
export default async function CompliancePage(){
 const session=await createClient();const {data:{user}}=await session.auth.getUser();if(!user)redirect("/login?next=%2Fadmin%2Fcompliance");
 const {data:roles}=await session.from("user_role_assignments").select("role").eq("user_id",user.id);
 if(!roles?.some(r=>["super_administrator","hr_manager","compliance_officer"].includes(r.role)))redirect("/dashboard");
 const admin=createAdminClient();
 const {data:docs,error}=await admin.from("staff_document_records").select("id,user_id,application_track,document_type,storage_path,original_filename,mime_type,file_size_bytes,sensitivity,review_status,expiry_date,uploaded_at,review_note").order("uploaded_at",{ascending:false}).limit(250);
 if(error)throw new Error("Unable to load compliance documents: "+error.message);
 const userIds=[...new Set((docs??[]).map(d=>d.user_id))];
 const {data:profiles}=userIds.length?await admin.from("staff_profiles").select("user_id,first_name,last_name,work_email").in("user_id",userIds):{data:[]};
 const mapped=await Promise.all((docs??[]).map(async d=>{const {data}=await admin.storage.from("selc-staff-documents").createSignedUrl(d.storage_path,300);const p=profiles?.find(x=>x.user_id===d.user_id);return {...d,preview_url:data?.signedUrl??null,staff_name:[p?.first_name,p?.last_name].filter(Boolean).join(" ")||"Staff member",staff_email:p?.work_email||""};}));
 return <main className="min-h-screen bg-[#f4f6fa] px-4 py-8 sm:px-8"><div className="mx-auto max-w-7xl"><Link href="/dashboard" className="text-sm font-semibold text-selc-blue">← Dashboard</Link><p className="mt-7 text-xs font-bold uppercase tracking-[.18em] text-selc-red">South East London Care · Compliance</p><h1 className="mt-2 text-3xl font-bold text-selc-navy">Document review centre</h1><p className="mt-2 text-sm text-slate-600">Review restricted staff records, verify expiry information and record acceptance or rejection decisions.</p><DocumentReviewList documents={mapped}/></div></main>;
}
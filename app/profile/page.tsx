import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import ProfileWorkspace from "./profile-workspace";
export default async function ProfilePage(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login?next=%2Fprofile");
 const [{data:profile},{data:details},{data:refs},{data:employment},{data:nurse},{data:carer},{data:docs}] = await Promise.all([
  supabase.from("staff_profiles").select("first_name,last_name,work_email,application_track,staff_number,profile_photo_path").eq("user_id",user.id).maybeSingle(),
  supabase.from("staff_application_details").select("*").eq("user_id",user.id).maybeSingle(),
  supabase.from("staff_referees").select("*").eq("user_id",user.id).order("created_at"),
  supabase.from("staff_employment_history").select("*").eq("user_id",user.id).order("display_order"),
  supabase.from("nurse_professional_details").select("*").eq("user_id",user.id).maybeSingle(),
  supabase.from("carer_professional_details").select("*").eq("user_id",user.id).maybeSingle(),
  supabase.from("staff_document_records").select("id,document_type,original_filename,review_status,expiry_date,sensitivity,uploaded_at").eq("user_id",user.id).order("uploaded_at",{ascending:false})
 ]);
 const track="carer" as const;
 const {data:photo}=profile?.profile_photo_path?await supabase.storage.from("selc-profile-photos").createSignedUrl(profile.profile_photo_path,3600):{data:null};
 return <main className="min-h-screen bg-[#f4f6fa] px-4 py-8 sm:px-8"><div className="mx-auto max-w-5xl"><Link href="/dashboard" className="text-sm font-semibold text-selc-blue">← Dashboard</Link><div className="mt-6"><p className="text-xs font-bold uppercase tracking-[.18em] text-selc-red">Registration Portal</p><h1 className="mt-2 text-3xl font-bold text-selc-navy">Personal information</h1><p className="mt-2 text-sm text-slate-600">Complete your {track} profile and submit the records required for recruitment and compliance review.</p></div><ProfileWorkspace userId={user.id} track={track} profile={profile} profilePhotoUrl={photo?.signedUrl??null} details={details} referees={refs??[]} employment={employment??[]} nurse={nurse} carer={carer} documents={docs??[]}/></div></main>;
}
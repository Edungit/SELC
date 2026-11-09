import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
export async function GET(){
 const s=await createClient();const {data:{user}}=await s.auth.getUser();if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 const {data,error}=await s.from("staff_leave_requests").select("id,leave_type,start_date,end_date,reason,status,manager_note,created_at").eq("user_id",user.id).order("created_at",{ascending:false});
 if(error)return NextResponse.json({error:"Unable to load leave requests."},{status:500});return NextResponse.json({requests:data??[]});
}
export async function POST(req:Request){
 const s=await createClient();const {data:{user}}=await s.auth.getUser();if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 try{const b=await req.json();const {leaveType,startDate,endDate,reason}=b;if(!["annual_leave","sickness","compassionate","unpaid","other"].includes(leaveType)||typeof startDate!=="string"||typeof endDate!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(startDate)||!/^\d{4}-\d{2}-\d{2}$/.test(endDate)||endDate<startDate||typeof reason!=="string"&&reason!=null||String(reason??"").length>2000)return NextResponse.json({error:"Enter a valid leave type, date range and reason."},{status:400});
 const {data:p}=await s.from("staff_profiles").select("department_id,account_status").eq("user_id",user.id).maybeSingle();if(p?.account_status!=="active")return NextResponse.json({error:"Only active staff can submit requests."},{status:403});
 const {data,error}=await s.from("staff_leave_requests").insert({user_id:user.id,department_id:p.department_id,leave_type:leaveType,start_date:startDate,end_date:endDate,reason:reason?.trim()||null}).select("id").single();if(error)return NextResponse.json({error:"Could not submit request: "+error.message},{status:400});
 return NextResponse.json({success:true,id:data.id});
 }catch{return NextResponse.json({error:"Invalid request."},{status:400});}
}
export async function PATCH(req:Request){
 const s=await createClient();const {data:{user}}=await s.auth.getUser();if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 const b=await req.json();if(typeof b.id!=="string"||b.action!=="cancel")return NextResponse.json({error:"Invalid cancellation request."},{status:400});
 const {data,error}=await s.from("staff_leave_requests").update({status:"cancelled",updated_at:new Date().toISOString()}).eq("id",b.id).eq("user_id",user.id).eq("status","pending").select("id").maybeSingle();
 if(error||!data)return NextResponse.json({error:"Only your pending requests can be cancelled."},{status:409});return NextResponse.json({success:true});
}
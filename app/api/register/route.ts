import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
export async function POST(request:Request){
try{
 const body=await request.json();
 const firstName=typeof body.firstName==="string"?body.firstName.trim():"";
 const lastName=typeof body.lastName==="string"?body.lastName.trim():"";
 const email=typeof body.email==="string"?body.email.trim().toLowerCase():"";
 const password=typeof body.password==="string"?body.password:"";
 const applicationTrack=body.applicationTrack==="nurse"?"nurse":body.applicationTrack==="carer"?"carer":"";
 if(!firstName||!lastName||firstName.length>80||lastName.length>80)return NextResponse.json({error:"Enter your first and last name."},{status:400});
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return NextResponse.json({error:"Enter a valid email address."},{status:400});
 if(password.length<12)return NextResponse.json({error:"Password must contain at least 12 characters."},{status:400});
 if(!applicationTrack)return NextResponse.json({error:"Choose whether you are applying as a carer or nurse."},{status:400});
 const supabase=await createClient();const origin=new URL(request.url).origin;
 const {data,error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:origin+"/auth/callback?next=/pending-approval",data:{first_name:firstName,last_name:lastName,application_track:applicationTrack}}});
 if(error)return NextResponse.json({error:error.message},{status:400});
 return NextResponse.json({success:true,message:data.session?"Application received. Please verify your email and wait for administrator approval.":"If this address can be registered, a verification email has been sent. After verifying it, your application will be reviewed by an SELC administrator."});
}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Registration could not be submitted."},{status:500});}
}
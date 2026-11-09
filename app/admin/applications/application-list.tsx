"use client";
import {useEffect,useState} from "react";
type Applicant={user_id:string;first_name:string|null;last_name:string|null;work_email:string|null;application_submitted_at:string|null;admin_notification_status:"pending"|"sent"|"failed";admin_notification_error:string|null};
export default function ApplicationList(){
 const [items,setItems]=useState<Applicant[]>([]);
 const [busy,setBusy]=useState(true);
 const [error,setError]=useState("");
 const [working,setWorking]=useState("");
 const [notice,setNotice]=useState("");
 async function load(){
  setBusy(true);
  try{const r=await fetch("/api/admin/applications");const d=await r.json();if(!r.ok)throw new Error(d.error);setItems(d.applications??[]);}
  catch(e){setError(e instanceof Error?e.message:"Unable to load applications.");}
  finally{setBusy(false);}
 }
 useEffect(()=>{void load();},[]);
 async function notify(userId:string){
  setWorking(userId);setError("");setNotice("");
  try{
   const r=await fetch("/api/admin/applications",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId})});
   const d=await r.json();if(!r.ok)throw new Error(d.error||"Notification failed.");
   setNotice(d.message||"Notification accepted by Resend.");
   await load();
  }catch(e){setError(e instanceof Error?e.message:"Notification failed.");await load();}
  finally{setWorking("");}
 }
 async function decide(userId:string,decision:"approve"|"reject"){
  setWorking(userId);setError("");setNotice("");
  try{
   const r=await fetch("/api/admin/applications",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId,decision})});
   const d=await r.json();if(!r.ok)throw new Error(d.error);
   setItems(old=>old.filter(x=>x.user_id!==userId));
   setNotice(decision==="approve"?"Application approved.":"Application rejected.");
  }catch(e){setError(e instanceof Error?e.message:"Decision could not be saved.");}
  finally{setWorking("");}
 }
 if(busy)return <p className="mt-6 text-sm text-slate-500">Loading applications…</p>;
 return <div className="mt-6 space-y-4">
  {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
  {notice&&<p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
  {items.length===0?<div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">There are no applications awaiting review.</div>:items.map(item=><article key={item.user_id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
   <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
    <div className="min-w-0"><h2 className="font-bold text-selc-ink">{[item.first_name,item.last_name].filter(Boolean).join(" ")||"Applicant"}</h2><p className="mt-1 text-sm text-slate-600">{item.work_email}</p><p className="mt-1 text-xs text-slate-400">Submitted: {item.application_submitted_at?new Date(item.application_submitted_at).toLocaleString("en-GB"):"Date unavailable"}</p>
     <p className="mt-2 text-xs font-semibold">Admin email: {item.admin_notification_status==="sent"?"Sent to Resend":item.admin_notification_status==="failed"?"Failed":"Not yet sent"}</p>
     {item.admin_notification_error&&<p className="mt-1 max-w-xl text-xs text-red-700">Delivery error: {item.admin_notification_error}</p>}
    </div>
    <div className="flex flex-wrap gap-2">
     {item.admin_notification_status!=="sent"&&<button disabled={!!working} onClick={()=>notify(item.user_id)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-selc-navy disabled:opacity-50">{working===item.user_id?"Sending…":"Send admin alert"}</button>}
     <button disabled={!!working} onClick={()=>decide(item.user_id,"approve")} className="rounded-lg bg-selc-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{working===item.user_id?"Saving…":"Approve"}</button>
     <button disabled={!!working} onClick={()=>decide(item.user_id,"reject")} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">Reject</button>
    </div>
   </div>
  </article>)}
 </div>;
}

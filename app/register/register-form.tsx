"use client";
import {FormEvent,useState} from "react";
import Link from "next/link";
export default function RegisterForm(){
 const [firstName,setFirstName]=useState("");const [lastName,setLastName]=useState("");
 const [email,setEmail]=useState("");const [password,setPassword]=useState("");
 const [track,setTrack]=useState("carer");
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");const [error,setError]=useState("");
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setError("");setMessage("");
  try{const r=await fetch("/api/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({firstName,lastName,email,password,applicationTrack:track})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Registration failed.");setMessage(d.message||"Application submitted.");}
  catch(e){setError(e instanceof Error?e.message:"Registration failed.");}finally{setBusy(false);}
 }
 return <form onSubmit={submit} className="space-y-4">
  {message?<p role="status" className="rounded-xl bg-green-50 p-4 text-sm leading-6 text-green-900">{message}</p>:<>
   <div className="grid grid-cols-2 gap-3">
    <div><label htmlFor="firstName" className="mb-2 block text-sm font-semibold">First name</label><input id="firstName" required maxLength={80} value={firstName} onChange={e=>setFirstName(e.target.value)} autoComplete="given-name" className="w-full rounded-xl border border-slate-200 px-3 py-3"/></div>
    <div><label htmlFor="lastName" className="mb-2 block text-sm font-semibold">Last name</label><input id="lastName" required maxLength={80} value={lastName} onChange={e=>setLastName(e.target.value)} autoComplete="family-name" className="w-full rounded-xl border border-slate-200 px-3 py-3"/></div>
   </div>
   <div><label htmlFor="track" className="mb-2 block text-sm font-semibold">I am applying as</label><select id="track" value={track} onChange={e=>setTrack(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"><option value="carer">Carer</option><option value="nurse">Nurse / Midwife / ODP</option></select><p className="mt-1 text-xs text-slate-500">Your application checklist and professional details will depend on this selection.</p></div>
   <div><label htmlFor="email" className="mb-2 block text-sm font-semibold">Email address</label><input id="email" type="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" className="w-full rounded-xl border border-slate-200 px-4 py-3"/></div>
   <div><label htmlFor="password" className="mb-2 block text-sm font-semibold">Create password</label><input id="password" type="password" required minLength={12} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" className="w-full rounded-xl border border-slate-200 px-4 py-3"/><p className="mt-1 text-xs text-slate-500">Use at least 12 characters.</p></div>
   {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
   <button disabled={busy} className="w-full rounded-xl bg-selc-red px-4 py-3.5 font-semibold text-white disabled:opacity-60">{busy?"Submitting…":"Submit application"}</button>
   <p className="text-xs leading-5 text-slate-500">Your account remains restricted until an administrator approves your application.</p>
  </>}
  <p className="text-center text-sm text-slate-600">Already registered? <Link href="/login" className="font-semibold text-selc-blue">Sign in</Link></p>
 </form>;
}
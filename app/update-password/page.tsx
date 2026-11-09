"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router=useRouter();
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [busy,setBusy]=useState(false);
  const [done,setDone]=useState(false);
  const [error,setError]=useState("");
  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError("");
    if(password.length<12) { setError("Use at least 12 characters for your new password."); return; }
    if(password!==confirm) { setError("The passwords do not match."); return; }
    setBusy(true);
    try {
      const supabase=createClient();
      const {data:{user},error:sessionError}=await supabase.auth.getUser();
      if(sessionError || !user) throw new Error("Your recovery session is missing or expired. Request a new recovery link.");
      const {error:updateError}=await supabase.auth.updateUser({password});
      if(updateError) throw updateError;
      setDone(true);
      setTimeout(()=>{ router.replace("/login"); router.refresh(); },1800);
    } catch(err) { setError(err instanceof Error ? err.message : "Unable to update password."); }
    finally { setBusy(false); }
  }
  return <main className="flex min-h-screen items-center justify-center px-5 py-12"><section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-panel sm:p-9">
    <p className="text-xs font-bold uppercase tracking-[.18em] text-selc-red">South East London Care</p><h1 className="mt-3 text-2xl font-bold text-selc-navy">Choose a new password</h1>
    {done ? <p className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-800" role="status">Your password has been updated. Redirecting you to sign in…</p> :
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div><label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">New password</label><input id="password" type="password" required minLength={12} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-selc-blue focus:ring-4 focus:ring-blue-100"/></div>
      <div><label htmlFor="confirm" className="mb-2 block text-sm font-semibold text-slate-700">Confirm new password</label><input id="confirm" type="password" required minLength={12} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-selc-blue focus:ring-4 focus:ring-blue-100"/></div>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={busy} className="w-full rounded-xl bg-selc-navy px-4 py-3 font-semibold text-white disabled:opacity-60">{busy ? "Updating…" : "Update password"}</button>
    </form>}
    <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-selc-blue hover:underline">Return to sign in</Link>
  </section></main>;
}
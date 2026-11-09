"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email,setEmail]=useState("");
  const [busy,setBusy]=useState(false);
  const [sent,setSent]=useState(false);
  const [error,setError]=useState("");
  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const supabase=createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/update-password`;
      const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo});
      if(error) throw error;
      setSent(true);
    } catch(err) { setError(err instanceof Error ? err.message : "Unable to send the recovery email."); }
    finally { setBusy(false); }
  }
  return <main className="flex min-h-screen items-center justify-center px-5 py-12">
    <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-panel sm:p-9">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-selc-red">South East London Care</p>
      <h1 className="mt-3 text-2xl font-bold text-selc-navy">Reset your password</h1>
      {sent ? <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800" role="status">If an account exists for that email address, a password recovery link will be sent. Check your inbox and follow the link to continue.</div> :
      <form onSubmit={submit} className="mt-6 space-y-4">
        <p className="text-sm leading-6 text-slate-600">Enter the work email address associated with your staff account. We will send instructions if the account is eligible for recovery.</p>
        <div><label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">Work email address</label><input id="email" type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-selc-blue focus:ring-4 focus:ring-blue-100"/></div>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-selc-navy px-4 py-3 font-semibold text-white disabled:opacity-60">{busy ? "Sending…" : "Send recovery link"}</button>
      </form>}
      <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-selc-blue hover:underline">Return to sign in</Link>
    </section>
  </main>;
}
"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
export default function LoginForm() {
  const router = useRouter(); const params = useSearchParams();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      router.replace(params.get("next") || "/dashboard"); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to sign in. Please try again."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-5">
    <div><label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">Work email address</label><input id="email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-selc-blue focus:ring-4 focus:ring-blue-100" placeholder="name@company.co.uk"/></div>
    <div><div className="mb-2 flex justify-between"><label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</label><a href="/forgot-password" className="text-sm font-semibold text-selc-blue hover:underline">Forgot password?</a></div><input id="password" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-selc-blue focus:ring-4 focus:ring-blue-100" placeholder="Enter your password"/></div>
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    <button disabled={busy} className="w-full rounded-xl bg-selc-navy px-4 py-3.5 font-semibold text-white shadow-panel hover:bg-selc-blue disabled:opacity-60">{busy ? "Signing in…" : "Sign in securely"}</button>
    <p className="text-center text-xs leading-5 text-slate-500">New to SELC? <Link href="/register" className="font-semibold text-selc-blue hover:underline">Create an account</Link>. All applications require administrator approval.</p>
  </form>;
}
import Image from "next/image";
import { Suspense } from "react";
import LoginForm from "./login-form";
export default function LoginPage() {
  return <main className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
    <section className="relative hidden overflow-hidden bg-selc-navy px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="absolute -right-32 -top-28 h-96 w-96 rounded-full border-[60px] border-white/5"/>
      <div className="absolute -bottom-40 -left-24 h-[30rem] w-[30rem] rounded-full bg-selc-red/20 blur-3xl"/>
      <div className="relative z-10"><div className="inline-flex rounded-2xl bg-white p-3"><Image src="https://southeastlondoncare.co.uk/wp-content/uploads/2025/03/selc.jpeg" alt="South East London Care" width={190} height={90} className="h-16 w-auto object-contain"/></div>
      <p className="mt-12 text-sm font-semibold uppercase tracking-[.24em] text-blue-200">Staff management portal</p><h1 className="mt-4 max-w-xl text-5xl font-bold leading-tight">Care starts with the people who make it happen.</h1><p className="mt-6 max-w-lg text-lg leading-8 text-blue-100">A secure place for South East London Care colleagues to manage their information, documents and work communications.</p></div>
      <div className="relative z-10 flex justify-between text-sm text-blue-200"><span>We love to care.</span><span>South East London Care</span></div>
    </section>
    <section className="flex items-center justify-center px-5 py-12 sm:px-10"><div className="w-full max-w-md">
      <div className="mb-10 lg:hidden"><Image src="https://southeastlondoncare.co.uk/wp-content/uploads/2025/03/selc.jpeg" alt="South East London Care" width={190} height={90} className="h-16 w-auto object-contain"/></div>
      <p className="text-sm font-bold uppercase tracking-[.18em] text-selc-red">South East London Care</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-selc-ink">Welcome back</h2><p className="mt-2 text-slate-500">Sign in to your staff account.</p>
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-panel sm:p-8"><Suspense fallback={<p className="text-sm text-slate-500">Loading sign-in…</p>}><LoginForm/></Suspense></div>
      <p className="mt-8 text-center text-xs text-slate-400">Protected staff access · South East London Care</p>
    </div></section>
  </main>;
}
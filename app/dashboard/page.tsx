import Image from "next/image";
import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {Activity,ArrowUpRight,Bell,BriefcaseBusiness,CalendarDays,CheckCircle2,ChevronRight,ClipboardCheck,FileCheck2,FileText,FolderOpen,LayoutDashboard,LogOut,Mail,MessageSquare,ShieldCheck,Users,UserRound} from "lucide-react";

const roleLabels:Record<string,string>={
 super_administrator:"Super Administrator",
 hr_manager:"HR Manager",
 department_manager:"Department Manager",
 compliance_officer:"Compliance Officer",
 staff_member:"Staff Member"
};

function Logo({compact=false}:{compact?:boolean}){
 return <div className="flex items-center gap-3">
  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-sm">
   <Image src="https://southeastlondoncare.co.uk/wp-content/uploads/2025/03/selc.jpeg" alt="South East London Care logo" width={160} height={100} priority className="h-full w-full object-contain"/>
  </div>
  {!compact&&<div className="min-w-0"><p className="text-sm font-bold leading-tight text-white">South East London Care</p><p className="mt-1 text-[10px] font-semibold uppercase tracking-[.17em] text-blue-200">Staff portal</p></div>}
 </div>;
}

export default async function DashboardPage(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const {data:profile}=await supabase.from("staff_profiles").select("account_status,first_name,last_name").eq("user_id",user.id).maybeSingle();
 if(profile?.account_status==="pending_review"||profile?.account_status==="rejected")redirect("/pending-approval");
 const {data:assignments}=await supabase.from("user_role_assignments").select("role").eq("user_id",user.id);
 const roles=assignments?.map(x=>x.role)??[];
 const canManage=roles.includes("super_administrator")||roles.includes("hr_manager");
 const displayName=[profile?.first_name,profile?.last_name].filter(Boolean).join(" ")||user.email?.split("@")[0]||"Colleague";
 const primaryRole=roles[0]?roleLabels[roles[0]]??roles[0]:"Staff Member";
 async function signOut(){
  "use server";
  const client=await createClient();
  await client.auth.signOut();
  redirect("/login");
 }
 const modules=[
  {icon:UserRound,title:"My profile",description:"Keep your personal and employment details up to date.",status:"Profile tools in progress"},
  {icon:FolderOpen,title:"My documents",description:"A secure place for required employment and compliance documents.",status:"Document centre in progress"},
  {icon:MessageSquare,title:"Staff communications",description:"Company updates and messages from your management team.",status:"Communications in progress"},
  {icon:CalendarDays,title:"My work",description:"Access work-related information and team updates.",status:"Work tools in progress"}
 ];
 return <div className="min-h-screen bg-[#f4f6fa] text-selc-ink">
  <div className="min-h-screen lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
   <aside className="hidden bg-[#102746] text-white lg:flex lg:flex-col">
    <div className="border-b border-white/10 px-6 py-6"><Logo/></div>
    <div className="px-4 py-6">
     <p className="px-3 text-[10px] font-bold uppercase tracking-[.2em] text-blue-200/70">Workspace</p>
     <nav className="mt-3 space-y-1">
      <div className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-3 text-sm font-semibold text-white"><LayoutDashboard size={18}/> Dashboard</div>
      <Link href="/profile" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-blue-100/75 transition hover:bg-white/10 hover:text-white"><UserRound size={18}/> My profile</Link>
      <Link href="/profile#documents" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-blue-100/75 transition hover:bg-white/10 hover:text-white"><FileCheck2 size={18}/> My documents</Link>
      <div className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-blue-100/75"><MessageSquare size={18}/> Communications <span className="ml-auto text-[10px] text-blue-200/60">Soon</span></div>
     </nav>
     {canManage&&<><p className="mt-9 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-blue-200/70">Management</p><nav className="mt-3 space-y-1">
      <Link href="/admin/applications" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-blue-100 transition hover:bg-white/10 hover:text-white"><ClipboardCheck size={18}/> Staff applications <ArrowUpRight className="ml-auto" size={14}/></Link>
      <Link href="/admin/invitations" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-blue-100 transition hover:bg-white/10 hover:text-white"><Users size={18}/> Staff invitations <ArrowUpRight className="ml-auto" size={14}/></Link>
     </nav></>}
    </div>
    <div className="mt-auto border-t border-white/10 p-5"><div className="rounded-xl bg-white/[.07] p-4"><div className="flex items-center gap-2 text-xs font-semibold text-blue-100"><ShieldCheck size={16}/> Secure staff access</div><p className="mt-2 text-[11px] leading-5 text-blue-100/65">Your portal access is protected by your assigned South East London Care role.</p></div><p className="mt-5 text-[10px] text-blue-200/50">© {new Date().getFullYear()} South East London Care</p></div>
   </aside>

   <div className="min-w-0">
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
     <div className="flex h-[76px] items-center justify-between gap-4 px-5 sm:px-8 xl:px-10">
      <div className="flex items-center gap-3 lg:hidden"><Logo compact/><div><p className="text-sm font-bold text-selc-navy">South East London Care Staff Portal</p><p className="text-[10px] text-slate-500">South East London Care</p></div></div>
      <div className="hidden lg:block"><p className="text-xs font-medium text-slate-500">Staff workspace</p><p className="mt-1 text-sm font-semibold text-selc-navy">Your dashboard</p></div>
      <div className="flex items-center gap-3">
       <div className="hidden text-right sm:block"><p className="text-sm font-semibold text-slate-800">{displayName}</p><p className="mt-0.5 text-xs text-slate-500">{primaryRole}</p></div>
       <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e9eef6] text-sm font-bold text-selc-navy">{displayName.slice(0,1).toUpperCase()}</div>
       <form action={signOut}><button aria-label="Sign out" title="Sign out" className="ml-1 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"><LogOut size={16}/><span className="hidden sm:inline">Sign out</span></button></form>
      </div>
     </div>
    </header>

    <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-9 xl:px-10">
     <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div><p className="text-xs font-bold uppercase tracking-[.18em] text-selc-red">Your South East London Care workspace</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-selc-navy sm:text-3xl">Good to have you here, {displayName}.</h1><p className="mt-2 text-sm text-slate-500">A central place for your staff information, documents and company updates.</p></div>
      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"><CheckCircle2 size={14}/> Account active</div>
     </div>

     <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#102746] via-[#153967] to-[#1c477d] p-6 text-white shadow-[0_16px_40px_rgba(16,39,70,.16)] sm:p-8">
      <div className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full border-[42px] border-white/[.06]"/>
      <div className="pointer-events-none absolute -bottom-36 right-48 h-64 w-64 rounded-full bg-[#c9343d]/20 blur-3xl"/>
      <div className="relative z-10 max-w-2xl"><div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-blue-100"><Activity size={13}/> SOUTH EAST LONDON CARE STAFF PORTAL</div><h2 className="mt-5 text-2xl font-bold leading-tight sm:text-3xl">Everything you need to stay connected.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-blue-100/85">Use your workspace to maintain your staff information and access the tools made available to your role.</p><div className="mt-5 flex flex-wrap gap-2">{roles.map(role=><span key={role} className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold">{roleLabels[role]??role}</span>)}</div></div>
     </section>

     {canManage&&<section className="mt-7">
      <div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-selc-red">Management workspace</p><h2 className="mt-1 text-lg font-bold text-selc-navy">People operations</h2></div><span className="text-xs text-slate-400">Administrator tools</span></div>
      <div className="grid gap-4 md:grid-cols-2">
       <Link href="/admin/applications" className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_3px_14px_rgba(16,43,85,.04)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-panel"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-selc-red"><ClipboardCheck size={22}/></div><div className="min-w-0 flex-1"><h3 className="font-bold text-selc-navy">Staff applications</h3><p className="mt-1 text-xs leading-5 text-slate-500">Review registrations and manage applicant decisions.</p></div><ChevronRight className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-selc-blue" size={19}/></Link>
       <Link href="/admin/invitations" className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_3px_14px_rgba(16,43,85,.04)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-panel"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-selc-blue"><Users size={22}/></div><div className="min-w-0 flex-1"><h3 className="font-bold text-selc-navy">Staff invitations</h3><p className="mt-1 text-xs leading-5 text-slate-500">Invite existing employees to activate portal access.</p></div><ChevronRight className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-selc-blue" size={19}/></Link>
      </div>
     </section>}

     <section className="mt-8">
      <div className="mb-4"><p className="text-xs font-bold uppercase tracking-[.16em] text-selc-red">Staff resources</p><h2 className="mt-1 text-lg font-bold text-selc-navy">Your workspace</h2><p className="mt-1 text-xs text-slate-500">Manage your personal details and submit recruitment documents securely.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
       {modules.map(item=><Link href="/profile" key={item.title} className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_3px_14px_rgba(16,43,85,.035)] transition hover:-translate-y-0.5 hover:border-blue-200"><div className="flex items-center justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef3fa] text-selc-blue"><item.icon size={21}/></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">Available</span></div><h3 className="mt-5 text-sm font-bold text-selc-navy">{item.title}</h3><p className="mt-2 min-h-[60px] text-xs leading-5 text-slate-500">{item.description}</p><div className="mt-4 border-t border-slate-100 pt-3 text-[10px] font-medium text-selc-blue">Open workspace →</div></Link>)}
      </div>
     </section>

     <footer className="mt-10 flex flex-col gap-2 border-t border-slate-200 pt-5 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between"><span>South East London Care · Staff Portal</span><span className="inline-flex items-center gap-1.5"><ShieldCheck size={13}/> Secure access · {primaryRole}</span></footer>
    </main>
   </div>
  </div>
 </div>;
}

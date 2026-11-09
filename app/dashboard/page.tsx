import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Bell, FileText, LogOut, ShieldCheck, UserRound, Users } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const {data:assignments}=await supabase.from("user_role_assignments").select("role").eq("user_id",user.id);
  const roles=assignments?.map(x=>x.role)??[];
  const canInvite=roles.includes("super_administrator")||roles.includes("hr_manager");
  const roleLabels:Record<string,string>={super_administrator:"Super Administrator",hr_manager:"HR Manager",department_manager:"Department Manager",compliance_officer:"Compliance Officer",staff_member:"Staff Member"};
  async function signOut() {
    "use server";
    const client = await createClient();
    await client.auth.signOut();
    redirect("/login");
  }
  const cards = [
    {icon:UserRound,title:"My profile",desc:"Personal and employment information"},
    {icon:FileText,title:"My documents",desc:"Required documents and verification"},
    {icon:Bell,title:"Announcements",desc:"Company news and important alerts"},
    {icon:ShieldCheck,title:"Account security",desc:"Manage your secure access"}
  ];
  return <main className="min-h-screen">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-selc-red">South East London Care</p><h1 className="mt-1 text-xl font-bold text-selc-navy">Staff portal</h1></div><form action={signOut}><button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><LogOut size={16}/> Sign out</button></form></div></header>
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <div className="rounded-2xl bg-selc-navy p-7 text-white shadow-panel sm:p-9"><p className="text-sm text-blue-200">Secure staff workspace</p><h2 className="mt-2 text-3xl font-bold">Welcome to your portal</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">You are signed in as {user.email}.</p><div className="mt-4 flex flex-wrap gap-2">{roles.map(role=><span key={role} className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{roleLabels[role]??role}</span>)}</div></div>
      {canInvite&&<Link href="/admin/invitations" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-selc-red px-5 py-3 text-sm font-semibold text-white hover:bg-red-700"><Users size={17}/> Invite and manage staff access</Link>}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(item=><div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><item.icon className="text-selc-blue" size={23}/><h3 className="mt-4 font-bold text-selc-ink">{item.title}</h3><p className="mt-1 text-sm text-slate-500">{item.desc}</p><span className="mt-4 inline-block text-xs font-semibold text-selc-red">Coming in next phase</span></div>)}</div>
    </div>
  </main>;
}

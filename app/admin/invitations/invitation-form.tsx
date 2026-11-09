"use client";
import { FormEvent, useState } from "react";

const roles = [
  { value: "staff_member", label: "Staff Member" },
  { value: "department_manager", label: "Department Manager" },
  { value: "compliance_officer", label: "Compliance Officer" },
  { value: "hr_manager", label: "HR Manager" },
  { value: "super_administrator", label: "Super Administrator" }
];

export default function InvitationForm({ canGrantAdminRoles }: { canGrantAdminRoles: boolean }) {
  const [email,setEmail]=useState("");
  const [role,setRole]=useState("staff_member");
  const [departmentId,setDepartmentId]=useState("");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(""); setError("");
    try {
      const response=await fetch("/api/admin/invitations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,role,departmentId:departmentId||null})});
      const result=await response.json();
      if(!response.ok) throw new Error(result.error||"Invitation failed.");
      setMessage("Invitation email has been requested successfully.");
      setEmail(""); setDepartmentId(""); setRole("staff_member");
    } catch(err) { setError(err instanceof Error?err.message:"Unable to create invitation."); }
    finally { setBusy(false); }
  }

  const visibleRoles=canGrantAdminRoles?roles:roles.filter(r=>!["super_administrator","hr_manager"].includes(r.value));
  return <form onSubmit={submit} className="space-y-5">
    <div><label htmlFor="invite-email" className="mb-2 block text-sm font-semibold text-slate-700">Staff email address</label><input id="invite-email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="colleague@example.co.uk" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-selc-blue focus:ring-4 focus:ring-blue-100"/></div>
    <div><label htmlFor="invite-role" className="mb-2 block text-sm font-semibold text-slate-700">Assign role</label><select id="invite-role" value={role} onChange={e=>setRole(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3">{visibleRoles.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
    <div><label htmlFor="department" className="mb-2 block text-sm font-semibold text-slate-700">Department ID <span className="font-normal text-slate-400">(optional; configure departments in the next phase)</span></label><input id="department" value={departmentId} onChange={e=>setDepartmentId(e.target.value)} placeholder="Leave blank for now" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-selc-blue focus:ring-4 focus:ring-blue-100"/></div>
    {message&&<p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{message}</p>}
    {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <button disabled={busy} className="w-full rounded-xl bg-selc-navy px-4 py-3 font-semibold text-white disabled:opacity-60">{busy?"Sending invitation…":"Send staff invitation"}</button>
  </form>;
}
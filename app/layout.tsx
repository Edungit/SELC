import type { Metadata } from "next";
import {Montserrat} from "next/font/google";
import "./globals.css";
const montserrat=Montserrat({subsets:["latin"],weight:["400","500","600","700","800"],variable:"--font-montserrat",display:"swap"});
export const metadata: Metadata = { title: "South East London Care | Staff Portal", description: "Secure staff and management portal for South East London Care." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-GB"><body className={montserrat.className}>{children}</body></html>;
}
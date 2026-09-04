import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Таза қазақша", description: "Қазақ сөзінің тірі мағынасы" };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="kk"><body>{children}</body></html>; }

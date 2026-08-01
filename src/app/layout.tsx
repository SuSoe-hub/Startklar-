import type { Metadata } from "next";
import { Nunito, Geist_Mono } from "next/font/google";
import StrandHintergrund from "@/components/StrandHintergrund";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Startklar",
  description: "Beratungs-Überblick für TCE Reisen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${nunito.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <StrandHintergrund />
        {children}
      </body>
    </html>
  );
}

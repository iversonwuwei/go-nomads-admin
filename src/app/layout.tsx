import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Go Nomads Admin",
  description: "Go Nomads 管理后台 / Admin Console",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} min-h-screen bg-base-200 text-base-content antialiased font-sans`}
      >
        {children}
      </body>
    </html>
  );
}

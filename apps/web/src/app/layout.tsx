import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { EveLogo } from "@/components/eve-logo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "eve agents — the Eve agent directory",
  description:
    "Discover, browse, and install Eve agent templates. Like skills.sh, but for full agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}
      >
        <header className="border-b border-border/80">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-foreground transition hover:opacity-80"
            >
              <EveLogo height={22} />
              <span className="font-mono text-sm text-muted">.agents</span>
            </Link>
            <nav className="flex items-center gap-5 text-sm text-muted">
              <a
                href="https://eve.dev/docs"
                className="transition hover:text-foreground"
                target="_blank"
                rel="noreferrer"
              >
                Eve docs
              </a>
              <a
                href="https://github.com/vercel/eve"
                className="transition hover:text-foreground"
                target="_blank"
                rel="noreferrer"
              >
                Framework
              </a>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}

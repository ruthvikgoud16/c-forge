import type { Metadata, Viewport } from "next";
import "./styles/tokens.css";
import "./styles/primitives.css";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CForge Academy",
  description: "Private C programming academy for 55 official rolls",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

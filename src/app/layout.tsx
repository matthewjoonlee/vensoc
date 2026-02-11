import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vensoc",
  description: "Venmo payment coordination for group events",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

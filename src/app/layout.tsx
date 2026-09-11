import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inch Autos - China Purchase Tracker",
  description: "Track suppliers, orders, shipments and landed costs for Inch Autos.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter, Fraunces, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Inter — UI body. Variable weight, ample range, excellent at small sizes.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Fraunces — display/headings. Variable opsz (optical size) axis lets one
// file scale beautifully from 14 px chip text to 40 px page headers, with
// proportional contrast adjustments. Loaded with normal + italic styles
// only; weight via variable axis.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT"],
  weight: "variable",
});

// Geist Mono — kept for tabular numbers, code blocks, IDs.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://web-nine-flame-27.vercel.app"),
  title: {
    default: "trazabilidad — ERP para productores de alimentos",
    template: "%s · trazabilidad",
  },
  description:
    "Compras, producción, inventario, ventas y facturación AFIP en un sistema diseñado para productores de alimentos.",
  applicationName: "trazabilidad",
  keywords: [
    "ERP",
    "trazabilidad",
    "alimentos",
    "AFIP",
    "facturación electrónica",
    "producción",
    "inventario",
  ],
  authors: [{ name: "trazabilidad" }],
  // icon, apple-icon, and opengraph-image are co-located as
  // app/icon.tsx, app/apple-icon.tsx, app/opengraph-image.tsx — Next.js
  // wires them into <head> automatically. No manual icons block needed.
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "trazabilidad",
    title: "trazabilidad — ERP para productores de alimentos",
    description:
      "Compras, producción, inventario, ventas y facturación AFIP en un sistema diseñado para productores de alimentos.",
  },
  twitter: {
    card: "summary_large_image",
    title: "trazabilidad",
    description:
      "ERP para productores de alimentos: compras, producción, inventario, ventas y AFIP.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1714" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${fraunces.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

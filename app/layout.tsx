import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SwRegister } from "@/components/sw-register";
import { PwaInstall } from "@/components/pwa-install";
import { AppFeel } from "@/components/app-feel";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#0a2a4a",
};

export const metadata: Metadata = {
  title: "Indique Placa",
  description: "Monte seu time de indicadores e venda muito mais em proteção veicular",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Indique Placa" },
  icons: {
    icon: [
      { url: "/favicon-indique.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Indique Placa",
    description: "Monte seu time de indicadores e venda muito mais em proteção veicular",
    url: "https://indiqueplaca.com.br",
    siteName: "Indique Placa",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Indique Placa",
    description: "Monte seu time de indicadores e venda muito mais em proteção veicular",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased" suppressHydrationWarning>
      <body className={`${inter.className} min-h-full`}>
        <SwRegister />
        <PwaInstall />
        <AppFeel />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

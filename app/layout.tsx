import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SwRegister } from "@/components/sw-register";

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
    icon: "/favicon-indique.png",
    apple: "/favicon-indique.png",
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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

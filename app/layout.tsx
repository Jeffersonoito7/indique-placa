import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SwRegister } from "@/components/sw-register";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Indique Placa",
  description: "Plataforma de indicacoes para protecao veicular",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Indique Placa" },
  themeColor: "#0a2a4a",
  icons: {
    icon: "/favicon-indique.png",
    apple: "/favicon-indique.png",
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

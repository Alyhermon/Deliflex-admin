import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import { ActiveStoreProvider } from "./hooks/useActiveStore";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

config.autoAddCss = false;

const SITE_URL = "https://www.deliflex.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Deliflex",
    template: "%s | Deliflex",
  },
  description:
    "Panel de Deliflex para negocios: gestiona tu tienda, pedidos, promociones y DeliPuntos.",
  applicationName: "Deliflex",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    siteName: "Deliflex",
    title: "Deliflex",
    description:
      "Deliflex: pide comida a domicilio de tus restaurantes y negocios favoritos en República Dominicana.",
    url: SITE_URL,
    locale: "es_DO",
  },
  twitter: {
    card: "summary",
    title: "Deliflex",
    description:
      "Deliflex: pide comida a domicilio de tus restaurantes y negocios favoritos en República Dominicana.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ActiveStoreProvider>{children}</ActiveStoreProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth-context";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "নিরাপদ এলাকা (NirapodElaka) — Community Hazard & Disruption Reporting",
  description:
    "A community-powered platform for reporting and verifying local hazards, waterlogging, road closures, and pedestrian safety disruptions in Bangladesh.",
  keywords: [
    "Dhaka hazard report",
    "Bangladesh waterlogging",
    "traffic disruption",
    "pedestrian safety",
    "NirapodElaka",
    "নিরাপদ এলাকা",
  ],
  authors: [{ name: "NirapodElaka Civic Tech Community" }],
  applicationName: "NirapodElaka",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0d9488",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <body className="min-h-screen flex flex-col bg-slate-50/50 text-gray-900 font-sans antialiased selection:bg-teal-100 selection:text-teal-900">
        <I18nProvider>
          <AuthProvider>
            <Header />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </main>
            <Footer />
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

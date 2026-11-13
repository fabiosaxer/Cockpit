import type { Metadata, Viewport } from "next";
// Schriften sind Teil der App (Fontsource) und kommen von der eigenen Domain, ohne Aufruf bei Google
import "@fontsource/nunito/latin-400.css";
import "@fontsource/nunito/latin-600.css";
import "@fontsource/nunito/latin-700.css";
import "@fontsource/nunito/latin-800.css";
import "@fontsource/nunito/latin-900.css";
import "@fontsource/b612-mono/latin-400.css";
import "@fontsource/b612-mono/latin-700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cockpit",
  description: "Persönliches Cockpit für Termine, Abgaben und Projekte",
  applicationName: "Cockpit",
  appleWebApp: { capable: true, title: "Cockpit", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: "/apple-touch-icon.png",
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#3fa9f2",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de-CH">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}

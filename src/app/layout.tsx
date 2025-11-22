import type { Metadata } from "next";
import { I18nProvider } from "@/lib/i18n/context";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Zetara",
  description: "Local-first bibliography manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <I18nProvider>
          <div className="app-shell">
            {children}
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}

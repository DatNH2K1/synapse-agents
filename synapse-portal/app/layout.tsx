import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Synapse Portal | Centralized Brain",
  description: "Centralized Local Knowledge OS for Synapse",
};

import { I18nProvider } from "@/lib/i18n";
import ThemeProvider from "@/components/shared/ThemeProvider";
import RealtimeProvider from "@/components/shared/RealtimeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="selection:bg-indigo-500/30" suppressHydrationWarning>
        <ThemeProvider>
          <I18nProvider>
            <RealtimeProvider>{children}</RealtimeProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

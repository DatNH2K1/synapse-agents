"use client";

import React from "react";
import { ThemeProvider as NextThemeProvider } from "next-themes";

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const orig = console.error;
  console.error = (...args: Parameters<typeof console.error>) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Encountered a script tag")
    ) {
      return;
    }
    orig.apply(console, args);
  };
}

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextThemeProvider
      attribute="data-theme"
      defaultTheme="midnight"
      enableSystem={false}
      themes={["midnight", "arctic", "neon"]}
    >
      {children}
    </NextThemeProvider>
  );
}

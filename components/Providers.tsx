"use client";

import { ThemeProvider } from "next-themes";
import { PropsWithChildren } from "react";

export const Providers = ({
  children,
}: PropsWithChildren) => {
  return (
    <>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
      >
        {children}
      </ThemeProvider>
    </>
  );
};

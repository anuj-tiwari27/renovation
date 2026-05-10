"use client";

import * as React from "react";
import { ThemeProvider as NextThemes } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { OfflineWatcher } from "@/components/offline-watcher";
import { InstallPrompt } from "@/components/pwa-install";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );

  return (
    <NextThemes attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={client}>
        <OfflineWatcher />
        {children}
        <InstallPrompt />
        <Toaster />
      </QueryClientProvider>
    </NextThemes>
  );
}

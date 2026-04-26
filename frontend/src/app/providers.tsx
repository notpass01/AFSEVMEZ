"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { PricesProvider } from "@/context/PricesContext";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <PricesProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </PricesProvider>
    </QueryClientProvider>
  );
}

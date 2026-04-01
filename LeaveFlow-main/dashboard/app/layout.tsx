import "./globals.css";
import { ReactNode } from "react";
import { Providers } from "./lib/providers";
import { Header } from "./(components)/header";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "./components/error-boundary";

export const metadata = {
  title: "LeaveFlow Dashboard",
  description: "Manager dashboard for leave approvals",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📋</text></svg>",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased" suppressHydrationWarning>
        <ThemeProvider defaultTheme="system" storageKey="leaveflow-theme">
          <ErrorBoundary>
            <Providers>
              <Header />
              <main className="max-w-7xl mx-auto px-4 py-8">
                {children}
              </main>
            </Providers>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}

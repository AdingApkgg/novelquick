import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { TRPCReactProvider } from "@/lib/trpc/client";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "短剧速看 · 后台", template: "%s · 短剧速看后台" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="light">
          <TRPCReactProvider>
            {children}
            <Toaster position="top-right" />
          </TRPCReactProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

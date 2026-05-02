import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { TRPCReactProvider } from "@/lib/trpc/client";
import { APP } from "@nq/shared/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${APP.cnName}`, template: `%s · ${APP.cnName}` },
  description: APP.description,
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <TRPCReactProvider>
            {children}
            <Toaster position="top-center" richColors />
          </TRPCReactProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

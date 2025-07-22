import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ConditionalLayout } from "@/components/layout/ConditionalLayout";
import { CompanyFilterProvider } from "@/contexts/CompanyFilterContext";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/contexts/AuthContext";

const calSans = localFont({
  src: "../fonts/cal-sans.woff2",
  variable: "--font-cal-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EazyBizy - Business Management Platform",
  description: "Streamline your business operations with our comprehensive platform. Manage companies, sales, accounting, and financials all in one place.",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${calSans.variable} font-sans antialiased`} suppressHydrationWarning={true}>
        <QueryProvider>
          <AuthProvider>
            <CompanyFilterProvider>
              <ConditionalLayout>
                {children}
              </ConditionalLayout>
              <Toaster position="top-center" richColors />
            </CompanyFilterProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

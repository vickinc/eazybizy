"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/layout/sidebar";
import { 
  SidebarProvider, 
  SidebarInset, 
  SidebarTrigger 
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { GlobalCompanyFilter } from "@/components/features/global/GlobalCompanyFilter";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Routes that should NOT show the sidebar (public routes)
  const publicRoutes = ['/', '/auth/login', '/auth/signup'];
  const isPublicRoute = publicRoutes.includes(pathname);

  if (isPublicRoute) {
    // Render without sidebar for public routes
    return (
      <main className="min-h-screen">
        {children}
      </main>
    );
  }

  // Render with sidebar for authenticated routes
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 sm:h-16 shrink-0 items-center gap-2 border-b px-2 sm:px-4 bg-lime-50">
          <div className="flex items-center gap-1 sm:gap-2 w-full min-w-0">
            <SidebarTrigger className="-ml-1 flex-shrink-0" />
            <Separator orientation="vertical" className="mr-1 sm:mr-2 h-4 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <GlobalCompanyFilter />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-lime-50">
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
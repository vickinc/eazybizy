"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import StickyNote from "lucide-react/dist/esm/icons/sticky-note";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import Home from "lucide-react/dist/esm/icons/home";
import Settings from "lucide-react/dist/esm/icons/settings";
import LogOut from "lucide-react/dist/esm/icons/log-out";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import DollarSign from "lucide-react/dist/esm/icons/dollar-sign";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Calculator from "lucide-react/dist/esm/icons/calculator";
import FolderOpen from "lucide-react/dist/esm/icons/folder-open";
import BarChart3 from "lucide-react/dist/esm/icons/bar-chart-3";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import Package from "lucide-react/dist/esm/icons/package";
import ShoppingCart from "lucide-react/dist/esm/icons/shopping-cart";
import Truck from "lucide-react/dist/esm/icons/truck";
import Users from "lucide-react/dist/esm/icons/users";
import UserCheck from "lucide-react/dist/esm/icons/user-check";
import Receipt from "lucide-react/dist/esm/icons/receipt";
import ArrowRightLeft from "lucide-react/dist/esm/icons/arrow-right-left";
import Scale from "lucide-react/dist/esm/icons/scale";
import Banknote from "lucide-react/dist/esm/icons/banknote";
import PieChart from "lucide-react/dist/esm/icons/pie-chart";
import Building from "lucide-react/dist/esm/icons/building";
import Target from "lucide-react/dist/esm/icons/target";
import BookOpen from "lucide-react/dist/esm/icons/book-open";
import Landmark from "lucide-react/dist/esm/icons/landmark";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import MonitorSpeaker from "lucide-react/dist/esm/icons/monitor-speaker";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { NavUser } from "./nav-user";
import { cn } from "@/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { 
    name: "Companies", 
    href: "/companies", 
    icon: Building,
    subItems: [
      { name: "Calendar", href: "/calendar", icon: Calendar, count: 0 },
      { name: "Notes", href: "/notes", icon: StickyNote, count: 0 },
      { name: "Business Cards", href: "/business-cards", icon: CreditCard, count: 0 },
    ]
  },
  { 
    name: "Sales", 
    href: "/sales", 
    icon: ShoppingCart,
    subItems: [
      { name: "Products", href: "/sales/products", icon: Package, count: 0 },
      { name: "Vendors", href: "/sales/vendors", icon: Truck, count: 0 },
      { name: "Clients", href: "/sales/clients", icon: UserCheck, count: 0 },
      { name: "Invoices", href: "/sales/invoices", icon: FileText, count: 0 },
    ]
  },
  { 
    name: "Accounting", 
    href: "/accounting", 
    icon: Calculator,
    subItems: [
      { 
        name: "Bookkeeping", 
        href: "/accounting/bookkeeping", 
        icon: BookOpen,
        subItems: [
          { 
            name: "Categories", 
            href: "/accounting/bookkeeping/categories", 
            icon: FolderOpen,
            subItems: [
              { name: "Tax Treatments", href: "/accounting/bookkeeping/categories/tax-treatments", icon: Calculator }
            ]
          },
          { name: "Entries", href: "/accounting/bookkeeping/entries", icon: Receipt },
          { name: "Journal", href: "/accounting/bookkeeping/journal", icon: BookOpen },
          { name: "Transactions", href: "/accounting/bookkeeping/transactions", icon: ArrowRightLeft },
          { name: "Fixed Assets", href: "/accounting/fixed-assets", icon: MonitorSpeaker },
          { name: "Cash Flow", href: "/accounting/bookkeeping/cash-flow", icon: TrendingUp },
          { name: "Balances", href: "/accounting/bookkeeping/balances", icon: Landmark },
        ]
      },
      { name: "Banks/Wallets", href: "/accounting/banks-wallets", icon: Banknote },
      { name: "Currency Rates", href: "/accounting/currency-rates", icon: DollarSign },
    ]
  },
  { 
    name: "Financials", 
    href: "/financials", 
    icon: PieChart,
    subItems: [
      { 
        name: "Reporting", 
        href: "/financials/reporting", 
        icon: FileText,
        subItems: [
          { name: "Profit & Loss", href: "/financials/reporting/profit-loss", icon: TrendingUp },
          { name: "Balance Sheet", href: "/financials/reporting/balance-sheet", icon: Building },
          { name: "Cash Flow Stmt", href: "/financials/reporting/cash-flow-stmt", icon: Banknote },
          { name: "Equity Changes", href: "/financials/reporting/equity-changes", icon: Scale },
        ]
      },
      { name: "Virtual Holding", href: "/financials/holding", icon: FolderOpen, count: 0 },
      { name: "ARR Dashboard", href: "/financials/arr-dashboard", icon: BarChart3, count: 0 },
      { name: "Valuation", href: "/financials/valuation", icon: Target, count: 0 },
      { name: "Integration Testing", href: "/financials/integration-testing", icon: ShieldCheck, count: 0 },
    ]
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [expandedSubItems, setExpandedSubItems] = useState<string[]>([]);
  const [expandedSubSubItems, setExpandedSubSubItems] = useState<string[]>([]);
  const [counts, setCounts] = useState({
    companies: 0,
    invoices: 0,
    clients: 0,
    products: 0,
    vendors: 0,
  });

  // Handle mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    // Don't set any initial expanded state - start collapsed
    
    // Prefetch critical routes for instant navigation
    const criticalRoutes = [
      '/dashboard',
      '/companies',
      '/calendar',
      '/notes',
      '/business-cards',
      // Also prefetch commonly used sub-routes
      '/sales/products',
      '/sales/clients',
      '/sales/invoices',
      '/accounting/bookkeeping/entries',
      '/financials/reporting',
    ];
    
    // Prefetch routes after a short delay to not block initial render
    const prefetchTimer = setTimeout(() => {
      criticalRoutes.forEach(route => {
        router.prefetch(route);
      });
    }, 100);
    
    return () => clearTimeout(prefetchTimer);
  }, [router]);

  // Load counts from localStorage
  useEffect(() => {
    const loadCounts = () => {
      try {
        const savedCompanies = localStorage.getItem('app-companies');
        const savedInvoices = localStorage.getItem('app-invoices');
        const savedClients = localStorage.getItem('app-clients');
        const savedProducts = localStorage.getItem('app-products');
        const savedVendors = localStorage.getItem('app-vendors');

        const companies = savedCompanies ? JSON.parse(savedCompanies).length : 0;
        const invoices = savedInvoices ? JSON.parse(savedInvoices).length : 0;
        const clients = savedClients ? JSON.parse(savedClients).length : 0;
        const products = savedProducts ? JSON.parse(savedProducts).length : 0;
        const vendors = savedVendors ? JSON.parse(savedVendors).length : 0;

        setCounts({ companies, invoices, clients, products, vendors });
      } catch (error) {
        console.error('Error loading counts:', error);
      }
    };

    loadCounts();
    const interval = setInterval(loadCounts, 1000);
    return () => clearInterval(interval);
  }, []);

  // Remove auto-expansion logic - let users manually control expansion

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(item => item !== itemName)
        : [itemName] // Only keep the newly opened item, close all others
    );
    // Also close all expanded sub-items when opening a new main menu
    setExpandedSubItems([]);
    setExpandedSubSubItems([]);
  };

  const handleMenuItemClick = (item: unknown) => {
    // Navigate to the page
    router.push(item.href);
    
    // Toggle expansion if it has sub-items
    if (item.subItems && item.subItems.length > 0) {
      toggleExpanded(item.name);
    }
  };

  const toggleSubExpanded = (subItemName: string) => {
    setExpandedSubItems(prev => 
      prev.includes(subItemName) 
        ? prev.filter(item => item !== subItemName)
        : [subItemName] // Only keep the newly opened sub-item, close all others
    );
    // Close all sub-sub items when toggling sub items
    setExpandedSubSubItems([]);
  };

  const toggleSubSubExpanded = (subSubItemName: string) => {
    setExpandedSubSubItems(prev => 
      prev.includes(subSubItemName) 
        ? prev.filter(item => item !== subSubItemName)
        : [subSubItemName] // Only keep the newly opened sub-sub-item, close all others
    );
  };

  const handleSubMenuItemClick = (subItem: unknown) => {
    // Navigate to the page
    router.push(subItem.href);
    
    // Toggle expansion if it has sub-items
    if (subItem.subItems && subItem.subItems.length > 0) {
      toggleSubExpanded(subItem.name);
    }
  };

  const handleSubSubMenuItemClick = (subSubItem: unknown) => {
    // Navigate to the page
    router.push(subSubItem.href);
    
    // Toggle expansion if it has sub-items (4th level)
    if (subSubItem.subItems && subSubItem.subItems.length > 0) {
      toggleSubSubExpanded(subSubItem.name);
    }
  };

  const getCount = (itemName: string) => {
    switch (itemName) {
      case 'Companies': return counts.companies;
      case 'Invoices': return counts.invoices;
      case 'Clients': return counts.clients;
      case 'Products': return counts.products;
      case 'Vendors': return counts.vendors;
      default: return 0;
    }
  };

  // Don't render expanded state until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Sidebar variant="sidebar" collapsible="offcanvas" className="sidebar-gradient">
        <SidebarHeader className="bg-black border-b border-gray-600">
          <div className="flex items-center justify-center p-0 w-full">
            <Image 
              src="/logo.png" 
              alt="Logo" 
              width={400} 
              height={100} 
              className="h-16 w-full object-contain group-data-[collapsible=icon]:hidden"
            />
            <Image 
              src="/logo.png" 
              alt="Logo" 
              width={32} 
              height={32} 
              className="h-8 w-8 hidden group-data-[collapsible=icon]:block"
            />
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  const count = getCount(item.name);

                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive}
                        tooltip={item.name}
                      >
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span className="cursor-pointer select-none">{item.name}</span>
                          {count > 0 && (
                            <SidebarMenuBadge>
                              {count}
                            </SidebarMenuBadge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Settings">
                <Link href="/settings">
                  <Settings className="h-4 w-4" />
                  <span className="cursor-pointer select-none text-sm">Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Logout">
                <a href="/logout">
                  <LogOut className="h-4 w-4" />
                  <span className="cursor-pointer select-none text-sm">Logout</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    );
  }

  return (
    <Sidebar variant="sidebar" collapsible="offcanvas" className="sidebar-gradient">
      <SidebarHeader className="bg-black border-b border-gray-600">
        <div className="flex items-center justify-center p-0 w-full">
          <Image 
            src="/logo.png" 
            alt="Logo" 
            width={400} 
            height={100} 
            className="h-16 w-full object-contain group-data-[collapsible=icon]:hidden"
          />
          <Image 
            src="/logo.png" 
            alt="Logo" 
            width={32} 
            height={32} 
            className="h-8 w-8 hidden group-data-[collapsible=icon]:block"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const isExpanded = expandedItems.includes(item.name);
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const count = getCount(item.name);
                

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      onClick={() => handleMenuItemClick(item)}
                      isActive={isActive}
                      tooltip={item.name}
                    >
                      <item.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="cursor-pointer select-none text-sm sm:text-base">{item.name}</span>
                      {hasSubItems ? (
                        isExpanded ? (
                          <ChevronDown className="h-4 w-4 ml-auto" />
                        ) : (
                          <ChevronRight className="h-4 w-4 ml-auto" />
                        )
                      ) : (
                        count > 0 && (
                          <SidebarMenuBadge>
                            {count}
                          </SidebarMenuBadge>
                        )
                      )}
                    </SidebarMenuButton>

                    {hasSubItems && isExpanded && (
                      <SidebarMenuSub>
                        {item.subItems.map((subItem) => {
                          const isSubActive = pathname === subItem.href;
                          const hasSubSubItems = subItem.subItems && subItem.subItems.length > 0;
                          const isSubExpanded = expandedSubItems.includes(subItem.name);
                          
                          return (
                            <SidebarMenuSubItem key={subItem.name}>
                              <SidebarMenuSubButton 
                                onClick={() => handleSubMenuItemClick(subItem)}
                                isActive={isSubActive}
                              >
                                <subItem.icon className="h-4 w-4" />
                                <span className="cursor-pointer select-none text-sm">{subItem.name}</span>
                                {hasSubSubItems && (
                                  isSubExpanded ? (
                                    <ChevronDown className="h-3 w-3 ml-auto" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3 ml-auto" />
                                  )
                                )}
                              </SidebarMenuSubButton>

                              {hasSubSubItems && isSubExpanded && (
                                <SidebarMenuSub>
                                  {subItem.subItems.map((subSubItem) => {
                                    const isSubSubActive = pathname === subSubItem.href;
                                    const hasSubSubSubItems = subSubItem.subItems && subSubItem.subItems.length > 0;
                                    const isSubSubExpanded = expandedSubSubItems.includes(subSubItem.name);
                                    
                                    return (
                                      <SidebarMenuSubItem key={subSubItem.name}>
                                        <SidebarMenuSubButton 
                                          onClick={() => handleSubSubMenuItemClick(subSubItem)}
                                          isActive={isSubSubActive}
                                        >
                                          <subSubItem.icon className="h-3 w-3" />
                                          <span className="text-xs sm:text-sm cursor-pointer select-none">{subSubItem.name}</span>
                                          {hasSubSubSubItems && (
                                            isSubSubExpanded ? (
                                              <ChevronDown className="h-2 w-2 ml-auto" />
                                            ) : (
                                              <ChevronRight className="h-2 w-2 ml-auto" />
                                            )
                                          )}
                                        </SidebarMenuSubButton>

                                        {hasSubSubSubItems && isSubSubExpanded && (
                                          <SidebarMenuSub className="w-full" style={{ minWidth: 'max-content' }}>
                                            {subSubItem.subItems.map((subSubSubItem) => {
                                              const isSubSubSubActive = pathname === subSubSubItem.href;
                                              return (
                                                <SidebarMenuSubItem 
                                                  key={subSubSubItem.name}
                                                  className="w-full"
                                                  style={{ minWidth: 'max-content' }}
                                                >
                                                  <SidebarMenuSubButton 
                                                    asChild 
                                                    isActive={isSubSubSubActive}
                                                    className="w-full min-w-max"
                                                    style={{ 
                                                      overflow: 'visible',
                                                      minWidth: 'max-content',
                                                      width: '100%'
                                                    }}
                                                  >
                                                    <Link 
                                                      href={subSubSubItem.href}
                                                      className="w-full flex items-center gap-2"
                                                      style={{ 
                                                        minWidth: 'max-content',
                                                        width: '100%'
                                                      }}
                                                    >
                                                      <subSubSubItem.icon className="h-3 w-3" />
                                                      <span 
                                                        className="text-sm cursor-pointer select-none" 
                                                        style={{ 
                                                          overflow: 'visible',
                                                          textOverflow: 'unset',
                                                          whiteSpace: 'nowrap'
                                                        }}
                                                      >
                                                        {subSubSubItem.name}
                                                      </span>
                                                    </Link>
                                                  </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                              );
                                            })}
                                          </SidebarMenuSub>
                                        )}
                                      </SidebarMenuSubItem>
                                    );
                                  })}
                                </SidebarMenuSub>
                              )}
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

// Export the original component name for backward compatibility
export { AppSidebar as Sidebar }; 
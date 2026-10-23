"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar";
import { Blocks, Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const applicationItems = [
  { label: "Integrations", href: "/integrations" as const, icon: Blocks },
];

export function AppNavigation() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Application</SidebarGroupLabel>
        <SidebarMenu>
          {applicationItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={item.label}
                className="data-[active=true]:[&>svg]:text-primary"
              >
                <Link href={item.href} onClick={() => setOpenMobile(false)}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>My Account</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/account/settings")}
              tooltip="Settings"
              className="data-[active=true]:[&>svg]:text-primary"
            >
              <Link
                href="/account/settings"
                onClick={() => setOpenMobile(false)}
              >
                <Settings2 />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}

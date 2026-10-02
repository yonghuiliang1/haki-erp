"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  ClipboardList,
  LineChart,
  Sparkles,
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  History,
  MessageSquare,
  Star,
  Store,
  Truck,
  Users,
  Mail,
  FileText,
  UserCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminCounts } from "@/hooks/queries";
import { isDataSlotUnsettled } from "@/lib/react-query";
import { DataSlotPulse } from "@/components/shared/DataSlotPulse";
import { LocaleSwitcher } from "@/components/shared/LocaleSwitcher";
import { useT } from "@/lib/i18n/locale-context";
import {
  ADMIN_MANAGEMENT_ITEMS,
  ADMIN_MY_ACTIVITY_ITEMS,
  ADMIN_MY_STORE_ITEMS,
  ADMIN_SETTINGS_EMAIL_HREF,
  type AdminNavItemConfig,
} from "@/lib/navigation/admin-nav-config";
import { adminSidebarLinkClass } from "@/lib/navigation/nav-link-styles";
import type { AdminCounts } from "@/types";

/** Icon map for admin sidebar items (REQ-0094 — hrefs live in admin-nav-config). */
const ADMIN_NAV_ICONS: Record<string, LucideIcon> = {
  "/admin/dashboard-overall-insights": LayoutDashboard,
  "/admin/orders": ShoppingCart,
  "/admin/invoices": FileText,
  "/admin/support-tickets": MessageSquare,
  "/admin/product-reviews": Star,
  "/admin/finance": LineChart,
  "/admin/assistant": Sparkles,
  "/admin/products": Package,
  "/admin/warehouses": Warehouse,
  "/admin/inventory": Boxes,
  "/admin/purchase-orders": ClipboardList,
  "/admin/supplier-portal": Truck,
  "/admin/client-portal": Store,
  "/admin/user-management": Users,
  "/admin/activity-history": History,
  "/admin/my-activity": UserCircle,
  [ADMIN_SETTINGS_EMAIL_HREF]: Mail,
};

export default function AdminSidebar({
  collapsed = false,
  initialCounts,
}: {
  collapsed?: boolean;
  /** SSR-passed sidebar badge counts (REQ-0025) */
  initialCounts?: AdminCounts;
} = {}) {
  const pathname = usePathname();
  const countsQuery = useAdminCounts(initialCounts);
  const counts = countsQuery.data ?? initialCounts;
  const countsLoading = isDataSlotUnsettled(countsQuery, initialCounts);
  const t = useT();

  const getCount = (key: AdminNavItemConfig["countKey"]): number | undefined => {
    if (!counts || !key) return undefined;
    return counts[key];
  };

  const renderNavItems = (items: AdminNavItemConfig[], isSub = true) =>
    items.map((item) => {
      const Icon = ADMIN_NAV_ICONS[item.href] ?? Package;
      const count = getCount(item.countKey);
      const showBadge = item.countKey != null;
      return (
        <Link
          key={item.href}
          href={item.href}
          prefetch
          className={adminSidebarLinkClass(pathname, item.href, {
            isSub,
            collapsed,
          })}
          title={collapsed ? t(item.label) : undefined}
        >
          <Icon className="h-4 w-4 flex-shrink-0" />
          {!collapsed && (
            <span className="min-w-0 flex-1 truncate">{t(item.label)}</span>
          )}
          {!collapsed && showBadge && (
            <span
              className={cn(
                "flex-shrink-0 rounded-full px-1 py-0.5 text-xs font-medium min-w-[1.25rem] text-center",
                "bg-muted text-muted-foreground",
              )}
              aria-label={
                countsLoading
                  ? t("Loading count")
                  : count !== undefined
                    ? t("{count} items", { count })
                    : undefined
              }
            >
              {countsLoading ? (
                <DataSlotPulse variant="badge" className="mx-auto" />
              ) : count !== undefined && count > 0 ? (
                count > 99 ? (
                  "99+"
                ) : (
                  count
                )
              ) : null}
            </span>
          )}
        </Link>
      );
    });

  if (collapsed) {
    return (
      <nav
        className="flex min-h-0 flex-col items-center px-2 gap-1"
        aria-label={t("Admin navigation")}
      >
        {renderNavItems(ADMIN_MY_STORE_ITEMS)}
        <div className="w-6 border-t border-gray-200/50 dark:border-white/10 my-1" />
        {renderNavItems(ADMIN_MANAGEMENT_ITEMS)}
        <div className="w-6 border-t border-gray-200/50 dark:border-white/10 my-1" />
        {renderNavItems(ADMIN_MY_ACTIVITY_ITEMS)}
        <div className="w-6 border-t border-gray-200/50 dark:border-white/10 my-1" />
        <Link
          href={ADMIN_SETTINGS_EMAIL_HREF}
          prefetch
          className={adminSidebarLinkClass(pathname, ADMIN_SETTINGS_EMAIL_HREF, {
            isSub: true,
            collapsed,
          })}
          title={t("Email Preferences")}
        >
          <Mail className="h-4 w-4 flex-shrink-0" />
        </Link>
        <div className="my-1">
          <LocaleSwitcher iconOnly />
        </div>
      </nav>
    );
  }

  return (
    <nav className="flex min-h-0 flex-col p-2 gap-1">
      <p className="px-2 pt-2  text-xs font-normal uppercase tracking-wider text-muted-foreground">
        {t("My Store")}
      </p>
      {renderNavItems(ADMIN_MY_STORE_ITEMS)}

      <p className="px-2 pt-2  text-xs font-normal uppercase tracking-wider text-muted-foreground">
        {t("Product & System Management")}
      </p>
      {renderNavItems(ADMIN_MANAGEMENT_ITEMS)}

      <p className="px-2 pt-2  text-xs font-normal uppercase tracking-wider text-muted-foreground">
        {t("Personal activity")}
      </p>
      {renderNavItems(ADMIN_MY_ACTIVITY_ITEMS)}

      <p className="px-2 pt-2  text-xs font-normal uppercase tracking-wider text-muted-foreground">
        {t("System Settings")}
      </p>
      <Link
        href={ADMIN_SETTINGS_EMAIL_HREF}
        prefetch
        className={adminSidebarLinkClass(pathname, ADMIN_SETTINGS_EMAIL_HREF, {
          isSub: true,
        })}
      >
        <Mail className="h-4 w-4 flex-shrink-0" />
        {t("Email Preferences")}
      </Link>

      {/* Language toggle (中文 / EN) */}
      <div className="px-2 pt-3 pb-1">
        <LocaleSwitcher fullWidth />
      </div>
    </nav>
  );
}

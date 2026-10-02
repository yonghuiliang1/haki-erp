import {
  ClipboardList,
  Shield,
  ShoppingBag,
  Store,
  TrendingUp,
  Wallet,
  Warehouse,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DEMO_PASSWORD, DEMO_SEED_USERS, type DemoRoleKey } from "./demo-seed-users";

/** Demo test-account keys for login role Select (REQ-0030). */
export type TestAccountRoleKey = DemoRoleKey;

/** Credentials for quick demo login — sourced from demo-seed-users.ts. */
export const testAccounts: Record<
  TestAccountRoleKey,
  { email: string; password: string }
> = Object.fromEntries(
  DEMO_SEED_USERS.map((u) => [
    u.roleKey,
    { email: u.email, password: DEMO_PASSWORD },
  ]),
) as Record<TestAccountRoleKey, { email: string; password: string }>;

export type RoleMetaHue =
  | "sky"
  | "emerald"
  | "amber"
  | "violet"
  | "cyan"
  | "orange"
  | "rose";

/** Icon, label, and Tailwind hue for each demo role row. */
export const roleMeta: Record<
  TestAccountRoleKey,
  { icon: LucideIcon; label: string; hue: RoleMetaHue }
> = {
  "guest-admin": {
    icon: Shield,
    label: "Admin (admin@haki.com)",
    hue: "sky",
  },
  "guest-sales": {
    icon: TrendingUp,
    label: "Sales (sales@haki.com)",
    hue: "emerald",
  },
  "guest-finance": {
    icon: Wallet,
    label: "Finance (finance@haki.com)",
    hue: "amber",
  },
  "guest-warehouse": {
    icon: Warehouse,
    label: "Warehouse (warehouse@haki.com)",
    hue: "violet",
  },
  "guest-purchase": {
    icon: ClipboardList,
    label: "Purchase (purchase@haki.com)",
    hue: "cyan",
  },
  "guest-supplier": {
    icon: Store,
    label: "Supplier (supplier@haki.com)",
    hue: "orange",
  },
  "guest-client": {
    icon: ShoppingBag,
    label: "Client (client@haki.com)",
    hue: "rose",
  },
};

export const testAccountRoleKeys = Object.keys(roleMeta) as TestAccountRoleKey[];

/** Icon text color classes per role hue (trigger + menu items). */
export const roleIconClassByHue: Record<RoleMetaHue, string> = {
  sky: "text-sky-600 dark:text-sky-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
  violet: "text-violet-600 dark:text-violet-400",
  cyan: "text-cyan-600 dark:text-cyan-400",
  orange: "text-orange-600 dark:text-orange-400",
  rose: "text-rose-600 dark:text-rose-400",
};
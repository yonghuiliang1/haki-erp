/**
 * Canonical demo account definitions for login dropdown + DB seed scripts.
 * Keep in sync: test-accounts.ts (UI), prisma/seed.ts (fresh DB).
 */

import { getRoboHashAvatarUrl } from "@/lib/ui/user-avatar-sources";

/** Demo role keys — match LoginRoleSelect + test-accounts.ts. */
export type DemoRoleKey =
  | "guest-admin"
  | "guest-sales"
  | "guest-finance"
  | "guest-warehouse"
  | "guest-purchase"
  | "guest-supplier"
  | "guest-client";

/** Shared password for all demo accounts (login role Select pre-fill). */
export const DEMO_PASSWORD = "12345678";

export type DemoSeedUser = {
  roleKey: DemoRoleKey;
  email: string;
  name: string;
  username: string;
  role:
    | "admin"
    | "sales"
    | "finance"
    | "warehouse"
    | "purchase"
    | "supplier"
    | "client";
  /** Unique placeholder — avoids collisions on the googleId unique index. */
  googleId: string;
  /** Stable robohash profile image for navbar/avatars at seed time. */
  image: string;
};

/** Demo users wiped + recreated by the database seed script. */
export const DEMO_SEED_USERS: readonly DemoSeedUser[] = [
  {
    roleKey: "guest-admin",
    email: "admin@haki.com",
    name: "Zhang Wei",
    username: "zhangwei",
    role: "admin",
    googleId: "demo-admin",
    image: getRoboHashAvatarUrl("demo-admin"),
  },
  {
    roleKey: "guest-sales",
    email: "sales@haki.com",
    name: "Li Na",
    username: "lina",
    role: "sales",
    googleId: "demo-sales",
    image: getRoboHashAvatarUrl("demo-sales"),
  },
  {
    roleKey: "guest-finance",
    email: "finance@haki.com",
    name: "Zheng Jie",
    username: "zhengjie",
    role: "finance",
    googleId: "demo-finance",
    image: getRoboHashAvatarUrl("demo-finance"),
  },
  {
    roleKey: "guest-warehouse",
    email: "warehouse@haki.com",
    name: "Jiang Li",
    username: "jiangli",
    role: "warehouse",
    googleId: "demo-warehouse",
    image: getRoboHashAvatarUrl("demo-warehouse"),
  },
  {
    roleKey: "guest-purchase",
    email: "purchase@haki.com",
    name: "Shen Peng",
    username: "shenpeng",
    role: "purchase",
    googleId: "demo-purchase",
    image: getRoboHashAvatarUrl("demo-purchase"),
  },
  {
    roleKey: "guest-supplier",
    email: "supplier@haki.com",
    name: "Luo Juan",
    username: "luojuan",
    role: "supplier",
    googleId: "demo-supplier",
    image: getRoboHashAvatarUrl("demo-supplier"),
  },
  {
    roleKey: "guest-client",
    email: "client@haki.com",
    name: "He Jing",
    username: "hejing",
    role: "client",
    googleId: "demo-client",
    image: getRoboHashAvatarUrl("demo-client"),
  },
] as const;
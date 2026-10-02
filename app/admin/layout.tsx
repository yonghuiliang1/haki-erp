import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getAdminCounts } from "@/lib/server/admin-counts";
import AdminLayout from "@/components/layouts/AdminLayout";

/** Admin layout — SSR sidebar counts so badges render without client fetch flash (REQ-0025). */
export const dynamic = "force-dynamic";

/** Company-internal roles; external accounts (client / supplier) use their own portals. */
const INTERNAL_ROLES = ["admin", "sales", "finance", "warehouse", "purchase"];

/** Where each external role lands when it tries an internal page. */
const EXTERNAL_PORTALS: Record<string, string> = {
  client: "/client",
  supplier: "/supplier",
};

export default async function AdminRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }
  if (!INTERNAL_ROLES.includes(user.role ?? "")) {
    redirect(EXTERNAL_PORTALS[user.role ?? ""] ?? "/");
  }
  const initialCounts = await getAdminCounts(user.id);
  return <AdminLayout initialCounts={initialCounts}>{children}</AdminLayout>;
}

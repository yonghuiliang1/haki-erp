import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getPurchaseOrders } from "@/prisma/purchase-order";
import AdminPurchaseOrdersContent from "@/components/admin/AdminPurchaseOrdersContent";
import type { PurchaseOrderStatus } from "@/types";

/** Blocking SSR prefetch so the list renders complete on first paint. */
export const dynamic = "force-dynamic";

export default async function AdminPurchaseOrdersPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  // Purchasing and receiving roles only (same rule as the API).
  if (!["admin", "purchase", "warehouse"].includes(user.role ?? "")) {
    redirect("/admin");
  }

  // Serialize dates to ISO strings — client components and list types expect strings.
  const orders = (await getPurchaseOrders()).map((order) => ({
    ...order,
    status: order.status as PurchaseOrderStatus,
    expectedAt: order.expectedAt?.toISOString() ?? null,
    receivedAt: order.receivedAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt?.toISOString() ?? null,
    items: order.items.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
  }));

  return <AdminPurchaseOrdersContent initialOrders={orders} />;
}
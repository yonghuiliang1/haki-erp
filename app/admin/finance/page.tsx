import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getFinanceReport } from "@/lib/server/finance-report-data";
import { getSalesPerformance } from "@/lib/server/sales-performance-data";
import AdminFinanceContent from "@/components/admin/AdminFinanceContent";

/** Blocking SSR prefetch so both tables render complete on first paint. */
export const dynamic = "force-dynamic";

export default async function AdminFinancePage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const [initialReport, initialPerformance] = await Promise.all([
    getFinanceReport(),
    getSalesPerformance(),
  ]);

  return (
    <AdminFinanceContent
      initialReport={initialReport}
      initialPerformance={initialPerformance}
    />
  );
}
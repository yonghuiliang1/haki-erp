import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getInventoryBoard } from "@/lib/server/inventory-board-data";
import AdminInventoryContent from "@/components/admin/AdminInventoryContent";

/** Blocking SSR prefetch so the board renders complete on first paint. */
export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const initialBoard = await getInventoryBoard();
  return <AdminInventoryContent initialBoard={initialBoard} />;
}
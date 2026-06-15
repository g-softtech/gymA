import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { getUserAccessContext } from "@/lib/access-control";

export default async function DashboardRouter() {
  const session = await getAuthSession();
  
  // Pure, synchronous routing logic. No DB calls.
  const ctx = getUserAccessContext(session);
  
  redirect(ctx.defaultRedirect);
}
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@nq/api/auth";
import { Sidebar } from "@/components/sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session) redirect("/sign-in");
  if (role !== "ADMIN" && role !== "SUPERADMIN" && role !== "EDITOR") {
    redirect("/forbidden");
  }
  return (
    <div className="flex">
      <Sidebar />
      <main className="min-h-screen flex-1 overflow-x-hidden p-6">{children}</main>
    </div>
  );
}

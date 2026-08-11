import Dashboard from "@/components/Dashboard";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();
  return <Dashboard currentUserId={session!.user.id} currentUserName={session!.user.name ?? "상담사"} role={session!.user.role} />;
}

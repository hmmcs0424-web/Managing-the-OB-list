import Dashboard from "@/components/Dashboard";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();
  return <Dashboard currentUserId={session!.user.id} role={session!.user.role} />;
}

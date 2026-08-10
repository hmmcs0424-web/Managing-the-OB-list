import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import TemplatePanel from "@/components/TemplatePanel";
import { auth } from "@/auth";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader />
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar role={session!.user.role} />
        <main className="w-full min-w-0 flex-1 px-4 py-6 pb-24 lg:px-8">{children}</main>
      </div>
      <TemplatePanel />
    </div>
  );
}

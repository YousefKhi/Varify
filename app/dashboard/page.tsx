import { Suspense } from "react";
import DashboardHeader from "@/app/dashboard/components/DashboardHeader";
import AppList from "@/app/dashboard/components/AppList";
import AddAppButton from "@/app/dashboard/components/AddAppButton";
import LoadingApps from "@/app/dashboard/components/LoadingApps";

export const dynamic = "force-dynamic";

// Dashboard main page showing list of user's apps
export default async function Dashboard() {
  return (
    <main className="min-h-screen p-8 pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        <DashboardHeader />
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Your Apps</h2>
          <AddAppButton />
        </div>
        
        <Suspense fallback={<LoadingApps />}>
          <AppList />
        </Suspense>
      </div>
    </main>
  );
}

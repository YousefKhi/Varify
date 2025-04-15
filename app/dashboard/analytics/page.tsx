import { Suspense } from "react";
import BackToDashboard from "@/app/dashboard/components/BackToDashboard";
import AnalyticsHeader from "@/app/dashboard/analytics/components/AnalyticsHeader";
import AnalyticsOverview from "@/app/dashboard/analytics/components/AnalyticsOverview";
import ProjectsList from "@/app/dashboard/analytics/components/ProjectsList";
import LoadingAnalytics from "@/app/dashboard/analytics/components/LoadingAnalytics";

export const dynamic = "force-dynamic";

export default function AnalyticsPage() {
  return (
    <main className="min-h-screen p-8 pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        <BackToDashboard />
        
        <AnalyticsHeader />
        
        <Suspense fallback={<LoadingAnalytics />}>
          <AnalyticsOverview />
        </Suspense>
        
        <Suspense fallback={<div className="skeleton h-32 w-full"></div>}>
          <ProjectsList />
        </Suspense>
      </div>
    </main>
  );
} 
// app/dashboard/projects/layout.tsx
import Link from "next/link";
import { createClient } from "@/libs/supabase/server";

export default async function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  
  // Fetch project count for the sidebar
  const { count } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true });
  
  return (
    <div className="min-h-screen">
      <div className="bg-base-100 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center text-sm breadcrumbs">
            <ul>
              <li><Link href="/dashboard">Dashboard</Link></li>
              <li><Link href="/dashboard/projects">Projects</Link></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto p-4">
        <div className="flex flex-col md:flex-row gap-6">
          <aside className="md:w-64 shrink-0">
            <div className="sticky top-4">
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <h2 className="text-lg font-bold mb-2">Projects</h2>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm">{count || 0} projects</span>
                    <Link 
                      href="/dashboard/projects/new" 
                      className="btn btn-primary btn-sm"
                    >
                      New
                    </Link>
                  </div>
                  
                  <nav className="space-y-1">
                    <Link 
                      href="/dashboard/projects" 
                      className="flex p-2 rounded-md hover:bg-base-200"
                    >
                      All Projects
                    </Link>
                    <Link 
                      href="/dashboard/analytics" 
                      className="flex p-2 rounded-md hover:bg-base-200"
                    >
                      Analytics
                    </Link>
                  </nav>
                </div>
              </div>
              
              <div className="card bg-base-100 shadow-sm mt-4">
                <div className="card-body">
                  <h2 className="text-sm font-medium text-gray-500 mb-2">Documentation</h2>
                  <a 
                    href="https://shipfa.st/docs/features/ab-testing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm link link-hover flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    A/B Testing Guide
                  </a>
                </div>
              </div>
            </div>
          </aside>
          
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
  
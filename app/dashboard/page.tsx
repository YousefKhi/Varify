import DashboardHeader from "@/app/dashboard/components/DashboardHeader";
import AppList from "@/app/dashboard/components/AppList";
import AddAppButton from "@/app/dashboard/components/AddAppButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Dashboard main page showing list of user's apps
export default function Dashboard() {
  return (
    <main className="min-h-screen bg-[#121212]">
      <DashboardHeader />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-800 mb-6">
          <nav className="flex space-x-6">
            <Link href="/dashboard" className="text-white border-b-2 border-[#3ECF8E] font-medium pb-4 px-1">
              Overview
            </Link>
            <Link href="/dashboard/settings" className="text-gray-400 hover:text-white pb-4 px-1">
              Settings
            </Link>
          </nav>
        </div>
        
        {/* Search and Actions Row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="relative w-full md:w-1/3">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search apps..."
              className="bg-gray-900 w-full pl-10 pr-4 py-2 rounded-md border border-gray-800 text-white focus:ring-2 focus:ring-[#3ECF8E] focus:outline-none"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <select className="bg-gray-900 text-white border border-gray-800 rounded-md px-3 py-2 text-sm">
              <option>Sort by: Recently Updated</option>
              <option>Sort by: Name</option>
              <option>Sort by: Created</option>
            </select>
            <AddAppButton />
          </div>
        </div>
        
        <AppList />
      </div>
    </main>
  );
}

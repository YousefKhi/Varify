import ButtonAccount from "@/components/ButtonAccount";
import Link from "next/link";
import Image from "next/image";

export default function DashboardHeader() {
  return (
    <header className="bg-[#171717] border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image src="/icon.png" alt="Varify Logo" width={28} height={28} className="rounded" />
              <span className="ml-2 text-white font-semibold">Varify</span>
            </Link>
            
            {/* Main Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/dashboard" className="text-white text-sm font-medium">
                Projects
              </Link>
              <Link href="/dashboard/integrations" className="text-gray-400 hover:text-white text-sm">
                Integrations
              </Link>
              <Link href="/dashboard/activity" className="text-gray-400 hover:text-white text-sm">
                Activity
              </Link>
              <Link href="/dashboard/domains" className="text-gray-400 hover:text-white text-sm">
                Domains
              </Link>
              <Link href="/dashboard/usage" className="text-gray-400 hover:text-white text-sm">
                Usage
              </Link>
            </nav>
          </div>
          
          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            <Link 
              href="/feedback"
              className="hidden md:flex items-center text-sm text-gray-400 hover:text-white"
            >
              Feedback
            </Link>
            <Link 
              href="/docs"
              className="hidden md:flex items-center text-sm text-gray-400 hover:text-white"
            >
              Docs
            </Link>
            <ButtonAccount />
          </div>
        </div>
      </div>
    </header>
  );
} 
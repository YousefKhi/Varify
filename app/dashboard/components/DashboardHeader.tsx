import ButtonAccount from "@/components/ButtonAccount";
import Link from "next/link";

export default function DashboardHeader() {
  return (
    <header className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold">Dashboard</h1>
        <p className="text-gray-500 mt-2">Manage your A/B testing applications</p>
      </div>
      <div className="flex gap-4 items-center">
        <Link href="/dashboard/analytics" className="btn btn-ghost">
          Analytics
        </Link>
        <ButtonAccount />
      </div>
    </header>
  );
} 
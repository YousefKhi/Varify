import { createClient } from "@/libs/supabase/server";
import { notFound } from "next/navigation";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const supabase = createClient();
  
  // Fetch basic project data to verify it exists
  const { data: project, error } = await supabase
    .from("projects")
    .select("name")
    .eq("id", params.id)
    .single();

  if (error || !project) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {children}
    </div>
  );
} 
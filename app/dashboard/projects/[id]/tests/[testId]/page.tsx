import { createClient } from "@/libs/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function TestDetailPage({
  params,
}: {
  params: { id: string; testId: string };
}) {
  const supabase = createClient();
  
  // Fetch test details
  const { data: test, error } = await supabase
    .from("tests")
    .select("*")
    .eq("id", params.testId)
    .eq("project_id", params.id)
    .single();

  if (error || !test) {
    notFound();
  }

  // Fetch test variants
  const { data: variants } = await supabase
    .from("variants")
    .select("*")
    .eq("test_id", params.testId);

  // Fetch views count
  const { count: viewsCount } = await supabase
    .from("views")
    .select("id", { count: "exact" })
    .eq("test_id", params.testId);

  // Fetch conversions count
  const { count: conversionsCount } = await supabase
    .from("conversions")
    .select("id", { count: "exact" })
    .eq("test_id", params.testId);

  const conversionRate = viewsCount && viewsCount > 0
    ? ((conversionsCount || 0) / viewsCount) * 100
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{test.name}</h1>
          <p className="text-gray-500">Test ID: {test.id}</p>
        </div>
        <Link href={`/dashboard/projects/${params.id}`} className="btn btn-ghost">
          Back to Project
        </Link>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title">Test Details</h2>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Status:</span>{" "}
                <span className={`badge ${test.active ? 'badge-success' : 'badge-ghost'}`}>
                  {test.active ? 'Active' : 'Inactive'}
                </span>
              </p>
              <p>
                <span className="font-medium">Selector:</span>{" "}
                <code className="bg-base-200 p-1 rounded text-xs">{test.selector}</code>
              </p>
              {test.file_path && (
                <p><span className="font-medium">File Path:</span> {test.file_path}</p>
              )}
              {test.goal && (
                <p><span className="font-medium">Goal:</span> {test.goal}</p>
              )}
              {test.branch_name && (
                <p><span className="font-medium">Branch:</span> {test.branch_name}</p>
              )}
              <p><span className="font-medium">Created:</span> {new Date(test.created_at).toLocaleDateString()}</p>
              <p><span className="font-medium">Split Percentage:</span> {test.split}%</p>
            </div>
          </div>
        </div>
        
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title">Test Performance</h2>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div className="stat bg-base-200 rounded-lg p-4">
                <div className="stat-title">Views</div>
                <div className="stat-value">{viewsCount?.toLocaleString() || 0}</div>
              </div>
              
              <div className="stat bg-base-200 rounded-lg p-4">
                <div className="stat-title">Conversions</div>
                <div className="stat-value">{conversionsCount?.toLocaleString() || 0}</div>
              </div>
              
              <div className="stat bg-base-200 rounded-lg p-4">
                <div className="stat-title">Rate</div>
                <div className="stat-value">{conversionRate.toFixed(2)}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title">Variants</h2>
          {variants && variants.length > 0 ? (
            <div className="overflow-x-auto mt-4">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Variant Name</th>
                    <th>Code</th>
                    <th>Views</th>
                    <th>Conversions</th>
                    <th>Conversion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map(variant => (
                    <tr key={variant.id}>
                      <td>{variant.name}</td>
                      <td>
                        <div className="max-w-xs overflow-hidden">
                          <code className="bg-base-200 p-1 rounded text-xs whitespace-pre-wrap">
                            {variant.variant_a_code || variant.variant_b_code || "N/A"}
                          </code>
                        </div>
                      </td>
                      <td>-</td>
                      <td>-</td>
                      <td>-</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No variants found for this test.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
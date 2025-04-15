import Link from "next/link";

type ProjectHeaderProps = {
  project: {
    id: string;
    name: string;
    description?: string;
    created_at: string;
    // Add other properties as needed
  };
};

export default function ProjectHeader({ project }: ProjectHeaderProps) {
  return (
    <header className="border-b pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-gray-600 mt-2">{project.description}</p>
          )}
          <div className="mt-2 text-sm text-gray-500">
            Created on {new Date(project.created_at).toLocaleDateString()}
          </div>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center gap-2">
          <Link 
            href={`/dashboard/projects/${project.id}/tests/new`}
            className="btn btn-primary"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor" 
              className="w-5 h-5 mr-1"
            >
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            New Test
          </Link>
          
          <button className="btn btn-outline">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={1.5} 
              stroke="currentColor" 
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="flex gap-4 mt-6">
        <div className="stats bg-base-200 shadow">
          <div className="stat">
            <div className="stat-title">Active Tests</div>
            <div className="stat-value">-</div>
          </div>
          
          <div className="stat">
            <div className="stat-title">Total Visitors</div>
            <div className="stat-value">-</div>
          </div>
          
          <div className="stat">
            <div className="stat-title">Conversion Rate</div>
            <div className="stat-value">-</div>
          </div>
        </div>
      </div>
    </header>
  );
} 
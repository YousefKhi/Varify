import { ReactNode } from "react";

export default function ProjectLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
} 
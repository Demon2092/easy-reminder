import type { ReactNode } from "react";

type PageWrapperProps = {
  children: ReactNode;
};

export default function PageWrapper({ children }: PageWrapperProps) {
  return (
<div className="min-h-screen bg-gray-800 text-white py-10 flex items-start">
<div className="w-full px-0">
        {children}
      </div>
    </div>
  );
}

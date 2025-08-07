import { ReactNode } from "react";

type PageWrapperProps = {
  children: ReactNode;
};

export default function PageWrapper({ children }: PageWrapperProps) {
  return (
    <div className="min-h-screen bg-gray-800 text-white py-10 flex justify-center items-start">
      <div className="w-full max-w-screen-sm px-4 sm:px-6">
        {children}
      </div>
    </div>
  );
}

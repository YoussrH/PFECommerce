//admin/reclamations/layout.js
import { Inter } from "next/font/google";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export default function ReclamationsLayout({ children }) {
  return (
    <div className={`min-h-screen bg-gray-50 ${inter.className}`}>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}
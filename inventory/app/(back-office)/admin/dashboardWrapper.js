"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { toast, Toaster } from "sonner";
import Sidebar from "@/app/components/DashboardComponents/Sidebar/page";
import Navbar from "@/app/components/DashboardComponents/Navbar/page";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/authentification");
        toast.error("Veuillez vous connecter");
      } else if (!isAdmin) {
        router.push("/not-found");
        toast.error("Accès non autorisé");
      }
      setAuthChecked(true);
    }
  }, [user, loading, isAdmin, router]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  if (loading || !authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (user && isAdmin) {
    return (
      <div
        className="flex text-gray-900 w-full min-h-screen font-mono"
        style={{
          backgroundImage: "url('/background.svg')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Sidebar isSidebarCollapsed={isSidebarCollapsed} />
        <main
          className={`flex flex-col w-full h-full pb-1 transition-all duration-300 ${
            isSidebarCollapsed ? "md:pl-24 md:pr-4" : "md:pl-[16.5rem] md:pr-4"
          }`}
        >
          <Navbar
            isSidebarCollapsed={isSidebarCollapsed}
            toggleSidebar={toggleSidebar}
          />
          {children}
        </main>
        <Toaster position="top-center" richColors />
      </div>
    );
  }

  return null;
}

"use client";

import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import DynamicHeader from "./DynamicHeader/DynamicHeader";
import ScrollToTop from "./DynamicHeader/ScrollToTop";
import Footer from "./Footer/page";
import DashboardLayout from "../(back-office)/admin/dashboardWrapper";
import HomeLayout from "../(back-office)/admin/accueil/HomeLayout";
import { useEffect } from "react";

export default function ClientLayout({ children }) {
  const pathname = usePathname();

  const isDashboard = pathname?.startsWith("/admin");
  const isHomeSection = pathname?.startsWith("/admin/acceuil/");
  const isAuthPage = pathname?.startsWith("/authentification");

  useEffect(() => {
    if (isDashboard || isHomeSection) {
      document.body.classList.add("admin-body");
      document.body.classList.remove("main-body");
    } else {
      document.body.classList.add("main-body");
      document.body.classList.remove("admin-body");
    }
  }, [pathname, isDashboard, isHomeSection]);

  // Don't render ClientLayout for auth pages
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      {isHomeSection ? (
        <DashboardLayout><HomeLayout>{children}</HomeLayout></DashboardLayout>
      ) : isDashboard ? (
        <DashboardLayout>{children}</DashboardLayout>
      ) : (
        <>
          <DynamicHeader />
          {children}
          <ScrollToTop />
          <Footer />
          <Toaster position="top-center" richColors />
        </>
      )}
    </>
  );
}
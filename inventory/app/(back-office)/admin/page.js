// app/(back-office)/admin/page.js

"use client";

import { usePathname } from "next/navigation";
import HomeLayout from "./accueil/HomeLayout";
import Dashboard from "./accueil/dashboard/page";

import Sales from "./ventes/page";
import Users from "./utilisateurs/page";
import Reports from "./rapport/page";
import Settings from "./parametres/page";


export default function DashboardPage() {
  const pathname = usePathname();

  const renderContent = () => {
    if (pathname.startsWith("/admin/home")) {
      switch (pathname) {

        default:
          return (
            <HomeLayout>
              <Dashboard />
            </HomeLayout>
          );
      }
    } else {
      switch (pathname) {
        case "/admin/sales":
          return <Sales />;

        case "/admin/users":
          return <Users />;

        case "/admin/reports":
          return <Reports />;
        case "/admin/settings":
          return <Settings />;
        default:
          return (
            <HomeLayout>
              <Dashboard />
            </HomeLayout>
          );
      }
    }
  };

  return <>{renderContent()}</>;
}
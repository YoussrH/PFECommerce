// app/(back-office)/admin/page.js

"use client";

import { usePathname } from "next/navigation";
import HomeLayout from "./accueil/HomeLayout";
import Dashboard from "./accueil/dashboard/page";

import Inventory from "./inventaire/page";
import Sales from "./ventes/page";
import Products from "./produits/page";
import Users from "./utilisateurs/page";
import Integration from "./integrations/page";
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
        case "/admin/inventory":
          return <Inventory />;
        case "/admin/sales":
          return <Sales />;
        case "/admin/products":
          return <Products />;
        case "/admin/users":
          return <Users />;
        case "/admin/integration":
          return <Integration />;
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
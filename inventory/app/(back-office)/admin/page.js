// app/(back-office)/admin/page.js

"use client";

import { usePathname } from "next/navigation";
import HomeLayout from "./accueil/HomeLayout";
import Dashboard from "./accueil/dashboard/page";
import GettingStarted from "./accueil/getting-started/page";
import RecentUpdates from "./accueil/recent-updates/page";
import Announcements from "./accueil/announcements/page";
import Inventory from "./inventaire/page";
import Sales from "./ventes/page";
import Expenses from "./depenses/page";
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
        case "/admin/home/getting-started":
          return (
            <HomeLayout>
              <GettingStarted />
            </HomeLayout>
          );
        case "/admin/home/recent-updates":
          return (
            <HomeLayout>
              <RecentUpdates />
            </HomeLayout>
          );
        case "/admin/home/announcements":
          return (
            <HomeLayout>
              <Announcements />
            </HomeLayout>
          );
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
        case "/admin/expenses":
          return <Expenses />;
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
"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from '@/app/contexts/AuthContext';
import BreadcrumbAccount from "../components/Breadcrumb/BreadcrumbAccount";
import { Menu } from 'lucide-react';

export default function CustomerLayout({ children }) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (!isAuthenticated && !loading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Accès refusé</h1>
        <p className="text-gray-700">
          Vous devez être connecté pour accéder à cette page.{" "}
          <Link href="/login" className="text-blue-600 hover:underline">Se connecter</Link>
        </p>
      </div>
    );
  }

  if (loading) {
    return <div className="container mx-auto p-4 md:p-6 flex justify-center items-center">Chargement...</div>;
  }

  const navItems = [
    { name: "Mon tableau de bord", path: "/client", section: "dashboard" },
    { name: "Mon profil", path: "/client/compte/edit", section: "profile" },
    { name: "Mon carnet d'adresses", path: "/client/compte/addresse", section: "addresse" },
    { name: "Mes commandes", path: "/client/compte/commande", section: "commande" },
    { name: "Mes retours", path: "/client/compte/retours", section: "retours" },
    { name: "Mes cartes cadeau", path: "/client/compte/cartescadeaux", section: "cartescadeaux" },
    { name: "Ma liste d'envies", path: "/client/listenvie", section: "wishlist" },
    { name: "Service Client", path: "/client/compte/serviceclient", section: "customer-service" },
    { name: "Newsletter", path: "/client/compte/newsletters", section: "newsletters" }
  ];

  const Navigation = () => {
    const searchParams = useSearchParams();
    const section = searchParams.get("section");

    useEffect(() => {
      if (section) {
        setActiveSection(section);
      }
    }, [section]);

    const handleLogout = async (event) => {
      event.preventDefault();
      try {
        await logout();
        router.push("/");
      } catch (error) {
        console.error("Logout error:", error);
      }
    };

    return (
      <aside className={`${sidebarOpen ? 'block' : 'hidden'} md:block p-4 md:p-6 w-full md:w-72 lg:w-1/6 border border-black bg-gray-50 rounded-sm shadow-sm`}>
        <h6 className="text-sm font-semibold p-2 hidden md:block">
          Bonjour, {user?.prefix} {user?.nom}
        </h6>
        <nav>
          <ul className="space-y-2">
            {navItems.map(({ name, path, section }) => (
              <li key={section}>
                <Link
                  href={`${path}?section=${section}`}
                  className={`block py-1 hover:underline ${
                    activeSection === section 
                      ? "font-semibold text-gray-600" 
                      : "text-gray-700"
                  }`}
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      setSidebarOpen(false);
                    }
                  }}
                >
                  {name}
                </Link>
              </li>
            ))}
            <li>
              <button 
                className="text-gray-700 hover:underline py-1 w-full text-left" 
                onClick={handleLogout}
              >
                Déconnexion
              </button>
            </li>
          </ul>
        </nav>
      </aside>
    );
  }

  return (
    <>
      <BreadcrumbAccount />
      <div className="container mx-auto text-xs p-4 md:p-6">
        <div className="md:hidden mb-4 flex items-center justify-between">
          <h6 className="text-sm font-semibold">
            Bonjour, {user?.prefix} {user?.nom}
          </h6>
          <button 
            onClick={toggleSidebar} 
            className="p-2 border border-gray-300 rounded-md"
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:gap-8">
          <Suspense fallback={<div>Loading navigation...</div>}>
            <Navigation />
          </Suspense>

          <main className="w-full md:w-3/5 lg:w-4/5">{children}</main>
        </div>
      </div>
    </>
  );
}
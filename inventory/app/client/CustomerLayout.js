"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import BreadcrumbAccount from "../components/Breadcrumb/BreadcrumbAccount";

export default function CustomerLayout({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");
  const router = useRouter();
  const searchParams = useSearchParams();
  const section = searchParams.get("section");

  useEffect(() => {
    if (section) {
      setActiveSection(section);
    }
  }, [section]);

  useEffect(() => {
    console.log("Active Section:", activeSection);
  }, [activeSection]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get("http://localhost:5000/auth/user", { withCredentials: true });
        if (response.data.user) {
          setUser(response.data.user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await axios.post("http://localhost:5000/auth/logout", {}, { withCredentials: true });
      setIsAuthenticated(false);
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
    }
  };

  if (!isAuthenticated && !isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Accès refusé</h1>
        <p className="text-gray-700">
          Vous devez être connecté pour accéder à cette page.{" "}
          <Link href="/login" className="text-blue-600 hover:underline">Se connecter</Link>
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="container mx-auto p-6 flex justify-center items-center">Chargement...</div>;
  }

  return (
    <>
      <BreadcrumbAccount />
      <div className="container mx-auto text-xs p-6">
        <div className="flex flex-col md:flex-row gap-8">
          <aside className=" p-6 w-72 md:w-1/6 border h-[325px] border-black bg-gray-50  rounded-sm shadow-sm">
            <h6 className="text-sm font-semibold p-2">Bonjour, {user?.prefix} {user?.nom} </h6>
            <nav>
              <ul className="space-y-2">
                {[
                  { name: "Mon tableau de bord", path: "/client", section: "dashboard" },
                  { name: "Mon profil", path: "/client/compte/edit", section: "profile" },
                  { name: "Mon carnet d'adresses", path: "/client/compte/addresse", section: "addresse" },
                  { name: "Mes commandes", path: "/client/compte/commande", section: "commande" },
                  { name: "Mes retours", path: "/client/compte/retours", section: "retours" },
                  { name: "Mes cartes cadeau", path: "/client/compte/cartescadeaux", section: "cartescadeaux" },
                  { name: "Ma liste d'envies", path: "/client/listenvie", section: "wishlist" },
                  { name: "Service Client", path: "/client/compte/serviceclient", section: "customer-service" },
                  { name: "Newsletter", path: "/client/compte/newsletters", section: "newsletters" }
                ].map(({ name, path, section }) => (
                  <li key={section}>
                    <Link href={`${path}?section=${section}`}
                      className={`hover:underline ${activeSection === section ? "font-semibold text-gray-600" : "text-gray-700"}`}>
                      {name}
                    </Link>
                  </li>
                ))}
                <li>
                  <button className="text-gray-700 hover:underline" onClick={handleLogout}>Déconnexion</button>
                </li>
              </ul>
            </nav>
          </aside>

          <main className="w-full md:w-3/5">{children}</main>
        </div>
      </div>
    </>
  );
}

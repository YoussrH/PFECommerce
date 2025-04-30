"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import MonProfil from "./compte/edit/page";
import Mywishlist from "./listenvie/page";

export default function Account() {
  const [user, setUser] = useState({
    nom: "",
    prenom: "",
    email: "",
    prefix: "",
    newsletterSubscribed: false,
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");

  const router = useRouter();
  const searchParams = useSearchParams();
  const section = searchParams.get("section");

  useEffect(() => {
    if (section) setActiveSection(section);
  }, [section]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get("http://localhost:5000/auth/user", { withCredentials: true });
        if (response.data.user) {
          setUser(response.data.user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          setIsAuthenticated(false);
        } else {
          console.error("Failed to fetch user data:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleNewsletterChange = () => {
    setUser((prev) => ({ ...prev, newsletterSubscribed: !prev.newsletterSubscribed }));
  };

  const handleLogout = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      const response = await axios.post("http://localhost:5000/auth/logout", {}, { withCredentials: true });
      if (response.status === 200) {
        setIsAuthenticated(false);
        router.push("/");
        router.refresh();
      }
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
    return (
      <div className="container mx-auto p-6 flex justify-center items-center">
        Chargement...
      </div>
    );
  }

  return (
    <main className="w-full md:w-3/5">
      {activeSection === "dashboard" && (
        <section className="mb-8 grid grid-cols-2 gap-6">
          <div className="p-6">
            <h6 className="text-sm font-semibold pb-4">Informations de contact</h6>
            <div className="flex gap-4 mb-4">
              <button onClick={() => setActiveSection("profile")} className="text-black border border-black p-2 hover:underline">
                Éditer
              </button>
            </div>
            <div>
              <p className="text-gray-700 mb-2">
                <span className="font-semibold">{user.nom} {user.prenom}</span>
              </p>
              <p className="text-gray-700 mb-4">{user.email}</p>
              <button className="text-black border border-black p-2 hover:underline">
                Modifier le mot de passe
              </button>
            </div>
          </div>

          <div className="p-6">
            <h6 className="text-sm font-semibold pb-4">Newsletters</h6>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={user.newsletterSubscribed} onChange={handleNewsletterChange}
                className="form-checkbox h-5 w-5 text-black rounded-sm focus:ring-black focus:border-white" />
              <p className="text-gray-700">
                {user.newsletterSubscribed ? "Vous êtes abonné à notre newsletter."
                  : "Vous n'êtes abonné à aucune newsletter."}
              </p>
            </label>
          </div>
        </section>
      )}

      {activeSection === "profile" && (
        <section className="mb-8">
          <h6 className="text-sm font-semibold pb-4">Éditer le profil</h6>
          <MonProfil />
        </section>
      )}

      {activeSection === "wishlist" && (
        <section id="wishlist-section" className="mb-8">
          <h6 className="text-sm font-semibold pb-4">Ma liste d&apos;envies</h6>
          <Mywishlist />
        </section>
      )}
    </main>
  );
}

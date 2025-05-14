"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from '@/app/contexts/AuthContext';
import MonProfil from "./compte/edit/page";
import Mywishlist from "./listenvie/page";

export default function Account() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");
  const { user, isAuthenticated, loading, checkAuth } = useAuth();
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const section = searchParams.get("section");

  useEffect(() => {
    if (section) setActiveSection(section);
  }, [section]);

  useEffect(() => {
    const verifyAuth = async () => {
      await checkAuth();
      setIsLoading(false);
    };
    verifyAuth();
  }, [checkAuth]);

  const handleNewsletterChange = () => {
    // You'll need to implement this with an API call if needed
    console.log("Newsletter subscription changed");
  };

  if (!isAuthenticated && !loading) {
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

  if (loading || isLoading) {
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
              <button 
                onClick={() => setActiveSection("profile")} 
                className="text-black border border-black p-2 hover:underline"
              >
                Éditer
              </button>
            </div>
            <div>
              <p className="text-gray-700 mb-2">
                <span className="font-semibold">{user?.nom} {user?.prenom}</span>
              </p>
              <p className="text-gray-700 mb-4">{user?.email}</p>
              <button className="text-black border border-black p-2 hover:underline">
                Modifier le mot de passe
              </button>
            </div>
          </div>

          <div className="p-6">
            <h6 className="text-sm font-semibold pb-4">Newsletters</h6>
            <label className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={user?.newsletter || false} 
                onChange={handleNewsletterChange}
                className="form-checkbox h-5 w-5 text-black rounded-sm focus:ring-black focus:border-white" 
              />
              <p className="text-gray-700">
                {user?.newsletter ? "Vous êtes abonné à notre newsletter."
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
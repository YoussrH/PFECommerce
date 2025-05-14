"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from '@/app/contexts/AuthContext';
import MonProfil from "./compte/edit/page";
import Mywishlist from "./listenvie/page";
import { useClient } from "@/hooks/useClient";

export default function Account() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");
  const { user, isAuthenticated, loading, checkAuth } = useAuth();
  const { updateNewsletterSubscription } = useClient();
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

  const handleNewsletterChange = async (e) => {
    try {
      const subscribed = e.target.checked;
      const { success } = await updateNewsletterSubscription(subscribed);
      if (success) {
        // Update local user state if needed
      }
    } catch (error) {
      console.error("Failed to update newsletter subscription:", error);
    }
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

  if (loading || isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 flex justify-center items-center">
        Chargement...
      </div>
    );
  }

  return (
    <div className="w-full">
      {activeSection === "dashboard" && (
        <section className="mb-6 md:mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="p-4 md:p-6 border border-gray-200 rounded-sm">
              <h6 className="text-sm font-semibold pb-4">Informations de contact</h6>
              <div className="flex gap-4 mb-4">
                <Link 
                  href="/client/compte/edit?section=profile"
                  className="text-black border border-black p-2 hover:underline text-xs md:text-sm"
                >
                  Éditer
                </Link>
              </div>
              <div>
                <p className="text-gray-700 mb-2 text-sm md:text-base">
                  <span className="font-semibold">{user?.prefix} {user?.nom} {user?.prenom}</span>
                </p>
                <p className="text-gray-700 mb-4 text-sm md:text-base">{user?.email}</p>
                <Link 
                  href="/client/compte/edit?section=profile" 
                  className="text-black border border-black p-2 hover:underline text-xs md:text-sm"
                >
                  Modifier le mot de passe
                </Link>
              </div>
            </div>

            <div className="p-4 md:p-6 border border-gray-200 rounded-sm">
              <h6 className="text-sm font-semibold pb-4">Newsletters</h6>
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={user?.newsletter || false} 
                  onChange={handleNewsletterChange}
                  className="form-checkbox h-4 w-4 md:h-5 md:w-5 text-black rounded-sm focus:ring-black focus:border-white" 
                />
                <p className="text-gray-700 text-sm md:text-base">
                  {user?.newsletter ? "Vous êtes abonné à notre newsletter."
                    : "Vous n'êtes abonné à aucune newsletter."}
                </p>
              </label>
            </div>
          </div>
        </section>
      )}

      {activeSection === "profile" && (
        <section className="mb-6 md:mb-8 border border-gray-200 rounded-sm">
          <h6 className="text-sm font-semibold p-4">Éditer le profil</h6>
          <div className="p-2 md:p-4">
            <MonProfil />
          </div>
        </section>
      )}

      {activeSection === "wishlist" && (
        <section id="wishlist-section" className="mb-6 md:mb-8 border border-gray-200 rounded-sm">
          <h6 className="text-sm font-semibold p-4">Ma liste d&apos;envies</h6>
          <div className="p-2 md:p-4">
            <Mywishlist />
          </div>
        </section>
      )}
    </div>
  );
}
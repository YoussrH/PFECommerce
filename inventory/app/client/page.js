"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from '@/app/contexts/AuthContext';
import MonProfil from "./compte/edit/page";
import Mywishlist from "./listenvie/page";
import { useClient } from "@/hooks/useClient";
import { toast } from "sonner";

export default function Account() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const { user, isAuthenticated, loading } = useAuth();
  const { updateNewsletterSubscription } = useClient();
  const searchParams = useSearchParams();

  // Set active section from URL
  React.useEffect(() => {
    const section = searchParams.get("section");
    if (section) setActiveSection(section);
  }, [searchParams]);

  const handleNewsletterChange = async (e) => {
    try {
      const subscribed = e.target.checked;
      const { success } = await updateNewsletterSubscription(subscribed);
      if (success) {
        toast.success(
          subscribed 
            ? "Vous êtes maintenant abonné à notre newsletter" 
            : "Vous avez été désabonné de notre newsletter"
        );
      }
    } catch (error) {
      console.error("Failed to update newsletter subscription:", error);
      toast.error("Une erreur est survenue lors de la mise à jour de votre abonnement");
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

  if (loading) {
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
                  <span className="font-semibold">{user?.client?.prefix} {user?.client?.nom} {user?.client?.prenom}</span>
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
                  checked={user?.client?.newsletter || false} 
                  onChange={handleNewsletterChange}
                  className="form-checkbox h-4 w-4 md:h-5 md:w-5 text-black rounded-sm focus:ring-black focus:border-white" 
                />
                <p className="text-gray-700 text-sm md:text-base">
                  {user?.client?.newsletter 
                    ? "Vous êtes abonné à notre newsletter."
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
"use client";

import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import FeaturesSection from "./FeaturesSection";

export default function Footer() {
  const [marques, setMarques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMarques = async () => {
      try {
        const response = await fetch("http://localhost:5000/marques");
        if (!response.ok) {
          throw new Error("Échec du chargement des marques");
        }
        const data = await response.json();
        setMarques(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMarques();
  }, []);

  return (
    <>
      <FeaturesSection />
      <div className="relative">
        <footer
          className="relative py-10 px-5 sm:px-10 bg-cover bg-center font-mono"
          style={{ backgroundImage: "url('/footerbg.png')" }}
        >
          <div className="relative z-10 max-w-6xl mx-auto text-black">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold tracking-[2px] uppercase">
                Inscrivez-vous à la newsletter
              </h3>
              <p className="text-gray-700 text-xs mt-1">
                -10% sur la première commande et plein d&apos;autres SURPRISES !
              </p>
              <div className="mt-3 flex flex-col sm:flex-row justify-center">
                <input
                  type="email"
                  placeholder="Ici votre adresse mail"
                  className="px-3 py-2 w-full sm:w-64 rounded-t-md sm:rounded-l-md border border-gray-400 outline-none text-sm"
                />
                <button className="bg-black text-white px-4 py-2 rounded-b-md sm:rounded-r-md font-semibold text-sm hover:bg-gray-800 transition">
                  OK
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
              <div>
                <h4 className="text-md font-semibold mb-2">À Propos</h4>
                <ul className="text-gray-700 space-y-1 text-xs">
                  <li><Link href="/" className="hover:text-black transition">MGM Boutique</Link></li>
                  <li><Link href="/qui-sommes-nous" className="hover:text-black transition">Qui sommes-nous ?</Link></li>
                  <li><Link href="/boutiques" className="hover:text-black transition">Nos boutiques</Link></li>
                  <li><Link href="/contact" className="hover:text-black transition">Nous contacter</Link></li>
                  <li><Link href="/conditions-offres" className="hover:text-black transition">Conditions des offres</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-md font-semibold mb-2">Services</h4>
                <ul className="text-gray-700 space-y-1 text-xs">
                  <li><Link href="/seconde-main" className="hover:text-black transition">Seconde main</Link></li>
                  <li><Link href="/les-reparables" className="hover:text-black transition">Les Réparables</Link></li>
                  <li><Link href="/livraisons-retours" className="hover:text-black transition">Livraisons et retours</Link></li>
                  <li><Link href="/paiement-securise" className="hover:text-black transition">Paiement sécurisé</Link></li>
                  <li><Link href="/faq" className="hover:text-black transition">Questions fréquentes</Link></li>
                  <li><Link href="/guide-tailles" className="hover:text-black transition">Guide des tailles</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-md font-semibold mb-2">Infos légales</h4>
                <ul className="text-gray-700 space-y-1 text-xs">
                  <li><Link href="/mentions-legales" className="hover:text-black transition">Mentions légales</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-md font-semibold mb-2">Suivez-nous</h4>
                <div className="flex justify-center md:justify-start space-x-3 mt-2">
                  <a href="#" className="text-gray-700 hover:text-black transition"><Instagram className="w-5 h-5" /></a>
                  <a href="#" className="text-gray-700 hover:text-black transition"><Twitter className="w-5 h-5" /></a>
                  <a href="#" className="text-gray-700 hover:text-black transition"><Facebook className="w-5 h-5" /></a>
                  <a href="#" className="text-gray-700 hover:text-black transition"><Youtube className="w-5 h-5" /></a>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center text-gray-600 text-xs">
              &copy; {new Date().getFullYear()} MGM Boutique. Tous droits réservés.
            </div>
          </div>
        </footer>

        <div className="bg-black py-3 flex flex-wrap justify-center gap-4 text-white text-sm font-normal px-4">
          {loading ? (
            <p>Chargement des marques...</p>
          ) : error ? (
            <p className="text-red-500">Erreur: {error}</p>
          ) : (
            marques.map((marque) => (
              <span key={marque.id} className="text-white">{marque.libelle}</span>
            ))
          )}
        </div>
      </div>
    </>
  );
}

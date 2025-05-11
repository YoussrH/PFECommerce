"use client";
import React from "react";
import Image from "next/image";

export default function SubmenuOutlet({ isOpen, onMouseEnter, onMouseLeave, isScrolled }) {
  return (
    <div
      className={`absolute left-0 top-[165px] w-full bg-white border border-gray-200 shadow-md transition-all duration-300 ease-in-out z-50 ${
        isOpen ? "opacity-100 visible" : "opacity-0 invisible"
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ top: isScrolled ? "51px" : "166px" }}
    >
      <div className="mx-auto w-[75%] py-8 px-6 hidden md:flex gap-12">
        {/* Categories Section */}
        <div className="w-1/4">
          <h4 className="font-semibold uppercase text-gray-700 text-xs tracking-wider">Catégories</h4>
          <ul className="mt-3 space-y-2">
            {["Outlet fille", "Outlet bébé fille", "Outlet garçon", "Outlet bébé garçon"].map((brand, index) => (
              <li key={index}>
                <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors text-xs">
                  {brand}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Products Section */}
        <div className="w-1/4">
          <h4 className="font-semibold uppercase text-gray-700 text-xs tracking-wider">Produits</h4>
          <ul className="mt-3 space-y-2">
            {[
              "PARKAS, VESTES, MANTEAUX",
              "PULLS, GILETS, CARDIGANS",
              "T-SHIRTS, POLOS, SOUS-PULLS",
              "CHEMISES, BLOUSES",
              "PANTALONS, PANTACOURTS, LEGGINGS",
              "ENSEMBLES, COMBINAISONS",
              "ROBES",
            ].map((brand, index) => (
              <li key={index}>
                <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors text-xs">
                  {brand}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Images Section */}
        <div className="flex gap-6">
          <div className="relative group w-[320px]">
            <Image
              src="/DINA-VIOLET-1.jpg"
              alt="Sélection Femme"
              width={320}
              height={400}
              className="h-80 w-full object-cover transition-transform duration-300 group-hover:scale-105 rounded-lg shadow-md"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-center items-center text-white text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <h4 className="text-xs font-semibold mb-2">Sélection Outlet</h4>
              <button className="px-4 py-2 text-black font-medium bg-white rounded-full shadow hover:bg-gray-300 transition">
                Découvrir Plus
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

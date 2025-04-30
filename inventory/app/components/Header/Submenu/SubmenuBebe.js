"use client";
import React from "react";
import Image from "next/image";

export default function SubmenuBebe({ isOpen, onMouseEnter, onMouseLeave, isScrolled }) {
  return (
    <div
      className={`absolute left-0 top-[165px] w-full bg-white border border-gray-200 shadow-md transition-all duration-300 ease-in-out z-50 ${
        isOpen ? "opacity-100 visible" : "opacity-0 invisible"
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ top: isScrolled ? "51px" : "166px" }}
    >
      <div className="mx-auto w-[85%] p-6 flex gap-12">
        {/* Categories Section */}
        <div>
          <h4 className="font-bold font-serif mb-2 uppercase text-sm">Vêtements</h4>
          <ul className="space-y-2">
            {[
              "Tops et T-shirts",
              "Chemises et blouses",
              "Bodys et pyjamas",
              "Pulls et gilets",
              "Combi-pilotes, blousons, manteaux",
              "Ensembles",
              "Robes et jupes",
              "Shorts et bloomers",
              "Pantalons et salopettes",
              "Maillots de bains",
              "> Tous les vêtements",
            ].map((item, index) => (
              <li key={index}>
                <a href="#" className="hover:text-blue-600 font-light font-serif text-sm">
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Accessories Section */}
        <div>
          <h4 className="font-bold font-serif mb-2 uppercase text-sm">Accessoires</h4>
          <ul className="space-y-2">
            {[
              "Sacs à langer, sacs",
              "Biberons, tétines",
              "Nids d'ange, turbulettes, couvertures",
              "Bavoirs",
              "Chapeaux, casquettes, bobs",
              "Doudou",
              "Chaussettes, collants",
              "> Tous les accessoires",
            ].map((item, index) => (
              <li key={index}>
                <a href="#" className="hover:text-blue-600 font-light font-serif text-sm">
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Shoes Section */}
        <div>
          <h4 className="font-bold font-serif mb-2 uppercase text-sm">Chaussures</h4>
          <ul className="space-y-2">
            {["Baskets", "Chaussons", "> Toutes les chaussures"].map((item, index) => (
              <li key={index}>
                <a href="#" className="hover:text-blue-600 font-light font-serif text-sm">
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Featured Section */}
        <div className="flex gap-8">
          <div className="relative group w-[350px]">
            <Image
              src="/bebe.jpg"
              alt="Sélection Bebe"
              width={350}
              height={400}
              className="h-96 rounded-lg shadow-md object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {/* Hover effect: Text moves to overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-center items-center text-white text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <h4 className="text-lg font-semibold mb-2">Sélection Bebe</h4>
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

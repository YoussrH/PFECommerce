"use client";

import Image from "next/image";
import React from "react";
import { AiOutlinePlus } from "react-icons/ai";

const products = [
  { id: 1, image: "/chemise1.jpg", composition: "69% LYOCELL 30% COTTON", name: "Chemise Classique", price: "DT 49.99", colors: ["#000000", "#B22222", "#4169E1"] },
  { id: 2, image: "/PULL-blanc.jpg", composition: "100% COTTON", name: "Pull Blanc", price: "DT 54.99", colors: ["#A52A2A", "#4B0082"] },
  { id: 3, image: "/Banner-HOMME-3-scaled-1.jpg", composition: "98% COTTON 2% ELASTANE", name: "Veste Noir ", price: "DT 79.99", colors: ["#1C1C1C"] },
  { id: 4, image: "/femme-slider1.jpg", composition: "98% COTTON 2% ELASTANE", name: "Pull Oversize", price: "DT 84.99", colors: ["#1C1C1C", "#808080"] },
];

export default function NewProduit() {
  return (
    <section className="px-10 mt-16">
      <div className="text-lg text-center leading-[30px] tracking-[2px] font-normal relative">
        <span className="block uppercase">Offres Spéciales à Ne Pas Manquer !</span>
        <span className="block text-sm font-serif font-light text-gray-600 mt-2">
          Profitez de réductions exclusives sur nos nouveautés. Quantités limitées, ne ratez pas votre chance !
        </span>
      </div>

      <div className="flex gap-4 justify-center mt-10">
        {products.map((product) => (
          <div key={product.id} className="relative flex-shrink-0 w-[200px]">
            <div className="relative">
            <Image src={product.image} alt={product.name} width={240} height={240} className="w-full h-60 object-cover rounded-md" />
              {product.colors.length > 1 && (
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  {product.colors.map((color, i) => (
                    <span key={i} className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: color }}></span>
                  ))}
                </div>
              )}

              <div className="absolute bottom-2 right-2 bg-black text-white p-1.5 rounded-full cursor-pointer hover:bg-gray-700 transition">
                <AiOutlinePlus className="text-lg" />
              </div>
            </div>

            <div className="w-full flex justify-center mt-4">
              <div className="animate-bounce text-center bg-black text-white text-xs font-serif tracking-widest px-2 py-1">
                <span> NOUVEAUTÉ </span>
              </div>
            </div>

            <p className="text-gray-500 text-xs font-light mt-2">{product.composition}</p>

            <div className="flex justify-between items-center mt-1">
              <p className="text-sm font-normal tracking-[1px] font-serif">{product.name}</p>
              <p className="text-sm font-normal">{product.price}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

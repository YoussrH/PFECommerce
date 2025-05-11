"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Hero() {
  const router = useRouter();

  return (
    <section className="flex flex-col justify-center items-center mt-16 lg:mt-24 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-7xl">
        {/* Left Column - Women's Section */}
        <div className="relative flex flex-col items-center">
          <div className="overflow-hidden w-full h-auto aspect-square md:aspect-[3/4] cursor-pointer">
            <Image 
              src="/KANE-BLG23D45-A1.jpg" 
              alt="VESTES | FEMME" 
              width={500} 
              height={500} 
              className="shadow-lg w-full h-full object-cover transform scale-100 transition-transform duration-500 ease-out hover:scale-105" 
            />
          </div>
          <div className="relative -mt-8 md:-mt-10 bg-white p-3 sm:p-4 shadow-md w-[90%] md:w-[80%] text-center">
            <h3 className="text-sm md:text-base font-serif">VESTES | FEMME</h3>
            <p className="text-xs md:text-sm mt-1 font-mono font-thin">
              Explorez des vêtements garçons pratiques et stylés
            </p>
            <button
              className="mt-3 px-3 py-1.5 sm:px-4 sm:py-2 border-black border-2 text-black font-mono font-semibold text-xs hover:bg-gray-200 transition"
              onClick={() => router.push("/store/products")}
            >
              VOIR LA SÉLECTION
            </button>
          </div>
        </div>

        {/* Right Column - Men's Sections */}
        <div className="flex flex-col items-center space-y-4 md:space-y-6">
          {/* Men's Pants */}
          <div className="relative flex flex-col items-center w-full">
            <div className="overflow-hidden w-full h-auto aspect-[4/3] md:aspect-[5/4] cursor-pointer">
              <Image 
                src="/slider-homme-scaled.jpg" 
                alt="PANTALONS | HOMME" 
                width={500} 
                height={500} 
                className="shadow-lg w-full h-full object-cover transform scale-100 transition-transform duration-500 ease-out hover:scale-105" 
              />
            </div>
            <div className="text-center mt-2 md:mt-3">
              <h3 className="text-sm md:text-base font-serif">PANTALONS | HOMME</h3>
              <button
                className="mt-1 font-semibold px-4 pt-1 text-black font-mono text-xs md:text-sm border-b-2 border-black hover:text-gray-500 transition"
                onClick={() => router.push("/store/products")}
              >
                VOIR LA SÉLECTION
              </button>
            </div>
          </div>

          {/* Boys' Shirts */}
          <div className="relative flex flex-col items-center w-full">
            <div className="overflow-hidden w-full h-auto aspect-[4/3] md:aspect-[5/4] cursor-pointer">
              <Image 
                src="/CHEMISE-B5-2.jpg" 
                alt="CHEMISE | GARÇON" 
                width={500} 
                height={500} 
                className="shadow-lg w-full h-full object-cover transform scale-100 transition-transform duration-500 ease-out hover:scale-105" 
              />
            </div>
            <div className="text-center mt-2 md:mt-3">
              <h3 className="text-sm md:text-base font-serif">CHEMISE | GARÇON</h3>
              <button
                className="mt-1 px-4 pt-1 text-black font-mono font-semibold text-xs md:text-sm border-b-2 border-black hover:text-gray-500 transition"
                onClick={() => router.push("/store/products")}
              >
                VOIR LA SÉLECTION
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
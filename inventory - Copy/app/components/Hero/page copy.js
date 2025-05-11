"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function Hero() {
  const router = useRouter();

  return (
    <section className="flex flex-col justify-center items-center mt-16">
     {/*  <div className="text-center justify-center mb-10 relative">
          <div className="text-xl leading-[40px] gap-2 tracking-[2px] font-bold uppercase relative">
            <span className="relative">
              NEW COLLECTIO<span className="relative">
                N
                <span className="absolute -top-4 -right-2 text-red-500 text-xs font-extrabold animate-bounce">
                  (4)
                </span>
              </span>
            </span>
          </div>

          <div className="mt-2 font-light tracking-[2px] text-lg">
            <span className="block">Winter</span>
            <span className="block">2025</span>
          </div>
        </div> */}


      <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
        <div className="relative flex flex-col items-center">
          <div className="overflow-hidden w-full h-[70%] cursor-pointer">
            <img
              src="/KANE-BLG23D45-A1.jpg"
              alt="VESTES | FEMME"
              className="shadow-lg w-full h-full object-cover transform scale-100 transition-transform duration-500 ease-out hover:scale-105"
            />
          </div>
          <div className="relative bottom-4 bg-white p-3 shadow-md w-[80%] text-center ">
            <h3 className="text-sm font-serif">VESTES | FEMME</h3>
            <p className="text-xs mt-1 font-mono font-thin">
              Explorez des vêtements garçons pratiques et stylés
            </p>
            <button
              className="mt-3 px-4 py-2 border-black border-2 text-black  font-mono font-semibold text-xs hover:bg-gray-200 transition"
              onClick={() => router.push("/store/products")}
            >
              VOIR LA SÉLECTION
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative flex flex-col items-center cursor-pointer">
            <div className="overflow-hidden w-[30rem] h-[24rem] cursor-pointer">
              <img
                src="/slider-homme-scaled.jpg"
                alt="PANTALONS | GARÇON"
                className="shadow-lg w-full h-full object-fit transform scale-100 transition-transform duration-500 ease-out hover:scale-105"
              />
            </div>
            <div className="text-center mt-1">
              <h3 className="text-sm font-serif">PANTALONS | Homme</h3>
              <button
                className="mt-1 font-semibold px-4 pt-1 text-black font-mono text-xs border-b-2 border-black hover:text-gray-500 transition"
                onClick={() => router.push("/store/products")}
              >
                VOIR LA SÉLECTION
              </button>
            </div>
          </div>

          <div className="relative flex flex-col items-center mt-5">
            <div className="overflow-hidden w-[30rem] h-[24rem] cursor-pointer">
              <img
                src="/CHEMISE-B5-2.jpg"
                alt="CHEMISE | GARÇON"
                className="shadow-lg w-full h-full object-fit transform scale-100 transition-transform duration-500 ease-out hover:scale-105"
              />
            </div>
            <div className="text-center mt-1">
              <h3 className="text-sm font-serif">CHEMISE | GARÇON</h3>
              <button
                className="mt-1 px-4 pt-1 text-black font-mono font-semibold text-xs border-b-2 border-black hover:text-gray-500 transition"
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

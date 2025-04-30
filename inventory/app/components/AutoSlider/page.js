"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RiArrowDropRightLine, RiArrowDropLeftLine } from "react-icons/ri";
import Image from "next/image";

export default function AutoSlider() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:5000/articles"); 
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        if (!data.success || !Array.isArray(data.donnees)) {
          throw new Error("Unexpected API response structure");
        }

        setProducts(data.donnees.slice(0, 6)); 
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 2) % products.length);
      }, 5000);
      return () => clearInterval(interval); 
    }
  }, [products]);

  const scrollLeft = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? products.length - 2 : prevIndex - 2));
  };

  const scrollRight = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 2) % products.length);
  };

  return (
    <section className="flex flex-col md:flex-row items-start justify-between px-6 md:px-10 mt-24 gap-10">
      {/* LEFT TEXT SECTION */}
      <div className="flex flex-col md:w-[45%]">
        <div className="text-5xl leading-[40px] tracking-[2px] font-bold uppercase">
          <span className="block">NOUVELLE </span>
          <span className="block">COLLECTION</span>
        </div>

        <div className="mt-2 font-light tracking-[2px] text-lg">
          <span className="block">Printemps</span>
          <span className="block">2025</span>
        </div>

        <div className="mt-24 flex items-center gap-10">
          <button
            className="flex items-center border border-gray-300 px-5 py-2 bg-[#D9D9D9] cursor-pointer"
            onClick={() => router.push("/store/produits")}
          >
            <span className="text-[16px]">Aller à la boutique</span>
            <Image src="/ArrowRightVector.svg" alt="arrow-right" width="42" height="20" className="ml-5 animate-pulse" />
          </button>

          <div className="flex gap-2 ml-auto">
            <RiArrowDropLeftLine
              onClick={scrollLeft}
              className={`border h-10 w-10 border-gray-400 rounded-md p-1 text-4xl 
                ${currentIndex === 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            />
            <RiArrowDropRightLine
              onClick={scrollRight}
              className={`border h-10 w-10 border-gray-400 rounded-md p-1 text-4xl 
                ${currentIndex >= products.length - 2 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            />
          </div>
        </div>
      </div>

      {/* RIGHT IMAGE SLIDER */}
      <div className="w-full md:w-[50%] overflow-hidden relative">
        <div
          className="flex gap-5 transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 55}%)` }}
        >
          {products.map((product, index) => (
            <div key={index} className="w-[50%] flex-shrink-0">
              <Image
                width={600}
                height={500}
                src={product.images_couleurs?.[0]?.image_url || "/placeholder.jpg"}
                alt={product.nom || "Product"}
                className="w-full h-96 object-cover rounded-xl"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

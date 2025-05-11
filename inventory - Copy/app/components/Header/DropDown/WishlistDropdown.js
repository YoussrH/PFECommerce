"use client";
import React, { useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import "../top.css";
import Link from "next/link";

const WishlistDropdown = ({
  isAuthenticated,
  userPrenom,
  isOpen,
  onMouseEnter,
  onMouseLeave,
  onClick,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onMouseLeave();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onMouseLeave]);

  const handleWishlistClick = () => {
    console.log("Wishlist clicked!"); 
    if (isAuthenticated) {
      router.push("/client");
    } else {
      onClick();
    }
  };

  return (
    <div
      className="relative p-1"
      ref={dropdownRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="cursor-pointer" onClick={handleWishlistClick}>
        <Image
          src={pathname === "/listenvie" ? "/wishlistselected.svg" : "/wishlist.svg"}
          alt="wishlist"
          width={30}
          height={30}
        />
      </div>

      {isOpen && (
        <div
          className="absolute right-0 mt-1 w-64 z-50 bg-white border border-gray-300 rounded-md shadow-md"
          onMouseLeave={onMouseLeave}
        >
          <div className="px-4 py-2 text-xs">
            <p className="font-semibold">Bonjour {userPrenom}</p>
          </div>
          <hr className="border-t border-gray-300" />
          <div className="p-4 text-center text-xs">
            <p>Votre liste de souhaits est vide.</p>
            <Link
              href="/products"
              className="mt-4 inline-block px-3 py-2 bg-black border border-black text-white rounded-sm hover:bg-white hover:text-black"
            >
              Explorer les produits
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistDropdown;
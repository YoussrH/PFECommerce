"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "../Header/page";
import CheckoutProgress from "../Header/CheckoutProgress";

export default function DynamicHeader() {
  const pathname = usePathname() || "";
  const [isScrolling, setIsScrolling] = useState(false);

  const filterBarPaths = [
    "/store/nouveautes",
    "/store/petits-prix",
    "/store/bebe",
    "/store/garcon",
    "/store/fille",
    "/store/chaussure",
    "/store/chaussures",
    "/store/marques",
    "/store/tendances",
    "/store/outlet",
  ];
  const chekoutBarPaths = [
    "/checkout/cart",
    "/checkout/identifier",
    "/checkout/adresse",
    "/checkout/livraison",
    "/checkout/paiement",
    "/checkout/confirmation",
  ];

  const isFilterBarPresent = filterBarPaths.includes(pathname);
  const isCheckoutCart = chekoutBarPaths.includes(pathname);

  useEffect(() => {
    if (!isCheckoutCart) {
      const handleScroll = () => {
        if (window.scrollY > 50) {
          setIsScrolling(true);
        } else {
          setIsScrolling(false);
        }
      };

      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [isCheckoutCart]);

  return (
    <div
      className={`w-full transition-all duration-300 ease-in-out ${
        isScrolling && !isFilterBarPresent && !isCheckoutCart
          ? "fixed top-0 left-0 w-full bg-white shadow-md z-50"
          : ""
      }`}
    >
      {isCheckoutCart ? <CheckoutProgress /> : <Header isFilterBarPresent={isFilterBarPresent} />}
    </div>
  );
}

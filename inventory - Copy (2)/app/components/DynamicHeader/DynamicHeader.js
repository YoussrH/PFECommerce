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

  // Now using prefix matching to support dynamic route
  const isCheckoutCart = [
    "/caisse/panier",
    "/caisse/identification",
    "/caisse/adresse",
    "/caisse/livraison",
    "/caisse/paiement",
  ].some((path) => pathname === path) || pathname.startsWith("/caisse/confirmation");

  // Check if this is a 404 page
  const is404 = typeof window !== 'undefined' &&
    (window.__NEXT_DATA__?.props?.pageProps?.notFound === true);

  useEffect(() => {
    if (!isCheckoutCart && !is404) {
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
  }, [isCheckoutCart, is404]);

  if (is404) return null;

  return (
    <div
      className={`w-full transition-all duration-300 ease-in-out ${
        isScrolling && !filterBarPaths.includes(pathname) && !isCheckoutCart
          ? "fixed top-0 left-0 w-full bg-white shadow-md z-50"
          : ""
      }`}
    >
      {isCheckoutCart ? (
        <CheckoutProgress />
      ) : (
        <Header isFilterBarPresent={filterBarPaths.includes(pathname)} />
      )}
    </div>
  );
}

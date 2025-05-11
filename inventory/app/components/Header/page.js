"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import TopNav from "./TopNav";
import { useRouter } from "next/navigation";
import { CiCirclePlus } from "react-icons/ci";
import IconsComponents from "./Components/icons";
import SubmenusComponents from "./Components/submenusComponents";

export default function Header({ isFilterBarPresent }) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // State for submenus
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [petitPrixOpen, setPetitPrixOpen] = useState(false);
  const [femmeOpen, setFemmeOpen] = useState(false);
  const [garconOpen, setGarconOpen] = useState(false);
  const [marquesOpen, setMarquesOpen] = useState(false);
  const [outletOpen, setOutletOpen] = useState(false);
  const [luxeOpen, setLuxeOpen] = useState(false);

  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50 && !isFilterBarPresent) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isFilterBarPresent]);

  const handleClick = (menu) => {
    const route = menu
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[éèê]/g, "e")
      .replace("ô", "o")
      .replace("ç", "c");
    router.push(`/store/${route}`);
  };

  const handleMouseEnter = (menu) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    switch (menu) {
      case "Nouveautés":
        setSubmenuOpen(true);
        break;
      case "PETITS PRIX":
        setPetitPrixOpen(true);
        break;
      case "Femme":
        setFemmeOpen(true);
        break;
      case "Garçon":
        setGarconOpen(true);
        break;
      case "Marques":
        setMarquesOpen(true);
        break;
      case "Outlet":
        setOutletOpen(true);
        break;
      case "| Luxe":
        setLuxeOpen(true);
        break;
      default:
        break;
    }
  };

  const handleMouseLeave = (menu) => {
    switch (menu) {
      case "Nouveautés":
        setSubmenuOpen(false);
        break;
      case "PETITS PRIX":
        setPetitPrixOpen(false);
        break;
      case "Femme":
        setFemmeOpen(false);
        break;
      case "Garçon":
        setGarconOpen(false);
        break;
      case "Marques":
        setMarquesOpen(false);
        break;
      case "Outlet":
        setOutletOpen(false);
        break;
      case "| Luxe":
        setLuxeOpen(false);
        break;
      default:
        break;
    }
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <>
      <header className="border-b border-gray-300 font-mono">
        {!isScrolled && (
          <>
            <TopNav onMenuClick={toggleMobileMenu} isMobileMenuOpen={isMobileMenuOpen} />
            <div className="mt-5 flex flex-col items-center">
              <nav className="hidden md:flex gap-12">
                {[
                  "Nouveautés",
                  "PETITS PRIX",
                  "Femme",
                  "Garçon",                 
                  "Marques",
                  "Outlet",
                  "| Luxe",
                ].map((item) => (
                  <div key={item} className="relative group">
                    <h4
                      className={`cursor-pointer font-mono pb-1 text-xs lg:text-sm ${
                        (item === "Nouveautés" && submenuOpen) ||
                        (item === "PETITS PRIX" && petitPrixOpen) ||
                        (item === "Femme" && femmeOpen) ||
                        (item === "Garçon" && garconOpen) ||
                        (item === "Bébé" && bebeOpen) ||
                        (item === "Marques" && marquesOpen) ||
                        (item === "Outlet" && outletOpen) ||
                        (item === "| Luxe" && luxeOpen)
                          ? "border-b-2 border-black"
                          : ""
                      }`}
                      onMouseEnter={() => handleMouseEnter(item)}
                      onMouseLeave={() => handleMouseLeave(item)}
                      onClick={() => handleClick(item)}
                    >
                      {item}
                    </h4>
                    {["PETITS PRIX"].includes(item) && (
                      <span className="whitespace-nowrap absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition">
                       2-16 ans
                      </span>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </>
        )}

        {isScrolled && !isFilterBarPresent && (
          <div className="sticky-nav ">
            <div className="pt-5  flex items-center justify-between bg-white shadow-sm">
               <Link href="/">
                  <Image src="/mgm1.svg" alt="MGM Logo" width={66} height={40} priority className="h-12 w-28 pb-5  mr-36 pl-5 cursor-pointer" />
                </Link>
              <nav className="flex gap-9 pb-4">
               

                {[
                  "Nouveautés",
                  "PETITS PRIX",
                  "Femme",
                  "Garçon",
                  "Marques",
                  "Outlet",
                  "| Luxe",
                ].map((item) => (
                  <div key={item} className="relative group">
                    <h4
                      className={`cursor-pointer pb-1 text-sm ${
                        (item === "Nouveautés" && submenuOpen) ||
                        (item === "PETITS PRIX" && petitPrixOpen) ||
                        (item === "Femme" && femmeOpen) ||
                        (item === "Garçon" && garconOpen) ||
                        (item === "Bébé" && bebeOpen) ||
                        (item === "Marques" && marquesOpen) ||
                        (item === "Outlet" && outletOpen) ||
                        (item === "| Luxe" && luxeOpen)
                          ? "border-b-2 border-black"
                          : ""
                      }`}
                      onMouseEnter={() => handleMouseEnter(item)}
                      onMouseLeave={() => handleMouseLeave(item)}
                      onClick={() => handleClick(item)}
                    >
                      {item}
                    </h4>
                    {["PETITS PRIX"].includes(item) && (
                      <span className="whitespace-nowrap absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition">
                        2-16 ans
                      </span>
                    )}
                  </div>
                ))}
              </nav>

              <div className="flex items-end gap-2 px-9 mb-2">
                <IconsComponents />
              </div>
            </div>
          </div>
        )}


        <SubmenusComponents
          submenuOpen={submenuOpen}
          petitPrixOpen={petitPrixOpen}
          femmeOpen={femmeOpen}
          garconOpen={garconOpen}        
          marquesOpen={marquesOpen}
          outletOpen={outletOpen}
          luxeOpen={luxeOpen}
          handleMouseEnter={handleMouseEnter}
          handleMouseLeave={handleMouseLeave}
          isScrolled={isScrolled}
        />
      </header>
    </>
  );
}
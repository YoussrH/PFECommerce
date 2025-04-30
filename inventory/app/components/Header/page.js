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
  const [filleOpen, setFilleOpen] = useState(false);
  const [garconOpen, setGarconOpen] = useState(false);
  const [bebeOpen, setBebeOpen] = useState(false);
  const [chaussuresOpen, setChaussuresOpen] = useState(false);
  const [marquesOpen, setMarquesOpen] = useState(false);
  const [tendancesOpen, setTendancesOpen] = useState(false);
  const [outletOpen, setOutletOpen] = useState(false);
  const [secondeMainOpen, setSecondeMainOpen] = useState(false);
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
      case "Fille":
        setFilleOpen(true);
        break;
      case "Garçon":
        setGarconOpen(true);
        break;
      case "Bébé":
        setBebeOpen(true);
        break;
      case "Chaussures":
        setChaussuresOpen(true);
        break;
      case "Marques":
        setMarquesOpen(true);
        break;
      case "Tendances":
        setTendancesOpen(true);
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
      case "Fille":
        setFilleOpen(false);
        break;
      case "Garçon":
        setGarconOpen(false);
        break;
      case "Bébé":
        setBebeOpen(false);
        break;
      case "Chaussures":
        setChaussuresOpen(false);
        break;
      case "Marques":
        setMarquesOpen(false);
        break;
      case "Tendances":
        setTendancesOpen(false);
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
            <div className="mt-10 flex flex-col items-center">
              <nav className="hidden md:flex gap-6">
                {[
                  "Nouveautés",
                  "PETITS PRIX",
                  "Fille",
                  "Garçon",
                  "Bébé",
                  "Chaussures",
                  "Marques",
                  "Tendances",
                  "Outlet",
                  "SECONDE MAIN",
                  "| Luxe",
                ].map((item) => (
                  <div key={item} className="relative group">
                    <h6
                      className={`cursor-pointer font-mono pb-1 text-xs lg:text-sm ${
                        (item === "Nouveautés" && submenuOpen) ||
                        (item === "PETITS PRIX" && petitPrixOpen) ||
                        (item === "Fille" && filleOpen) ||
                        (item === "Garçon" && garconOpen) ||
                        (item === "Bébé" && bebeOpen) ||
                        (item === "Chaussures" && chaussuresOpen) ||
                        (item === "Marques" && marquesOpen) ||
                        (item === "Tendances" && tendancesOpen) ||
                        (item === "Outlet" && outletOpen) ||
                        (item === "SECONDE MAIN" && secondeMainOpen) ||
                        (item === "| Luxe" && luxeOpen)
                          ? "border-b-2 border-black"
                          : ""
                      }`}
                      onMouseEnter={() => handleMouseEnter(item)}
                      onMouseLeave={() => handleMouseLeave(item)}
                      onClick={() => handleClick(item)}
                    >
                      {item}
                    </h6>
                    {["Fille", "Garçon", "Bébé"].includes(item) && (
                      <span className="whitespace-nowrap absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition">
                        {item === "Bébé" ? "1-36 mois" : "2-16 ans"}
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
              <nav className="flex gap-6">
                <Link href="/">
                  <Image src="/mgm1.svg" alt="MGM Logo" width={66} height={36}   style={{ width: 'auto', height: 'auto' }}
  priority className="h-9 pb-4  mr-36 pl-5 cursor-pointer" />
                </Link>

                {[
                  "Nouveautés",
                  "PETITS PRIX",
                  "Fille",
                  "Garçon",
                  "Bébé",
                  "Chaussures",
                  "Marques",
                  "Tendances",
                  "Outlet",
                  "SECONDE MAIN",
                  "| Luxe",
                ].map((item) => (
                  <div key={item} className="relative group">
                    <h5
                      className={`cursor-pointer pb-1 text-sm ${
                        (item === "Nouveautés" && submenuOpen) ||
                        (item === "PETITS PRIX" && petitPrixOpen) ||
                        (item === "Fille" && filleOpen) ||
                        (item === "Garçon" && garconOpen) ||
                        (item === "Bébé" && bebeOpen) ||
                        (item === "Chaussures" && chaussuresOpen) ||
                        (item === "Marques" && marquesOpen) ||
                        (item === "Tendances" && tendancesOpen) ||
                        (item === "Outlet" && outletOpen) ||
                        (item === "SECONDE MAIN" && secondeMainOpen) ||
                        (item === "| Luxe" && luxeOpen)
                          ? "border-b-2 border-black"
                          : ""
                      }`}
                      onMouseEnter={() => handleMouseEnter(item)}
                      onMouseLeave={() => handleMouseLeave(item)}
                      onClick={() => handleClick(item)}
                    >
                      {item}
                    </h5>
                    {["Fille", "Garçon", "Bébé"].includes(item) && (
                      <span className="whitespace-nowrap absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition">
                        {item === "Bébé" ? "1-36 mois" : "2-16 ans"}
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

        {isMobileMenuOpen && (
          <nav className="md:hidden flex flex-col gap-3 p-2 w-[288px] bg-white border-t text-xs border-gray-300 fixed top-20 left-0 h-screen z-50 overflow-x-hidden overflow-y-auto">
            {[
              "Nouveautés",
              "PETITS PRIX",
              "Fille",
              "Garçon",
              "Bébé",
              "Chaussures",
              "Marques",
              "Tendances",
              "Outlet",
              "SECONDE MAIN",
              "Luxe",
            ].map((item) => (
              <div key={item} className="relative group border-b border-gray-200 pb-2">
                <h5
                  className={`cursor-pointer pb-1 flex items-center justify-between text-xs sm:text-base`}
                  onClick={() => handleClick(item)}
                >
                  {item}
                  <CiCirclePlus className="text-gray-500" />
                </h5>
              </div>
            ))}
          </nav>
        )}

        <SubmenusComponents
          submenuOpen={submenuOpen}
          petitPrixOpen={petitPrixOpen}
          filleOpen={filleOpen}
          garconOpen={garconOpen}
          bebeOpen={bebeOpen}
          chaussuresOpen={chaussuresOpen}
          marquesOpen={marquesOpen}
          tendancesOpen={tendancesOpen}
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
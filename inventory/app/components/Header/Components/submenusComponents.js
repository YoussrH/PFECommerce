"use client";
import React from "react";
import SubmenuNouveautes from "../Submenu/SubmenuNouveautes";
import SubmenuPetitPrix from "../Submenu/SubmenuPetitPrix";
import SubmenuFille from "../Submenu/SubmenuFille";
import SubmenuGarçon from "../Submenu/SubmenuGarçon";
import SubmenuBebe from "../Submenu/SubmenuBebe";
import SubmenuChaussures from "../Submenu/SubmenuChaussures";
import SubmenuMarque from "../Submenu/SubmenuMarque";
import SubmenuOutlet from "../Submenu/SubmenuOutlet";
import SubmenuTendance from "../Submenu/SubmenuTendances";

export default function SubmenusComponents({
  submenuOpen,
  petitPrixOpen,
  filleOpen,
  garconOpen,
  bebeOpen,
  chaussuresOpen,
  marquesOpen,
  tendancesOpen,
  outletOpen,
  luxeOpen,
  handleMouseEnter,
  handleMouseLeave,
  isScrolled,
}) {
  return (
    <>
      <SubmenuNouveautes
        isOpen={submenuOpen}
        onMouseEnter={() => handleMouseEnter("Nouveautés")}
        onMouseLeave={() => handleMouseLeave("Nouveautés")}
        isScrolled={isScrolled}
      />
      <SubmenuPetitPrix
        isOpen={petitPrixOpen}
        onMouseEnter={() => handleMouseEnter("PETITS PRIX")}
        onMouseLeave={() => handleMouseLeave("PETITS PRIX")}
        isScrolled={isScrolled}
      />
      <SubmenuFille
        isOpen={filleOpen}
        onMouseEnter={() => handleMouseEnter("Fille")}
        onMouseLeave={() => handleMouseLeave("Fille")}
        isScrolled={isScrolled}
      />
      <SubmenuGarçon
        isOpen={garconOpen}
        onMouseEnter={() => handleMouseEnter("Garçon")}
        onMouseLeave={() => handleMouseLeave("Garçon")}
        isScrolled={isScrolled}
      />
      <SubmenuBebe
        isOpen={bebeOpen}
        onMouseEnter={() => handleMouseEnter("Bébé")}
        onMouseLeave={() => handleMouseLeave("Bébé")}
        isScrolled={isScrolled}
      />
      <SubmenuChaussures
        isOpen={chaussuresOpen}
        onMouseEnter={() => handleMouseEnter("Chaussures")}
        onMouseLeave={() => handleMouseLeave("Chaussures")}
        isScrolled={isScrolled}
      />
      <SubmenuMarque
        isOpen={marquesOpen}
        onMouseEnter={() => handleMouseEnter("Marques")}
        onMouseLeave={() => handleMouseLeave("Marques")}
        isScrolled={isScrolled}
      />
      <SubmenuTendance
        isOpen={tendancesOpen}
        onMouseEnter={() => handleMouseEnter("Tendances")}
        onMouseLeave={() => handleMouseLeave("Tendances")}
        isScrolled={isScrolled}
      />
      <SubmenuOutlet
        isOpen={outletOpen}
        onMouseEnter={() => handleMouseEnter("Outlet")}
        onMouseLeave={() => handleMouseLeave("Outlet")}
        isScrolled={isScrolled}
      />
    </>
  );
}
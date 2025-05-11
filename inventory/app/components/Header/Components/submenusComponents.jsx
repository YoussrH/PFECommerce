"use client";
import React from "react";
import SubmenuNouveautes from "../Submenu/SubmenuNouveautes";
import SubmenuPetitPrix from "../Submenu/SubmenuPetitPrix";
import SubmenuFemme from "../Submenu/SubmenuFemme";
import SubmenuGarçon from "../Submenu/SubmenuGarçon";
import SubmenuMarque from "../Submenu/SubmenuMarque";
import SubmenuOutlet from "../Submenu/SubmenuOutlet";
import SubmenuTendance from "../Submenu/SubmenuTendances";
import SubmenuLuxe from "../Submenu/SubmenuLuxe";

export default function SubmenusComponents({
  activeSubmenu,
  setActiveSubmenu,
  handleMouseEnter,
  handleMouseLeave,
  isScrolled,
}) {
  return (
    <div 
      className={`${activeSubmenu ? 'block' : 'hidden'} ${isScrolled ? 'mt-16' : ''}`}
      onMouseEnter={() => handleMouseEnter(activeSubmenu)}
      onMouseLeave={() => handleMouseLeave(activeSubmenu)}
    >
      <div className="bg-white shadow-lg border-t border-gray-200">
        {activeSubmenu === "Nouveautés" && (
          <SubmenuNouveautes 
            isOpen={true}
            onMouseEnter={() => handleMouseEnter("Nouveautés")}
            onMouseLeave={() => handleMouseLeave("Nouveautés")}
          />
        )}
        
        {activeSubmenu === "PETITS PRIX" && (
          <SubmenuPetitPrix 
            isOpen={true}
            onMouseEnter={() => handleMouseEnter("PETITS PRIX")}
            onMouseLeave={() => handleMouseLeave("PETITS PRIX")}
          />
        )}
        
        {activeSubmenu === "Femme" && (
          <SubmenuFemme 
            isOpen={true}
            onMouseEnter={() => handleMouseEnter("Femme")}
            onMouseLeave={() => handleMouseLeave("Femme")}
          />
        )}
        
        {activeSubmenu === "Garçon" && (
          <SubmenuGarçon 
            isOpen={true}
            onMouseEnter={() => handleMouseEnter("Garçon")}
            onMouseLeave={() => handleMouseLeave("Garçon")}
          />
        )}

        
        {activeSubmenu === "Marques" && (
          <SubmenuMarque 
            isOpen={true}
            onMouseEnter={() => handleMouseEnter("Marques")}
            onMouseLeave={() => handleMouseLeave("Marques")}
          />
        )}
        

        
        {activeSubmenu === "Outlet" && (
          <SubmenuOutlet 
            isOpen={true}
            onMouseEnter={() => handleMouseEnter("Outlet")}
            onMouseLeave={() => handleMouseLeave("Outlet")}
          />
        )}
        
        {activeSubmenu === "| Luxe" && (
          <SubmenuLuxe 
            isOpen={true}
            onMouseEnter={() => handleMouseEnter("| Luxe")}
            onMouseLeave={() => handleMouseLeave("| Luxe")}
          />
        )}
      </div>
    </div>
  );
}
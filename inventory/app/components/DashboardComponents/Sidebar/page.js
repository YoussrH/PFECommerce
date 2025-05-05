"use client";
import { Archive, CircleDollarSign, Clipboard, Layout, SlidersHorizontal, User } from "lucide-react";
import { TiArrowForwardOutline } from "react-icons/ti";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { TbReport } from "react-icons/tb";
import { TbShoppingCart } from "react-icons/tb";
import { HiOutlineShoppingCart } from "react-icons/hi";
import { FaBox, FaTruck, FaFileInvoice, FaReceipt, FaMoneyBillWave, FaUndo, FaStickyNote } from "react-icons/fa";
import { FaUserGroup } from "react-icons/fa6";
import { FaBoxes, FaLayerGroup, FaBalanceScale, FaTags, FaWarehouse, FaCubes } from "react-icons/fa";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";

const SidebarLink = ({ href, icon: Icon, label, isCollapsed, hasSubmenu, submenuItems }) => {
  const pathname = usePathname();
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const isActive = pathname === href;
  const isSubmenuActive = submenuItems?.some((item) => pathname.startsWith(item.href));

  const handleLinkClick = (e) => {
    if (hasSubmenu) {
      e.preventDefault();
      setDropdownOpen(!isDropdownOpen);
    }
  };

  return (
    <div>
      <Link href={href} passHref>
        <div
          onClick={handleLinkClick} 
          className={`cursor-pointer flex items-center rounded-md text-black justify-between ${
            isCollapsed ? "justify-center py-3 mx-3 my-1" : "justify-start px-8 py-4 mx-2"
          } hover:bg-gray-100 gap-3 transition-colors ${
            (isActive && !isSubmenuActive) || (isSubmenuActive && !hasSubmenu)
              ? "bg-blue-50"
              : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <Icon
              className={`w-4 h-4 ${
                isCollapsed ? "justify-center ml-3" : "ml-5"
              } ${
                isActive || isSubmenuActive ? "text-blue-500" : "text-gray-700"
              }`}
            />
            {!isCollapsed && (
              <span
                className={`font-medium ${
                  isActive || isSubmenuActive ? "text-blue-500" : "text-gray-700"
                }`}
              >
                {label}
              </span>
            )}
          </div>

          {!isCollapsed && hasSubmenu && (
            <div className="cursor-pointer">
              <MdOutlineKeyboardArrowDown
                className={`w-4 h-4 ${
                  isActive || isSubmenuActive ? "text-blue-500" : "text-gray-500"
                } transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          )}
        </div>
      </Link>

      {!isCollapsed && hasSubmenu && isDropdownOpen && (
        <div className="pl-5">
          {submenuItems.map((item, index) => (
            <SidebarLink
              key={index}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isCollapsed={isCollapsed}
              hasSubmenu={item.hasSubmenu}
              submenuItems={item.submenuItems}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar = ({ isSidebarCollapsed }) => {
  const sidebarClassNames = ` font-mono bg-white fixed flex flex-col ${
    isSidebarCollapsed
      ? "w-0 sm:w-16 md:w-16 lg:w-16"
      : "w-72 sm:w-64 md:w-64 lg:w-72"
  } bg-white transition-all duration-300 overflow-y-auto h-full shadow-md z-40 scrollbar-transparent`;

  const dashboardSubmenuItems = [
    { href: "/admin", icon: Layout, label: "Vue d’ensemble" },
    { href: "/admin/reports", icon: TbReport, label: "Rapports & Analyses" },
  ];

  const inventorySubmenuItems = [
    { href: "/admin/inventaire/produits", icon: FaBoxes, label: "Liste des produits" },
    { href: "/admin/inventaire/produits/nouveau", icon: FaCubes, label: "Ajouter un produit" },
    { href: "/admin/inventaire/categories", icon: FaTags, label: "Gérer les catégories" },
    { href: "/admin/inventaire/marque", icon: FaWarehouse, label: "Gérer les Marques" },
    { href: "/admin/inventaire/ajustments", icon: FaBalanceScale, label: "Ajouter un ajustement" },
    { href: "/admin/inventaire/ajustments/historique", icon: FaLayerGroup, label: "Historique des ajustements" },
  ];

  const salesSubmenuItems = [
    { href: "/admin/ventes/commandes", icon: HiOutlineShoppingCart, label: "Liste des commandes" },
    { href: "/admin/ventes/factures", icon: FaFileInvoice, label: "Factures" },
    { href: "/admin/ventes/paiments", icon: FaMoneyBillWave, label: "Reçus de paiement" },
    { href: "/admin/ventes/notes-credit", icon: FaStickyNote, label: "Notes de crédit" },
    {
      href: "/admin/ventes/remise",
      icon: FaTags,
      label: "Réductions & Promotions",
      hasSubmenu: true,
      submenuItems: [
        { href: "/admin/ventes/remise", icon: FaTags, label: "Liste des réductions" },
        { href: "/admin/ventes/remsie/cree", icon: FaTags, label: "Créer une réduction" },
        { href: "/admin/ventes/remise/appliquer", icon: FaTags, label: "Appliquer une réduction" },
      ],
    },
    { href: "/admin/ventes/retours", icon: FaUndo, label: "Retours & Remboursements" },
  ];



  const shippingSubmenuItems = [
    { href: "/admin/expeditions/expeditions", icon: FaTruck, label: "Suivi des expéditions" },
    { href: "/admin/expeditions/colis", icon: FaBox, label: "Gestion des colis" },
    { href: "/admin/expeditions/retours", icon: FaUndo, label: "Retours & Remplacements" },
  ];

  const usersSubmenuItems = [
    { href: "/admin/utilisateurs/clients", icon: FaUserGroup, label: "Liste des clients" },
    { href: "/admin/utilisateurs/livreur",  icon: () => (
      <Image
        src="/delivery-man.png"
        alt="Livreur Icon"
        width={20}
        height={20}
      />
    ), label: "Liste des livreurs" },
    { href: "/admin/utilisateurs/personnel", icon: User, label: "Administrateurs" },
  ];

  const settingsSubmenuItems = [
    { href: "/admin/parametres", icon: SlidersHorizontal, label: "Paramètres de la Boutique" },
    { href: "/admin/parametres/Regles", icon: CircleDollarSign, label: "Règles fiscales & Tarification" },
    { href: "/admin/parametres/rapports", icon: TbReport, label: "Rapports d’Entreprise" },
    { href: "/admin/parametres/journaux", icon: Archive, label: "Journaux d’Activité" },
  ];

  return (
    <div className={sidebarClassNames}>
      <div
        className={`flex gap-3 justify-center md:justify-start items-center  ${
          isSidebarCollapsed ? "px-2 pt-3" : "px-8 pt-4"
        }`}
      >
        <Image src="/mgm1.svg" alt="MGM-logo" width={27} height={27} className="w-11" />
        {!isSidebarCollapsed && <h1 className="font-bold font-mono text-xl">NEGOCE</h1>}
      </div>

      <div className="flex-grow mt-8 font-mono text-sm">
        <SidebarLink
          href="/admin"
          icon={Layout}
          label="Tableau de Bord"
          isCollapsed={isSidebarCollapsed}
          hasSubmenu={true}
          submenuItems={dashboardSubmenuItems}
        />
        <SidebarLink
          href="/admin/inventaire"
          icon={Archive}
          label="Gestion des Stocks"
          isCollapsed={isSidebarCollapsed}
          hasSubmenu={true}
          submenuItems={inventorySubmenuItems}
        />
        <SidebarLink
          href="/admin/ventes"
          icon={TbShoppingCart}
          label="Ventes & Commandes"
          isCollapsed={isSidebarCollapsed}
          hasSubmenu={true}
          submenuItems={salesSubmenuItems}
        />
        <SidebarLink
          href="/admin/expeditions"
          icon={FaTruck}
          label="Expédition & Logistique"
          isCollapsed={isSidebarCollapsed}
          hasSubmenu={true}
          submenuItems={shippingSubmenuItems}
        />
        <SidebarLink
          href="/admin/utilisateurs"
          icon={User}
          label="Utilisateurs"
          isCollapsed={isSidebarCollapsed}
          hasSubmenu={true}
          submenuItems={usersSubmenuItems}
        />
        <SidebarLink
          href="/admin/parametres"
          icon={SlidersHorizontal}
          label="Paramètres & Rapports"
          isCollapsed={isSidebarCollapsed}
          hasSubmenu={true}
          submenuItems={settingsSubmenuItems}
        />
      </div>

      {!isSidebarCollapsed && (
        <div className="mb-10">
          <p className="text-center text-sm font-mono  text-gray-500">&copy; 2025 MGM NEGOCE Sarl</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
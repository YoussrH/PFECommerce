"use client";
import { 
  LayoutDashboard, PieChart, Boxes, Box, Tags, Warehouse, 
  Scale, Layers, ShoppingCart, FileText, Receipt, CreditCard, 
  Truck, Undo2, Users, UserCog, Mail, Archive, Settings, DollarSign 
} from "lucide-react";
import { TbTruckDelivery } from "react-icons/tb";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { cn } from "@/lib/utils";

const SidebarLink = ({ 
  href, 
  icon: Icon, 
  label, 
  isSidebarCollapsed, 
  isSubItem = false, 
  iconColor = "text-gray-500",
  customIcon
}) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href} passHref>
      <div
        className={cn(
          "flex items-center rounded-md transition-all duration-200 group",
          "hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 hover:shadow-xs",
          "hover:border-l-4 hover:border-orange-400 hover:pl-3",
          isActive 
            ? "bg-gradient-to-r from-orange-50 to-orange-100 border-l-4 border-orange-500 pl-3 font-medium text-orange-700"
            : "text-gray-600",
          isSidebarCollapsed 
            ? "justify-center p-4 mx-1 my-1" 
            : "justify-start p-3 mx-2",
          isSubItem && !isSidebarCollapsed && "ml-8"
        )}
      >
        {customIcon ? (
          <div className={cn(
            "transition-transform group-hover:scale-110",
            isSidebarCollapsed ? "m-96" : "mr-3",
            isActive ? "text-gray-600" : iconColor
          )}>
            {customIcon}
          </div>
        ) : (
          <Icon className={cn(
            "transition-transform group-hover:scale-110",
            isSidebarCollapsed ? "w-7 h-7 mx-auto" : "w-5 h-5 mr-3",
            isActive ? "text-orange-800" : iconColor
          )} />
        )}
        {!isSidebarCollapsed && <span className="text-sm">{label}</span>}
      </div>
    </Link>
  );
};

const SidebarSection = ({ title, icon: Icon, isSidebarCollapsed, children }) => {
  return (
    <div className="mb-4">
      {!isSidebarCollapsed && (
        <div className="flex items-center px-4 py-2 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
          {Icon && <Icon className="w-6 h-8 mr-2 text-gray-500" />}
          <span className="text-gray-600">{title}</span>
        </div>
      )}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
};

const Sidebar = ({ isSidebarCollapsed }) => {
  const sidebarClassNames = cn(
    "font-mono fixed flex flex-col top-1 h-full shadow-sm",
    isSidebarCollapsed ? "w-20 rounded-none" : "w-64", 
    "transition-all duration-300 overflow-y-auto h-full z-40",
 );

  return (
    <div className={sidebarClassNames}>
      <div className={cn(
        "flex items-center border-b rounded-t-3xl border-gray-200 bg-gradient-to-r from-orange-50 to-white",
        isSidebarCollapsed ? "rounded-t-2xl justify-center p-4" : "justify-start px-6 py-4"
      )}>
        <Image 
          src="/mgm1.svg" 
          alt="MGM-logo" 
          width={36} 
          height={36} 
          className={cn(
            "transition-all duration-300",
            isSidebarCollapsed ? "w-9 h-9" : "w-8 h-8"
          )}
        />
        {!isSidebarCollapsed && (
          <h1 className="ml-3 font-bold text-xl bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
            NEGOCE
          </h1>
        )}
      </div>

      <div className="flex-grow p-2 overflow-y-auto bg-white rounded-lg">
        {/* Dashboard Section */}
        <SidebarSection title="Tableau de Bord" icon={LayoutDashboard} isSidebarCollapsed={isSidebarCollapsed}>
          <SidebarLink
            href="/admin"
            icon={LayoutDashboard}
            label="Vue d'ensemble"
            isSidebarCollapsed={isSidebarCollapsed}
            iconColor="text-gray-500"
          />
          <SidebarLink
  href="/admin/reports"
  icon={PieChart}
  label="Rapports & Analyses"
  isSidebarCollapsed={isSidebarCollapsed}
  disabled
/>

        </SidebarSection>

        {/* Inventory Section */}
        <SidebarSection title="Gestion des Stocks" icon={Boxes} isSidebarCollapsed={isSidebarCollapsed}>
          <SidebarLink
            href="/admin/inventaire/produits"
            icon={Box}
            label="Liste des produits"
            isSidebarCollapsed={isSidebarCollapsed}
          />
          <SidebarLink
            href="/admin/inventaire/produits/nouveau"
            icon={Boxes}
            label="Ajouter un produit"
            isSidebarCollapsed={isSidebarCollapsed}
          />
          <SidebarLink
            href="/admin/inventaire/categories"
            icon={Tags}
            label="Gérer les catégories"
            isSidebarCollapsed={isSidebarCollapsed}
          />
          <SidebarLink
            href="/admin/inventaire/marque"
            icon={Warehouse}
            label="Gérer les Marques"
            isSidebarCollapsed={isSidebarCollapsed}
          />
          <SidebarLink
            href="/admin/inventaire/ajustments"
            icon={Scale}
            label="Ajouter un ajustement"
            isSidebarCollapsed={isSidebarCollapsed}
          />
          <SidebarLink
            href="/admin/inventaire/ajustments/historique"
            icon={Layers}
            label="Historique des ajustements"
            isSidebarCollapsed={isSidebarCollapsed}
          />
        </SidebarSection>

        {/* Sales Section */}
        <SidebarSection title="Ventes & Commandes" icon={ShoppingCart} isSidebarCollapsed={isSidebarCollapsed}>
          <SidebarLink
            href="/admin/ventes/commandes"
            icon={ShoppingCart}
            label="Liste des commandes"
            isSidebarCollapsed={isSidebarCollapsed}
          />
          <SidebarLink
            href="/admin/ventes/factures"
            icon={FileText}
            label="Factures"
            isSidebarCollapsed={isSidebarCollapsed}
          />
          <SidebarLink
            href="/admin/ventes/paiments"
            icon={CreditCard}
            label="Reçus de paiement"
            isSidebarCollapsed={isSidebarCollapsed}
          />
          <SidebarLink
            href="/admin/ventes/notes-credit"
            icon={Receipt}
            label="Notes de crédit"
            isSidebarCollapsed={isSidebarCollapsed}
          />
          <SidebarLink
            href="/admin/ventes/remise"
            icon={Tags}
            label="Liste des réductions"
            isSidebarCollapsed={isSidebarCollapsed}
          />
          <SidebarLink
            href="/admin/ventes/remise/nouveau"
            icon={Tags}
            label="Créer une réduction"
            isSidebarCollapsed={isSidebarCollapsed}
            isSubItem
          />
        </SidebarSection>

        {/* Shipping Section */}
        <SidebarSection title="Expédition & Logistique" icon={Truck} isSidebarCollapsed={isSidebarCollapsed}>
          <SidebarLink
            href="/admin/expeditions/expeditions"
            icon={Truck}
            label="Suivi des expéditions"
            isSidebarCollapsed={isSidebarCollapsed}
          />
          <SidebarLink
            href="/admin/expeditions/colis"
            icon={Box}
            label="Gestion des colis"
            isSidebarCollapsed={isSidebarCollapsed}
          />
          <SidebarLink
            href="/admin/expeditions/retours"
            icon={Undo2}
            label="Retours & Remplacements"
            isSidebarCollapsed={isSidebarCollapsed}
          />
        </SidebarSection>

        {/* Users Section */}
        <SidebarSection title="Utilisateurs" icon={Users} isSidebarCollapsed={isSidebarCollapsed}>
          <SidebarLink
            href="/admin/utilisateurs/clients"
            icon={Users}
            label="Liste des clients"
            isSidebarCollapsed={isSidebarCollapsed}
          />
          <SidebarLink
            href="/admin/utilisateurs/livreur"
            icon={TbTruckDelivery}
            label="Liste des livreurs"
            isSidebarCollapsed={isSidebarCollapsed}
          />
          <SidebarLink
            href="/admin/utilisateurs/personnel"
            icon={UserCog}
            label="Administrateurs"
            isSidebarCollapsed={isSidebarCollapsed}
          />
        </SidebarSection>

        {/* Claims Section */}
        <SidebarSection title="Réclamations" icon={Mail} isSidebarCollapsed={isSidebarCollapsed}>
          <SidebarLink
            href="/admin/reclamations/inbox"
            icon={Mail}
            label="Boîte de réception"
            isSidebarCollapsed={isSidebarCollapsed}
          />
          <SidebarLink
            href="/admin/reclamations/traitees"
            icon={FileText}
            label="Traitées"
            isSidebarCollapsed={isSidebarCollapsed}
          />
          <SidebarLink
            href="/admin/reclamations/brouillon"
            icon={Undo2}
            label="En brouillon"
            isSidebarCollapsed={isSidebarCollapsed}
          />
          <SidebarLink
            href="/admin/reclamations/archivees"
            icon={Archive}
            label="Archivées"
            isSidebarCollapsed={isSidebarCollapsed}
          />
        </SidebarSection>

        {/* Updated Settings Section */}
        <SidebarSection title="Paramètres" icon={Settings} isSidebarCollapsed={isSidebarCollapsed}>
          <SidebarLink
            href="/admin/parametres/informations-personnelles"
            icon={UserCog}
            label="Informations Personnelles"
            isSidebarCollapsed={isSidebarCollapsed}
          />
        </SidebarSection>
      </div>

      {!isSidebarCollapsed && (
        <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <p className="text-center text-xs text-gray-500">© 2025 MGM NEGOCE Sarl</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
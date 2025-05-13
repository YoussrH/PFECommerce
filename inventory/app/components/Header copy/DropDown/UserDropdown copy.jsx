"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from '@/app/contexts/AuthContext';
import AuthModal from "../../Auth/AuthModal";
import Image from "next/image";
import { toast } from "sonner";

// In UserDropdown.js
const UserDropdown = ({
  isAuthenticated,
  userPrenom,
  isOpen,
  onMouseEnter,
  onMouseLeave,
  onClick,
  
  
  onAuthModalOpen
}) => {
  const { user, logout } = useAuth(); // Get user and logout from AuthContext
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);


  const handleUserIconClick = () => {
    if (user) {
      setIsUserDropdownOpen((prev) => !prev);
      router.push("/client");
    } else {
      onAuthModalOpen(); // Use the function from parent
    }
  };

  const handleLogout = async () => {
    try {
      setIsUserDropdownOpen(false); // Close dropdown immediately
      await logout();
      // Don't need router.push here as logout handles it
    } catch (error) {
      console.error("Logout error:", error);
      toast.error(error.message || "Erreur lors de la déconnexion");
    }
  };

  return (
    <div
      className="relative pt-1"
      ref={dropdownRef}
      onMouseEnter={() => {
        setIsUserDropdownOpen(true);
        if (onMouseEnter) onMouseEnter("user");
      }}
      onMouseLeave={() => {
        setIsUserDropdownOpen(false);
        if (onMouseLeave) onMouseLeave();
      }}
    >
      <Image
        src={pathname.startsWith("/client") ? "/userselected.svg" : "/user.svg"}
        alt="user"
        width={30}
        height={30}
        className="cursor-pointer"
        onClick={handleUserIconClick}
      />

      {isUserDropdownOpen && user && (
        <div className="absolute right-0 mt-1 w-48 z-50 bg-white border border-gray-300 rounded-md shadow-md">
        <div className="px-4 py-2 text-xs">
          <p className="font-semibold">Bonjour {userPrenom}</p>
        </div>
        <hr className="border-t border-gray-300" />
        <button
          onClick={() => {
            router.push("/client/compte/commande?section=commande");
            setIsUserDropdownOpen(false);
          }}
          className="block w-full text-left px-4 py-2 text-xs font-mono hover:bg-gray-100"
        >
          Mes commandes
        </button>
        <button
          onClick={() => {
            router.push("/client/compte/edit?section=profile");
            setIsUserDropdownOpen(false);
          }}
          className="block w-full text-left px-4 py-2 text-xs hover:bg-gray-100"
        >
          Mes infos personnelles
        </button>
        <button
          onClick={() => {
            router.push("/client/listenvie?section=wishlist");
            setIsUserDropdownOpen(false);
          }}
          className="block w-full text-left px-4 py-2 text-xs hover:bg-gray-100"
        >
          Ma liste d&apos;envies
        </button>
        <button
          onClick={handleLogout}
          className="block w-full text-left px-4 py-2 text-xs hover:bg-gray-100"
        >
          Se déconnecter
        </button>
      </div>
      )}

      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={() => {
            setIsAuthModalOpen(false);
            window.dispatchEvent(new Event('authChange'));
          }}
        />
      )}
    </div>
  );
};

export default UserDropdown;
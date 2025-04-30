"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { CiMenuKebab, CiCircleRemove } from "react-icons/ci";
import AuthModal from "../Auth/AuthModal";
import { useRouter } from "next/navigation";
import CartDropdown from "./DropDown/CartDropdown";
import UserDropdown from "./DropDown/UserDropdown";
import WishlistDropdown from "./DropDown/WishlistDropdown";
import { SearchIcon } from "lucide-react";
import SearchComponent from "./Components/SearchComponent";
import { toast } from "sonner";
import { useAuth } from '@/app/contexts/AuthContext';
import axios from "axios";
import PanierDropdown from "./DropDown/CartDropdown";


export default function TopNav({ onMenuClick, isMobileMenuOpen }) {
  const router = useRouter();
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { user, isAuthenticated } = useAuth();

  const fetchUserData = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/auth/utilisateur", {
        withCredentials: true,
      });
    } catch (error) {
      if (error.response?.status === 401) {
        // Auth context will handle unauthorized state
      } else if (error.response?.status === 500 && retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        await fetchUserData(retryCount + 1);
      } else {
        toast.error("Échec du chargement de la session utilisateur");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
    
    const handleAuthChange = () => {
      fetchUserData();
      window.dispatchEvent(new Event('cartUpdated'));
    };
    
    window.addEventListener('authChange', handleAuthChange);
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, [fetchUserData]);

  const handleAuthSuccess = () => {
    window.dispatchEvent(new Event('authChange'));
    setIsAuthModalOpen(false);
    toast.success("Connexion réussie");
  };

  const toggleDropdown = () => setIsOpen(!isOpen);


  const handleDropdownHover = (dropdownName) => {
    setActiveDropdown(dropdownName);
  };

  const handleIconClick = (path) => {
    setActiveDropdown(null);
    router.push(path);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?query=${encodeURIComponent(searchQuery)}`);
      setIsSearchVisible(false);
      setSearchQuery("");
    }
  };

  const openAuthModal = () => {
    setIsAuthModalOpen(true);
  };

  const handleSearchIconClick = () => {
    setIsSearchVisible(!isSearchVisible);
  };

  return (
    <section className="relative w-full">
      <SearchComponent
        isSearchVisible={isSearchVisible}
        setIsSearchVisible={setIsSearchVisible}
        onSearch={handleSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <div className="grid grid-cols-3 items-center h-5 pt-2 px-2 sm:px-5 md:px-8">
        <div className="flex items-center gap-3">
          <Image src="/phone.svg" width={25} height={20} alt="phone" className="w-6 h-6 sm:w-7 sm:h-7" />
          <Link href="/contacts" className="hidden md:inline text-sm">
            Service Client
          </Link>
        </div>

        <div className="flex-grow overflow-hidden text-center w-full">
          <div className="whitespace-nowrap text-sm text-gray-500 hidden md:flex animate-marquee-desktop">
            <span className="mx-5">Petits prix : -50% sur une sélection d&apos;articles à prix rond !*</span>
            <span className="mx-5">Livraison offerte à partir de 150 DT d&apos;achat</span>
          </div>

          <div className="whitespace-nowrap text-sm flex md:hidden overflow-hidden relative">
            <div className="animate-fade">
              <span className="mx-5">Livraison offerte à partir de 150 DT d&apos;achat</span>
            </div>
            <div className="animate-fade">
              <span className="mx-5">Petits prix : -50% sur une sélection d&apos;articles à prix rond !*</span>
            </div>
          </div>
        </div>

        <div className="hidden md:flex justify-end text-sm">
          <Link href="#">Nos Boutique</Link>
        </div>
      </div>

      <div className="hidden md:grid grid-cols-3 items-center px-8 mt-2 py-3">
        <div className="relative">
          <div className="flex gap-2 items-center cursor-pointer p-2 rounded-md" >
           
          </div>

        </div>

        <div className="flex justify-center">
          <Link href="/">
            <Image src="/mgm1.svg" alt="Logo" width={80} height={90}
  priority className="cursor-pointer" />
          </Link>
        </div>

        <div className="hidden md:flex justify-end gap-1">
          <Image
            src="/search.svg"
            alt="search"
            width={30}
            height={30}
            className="cursor-pointer"
            onClick={handleSearchIconClick}
          />
          <WishlistDropdown
            isAuthenticated={isAuthenticated}
            userPrenom={user?.prenom}
            isOpen={activeDropdown === "wishlist"}
            onMouseEnter={() => handleDropdownHover("wishlist")}
            onMouseLeave={() => setActiveDropdown(null)}
            onClick={() => {
              const wishlistSection = document.getElementById("wishlist-section");
              if (wishlistSection) {
                wishlistSection.scrollIntoView({ behavior: "smooth" });
              }
            }}
          />
         <PanierDropdown
            isAuthenticated={isAuthenticated}
            userPrenom={user?.prenom}  // Make sure this is the correct property from your user object
            isOpen={activeDropdown === "cart"}
            onMouseEnter={() => handleDropdownHover("cart")}
            onMouseLeave={() => setActiveDropdown(null)}
            onClick={() => handleIconClick("/caisse/panier")}
          />
          <UserDropdown
            isAuthenticated={isAuthenticated}
            userPrenom={user?.prenom}
            isOpen={activeDropdown === "user"}
            onMouseEnter={() => handleDropdownHover("user")}
            onMouseLeave={() => setActiveDropdown(null)}
            onClick={() => handleIconClick("/client")}
            onAuthModalOpen={openAuthModal}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 md:hidden items-center max-w-80 py-2 px-2 mt-5 relative">
        <button className="absolute left-0 p-2" onClick={onMenuClick}>
          {isMobileMenuOpen ? (
            <CiCircleRemove className="cursor-pointer w-7 h-7" />
          ) : (
            <CiMenuKebab className="cursor-pointer w-7 h-7" />
          )}
        </button>

        <div className="flex justify-center">
          <Link href="/">
            <Image src="/mgm1.svg" alt="Logo" width={60} height={16} className="cursor-pointer ml-5" />
          </Link>
        </div>

        <div className="absolute right-7 flex items-center gap-1 pr-2">
          <Image
            src="/search.svg"
            alt="search"
            width={25}
            height={20}
            className="cursor-pointer"
            onClick={handleSearchIconClick}
          />
          <Image
            src="/wishlist.svg"
            alt="wishlist"
            width={25}
            height={20}
            className="cursor-pointer"
            onClick={() => handleIconClick("/account?section=wishlist")}
          />
          <Image
            src="/cart1.svg"
            alt="cart"
            width={25}
            height={20}
            className="cursor-pointer"
            onClick={() => handleIconClick("/caisse/panier")}
          />
          <Image
            src="/user.svg"
            alt="user"
            width={25}
            height={20}
            className="cursor-pointer"
            onClick={() => handleIconClick("/client")}
          />
        </div>
      </div>

      {!isAuthenticated && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}
    </section>
  );
}
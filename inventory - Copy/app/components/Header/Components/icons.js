"use client";
import React, { useState, useEffect } from "react";
import CartDropdown from '../DropDown/CartDropdown';
import UserDropdown from '../DropDown/UserDropdown';
import WishlistDropdown from '../DropDown/WishlistDropdown';
import Image from 'next/image';
import axios from "axios";
import { useRouter } from "next/navigation";

export default function IconsComponents() {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [userPrenom, setUserPrenom] = useState("");
  const router = useRouter();
    useEffect(() => {
        const fetchUserData = async () => {
          try {
            const response = await axios.get("http://localhost:5000/auth/utilisateur", {
              withCredentials: true,
            });
            if (response.data.user) {
              setUserPrenom(response.data.user.prenom);
              setIsAuthenticated(true);
            }
          } catch (error) {
            if (error.response?.status === 401) {
              setIsAuthenticated(false);
              setUserPrenom("");
            } else {
              console.error("Failed to fetch user data:", error);
            }
          }
        };
    
        fetchUserData();
      }, []);
  
      const openAuthModal = () => {
        setIsAuthModalOpen(true);
      };
    const handleDropdownHover = (dropdownName) => {
        setActiveDropdown(dropdownName);
      };
    
      const handleIconClick = (path) => {
        setActiveDropdown(null);
        router.push(path);
      };

  return (
      <div className="hidden md:flex justify-end gap-1 -mt-3">
                              <Image
                                src="/search.svg"
                                alt="search"
                                width={30}
                                height={30}
                                className="cursor-pointer"
                                onClick={() => handleIconClick("/search")}
                              />
                              <WishlistDropdown
                                isAuthenticated={isAuthenticated}
                                userPrenom={userPrenom}
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
                              <CartDropdown
                                isAuthenticated={isAuthenticated}
                                userPrenom={userPrenom}
                                isOpen={activeDropdown === "cart"}
                                onMouseEnter={() => handleDropdownHover("cart")}
                                onMouseLeave={() => setActiveDropdown(null)}
                                onClick={() => handleIconClick("/checkout/cart")}
                              />
                              <UserDropdown
                                isAuthenticated={isAuthenticated}
                                userPrenom={userPrenom}
                                isOpen={activeDropdown === "user"}
                                onMouseEnter={() => handleDropdownHover("user")}
                                onMouseLeave={() => setActiveDropdown(null)}
                                onClick={() => handleIconClick("/Customer")}
                                setIsAuthenticated={setIsAuthenticated}
                                onAuthModalOpen={openAuthModal}
                              />
                            </div>
  )
}

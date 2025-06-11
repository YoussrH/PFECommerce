"use client";
import React from "react";
import PanierDropdown from '../DropDown/CartDropdown';
import UserDropdown from '../DropDown/UserDropdown';
import WishlistDropdown from '../DropDown/WishlistDropdown';
import Image from 'next/image'; // Assuming Image is used for search icon in desktop header
import { useRouter } from "next/navigation";
import { useAuth } from '@/app/contexts/AuthContext'; // Import useAuth to get user and isAuthenticated

export default function IconsComponents({ handleSearchIconClick, openAuthModal }) {
  const { user, isAuthenticated } = useAuth(); // Get user and isAuthenticated from context
  const router = useRouter();

  // These handlers are now simplified as dropdowns manage their own open/close internally
  // The Header component will only pass down the necessary props like isAuthenticated and userPrenom.

  return (
    <div className="hidden md:flex justify-end gap-1 -mt-3">
      {/* Search Icon - remains in Header for click handling */}
      {/* <Image
        src="/search.svg"
        alt="search"
        width={30}
        height={30}
        className="cursor-pointer"
        onClick={handleSearchIconClick} // Passed from Header
      /> */}

      <WishlistDropdown
        isAuthenticated={isAuthenticated}
        userPrenom={user?.prenom}
      />
      <PanierDropdown
        isAuthenticated={isAuthenticated}
        userPrenom={user?.prenom}
      />
      <UserDropdown
        isAuthenticated={isAuthenticated}
        userPrenom={user?.prenom}
        onAuthModalOpen={openAuthModal} // Passed from Header
      />
    </div>
  );
}
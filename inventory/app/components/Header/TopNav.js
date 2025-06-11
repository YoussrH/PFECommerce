"use client"
import { useState, useEffect,useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { toast } from "sonner"
import { useAuth } from "@/app/contexts/AuthContext"
import axios from "axios"
import SearchComponent from "./Components/SearchComponent"
import WishlistDropdown from "./DropDown/WishlistDropdown"
import PanierDropdown from "./DropDown/CartDropdown"
import UserDropdown from "./DropDown/UserDropdown"
import AuthModal from "../Auth/AuthModal"

export default function TopNav({ onMenuClick, isMobileMenuOpen }) {
  const router = useRouter()
  const dropdownRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [isSearchVisible, setIsSearchVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)

  const { user, isAuthenticated } = useAuth()

  const fetchUserData = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true)
      const response = await axios.get("http://localhost:5000/auth/utilisateur", {
        withCredentials: true,
      })
    } catch (error) {
      if (error.response?.status === 401) {
        // Auth context will handle unauthorized state
      } else if (error.response?.status === 500 && retryCount < 3) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)))
        await fetchUserData(retryCount + 1)
      } else {
        toast.error("Échec du chargement de la session utilisateur")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUserData()

    const handleAuthChange = () => {
      fetchUserData()
      window.dispatchEvent(new Event("cartUpdated"))
    }

    window.addEventListener("authChange", handleAuthChange)
    return () => {
      window.removeEventListener("authChange", handleAuthChange)
    }
  }, [fetchUserData])

  const handleAuthSuccess = () => {
    window.dispatchEvent(new Event("authChange"))
    setIsAuthModalOpen(false)
    toast.success("Connexion réussie")
  }

  const handleDropdownHover = (dropdownName) => {
    setActiveDropdown(dropdownName)
  }

  const handleIconClick = (path) => {
    setActiveDropdown(null)
    router.push(path)
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?query=${encodeURIComponent(searchQuery)}`)
      setIsSearchVisible(false)
      setSearchQuery("")
    }
  }

  const openAuthModal = () => {
    setIsAuthModalOpen(true)
  }

  const handleSearchIconClick = () => {
    setIsSearchVisible(!isSearchVisible)
  }

  return (
    <section className="relative w-full">
      <SearchComponent
        isSearchVisible={isSearchVisible}
        setIsSearchVisible={setIsSearchVisible}
        onSearch={handleSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Top banner */}
      <div className="px-2 sm:px-4 md:px-8 py-2">
        <div className="flex items-center justify-between">
          {/* Left section */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Image src="/phone.svg" width={20} height={20} alt="phone" className="w-4 h-4 sm:w-6 sm:h-6" />
            <Link href="/contacts" className="hidden sm:inline text-xs sm:text-sm">
              Service Client
            </Link>
          </div>

          {/* Center section - Marquee text */}
          <div className="flex-1 mx-2 sm:mx-4 overflow-hidden">
            {/* Desktop marquee */}
            <div className="hidden md:block">
              <div className="whitespace-nowrap text-sm text-gray-500 animate-marquee-desktop">
                <span className="mx-5">Petits prix : -50% sur une sélection d&apos;articles à prix rond !*</span>
                <span className="mx-5">Livraison offerte à partir de 150 DT d&apos;achat</span>
              </div>
            </div>

            {/* Mobile marquee */}
            <div className="md:hidden">
              <div className="whitespace-nowrap text-xs sm:text-sm text-gray-500 animate-fade">
                <span>Livraison offerte à partir de 150 DT</span>
              </div>
            </div>
          </div>

          {/* Right section - empty for balance */}
          <div className="w-4 sm:w-6"></div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="px-2 sm:px-4 md:px-8">
        {/* Desktop layout */}
        <div className="hidden md:grid md:grid-cols-3 items-center py-3">
          <div className="relative">{/* Left section can be used for additional content */}</div>

          <div className="flex justify-center">
            <Link href="/">
              <Image src="/mgm1.svg" alt="Logo" width={80} height={90} priority className="cursor-pointer" />
            </Link>
          </div>

          <div className="flex justify-end gap-1">
            <button
              onClick={handleSearchIconClick}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Search"
            >
              <Image src="/search.svg" alt="search" width={30} height={30} />
            </button>

            <WishlistDropdown
              isAuthenticated={isAuthenticated}
              userPrenom={user?.prenom}
              isOpen={activeDropdown === "wishlist"}
              onMouseEnter={() => handleDropdownHover("wishlist")}
              onMouseLeave={() => setActiveDropdown(null)}
            />

            <PanierDropdown
              isAuthenticated={isAuthenticated}
              userPrenom={user?.prenom}
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

        {/* Mobile layout */}
        <div className="md:hidden hidden">
          {/* We're hiding this section since we're moving the icons to the main header */}
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
  )
}


"use client"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import TopNav from "./TopNav"
import { useRouter } from "next/navigation"
import { Menu, X } from "lucide-react"
import IconsComponents from "./Components/icons"

export default function Header({ isFilterBarPresent }) {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // State for submenus
  const [submenuOpen, setSubmenuOpen] = useState(false)
  const [petitPrixOpen, setPetitPrixOpen] = useState(false)
  const [femmeOpen, setFemmeOpen] = useState(false)
  const [hommeOpen, setHommeOpen] = useState(false)
  const [marquesOpen, setMarquesOpen] = useState(false)
  const [outletOpen, setOutletOpen] = useState(false)
  const [luxeOpen, setLuxeOpen] = useState(false)

  const timeoutRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50 && !isFilterBarPresent) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [isFilterBarPresent])

  const handleClick = (menu) => {
    if (menu === "Acceuil") {
      router.push("/")
      setIsMobileMenuOpen(false)
      return
    }
    const route = menu.toLowerCase().replace(/\s+/g, "-").replace(/[éèê]/g, "e").replace("ô", "o").replace("ç", "c")
    router.push(`/store/${route}`)
    setIsMobileMenuOpen(false)
  }

  const handleMouseEnter = (menu) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    switch (menu) {
      case "Nouveautés":
        setSubmenuOpen(true)
        break
      case "PETITS PRIX":
        setPetitPrixOpen(true)
        break
      case "Femme":
        setFemmeOpen(true)
        break
      case "Homme":
        setHommeOpen(true)
        break
      case "Marques":
        setMarquesOpen(true)
        break
      case "Outlet":
        setOutletOpen(true)
        break
      case "| Luxe":
        setLuxeOpen(true)
        break
      default:
        break
    }
  }

  const handleMouseLeave = (menu) => {
    switch (menu) {
      case "Nouveautés":
        setSubmenuOpen(false)
        break
      case "PETITS PRIX":
        setPetitPrixOpen(false)
        break
      case "Femme":
        setFemmeOpen(false)
        break
      case "Homme":
        setHommeOpen(false)
        break
      case "Marques":
        setMarquesOpen(false)
        break
      case "Outlet":
        setOutletOpen(false)
        break
      case "| Luxe":
        setLuxeOpen(false)
        break
      default:
        break
    }
  }

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)

  const menuItems = ["Acceuil", "Nouveautés", "PETITS PRIX", "Femme", "Homme", "Marques", "Outlet", "| Luxe"]

  return (
    <>
      <header className="border-b border-gray-300 font-mono relative">
        {!isScrolled && (
          <>
            <TopNav onMenuClick={toggleMobileMenu} isMobileMenuOpen={isMobileMenuOpen} />

            {/* Mobile Menu Button - Only visible on mobile */}
            <div className="md:hidden flex justify-between items-center px-4 py-3">
              <button
                onClick={toggleMobileMenu}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>

              <Link href="/" className="flex-shrink-0">
                <Image src="/mgm1.svg" alt="MGM Logo" width={60} height={36} priority className="cursor-pointer" />
              </Link>

              <div className="flex items-center gap-1">
                <IconsComponents isMobile={true} />
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex flex-col items-center mt-5">
              <nav className="flex gap-6 lg:gap-12 flex-wrap justify-center">
                {menuItems.map((item) => (
                  <div key={item} className="relative group">
                    <h4
                      className={`cursor-pointer font-mono pb-1 text-xs lg:text-sm whitespace-nowrap ${
                        item === "Acceuil" ||
                        (item === "Nouveautés" && submenuOpen) ||
                        (item === "PETITS PRIX" && petitPrixOpen) ||
                        (item === "Femme" && femmeOpen) ||
                        (item === "Homme" && hommeOpen) ||
                        (item === "Marques" && marquesOpen) ||
                        (item === "Outlet" && outletOpen) ||
                        (item === "| Luxe" && luxeOpen)
                          ? "border-b-2 border-black"
                          : ""
                      }`}
                      onMouseEnter={() => handleMouseEnter(item)}
                      onMouseLeave={() => handleMouseLeave(item)}
                      onClick={() => handleClick(item)}
                    >
                      {item}
                    </h4>
                    {["PETITS PRIX"].includes(item) && (
                      <span className="whitespace-nowrap absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition">
                        2-16 ans
                      </span>
                    )}
                  </div>
                ))}
              </nav>
            </div>

            {/* Mobile Navigation Menu */}
            {isMobileMenuOpen && (
              <div className="md:hidden bg-white border-t border-gray-300 absolute top-full left-0 right-0 z-50 shadow-lg">
                <nav className="py-4">
                  {menuItems.map((item) => (
                    <button
                      key={item}
                      onClick={() => handleClick(item)}
                      className="block w-full text-left px-6 py-3 text-sm font-mono hover:bg-gray-50 transition-colors"
                    >
                      {item}
                      {item === "PETITS PRIX" && <span className="text-xs text-gray-400 ml-2">(2-16 ans)</span>}
                    </button>
                  ))}
                </nav>
              </div>
            )}
          </>
        )}

        {/* Sticky Navigation when scrolled */}
        {isScrolled && !isFilterBarPresent && (
          <div className="sticky-nav bg-white shadow-sm">
            <div className="flex items-center justify-between px-4 py-3">
              {/* Mobile layout when scrolled */}
              <div className="md:hidden flex items-center justify-between w-full">
                <button
                  onClick={toggleMobileMenu}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                  aria-label="Toggle mobile menu"
                >
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>

                <Link href="/">
                  <Image src="/mgm1.svg" alt="MGM Logo" width={50} height={30} priority className="cursor-pointer" />
                </Link>

                <div className="flex items-center">
                  <IconsComponents />
                </div>
              </div>

              {/* Desktop layout when scrolled */}
              <div className="hidden md:flex items-center justify-between w-full">
                <Link href="/">
                  <Image
                    src="/mgm1.svg"
                    alt="MGM Logo"
                    width={66}
                    height={40}
                    priority
                    className="h-10 w-24 cursor-pointer"
                  />
                </Link>

                <nav className="flex gap-4 lg:gap-9">
                  {menuItems.map((item) => (
                    <div key={item} className="relative group">
                      <h4
                        className={`cursor-pointer pb-1 text-sm whitespace-nowrap ${
                          item === "Acceuil" ||
                          (item === "Nouveautés" && submenuOpen) ||
                          (item === "PETITS PRIX" && petitPrixOpen) ||
                          (item === "Femme" && femmeOpen) ||
                          (item === "Homme" && hommeOpen) ||
                          (item === "Marques" && marquesOpen) ||
                          (item === "Outlet" && outletOpen) ||
                          (item === "| Luxe" && luxeOpen)
                            ? "border-b-2 border-black"
                            : ""
                        }`}
                        onMouseEnter={() => handleMouseEnter(item)}
                        onMouseLeave={() => handleMouseLeave(item)}
                        onClick={() => handleClick(item)}
                      >
                        {item}
                      </h4>
                      {["PETITS PRIX"].includes(item) && (
                        <span className="whitespace-nowrap absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition">
                          2-16 ans
                        </span>
                      )}
                    </div>
                  ))}
                </nav>

                <div className="flex items-center">
                  <IconsComponents />
                </div>
              </div>
            </div>

            {/* Mobile menu when scrolled */}
            {isMobileMenuOpen && (
              <div className="md:hidden bg-white border-t border-gray-300">
                <nav className="py-2">
                  {menuItems.map((item) => (
                    <button
                      key={item}
                      onClick={() => handleClick(item)}
                      className="block w-full text-left px-6 py-2 text-sm font-mono hover:bg-gray-50 transition-colors"
                    >
                      {item}
                      {item === "PETITS PRIX" && <span className="text-xs text-gray-400 ml-2">(2-16 ans)</span>}
                    </button>
                  ))}
                </nav>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  )
}



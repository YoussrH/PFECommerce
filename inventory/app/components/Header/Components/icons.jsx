"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/app/contexts/AuthContext"

export default function IconsComponents({ isMobile = false }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()

  // States for tracking clicks and active dropdowns
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [clickCount, setClickCount] = useState(0)
  const [lastClickTime, setLastClickTime] = useState(0)
  const [longPressTimer, setLongPressTimer] = useState(null)

  // Click handler with double-click detection
  const handleIconClick = (dropdownName, path) => {
    const currentTime = new Date().getTime()
    const timeSinceLastClick = currentTime - lastClickTime

    // Reset click count if it's been too long since last click
    if (timeSinceLastClick > 300) {
      setClickCount(1)
    } else {
      setClickCount(clickCount + 1)
    }

    setLastClickTime(currentTime)

    // Double click - navigate to path
    if (clickCount === 1 && timeSinceLastClick < 300) {
      setActiveDropdown(null)
      router.push(path)
      setClickCount(0)
    }
    // Single click - toggle dropdown
    else {
      setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName)
    }
  }

  // Handle long press (hold)
  const handleTouchStart = (dropdownName) => {
    const timer = setTimeout(() => {
      setActiveDropdown(dropdownName)
    }, 500) // 500ms hold to open dropdown

    setLongPressTimer(timer)
  }

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null)
    }

    if (activeDropdown) {
      document.addEventListener("click", handleClickOutside)
    }

    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [activeDropdown])

  return (
    <div className={`flex items-center ${isMobile ? "gap-1" : "gap-1 sm:gap-2"}`}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleIconClick("search", "/search")
        }}
        onTouchStart={() => handleTouchStart("search")}
        onTouchEnd={handleTouchEnd}
        className="p-1 hover:bg-gray-100 rounded-md transition-colors"
        aria-label="Search"
      >
        <Image
          src="/search.svg"
          alt="search"
          width={isMobile ? 22 : 24}
          height={isMobile ? 22 : 24}
          className="sm:w-7 sm:h-7"
        />
      </button>

      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleIconClick("wishlist", "/client/listenvie")
          }}
          onTouchStart={() => handleTouchStart("wishlist")}
          onTouchEnd={handleTouchEnd}
          className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="Wishlist"
        >
          <Image
            src={pathname === "/client/listenvie" ? "/wishlistselected.svg" : "/wishlist.svg"}
            alt="wishlist"
            width={isMobile ? 22 : 24}
            height={isMobile ? 22 : 24}
            className="sm:w-7 sm:h-7"
          />
        </button>

        {activeDropdown === "wishlist" && isMobile && (
          <div className="absolute right-0 mt-1 w-64 z-50 bg-white border border-gray-300 rounded-md shadow-md">
            <div className="p-3 text-xs">
              <p className="font-semibold">Ma liste d'envies</p>
              <div className="mt-2">
                <button
                  onClick={() => {
                    router.push("/client/listenvie")
                    setActiveDropdown(null)
                  }}
                  className="w-full mt-2 py-2 bg-black text-white text-xs rounded-sm"
                >
                  Voir ma liste d'envies
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleIconClick("cart", "/caisse/panier")
          }}
          onTouchStart={() => handleTouchStart("cart")}
          onTouchEnd={handleTouchEnd}
          className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="Cart"
        >
          <Image
            src={pathname === "/caisse/panier" ? "/cart1.svg" : "/cartnotselected.svg"}
            alt="cart"
            width={isMobile ? 22 : 24}
            height={isMobile ? 22 : 24}
            className="sm:w-7 sm:h-7"
          />
        </button>

        {activeDropdown === "cart" && isMobile && (
          <div className="absolute right-0 mt-1 w-64 z-50 bg-white border border-gray-300 rounded-md shadow-md">
            <div className="p-3 text-xs">
              <p className="font-semibold">Mon panier</p>
              <div className="mt-2">
                <button
                  onClick={() => {
                    router.push("/caisse/panier")
                    setActiveDropdown(null)
                  }}
                  className="w-full mt-2 py-2 bg-black text-white text-xs rounded-sm"
                >
                  Voir mon panier
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleIconClick("user", "/client")
          }}
          onTouchStart={() => handleTouchStart("user")}
          onTouchEnd={handleTouchEnd}
          className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="User account"
        >
          <Image
            src={pathname.startsWith("/client") ? "/userselected.svg" : "/user.svg"}
            alt="user"
            width={isMobile ? 22 : 24}
            height={isMobile ? 22 : 24}
            className="sm:w-7 sm:h-7"
          />
        </button>

        {activeDropdown === "user" && isMobile && (
          <div className="absolute right-0 mt-1 w-64 z-50 bg-white border border-gray-300 rounded-md shadow-md">
            <div className="p-3 text-xs">
              <p className="font-semibold">Mon compte</p>
              <div className="mt-2">
                <button
                  onClick={() => {
                    router.push("/client")
                    setActiveDropdown(null)
                  }}
                  className="w-full mt-2 py-2 bg-black text-white text-xs rounded-sm"
                >
                  Accéder à mon compte
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

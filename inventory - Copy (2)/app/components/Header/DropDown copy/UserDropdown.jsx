"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { User, LogOut, Settings, ShoppingBag, Heart, ChevronRight } from "lucide-react"
import { useAuth } from "@/app/contexts/AuthContext"

export default function UserDropdown({ isOpen, onMouseEnter, onMouseLeave, onClick, onAuthModalOpen }) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const dropdownRef = useRef(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  const handleUserIconClick = useCallback(() => {
    if (user) {
      router.push("/client")
    } else {
      onAuthModalOpen()
    }
  }, [user, router, onAuthModalOpen])

  const handleLogout = useCallback(async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }, [logout])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onMouseLeave()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onMouseLeave])

  return (
    <div className="relative" ref={dropdownRef} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <button
        className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${
          pathname.startsWith("/client") ? "bg-gray-100" : ""
        }`}
        onClick={handleUserIconClick}
        aria-label="User account"
      >
        <User className="w-5 h-5 text-gray-700" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
          {user ? (
            <>
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                    {user.prenom?.charAt(0) || "U"}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">
                      {user.prenom} {user.nom}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="py-2">
                <button
                  onClick={() => {
                    router.push("/client/compte/commande?section=commande")
                    onMouseLeave()
                  }}
                  className="w-full text-left px-4 py-2 text-sm flex items-center hover:bg-gray-50"
                >
                  <ShoppingBag className="w-4 h-4 mr-3 text-gray-500" />
                  Mes commandes
                  <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
                </button>

                <button
                  onClick={() => {
                    router.push("/client/compte/edit?section=profile")
                    onMouseLeave()
                  }}
                  className="w-full text-left px-4 py-2 text-sm flex items-center hover:bg-gray-50"
                >
                  <Settings className="w-4 h-4 mr-3 text-gray-500" />
                  Mes infos personnelles
                  <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
                </button>

                <button
                  onClick={() => {
                    router.push("/client/listenvie?section=wishlist")
                    onMouseLeave()
                  }}
                  className="w-full text-left px-4 py-2 text-sm flex items-center hover:bg-gray-50"
                >
                  <Heart className="w-4 h-4 mr-3 text-gray-500" />
                  Ma liste d&apos;envies
                  <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
                </button>
              </div>

              <div className="border-t border-gray-100 p-4">
                <button
                  onClick={handleLogout}
                  className="w-full text-left text-sm flex items-center text-red-600 hover:text-red-700"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Se déconnecter
                </button>
              </div>
            </>
          ) : (
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">Connectez-vous pour accéder à votre compte</p>
              <div className="space-y-2">
                <button
                  onClick={onAuthModalOpen}
                  className="w-full py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800"
                >
                  Connexion
                </button>
                <button
                  onClick={onAuthModalOpen}
                  className="w-full py-2 border border-black text-black rounded-md text-sm font-medium hover:bg-gray-50"
                >
                  Inscription
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

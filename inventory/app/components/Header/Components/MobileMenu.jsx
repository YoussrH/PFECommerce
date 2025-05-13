"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronDown, ChevronRight, X } from "lucide-react"
import { useAuth } from "@/app/contexts/AuthContext"

export default function MobileMenu({ isOpen, menuItems, activeSubmenu, onMenuClick, onClose }) {
  const { user, isAuthenticated, logout } = useAuth()
  const [expandedSubmenu, setExpandedSubmenu] = useState(null)

  // Reset expanded submenu when mobile menu closes
  useEffect(() => {
    if (!isOpen) {
      setExpandedSubmenu(null)
    }
  }, [isOpen])

  const handleLogout = async () => {
    try {
      await logout()
      onClose()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="fixed inset-y-0 left-0 w-full max-w-sm bg-white shadow-xl flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-medium">Menu</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <nav className="py-2">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.name} className="border-b border-gray-100 last:border-0">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      if (item.hasSubmenu) {
                        setExpandedSubmenu(expandedSubmenu === item.name ? null : item.name)
                      } else {
                        onMenuClick(item.name, item.path)
                      }
                    }}
                  >
                    <span className="text-base font-medium">{item.name}</span>
                    {item.hasSubmenu && (
                      <ChevronDown
                        className={`w-5 h-5 transition-transform ${expandedSubmenu === item.name ? "rotate-180" : ""}`}
                      />
                    )}
                  </div>

                  {/* Submenu items */}
                  {item.hasSubmenu && expandedSubmenu === item.name && (
                    <div className="bg-gray-50 py-2 px-4">
                      <ul className="space-y-2">
                        {/* These would be dynamically loaded based on the submenu */}
                        {["Nouveautés", "Collections", "Catégories", "Marques"].map((subitem) => (
                          <li key={subitem}>
                            <Link
                              href={`/${item.path.split("/")[1]}/${subitem.toLowerCase()}`}
                              className="flex items-center py-2 text-sm text-gray-700 hover:text-black"
                              onClick={onClose}
                            >
                              <ChevronRight className="w-4 h-4 mr-2" />
                              <span>{subitem}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* User section */}
        <div className="border-t border-gray-200 p-4">
          {isAuthenticated ? (
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                  {user?.prenom?.charAt(0) || "U"}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">
                    {user?.prenom} {user?.nom}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/client"
                  className="text-center py-2 px-4 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
                  onClick={onClose}
                >
                  Mon compte
                </Link>
                <button
                  onClick={handleLogout}
                  className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
                >
                  Déconnexion
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-2">Connectez-vous pour accéder à votre compte</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onClose()
                    // Open auth modal
                  }}
                  className="py-2 px-4 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800"
                >
                  Connexion
                </button>
                <button
                  onClick={() => {
                    onClose()
                    // Open auth modal with register tab
                  }}
                  className="py-2 px-4 border border-black text-black rounded-md text-sm font-medium hover:bg-gray-50"
                >
                  Inscription
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from '@/app/contexts/AuthContext';
import Image from "next/image";
import { toast } from "sonner";

const AdminDropdown = ({ isOpen, onMouseEnter, onMouseLeave, onClick }) => {
  const { user, logout, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAdminIconClick = () => {
    if (user) {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  const handleLogout = async () => {
    try {
      setIsDropdownOpen(false);
      await logout();
      router.push("/admin/authentification");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error(error.message || "Logout failed");
    }
  };

  if (!isAdmin) return null;

  return (
    <div
      className="relative p-2 "
      ref={dropdownRef}
      onMouseEnter={() => {
        setIsDropdownOpen(true);
        if (onMouseEnter) onMouseEnter("admin");
      }}
      onMouseLeave={() => {
        setIsDropdownOpen(false);
        if (onMouseLeave) onMouseLeave();
      }}
    >
      <div className="flex items-center gap-2 cursor-pointer " onClick={handleAdminIconClick}>
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-blue-600 font-medium text-sm">
            {user?.prenom?.charAt(0) || 'A'}
          </span>
        </div>
        <span className="hidden md:inline text-sm font-medium text-gray-700">
          {user?.prenom || 'Admin'}
        </span>
      </div>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-72 z-50 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="px-4 py-2 text-sm border-b border-gray-200">
            <p className="font-medium">Panneau de l&apos;administrateur</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          
          <button
            onClick={() => {
              router.push("/admin");
              setIsDropdownOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
          >
            Tableau de bord
          </button>
          
          <button
            onClick={() => {
              router.push("/admin/users");
              setIsDropdownOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
          >
            Gérer les utilisateurs
          </button>
          
          <button
            onClick={() => {
              router.push("/admin/settings");
              setIsDropdownOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
          >
            Paramètres
          </button>
          
          <div className="border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDropdown;
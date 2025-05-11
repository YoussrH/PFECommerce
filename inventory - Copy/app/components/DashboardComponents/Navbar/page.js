"use client";

import { Bell, Search, Sun } from "lucide-react";
import { TbUserDown } from "react-icons/tb";
import { TbSun, TbMoonStars, TbHome } from "react-icons/tb";
import { RiMenu2Fill } from "react-icons/ri";
import Link from "next/link";
import React, { useState, useEffect,useRef } from "react";
import AdminDropdown from "./AdminDropdown";

const Navbar = ({ isSidebarCollapsed, toggleSidebar }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleMouseEnter = (dropdownName) => {
    setActiveDropdown(dropdownName);
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
  };

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="sticky top-0 z-50 flex justify-between bg-white items-center w-full border-b px-4 py-2">
      <div className="flex items-center gap-3 sm:gap-5">
        <button
          className="p-3 w-10 h-10 border border-gray-100 rounded-md transition-all duration-300"
          onClick={toggleSidebar}
        >
          <RiMenu2Fill className="transition-all duration-300 text-gray-500" />
        </button>

        {!isSidebarCollapsed && (
          <button
            className="sm:hidden p-2 rounded-full hover:bg-gray-200 transition-all duration-300"
            onClick={toggleSidebar}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-500 transform rotate-180 transition-transform duration-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        <div className="relative flex-grow sm:flex-grow-0">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="text-gray-500" size={20} />
          </div>
          <input
            id="search"
            name="search"
            type="text"
            required
            placeholder="Rechercher..."
            autoComplete="off"
            className="w-full sm:w-48 md:w-64 border border-gray-400 font-mono rounded-md bg-white px-3.5 py-2 pl-10 text-sm text-gray-700 placeholder:text-gray-500 focus:ring-0 focus:outline-none focus:border-blue-300 focus:shadow-sm focus:shadow-blue-200"
          />
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-3 sm:gap-5">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-gray-200 transition-all duration-300"
        >
          <div className={`transform transition-transform duration-700 ease-in-out ${isDarkMode ? "rotate-[360deg]" : "rotate-0"}`}>
            {isDarkMode ? (
              <Sun className="text-gray-500" size={24} />
            ) : (
              <TbMoonStars className="text-gray-500" size={24} />
            )}
          </div>
        </button>

        <div className="relative">
          <Bell className="text-gray-500 cursor-pointer" size={24} />
          <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-semibold leading-none text-red-100 bg-red-400 rounded-full">
            3
          </span>
        </div>

        <Link
          href="/"
          className="p-2 rounded-full hover:bg-gray-200 transition-all duration-300"
        >
          <TbHome className="text-gray-500" size={24} />
        </Link>

        <div ref={dropdownRef}>
          <AdminDropdown 
            isOpen={activeDropdown === 'admin'}
            onMouseEnter={() => handleMouseEnter('admin')}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleMouseEnter('admin')}
          />
        </div>
      </div>

      <button
        onClick={toggleMenu}
        className="sm:hidden p-2 rounded-full hover:bg-gray-200 transition-all duration-300"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16m-7 6h7"
          />
        </svg>
      </button>

      {!isSidebarCollapsed && (
        <div
          className="fixed inset-0 sm:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        ></div>
      )}

      {isMenuOpen && (
        <div className="sm:hidden absolute top-16 right-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-48 animate-fadeIn">
          <div className="flex flex-col p-2">
            <div className="flex items-center gap-2 p-2">
              <TbUserDown className="text-gray-500" size={24} />
              <span className="text-sm font-semibold font-sans">Admin</span>
            </div>

            <button
              onClick={toggleDarkMode}
              className="relative flex items-center gap-2 p-2 rounded-full hover:bg-gray-200 transition-all duration-300"
            >
              <div
                className={`transform transition-transform duration-700 ease-in-out ${
                  isDarkMode ? "rotate-[360deg]" : "rotate-0"
                }`}
              >
                {isDarkMode ? (
                  <Sun className="cursor-pointer text-gray-500" size={24} />
                ) : (
                  <TbMoonStars className="cursor-pointer text-gray-500" size={24} />
                )}
              </div>
              <span className="text-sm text-gray-700 inline">
                {isDarkMode ? "Mode Clair" : "Mode Sombre"}
              </span>
            </button>

            <div className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 transition-all duration-300">
              <Bell className="text-gray-500" size={20} />
              <span className="text-sm text-gray-700">Notifications</span>
              <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-semibold leading-none text-red-100 bg-red-400 rounded-full">
                3
              </span>
            </div>

            <Link
              href="/"
              className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 transition-all duration-300"
            >
              <TbHome className="text-gray-500" size={20} />
              <span className="text-sm text-gray-700">Accueil</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
"use client";

import { Bell, Search, Sun } from "lucide-react";
import { TbUserDown } from "react-icons/tb";
import { TbSun, TbMoonStars, TbHome } from "react-icons/tb";
import { RiMenu2Fill } from "react-icons/ri";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import AdminDropdown from "./AdminDropdown";
import { useAdminSocket } from "@/app/contexts/SocketContext";

const Navbar = ({ isSidebarCollapsed, toggleSidebar }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const { notifications, unreadCount, markAsRead } = useAdminSocket();

  useEffect(() => {
    console.log('Navbar: Notifications updated', notifications);
  }, [notifications]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const toggleNotification = () => {
    console.log('Navbar: Toggling notification dropdown', { isNotificationOpen });
    if (isNotificationOpen) {
      markAsRead();
    }
    setIsNotificationOpen(!isNotificationOpen);
  };

  const handleMouseEnter = (dropdownName) => {
    setActiveDropdown(dropdownName);
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Format notification time
  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Navbar: Invalid date format', dateString);
        return 'Inconnu';
      }
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('Navbar: Error formatting time', error);
      return 'Inconnu';
    }
  };

  // Determine notification title and link based on type
  const getNotificationDetails = (notification) => {
    console.log('Navbar: Processing notification details', notification);
    if (notification.sujet) {
      // Reclamation
      return {
        title: `Réclamation: ${notification.sujet}`,
        link: '/admin/reclamations/inbox'
      };
    } else if (notification.reference) {
      // Order
      return {
        title: `Commande: ${notification.reference}`,
        link: '/admin/ventes/commandes'
      };
    } else if (notification.article_id) {
      // Review
      return {
        title: `Avis: ${notification.article_nom || 'Produit inconnu'}`,
        link: `/admin/avis/${notification.id}`
      };
    }
    console.warn('Navbar: Unknown notification type', notification);
    return {
      title: 'Notification',
      link: '/admin'
    };
  };

  return (
    <div
      className={`sticky top-0 z-50 flex justify-between rounded-3xl -pr-9 items-center w-full px-4 py-[11px] transition-all duration-300 ${
        isScrolled ? "bg-white border-b border-gray-100 shadow-sm" : "bg-transparent border-b border-b"
      }`}
    >
      {/* Left side (search and sidebar toggle) */}
      <div className="flex items-center gap-3 sm:gap-5">
        <button
          className="p-3 w-10 h-10 border border-gray-100 bg-white rounded-md transition-all duration-300"
          onClick={toggleSidebar}
        >
          <RiMenu2Fill className="transition-all duration-300 text-orange-900" />
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
            className="w-full sm:w-48 md:w-64 border border-gray-100 font-mono rounded-md bg-white px-3.5 py-2 pl-10 text-sm text-gray-700 placeholder:text-gray-500 focus:ring-0 focus:outline-none focus:border-blue-300 focus:shadow-sm focus:shadow-blue-200"
          />
        </div>
      </div>
      {/* Right side (icons and dropdowns) */}
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

        <div className="relative" ref={notificationRef}>
          <button
            onClick={toggleNotification}
            className="p-2 rounded-full hover:bg-gray-200 transition-all duration-300 relative"
          >
            <Bell className="text-gray-600 cursor-pointer" size={24} />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-semibold leading-none text-red-100 bg-red-400 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {isNotificationOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50 animate-fadeIn">
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications?.length > 0 ? (
                  notifications.map((notification, index) => {
                    const { title, link } = getNotificationDetails(notification);
                    return (
                      <Link href={link} key={index}>
                        <div
                          className="p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-sm font-medium text-gray-800">{title}</h4>
                              <p className="text-xs text-gray-500 mt-1">{notification?.message?.substring(0, 50)}...</p>
                            </div>
                            <span className="text-xs text-gray-400">{formatTime(notification?.created_at)}</span>
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            De: {notification?.prenom || 'N/A'} {notification?.nom || 'N/A'}
                          </div>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                    <div className="p-4 text-center text-sm text-gray-500">
                      Aucune nouvelle notification
                    </div>
                )}
              </div>

              <div className="p-2 border-t border-gray-200 bg-gray-50 text-center">
                <button
                  className="text-xs text-blue-500 hover:text-blue-700"
                  onClick={() => {
                    window.location.href = '/admin/reclamations/inbox';
                  }}
                >
                  Voir tout
                </button>
              </div>
            </div>
          )}
        </div>

        <Link
          href="/"
          className="p-2 rounded-full hover:bg-gray-200 transition-all duration-300"
        >
          <TbHome className="text-gray-600" size={24} />
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

      {/* Mobile menu button */}
      <button
        onClick={toggleMenu}
        className="sm:hidden p-2 rounded-full hover:bg-gray-200 transition-all duration-300"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-600"
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

      {/* Mobile menu dropdown */}
      {isMenuOpen && (
        <div className="sm:hidden absolute top-16 right-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-48 animate-fadeIn">
          <div className="flex flex-col p-2">
            <div className="flex items-center gap-2 p-2">
              <TbUserDown className="text-gray-600" size={24} />
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
                  <Sun className="cursor-pointer text-gray-600" size={24} />
                ) : (
                  <TbMoonStars className="cursor-pointer text-gray-600" size={24} />
                )}
              </div>
              <span className="text-sm text-gray-700 inline">
                {isDarkMode ? "Mode Clair" : "Mode Sombre"}
              </span>
            </button>

            <div
              className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 transition-all duration-300"
              onClick={toggleNotification}
            >
              <Bell className="text-gray-600" size={20} />
              <span className="text-sm text-gray-700">Notifications</span>
              {unreadCount > 0 && (
                <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-semibold leading-none text-red-100 bg-red-400 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>

            <Link
              href="/"
              className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 transition-all duration-300"
            >
              <TbHome className="text-gray-600" size={20} />
              <span className="text-sm text-gray-700">Accueil</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
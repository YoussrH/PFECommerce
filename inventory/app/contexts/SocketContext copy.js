// app/contexts/SocketContext.js
"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Only initialize socket for authenticated users
    if (!user) return;

    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      withCredentials: true,
      autoConnect: true,
    });

    setSocket(socketInstance);

    // For admin users, subscribe to admin notifications
    if (user.role === 'admin' || user.role === 'super_admin') {
      socketInstance.emit('subscribe-admin');
      console.log('SocketProvider: Admin subscribed to notifications');
    }

    // Notification handlers
    const handleNewReclamation = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      if (user.role === 'admin' || user.role === 'super_admin') {
        toast.info(`Nouvelle réclamation de ${notification.prenom} ${notification.nom}`, {
          description: notification.sujet,
          action: {
            label: 'Voir',
            onClick: () => window.location.href = '/admin/reclamations/inbox'
          }
        });
      }
    };

    const handleNewOrder = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      if (user.role === 'admin' || user.role === 'super_admin') {
        toast.info(`Nouvelle commande de ${notification.prenom} ${notification.nom}`, {
          description: `Commande ${notification.reference} - ${notification.prix_total.toFixed(2)} TND`,
          action: {
            label: 'Voir',
            onClick: () => window.location.href = '/admin/ventes/commandes'
          }
        });
      }
    };

    const handleNewReview = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      if (user.role === 'admin' || user.role === 'super_admin') {
        toast.info(`Nouvel avis de ${notification.prenom} ${notification.nom}`, {
          description: `Avis sur ${notification.article_nom} - Note: ${notification.note}/5`,
          action: {
            label: 'Voir',
            onClick: () => window.location.href = `/admin/avis/${notification.article_id}`
          }
        });
      }
    };

    // Add event listeners
    socketInstance.on('new-reclamation', handleNewReclamation);
    socketInstance.on('new-order', handleNewOrder);
    socketInstance.on('new-review', handleNewReview);
    socketInstance.on('connect_error', (error) => {
      console.error('SocketProvider: Connection error', error);
    });

    return () => {
      socketInstance.off('new-reclamation', handleNewReclamation);
      socketInstance.off('new-order', handleNewOrder);
      socketInstance.off('new-review', handleNewReview);
      socketInstance.disconnect();
    };
  }, [user]); // Reconnect when user changes

  const markAsRead = () => {
    setUnreadCount(0);
  };

  return (
    <SocketContext.Provider value={{ 
      socket, 
      notifications, 
      unreadCount, 
      markAsRead 
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
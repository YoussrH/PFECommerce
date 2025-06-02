"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      withCredentials: true,
      autoConnect: true,
    });

    setSocket(socketInstance);

    // Subscribe to admin notifications
    socketInstance.emit('subscribe-admin');
    console.log('SocketProvider: Admin subscribed to notifications');

    // Listen for new reclamation notifications
    socketInstance.on('new-reclamation', (notification) => {
      console.log('SocketProvider: Received new-reclamation', notification);
      setNotifications(prev => {
        const newNotifications = [notification, ...prev];
        console.log('SocketProvider: Updated notifications (reclamation)', newNotifications);
        return newNotifications;
      });
      setUnreadCount(prev => prev + 1);
      
      toast.info(`Nouvelle réclamation de ${notification.prenom} ${notification.nom}`, {
        description: notification.sujet,
        action: {
          label: 'Voir',
          onClick: () => window.location.href = '/admin/reclamations/inbox'
        }
      });
    });

    // Listen for new order notifications
    socketInstance.on('new-order', (notification) => {
      console.log('SocketProvider: Received new-order', notification);
      setNotifications(prev => {
        const newNotifications = [notification, ...prev];
        console.log('SocketProvider: Updated notifications (order)', newNotifications);
        return newNotifications;
      });
      setUnreadCount(prev => prev + 1);
      
      toast.info(`Nouvelle commande de ${notification.prenom} ${notification.nom}`, {
        description: `Commande ${notification.reference} - ${notification.prix_total.toFixed(2)} TND`,
        action: {
          label: 'Voir',
          onClick: () => window.location.href = '/admin/ventes/commandes'
        }
      });
    });

    // Listen for new review notifications
    socketInstance.on('new-review', (notification) => {
      console.log('SocketProvider: Received new-review', notification);
      setNotifications(prev => {
        const newNotifications = [notification, ...prev];
        console.log('SocketProvider: Updated notifications (review)', newNotifications);
        return newNotifications;
      });
      setUnreadCount(prev => prev + 1);
      
      toast.info(`Nouvel avis de ${notification.prenom} ${notification.nom}`, {
        description: `Avis sur ${notification.article_nom} - Note: ${notification.note}/5`,
        action: {
          label: 'Voir',
          onClick: () => window.location.href = `/admin/avis/${notification.article_id}`
        }
      });
    });

    // Log any socket errors
    socketInstance.on('connect_error', (error) => {
      console.error('SocketProvider: Connection error', error);
    });

    // Cleanup on unmount
    return () => {
      console.log('SocketProvider: Disconnecting socket');
      socketInstance.disconnect();
    };
  }, []);

  const markAsRead = () => {
    console.log('SocketProvider: Marking notifications as read');
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
"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

const AdminSocketContext = createContext(null);

export const AdminSocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Admin Socket connected:', socketInstance.id);
      setIsConnected(true);
      socketInstance.emit('subscribe-admin', user.id);
    });

    socketInstance.on('disconnect', () => {
      console.log('Admin Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('subscription-success', (data) => {
      console.log(`Admin subscribed successfully to rooms:`, data.rooms);
    });

    const handleNewReclamation = (notification) => {
      console.log('New reclamation notification:', notification);
      const newNotification = {
        ...notification,
        id: `reclamation-${Date.now()}`,
        type: 'reclamation',
        date: new Date().toISOString(),
        read: false
      };
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      toast.info(`Nouvelle réclamation de ${notification.prenom} ${notification.nom}`, {
        description: notification.sujet,
        action: {
          label: 'Voir',
          onClick: () => window.location.href = '/admin/reclamations/inbox'
        }
      });
    };

    const handleNewReview = (notification) => {
      console.log('New review notification:', notification);
      const newNotification = {
        ...notification,
        id: `review-${Date.now()}`,
        type: 'review',
        date: new Date().toISOString(),
        read: false
      };
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      toast.info(`Nouvel avis de ${notification.prenom} ${notification.nom}`, {
        description: `Avis sur ${notification.article_nom} - Note: ${notification.note}/5`,
        action: {
          label: 'Voir',
          onClick: () => window.location.href = `/admin/avis/${notification.article_id}`
        }
      });
    };

    const handleLivraisonStatusChanged = (notification) => {
      console.log('Livraison status changed:', notification);
      const newNotification = {
        ...notification,
        id: `livraison-${Date.now()}`,
        type: 'livraison-status',
        date: new Date().toISOString(),
        read: false
      };
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    socketInstance.on('new-reclamation', handleNewReclamation);
    socketInstance.on('new-review', handleNewReview);
    socketInstance.on('livraison-status-changed', handleLivraisonStatusChanged);

    socketInstance.on('connect_error', (error) => {
      console.error('Admin SocketProvider: Connection error', error);
      setIsConnected(false);
    });

    return () => {
      console.log('Admin SocketProvider: Cleaning up');
      socketInstance.off('new-reclamation', handleNewReclamation);
      socketInstance.off('new-review', handleNewReview);
      socketInstance.off('livraison-status-changed', handleLivraisonStatusChanged);
      socketInstance.off('connect');
      socketInstance.off('connect_error');
      socketInstance.off('disconnect');
      socketInstance.off('subscription-success');
      socketInstance.disconnect();
    };
  }, [user]);

  const markAsRead = (id) => {
    if (id) {
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } else {
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    }
  };

  return (
    <AdminSocketContext.Provider value={{ 
      socket, 
      notifications, 
      unreadCount, 
      markAsRead,
      isConnected
    }}>
      {children}
    </AdminSocketContext.Provider>
  );
};

export const useAdminSocket = () => {
  const context = useContext(AdminSocketContext);
  if (!context) {
    throw new Error('useAdminSocket must be used within an AdminSocketProvider');
  }
  return context;
};
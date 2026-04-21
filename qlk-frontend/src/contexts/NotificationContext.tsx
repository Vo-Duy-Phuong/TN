import React, { createContext, useContext, useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuth } from './AuthContext';
import { notificationApi, type Notification } from '../api/notifications';

interface NotificationContextType {
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('disconnected');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const [items, summary] = await Promise.all([
        notificationApi.getNotifications(20),
        notificationApi.getSummary()
      ]);
      setNotifications(items);
      setUnreadCount(summary.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      setConnectionStatus('disconnected');
      setIsConnected(false);
      return;
    }

    fetchNotifications();
    setConnectionStatus('connecting');

    const token = localStorage.getItem('token');
    const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5020/api').replace('/api', '');
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${apiBase}/hubs/notifications`, {
        accessTokenFactory: () => token || ""
      })
      .withAutomaticReconnect()
      .build();

    connection.onreconnecting(() => setConnectionStatus('connecting'));
    connection.onreconnected(() => setConnectionStatus('connected'));
    connection.onclose(() => {
      setConnectionStatus('disconnected');
      setIsConnected(false);
    });

    connection.start()
      .then(() => {
        setIsConnected(true);
        setConnectionStatus('connected');
        console.log('SignalR connected successfully. UserID:', user?.id);
      })
      .catch(err => {
        console.error('SignalR Connection Error: ', err);
        setConnectionStatus('error');
      });

    connection.on("ReceiveNotification", (notification: any) => {
      console.log('Hub: New notification received (Raw):', notification);
      
      // Ensure we handle both casing if needed, but camelCase should work now
      const n: Notification = {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        link: notification.link,
        isRead: notification.isRead || false,
        createdAt: notification.createdAt || new Date().toISOString()
      };

      setNotifications(prev => [n, ...prev.slice(0, 19)]);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      connection.stop();
    };
  }, [isAuthenticated, user?.id]);

  return (
    <NotificationContext.Provider value={{ 
      isConnected, 
      connectionStatus,
      notifications, 
      unreadCount, 
      fetchNotifications, 
      markAsRead, 
      markAllAsRead 
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

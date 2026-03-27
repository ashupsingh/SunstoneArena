import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { setAuthToken } from '../config/api';
import { apiClient } from '../config/api';
import { useRouter, useSegments } from 'expo-router';
import Constants from 'expo-constants';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'superadmin';
  isApproved: boolean;
  department?: { _id: string; name: string; code: string } | string;
  departmentName?: string;
  enrollmentNumber?: string;
  phoneNumber?: string;
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (token: string, userData: User) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pushToken, setPushToken] = useState<string | null>(null);
  
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Load token on startup
    const loadStorageData = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('token');
        const storedUser = await SecureStore.getItemAsync('user');
        
        if (storedToken && storedUser) {
          const u = JSON.parse(storedUser);
          setSessionToken(storedToken);
          setUser(u);
          setAuthToken(storedToken);
        }
      } catch (error) {
        console.error('Failed to load auth state', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadStorageData();
  }, []);

  // Protect routes natively
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    if (!token) {
      // If no token and not in auth group, redirect to welcome
      if (!inAuthGroup) {
        router.replace('/(auth)/welcome');
      }
    } else if (user) {
      if (!user.isApproved) {
        // Teacher pending approval
        if (segments[0] !== 'pending') {
          router.replace('/pending');
        }
      } else {
        // Logged in & approved. If in auth group, go to tabs.
        if (inAuthGroup) {
          router.replace('/(tabs)');
        }
      }
    }
  }, [token, user, segments, isLoading]);

  useEffect(() => {
    const registerPushToken = async () => {
      if (!token || !user?.isApproved) return;

      // Expo Go does not support remote push notifications on SDK 53+.
      if (Constants.appOwnership === 'expo') return;

      try {
        const Notifications = await import('expo-notifications');
        const Device = await import('expo-device');

        if (!Device.isDevice) return;

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') return;

        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ||
          Constants.easConfig?.projectId;

        if (!projectId) {
          console.log('Push registration skipped: missing EAS projectId.');
          return;
        }

        const result = await Notifications.getExpoPushTokenAsync({ projectId });
        const tokenValue = result.data;
        setPushToken(tokenValue);

        try {
          await apiClient.post('/notifications/push-token', { token: tokenValue });
        } catch (error) {
          console.log('Push token registration failed', error);
        }
      } catch (error) {
        console.log('Push registration skipped:', error);
      }
    };

    registerPushToken();
  }, [token, user?._id, user?.isApproved]);

  const signIn = async (newToken: string, userData: User) => {
    setSessionToken(newToken);
    setUser(userData);
    setAuthToken(newToken);
    await SecureStore.setItemAsync('token', newToken);
    await SecureStore.setItemAsync('user', JSON.stringify(userData));
  };

  const signOut = async () => {
    if (token && pushToken) {
      try {
        await apiClient.delete('/notifications/push-token', { data: { token: pushToken } });
      } catch (_error) {
        // no-op
      }
    }

    setSessionToken(null);
    setUser(null);
    setPushToken(null);
    setAuthToken(null);
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    const merged = { ...user, ...updates };
    setUser(merged);
    await SecureStore.setItemAsync('user', JSON.stringify(merged));
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

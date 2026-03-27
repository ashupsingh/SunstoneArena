import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type Theme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  primaryBg: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  errorBg: string;
  success: string;
  successBg: string;
}

export const lightColors: ThemeColors = {
  background: '#ffffff',
  surface: '#f8fafc',
  primary: '#4f46e5',
  primaryBg: '#eef2ff',
  text: '#0f172a',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  error: '#ef4444',
  errorBg: '#fef2f2',
  success: '#10b981',
  successBg: '#ecfdf5',
};

export const darkColors: ThemeColors = {
  background: '#0f172a',
  surface: '#1e293b',
  primary: '#818cf8',
  primaryBg: '#3730a3',
  text: '#ffffff',
  textSecondary: '#94a3b8',
  border: '#334155',
  error: '#f87171',
  errorBg: '#7f1d1d',
  success: '#34d399',
  successBg: '#064e3b',
};

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemTheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>(systemTheme === 'dark' ? 'dark' : 'light');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync('user-theme').then((savedTheme) => {
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemeState(savedTheme);
      }
      setIsReady(true);
    });
  }, []);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    await SecureStore.setItemAsync('user-theme', newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const colors = theme === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

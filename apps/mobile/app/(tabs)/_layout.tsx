import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 74,
          paddingTop: 10,
          paddingBottom: 10,
          borderTopWidth: 1,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        sceneStyle: {
          backgroundColor: colors.background,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-clear" size={size} color={color} />,
        }}
      />
      
      {/* Student Only Tab */}
      <Tabs.Screen
        name="campus"
        options={{
          title: 'Campus Live',
          href: null,
          tabBarIcon: ({ color, size }) => <Ionicons name="navigate" size={size} color={color} />,
        }}
      />

      {/* Teacher Only Tab */}
      <Tabs.Screen
        name="students"
        options={{
          title: 'Students',
          href: null,
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="two"
        options={{
          title: 'Transport',
          href: null,
          tabBarIcon: ({ color, size }) => <Ionicons name="bus" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

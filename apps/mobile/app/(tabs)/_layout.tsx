import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function TabLayout() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const isTeacher = user?.role === 'teacher';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
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
          href: '/(tabs)/campus',
          tabBarIcon: ({ color, size }) => <Ionicons name="navigate" size={size} color={color} />,
        }}
      />

      {/* Teacher Only Tab */}
      <Tabs.Screen
        name="students"
        options={{
          title: 'Students',
          href: isTeacher ? '/(tabs)/students' : (null as any),
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
          tabBarIcon: ({ color, size }) => <Ionicons name="bus" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

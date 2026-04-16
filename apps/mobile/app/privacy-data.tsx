import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

export default function PrivacyDataScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const privacyPoints = [
    {
      icon: 'lock-closed-outline' as const,
      title: 'Account protection',
      body: 'Your session stays signed in securely on your device and can be cleared anytime by logging out from Profile.',
    },
    {
      icon: 'camera-outline' as const,
      title: 'Campus live and smart features',
      body: 'Demo crowd insights and room controls are shown for experience testing. Live hardware integrations can be enabled later with department approval.',
    },
    {
      icon: 'document-text-outline' as const,
      title: 'Notice and event data',
      body: 'Event registrations, saved events, and recent notices are used only to improve your campus flow inside the app.',
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
        <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
        <Text style={[styles.backText, { color: colors.textSecondary }]}>Back</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.text }]}>Privacy & Data</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>A clear look at what the app keeps, what it shows, and how campus features can expand later.</Text>

      {privacyPoints.map((item) => (
        <View key={item.title} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primaryBg }]}>
            <Ionicons name={item.icon} size={20} color={colors.primary} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.cardBody, { color: colors.textSecondary }]}>{item.body}</Text>
        </View>
      ))}

      <View style={[styles.highlightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.highlightTitle, { color: colors.text }]}>Version 2.0 promise</Text>
        <Text style={[styles.highlightBody, { color: colors.textSecondary }]}>Saved events stay local to your device for now, while attendance, notices, and approved profile updates continue using your campus account services.</Text>
      </View>

      <Text style={[styles.footerText, { color: colors.textSecondary }]}>Made with love ❤️ by SyntaxError Team</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 54, paddingBottom: 120 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  backText: { fontSize: 14, fontWeight: '600', marginLeft: 4 },
  title: { fontSize: 34, fontWeight: '800', marginBottom: 10 },
  subtitle: { fontSize: 16, lineHeight: 24, marginBottom: 24 },
  card: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  cardBody: { fontSize: 15, lineHeight: 22 },
  highlightCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    marginTop: 8,
  },
  highlightTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  highlightBody: { fontSize: 15, lineHeight: 22 },
  footerText: { textAlign: 'center', marginTop: 20, fontSize: 13, fontWeight: '600' },
});

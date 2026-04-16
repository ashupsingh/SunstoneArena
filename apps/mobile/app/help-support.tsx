import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

export default function HelpSupportScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const supportCards = [
    {
      icon: 'chatbubbles-outline' as const,
      title: 'Need a quick fix?',
      body: 'Use the in-app help desk for login issues, event registration errors, attendance mismatch, and dashboard bugs.',
    },
    {
      icon: 'mail-open-outline' as const,
      title: 'Response timeline',
      body: 'Student issues are usually reviewed within the same working day. Teacher and admin requests are prioritized during campus hours.',
    },
    {
      icon: 'construct-outline' as const,
      title: 'What we support',
      body: 'Profile updates, notices, event problems, attendance sync, transport information, and smart-campus access guidance.',
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
        <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
        <Text style={[styles.backText, { color: colors.textSecondary }]}>Back</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.text }]}>Help & Support</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Everything students and teachers need when something in the app needs attention.</Text>

      {supportCards.map((item) => (
        <View key={item.title} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primaryBg }]}>
            <Ionicons name={item.icon} size={20} color={colors.primary} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.cardBody, { color: colors.textSecondary }]}>{item.body}</Text>
        </View>
      ))}

      <View style={[styles.highlightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.highlightTitle, { color: colors.text }]}>Support hours</Text>
        <Text style={[styles.highlightBody, { color: colors.textSecondary }]}>Monday to Saturday, 9:00 AM to 5:30 PM. Emergency issue reporting remains open after hours for campus-wide outages.</Text>
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

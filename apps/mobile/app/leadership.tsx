import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

const leadershipRoster = [
  { id: 'hod-cse', name: 'Dr. A. Sharma', role: 'HOD • CSE', room: 'A Block Office', officeHours: [{ day: 1, start: 10, end: 13 }, { day: 3, start: 11, end: 14 }], awayHours: [{ day: 3, start: 12, end: 12.5 }] },
  { id: 'hod-ece', name: 'Dr. N. Deka', role: 'HOD • ECE', room: 'B Block Office', officeHours: [{ day: 2, start: 9.5, end: 12.5 }, { day: 4, start: 10, end: 13 }], awayHours: [] },
  { id: 'dean-acad', name: 'Prof. R. Goswami', role: 'Dean • Academics', room: 'Admin Wing', officeHours: [{ day: 1, start: 14, end: 17 }, { day: 4, start: 14, end: 16.5 }], awayHours: [{ day: 4, start: 15, end: 15.5 }] },
  { id: 'dean-student', name: 'Prof. S. Kalita', role: 'Dean • Student Affairs', room: 'Admin Wing', officeHours: [{ day: 2, start: 13, end: 16.5 }, { day: 5, start: 11, end: 14 }], awayHours: [] },
];

const getLeadershipStatus = (entry: (typeof leadershipRoster)[number], now: Date) => {
  const day = now.getDay();
  const hour = now.getHours() + now.getMinutes() / 60;
  const activeSlot = entry.officeHours.find((slot) => slot.day === day && hour >= slot.start && hour <= slot.end);
  const awaySlot = entry.awayHours.find((slot) => slot.day === day && hour >= slot.start && hour <= slot.end);

  if (awaySlot) {
    return { status: 'Away', detail: `Expected back by ${formatHour(awaySlot.end)}`, color: '#dc2626', bg: '#fee2e2' };
  }

  if (activeSlot) {
    return { status: 'Available', detail: `Available until ${formatHour(activeSlot.end)}`, color: '#15803d', bg: '#dcfce7' };
  }

  const nextSlot = entry.officeHours.find((slot) => slot.day === day && hour < slot.start) || entry.officeHours[0];
  return { status: 'Offline', detail: `Next office slot ${weekdayLabel(nextSlot.day)} • ${formatHour(nextSlot.start)}`, color: '#475569', bg: '#e2e8f0' };
};

const weekdayLabel = (day: number) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day] || 'Day';

const formatHour = (value: number) => {
  const hour = Math.floor(value);
  const minutes = Math.round((value - hour) * 60);
  const date = new Date();
  date.setHours(hour, minutes, 0, 0);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

export default function LeadershipScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((value) => value + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const entries = useMemo(() => {
    const now = new Date();
    return leadershipRoster.map((entry) => ({ ...entry, current: getLeadershipStatus(entry, now) }));
  }, [tick]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Leadership Desk</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>HODs and Deans</Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>Availability updates are calculated automatically from each office slot and away window.</Text>
        </View>

        {entries.map((entry) => (
          <View key={entry.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHead}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: colors.text }]}>{entry.name}</Text>
                <Text style={[styles.role, { color: colors.textSecondary }]}>{entry.role}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: entry.current.bg }]}>
                <Text style={[styles.statusText, { color: entry.current.color }]}>{entry.current.status}</Text>
              </View>
            </View>
            <Text style={[styles.detail, { color: colors.textSecondary }]}>Office: {entry.room}</Text>
            <Text style={[styles.detail, { color: colors.textSecondary }]}>{entry.current.detail}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    paddingHorizontal: 18,
    paddingTop: 56,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800' },
  content: { paddingHorizontal: 18, paddingBottom: 26 },
  heroCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
  },
  heroTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  heroSub: { fontSize: 14, lineHeight: 20 },
  card: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 },
  name: { fontSize: 18, fontWeight: '800' },
  role: { fontSize: 13, marginTop: 4 },
  detail: { fontSize: 13, marginTop: 4 },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { fontSize: 11, fontWeight: '800' },
});
